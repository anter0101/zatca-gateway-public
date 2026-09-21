import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaxPayer } from 'src/app/modules/tax-payer/tax-payer.entity';
import { ApiKeyModule } from 'src/app/modules/api-key/api-key.module';
import { SidecarModule } from 'src/app/modules/sidecar/sidecar.module';
import { ZatcaModule } from 'src/app/modules/zatca/zatca.module';
import { QueueModule } from 'src/app/modules/queue/queue.module';
import { OnboardService } from './onboard.service';
import { OnboardController } from './onboard.controller';
import { OnboardProcessor } from './onboard.processor';
import { ApiKeyOrJwtGuard } from 'src/core/security';

@Module({
  imports: [
    TypeOrmModule.forFeature([TaxPayer]),
    ApiKeyModule,
    SidecarModule,
    ZatcaModule,
    QueueModule,
  ],
  controllers: [OnboardController],
  providers: [OnboardService, OnboardProcessor, ApiKeyOrJwtGuard],
  exports: [OnboardService],
})
export class OnboardModule {}
