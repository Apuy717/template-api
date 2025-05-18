import SwaggerParser from "@apidevtools/swagger-parser";
import { config as dotenv } from "dotenv";
import express, { Application as ExApplication, Handler, Request, Response } from "express";
import * as fs from "fs";
import * as path from "path";
import swaggerUi from "swagger-ui-express";
import YAML from "yaml";
import { DS } from "./database/datasource";
import { Permission } from "./models/permission.entity";
import { IRouter } from "./utils/decorators/handler.decorator";
import { MetadataKeys } from "./utils/metadata.keys";
import { Role } from "./models/roles.entity";

interface iPermission {
  module: string;
  method: string;
  path: string;
  handler: string;
}

class App {
  private readonly _instance: ExApplication;

  get instance(): ExApplication {
    return this._instance;
  }

  constructor() {
    console.clear();
    dotenv();
    this._instance = express();
    this._instance.use(express.json({ limit: "5mb" }));
    if (process.env.NODE_ENV === "development") {
      this._instance.use("/download", express.static(path.join(__dirname, "../public")));
    } else {
      this._instance.use("/download", express.static(path.join(__dirname, "../../public")));
    }
    this.LoadRouter();
    this.LoadOpenAPI();
    this._instance.get("/health", this.Health.bind(this._instance));
  }

  private Health(req: Request, res: Response) {
    return res.status(200).send({ statusCode: 200, msg: "OK" })
  }

  private async LoadOpenAPI() {
    // Load OpenAPI YAML file
    const openapiPath = path.join(process.cwd(), "openapi.yaml");
    const openapiYaml = fs.readFileSync(openapiPath, "utf8");
    const openapiDoc = YAML.parse(openapiYaml);
    SwaggerParser.bundle(openapiDoc).then((bundledDoc) => {
      this._instance.use("/api-docs", swaggerUi.serve, swaggerUi.setup(bundledDoc));
    }).catch((err) => {
      console.error("Error bundling OpenAPI spec:", err);
    });
  }

  private async LoadRouter() {
    const parentFolderPathControllers = path.join(__dirname, "controllers");
    const controller = await this.LoadFileClass(parentFolderPathControllers);
    const info: Array<{ module: string; method: string; path: string; handler: string; }> = [];
    const permissionRegistery: iPermission[] = [];

    //load controllers
    controller.forEach((c) => {
      const modules = require(c);
      const keys = Object.keys(modules);

      if (keys.length > 0) {
        const controllerClass = modules[keys[0]];
        const controllerInstance: { [handleName: string]: Handler } = new controllerClass() as any;
        const basePath: string = Reflect.getMetadata(MetadataKeys.BASE_PATH, controllerClass);
        const routers: IRouter[] = Reflect.getMetadata(MetadataKeys.ROUTERS, controllerClass);
        const exRouter = express.Router();

        const classMiddleware = Reflect.getMetadata("classMiddlewares", controllerClass);

        //got metadata middleware
        const middlewares = Reflect.getMetadata("middlewares", controllerInstance) || [];

        //reigster router
        routers.forEach(({ method, path, handlerName }) => {
          //register middleware
          const pathMiddleware = `${controllerClass.name}.${String(handlerName)}`;
          middlewares.map(({ key, middleware, registeryPermission }, index: number) => {


            if (key === String(handlerName)) {
              //binding middleware class to method
              exRouter[method](basePath + path, (req, res, next) => middleware(req, res, next, pathMiddleware),
                controllerInstance[String(handlerName)].bind(controllerInstance));

              // Push registery permission
              if (registeryPermission)
                permissionRegistery.push({
                  module: basePath,
                  method: method,
                  path: `${basePath}${path}`,
                  handler: pathMiddleware
                })
            }
            else if (classMiddleware && middlewares.length === index + 1) {
              //with middleware class
              exRouter[method](basePath + path, (req, res, next) => classMiddleware.middleware(req, res, next, pathMiddleware),
                controllerInstance[String(handlerName)].bind(controllerInstance));

              // Push registery permission
              if (classMiddleware.registeryPermission)
                permissionRegistery.push({
                  module: basePath,
                  method: method,
                  path: pathMiddleware,
                  handler: `${controllerClass.name}.${String(handlerName)}`
                })
            }
          });

          if (classMiddleware && middlewares.length === 0) {
            //with middleware class
            exRouter[method](basePath + path, (req, res, next) => classMiddleware.middleware(req, res, next, pathMiddleware),
              controllerInstance[String(handlerName)].bind(controllerInstance));
            // Push registery permission
            if (classMiddleware.registeryPermission)
              permissionRegistery.push({
                module: basePath,
                method: method,
                path: pathMiddleware,
                handler: `${controllerClass.name}.${String(handlerName)}`
              })
          } else if (!classMiddleware) {
            //without middleware class
            exRouter[method](basePath + path, controllerInstance[String(handlerName)].bind(controllerInstance));
          }

          info.push({
            module: basePath,
            method: method,
            path: `${basePath + path}`,
            handler: `${controllerClass.name}.${String(handlerName)}`,
          });
        });

        this._instance.use(`/api`, exRouter);
      }
    });

    console.info("=============== List router ===============");
    console.table(info)
    console.info("=============== router registered to middleware permissions ===============");
    console.table(permissionRegistery);
    await this.ManagerPermissionAndRoleDefault(permissionRegistery);
  }

  private async ManagerPermissionAndRoleDefault(permissionRegistery: iPermission[]) {
    await DS.transaction(async (manager) => {
      // 1. Dapatkan semua permission dari database
      const allPermissions = await manager.find(Permission);

      // 2. Ambil semua handler dari permissionRegistery
      const registryHandlers = permissionRegistery.map(p => p.handler);

      // 3. Filter permission yang sudah tidak ada di registry
      const toDelete = allPermissions.filter(
        (perm) => !registryHandlers.includes(perm.handler)
      );

      // 4. Hapus permission yang tidak lagi valid
      if (toDelete.length > 0) {
        await manager.remove(Permission, toDelete);
      }

      // 5. Upsert (masukkan atau perbarui) permission ke database
      await manager.upsert(Permission, permissionRegistery, ["handler"]);

      // 6. Ambil ulang semua permission setelah upsert
      const updatedPermissions = await manager.find(Permission);

      // 7. Cari role super admin
      let superAdmin = await manager.findOne(Role, {
        where: { name: "super admin" },
        relations: ["permissions"]
      });

      // 8. Jika tidak ada, buat baru
      if (!superAdmin) {
        superAdmin = manager.create(Role, {
          name: "super admin",
          permissions: updatedPermissions
        });
      } else {
        superAdmin.permissions = updatedPermissions;
      }
      // 9. Simpan role super admin dengan permission terbaru
      await manager.save(Role, superAdmin);
    });

  }

  private async LoadFileClass(parentFolderPath: string) {
    const files: string[] = [];
    const dirents = await fs.promises.readdir(parentFolderPath, { withFileTypes: true });
    for (const dirent of dirents) {
      const filePath = path.join(parentFolderPath, dirent.name);

      if (dirent.isDirectory()) {
        const nestedFiles = await this.LoadFileClass(filePath);
        files.push(...nestedFiles);
      } else {
        files.push(filePath);
      }
    }

    return files;
  }
}

export default App;