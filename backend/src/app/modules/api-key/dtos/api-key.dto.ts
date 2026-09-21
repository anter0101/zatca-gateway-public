import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';
import { BaseDTO } from 'src/core/utils/base.dto';
import { ApiKeyPrefix } from 'src/core/enums/api-key-prefix';

export class ApiKeyDTO extends BaseDTO {
  @ApiProperty({ enum: ApiKeyPrefix, example: ApiKeyPrefix.SK_TEST })
  @IsEnum(ApiKeyPrefix)
  prefix: ApiKeyPrefix;

  @ApiPropertyOptional({
    description: 'Absolute expiry (ISO). Required if expiresInDays omitted.',
  })
  @ValidateIf((o: ApiKeyDTO) => o.expiresInDays == null && o.id == null)
  @IsOptional()
  @IsDateString()
  expiresAt?: Date | string;

  @ApiPropertyOptional({
    description: 'Relative expiry in days. Used if expiresAt omitted on create.',
  })
  @ValidateIf((o: ApiKeyDTO) => !o.expiresAt && o.id == null)
  @IsOptional()
  @IsInt()
  @Min(1)
  expiresInDays?: number;

  @ApiPropertyOptional({ description: 'Last four characters of the secret' })
  @IsOptional()
  @IsString()
  last4?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  lastUsedAt?: Date | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  revokedAt?: Date | null;

  @ApiPropertyOptional({
    description: 'True when expiresAt is in the past',
  })
  @IsOptional()
  expired?: boolean;

  @ApiPropertyOptional({
    description: 'Full secret — only present on generate',
  })
  @IsOptional()
  @IsString()
  key?: string;
}
