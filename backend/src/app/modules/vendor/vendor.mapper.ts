/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { SoftwareVendor } from './software-vendor.entity';
import { VendorDTO } from './dtos/vendor.dto';
import { CreateVendorDTO } from './dtos/create-vendor.dto';
import { UpdateVendorDTO } from './dtos/update-vendor.dto';
import { BaseDTO } from 'src/core/utils/base.dto';
import { SoftwareVendorStatus } from 'src/core/enums/software-vendor-status';

const allowedVendorDtoKeys: ReadonlyArray<keyof VendorDTO | keyof BaseDTO> = [
  'id',
  'name',
  'slug',
  'status',
  'createdAt',
  'createdBy',
  'updatedAt',
  'updatedBy',
  'deletedAt',
  'deletedBy',
] as const;

export function mapVendorToDtoSelective(
  vendor: SoftwareVendor,
  keys?: (keyof VendorDTO | keyof BaseDTO)[],
): Partial<VendorDTO>;
export function mapVendorToDtoSelective(
  vendors: SoftwareVendor[],
  keys?: (keyof VendorDTO | keyof BaseDTO)[],
): Partial<VendorDTO>[];
export function mapVendorToDtoSelective(
  vendorOrVendors: SoftwareVendor | SoftwareVendor[],
  keys?: (keyof VendorDTO | keyof BaseDTO)[],
): Partial<VendorDTO> | Partial<VendorDTO>[] {
  const mapSingle = (vendor: SoftwareVendor): Partial<VendorDTO> => {
    const dto: Partial<VendorDTO> = {};
    const keysToMap = (keys || allowedVendorDtoKeys).filter((key) =>
      allowedVendorDtoKeys.includes(key),
    );

    keysToMap.forEach((key) => {
      if (key in vendor && vendor[key as keyof SoftwareVendor] !== undefined) {
        (dto as any)[key] = vendor[key as keyof SoftwareVendor];
      }
    });

    return dto;
  };

  return Array.isArray(vendorOrVendors)
    ? vendorOrVendors.map(mapSingle)
    : mapSingle(vendorOrVendors);
}

export const mapCreateVendorDtoToEntity = (
  dto: CreateVendorDTO,
): SoftwareVendor => {
  const vendor = new SoftwareVendor();
  vendor.name = dto.name.trim();
  if (dto.slug !== undefined) {
    vendor.slug = dto.slug.trim();
  }
  vendor.status = dto.status ?? SoftwareVendorStatus.ACTIVE;
  return vendor;
};

export const mapUpdateVendorDtoToEntity = (
  dto: UpdateVendorDTO,
  existing: SoftwareVendor,
): SoftwareVendor => {
  const vendor = new SoftwareVendor();
  vendor.id = existing.id;
  vendor.name = dto.name !== undefined ? dto.name.trim() : existing.name;
  vendor.slug = dto.slug !== undefined ? dto.slug.trim() : existing.slug;
  vendor.status = dto.status !== undefined ? dto.status : existing.status;
  vendor.createdBy = existing.createdBy;
  vendor.createdAt = existing.createdAt;
  return vendor;
};
