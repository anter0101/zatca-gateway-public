import { PartialType } from '@nestjs/swagger';
import { VendorDTO } from './vendor.dto';

export class UpdateVendorDTO extends PartialType(VendorDTO) {}
