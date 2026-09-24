import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaxPayer } from './tax-payer.entity';
import { TaxPayerService } from './tax-payer.service';
import { TaxPayerController } from './tax-payer.controller';
import { VendorTaxPayerController } from './vendor-tax-payer.controller';
import { VendorModule } from 'src/app/modules/vendor/vendor.module';
import { ApiKeyModule } from 'src/app/modules/api-key/api-key.module';
import { ApiKeyOrJwtGuard } from 'src/core/security';

@Module({
  imports: [TypeOrmModule.forFeature([TaxPayer]), VendorModule, ApiKeyModule],
  controllers: [TaxPayerController, VendorTaxPayerController],
  providers: [TaxPayerService, ApiKeyOrJwtGuard],
  exports: [TaxPayerService],
})
export class TaxPayerModule {}
