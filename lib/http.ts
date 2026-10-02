import { NextResponse } from "next/server";

export const badRequest = (error: string) => NextResponse.json({ error }, { status: 400 });
export const unauthorized = () => NextResponse.json({ error: "sign in required" }, { status: 401 });
export const notFound = () => NextResponse.json({ error: "not found" }, { status: 404 });

export function handle<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try { return await fn(...args); }
    catch (e) {
      console.error(e);
      return NextResponse.json({ error: "internal server error" }, { status: 500 });
    }
  };
}
