import "server-only";
import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { PoolClient } from "pg";
import { getPool, query } from "@/server/database/pool";

export const ADMIN_SESSION_SECONDS = 30 * 24 * 60 * 60;
const deriveKey = promisify(scrypt);
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
const validToken = (token: unknown): token is string => typeof token === "string" && /^[A-Za-z0-9_-]{43}$/.test(token);
const validPassword = (password: unknown): password is string => typeof password === "string" && password.length > 0 && password.length <= 128;

export const hashAdminPassword = async (password: string) => {
  const salt = randomBytes(16).toString("hex");
  const key = await deriveKey(password, salt, 64) as Buffer;
  return `${salt}:${key.toString("hex")}`;
};

const verifyPassword = async (password: string, encoded: string) => {
  const [salt, hex] = encoded.split(":");
  if (!salt || !/^[a-f0-9]{128}$/i.test(hex ?? "")) return false;
  const actual = await deriveKey(password, salt, 64) as Buffer;
  return timingSafeEqual(actual, Buffer.from(hex, "hex"));
};

// Environment credentials only bootstrap the singleton; edits in the panel survive restarts.
const ensureAccount = async () => {
  const username = process.env.ADMIN_USERNAME;
  let encoded = process.env.ADMIN_PASSWORD_HASH;
  if (!encoded && process.env.NODE_ENV !== "production" && process.env.ADMIN_PASSWORD) {
    encoded = await hashAdminPassword(process.env.ADMIN_PASSWORD);
  }
  if (!username || !encoded) throw new Error("Initial admin credentials are missing.");
  await query("INSERT INTO admin_account (id, username, password_hash) VALUES (1,$1,$2) ON CONFLICT (id) DO NOTHING", [username, encoded]);
};

const insertSession = async (client: PoolClient) => {
  const token = randomBytes(32).toString("base64url");
  await client.query("DELETE FROM admin_sessions WHERE expires_at <= NOW()");
  await client.query("INSERT INTO admin_sessions (token_hash, admin_id, expires_at) VALUES ($1,1,NOW()+$2*INTERVAL '1 second')", [hashToken(token), ADMIN_SESSION_SECONDS]);
  return token;
};

export const loginAdmin = async (username: unknown, password: unknown) => {
  if (typeof username !== "string" || username.length > 64 || !validPassword(password)) return null;
  await ensureAccount();
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query<{ username: string; password_hash: string }>("SELECT username,password_hash FROM admin_account WHERE id=1 FOR UPDATE");
    const account = rows[0];
    // Always check the password, including for an incorrect username.
    const correct = await verifyPassword(password, account.password_hash);
    if (!correct || username !== account.username) { await client.query("ROLLBACK"); return null; }
    const token = await insertSession(client);
    await client.query("COMMIT");
    return { token, username: account.username };
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
};

export const readAdminSession = async (token: unknown) => {
  if (!validToken(token)) return null;
  const { rows } = await query<{ username: string; expires_at: Date }>(
    "SELECT a.username,s.expires_at FROM admin_sessions s JOIN admin_account a ON a.id=s.admin_id WHERE s.token_hash=$1 AND s.expires_at>NOW()", [hashToken(token)],
  );
  return rows[0] ? { username: rows[0].username, expiresAt: rows[0].expires_at.toISOString() } : null;
};

export const revokeAdminSession = async (token: unknown) => {
  if (validToken(token)) await query("DELETE FROM admin_sessions WHERE token_hash=$1", [hashToken(token)]);
};

export const changeAdminCredentials = async (token: unknown, currentPassword: unknown, username: unknown, newPassword: unknown) => {
  if (!validToken(token)) return { error: "UNAUTHORIZED" } as const;
  if (!validPassword(currentPassword) || typeof username !== "string" || !/^[\p{L}\p{N}_.-]{3,64}$/u.test(username) ||
      (newPassword !== "" && (!validPassword(newPassword) || newPassword.length < 12))) return { error: "INVALID_INPUT" } as const;
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query<{ password_hash: string }>("SELECT password_hash FROM admin_account WHERE id=1 FOR UPDATE");
    const session = await client.query("SELECT 1 FROM admin_sessions WHERE token_hash=$1 AND expires_at>NOW()", [hashToken(token)]);
    if (!rows[0] || !session.rowCount) { await client.query("ROLLBACK"); return { error: "UNAUTHORIZED" } as const; }
    if (!await verifyPassword(currentPassword, rows[0].password_hash)) { await client.query("ROLLBACK"); return { error: "WRONG_PASSWORD" } as const; }
    const encoded = newPassword === "" ? rows[0].password_hash : await hashAdminPassword(newPassword as string);
    await client.query("UPDATE admin_account SET username=$1,password_hash=$2,updated_at=NOW() WHERE id=1", [username, encoded]);
    await client.query("DELETE FROM admin_sessions WHERE admin_id=1");
    const replacement = await insertSession(client);
    await client.query("COMMIT");
    return { token: replacement, username } as const;
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
};
