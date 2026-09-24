import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKey } from './api-key.entity';
import { TaxPayer } from 'src/app/modules/tax-payer/tax-payer.entity';
import { ApiKeyService } from './api-key.service';
import { ApiKeyController } from './api-key.controller';
import { VendorApiKeyController } from './vendor-api-key.controller';
import { VendorModule } from 'src/app/modules/vendor/vendor.module';
import { ApiKeyOrJwtGuard } from 'src/core/security';

@Module({
  imports: [TypeOrmModule.forFeature([ApiKey, TaxPayer]), VendorModule],
  controllers: [ApiKeyController, VendorApiKeyController],
  providers: [ApiKeyService, ApiKeyOrJwtGuard],
  exports: [ApiKeyService],
})
export class ApiKeyModule {}
