import {
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiKeyService } from 'src/app/modules/api-key/api-key.service';
import { ApiKeyPrefix } from 'src/core/enums/api-key-prefix';
import { prefixToEnvironment } from 'src/core/security/api-key-util';
import { ApiErrorException } from 'src/core/filters/api-exception.filter';

export const REQUEST_VENDOR_KEY = 'vendor';
export const REQUEST_API_KEY_KEY = 'apiKeyEntity';
export const REQUEST_ZATCA_ENV_KEY = 'zatcaEnvironment';
export const REQUEST_AUTH_MODE_KEY = 'authMode';

/**
 * Accepts either vendor API key (`sk_test_` / `sk_live_`) or admin JWT.
 * API key path uses Phase 2 verifyApiKey and updates last_used_at.
 */
@Injectable()
export class ApiKeyOrJwtGuard extends AuthGuard('jwt') {
  constructor(private readonly apiKeyService: ApiKeyService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const header = (request.headers?.authorization ||
      request.headers?.Authorization ||
      '') as string;
    const token = header.startsWith('Bearer ')
      ? header.slice('Bearer '.length).trim()
      : '';

    if (!token) {
      throw new ApiErrorException(
        HttpStatus.UNAUTHORIZED,
        'authentication_error',
        'unauthorized',
        'Missing Authorization Bearer token',
      );
    }

    if (
      token.startsWith(ApiKeyPrefix.SK_TEST) ||
      token.startsWith(ApiKeyPrefix.SK_LIVE)
    ) {
      const ctx = await this.apiKeyService.verifyApiKey(token);
      await this.apiKeyService.touchLastUsed(ctx.apiKey.id);
      request.user = null;
      request[REQUEST_VENDOR_KEY] = ctx.vendor;
      request[REQUEST_API_KEY_KEY] = ctx.apiKey;
      request[REQUEST_ZATCA_ENV_KEY] = prefixToEnvironment(ctx.apiKey.prefix);
      request[REQUEST_AUTH_MODE_KEY] = 'api_key';
      return true;
    }

    try {
      const ok = await super.canActivate(context);
      request[REQUEST_AUTH_MODE_KEY] = 'jwt';
      return ok as boolean;
    } catch {
      throw new ApiErrorException(
        HttpStatus.UNAUTHORIZED,
        'authentication_error',
        'unauthorized',
        'Invalid or expired credentials',
      );
    }
  }
}
