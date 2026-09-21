import { OmitType } from '@nestjs/swagger';
import { ApiKeyDTO } from './api-key.dto';

export class CreateApiKeyDTO extends OmitType(ApiKeyDTO, [
  'id',
  'createdBy',
  'createdAt',
  'updatedBy',
  'updatedAt',
  'deletedBy',
  'deletedAt',
  'last4',
  'lastUsedAt',
  'revokedAt',
  'expired',
  'key',
] as const) {}
