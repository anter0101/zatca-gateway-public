import { PartialType } from '@nestjs/swagger';
import { CreateTaxPayerDTO } from './create-tax-payer.dto';

export class UpdateTaxPayerDTO extends PartialType(CreateTaxPayerDTO) {}
