import { HttpStatus } from '@nestjs/common';
import { ApiKey } from 'src/app/modules/api-key/api-key.entity';
import { SoftwareVendor } from 'src/app/modules/vendor/software-vendor.entity';
import { ApiErrorException } from 'src/core/filters/api-exception.filter';

/** Vendor routes require an API key. Admin JWT has no vendor to scope to. */
export function requireApiKeyVendor(
  vendor: SoftwareVendor | null | undefined,
): SoftwareVendor {
  if (!vendor?.id) {
    throw new ApiErrorException(
      HttpStatus.FORBIDDEN,
      'authorization_error',
      'api_key_required',
      'Vendor API key is required',
    );
  }
  return vendor;
}

/** Key management accepts a vendor key. A tax payer key cannot mint keys. */
export function requireVendorWideKey(apiKey: ApiKey | null | undefined): void {
  if (apiKey?.taxPayerId) {
    throw new ApiErrorException(
      HttpStatus.FORBIDDEN,
      'authorization_error',
      'vendor_key_required',
      'Use the vendor API key to create and revoke keys',
    );
  }
}

/** Invoice routes accept only a key issued for one tax payer. */
export function requireTaxPayerKey(apiKey: ApiKey | null | undefined): number {
  if (!apiKey?.taxPayerId) {
    throw new ApiErrorException(
      HttpStatus.FORBIDDEN,
      'authorization_error',
      'taxpayer_key_required',
      'Generate an API key for this tax payer. A vendor key cannot call invoices.',
    );
  }
  return apiKey.taxPayerId;
}
