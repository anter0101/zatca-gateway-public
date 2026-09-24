import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Invoice } from './invoice.entity';
import { TaxPayer } from 'src/app/modules/tax-payer/tax-payer.entity';
import { TaxPayerService } from 'src/app/modules/tax-payer/tax-payer.service';
import { ApiErrorException } from 'src/core/filters/api-exception.filter';
import { InvoiceStatus } from 'src/core/enums/invoice-status';
import { InvoiceDocumentType } from 'src/core/enums/invoice-document-type';
import { TaxCategory } from 'src/core/enums/tax-category-code';
import { TaxPayerInvoiceType } from 'src/core/enums/tax-payer-invoice-type';
import { OnboardStatus } from 'src/core/enums/onboard-status';
import { InvoiceSubtype } from 'src/core/enums/invoice-subtype';
import { INVOICE_QUEUE } from 'src/app/modules/queue/queue.module';
import {
  documentTypeToCode,
  ksa2Name,
  normalizeDocumentType,
} from './invoice-choices';
import { CreateInvoiceDTO, InvoiceViewDTO } from './dtos/invoice.dto';
import { ApiKey } from 'src/app/modules/api-key/api-key.entity';

export const INVOICE_JOB = 'submit';

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger('InvoiceService');

  constructor(
    @InjectRepository(Invoice)
    private readonly invoices: Repository<Invoice>,
    @InjectRepository(TaxPayer)
    private readonly taxPayerRows: Repository<TaxPayer>,
    private readonly taxPayers: TaxPayerService,
    @InjectQueue(INVOICE_QUEUE) private readonly queue: Queue,
  ) {}

  async create(
    vendorId: number,
    taxPayerId: number,
    dto: CreateInvoiceDTO,
    idempotencyKey: string,
    apiKey?: ApiKey | null,
  ): Promise<InvoiceViewDTO> {
    if (!idempotencyKey?.trim()) {
      throw new ApiErrorException(
        HttpStatus.BAD_REQUEST,
        'invalid_request',
        'idempotency_key_required',
        'Idempotency-Key header is required',
      );
    }
    const key = idempotencyKey.trim();
    const existing = await this.invoices.findOne({
      where: { vendorId, taxPayerId, idempotencyKey: key },
    });
    if (existing) {
      return this.toView(existing);
    }

    const taxPayer = await this.taxPayers.findOneOrFail(vendorId, taxPayerId);
    this.assertReady(taxPayer, dto);

    const normalized = normalizeDocumentType(dto.type);
    if (
      normalized !== InvoiceDocumentType.INVOICE &&
      (!dto.originalInvoiceId || !dto.instructionNote)
    ) {
      throw new ApiErrorException(
        HttpStatus.BAD_REQUEST,
        'invalid_request',
        'credit_debit_reference_required',
        'Credit and debit notes require originalInvoiceId and instructionNote',
      );
    }
    if (dto.originalInvoiceId) {
      const original = await this.invoices.findOne({
        where: { id: dto.originalInvoiceId, vendorId, taxPayerId: taxPayer.id },
      });
      if (!original) {
        throw new ApiErrorException(
          HttpStatus.NOT_FOUND,
          'not_found',
          'original_invoice_not_found',
          'Original invoice was not found for this tax payer',
        );
      }
    }
    this.assertExemptions(dto);

    const documentNumber = await this.nextDocumentNumber(taxPayer.id);
    const invoice = this.invoices.create({
      vendorId,
      taxPayerId: taxPayer.id,
      apiKeyId: apiKey?.id ?? null,
      uuid: randomUUID(),
      documentNumber,
      idempotencyKey: key,
      typeCode: documentTypeToCode(dto.type),
      subtype: dto.subtype,
      ksa2Name: ksa2Name(dto.subtype),
      status: InvoiceStatus.QUEUED,
      originalInvoiceId: dto.originalInvoiceId ?? null,
      payload: dto as unknown as Record<string, unknown>,
      jobId: `invoice:${vendorId}:${key}`,
      createdAt: new Date(),
    });
    const saved = await this.invoices.save(invoice);
    await this.queue.add(
      INVOICE_JOB,
      { invoiceId: saved.id },
      { jobId: saved.jobId!, removeOnComplete: 100, removeOnFail: 50, attempts: 1 },
    );
    return this.toView(saved);
  }

  async getOne(
    vendorId: number,
    taxPayerId: number,
    id: number,
  ): Promise<InvoiceViewDTO> {
    const invoice = await this.invoices.findOne({
      where: { id, vendorId, taxPayerId },
    });
    if (!invoice) {
      throw new ApiErrorException(
        HttpStatus.NOT_FOUND,
        'not_found',
        'invoice_not_found',
        'Invoice not found',
      );
    }
    return this.toView(invoice);
  }

  async list(
    vendorId: number,
    taxPayerId: number,
    filter: { status?: InvoiceStatus; subtype?: InvoiceSubtype },
  ): Promise<InvoiceViewDTO[]> {
    const rows = await this.invoices.find({
      where: {
        vendorId,
        taxPayerId,
        ...(filter.status ? { status: filter.status } : {}),
        ...(filter.subtype ? { subtype: filter.subtype } : {}),
      },
      order: { id: 'DESC' },
      take: 50,
    });
    return rows.map((row) => this.toView(row));
  }

  toView(invoice: Invoice): InvoiceViewDTO {
    const type =
      invoice.typeCode === '381'
        ? InvoiceDocumentType.CREDIT
        : invoice.typeCode === '383'
          ? InvoiceDocumentType.DEBIT
          : InvoiceDocumentType.INVOICE;
    return {
      id: invoice.id,
      taxPayerId: invoice.taxPayerId,
      documentNumber: invoice.documentNumber,
      subtype: invoice.subtype,
      type,
      typeCode: invoice.typeCode,
      status: invoice.status,
      uuid: invoice.uuid,
      invoiceHash: invoice.invoiceHash ?? null,
      qr: invoice.qrBase64 ?? null,
      error: invoice.error ?? null,
    };
  }

  private assertReady(taxPayer: TaxPayer, dto: CreateInvoiceDTO): void {
    if (taxPayer.onboardStatus !== OnboardStatus.ONBOARDED || !taxPayer.productionCsid) {
      throw new ApiErrorException(
        HttpStatus.CONFLICT,
        'conflict',
        'taxpayer_not_onboarded',
        'Tax payer must be onboarded before live invoices',
      );
    }
    const allowed = taxPayer.invoiceType || TaxPayerInvoiceType.BOTH;
    if (
      allowed !== TaxPayerInvoiceType.BOTH &&
      allowed !== (dto.subtype as unknown as TaxPayerInvoiceType)
    ) {
      throw new ApiErrorException(
        HttpStatus.BAD_REQUEST,
        'invalid_request',
        'taxpayer_invoice_type',
        'Tax payer invoice type does not allow this subtype',
      );
    }
    if (dto.subtype === InvoiceSubtype.STANDARD && !dto.buyer?.name) {
      throw new ApiErrorException(
        HttpStatus.BAD_REQUEST,
        'invalid_request',
        'buyer_required',
        'Standard invoices require a buyer',
      );
    }
    if (
      !taxPayer.streetName ||
      !taxPayer.buildingNumber ||
      !taxPayer.city ||
      !taxPayer.postalZone
    ) {
      throw new ApiErrorException(
        HttpStatus.CONFLICT,
        'conflict',
        'seller_address_required',
        'Tax payer street, building, city, and postal code are required',
      );
    }
  }

  private async nextDocumentNumber(taxPayerId: number): Promise<string> {
    const rows: Array<{ document_seq: string; vat_number: string }> =
      await this.taxPayerRows.query(
        `UPDATE tax_payers SET document_seq = document_seq + 1 WHERE id = $1 RETURNING document_seq, vat_number`,
        [taxPayerId],
      );
    const row = rows[0];
    const seq = String(row?.document_seq ?? '1').padStart(6, '0');
    return `${row?.vat_number ?? taxPayerId}-${seq}`;
  }

  private assertExemptions(dto: CreateInvoiceDTO): void {
    const needs = (category: string, code?: string, reason?: string) => {
      if (category === TaxCategory.STANDARD) {
        return;
      }
      if (!code || !reason) {
        throw new ApiErrorException(
          HttpStatus.BAD_REQUEST,
          'invalid_request',
          'exemption_required',
          `Tax category ${category} requires exemptionCode and exemptionReason`,
        );
      }
    };
    for (const line of dto.lines) {
      needs(line.taxCategory, line.exemptionCode, line.exemptionReason);
    }
    if (dto.documentDiscount) {
      needs(
        dto.documentDiscount.taxCategory,
        dto.documentDiscount.exemptionCode,
        dto.documentDiscount.exemptionReason,
      );
    }
    if (dto.documentCharge) {
      needs(
        dto.documentCharge.taxCategory,
        dto.documentCharge.exemptionCode,
        dto.documentCharge.exemptionReason,
      );
    }
  }
}
