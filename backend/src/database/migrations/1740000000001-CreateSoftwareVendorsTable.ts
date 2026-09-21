import { SoftwareVendorStatus } from 'src/core/enums/software-vendor-status';
import { baseColumns } from 'src/core/utils/base.migration';
import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateSoftwareVendorsTable1740000000001
  implements MigrationInterface
{
  private table = 'software_vendors';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const [idColumn, ...otherBaseColumns] = baseColumns;

    await queryRunner.createTable(
      new Table({
        name: this.table,
        columns: [
          idColumn,
          {
            name: 'name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'slug',
            type: 'varchar',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: [
              SoftwareVendorStatus.ACTIVE,
              SoftwareVendorStatus.SUSPENDED,
            ],
            enumName: 'software_vendor_status',
            default: `'${SoftwareVendorStatus.ACTIVE}'`,
            isNullable: false,
          },
          ...otherBaseColumns,
        ],
      }),
      false,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(this.table, true, true, true);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "software_vendor_status"`,
    );
  }
}
