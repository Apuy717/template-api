import { pbkdf2Sync, randomBytes } from "crypto";
import { In, QueryFailedError } from "typeorm";
import { DS } from "../database/datasource";
import { UserCreateUpdateDto } from "../dtos/user.create.update.dto";
import { TokenAuthType } from "../middlewares/auth.middleware";
import { Users } from "../models/user.entity";
import Jwt from "jsonwebtoken";
import { Role } from "../models/roles.entity";
import { Permission } from "../models/permission.entity";
import { AuthLoginDto } from "../dtos/auth.login.dto";

export class AuthService {
  private readonly r_user = DS.getRepository(Users);

  /**
   * Login
   */
  public async Login(payload: AuthLoginDto) {
    const expiresIn = "1h";
    const priveteKey: string = `${process.env.SIGNATURE}`;

    try {
      const findUser = await this.r_user.findOne({
        where: { email: payload.email },
        relations: {
          role: {
            permissions: true
          },
          permissions: true
        }
      });

      if (findUser === null) throw { statusCode: 404, err: "User not found!" }

      // Validation password
      const validPassword = pbkdf2Sync(payload.password, `${findUser.salt}`, 1000, 64, `sha512`).toString(`hex`);
      if (`${findUser.password}` !== validPassword) throw { statusCode: 403, err: "Wrong password" };

      const credential: TokenAuthType = {
        user_id: findUser.id,
        role: {
          id: findUser.role.id,
          name: findUser.role.name,
          permissions: findUser.role.permissions.map(i => i.handler),
        },
        permissions: findUser.permissions.map(i => i.handler)
      };

      const token = Jwt.sign(credential, priveteKey, { algorithm: "HS384", expiresIn: expiresIn });

      const data = {
        id: findUser.id,
        full_name: findUser.full_name,
        email: findUser.email,
        role: findUser.role,
        permissions: findUser.permissions,
        accessToken: {
          token: token,
          expires: expiresIn
        }
      }
      return data;
    } catch (err) {
      if (err.statusCode) throw { statusCode: err.statusCode, err: err.err }
      throw { statusCode: 500, err: "Something went wrong!" }
    }
  }

  /**
   * Register
   */
  public async Register(payload: UserCreateUpdateDto) {
    const salt = randomBytes(16).toString("hex");
    const password = pbkdf2Sync(`${payload.password}`, salt, 1000, 64, `sha512`).toString(`hex`);

    const queryRunner = DS.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // await
      const findRole = await queryRunner.manager.findOne(Role, { where: { id: payload.role_id } });
      if (findRole === null)
        throw { statusCode: 404, err: "Role not found, invalid role_id!" }

      // find permissions 
      const fPermissions = await queryRunner.manager.find(Permission, { where: { id: In(payload.permission_ids) } });
      //validate permission payload 
      if (payload.permission_ids.length >= 1 && fPermissions) {
        payload.permission_ids.forEach((prmId) => {
          const validatePermissionPayload = fPermissions.find(f => f.id === prmId)
          if (!validatePermissionPayload)
            throw { statusCode: "404", err: `Permission not found, invalid id ${prmId}` }
        });
      }

      const pyd = Object.assign(payload, {
        password: password,
        salt: salt,
        role: findRole,
        permissions: fPermissions
      });

      // exclude permissions_ids & role_id karena tidak dibutuhkan dalam proses create ke db
      delete pyd.permission_ids;
      delete pyd.role_id;

      // save user
      const newUser = new Users();
      Object.assign(newUser, { ...newUser, ...pyd, });

      const user = await queryRunner.manager.save(newUser);

      await queryRunner.commitTransaction();
      await queryRunner.release();

      delete user.password;
      delete user.salt;
      delete user.created_at;
      delete user.updated_at;
      return user;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      if (err instanceof QueryFailedError && err.driverError.code === "23505")
        throw { statusCode: 400, err: `Email ${payload.email} already exist!` };
      if (err.statusCode)
        throw { statusCode: err.statusCode, err: err.err }
      throw { statusCode: 500, err: "something went wrong!" }
    }
  }

  /**
   * VerifyToken
   */
  public async VerifyToken(payload: TokenAuthType) {
    try {
      const findUser = await this.r_user.findOne({
        where: { id: payload.user_id }, relations: {
          role: {
            permissions: true
          },
          permissions: true
        }
      });

      return findUser;
    } catch (err) {
      if (err.statusCode) throw { statusCode: err.statusCode, err: err.err }
      throw { statusCode: 500, err: "Something went wrong!" }
    }
  }
}