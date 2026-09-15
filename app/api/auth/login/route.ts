import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  checkPin,
  createSessionValue,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from "@/lib/auth";

export const POST = async (request: Request) => {
  const body = await request.json().catch(() => null);
  const pin = typeof body?.pin === "string" ? body.pin : "";

  if (!checkPin(pin)) {
    return NextResponse.json(
      { error: "Code PIN incorrect." },
      { status: 401 }
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, await createSessionValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return NextResponse.json({ ok: true });
};
