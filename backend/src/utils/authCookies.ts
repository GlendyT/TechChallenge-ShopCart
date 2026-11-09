import type { CookieOptions, Request, Response } from "express";
import { env } from "../config/env";

export const ACCESS_COOKIE_NAME = "shopcart_access";
export const REFRESH_COOKIE_NAME = "shopcart_refresh";

const durationToMilliseconds = (duration: string): number => {
  const match = duration.trim().match(/^(\d+)(ms|s|m|h|d|w)$/i);
  if (!match) return 15 * 60 * 1000;

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
  };

  return amount * multipliers[unit];
};

const baseCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: env.AUTH_COOKIE_SAME_SITE,
});

export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string,
): void => {
  res.cookie(ACCESS_COOKIE_NAME, accessToken, {
    ...baseCookieOptions(),
    path: "/api",
    maxAge: durationToMilliseconds(env.JWT_ACCESS_EXPIRES_IN),
  });
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    ...baseCookieOptions(),
    path: "/api/auth",
    maxAge: durationToMilliseconds(env.JWT_REFRESH_EXPIRES_IN),
  });
};

export const clearAuthCookies = (res: Response): void => {
  res.clearCookie(ACCESS_COOKIE_NAME, {
    ...baseCookieOptions(),
    path: "/api",
  });
  res.clearCookie(REFRESH_COOKIE_NAME, {
    ...baseCookieOptions(),
    path: "/api/auth",
  });
};

export const readCookie = (req: Request, name: string): string | undefined => {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return undefined;

  for (const cookie of cookieHeader.split(";")) {
    const separatorIndex = cookie.indexOf("=");
    if (separatorIndex < 0 || cookie.slice(0, separatorIndex).trim() !== name) {
      continue;
    }

    const value = cookie.slice(separatorIndex + 1).trim();
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  return undefined;
};
