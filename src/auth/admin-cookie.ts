import type { IncomingHttpHeaders } from "http";
import type { Request, Response } from "express";

export const ADMIN_COOKIE_NAME = "kzk_admin";
const ADMIN_COOKIE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

type HeaderValue = string | string[] | undefined;

const readHeader = (headers: IncomingHttpHeaders | undefined, name: string): string | null => {
  if (!headers) return null;
  const value: HeaderValue = headers[name];
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Array.isArray(value) && typeof value[0] === "string" && value[0].trim()) {
    return value[0].trim();
  }
  return null;
};

export const readCookieValue = (cookieHeader: string, name: string): string | null => {
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() !== name) continue;
    const raw = part.slice(separator + 1).trim();
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
  return null;
};

export const extractAdminSecret = (headers: IncomingHttpHeaders | undefined): string | null => {
  const authorization = readHeader(headers, "authorization");
  if (authorization) return authorization;

  const cookieHeader = readHeader(headers, "cookie");
  if (!cookieHeader) return null;
  const fromCookie = readCookieValue(cookieHeader, ADMIN_COOKIE_NAME);
  return fromCookie?.trim() ? fromCookie : null;
};

export const isSecureRequest = (request: Pick<Request, "secure" | "headers">): boolean => {
  if (request.secure) return true;
  const proto = request.headers["x-forwarded-proto"];
  if (typeof proto === "string") {
    return proto.split(",")[0]?.trim() === "https";
  }
  return false;
};

const cookieBaseOptions = (secure: boolean) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure,
});

export const setAdminCookie = (response: Response, secret: string, secure: boolean): void => {
  response.cookie(ADMIN_COOKIE_NAME, secret, {
    ...cookieBaseOptions(secure),
    maxAge: ADMIN_COOKIE_MAX_AGE_MS,
  });
};

export const clearAdminCookie = (response: Response, secure: boolean): void => {
  response.clearCookie(ADMIN_COOKIE_NAME, cookieBaseOptions(secure));
};
