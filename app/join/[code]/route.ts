import { NextRequest, NextResponse } from "next/server";

// Visiting /join/<code> sets a long-lived cookie and bounces to root.
// The cookie survives the Google OAuth round-trip, and onboarding's server
// action reads it to persist `league` onto the new profile.
//
// Existing users with profiles already saved are unaffected — their league
// was set at sign-up time and can't be changed by visiting another join link.
const ALLOWED = /^[a-z0-9-]{2,32}$/;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  if (!ALLOWED.test(code)) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  const res = NextResponse.redirect(new URL("/", req.url));
  res.cookies.set("wc_league", code, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    sameSite: "lax",
  });
  return res;
}
