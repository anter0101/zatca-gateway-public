import { UserRole } from 'src/core/enums/user-role';
import { baseColumns } from 'src/core/utils/base.migration';
import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateUserTable1720796623509 implements MigrationInterface {
  private table = 'users';
  public async up(queryRunner: QueryRunner): Promise<void> {
    const [idColumn, ...otherBaseColumns] = baseColumns;

    await queryRunner.createTable(
      new Table({
        name: this.table,
        columns: [
          idColumn,
          {
            name: 'email',
            type: 'varchar',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'password',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'username',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'activated',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'image_url',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'role',
            type: 'enum',
            enum: [UserRole.ADMIN, UserRole.USER],
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
  }
}
