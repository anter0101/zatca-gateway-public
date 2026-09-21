import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { VendorModule } from './modules/vendor/vendor.module';
import { ApiKeyModule } from './modules/api-key/api-key.module';
import { TaxPayerModule } from './modules/tax-payer/tax-payer.module';
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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
