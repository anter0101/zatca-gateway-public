import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Soft-deleted tax payers must not block reusing the same VAT.
 * Replace table UNIQUE with a partial unique index on active rows only.
 */
export class SoftDeleteVatUnique1740000000005 implements MigrationInterface {
  name = 'SoftDeleteVatUnique1740000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tax_payers" DROP CONSTRAINT IF EXISTS "UQ_tax_payers_vendor_id_vat_number"`,
    );
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_tax_payers_vendor_id_vat_number_active"
      ON "tax_payers" ("vendor_id", "vat_number")
      WHERE "deleted_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_tax_payers_vendor_id_vat_number_active"`,
    );
    await queryRunner.query(`
      ALTER TABLE "tax_payers"
      ADD CONSTRAINT "UQ_tax_payers_vendor_id_vat_number"
      UNIQUE ("vendor_id", "vat_number")
    `);
  }
}
