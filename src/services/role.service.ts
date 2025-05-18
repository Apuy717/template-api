import { In } from "typeorm";
import { DS } from "../database/datasource";
import { RoleCreateDto } from "../dtos/roles.create.dto";
import { Permission } from "../models/permission.entity";
import { Role } from "../models/roles.entity";
import Controller from "../utils/decorators/controller.decorator";
import { Get } from "../utils/decorators/handler.decorator";

@Controller("/roles")
export class RoleService {
  private e_roles = DS.getRepository(Role);
  private e_permissions = DS.getRepository(Permission);

  /**
   * GotAllRoles
   */
  @Get("/")
  public async GotAllRoles() {
    try {
      return await this.e_roles.find({ relations: { permissions: true } });
    } catch (err) {
      console.log(err);
      if (err.statusCode) throw { statusCode: err.statusCode, err: err.err }
      throw { statusCode: 500, err: "Something went wrong!" }
    }
  }

  /**
   * GotPermissions
   */
  public async GotPermissions() {
    try {
      return await this.e_permissions.find();
    } catch (err) {
      if (err.statusCode) throw { statusCode: err.statusCode, err: err.err }
      throw { statusCode: 500, err: "Something went wrong!" }
    }
  }

  /**
   * CreateWithPermissions
   */
  public async CreateWithPermissions(payload: RoleCreateDto) {
    const queryRunner = DS.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      //find permission
      const fPermissions = await queryRunner.manager.find(Permission, { where: { id: In(payload.permissions) } });
      if (fPermissions.length === 0) throw { statusCode: 404, err: "Permissions not found!" };

      //new role
      const role = new Role();
      role.name = payload.name;
      role.permissions = fPermissions;

      await queryRunner.manager.save(role)
      await queryRunner.commitTransaction();
      await queryRunner.release();
      return role;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      if (err.statusCode) throw { statusCode: err.statusCode, err: err.err }
      throw { statusCode: 500, err: "Something went wrong!" }
    }
  }
}