import { Entity, Column } from 'typeorm';
import { Exclude } from 'class-transformer';
import { BaseEntity } from 'src/core/utils/base.entity';
import { UserRole } from 'src/core/enums/user-role';

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true, type: 'varchar', nullable: false })
  email: string;

  @Exclude()
  @Column({ type: 'varchar', nullable: false })
  password: string;

  @Column({ type: 'varchar', nullable: true })
  username?: string;

  @Column({ type: 'boolean', nullable: false, default: false })
  activated?: boolean;

  @Column({ name: 'image_url', type: 'varchar', nullable: true })
  imageUrl?: string;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;
}
