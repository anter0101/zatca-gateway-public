import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { BaseDTO } from 'src/core/utils/base.dto';
import { TaxPayerInvoiceType } from 'src/core/enums/tax-payer-invoice-type';
import { TaxPayerStatus } from 'src/core/enums/tax-payer-status';

const SELLER_ID_SCHEMES = ['CRN', 'MOM', 'MLS', 'SAG', 'OTH', '700'] as const;

@ValidatorConstraint({ name: 'ksaVat', async: false })
export class KsaVatConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'string') {
      return false;
    }
    if (!/^3\d{13}3$/.test(value)) {
      return false;
    }
    // 11th digit (1-based) must be 0 — index 10
    return value[10] === '0';
  }

  defaultMessage(_args: ValidationArguments): string {
    return 'VAT must be 15 digits starting and ending with 3, with 11th digit 0';
  }
}

export class TaxPayerDTO extends BaseDTO {
  @ApiProperty({ description: 'Owning software vendor id' })
  @IsInt()
  vendorId: number;

  @ApiProperty({ example: '399999999900003' })
  @IsString()
  @Validate(KsaVatConstraint, { message: 'vat_invalid' })
  vatNumber: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  legalName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  organizationUnitName: string;

  @ApiProperty({ example: 'RRRD2929' })
  @IsString()
  @Matches(/^[A-Z]{4}\d{4}$/, {
    message: 'locationAddress must be Wasel code like RRRD2929',
  })
  locationAddress: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  industryBusinessCategory: string;

  @ApiPropertyOptional({ enum: TaxPayerInvoiceType })
  @IsOptional()
  @IsEnum(TaxPayerInvoiceType)
  invoiceType?: TaxPayerInvoiceType;

  @ApiPropertyOptional({ example: 'SA' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ enum: TaxPayerStatus })
  @IsOptional()
  @IsEnum(TaxPayerStatus)
  status?: TaxPayerStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  streetName?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  buildingNumber?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  district?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  postalZone?: string | null;

  @ApiPropertyOptional({ enum: SELLER_ID_SCHEMES })
  @IsOptional()
  @IsString()
  @Matches(/^(CRN|MOM|MLS|SAG|OTH|700)$/)
  sellerIdScheme?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sellerIdValue?: string | null;
}
