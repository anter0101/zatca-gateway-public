import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { BaseEntity } from 'src/core/utils/base.entity';
import { TaxPayerInvoiceType } from 'src/core/enums/tax-payer-invoice-type';
import { TaxPayerStatus } from 'src/core/enums/tax-payer-status';
import { ZatcaEnvironment } from 'src/core/enums/zatca-environment';
import { OnboardStatus } from 'src/core/enums/onboard-status';
import { OnboardStep } from 'src/core/enums/onboard-step';
import { SoftwareVendor } from 'src/app/modules/vendor/software-vendor.entity';

@Entity('tax_payers')
export class TaxPayer extends BaseEntity {
  @Column({ name: 'vendor_id', type: 'int4', nullable: false })
  vendorId: number;

  @ManyToOne(() => SoftwareVendor, (vendor) => vendor.taxPayers)
  @JoinColumn({ name: 'vendor_id' })
  vendor?: SoftwareVendor;

  @Column({ name: 'vat_number', type: 'varchar', length: 15, nullable: false })
  vatNumber: string;

  @Column({ name: 'legal_name', type: 'varchar', nullable: false })
  legalName: string;

  @Column({ name: 'organization_unit_name', type: 'varchar', nullable: false })
  organizationUnitName: string;

  @Column({ name: 'location_address', type: 'varchar', nullable: false })
  locationAddress: string;

  @Column({
    name: 'industry_business_category',
    type: 'varchar',
    nullable: false,
  })
  industryBusinessCategory: string;

  @Column({
    name: 'invoice_type',
    type: 'enum',
    enum: TaxPayerInvoiceType,
    enumName: 'tax_payer_invoice_type',
    default: TaxPayerInvoiceType.BOTH,
    nullable: false,
  })
  invoiceType: TaxPayerInvoiceType;

  @Column({ type: 'varchar', length: 2, default: 'SA', nullable: false })
  country: string;

  @Column({
    type: 'enum',
    enum: TaxPayerStatus,
    enumName: 'tax_payer_status',
    default: TaxPayerStatus.DRAFT,
    nullable: false,
  })
  status: TaxPayerStatus;

  @Column({
    name: 'zatca_environment',
    type: 'enum',
    enum: ZatcaEnvironment,
    enumName: 'zatca_environment',
    nullable: true,
  })
  zatcaEnvironment?: ZatcaEnvironment | null;

  @Column({ name: 'street_name', type: 'varchar', nullable: true })
  streetName?: string | null;

  @Column({ name: 'building_number', type: 'varchar', nullable: true })
  buildingNumber?: string | null;

  @Column({ type: 'varchar', nullable: true })
  district?: string | null;

  @Column({ type: 'varchar', nullable: true })
  city?: string | null;

  @Column({ name: 'postal_zone', type: 'varchar', nullable: true })
  postalZone?: string | null;

  @Column({
    name: 'seller_id_scheme',
    type: 'varchar',
    default: 'CRN',
    nullable: true,
  })
  sellerIdScheme?: string | null;

  @Column({ name: 'seller_id_value', type: 'varchar', nullable: true })
  sellerIdValue?: string | null;

  @Column({ name: 'csr_config', type: 'jsonb', nullable: true })
  csrConfig?: Record<string, unknown> | null;

  @Column({ name: 'private_key_encrypted', type: 'text', nullable: true })
  privateKeyEncrypted?: string | null;

  @Column({ name: 'csr_pem', type: 'text', nullable: true })
  csrPem?: string | null;

  @Column({ name: 'compliance_request_id', type: 'varchar', nullable: true })
  complianceRequestId?: string | null;

  @Column({ name: 'compliance_csid', type: 'text', nullable: true })
  complianceCsid?: string | null;

  @Column({ name: 'compliance_csid_secret', type: 'text', nullable: true })
  complianceCsidSecret?: string | null;

  @Column({ name: 'production_csid', type: 'text', nullable: true })
  productionCsid?: string | null;

  @Column({ name: 'production_csid_secret', type: 'text', nullable: true })
  productionCsidSecret?: string | null;

  @Column({ type: 'bigint', default: 0, nullable: false })
  icv: string;

  @Column({ name: 'last_pih', type: 'varchar', nullable: true })
  lastPih?: string | null;

  @Column({
    name: 'onboard_status',
    type: 'enum',
    enum: OnboardStatus,
    enumName: 'onboard_status',
    nullable: true,
  })
  onboardStatus?: OnboardStatus | null;

  @Column({
    name: 'onboard_step',
    type: 'enum',
    enum: OnboardStep,
    enumName: 'onboard_step',
    nullable: true,
  })
  onboardStep?: OnboardStep | null;

  @Column({ name: 'onboard_progress', type: 'int4', nullable: true })
  onboardProgress?: number | null;

  @Column({ name: 'onboard_compliance_done', type: 'int4', nullable: true })
  onboardComplianceDone?: number | null;

  @Column({ name: 'onboard_error', type: 'text', nullable: true })
  onboardError?: string | null;

  @Column({ name: 'onboard_job_id', type: 'varchar', nullable: true })
  onboardJobId?: string | null;
}
