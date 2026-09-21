import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaxPayer } from './tax-payer.entity';
import { TaxPayerService } from './tax-payer.service';
import { TaxPayerController } from './tax-payer.controller';
import { VendorModule } from 'src/app/modules/vendor/vendor.module';

@Module({
  imports: [TypeOrmModule.forFeature([TaxPayer]), VendorModule],
  controllers: [TaxPayerController],
  providers: [TaxPayerService],
  exports: [TaxPayerService],
})
export class TaxPayerModule {}
