import { NextFunction, Request, Response } from "express";
import { verify, VerifyErrors } from "jsonwebtoken";

export type TokenAuthType = {
  user_id: string;
  role: {
    id: string;
    name: string;
    permissions: string[]
  };
  permissions: string[]
}

export async function AuthPermission(req: Request, res: Response, next: NextFunction, handler: string) {
  const { authorization } = req.headers;

  if (!authorization)
    return res.status(401).send({ statusCode: res.statusCode, msg: "!OK", err: "JWT required!" });

  if (authorization.split(" ")[0] !== "Bearer")
    return res.status(401).send({ statusCode: res.statusCode, msg: "!OK", err: "JWT Invalid!" });

  const token: string = authorization.split(" ")[1];
  if (!token || token === undefined)
    return res.status(401).send({ statusCode: res.statusCode, msg: "!OK", err: "JWT required!" });

  try {
    const decoded = verify(token, `${process.env.SIGNATURE}`);
    const credentials = decoded as TokenAuthType;

    // find access in role or binding permissions
    const findRolePermission = credentials.role.permissions.find(f => f === handler)
    const findPermission = credentials.permissions.find(f => f === handler)

    if (findRolePermission || findPermission) {
      res.locals = credentials
      return next();
    }

    return res.status(403).send({ statusCode: res.statusCode, msg: "!OK", err: "Reqeust forbidden" });
  } catch (error) {
    const err = error as VerifyErrors;
    return res.status(401).send({ statusCode: res.statusCode, msg: "!OK", err: err.message });
  }
}

export async function AuthMiddleware(req: Request, res: Response, next: NextFunction, handler: string) {
  console.log("this is handler auth middleware", handler);
  return next()
}