import {
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { DataSource, Repository } from 'typeorm';
import { TaxPayer } from 'src/app/modules/tax-payer/tax-payer.entity';
import { SoftwareVendor } from 'src/app/modules/vendor/software-vendor.entity';
import { ApiErrorException } from 'src/core/filters/api-exception.filter';
import { SidecarClient } from 'src/app/modules/sidecar/sidecar.client';
import { encryptSecret } from 'src/core/security/encrypt-util';
import { ZatcaEnvironment } from 'src/core/enums/zatca-environment';
import { OnboardStatus } from 'src/core/enums/onboard-status';
import { OnboardStep } from 'src/core/enums/onboard-step';
import { UserRole } from 'src/core/enums/user-role';
import { ApiKey } from 'src/app/modules/api-key/api-key.entity';
import { buildCsrIdentity } from './csr-builder';
import { complianceTotal } from './sample-stamper';
import { ONBOARD_QUEUE } from 'src/app/modules/queue/queue.module';
import {
  CsrCreatedDTO,
  OnboardProgressDTO,
} from './dtos/onboard.dto';
import { parseStoredOnboardError } from './onboard-error';

export const ONBOARD_JOB = 'run-onboard';
export const RENEW_JOB = 'run-renew';

@Injectable()
export class OnboardService {
  private readonly logger = new Logger('OnboardService');

  constructor(
    @InjectRepository(TaxPayer)
    private readonly taxPayerRepository: Repository<TaxPayer>,
    private readonly dataSource: DataSource,
    private readonly sidecar: SidecarClient,
    @InjectQueue(ONBOARD_QUEUE) private readonly onboardQueue: Queue,
  ) {}

  async assertAccess(
    taxPayerId: number,
    opts: {
      vendor?: SoftwareVendor | null;
      apiKey?: ApiKey | null;
      userRole?: UserRole | string | null;
      zatcaEnv?: ZatcaEnvironment | null;
    },
  ): Promise<TaxPayer> {
    const taxPayer = await this.taxPayerRepository.findOne({
      where: { id: taxPayerId },
    });
    if (!taxPayer) {
      throw new ApiErrorException(
        HttpStatus.NOT_FOUND,
        'not_found',
        'tax_payer_not_found',
        'Tax payer not found',
      );
    }

    const isAdmin = opts.userRole === UserRole.ADMIN;
    if (!isAdmin) {
      if (!opts.vendor || opts.vendor.id !== taxPayer.vendorId) {
        throw new ApiErrorException(
          HttpStatus.FORBIDDEN,
          'authorization_error',
          'forbidden',
          'API key does not belong to this tax payer vendor',
        );
      }
    }

    return taxPayer;
  }

  async createCsr(
    taxPayerId: number,
    access: {
      vendor?: SoftwareVendor | null;
      apiKey?: ApiKey | null;
      userRole?: UserRole | string | null;
      zatcaEnv?: ZatcaEnvironment | null;
    },
  ): Promise<CsrCreatedDTO> {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(TaxPayer);
      const locked = await repo
        .createQueryBuilder('tp')
        .setLock('pessimistic_write')
        .where('tp.id = :id', { id: taxPayerId })
        .getOne();

      if (!locked) {
        throw new ApiErrorException(
          HttpStatus.NOT_FOUND,
          'not_found',
          'tax_payer_not_found',
          'Tax payer not found',
        );
      }

      const isAdmin = access.userRole === UserRole.ADMIN;
      if (!isAdmin && access.vendor && access.vendor.id !== locked.vendorId) {
        throw new ApiErrorException(
          HttpStatus.FORBIDDEN,
          'authorization_error',
          'forbidden',
          'API key does not belong to this tax payer vendor',
        );
      }

      const environment =
        access.zatcaEnv ||
        locked.zatcaEnvironment ||
        ZatcaEnvironment.SIMULATION;

      if (
        access.zatcaEnv &&
        locked.zatcaEnvironment &&
        locked.zatcaEnvironment !== access.zatcaEnv
      ) {
        throw new ApiErrorException(
          HttpStatus.FORBIDDEN,
          'authorization_error',
          'api_key_scope',
          'API key environment does not match tax payer zatca environment',
        );
      }

      const identity = buildCsrIdentity(locked, environment);
      const result = await this.sidecar.csr(environment, identity.properties);

      locked.zatcaEnvironment = environment;
      locked.csrConfig = identity.config;
      locked.csrPem = result.csr;
      locked.privateKeyEncrypted = encryptSecret(result.privateKey);
      // New keypair invalidates any prior CSID / compliance progress.
      locked.complianceCsid = null;
      locked.complianceCsidSecret = null;
      locked.complianceRequestId = null;
      locked.productionCsid = null;
      locked.productionCsidSecret = null;
      locked.onboardComplianceDone = 0;
      locked.onboardStatus = OnboardStatus.CSR_CREATED;
      locked.onboardStep = OnboardStep.CSR;
      locked.onboardProgress = 5;
      locked.onboardError = null;
      locked.updatedAt = new Date();
      await repo.save(locked);

      return {
        taxPayerId: locked.id,
        status: OnboardStatus.CSR_CREATED,
        csr: result.csr,
        commonName: identity.commonName,
        serialNumber: identity.serialNumber,
      };
    });
  }

  toProgress(taxPayer: TaxPayer): OnboardProgressDTO {
    const total = complianceTotal(taxPayer.invoiceType);
    const { error, zatcaBody } = parseStoredOnboardError(
      taxPayer.onboardError,
    );
    return {
      taxPayerId: taxPayer.id,
      status: taxPayer.onboardStatus || OnboardStatus.IDLE,
      step: taxPayer.onboardStep || null,
      progress: taxPayer.onboardProgress ?? 0,
      complianceDone: taxPayer.onboardComplianceDone ?? 0,
      complianceTotal: total,
      error,
      zatcaBody,
    };
  }

  async getProgress(
    taxPayerId: number,
    access: {
      vendor?: SoftwareVendor | null;
      userRole?: UserRole | string | null;
    },
  ): Promise<OnboardProgressDTO> {
    const taxPayer = await this.assertAccess(taxPayerId, access);
    return this.toProgress(taxPayer);
  }

  async startOnboard(
    taxPayerId: number,
    otp: string,
    access: {
      vendor?: SoftwareVendor | null;
      apiKey?: ApiKey | null;
      userRole?: UserRole | string | null;
      zatcaEnv?: ZatcaEnvironment | null;
    },
  ): Promise<OnboardProgressDTO> {
    const taxPayer = await this.assertAccess(taxPayerId, access);

    if (!taxPayer.csrPem || !taxPayer.privateKeyEncrypted) {
      throw new ApiErrorException(
        HttpStatus.CONFLICT,
        'conflict',
        'csr_required',
        'Create CSR before starting onboard',
      );
    }

    if (
      taxPayer.onboardStatus === OnboardStatus.QUEUED ||
      taxPayer.onboardStatus === OnboardStatus.RUNNING
    ) {
      throw new ApiErrorException(
        HttpStatus.CONFLICT,
        'conflict',
        'onboard_running',
        'Onboard job already running',
      );
    }

    if (
      access.zatcaEnv &&
      taxPayer.zatcaEnvironment &&
      taxPayer.zatcaEnvironment !== access.zatcaEnv
    ) {
      throw new ApiErrorException(
        HttpStatus.FORBIDDEN,
        'authorization_error',
        'api_key_scope',
        'API key environment does not match tax payer',
      );
    }

    const jobId = `onboard-${taxPayerId}`;
    taxPayer.onboardStatus = OnboardStatus.QUEUED;
    taxPayer.onboardStep = OnboardStep.CSID;
    taxPayer.onboardProgress = 0;
    taxPayer.onboardComplianceDone = taxPayer.complianceCsid
      ? taxPayer.onboardComplianceDone ?? 0
      : 0;
    taxPayer.onboardError = null;
    taxPayer.onboardJobId = jobId;
    taxPayer.updatedAt = new Date();
    await this.taxPayerRepository.save(taxPayer);

    await this.enqueueJob(
      taxPayer,
      ONBOARD_JOB,
      { taxPayerId, otp, mode: 'onboard' as const },
      jobId,
    );

    return this.toProgress(taxPayer);
  }

  async startRenew(
    taxPayerId: number,
    otp: string,
    access: {
      vendor?: SoftwareVendor | null;
      apiKey?: ApiKey | null;
      userRole?: UserRole | string | null;
      zatcaEnv?: ZatcaEnvironment | null;
    },
  ): Promise<OnboardProgressDTO> {
    const taxPayer = await this.assertAccess(taxPayerId, access);

    if (taxPayer.onboardStatus !== OnboardStatus.ONBOARDED) {
      throw new ApiErrorException(
        HttpStatus.CONFLICT,
        'conflict',
        'not_onboarded',
        'Renew requires a completed first onboard',
      );
    }

    if (!taxPayer.productionCsid || !taxPayer.productionCsidSecret) {
      throw new ApiErrorException(
        HttpStatus.CONFLICT,
        'conflict',
        'pcsid_required',
        'Production CSID missing',
      );
    }

    const jobId = `renew-${taxPayerId}`;
    taxPayer.onboardStatus = OnboardStatus.QUEUED;
    taxPayer.onboardStep = OnboardStep.CSR;
    taxPayer.onboardProgress = 0;
    taxPayer.onboardComplianceDone = 0;
    taxPayer.onboardError = null;
    taxPayer.onboardJobId = jobId;
    await this.taxPayerRepository.save(taxPayer);

    await this.enqueueJob(
      taxPayer,
      RENEW_JOB,
      { taxPayerId, otp, mode: 'renew' as const },
      jobId,
    );

    return this.toProgress(taxPayer);
  }

  private async enqueueJob(
    taxPayer: TaxPayer,
    name: string,
    data: { taxPayerId: number; otp: string; mode: 'onboard' | 'renew' },
    jobId: string,
  ): Promise<void> {
    try {
      const existing = await this.onboardQueue.getJob(jobId);
      if (existing) {
        const state = await existing.getState();
        if (state === 'completed' || state === 'failed') {
          await existing.remove();
        } else if (state === 'active' || state === 'waiting' || state === 'delayed') {
          throw new ApiErrorException(
            HttpStatus.CONFLICT,
            'conflict',
            'onboard_running',
            'Onboard job already running',
          );
        } else {
          await existing.remove().catch(() => undefined);
        }
      }

      await this.onboardQueue.add(name, data, {
        jobId,
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 1,
      });
    } catch (err) {
      if (err instanceof ApiErrorException) {
        throw err;
      }
      this.logger.error(
        `Failed to enqueue ${jobId}: ${err instanceof Error ? err.message : err}`,
      );
      taxPayer.onboardStatus = OnboardStatus.FAILED;
      taxPayer.onboardError = 'Failed to enqueue onboard job';
      taxPayer.onboardJobId = null;
      await this.taxPayerRepository.save(taxPayer);
      throw new ApiErrorException(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'api_error',
        'enqueue_failed',
        'Failed to enqueue onboard job',
      );
    }
  }
}
