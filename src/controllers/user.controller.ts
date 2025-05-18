import { plainToClass } from "class-transformer";
import { Request, Response } from "express";
import { UserCreateUpdateDto } from "../dtos/user.create.update.dto";
import { AuthPermission } from "../middlewares/auth.middleware";
import { UserService } from "../services/user.service";
import Controller from "../utils/decorators/controller.decorator";
import { Get, Post, Put } from "../utils/decorators/handler.decorator";
import { ControllerMiddleware } from "../utils/decorators/middleware.decorator";
import HelperValidator from "../validators/helper.validator";

@Controller("/user")
@ControllerMiddleware(AuthPermission)
export class UserController {
  private s_user = new UserService()

  @Get("/")
  public async GotUsers(req: Request, res: Response) {
    try {
      const data = await this.s_user.GotAll()
      return res.status(200).send({ statusCode: 200, msg: "OK", data: data })
    } catch (err) {
      if (err.statusCode)
        return res.status(err.statusCode).send({ statusCode: err.statusCode, msg: "!OK", err: err.err })
      return res.status(500).send({ statusCode: 500, msg: "!OK", err: "Something went wrong!" })
    }
  }

  @Put("/:user_id")
  public async GotById(req: Request, res: Response) {
    try {
      const data = await this.s_user.GotById(req.params.user_id)
      return res.status(200).send({ statusCode: 200, msg: "OK", data: data })
    } catch (err) {
      if (err.statusCode)
        return res.status(err.statusCode).send({ statusCode: err.statusCode, msg: "!OK", err: err.err })
      return res.status(500).send({ statusCode: 500, msg: "!OK", err: "Something went wrong!" })
    }
  }

  @Post("/create")
  public async Create(req: Request, res: Response) {
    const payload = plainToClass(UserCreateUpdateDto, req.body)
    try {
      await HelperValidator.GetMessages(payload);
      const data = await this.s_user.CreateUpdate(payload)
      return res.status(200).send({ statusCode: 200, msg: "OK", data: data })
    } catch (err) {
      if (err.statusCode)
        return res.status(err.statusCode).send({ statusCode: err.statusCode, msg: "!OK", err: err.err })
      return res.status(500).send({ statusCode: 500, msg: "!OK", err: "Something went wrong!" })
    }
  }
}