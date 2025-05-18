export function Middleware(middleware: any, registeryPermission: boolean = true) {
  return function (target: any, key: string) {
    const middlewares: any[] = Reflect.getMetadata("middlewares", target) || [];
    Reflect.defineMetadata("middlewares", [...middlewares, { key, middleware, registeryPermission }], target);
  };
}

export const ControllerMiddleware = (middleware: any, registeryPermission: boolean = true): ClassDecorator => {
  return (target) => {
    Reflect.defineMetadata("classMiddlewares", { middleware, target, registeryPermission }, target);
  };
};