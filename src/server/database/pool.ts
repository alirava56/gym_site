import "server-only";
import { Pool, type QueryResultRow } from "pg";

declare global { var __gymPgPool: Pool | undefined }

const connectionString = process.env.DATABASE_URL?.trim();
const createPool = () => {
  if (!connectionString) throw new Error("DATABASE_URL is required for PostgreSQL persistence.");
  return new Pool({ connectionString, max: 10, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 5_000, ssl: process.env.DATABASE_SSL === "require" ? { rejectUnauthorized: true } : undefined });
};
export const getPool = () => {
  if (!globalThis.__gymPgPool) globalThis.__gymPgPool = createPool();
  return globalThis.__gymPgPool;
};
export const query = <T extends QueryResultRow>(text: string, values: readonly unknown[] = []) => getPool().query<T>(text, [...values]);
export const isUniqueViolation = (error: unknown, constraint?: string) => Boolean(error && typeof error === "object" && "code" in error && error.code === "23505" && (!constraint || !("constraint" in error) || error.constraint === constraint));
