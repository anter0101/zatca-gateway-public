import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';

/**
 * Invoice API keys belong to one tax payer.
 * Document numbers are issued from a per-tax-payer sequence.
 */
export class TaxPayerInvoiceKey1740000000007 implements MigrationInterface {
  name = 'TaxPayerInvoiceKey1740000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tax_payers" ADD COLUMN IF NOT EXISTS "document_seq" bigint NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "api_keys" ADD COLUMN IF NOT EXISTS "tax_payer_id" int4`,
    );
    await queryRunner.createForeignKey(
      'api_keys',
      new TableForeignKey({
        columnNames: ['tax_payer_id'],
        referencedTableName: 'tax_payers',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "UQ_invoices_vendor_id_idempotency_key"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ADD CONSTRAINT "UQ_invoices_tax_payer_idempotency" UNIQUE ("tax_payer_id", "idempotency_key")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "UQ_invoices_tax_payer_idempotency"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ADD CONSTRAINT "UQ_invoices_vendor_id_idempotency_key" UNIQUE ("vendor_id", "idempotency_key")`,
    );
    const table = await queryRunner.getTable('api_keys');
    const fk = table?.foreignKeys.find((key) =>
      key.columnNames.includes('tax_payer_id'),
    );
    if (fk) {
      await queryRunner.dropForeignKey('api_keys', fk);
    }
    await queryRunner.query(`ALTER TABLE "api_keys" DROP COLUMN IF EXISTS "tax_payer_id"`);
    await queryRunner.query(
      `ALTER TABLE "tax_payers" DROP COLUMN IF EXISTS "document_seq"`,
    );
  }
}
