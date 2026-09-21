import { HttpException } from '@nestjs/common';
import type { ApiErrorBody } from 'src/core/filters/api-exception.filter';

export type StoredOnboardError = {
  message: string;
  zatcaBody?: unknown;
};

function extractApiErrorBody(err: unknown): ApiErrorBody['error'] | null {
  const getResponse = (err as { getResponse?: () => unknown })?.getResponse;
  if (typeof getResponse !== 'function') {
    return null;
  }
  const raw = getResponse.call(err);
  if (typeof raw === 'object' && raw !== null && 'error' in raw) {
    const e = (raw as ApiErrorBody).error;
    if (e && typeof e === 'object') {
      return e;
    }
  }
  return null;
}

/** Persistable job failure for tax_payers.onboard_error. */
export function formatOnboardError(err: unknown): string {
  // Duck-type: `instanceof HttpException` fails across duplicate @nestjs/common.
  const e = extractApiErrorBody(err);
  if (e) {
    const code = e.zatca_code || e.code;
    let message = e.message || code || 'onboard_failed';
    if (
      e.message &&
      code &&
      code !== 'fatoora_error' &&
      code !== 'internal_error' &&
      !e.message.includes(String(code))
    ) {
      message = `${code}: ${e.message}`;
    }
    const payload: StoredOnboardError = {
      message,
      ...(e.details !== undefined ? { zatcaBody: e.details } : {}),
    };
    return JSON.stringify(payload);
  }

  if (err instanceof HttpException) {
    const raw = err.getResponse();
    if (typeof raw === 'string') {
      return JSON.stringify({ message: raw } satisfies StoredOnboardError);
    }
  }

  if (
    err instanceof Error &&
    err.message &&
    err.message !== 'Api Error Exception'
  ) {
    return JSON.stringify({
      message: err.message,
    } satisfies StoredOnboardError);
  }

  return JSON.stringify({
    message: 'onboard_failed',
  } satisfies StoredOnboardError);
}

export function parseStoredOnboardError(raw: string | null | undefined): {
  error: string | null;
  zatcaBody: unknown | null;
} {
  if (raw == null || raw === '') {
    return { error: null, zatcaBody: null };
  }
  try {
    const parsed = JSON.parse(raw) as StoredOnboardError | unknown;
    if (
      parsed &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed) &&
      'message' in parsed &&
      typeof (parsed as StoredOnboardError).message === 'string'
    ) {
      const stored = parsed as StoredOnboardError;
      return {
        error: stored.message,
        zatcaBody:
          stored.zatcaBody !== undefined ? stored.zatcaBody : null,
      };
    }
    // Raw ZATCA JSON body stored directly
    return { error: raw, zatcaBody: parsed };
  } catch {
    return { error: raw, zatcaBody: null };
  }
}
