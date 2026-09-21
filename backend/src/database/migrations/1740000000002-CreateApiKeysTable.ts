import { ApiKeyPrefix } from 'src/core/enums/api-key-prefix';
import { baseColumns } from 'src/core/utils/base.migration';
import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateApiKeysTable1740000000002 implements MigrationInterface {
  private table = 'api_keys';

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
            name: 'prefix',
            type: 'enum',
            enum: [ApiKeyPrefix.SK_TEST, ApiKeyPrefix.SK_LIVE],
            enumName: 'api_key_prefix',
            isNullable: false,
          },
          {
            name: 'key_hash',
            type: 'varchar',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'last4',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'expires_at',
            type: 'timestamptz',
            isNullable: false,
          },
          {
            name: 'last_used_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'revoked_at',
            type: 'timestamptz',
            isNullable: true,
          },
          ...otherBaseColumns,
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
    await queryRunner.query(`DROP TYPE IF EXISTS "api_key_prefix"`);
  }
}
