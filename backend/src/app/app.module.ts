import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { VendorModule } from './modules/vendor/vendor.module';
import { ApiKeyModule } from './modules/api-key/api-key.module';
import { TaxPayerModule } from './modules/tax-payer/tax-payer.module';
import { QueueModule } from './modules/queue/queue.module';
import { ZatcaModule } from './modules/zatca/zatca.module';
import { SidecarModule } from './modules/sidecar/sidecar.module';
import { OnboardModule } from './modules/onboard/onboard.module';
import PostgresTypeorm from 'src/config/db-config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.development'],
    }),
    TypeOrmModule.forRootAsync({
      useClass: PostgresTypeorm,
      inject: [PostgresTypeorm],
    }),
    AuthModule,
    UserModule,
    VendorModule,
    ApiKeyModule,
    TaxPayerModule,
    QueueModule,
    ZatcaModule,
    SidecarModule,
    OnboardModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
