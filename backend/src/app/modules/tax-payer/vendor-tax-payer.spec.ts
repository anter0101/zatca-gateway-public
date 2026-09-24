import { HttpStatus } from '@nestjs/common';
import { TaxPayer } from './tax-payer.entity';
import { TaxPayerService } from './tax-payer.service';
import { mapCreateTaxPayerDtoToEntity } from './tax-payer.mapper';
import { CreateTaxPayerDTO } from './dtos/create-tax-payer.dto';
import { requireApiKeyVendor } from './require-api-key-vendor';
import { ZatcaEnvironment } from 'src/core/enums/zatca-environment';
import { SoftwareVendor } from 'src/app/modules/vendor/software-vendor.entity';
import { ApiErrorException } from 'src/core/filters/api-exception.filter';

function createDto(): CreateTaxPayerDTO {
  return {
    vatNumber: '399999999900003',
    legalName: ' Test Seller ',
    organizationUnitName: ' HQ ',
    locationAddress: 'RRRD2929',
    industryBusinessCategory: ' retail ',
  } as CreateTaxPayerDTO;
}

describe('requireApiKeyVendor', () => {
  it('rejects a JWT caller with no vendor', () => {
    expect(() => requireApiKeyVendor(null)).toThrow(ApiErrorException);
    try {
      requireApiKeyVendor(null);
    } catch (err) {
      const ex = err as ApiErrorException;
      expect(ex.getStatus()).toBe(HttpStatus.FORBIDDEN);
      expect((ex.getResponse() as { error: { code: string } }).error.code).toBe(
        'api_key_required',
      );
    }
  });
});

describe('mapCreateTaxPayerDtoToEntity', () => {
  it('binds vendor id and ZATCA environment from the API key', () => {
    const entity = mapCreateTaxPayerDtoToEntity(
      createDto(),
      7,
      ZatcaEnvironment.DEVELOPER_PORTAL,
    );
    expect(entity.vendorId).toBe(7);
    expect(entity.zatcaEnvironment).toBe(ZatcaEnvironment.DEVELOPER_PORTAL);
    expect(entity.legalName).toBe('Test Seller');
  });
});

describe('TaxPayerService.findOneOrFail', () => {
  it('looks up only the caller vendor and returns 404 for another vendor row', async () => {
    const findOne = jest.fn().mockResolvedValue(null);
    const vendorService = {
      findByIdOrFail: jest.fn().mockResolvedValue({ id: 1 }),
    };
    const service = new TaxPayerService(
      { findOne } as never,
      vendorService as never,
    );

    await expect(service.findOneOrFail(1, 9)).rejects.toBeInstanceOf(
      ApiErrorException,
    );
    expect(findOne).toHaveBeenCalledWith({
      where: { id: 9, vendorId: 1 },
    });

    try {
      await service.findOneOrFail(1, 9);
    } catch (err) {
      const ex = err as ApiErrorException;
      expect(ex.getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect((ex.getResponse() as { error: { code: string } }).error.code).toBe(
        'tax_payer_not_found',
      );
    }
  });

  it('returns the row when it belongs to the vendor', async () => {
    const owned = { id: 9, vendorId: 1 } as TaxPayer;
    const findOne = jest.fn().mockResolvedValue(owned);
    const service = new TaxPayerService(
      { findOne } as never,
      { findByIdOrFail: jest.fn() } as never,
    );
    await expect(service.findOneOrFail(1, 9)).resolves.toBe(owned);
  });
});

describe('vendor caller identity', () => {
  it('uses the vendor object id from the key', () => {
    const vendor = { id: 4 } as SoftwareVendor;
    expect(requireApiKeyVendor(vendor).id).toBe(4);
  });
});
