import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SidecarClient } from './sidecar.client';

@Module({
  imports: [HttpModule.register({ timeout: 180_000 })],
  providers: [SidecarClient],
  exports: [SidecarClient],
})
export class SidecarModule {}
