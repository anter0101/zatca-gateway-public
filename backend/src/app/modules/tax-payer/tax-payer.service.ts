import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOneOptions, Not, Repository } from 'typeorm';
import { TaxPayer } from './tax-payer.entity';
import { VendorService } from 'src/app/modules/vendor/vendor.service';
import { ApiErrorException } from 'src/core/filters/api-exception.filter';

@Injectable()
export class TaxPayerService {
  constructor(
    @InjectRepository(TaxPayer)
    private readonly taxPayerRepository: Repository<TaxPayer>,
    private readonly vendorService: VendorService,
  ) {}

  async findById(id: number): Promise<TaxPayer | undefined> {
    const result = await this.taxPayerRepository.findOne({ where: { id } });
    return result || undefined;
  }

  async findByFields(
    options: FindOneOptions<TaxPayer>,
  ): Promise<TaxPayer | undefined> {
    const result = await this.taxPayerRepository.findOne(options);
    return result || undefined;
  }

  async findAndCount(
    vendorId: number,
    options: FindManyOptions<TaxPayer>,
  ): Promise<[TaxPayer[], number]> {
    await this.vendorService.findByIdOrFail(vendorId);
    return this.taxPayerRepository.findAndCount({
      ...options,
      where: { ...(options.where as object), vendorId },
    });
  }

  async findOneOrFail(vendorId: number, taxPayerId: number): Promise<TaxPayer> {
    await this.vendorService.findByIdOrFail(vendorId);
    const entity = await this.taxPayerRepository.findOne({
      where: { id: taxPayerId, vendorId },
    });
    if (!entity) {
      throw new ApiErrorException(
        HttpStatus.NOT_FOUND,
        'not_found',
        'tax_payer_not_found',
        'Tax payer not found',
      );
    }
    return entity;
  }

  async save(taxPayer: TaxPayer, creator?: string): Promise<TaxPayer> {
    await this.vendorService.findByIdOrFail(taxPayer.vendorId);
    this.assertVat(taxPayer.vatNumber);
    this.assertWasel(taxPayer.locationAddress);
    await this.assertVatAvailable(taxPayer.vendorId, taxPayer.vatNumber);

    if (creator) {
      if (!taxPayer.createdBy) {
        taxPayer.createdBy = creator;
      }
      taxPayer.updatedBy = creator;
    }
    if (!taxPayer.createdAt) {
      taxPayer.createdAt = new Date();
    }

    const saved = await this.taxPayerRepository.save(taxPayer);
    return (await this.findById(saved.id))!;
  }

  async update(taxPayer: TaxPayer, updater?: string): Promise<TaxPayer> {
    const existing = await this.findOneOrFail(taxPayer.vendorId, taxPayer.id);

    this.assertVat(taxPayer.vatNumber);
    this.assertWasel(taxPayer.locationAddress);
    if (taxPayer.vatNumber !== existing.vatNumber) {
      await this.assertVatAvailable(
        taxPayer.vendorId,
        taxPayer.vatNumber,
        taxPayer.id,
      );
    }

    if (updater) {
      taxPayer.updatedBy = updater;
    }
    taxPayer.updatedAt = new Date();

    await this.taxPayerRepository.save(taxPayer);
    return (await this.findById(taxPayer.id))!;
  }

  async delete(taxPayer: TaxPayer, deleter?: string): Promise<void> {
    taxPayer.deletedBy = deleter;
    await this.taxPayerRepository.save(taxPayer);
    await this.taxPayerRepository.softRemove(taxPayer);
  }

  private assertVat(vatNumber: string): void {
    if (!/^3\d{13}3$/.test(vatNumber) || vatNumber[10] !== '0') {
      throw new ApiErrorException(
        HttpStatus.BAD_REQUEST,
        'invalid_request',
        'vat_invalid',
        'VAT must be 15 digits starting and ending with 3',
      );
    }
  }

  private assertWasel(locationAddress: string): void {
    if (!/^[A-Z]{4}\d{4}$/.test(locationAddress)) {
      throw new ApiErrorException(
        HttpStatus.BAD_REQUEST,
        'invalid_request',
        'wasel_invalid',
        'locationAddress must match Wasel pattern AAAA9999',
      );
    }
  }

  private async assertVatAvailable(
    vendorId: number,
    vatNumber: string,
    excludeId?: number,
  ): Promise<void> {
    const existing = await this.taxPayerRepository.findOne({
      where: excludeId
        ? { vendorId, vatNumber, id: Not(excludeId) }
        : { vendorId, vatNumber },
    });
    if (existing) {
      throw new ApiErrorException(
        HttpStatus.CONFLICT,
        'conflict',
        'vat_taken',
        'VAT number already exists for this vendor',
      );
    }
  }
}
