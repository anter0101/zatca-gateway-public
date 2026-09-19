import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import * as path from 'path';

@Injectable()
export default class PostgresTypeorm implements TypeOrmOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      logging: this.getBoolean('DATABASE_LOGGING', true),
      synchronize: this.getBoolean('DATABASE_SYNCHRONIZE', false),
      migrationsRun: this.getBoolean(
        'DATABASE_MIGRATIONS_RUN',
        true,
      ),
      entities: [path.join(__dirname, '..', '**', '*.entity.{ts,js}')],
      migrations: [
        path.join(__dirname, '..', 'database/migrations', '**', '*{.ts,.js}'),
      ],
      database: this.configService.get<string>('DATABASE_NAME'),
      host: this.configService.get<string>('DATABASE_HOST'),
      port: Number(this.configService.get<number>('DATABASE_PORT', 5432)),
      username: this.configService.get<string>('DATABASE_USER'),
      password: this.configService.get<string>('DATABASE_PASSWORD'),
      // ssl: this.getBoolean('DATABASE_SSL', true)
      //   ? { rejectUnauthorized: false }
      //   : false,
    };
  }

  private getBoolean(key: string, defaultValue: boolean): boolean {
    const value = this.configService.get<string | boolean>(key, defaultValue);

    return typeof value === 'boolean' ? value : value === 'true';
  }
}
