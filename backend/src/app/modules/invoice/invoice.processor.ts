import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { Repository } from 'typeorm';
import { Invoice } from './invoice.entity';
import { TaxPayer } from 'src/app/modules/tax-payer/tax-payer.entity';
import { InvoiceStatus } from 'src/core/enums/invoice-status';
import { InvoiceSubtype } from 'src/core/enums/invoice-subtype';
import { ZatcaEnvironment } from 'src/core/enums/zatca-environment';
import { SidecarClient } from 'src/app/modules/sidecar/sidecar.client';
import { ZatcaClientFactory } from 'src/app/modules/zatca/zatca-client';
import { decryptSecret } from 'src/core/security/encrypt-util';
import { INVOICE_QUEUE } from 'src/app/modules/queue/queue.module';
import { INVOICE_JOB } from './invoice.service';
import { buildInvoiceXml } from './invoice-builder';
import { toZatcaInvoiceParts } from './invoice-choices';
import { CreateInvoiceDTO } from './dtos/invoice.dto';
import { formatOnboardError } from 'src/app/modules/onboard/onboard-error';

const DEFAULT_PIH =
  'NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjcyOWQ3M2EyN2ZiNTdlOQ==';

@Processor(INVOICE_QUEUE)
export class InvoiceProcessor extends WorkerHost {
  private readonly logger = new Logger('InvoiceProcessor');

  constructor(
    @InjectRepository(Invoice)
    private readonly invoices: Repository<Invoice>,
    @InjectRepository(TaxPayer)
    private readonly taxPayers: Repository<TaxPayer>,
    private readonly sidecar: SidecarClient,
    private readonly zatcaFactory: ZatcaClientFactory,
  ) {
    super();
  }

