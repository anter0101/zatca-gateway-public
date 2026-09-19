import { TableColumnOptions } from 'typeorm/schema-builder/options/TableColumnOptions';

export const baseColumns: TableColumnOptions[] = [
  {
    name: 'id',
    type: 'int4',
    isPrimary: true,
    isGenerated: true,
    generationStrategy: 'increment',
  },
  {
    name: 'created_by',
    type: 'varchar',
    isNullable: true,
  },
  {
    name: 'created_at',
    type: 'timestamptz',
    isNullable: true,
    default: 'now()',
  },
  {
    name: 'updated_by',
    type: 'varchar',
    isNullable: true,
  },
  {
    name: 'updated_at',
    type: 'timestamptz',
    isNullable: true,
  },
  {
    name: 'deleted_by',
    type: 'varchar',
    isNullable: true,
  },
  {
    name: 'deleted_at',
    type: 'timestamptz',
    isNullable: true,
  },
];
