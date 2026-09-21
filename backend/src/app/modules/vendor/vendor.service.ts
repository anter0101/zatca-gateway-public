import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOneOptions, FindOptionsWhere, Not, Repository } from 'typeorm';
import { SoftwareVendor } from './software-vendor.entity';
import { slugify } from 'src/core/utils/slugify';
import { ApiErrorException } from 'src/core/filters/api-exception.filter';
import { TaxPayer } from 'src/app/modules/tax-payer/tax-payer.entity';

@Injectable()
export class VendorService {
  constructor(
    @InjectRepository(SoftwareVendor)
    private readonly vendorRepository: Repository<SoftwareVendor>,
    @InjectRepository(TaxPayer)
    private readonly taxPayerRepository: Repository<TaxPayer>,
  ) {}

  async findById(id: number): Promise<SoftwareVendor | undefined> {
    const result = await this.vendorRepository.findOne({ where: { id } });
    return result || undefined;
  }

  async findByFields(
    options: FindOneOptions<SoftwareVendor>,
  ): Promise<SoftwareVendor | undefined> {
    const result = await this.vendorRepository.findOne(options);
    return result || undefined;
  }

  async findAndCount(
    options: FindManyOptions<SoftwareVendor>,
  ): Promise<[SoftwareVendor[], number]> {
    return this.vendorRepository.findAndCount(options);
  }

  async findByIdOrFail(id: number): Promise<SoftwareVendor> {
    const vendor = await this.findById(id);
    if (!vendor) {
      throw new ApiErrorException(
        HttpStatus.NOT_FOUND,
        'not_found',
        'vendor_not_found',
        'Vendor not found',
      );
    }
    return vendor;
  }

  async save(vendor: SoftwareVendor, creator?: string): Promise<SoftwareVendor> {
    const baseSlug = vendor.slug?.trim() || slugify(vendor.name);
    vendor.slug = await this.ensureUniqueSlug(baseSlug);
    vendor.name = vendor.name.trim();

    if (creator) {
      if (!vendor.createdBy) {
        vendor.createdBy = creator;
      }
      vendor.updatedBy = creator;
    }
    if (!vendor.createdAt) {
      vendor.createdAt = new Date();
    }

    const saved = await this.vendorRepository.save(vendor);
    return (await this.findById(saved.id))!;
  }

  async update(
    vendor: SoftwareVendor,
    updater?: string,
  ): Promise<SoftwareVendor> {
    const existing = await this.findByIdOrFail(vendor.id);

    if (vendor.slug !== existing.slug) {
      await this.assertSlugAvailable(vendor.slug, vendor.id);
    }

    if (updater) {
      vendor.updatedBy = updater;
    }
    vendor.updatedAt = new Date();

    await this.vendorRepository.save(vendor);
    return (await this.findById(vendor.id))!;
  }

  async delete(vendor: SoftwareVendor, deleter?: string): Promise<void> {
    const taxPayerCount = await this.taxPayerRepository.count({
      where: { vendorId: vendor.id },
    });
    if (taxPayerCount > 0) {
      throw new ApiErrorException(
        HttpStatus.CONFLICT,
        'conflict',
        'vendor_has_tax_payers',
        'Cannot delete vendor that still has tax payers',
      );
    }

    vendor.deletedBy = deleter;
    await this.vendorRepository.save(vendor);
    await this.vendorRepository.softRemove(vendor);
  }

  private async ensureUniqueSlug(base: string): Promise<string> {
    let candidate = base;
    let n = 2;
    while (await this.vendorRepository.exists({ where: { slug: candidate } })) {
      candidate = `${base}-${n}`;
      n += 1;
    }
    return candidate;
  }

  private async assertSlugAvailable(
    slug: string,
    excludeId: number,
  ): Promise<void> {
    const where: FindOptionsWhere<SoftwareVendor> = {
      slug,
      id: Not(excludeId),
    };
    const taken = await this.vendorRepository.exists({ where });
    if (taken) {
      throw new ApiErrorException(
        HttpStatus.CONFLICT,
        'conflict',
        'slug_taken',
        'Vendor slug is already taken',
      );
    }
  }
}
