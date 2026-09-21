import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Third ZATCA env: developer portal (sandbox) + sk_sandbox_ API key prefix.
 */
export class AddDeveloperPortalEnv1740000000006 implements MigrationInterface {
  name = 'AddDeveloperPortalEnv1740000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "zatca_environment" ADD VALUE IF NOT EXISTS 'developer_portal'`,
    );
    await queryRunner.query(
      `ALTER TYPE "api_key_prefix" ADD VALUE IF NOT EXISTS 'sk_sandbox_'`,
    );
  }

  public async down(): Promise<void> {
    // Postgres cannot remove enum values safely; leave types intact.
  }
}
