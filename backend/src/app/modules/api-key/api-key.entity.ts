import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { BaseEntity } from 'src/core/utils/base.entity';
import { ApiKeyPrefix } from 'src/core/enums/api-key-prefix';
import { SoftwareVendor } from 'src/app/modules/vendor/software-vendor.entity';

@Entity('api_keys')
export class ApiKey extends BaseEntity {
  @Column({ name: 'vendor_id', type: 'int4', nullable: false })
  vendorId!: number;

  @Column({ name: 'tax_payer_id', type: 'int4', nullable: true })
  taxPayerId?: number | null;

  @ManyToOne(() => SoftwareVendor, (vendor) => vendor.apiKeys)
  @JoinColumn({ name: 'vendor_id' })
  vendor?: SoftwareVendor;

  @Column({
    type: 'enum',
    enum: ApiKeyPrefix,
    enumName: 'api_key_prefix',
    nullable: false,
  })
  prefix!: ApiKeyPrefix;

  @Column({ name: 'key_hash', type: 'varchar', unique: true, nullable: false })
  keyHash!: string;

  @Column({ type: 'varchar', nullable: false })
  last4!: string;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: false })
  expiresAt!: Date;

  @Column({ name: 'last_used_at', type: 'timestamptz', nullable: true })
  lastUsedAt?: Date | null;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt?: Date | null;
}
