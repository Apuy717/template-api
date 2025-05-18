import { Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Permission } from "./permission.entity";
import { Users } from "./user.entity";


@Entity("roles")
export class Role {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  name: string

  @ManyToMany(() => Permission, (permission) => permission.roles, { cascade: true, onDelete: "CASCADE", onUpdate: "CASCADE" })
  @JoinTable({
    name: "role_permissions", // Custom join table name in snake_case
    joinColumn: { name: "role_id", referencedColumnName: "id" }, // Foreign key column for roles
    inverseJoinColumn: { name: "permission_id", referencedColumnName: "id" } // Foreign key column for Permissions
  })
  permissions: Permission[]

  @OneToOne(() => Users)
  user: Users;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}