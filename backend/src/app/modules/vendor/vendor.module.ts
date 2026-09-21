import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SoftwareVendor } from './software-vendor.entity';
import { VendorService } from './vendor.service';
import { VendorController } from './vendor.controller';
import { TaxPayer } from 'src/app/modules/tax-payer/tax-payer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SoftwareVendor, TaxPayer])],
  controllers: [VendorController],
  providers: [VendorService],
  exports: [VendorService, TypeOrmModule],
})
export class VendorModule {}
