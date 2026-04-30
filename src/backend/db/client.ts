import { Pool } from "pg";
import { AppError } from "@/backend/common/errors";

declare global {
  var __gardenPgPool: Pool | undefined;
}

function buildPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new AppError("DATABASE_URL is not configured.", 500);
  }

  return new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
}

export function getDbPool(): Pool {
  if (!global.__gardenPgPool) {
    global.__gardenPgPool = buildPool();
  }
  return global.__gardenPgPool;
}
