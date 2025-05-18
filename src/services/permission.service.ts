import { DS } from "../database/datasource";
import { Permission } from "../models/permission.entity";

export class PermissionService {
  private readonly r_permission = DS.getRepository(Permission)
  /**
   * CreateUpdatePermissions
   */
  public async CreateUpdatePermissions(payload: Permission[]) {
    try {
      await this.r_permission.upsert(payload, ["handler"]);
    } catch (err) {
      console.info("================= Inital Permissions =================");
      console.error(err);
      console.info("================= Inital Permissions =================");
      throw new Error("Initial permissions error");
    }
  }
}