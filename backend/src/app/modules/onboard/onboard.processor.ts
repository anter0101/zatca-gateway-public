import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { DataSource, Repository } from 'typeorm';
import { TaxPayer } from 'src/app/modules/tax-payer/tax-payer.entity';
import { OnboardStatus } from 'src/core/enums/onboard-status';
import { OnboardStep } from 'src/core/enums/onboard-step';
import { ZatcaEnvironment } from 'src/core/enums/zatca-environment';
import { SidecarClient } from 'src/app/modules/sidecar/sidecar.client';
import { ZatcaClientFactory } from 'src/app/modules/zatca/zatca-client';
import {
  decryptSecret,
  encryptSecret,
} from 'src/core/security/encrypt-util';
import { buildCsrIdentity, csrToBase64 } from './csr-builder';
import { listSampleKeys, stampSample } from './sample-stamper';
import { ONBOARD_QUEUE } from 'src/app/modules/queue/queue.module';
import { RENEW_JOB } from './onboard.service';

type OnboardJobData = {
  taxPayerId: number;
  otp: string;
  mode: 'onboard' | 'renew';
};

@Processor(ONBOARD_QUEUE)
export class OnboardProcessor extends WorkerHost {
  private readonly logger = new Logger('OnboardProcessor');

  constructor(
    @InjectRepository(TaxPayer)
    private readonly taxPayerRepository: Repository<TaxPayer>,
    private readonly dataSource: DataSource,
    private readonly sidecar: SidecarClient,
    private readonly zatcaFactory: ZatcaClientFactory,
  ) {
    super();
  }

  async process(job: Job<OnboardJobData>): Promise<void> {
    const { taxPayerId, mode } = job.data;
    let otp: string | undefined = job.data.otp;

    try {
      if (job.name === RENEW_JOB || mode === 'renew') {
        await this.runRenew(taxPayerId, otp!);
      } else {
        await this.runOnboard(taxPayerId, otp!);
      }
    } catch (err: any) {
      this.logger.error(
        `Onboard failed taxPayer=${taxPayerId}: ${err?.message || err}`,
      );
      await this.markFailed(taxPayerId, err?.message || 'onboard_failed');
      throw err;
    } finally {
      otp = undefined;
      job.data.otp = '';
    }
  }

  private async runOnboard(taxPayerId: number, otp: string): Promise<void> {
    await this.patch(taxPayerId, (tp) => {
      tp.onboardStatus = OnboardStatus.RUNNING;
      tp.onboardError = null;
    });

    const env = await this.envOf(taxPayerId);
    const client = this.zatcaFactory.create(env);

    let taxPayer = await this.load(taxPayerId);
    if (!taxPayer.complianceCsid) {
      await this.setStep(taxPayerId, OnboardStep.CSID, 10);
      taxPayer = await this.load(taxPayerId);
      const csid = await client.onboarding.complianceCSID(
        csrToBase64(taxPayer.csrPem!),
        otp,
      );
      otp = '';

      await this.patch(taxPayerId, (tp) => {
        tp.complianceCsid = encryptSecret(csid.binarySecurityToken);
        tp.complianceCsidSecret = encryptSecret(csid.secret);
        tp.complianceRequestId = String(csid.requestID);
        tp.onboardProgress = 25;
      });
    }

    await this.runComplianceSamples(taxPayerId);

    await this.setStep(taxPayerId, OnboardStep.PCSID, 85);
    taxPayer = await this.load(taxPayerId);
    const pcsid = await client.onboarding.productionCSID(
      taxPayer.complianceRequestId!,
      decryptSecret(taxPayer.complianceCsid!),
      decryptSecret(taxPayer.complianceCsidSecret!),
    );

    await this.patch(taxPayerId, (tp) => {
      tp.productionCsid = encryptSecret(pcsid.binarySecurityToken);
      tp.productionCsidSecret = encryptSecret(pcsid.secret);
      tp.onboardStatus = OnboardStatus.ONBOARDED;
      tp.onboardStep = OnboardStep.DONE;
      tp.onboardProgress = 100;
      tp.onboardError = null;
    });
  }

