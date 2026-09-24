import { HttpStatus } from '@nestjs/common';
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
