import { NextResponse } from "next/server";

/** Standard success response */
export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

/** Standard error response */
export function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** 401 Unauthorized */
export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

/** 403 Forbidden */
export function forbidden(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}

/** 404 Not Found */
export function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

/** 500 Internal Server Error — logs the error, returns generic message */
export function serverError(error: unknown, context?: string) {
  console.error(context ? `[${context}]` : "[API]", error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
