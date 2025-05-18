import { config as dotenv } from "dotenv";
import { DataSource } from "typeorm";

dotenv();
process.env.TZ = 'UTC';
export const DS = new DataSource({
  type: process.env.DB_TYPE as any,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: `${process.env.DB_USER}`,
  password: `${process.env.DB_PASS}`,
  database: `${process.env.DB_NAME}`,
  entities: [__dirname + '/../models/**/*.entity.{ts,js}'],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  migrationsRun: false,
  logging: false,
  synchronize: false,
  extra: {
    options: '-c timezone=UTC', // Set timezone session ke UTC
  },
})