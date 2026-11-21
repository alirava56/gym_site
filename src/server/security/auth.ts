import { createHash, randomBytes } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import "server-only";
import { ADMIN_SESSION_SECONDS, readAdminSession } from "@/server/security/admin";

const OWNER_COOKIE = "sg_owner";
export const ADMIN_COOKIE = "sg_admin";



export const hashOwnerToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export const readOwnerHash = (request: NextRequest) => {
  const token = request.cookies.get(OWNER_COOKIE)?.value;
  return token ? hashOwnerToken(token) : null;
};

export const ensureOwner = (request: NextRequest) => {
  const existing = request.cookies.get(OWNER_COOKIE)?.value;
  if (existing) return { token: existing, ownerHash: hashOwnerToken(existing), isNew: false };
  const token = randomBytes(32).toString("base64url");
  return { token, ownerHash: hashOwnerToken(token), isNew: true };
};

export const attachOwnerCookie = (response: NextResponse, token: string) => {
  response.cookies.set(OWNER_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365
  });
};

export const getAdminSession = (request: NextRequest) => readAdminSession(request.cookies.get(ADMIN_COOKIE)?.value);
export const isAdminRequest = async (request: NextRequest) => Boolean(await getAdminSession(request));
export const isSameOrigin = (request: NextRequest) => {
  try {
    const origin = new URL(request.headers.get("origin") || "");
    return origin.host === request.headers.get("host") && origin.protocol === (process.env.NODE_ENV === "production" ? "https:" : request.nextUrl.protocol);
  } catch { return false; }
};

export const attachAdminCookie = (response: NextResponse, session: string) => {
  response.cookies.set(ADMIN_COOKIE, session, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_SECONDS
  });
};

export const clearAdminCookie = (response: NextResponse) => {
  response.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
};
