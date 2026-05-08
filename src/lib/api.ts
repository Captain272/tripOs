/** Tiny helpers for API route handlers. Keep response shape consistent. */

import { NextResponse } from "next/server";

export type ApiOk<T> = { ok: true; data: T };
export type ApiErr = { ok: false; error: string; details?: unknown };

export const ok = <T>(data: T, status = 200) =>
  NextResponse.json<ApiOk<T>>({ ok: true, data }, { status });

export const fail = (error: string, status = 400, details?: unknown) =>
  NextResponse.json<ApiErr>({ ok: false, error, details }, { status });

export const unauthorized = () => fail("unauthorized", 401);
export const forbidden = () => fail("forbidden", 403);
export const notFound = (entity = "resource") => fail(`${entity} not found`, 404);
