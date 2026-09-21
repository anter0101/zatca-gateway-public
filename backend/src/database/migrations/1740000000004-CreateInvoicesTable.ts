import { InvoiceStatus } from 'src/core/enums/invoice-status';
import { InvoiceSubtype } from 'src/core/enums/invoice-subtype';
import { InvoiceTypeCode } from 'src/core/enums/invoice-type-code';
import { baseColumns } from 'src/core/utils/base.migration';
import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableUnique,
} from 'typeorm';

export class CreateInvoicesTable1740000000004 implements MigrationInterface {
  private table = 'invoices';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const [idColumn, ...otherBaseColumns] = baseColumns;

    await queryRunner.createTable(
      new Table({
        name: this.table,
        columns: [
          idColumn,
          {
            name: 'vendor_id',
            type: 'int4',
            isNullable: false,
          },
          {
            name: 'tax_payer_id',
            type: 'int4',
            isNullable: false,
          },
          {
            name: 'api_key_id',
            type: 'int4',
            isNullable: true,
          },
          {
            name: 'uuid',
            type: 'uuid',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'document_number',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'idempotency_key',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'type_code',
            type: 'enum',
            enum: [
              InvoiceTypeCode.INVOICE,
              InvoiceTypeCode.CREDIT,
              InvoiceTypeCode.DEBIT,
            ],
            enumName: 'invoice_type_code',
            isNullable: false,
          },
          {
            name: 'subtype',
            type: 'enum',
            enum: [InvoiceSubtype.STANDARD, InvoiceSubtype.SIMPLIFIED],
            enumName: 'invoice_subtype',
            isNullable: false,
          },
          {
            name: 'ksa2_name',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: [
              InvoiceStatus.RECEIVED,
              InvoiceStatus.QUEUED,
              InvoiceStatus.SIGNED,
              InvoiceStatus.SUBMITTED,
              InvoiceStatus.CLEARED,
              InvoiceStatus.REPORTED,
              InvoiceStatus.REJECTED,
              InvoiceStatus.FAILED,
            ],
            enumName: 'invoice_status',
            default: `'${InvoiceStatus.RECEIVED}'`,
            isNullable: false,
          },
          {
            name: 'original_invoice_id',
            type: 'int4',
            isNullable: true,
          },
          {
            name: 'payload',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'icv',
            type: 'bigint',
            isNullable: true,
          },
          {
            name: 'pih',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'invoice_hash',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'qr_base64',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'unsigned_xml',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'signed_xml',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'cleared_xml',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'zatca_request',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'zatca_response',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'job_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'error',
            type: 'jsonb',
            isNullable: true,
          },
          ...otherBaseColumns,
        ],
        uniques: [
          new TableUnique({
            name: 'UQ_invoices_vendor_id_idempotency_key',
            columnNames: ['vendor_id', 'idempotency_key'],
          }),
        ],
      }),
      false,
    );

    await queryRunner.createForeignKey(
      this.table,
      new TableForeignKey({
        columnNames: ['vendor_id'],
        referencedTableName: 'software_vendors',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );

    await queryRunner.createForeignKey(
      this.table,
      new TableForeignKey({
        columnNames: ['tax_payer_id'],
        referencedTableName: 'tax_payers',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );

    await queryRunner.createForeignKey(
      this.table,
      new TableForeignKey({
        columnNames: ['api_key_id'],
        referencedTableName: 'api_keys',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );

    await queryRunner.createForeignKey(
      this.table,
      new TableForeignKey({
        columnNames: ['original_invoice_id'],
        referencedTableName: 'invoices',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(this.table, true, true, true);
    await queryRunner.query(`DROP TYPE IF EXISTS "invoice_type_code"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "invoice_subtype"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "invoice_status"`);
  }
}
