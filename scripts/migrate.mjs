import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import pg from "pg";
import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());
const url=process.env.DATABASE_URL?.trim(); if(!url) throw new Error("DATABASE_URL is required.");
const client=new pg.Client({connectionString:url,ssl:process.env.DATABASE_SSL==="require"?{rejectUnauthorized:true}:undefined});
await client.connect();
try { await client.query("CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())"); for(const name of (await readdir(path.join(process.cwd(),"migrations"))).filter((n)=>n.endsWith(".sql")).sort()){ const done=await client.query("SELECT 1 FROM schema_migrations WHERE name=$1",[name]); if(done.rowCount) continue; await client.query("BEGIN"); try { await client.query(await readFile(path.join(process.cwd(),"migrations",name),"utf8")); await client.query("INSERT INTO schema_migrations(name) VALUES($1)",[name]); await client.query("COMMIT"); console.log(`Applied ${name}`); } catch(error){await client.query("ROLLBACK");throw error;} } } finally { await client.end(); }
