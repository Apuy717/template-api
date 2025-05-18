import { plainToClass } from "class-transformer"
import { validate } from "class-validator"
import { Request, Response } from "express"
import { RoleCreateDto } from "../dtos/roles.create.dto"
import { RoleService } from "../services/role.service"
import Controller from "../utils/decorators/controller.decorator"
import { Get, Post } from "../utils/decorators/handler.decorator"
import HelperValidator from "../validators/helper.validator"
import { ControllerMiddleware } from "../utils/decorators/middleware.decorator"
import { AuthPermission } from "../middlewares/auth.middleware"

@Controller("/roles")
@ControllerMiddleware(AuthPermission)
export class AuthController {
  private sRole = new RoleService()

  /**
   * GotAllRoles
   */
  @Get("/")
  public async GotAllRoles(req: Request, res: Response) {
    try {
      const data = await this.sRole.GotAllRoles()
      return res.status(200).send({ statusCode: 200, msg: "OK", data: data })
    } catch (err) {
      if (err.statusCode)
        return res.status(err.statusCode).send({ statusCode: err.statusCode, msg: "!OK", err: err.err })
      return res.status(500).send({ statusCode: 500, msg: "!OK", err: "Something went wrong!" })
    }
  }

  /**
   * GotPermissions
   */
  @Get("/permissions")
  public async GotPermissions(req: Request, res: Response) {
    try {
      const data = await this.sRole.GotPermissions()
      return res.status(200).send({ statusCode: 200, msg: "OK", data: data })
    } catch (err) {
      if (err.statusCode)
        return res.status(err.statusCode).send({ statusCode: err.statusCode, msg: "!OK", err: err.err })
      return res.status(500).send({ statusCode: 500, msg: "!OK", err: "Something went wrong!" })
    }
  }

  /**
  * CreateWithPermissions
  */
  @Post("/create")
  public async CreateWithPermissions(req: Request, res: Response) {
    const payload = plainToClass(RoleCreateDto, req.body)
    try {
      await HelperValidator.GetMessages(payload);
      const data = await this.sRole.CreateWithPermissions(payload)
      return res.status(200).send({ statusCode: 200, msg: "OK", data: data })
    } catch (err) {
      if (err.statusCode)
        return res.status(err.statusCode).send({ statusCode: err.statusCode, msg: "!OK", err: err.err })
      return res.status(500).send({ statusCode: 500, msg: "!OK", err: "Something went wrong!" })
    }
  }
}