  async process(job: Job<{ invoiceId: number }>): Promise<void> {
    if (job.name !== INVOICE_JOB) {
      return;
    }
    const invoice = await this.invoices.findOne({
      where: { id: job.data.invoiceId },
    });
    if (!invoice) {
      return;
    }
    const taxPayer = await this.taxPayers.findOne({
      where: { id: invoice.taxPayerId },
    });
    if (!taxPayer?.productionCsid || !taxPayer.productionCsidSecret || !taxPayer.privateKeyEncrypted) {
      await this.fail(invoice, 'pcsid_required', 'Tax payer has no production CSID');
      return;
    }

    const icv = String(Number(taxPayer.icv || '0') + 1);
    const pih = taxPayer.lastPih || DEFAULT_PIH;
    const payload = invoice.payload as unknown as CreateInvoiceDTO;
    let originalDocumentNumber: string | null = null;
    if (invoice.originalInvoiceId) {
      const original = await this.invoices.findOne({
        where: { id: invoice.originalInvoiceId },
      });
      originalDocumentNumber = original?.documentNumber ?? null;
    }

    const zatca = toZatcaInvoiceParts(payload);
    try {
      const xml = buildInvoiceXml({
        documentNumber: invoice.documentNumber,
        uuid: invoice.uuid,
        issueDate: payload.issueDate,
        issueTime: payload.issueTime,
        subtype: invoice.subtype,
        typeCode: invoice.typeCode,
        ksa2: invoice.ksa2Name || '0100000',
        icv,
        pih,
        currency: payload.currency,
        supplyDate: payload.supplyDate,
        paymentMeansCode: zatca.paymentMeansCode,
        instructionNote: payload.instructionNote,
        originalDocumentNumber,
        seller: taxPayer,
        buyer: zatca.buyer,
        documentDiscount: zatca.documentDiscount,
        documentCharge: zatca.documentCharge,
        lines: zatca.lines,
      });

      const env = taxPayer.zatcaEnvironment || ZatcaEnvironment.SIMULATION;
      const privateKey = decryptSecret(taxPayer.privateKeyEncrypted);
      const csid = decryptSecret(taxPayer.productionCsid);
      const secret = decryptSecret(taxPayer.productionCsidSecret);

      const signed = await this.sidecar.sign({
        environment: env,
        privateKey,
        csid,
        pih,
        invoiceXml: xml,
      });
      const validated = await this.sidecar.validate({
        environment: env,
        privateKey,
        csid,
        pih,
        invoiceXml: signed.signedInvoiceXml,
      });
      if (!validated.passed) {
        await this.fail(
          invoice,
          'sdk_not_pass',
          'SDK validate did not pass',
          xml,
          signed.signedInvoiceXml,
        );
        return;
      }

      const invReq = await this.sidecar.invoiceRequest({
        environment: env,
        invoiceXml: signed.signedInvoiceXml,
      });
      invoice.status = InvoiceStatus.SUBMITTED;
      invoice.unsignedXml = xml;
      invoice.signedXml = signed.signedInvoiceXml;
      invoice.icv = icv;
      invoice.pih = pih;
      invoice.zatcaRequest = invReq.request as unknown as Record<string, unknown>;
      await this.invoices.save(invoice);

      const client = this.zatcaFactory.create(env);
      const response =
        invoice.subtype === InvoiceSubtype.STANDARD
          ? await client.invoices.clear(invReq.request, csid, secret)
          : await client.invoices.report(invReq.request, csid, secret);

      const body = (response || {}) as {
        clearanceStatus?: string;
        reportingStatus?: string;
        clearedInvoice?: string;
        validationResults?: { errorMessages?: Array<{ code?: string; message?: string }> };
      };
      const errors = body.validationResults?.errorMessages || [];
      const accepted =
        body.clearanceStatus === 'CLEARED' || body.reportingStatus === 'REPORTED';
      if (!accepted || errors.length) {
        await this.fail(
          invoice,
          errors[0]?.code || 'zatca_rejected',
          errors[0]?.message || 'ZATCA rejected the invoice',
          xml,
          signed.signedInvoiceXml,
          body as Record<string, unknown>,
        );
        return;
      }

      invoice.status =
        invoice.subtype === InvoiceSubtype.STANDARD
          ? InvoiceStatus.CLEARED
          : InvoiceStatus.REPORTED;
      invoice.invoiceHash = invReq.request.invoiceHash;
      invoice.qrBase64 = extractQr(signed.signedInvoiceXml);
      invoice.clearedXml = body.clearedInvoice
        ? Buffer.from(body.clearedInvoice, 'base64').toString('utf8')
        : null;
      invoice.zatcaResponse = body as Record<string, unknown>;
      invoice.error = null;
      await this.invoices.save(invoice);

      taxPayer.icv = icv;
      taxPayer.lastPih = invReq.request.invoiceHash;
      await this.taxPayers.save(taxPayer);
    } catch (err) {
      const detail = formatOnboardError(err);
      this.logger.error(`Invoice ${invoice.id} failed: ${detail}`);
      await this.fail(invoice, 'invoice_failed', detail);
    }
  }

  private async fail(
    invoice: Invoice,
    code: string,
    message: string,
    unsignedXml?: string,
    signedXml?: string,
    zatcaResponse?: Record<string, unknown>,
  ): Promise<void> {
    invoice.status = InvoiceStatus.REJECTED;
    invoice.error = { type: 'zatca_error', code, message, zatca_code: code };
    if (unsignedXml) {
      invoice.unsignedXml = unsignedXml;
    }
    if (signedXml) {
      invoice.signedXml = signedXml;
    }
    if (zatcaResponse) {
      invoice.zatcaResponse = zatcaResponse;
    }
    await this.invoices.save(invoice);
  }
}

function extractQr(xml: string): string | null {
  const match = xml.match(
    /<cbc:ID>\s*QR\s*<\/cbc:ID>[\s\S]*?<cbc:EmbeddedDocumentBinaryObject[^>]*>([^<]*)<\/cbc:EmbeddedDocumentBinaryObject>/,
  );
  return match?.[1] ?? null;
}
