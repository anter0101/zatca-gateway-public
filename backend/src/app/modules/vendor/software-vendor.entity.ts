import {
  Column,
  Entity,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from 'src/core/utils/base.entity';
import { SoftwareVendorStatus } from 'src/core/enums/software-vendor-status';
import { ApiKey } from 'src/app/modules/api-key/api-key.entity';
import { TaxPayer } from 'src/app/modules/tax-payer/tax-payer.entity';

@Entity('software_vendors')
export class SoftwareVendor extends BaseEntity {
  @Column({ type: 'varchar', nullable: false })
  name!: string;

  @Column({ type: 'varchar', unique: true, nullable: false })
  slug!: string;

  @Column({
    type: 'enum',
    enum: SoftwareVendorStatus,
    enumName: 'software_vendor_status',
    default: SoftwareVendorStatus.ACTIVE,
    nullable: false,
  })
  status!: SoftwareVendorStatus;

  @OneToMany(() => ApiKey, (key) => key.vendor)
  apiKeys?: ApiKey[];

  @OneToMany(() => TaxPayer, (taxPayer) => taxPayer.vendor)
  taxPayers?: TaxPayer[];
}