  private async runRenew(taxPayerId: number, otp: string): Promise<void> {
    await this.patch(taxPayerId, (tp) => {
      tp.onboardStatus = OnboardStatus.RUNNING;
      tp.onboardError = null;
    });

    const env = await this.envOf(taxPayerId);
    const client = this.zatcaFactory.create(env);

    await this.setStep(taxPayerId, OnboardStep.CSR, 5);
    let taxPayer = await this.load(taxPayerId);
    const identity = buildCsrIdentity(taxPayer, env);
    const csrResult = await this.sidecar.csr(env, identity.properties);

    const oldPcsid = decryptSecret(taxPayer.productionCsid!);
    const oldSecret = decryptSecret(taxPayer.productionCsidSecret!);

    await this.patch(taxPayerId, (tp) => {
      tp.csrPem = csrResult.csr;
      tp.privateKeyEncrypted = encryptSecret(csrResult.privateKey);
      tp.csrConfig = identity.config;
      tp.complianceCsid = null;
      tp.complianceCsidSecret = null;
      tp.complianceRequestId = null;
      tp.onboardComplianceDone = 0;
    });

    await this.setStep(taxPayerId, OnboardStep.CSID, 15);
    const renew = await client.onboarding.renewProductionCSID(
      csrToBase64(csrResult.csr),
      otp,
      oldPcsid,
      oldSecret,
    );
    otp = '';

    const csid = renew.data;
    await this.patch(taxPayerId, (tp) => {
      tp.complianceCsid = encryptSecret(csid.binarySecurityToken);
      tp.complianceCsidSecret = encryptSecret(csid.secret);
      tp.complianceRequestId = String(csid.requestID);
      tp.onboardProgress = 30;
    });

    await this.runComplianceSamples(taxPayerId);

    await this.setStep(taxPayerId, OnboardStep.PCSID, 90);
    taxPayer = await this.load(taxPayerId);
    const pcsid = await client.onboarding.productionCSID(
      taxPayer.complianceRequestId!,
      oldPcsid,
      oldSecret,
    );

    await this.patch(taxPayerId, (tp) => {
      tp.productionCsid = encryptSecret(pcsid.binarySecurityToken);
      tp.productionCsidSecret = encryptSecret(pcsid.secret);
      tp.onboardStatus = OnboardStatus.ONBOARDED;
      tp.onboardStep = OnboardStep.DONE;
      tp.onboardProgress = 100;
      tp.onboardError = null;
    });
  }

  private async runComplianceSamples(taxPayerId: number): Promise<void> {
    await this.setStep(taxPayerId, OnboardStep.COMPLIANCE, 40);
    let taxPayer = await this.load(taxPayerId);
    const env = taxPayer.zatcaEnvironment || ZatcaEnvironment.SIMULATION;
    const client = this.zatcaFactory.create(env);
    const keys = listSampleKeys(taxPayer.invoiceType);
    const total = keys.length;
    const already = taxPayer.onboardComplianceDone ?? 0;
    const defaultPih =
      'NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjcyOWQ3M2EyN2ZiNTdlOQ==';

    const privateKey = decryptSecret(taxPayer.privateKeyEncrypted!);
    const csid = decryptSecret(taxPayer.complianceCsid!);
    const csidSecret = decryptSecret(taxPayer.complianceCsidSecret!);

    for (let i = already; i < keys.length; i++) {
      taxPayer = await this.load(taxPayerId);
      const icv = String(Number(taxPayer.icv || '0') + 1);
      const pih = taxPayer.lastPih || defaultPih;
      const stamped = stampSample(keys[i], taxPayer, icv, pih);

      const signed = await this.sidecar.sign({
        environment: env,
        privateKey,
        csid,
        pih,
        invoiceXml: stamped.xml,
      });

      const validated = await this.sidecar.validate({
        environment: env,
        privateKey,
        csid,
        pih,
        invoiceXml: signed.signedInvoiceXml,
      });

      if (!validated.passed) {
        throw new Error(
          `SDK validate NOT PASS on sample ${keys[i]}`.slice(0, 200),
        );
      }

      const invReq = await this.sidecar.invoiceRequest({
        environment: env,
        invoiceXml: signed.signedInvoiceXml,
      });

      await client.onboarding.complianceChecks(
        invReq.request,
        csid,
        csidSecret,
      );

      await this.patch(taxPayerId, (tp) => {
        tp.icv = icv;
        tp.lastPih = invReq.request.invoiceHash;
        tp.onboardComplianceDone = i + 1;
        tp.onboardProgress = 40 + Math.floor(((i + 1) / total) * 40);
      });
    }
  }

  private async load(id: number): Promise<TaxPayer> {
    const tp = await this.taxPayerRepository.findOne({ where: { id } });
    if (!tp) {
      throw new Error(`tax_payer ${id} not found`);
    }
    return tp;
  }

  private async envOf(id: number): Promise<ZatcaEnvironment> {
    const tp = await this.load(id);
    return tp.zatcaEnvironment || ZatcaEnvironment.SIMULATION;
  }

  private async setStep(
    id: number,
    step: OnboardStep,
    progress: number,
  ): Promise<void> {
    await this.patch(id, (tp) => {
      tp.onboardStep = step;
      tp.onboardProgress = progress;
      tp.onboardStatus = OnboardStatus.RUNNING;
    });
  }

  private async markFailed(id: number, message: string): Promise<void> {
    try {
      await this.patch(id, (tp) => {
        tp.onboardStatus = OnboardStatus.FAILED;
        tp.onboardError = String(message).slice(0, 2000);
      });
    } catch {
      // ignore
    }
  }

  private async patch(
    taxPayerId: number,
    mutate: (tp: TaxPayer) => void,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(TaxPayer);
      const tp = await repo
        .createQueryBuilder('tp')
        .setLock('pessimistic_write')
        .where('tp.id = :id', { id: taxPayerId })
        .getOne();
      if (!tp) {
        throw new Error(`tax_payer ${taxPayerId} not found`);
      }
      mutate(tp);
      await repo.save(tp);
    });
  }
}
