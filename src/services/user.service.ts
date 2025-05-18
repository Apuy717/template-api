import { pbkdf2Sync, randomBytes } from "crypto";
import { DS } from "../database/datasource";
import { UserCreateUpdateDto } from "../dtos/user.create.update.dto";
import { Users } from "../models/user.entity";

export class UserService {
  private readonly r_user = DS.getRepository(Users)

  public async GotAll() {
    return await this.r_user.find({
      select: ["id", "full_name", "role", "permissions"],
      relations: {
        role: {
          permissions: true
        },
        permissions: true
      }
    })
  }

  public async GotById(id: string): Promise<Users> {
    const user = await this.r_user.findOne({ where: { id: id } })
    if (user === null) throw { statusCode: 404, err: "user not found!" }
    return user
  }

  public async CreateUpdate(payload: UserCreateUpdateDto) {
    const salt = randomBytes(16).toString("hex");
    const password = pbkdf2Sync(`${payload.password}`, salt, 1000, 64, `sha512`).toString(`hex`);

    try {
      if (payload.id && payload.id.length >= 1) {
        const newUser = await this.r_user.update({ id: payload.id }, payload)
        if (newUser.affected === 0) throw { statusCode: 404, err: "update user filed, user not found!" }
        return await this.r_user.findOne({ where: { id: payload.id } })
      }
      const pyd = Object.assign(payload, { password: password, salt: salt })
      const newUser = this.r_user.create(pyd)
      const user = await this.r_user.save(newUser)
      return user
    } catch (err) {
      if (err.statusCode) throw { statusCode: err.statusCode, err: err.err }
      throw { statusCode: 500, err: "something went wrong!" }
    }
  }
}