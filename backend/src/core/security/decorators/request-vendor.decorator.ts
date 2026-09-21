import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  REQUEST_API_KEY_KEY,
  REQUEST_VENDOR_KEY,
  REQUEST_ZATCA_ENV_KEY,
} from '../guards/api-key-or-jwt.guard';

export const RequestVendor = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request[REQUEST_VENDOR_KEY] ?? null;
  },
);

export const RequestApiKey = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request[REQUEST_API_KEY_KEY] ?? null;
  },
);

export const RequestZatcaEnv = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request[REQUEST_ZATCA_ENV_KEY] ?? null;
  },
);
