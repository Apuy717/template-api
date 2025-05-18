import { Column, CreateDateColumn, Entity, ManyToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Role } from "./roles.entity";
import { Users } from "./user.entity";

@Entity("permissions")
export class Permission {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 100, nullable: false })
  module: string

  @Column({ type: "varchar", length: 100, nullable: false })
  method: string

  @Column({ type: "varchar", unique: true, length: 100, nullable: false })
  path: string

  @Column({ type: "varchar", unique: true, length: 100, nullable: false })
  handler: string

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];

  @ManyToMany(() => Users, (user) => user.permissions)
  users: Users[];

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}