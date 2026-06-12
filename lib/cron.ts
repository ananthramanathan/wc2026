import { NextRequest, NextResponse } from "next/server";

export function authCron(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET unset" }, { status: 500 });
  // Vercel cron sends "Bearer <CRON_SECRET>"; allow either form for manual curls.
  if (auth !== `Bearer ${secret}` && auth !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}
