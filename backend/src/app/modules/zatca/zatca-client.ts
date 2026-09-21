import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { ZatcaEnvironment } from 'src/core/enums/zatca-environment';
import { ApiErrorException } from 'src/core/filters/api-exception.filter';

export type CsidResponse = {
  requestID: number | string;
  dispositionMessage?: string;
  binarySecurityToken: string;
  secret: string;
};

export type InvoiceRequestBody = {
  invoiceHash: string;
  uuid: string;
  invoice: string;
};

export type ComplianceCheckResponse = Record<string, unknown> & {
  validationResults?: {
    errorMessages?: Array<{ code?: string; message?: string }>;
    warningMessages?: Array<{ code?: string; message?: string }>;
  };
  reportingStatus?: string;
  clearanceStatus?: string;
};

@Injectable()
export class ZatcaClientFactory {
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  create(env: ZatcaEnvironment): ZatcaClient {
    return new ZatcaClient(this.http, this.config, env);
  }
}

export class ZatcaClient {
  readonly onboarding: ZatcaOnboardingApi;
  readonly invoices: ZatcaInvoicesApi;

  constructor(
    http: HttpService,
    config: ConfigService,
    readonly env: ZatcaEnvironment,
  ) {
    const base = resolveBase(config, env);
    this.onboarding = new ZatcaOnboardingApi(http, base);
    this.invoices = new ZatcaInvoicesApi(http, base);
  }
}

function resolveBase(config: ConfigService, env: ZatcaEnvironment): string {
  let key: string;
  switch (env) {
    case ZatcaEnvironment.PRODUCTION:
      key = 'ZATCA_PRODUCTION_BASE_URL';
      break;
    case ZatcaEnvironment.DEVELOPER_PORTAL:
      key = 'ZATCA_DEVELOPER_PORTAL_BASE_URL';
      break;
    default:
      key = 'ZATCA_SIMULATION_BASE_URL';
  }
  const base = config.get<string>(key);
  if (!base) {
    throw new Error(`${key} is not configured`);
  }
  return base.replace(/\/$/, '');
}

function commonHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'Accept-Version': 'V2',
    'accept-language': 'en',
    ...(extra || {}),
  };
}

function basicAuth(token: string, secret: string): string {
  return (
    'Basic ' + Buffer.from(`${token}:${secret}`, 'utf8').toString('base64')
  );
}

function normalizeFatooraBody(raw: unknown): unknown {
  if (raw == null) {
    return null;
  }
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(raw)) {
    raw = raw.toString('utf8');
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) {
      return null;
    }
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }
  return raw;
}

function extractFatooraIssue(data: unknown): {
  code: string | null;
  message: string | null;
} {
  if (data == null) {
    return { code: null, message: null };
  }
  if (typeof data === 'string') {
    return { code: null, message: data };
  }
  if (Array.isArray(data) && data.length > 0) {
    return extractFatooraIssue(data[0]);
  }
  if (typeof data !== 'object') {
    return { code: null, message: String(data) };
  }

  const obj = data as Record<string, any>;
  const first =
    obj.errors?.[0] ||
    obj.validationResults?.errorMessages?.[0] ||
    obj.errorMessages?.[0] ||
    null;

  if (typeof first === 'string') {
    return { code: null, message: first };
  }
  if (first && typeof first === 'object') {
    return {
      code: first.code ?? first.errorCode ?? null,
      message: first.message ?? first.errorMessage ?? null,
    };
  }

  if (Array.isArray(obj.errors) && obj.errors.length) {
    const joined = obj.errors
      .map((x: any) =>
        typeof x === 'string'
          ? x
          : [x?.code, x?.message].filter(Boolean).join(': '),
      )
      .filter(Boolean)
      .join('; ');
    return {
      code: obj.errors[0]?.code ?? null,
      message: joined || null,
    };
  }

  return {
    code: obj.code ?? obj.errorCode ?? obj.errorCategory ?? null,
    message:
      obj.message ??
      obj.errorMessage ??
      obj.dispositionMessage ??
      (typeof obj.error === 'string' ? obj.error : null) ??
      (typeof obj.title === 'string' ? obj.title : null),
  };
}

