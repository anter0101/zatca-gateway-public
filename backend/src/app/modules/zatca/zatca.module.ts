import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ZatcaClientFactory } from './zatca-client';

@Module({
  imports: [HttpModule.register({ timeout: 120_000, maxRedirects: 0 })],
  providers: [ZatcaClientFactory],
  exports: [ZatcaClientFactory, HttpModule],
})
export class ZatcaModule {}
