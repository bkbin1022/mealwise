import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const requestedNextPath = searchParams.get("next");
  const next = requestedNextPath?.startsWith("/") && !requestedNextPath.startsWith("//")
    ? requestedNextPath
    : "/";
  const requestedFailurePath = searchParams.get("failure");
  const failurePath = requestedFailurePath?.startsWith("/") && !requestedFailurePath.startsWith("//")
    ? requestedFailurePath
    : "/auth";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}${failurePath}?error=oauth_callback_failed`);
}
