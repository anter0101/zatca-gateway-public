import { Column, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Entity base object.
 */
export abstract class BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'created_by', nullable: true })
  createdBy?: string;

  @Column({ name: 'created_at', type: 'timestamptz', nullable: true })
  createdAt?: Date;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy?: string;

  @Column({ name: 'updated_at', type: 'timestamptz', nullable: true })
  updatedAt?: Date;

  @Column({ name: 'deleted_by', nullable: true })
  deletedBy?: string;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
