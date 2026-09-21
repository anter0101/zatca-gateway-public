import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ZatcaEnvironment } from 'src/core/enums/zatca-environment';
import { ApiErrorException } from 'src/core/filters/api-exception.filter';

export type SidecarCsrResult = {
  privateKey: string;
  csr: string;
};

export type SidecarSignResult = {
  signedInvoiceXml: string;
};

export type SidecarValidateResult = {
  passed: boolean;
  exitCode?: number;
  output?: string;
};

export type SidecarInvoiceRequestResult = {
  request: {
    invoiceHash: string;
    uuid: string;
    invoice: string;
  };
};

@Injectable()
export class SidecarClient {
  private readonly baseUrl: string;

  constructor(
    private readonly http: HttpService,
    config: ConfigService,
  ) {
    this.baseUrl = (
      config.get<string>('SIDECAR_URL') || 'http://localhost:8090'
    ).replace(/\/$/, '');
  }

  async csr(
    environment: ZatcaEnvironment,
    csrConfig: string,
  ): Promise<SidecarCsrResult> {
    return this.post<SidecarCsrResult>('/internal/csr', {
      environment,
      csrConfig,
    });
  }

  async sign(input: {
    environment: ZatcaEnvironment;
    privateKey: string;
    csid: string;
    pih?: string | null;
    invoiceXml: string;
  }): Promise<SidecarSignResult> {
    return this.post<SidecarSignResult>('/internal/sign', input);
  }

  async validate(input: {
    environment: ZatcaEnvironment;
    privateKey: string;
    csid: string;
    pih?: string | null;
    invoiceXml: string;
  }): Promise<SidecarValidateResult> {
    return this.post<SidecarValidateResult>('/internal/validate', input);
  }

  async invoiceRequest(input: {
    environment: ZatcaEnvironment;
    invoiceXml: string;
  }): Promise<SidecarInvoiceRequestResult> {
    return this.post<SidecarInvoiceRequestResult>(
      '/internal/invoice-request',
      input,
    );
  }

  async hash(input: {
    environment: ZatcaEnvironment;
    invoiceXml: string;
  }): Promise<{ invoiceHash: string }> {
    return this.post('/internal/hash', input);
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    try {
      const res = await firstValueFrom(
        this.http.post<T>(`${this.baseUrl}${path}`, body, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 180_000,
        }),
      );
      return res.data;
    } catch (err: any) {
      const status = err?.response?.status ?? HttpStatus.BAD_GATEWAY;
      const data = err?.response?.data;
      throw new ApiErrorException(
        status,
        'sidecar_error',
        data?.error?.code || 'sidecar_error',
        data?.error?.message || err?.message || 'Sidecar request failed',
      );
    }
  }
}
