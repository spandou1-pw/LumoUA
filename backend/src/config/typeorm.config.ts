import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

/**
 * doc 20/34: migrations are the only sanctioned way schema changes reach any
 * environment — `synchronize` is always false, even in local dev, so the
 * migration path itself gets exercised from day one rather than trusted for
 * the first time in staging.
 */
export const typeOrmConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: Number(process.env.DATABASE_PORT ?? 5432),
  username: process.env.DATABASE_USER ?? 'edina',
  password: process.env.DATABASE_PASSWORD ?? 'edina_local_dev_only',
  database: process.env.DATABASE_NAME ?? 'edina_dev',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  entities: [path.join(__dirname, '..', 'modules', '**', 'entities', '*.entity.{ts,js}')],
  migrations: [path.join(__dirname, '..', 'database', 'migrations', '*.{ts,js}')],
};

export default new DataSource(typeOrmConfig);
