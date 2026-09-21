import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Response } from 'express';

export type ApiErrorBody = {
  error: {
    type: string;
    code: string;
    message: string;
    zatca_code: string | null;
    details?: unknown;
  };
};

export class ApiErrorException extends HttpException {
  constructor(
    status: HttpStatus,
    type: string,
    code: string,
    message: string,
    zatcaCode: string | null = null,
    details: unknown = undefined,
  ) {
    const body: ApiErrorBody = {
      error: {
        type,
        code,
        message,
        zatca_code: zatcaCode,
        ...(details !== undefined ? { details } : {}),
      },
    };
    super(body, status);
    // Nest defaults Error.message to "Api Error Exception" when body has
    // nested error.message only — keep the real text for workers/logs.
    this.message = message;
  }
}

@Injectable()
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof ApiErrorException) {
      const status = exception.getStatus();
      response.status(status).json(exception.getResponse());
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const raw = exception.getResponse();
      const body = this.mapHttpException(status, raw);
      response.status(status).json(body);
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: {
        type: 'api_error',
        code: 'internal_error',
        message: 'Internal server error',
        zatca_code: null,
      },
    } satisfies ApiErrorBody);
  }

  private mapHttpException(
    status: number,
    raw: string | object,
  ): ApiErrorBody {
    if (
      typeof raw === 'object' &&
      raw !== null &&
      'error' in raw &&
      typeof (raw as ApiErrorBody).error === 'object'
    ) {
      return raw as ApiErrorBody;
    }

    let message = 'Request failed';
    if (typeof raw === 'string') {
      message = raw;
    } else if (typeof raw === 'object' && raw !== null && 'message' in raw) {
      const msg = (raw as { message: string | string[] }).message;
      message = Array.isArray(msg) ? msg.join('; ') : String(msg);
    }

    const { type, code } = this.statusDefaults(status);
    return {
      error: {
        type,
        code,
        message,
        zatca_code: null,
      },
    };
  }

  private statusDefaults(status: number): { type: string; code: string } {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return { type: 'invalid_request', code: 'validation_error' };
      case HttpStatus.UNAUTHORIZED:
        return { type: 'authentication_error', code: 'unauthorized' };
      case HttpStatus.FORBIDDEN:
        return { type: 'authorization_error', code: 'forbidden' };
      case HttpStatus.NOT_FOUND:
        return { type: 'not_found', code: 'not_found' };
      case HttpStatus.CONFLICT:
        return { type: 'conflict', code: 'conflict' };
      default:
        return { type: 'api_error', code: 'internal_error' };
    }
  }
}
