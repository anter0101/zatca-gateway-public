import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './invoice.entity';
import { TaxPayer } from 'src/app/modules/tax-payer/tax-payer.entity';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { InvoiceProcessor } from './invoice.processor';
import { TaxPayerModule } from 'src/app/modules/tax-payer/tax-payer.module';
import { ApiKeyModule } from 'src/app/modules/api-key/api-key.module';
import { SidecarModule } from 'src/app/modules/sidecar/sidecar.module';
import { ZatcaModule } from 'src/app/modules/zatca/zatca.module';
import { QueueModule } from 'src/app/modules/queue/queue.module';
import { ApiKeyOrJwtGuard } from 'src/core/security';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice, TaxPayer]),
    TaxPayerModule,
    ApiKeyModule,
    SidecarModule,
    ZatcaModule,
    QueueModule,
  ],
  controllers: [InvoiceController],
  providers: [InvoiceService, InvoiceProcessor, ApiKeyOrJwtGuard],
})
export class InvoiceModule {}
