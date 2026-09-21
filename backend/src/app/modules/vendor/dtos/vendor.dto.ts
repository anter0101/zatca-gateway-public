import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { BaseDTO } from 'src/core/utils/base.dto';
import { SoftwareVendorStatus } from 'src/core/enums/software-vendor-status';

export class VendorDTO extends BaseDTO {
  @ApiProperty({ example: 'Antoor ERP', description: 'Company / product name' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  name!: string;

  @ApiPropertyOptional({
    example: 'antoor-erp',
    description: 'Unique slug (generated from name if omitted on create)',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  slug?: string;

  @ApiPropertyOptional({
    enum: SoftwareVendorStatus,
    example: SoftwareVendorStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(SoftwareVendorStatus)
  status?: SoftwareVendorStatus;
}
