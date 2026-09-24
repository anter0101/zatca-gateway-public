import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ChargeReason } from 'src/core/enums/allowance-charge-reason';
import { InvoiceCurrency } from 'src/core/enums/invoice-currency';
import { InvoiceDocumentType } from 'src/core/enums/invoice-document-type';
import { InvoiceStatus } from 'src/core/enums/invoice-status';
import { InvoiceSubtype } from 'src/core/enums/invoice-subtype';
import { BuyerId } from 'src/core/enums/party-id-scheme';
import { PaymentMeans } from 'src/core/enums/payment-means-code';
import { TaxCategory } from 'src/core/enums/tax-category-code';

export class InvoiceBuyerDTO {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vatNumber?: string;

  @ApiPropertyOptional({ enum: BuyerId, example: BuyerId.COMMERCIAL_REGISTRATION })
  @IsOptional()
  @IsEnum(BuyerId)
  idScheme?: BuyerId;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  idValue?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  streetName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  buildingNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  postalZone?: string;

  @ApiPropertyOptional({ example: 'SA' })
  @IsOptional()
  @IsString()
  country?: string;
}

export class InvoiceLineDTO {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  quantity!: number;

  @ApiPropertyOptional({ example: 'PCE' })
  @IsOptional()
  @IsString()
  unitCode?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiProperty({ enum: TaxCategory, example: TaxCategory.STANDARD })
  @IsEnum(TaxCategory)
  taxCategory!: TaxCategory;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  taxPercent!: number;

  @ApiPropertyOptional({ example: 'VATEX-SA-35' })
  @IsOptional()
  @IsString()
  exemptionCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  exemptionReason?: string;
}

export class DocumentDiscountDTO {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ enum: TaxCategory, example: TaxCategory.STANDARD })
  @IsEnum(TaxCategory)
  taxCategory!: TaxCategory;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  taxPercent!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  exemptionCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  exemptionReason?: string;
}

export class DocumentChargeDTO extends DocumentDiscountDTO {
  @ApiProperty({ enum: ChargeReason, example: ChargeReason.LEGALISATION_FEE })
  @IsEnum(ChargeReason)
  reasonCode!: ChargeReason;
}

export class CreateInvoiceDTO {
  @ApiProperty({ enum: InvoiceSubtype })
  @IsEnum(InvoiceSubtype)
  subtype!: InvoiceSubtype;

  @ApiProperty({ enum: InvoiceDocumentType })
  @IsEnum(InvoiceDocumentType)
  type!: InvoiceDocumentType;

  @ApiProperty({ example: '2026-09-19' })
  @IsString()
  issueDate!: string;

  @ApiProperty({ example: '18:30:00' })
  @IsString()
  issueTime!: string;

  @ApiProperty({ enum: InvoiceCurrency })
  @IsEnum(InvoiceCurrency)
  currency!: InvoiceCurrency;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  supplyDate?: string;

  @ApiProperty({ enum: PaymentMeans, example: PaymentMeans.CASH })
  @IsEnum(PaymentMeans)
  paymentMeansCode!: PaymentMeans;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instructionNote?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  originalInvoiceId?: number;

  @ApiPropertyOptional({ type: InvoiceBuyerDTO })
  @IsOptional()
  @ValidateNested()
  @Type(() => InvoiceBuyerDTO)
  buyer?: InvoiceBuyerDTO;

  @ApiPropertyOptional({ type: DocumentDiscountDTO })
  @IsOptional()
  @ValidateNested()
  @Type(() => DocumentDiscountDTO)
  documentDiscount?: DocumentDiscountDTO;

  @ApiPropertyOptional({ type: DocumentChargeDTO })
  @IsOptional()
  @ValidateNested()
  @Type(() => DocumentChargeDTO)
  documentCharge?: DocumentChargeDTO;

  @ApiProperty({ type: InvoiceLineDTO, isArray: true })
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineDTO)
  @ArrayMinSize(1)
  lines!: InvoiceLineDTO[];
}

export class InvoiceViewDTO {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  taxPayerId!: number;

  @ApiProperty()
  documentNumber!: string;

  @ApiProperty({ enum: InvoiceSubtype })
  subtype!: InvoiceSubtype;

  @ApiProperty({ enum: InvoiceDocumentType })
  type!: string;

  @ApiProperty()
  typeCode!: string;

  @ApiProperty({ enum: InvoiceStatus })
  status!: InvoiceStatus;

  @ApiProperty()
  uuid!: string;

  @ApiPropertyOptional({ nullable: true })
  invoiceHash!: string | null;

  @ApiPropertyOptional({ nullable: true })
  qr!: string | null;

  @ApiPropertyOptional({ nullable: true })
  error!: unknown;
}
