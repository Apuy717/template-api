import { Request, Response } from "express"
import { AuthMiddleware, AuthPermission, TokenAuthType } from "../middlewares/auth.middleware"
import Controller from "../utils/decorators/controller.decorator"
import { Post } from "../utils/decorators/handler.decorator"
import { ControllerMiddleware, Middleware } from "../utils/decorators/middleware.decorator"
import { AuthService } from "../services/auth.service"
import { UserCreateUpdateDto } from "../dtos/user.create.update.dto"
import { plainToClass } from "class-transformer"
import HelperValidator from "../validators/helper.validator"
import { validate } from "class-validator"
import { AuthLoginDto } from "../dtos/auth.login.dto"

@Controller("/auth")
export class AuthController {
  private s_auth = new AuthService();

  /**
   * Register
   */
  @Post("/register")
  public async Register(req: Request, res: Response) {
    const payload = plainToClass(UserCreateUpdateDto, req.body)
    try {
      await HelperValidator.GetMessages(payload);
      const data = await this.s_auth.Register(payload);
      return res.status(200).send({ statusCode: 200, msg: "OK", data: data })
    } catch (err) {
      if (err.statusCode)
        return res.status(err.statusCode).send({ statusCode: err.statusCode, msg: "!OK", err: err.err })
      return res.status(500).send({ statusCode: 500, msg: "!OK", err: "Something went wrong!" })
    }
  }

  /**
   * Login
   */
  @Post("/login")
  public async Login(req: Request, res: Response) {
    const payload = plainToClass(AuthLoginDto, req.body)
    try {
      await HelperValidator.GetMessages(payload);
      const data = await this.s_auth.Login(payload);
      return res.status(200).send({ statusCode: 200, msg: "OK", data: data })
    } catch (err) {
      if (err.statusCode)
        return res.status(err.statusCode).send({ statusCode: err.statusCode, msg: "!OK", err: err.err })
      return res.status(500).send({ statusCode: 500, msg: "!OK", err: "Something went wrong!" })
    }
  }

  /**
   * VerifyToken
   */
  @Post("/verify-token")
  @Middleware(AuthMiddleware, false)
  public async VerifyToken(req: Request, res: Response) {
    const payload = res.locals as TokenAuthType
    try {
      const data = await this.s_auth.VerifyToken(payload);
      return res.status(200).send({ statusCode: 200, msg: "OK", data: data })
    } catch (err) {
      if (err.statusCode)
        return res.status(err.statusCode).send({ statusCode: err.statusCode, msg: "!OK", err: err.err })
      return res.status(500).send({ statusCode: 500, msg: "!OK", err: "Something went wrong!" })
    }
  }

  /**
   * ChanagePassword
   */
  @Post("/change-password")
  @Middleware(AuthPermission, false)
  public ChanagePassword(req: Request, res: Response) {
    try {
      const data = []
      return res.status(200).send({ statusCode: 200, msg: "OK", data: data })
    } catch (err) {
      if (err.statusCode)
        return res.status(err.statusCode).send({ statusCode: err.statusCode, msg: "!OK", err: err.err })
      return res.status(500).send({ statusCode: 500, msg: "!OK", err: "Something went wrong!" })
    }
  }
}