"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";

export default function LandingAuthActions() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="h-9 w-40 animate-pulse rounded-full bg-[#e2eadc]" aria-hidden="true" />;
  }

  if (user) {
    return (
      <>
        <Link
          href="/dashboard"
          className="rounded-full border border-[#315d42]/20 bg-[#e7f0dc] px-4 py-2 transition hover:bg-[#d9e8cc]"
        >
          Dashboard
        </Link>
        <Link
          href="/plan"
          className="rounded-full bg-[#315d42] px-4 py-2 text-white transition hover:bg-[#254a34]"
        >
          New plan
        </Link>
      </>
    );
  }

  return (
    <>
      <Link
        href="/auth"
        className="rounded-full border border-[#315d42]/20 bg-[#e7f0dc] px-4 py-2 transition hover:bg-[#d9e8cc]"
      >
        Sign in
      </Link>
      <Link
        href="/signup"
        className="rounded-full bg-[#315d42] px-4 py-2 text-white transition hover:bg-[#254a34]"
      >
        Start now
      </Link>
    </>
  );
}
