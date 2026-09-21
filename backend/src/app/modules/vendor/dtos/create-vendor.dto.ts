import { OmitType } from '@nestjs/swagger';
import { VendorDTO } from './vendor.dto';

export class CreateVendorDTO extends OmitType(VendorDTO, [
  'id',
  'createdBy',
  'createdAt',
  'updatedBy',
  'updatedAt',
  'deletedBy',
  'deletedAt',
] as const) {}
