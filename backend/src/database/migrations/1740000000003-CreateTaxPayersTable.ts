import { OnboardStatus } from 'src/core/enums/onboard-status';
import { OnboardStep } from 'src/core/enums/onboard-step';
import { TaxPayerInvoiceType } from 'src/core/enums/tax-payer-invoice-type';
import { TaxPayerStatus } from 'src/core/enums/tax-payer-status';
import { ZatcaEnvironment } from 'src/core/enums/zatca-environment';
import { baseColumns } from 'src/core/utils/base.migration';
import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableUnique,
} from 'typeorm';

export class CreateTaxPayersTable1740000000003 implements MigrationInterface {
  private table = 'tax_payers';

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
            name: 'vat_number',
            type: 'varchar',
            length: '15',
            isNullable: false,
          },
          {
            name: 'legal_name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'organization_unit_name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'location_address',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'industry_business_category',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'invoice_type',
            type: 'enum',
            enum: [
              TaxPayerInvoiceType.BOTH,
              TaxPayerInvoiceType.STANDARD,
              TaxPayerInvoiceType.SIMPLIFIED,
            ],
            enumName: 'tax_payer_invoice_type',
            default: `'${TaxPayerInvoiceType.BOTH}'`,
            isNullable: false,
          },
          {
            name: 'country',
            type: 'varchar',
            length: '2',
            default: `'SA'`,
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: [
              TaxPayerStatus.DRAFT,
              TaxPayerStatus.ONBOARDED,
              TaxPayerStatus.SUSPENDED,
            ],
            enumName: 'tax_payer_status',
            default: `'${TaxPayerStatus.DRAFT}'`,
            isNullable: false,
          },
          {
            name: 'zatca_environment',
            type: 'enum',
            enum: [
              ZatcaEnvironment.SIMULATION,
              ZatcaEnvironment.PRODUCTION,
            ],
            enumName: 'zatca_environment',
            isNullable: true,
          },
          {
            name: 'street_name',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'building_number',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'district',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'city',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'postal_zone',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'seller_id_scheme',
            type: 'varchar',
            default: `'CRN'`,
            isNullable: true,
          },
          {
            name: 'seller_id_value',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'csr_config',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'private_key_encrypted',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'csr_pem',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'compliance_request_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'compliance_csid',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'compliance_csid_secret',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'production_csid',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'production_csid_secret',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'icv',
            type: 'bigint',
            default: 0,
            isNullable: false,
          },
          {
            name: 'last_pih',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'onboard_status',
            type: 'enum',
            enum: [
              OnboardStatus.IDLE,
              OnboardStatus.CSR_CREATED,
              OnboardStatus.QUEUED,
              OnboardStatus.RUNNING,
              OnboardStatus.ONBOARDED,
              OnboardStatus.FAILED,
            ],
            enumName: 'onboard_status',
            isNullable: true,
          },
          {
            name: 'onboard_step',
            type: 'enum',
            enum: [
              OnboardStep.CSR,
              OnboardStep.CSID,
              OnboardStep.COMPLIANCE,
              OnboardStep.PCSID,
              OnboardStep.DONE,
            ],
            enumName: 'onboard_step',
            isNullable: true,
          },
          {
            name: 'onboard_progress',
            type: 'int4',
            isNullable: true,
          },
          {
            name: 'onboard_compliance_done',
            type: 'int4',
            isNullable: true,
          },
          {
            name: 'onboard_error',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'onboard_job_id',
            type: 'varchar',
            isNullable: true,
          },
          ...otherBaseColumns,
        ],
        uniques: [
          new TableUnique({
            name: 'UQ_tax_payers_vendor_id_vat_number',
            columnNames: ['vendor_id', 'vat_number'],
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(this.table, true, true, true);
    await queryRunner.query(`DROP TYPE IF EXISTS "tax_payer_invoice_type"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "tax_payer_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "zatca_environment"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "onboard_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "onboard_step"`);
  }
}
