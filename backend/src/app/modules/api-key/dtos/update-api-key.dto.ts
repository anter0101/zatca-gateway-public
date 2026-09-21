import { PartialType } from '@nestjs/swagger';
import { ApiKeyDTO } from './api-key.dto';

export class UpdateApiKeyDTO extends PartialType(ApiKeyDTO) {}
