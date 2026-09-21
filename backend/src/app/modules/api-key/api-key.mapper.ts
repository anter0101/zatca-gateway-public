/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { ApiKey } from './api-key.entity';
import { ApiKeyDTO } from './dtos/api-key.dto';
import { CreateApiKeyDTO } from './dtos/create-api-key.dto';
import { BaseDTO } from 'src/core/utils/base.dto';

const allowedApiKeyDtoKeys: ReadonlyArray<keyof ApiKeyDTO | keyof BaseDTO> = [
  'id',
  'prefix',
  'expiresAt',
  'last4',
  'lastUsedAt',
  'revokedAt',
  'expired',
  'createdAt',
  'createdBy',
  'updatedAt',
  'updatedBy',
  'deletedAt',
  'deletedBy',
] as const;

export function mapApiKeyToDtoSelective(
  key: ApiKey,
  keys?: (keyof ApiKeyDTO | keyof BaseDTO)[],
): Partial<ApiKeyDTO>;
export function mapApiKeyToDtoSelective(
  keysList: ApiKey[],
  keys?: (keyof ApiKeyDTO | keyof BaseDTO)[],
): Partial<ApiKeyDTO>[];
export function mapApiKeyToDtoSelective(
  keyOrKeys: ApiKey | ApiKey[],
  keys?: (keyof ApiKeyDTO | keyof BaseDTO)[],
): Partial<ApiKeyDTO> | Partial<ApiKeyDTO>[] {
  const mapSingle = (apiKey: ApiKey): Partial<ApiKeyDTO> => {
    const dto: Partial<ApiKeyDTO> = {};
    const keysToMap = (keys || allowedApiKeyDtoKeys).filter((key) =>
      allowedApiKeyDtoKeys.includes(key),
    );

    keysToMap.forEach((key) => {
      if (key === 'expired') {
        dto.expired = apiKey.expiresAt.getTime() <= Date.now();
        return;
      }
      if (key === 'expiresAt') {
        dto.expiresAt = apiKey.expiresAt;
        return;
      }
      if (key in apiKey && apiKey[key as keyof ApiKey] !== undefined) {
        (dto as any)[key] = apiKey[key as keyof ApiKey];
      }
    });

    return dto;
  };

  return Array.isArray(keyOrKeys)
    ? keyOrKeys.map(mapSingle)
    : mapSingle(keyOrKeys);
}

export const mapCreateApiKeyDtoToEntity = (
  dto: CreateApiKeyDTO,
  vendorId: number,
): { vendorId: number; prefix: CreateApiKeyDTO['prefix']; expiresAt?: string; expiresInDays?: number } => {
  return {
    vendorId,
    prefix: dto.prefix,
    expiresAt:
      typeof dto.expiresAt === 'string'
        ? dto.expiresAt
        : dto.expiresAt?.toISOString(),
    expiresInDays: dto.expiresInDays,
  };
};
