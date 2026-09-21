import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { ApiKey } from './api-key.entity';
import { CreateApiKeyDTO } from './dtos/create-api-key.dto';
import { ApiErrorException } from 'src/core/filters/api-exception.filter';
import {
  generatePlaintext,
  hashKey,
  scopeMatches,
} from 'src/core/security/api-key-util';
import { VendorService } from 'src/app/modules/vendor/vendor.service';
import { ZatcaEnvironment } from 'src/core/enums/zatca-environment';
import { SoftwareVendor } from 'src/app/modules/vendor/software-vendor.entity';
import { ApiKeyPrefix } from 'src/core/enums/api-key-prefix';

export type VerifiedApiKeyContext = {
  apiKey: ApiKey;
  vendor: SoftwareVendor;
};

@Injectable()
export class ApiKeyService {
  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeyRepository: Repository<ApiKey>,
    private readonly vendorService: VendorService,
  ) {}

  async findById(id: number): Promise<ApiKey | undefined> {
    const result = await this.apiKeyRepository.findOne({ where: { id } });
    return result || undefined;
  }

  async findByFields(
    options: FindOneOptions<ApiKey>,
  ): Promise<ApiKey | undefined> {
    const result = await this.apiKeyRepository.findOne(options);
    return result || undefined;
  }

  async findAndCount(
    vendorId: number,
    options: FindManyOptions<ApiKey>,
  ): Promise<[ApiKey[], number]> {
    await this.vendorService.findByIdOrFail(vendorId);
    return this.apiKeyRepository.findAndCount({
      ...options,
      where: { ...(options.where as object), vendorId },
    });
  }

  async save(
    vendorId: number,
    dto: CreateApiKeyDTO,
    creator?: string,
  ): Promise<{ entity: ApiKey; plaintext: string }> {
    await this.vendorService.findByIdOrFail(vendorId);

    const expiresAt = this.resolveExpiresAt(dto);
    const { key, last4 } = generatePlaintext(dto.prefix);
    const keyHash = hashKey(key);

    const entity = this.apiKeyRepository.create({
      vendorId,
      prefix: dto.prefix,
      keyHash,
      last4,
      expiresAt,
      createdBy: creator,
      updatedBy: creator,
      createdAt: new Date(),
    });

    const saved = await this.apiKeyRepository.save(entity);
    return { entity: saved, plaintext: key };
  }

  async revoke(
    vendorId: number,
    keyId: number,
    updater?: string,
  ): Promise<ApiKey> {
    await this.vendorService.findByIdOrFail(vendorId);

    const key = await this.apiKeyRepository.findOne({
      where: { id: keyId, vendorId },
    });
    if (!key) {
      throw new ApiErrorException(
        HttpStatus.NOT_FOUND,
        'not_found',
        'api_key_not_found',
        'API key not found',
      );
    }

    if (!key.revokedAt) {
      key.revokedAt = new Date();
      key.updatedBy = updater;
      key.updatedAt = new Date();
      await this.apiKeyRepository.save(key);
    }

    return key;
  }

  /**
   * Phase 3 auth helper: hash → find → revoked/expired → prefix scope.
   */
  async verifyApiKey(
    plaintext: string,
    expectedScope?: ZatcaEnvironment,
  ): Promise<VerifiedApiKeyContext> {
    if (!plaintext?.trim()) {
      throw new ApiErrorException(
        HttpStatus.UNAUTHORIZED,
        'authentication_error',
        'unauthorized',
        'Missing API key',
      );
    }

    const keyHash = hashKey(plaintext.trim());
    const apiKey = await this.apiKeyRepository.findOne({
      where: { keyHash },
      relations: ['vendor'],
    });

    if (!apiKey || !apiKey.vendor) {
      throw new ApiErrorException(
        HttpStatus.UNAUTHORIZED,
        'authentication_error',
        'unauthorized',
        'Invalid API key',
      );
    }

    if (apiKey.revokedAt) {
      throw new ApiErrorException(
        HttpStatus.UNAUTHORIZED,
        'authentication_error',
        'api_key_revoked',
        'API key has been revoked',
      );
    }

    if (apiKey.expiresAt.getTime() <= Date.now()) {
      throw new ApiErrorException(
        HttpStatus.UNAUTHORIZED,
        'authentication_error',
        'api_key_expired',
        'API key has expired',
      );
    }

    if (!scopeMatches(apiKey.prefix, expectedScope)) {
      throw new ApiErrorException(
        HttpStatus.FORBIDDEN,
        'authorization_error',
        'api_key_scope',
        'API key prefix does not match required environment scope',
      );
    }

    return { apiKey, vendor: apiKey.vendor };
  }

  async touchLastUsed(apiKeyId: number): Promise<void> {
    await this.apiKeyRepository.update(apiKeyId, {
      lastUsedAt: new Date(),
    });
  }

  private resolveExpiresAt(dto: {
    expiresAt?: Date | string;
    expiresInDays?: number;
    prefix: ApiKeyPrefix;
  }): Date {
    if (dto.expiresAt) {
      const at = new Date(dto.expiresAt);
      if (Number.isNaN(at.getTime()) || at.getTime() <= Date.now()) {
        throw new ApiErrorException(
          HttpStatus.BAD_REQUEST,
          'invalid_request',
          'expires_required',
          'expiresAt must be a future ISO datetime',
        );
      }
      return at;
    }

    if (dto.expiresInDays != null && dto.expiresInDays > 0) {
      const at = new Date();
      at.setUTCDate(at.getUTCDate() + dto.expiresInDays);
      return at;
    }

    throw new ApiErrorException(
      HttpStatus.BAD_REQUEST,
      'invalid_request',
      'expires_required',
      'Provide expiresAt or expiresInDays',
    );
  }
}
