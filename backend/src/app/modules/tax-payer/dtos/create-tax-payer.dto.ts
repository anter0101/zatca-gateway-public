import { OmitType } from '@nestjs/swagger';
import { TaxPayerDTO } from './tax-payer.dto';

export class CreateTaxPayerDTO extends OmitType(TaxPayerDTO, [
  'id',
  'createdBy',
  'createdAt',
  'updatedBy',
  'updatedAt',
  'deletedBy',
  'deletedAt',
  'vendorId',
  'country',
  'status',
] as const) {}
