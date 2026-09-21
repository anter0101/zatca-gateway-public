/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { TaxPayer } from './tax-payer.entity';
import { TaxPayerDTO } from './dtos/tax-payer.dto';
import { CreateTaxPayerDTO } from './dtos/create-tax-payer.dto';
import { UpdateTaxPayerDTO } from './dtos/update-tax-payer.dto';
import { BaseDTO } from 'src/core/utils/base.dto';
import { TaxPayerInvoiceType } from 'src/core/enums/tax-payer-invoice-type';
import { TaxPayerStatus } from 'src/core/enums/tax-payer-status';

const allowedTaxPayerDtoKeys: ReadonlyArray<keyof TaxPayerDTO | keyof BaseDTO> =
  [
    'id',
    'vendorId',
    'vatNumber',
    'legalName',
    'organizationUnitName',
    'locationAddress',
    'industryBusinessCategory',
    'invoiceType',
    'country',
    'status',
    'streetName',
    'buildingNumber',
    'district',
    'city',
    'postalZone',
    'sellerIdScheme',
    'sellerIdValue',
    'createdAt',
    'createdBy',
    'updatedAt',
    'updatedBy',
    'deletedAt',
    'deletedBy',
  ] as const;

export function mapTaxPayerToDtoSelective(
  taxPayer: TaxPayer,
  keys?: (keyof TaxPayerDTO | keyof BaseDTO)[],
): Partial<TaxPayerDTO>;
export function mapTaxPayerToDtoSelective(
  taxPayers: TaxPayer[],
  keys?: (keyof TaxPayerDTO | keyof BaseDTO)[],
): Partial<TaxPayerDTO>[];
export function mapTaxPayerToDtoSelective(
  taxPayerOrTaxPayers: TaxPayer | TaxPayer[],
  keys?: (keyof TaxPayerDTO | keyof BaseDTO)[],
): Partial<TaxPayerDTO> | Partial<TaxPayerDTO>[] {
  const mapSingle = (taxPayer: TaxPayer): Partial<TaxPayerDTO> => {
    const dto: Partial<TaxPayerDTO> = {};
    const keysToMap = (keys || allowedTaxPayerDtoKeys).filter((key) =>
      allowedTaxPayerDtoKeys.includes(key),
    );

    keysToMap.forEach((key) => {
      if (key in taxPayer && taxPayer[key as keyof TaxPayer] !== undefined) {
        (dto as any)[key] = taxPayer[key as keyof TaxPayer];
      }
    });

    return dto;
  };

  return Array.isArray(taxPayerOrTaxPayers)
    ? taxPayerOrTaxPayers.map(mapSingle)
    : mapSingle(taxPayerOrTaxPayers);
}

export const mapCreateTaxPayerDtoToEntity = (
  dto: CreateTaxPayerDTO,
  vendorId: number,
): TaxPayer => {
  const taxPayer = new TaxPayer();
  taxPayer.vendorId = vendorId;
  taxPayer.vatNumber = dto.vatNumber;
  taxPayer.legalName = dto.legalName.trim();
  taxPayer.organizationUnitName = dto.organizationUnitName.trim();
  taxPayer.locationAddress = dto.locationAddress;
  taxPayer.industryBusinessCategory = dto.industryBusinessCategory.trim();
  taxPayer.invoiceType = dto.invoiceType ?? TaxPayerInvoiceType.BOTH;
  taxPayer.country = 'SA';
  taxPayer.status = TaxPayerStatus.DRAFT;
  taxPayer.streetName = dto.streetName ?? null;
  taxPayer.buildingNumber = dto.buildingNumber ?? null;
  taxPayer.district = dto.district ?? null;
  taxPayer.city = dto.city ?? null;
  taxPayer.postalZone = dto.postalZone ?? null;
  taxPayer.sellerIdScheme = dto.sellerIdScheme ?? 'CRN';
  taxPayer.sellerIdValue = dto.sellerIdValue ?? null;
  taxPayer.icv = '0';
  return taxPayer;
};

export const mapUpdateTaxPayerDtoToEntity = (
  dto: UpdateTaxPayerDTO,
  existing: TaxPayer,
): TaxPayer => {
  const taxPayer = new TaxPayer();
  taxPayer.id = existing.id;
  taxPayer.vendorId = existing.vendorId;
  taxPayer.vatNumber =
    dto.vatNumber !== undefined ? dto.vatNumber : existing.vatNumber;
  taxPayer.legalName =
    dto.legalName !== undefined
      ? dto.legalName.trim()
      : existing.legalName;
  taxPayer.organizationUnitName =
    dto.organizationUnitName !== undefined
      ? dto.organizationUnitName.trim()
      : existing.organizationUnitName;
  taxPayer.locationAddress =
    dto.locationAddress !== undefined
      ? dto.locationAddress
      : existing.locationAddress;
  taxPayer.industryBusinessCategory =
    dto.industryBusinessCategory !== undefined
      ? dto.industryBusinessCategory.trim()
      : existing.industryBusinessCategory;
  taxPayer.invoiceType =
    dto.invoiceType !== undefined ? dto.invoiceType : existing.invoiceType;
  taxPayer.country = existing.country;
  taxPayer.status = existing.status;
  taxPayer.streetName =
    dto.streetName !== undefined ? dto.streetName : existing.streetName;
  taxPayer.buildingNumber =
    dto.buildingNumber !== undefined
      ? dto.buildingNumber
      : existing.buildingNumber;
  taxPayer.district =
    dto.district !== undefined ? dto.district : existing.district;
  taxPayer.city = dto.city !== undefined ? dto.city : existing.city;
  taxPayer.postalZone =
    dto.postalZone !== undefined ? dto.postalZone : existing.postalZone;
  taxPayer.sellerIdScheme =
    dto.sellerIdScheme !== undefined
      ? dto.sellerIdScheme
      : existing.sellerIdScheme;
  taxPayer.sellerIdValue =
    dto.sellerIdValue !== undefined
      ? dto.sellerIdValue
      : existing.sellerIdValue;
  taxPayer.createdBy = existing.createdBy;
  taxPayer.createdAt = existing.createdAt;
  taxPayer.icv = existing.icv;
  taxPayer.zatcaEnvironment = existing.zatcaEnvironment;
  taxPayer.csrConfig = existing.csrConfig;
  taxPayer.privateKeyEncrypted = existing.privateKeyEncrypted;
  taxPayer.csrPem = existing.csrPem;
  taxPayer.complianceRequestId = existing.complianceRequestId;
  taxPayer.complianceCsid = existing.complianceCsid;
  taxPayer.complianceCsidSecret = existing.complianceCsidSecret;
  taxPayer.productionCsid = existing.productionCsid;
  taxPayer.productionCsidSecret = existing.productionCsidSecret;
  taxPayer.lastPih = existing.lastPih;
  taxPayer.onboardStatus = existing.onboardStatus;
  taxPayer.onboardStep = existing.onboardStep;
  taxPayer.onboardProgress = existing.onboardProgress;
  taxPayer.onboardComplianceDone = existing.onboardComplianceDone;
  taxPayer.onboardError = existing.onboardError;
  taxPayer.onboardJobId = existing.onboardJobId;
  return taxPayer;
};