function mapFatooraError(err: unknown): never {
  if (err instanceof ApiErrorException) {
    throw err;
  }
  const axiosErr = err as AxiosError<any>;
  const status = axiosErr.response?.status ?? HttpStatus.BAD_GATEWAY;
  const data = normalizeFatooraBody(axiosErr.response?.data);
  const extracted = extractFatooraIssue(data);
  // Prefer category over numeric errorCode (e.g. Invalid-CSR over "400")
  const zatcaCode =
    (data &&
      typeof data === 'object' &&
      !Array.isArray(data) &&
      typeof (data as any).errorCategory === 'string' &&
      (data as any).errorCategory) ||
    (extracted.code && extracted.code !== String(status) ? extracted.code : null) ||
    extracted.code ||
    null;
  const message = extracted.message;

  let text =
    (typeof message === 'string' && message.trim()) ||
    (data != null
      ? typeof data === 'string'
        ? data
        : JSON.stringify(data)
      : null) ||
    (axiosErr.response
      ? `Fatoora HTTP ${status}`
      : axiosErr.message) ||
    'Fatoora request failed';

  // Prefer ZATCA body over axios's generic "Request failed with status code N"
  if (/^Request failed with status code \d+$/i.test(text) && data != null) {
    text = typeof data === 'string' ? data : JSON.stringify(data);
  }

  throw new ApiErrorException(
    status >= 400 && status < 600 ? status : HttpStatus.BAD_GATEWAY,
    'zatca_error',
    zatcaCode || 'fatoora_error',
    zatcaCode && !text.includes(String(zatcaCode))
      ? `${zatcaCode}: ${text}`
      : text,
    typeof zatcaCode === 'string' ? zatcaCode : null,
    data,
  );
}

class ZatcaOnboardingApi {
  constructor(
    private readonly http: HttpService,
    private readonly base: string,
  ) {}

  async complianceCSID(csrBase64: string, otp: string): Promise<CsidResponse> {
    try {
      const res = await firstValueFrom(
        this.http.post<CsidResponse>(
          `${this.base}/compliance`,
          { csr: csrBase64 },
          { headers: commonHeaders({ OTP: otp }) },
        ),
      );
      return res.data;
    } catch (e) {
      mapFatooraError(e);
    }
  }

  async complianceChecks(
    body: InvoiceRequestBody,
    binarySecurityToken: string,
    secret: string,
  ): Promise<ComplianceCheckResponse> {
    try {
      const res = await firstValueFrom(
        this.http.post<ComplianceCheckResponse>(
          `${this.base}/compliance/invoices`,
          body,
          {
            headers: commonHeaders({
              Authorization: basicAuth(binarySecurityToken, secret),
            }),
          },
        ),
      );
      return res.data;
    } catch (e) {
      mapFatooraError(e);
    }
  }

  async productionCSID(
    complianceRequestId: string,
    binarySecurityToken: string,
    secret: string,
  ): Promise<CsidResponse> {
    try {
      const res = await firstValueFrom(
        this.http.post<CsidResponse>(
          `${this.base}/production/csids`,
          { compliance_request_id: String(complianceRequestId) },
          {
            headers: commonHeaders({
              Authorization: basicAuth(binarySecurityToken, secret),
            }),
          },
        ),
      );
      return res.data;
    } catch (e) {
      mapFatooraError(e);
    }
  }

  /**
   * PATCH renew — success is often HTTP 428 with a new compliance CSID.
   */
  async renewProductionCSID(
    csrBase64: string,
    otp: string,
    currentToken: string,
    currentSecret: string,
  ): Promise<{ status: number; data: CsidResponse }> {
    try {
      const res = await firstValueFrom(
        this.http.patch<CsidResponse>(
          `${this.base}/production/csids`,
          { csr: csrBase64 },
          {
            headers: commonHeaders({
              OTP: otp,
              Authorization: basicAuth(currentToken, currentSecret),
            }),
            validateStatus: (s) => s === 200 || s === 428,
          },
        ),
      );
      return { status: res.status, data: res.data };
    } catch (e) {
      mapFatooraError(e);
    }
  }
}

class ZatcaInvoicesApi {
  constructor(
    private readonly http: HttpService,
    private readonly base: string,
  ) {}

  /** Phase 4 */
  async report(
    body: InvoiceRequestBody,
    binarySecurityToken: string,
    secret: string,
  ): Promise<unknown> {
    try {
      const res = await firstValueFrom(
        this.http.post(`${this.base}/invoices/reporting/single`, body, {
          headers: commonHeaders({
            Authorization: basicAuth(binarySecurityToken, secret),
            'Clearance-Status': '0',
          }),
        }),
      );
      return res.data;
    } catch (e) {
      mapFatooraError(e);
    }
  }

  /** Phase 4 */
  async clear(
    body: InvoiceRequestBody,
    binarySecurityToken: string,
    secret: string,
  ): Promise<unknown> {
    try {
      const res = await firstValueFrom(
        this.http.post(`${this.base}/invoices/clearance/single`, body, {
          headers: commonHeaders({
            Authorization: basicAuth(binarySecurityToken, secret),
            'Clearance-Status': '1',
          }),
        }),
      );
      return res.data;
    } catch (e) {
      mapFatooraError(e);
    }
  }
}
