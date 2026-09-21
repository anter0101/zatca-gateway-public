import { HttpStatus } from '@nestjs/common';
import { ApiErrorException } from 'src/core/filters/api-exception.filter';
import {
  formatOnboardError,
  parseStoredOnboardError,
} from './onboard-error';

describe('formatOnboardError', () => {
  it('persists zatca_code message and details as JSON for progress', () => {
    const zatcaBody = {
      errorCode: '400',
      errorCategory: 'Invalid-OTP',
      errorMessage: 'The provided OTP is invalid',
    };
    const err = new ApiErrorException(
      HttpStatus.BAD_REQUEST,
      'zatca_error',
      'Invalid-OTP',
      'The provided OTP is invalid',
      'Invalid-OTP',
      zatcaBody,
    );

    const stored = formatOnboardError(err);
    const parsed = JSON.parse(stored);
    expect(parsed.message).toBe(
      'Invalid-OTP: The provided OTP is invalid',
    );
    expect(parsed.zatcaBody).toEqual(zatcaBody);

    const progress = parseStoredOnboardError(stored);
    expect(progress.error).toBe('Invalid-OTP: The provided OTP is invalid');
    expect(progress.zatcaBody).toEqual(zatcaBody);
  });

  it('uses Error.message when ApiErrorException.message was set', () => {
    const err = new ApiErrorException(
      HttpStatus.BAD_GATEWAY,
      'zatca_error',
      'fatoora_error',
      'Fatoora HTTP 502',
      null,
    );
    expect(err.message).toBe('Fatoora HTTP 502');
    expect(err.message).not.toBe('Api Error Exception');
  });

  it('does not surface Nest default Api Error Exception as stored message', () => {
    const plain = new Error('Api Error Exception');
    const stored = formatOnboardError(plain);
    expect(JSON.parse(stored).message).toBe('onboard_failed');
  });
});
