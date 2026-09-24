import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { BaseEntity } from 'src/core/utils/base.entity';
import { InvoiceStatus } from 'src/core/enums/invoice-status';
import { InvoiceSubtype } from 'src/core/enums/invoice-subtype';
import { InvoiceTypeCode } from 'src/core/enums/invoice-type-code';
import { SoftwareVendor } from 'src/app/modules/vendor/software-vendor.entity';
import { TaxPayer } from 'src/app/modules/tax-payer/tax-payer.entity';
import { ApiKey } from 'src/app/modules/api-key/api-key.entity';

@Entity('invoices')
export class Invoice extends BaseEntity {
  @Column({ name: 'vendor_id', type: 'int4' })
  vendorId!: number;

  @ManyToOne(() => SoftwareVendor)
  @JoinColumn({ name: 'vendor_id' })
  vendor?: SoftwareVendor;

  @Column({ name: 'tax_payer_id', type: 'int4' })
  taxPayerId!: number;

  @ManyToOne(() => TaxPayer)
  @JoinColumn({ name: 'tax_payer_id' })
  taxPayer?: TaxPayer;

  @Column({ name: 'api_key_id', type: 'int4', nullable: true })
  apiKeyId?: number | null;

  @ManyToOne(() => ApiKey)
  @JoinColumn({ name: 'api_key_id' })
  apiKey?: ApiKey;

  @Column({ type: 'uuid' })
  uuid!: string;

  @Column({ name: 'document_number', type: 'varchar' })
  documentNumber!: string;

  @Column({ name: 'idempotency_key', type: 'varchar', nullable: true })
  idempotencyKey?: string | null;

  @Column({
    name: 'type_code',
    type: 'enum',
    enum: InvoiceTypeCode,
    enumName: 'invoice_type_code',
  })
  typeCode!: InvoiceTypeCode;

  @Column({
    type: 'enum',
    enum: InvoiceSubtype,
    enumName: 'invoice_subtype',
  })
  subtype!: InvoiceSubtype;

  @Column({ name: 'ksa2_name', type: 'varchar', nullable: true })
  ksa2Name?: string | null;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    enumName: 'invoice_status',
    default: InvoiceStatus.RECEIVED,
  })
  status!: InvoiceStatus;

  @Column({ name: 'original_invoice_id', type: 'int4', nullable: true })
  originalInvoiceId?: number | null;

  @ManyToOne(() => Invoice)
  @JoinColumn({ name: 'original_invoice_id' })
  originalInvoice?: Invoice;

  @Column({ type: 'jsonb' })
  payload!: Record<string, unknown>;

  @Column({ type: 'bigint', nullable: true })
  icv?: string | null;

  @Column({ type: 'varchar', nullable: true })
  pih?: string | null;

  @Column({ name: 'invoice_hash', type: 'varchar', nullable: true })
  invoiceHash?: string | null;

  @Column({ name: 'qr_base64', type: 'text', nullable: true })
  qrBase64?: string | null;

  @Column({ name: 'unsigned_xml', type: 'text', nullable: true })
  unsignedXml?: string | null;

  @Column({ name: 'signed_xml', type: 'text', nullable: true })
  signedXml?: string | null;

  @Column({ name: 'cleared_xml', type: 'text', nullable: true })
  clearedXml?: string | null;

  @Column({ name: 'zatca_request', type: 'jsonb', nullable: true })
  zatcaRequest?: Record<string, unknown> | null;

  @Column({ name: 'zatca_response', type: 'jsonb', nullable: true })
  zatcaResponse?: Record<string, unknown> | null;

  @Column({ name: 'job_id', type: 'varchar', nullable: true })
  jobId?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  error?: Record<string, unknown> | null;
}
