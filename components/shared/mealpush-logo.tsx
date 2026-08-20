"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";

export default function MealpushLogo({
  className = "text-2xl",
}: Readonly<{ className?: string }>) {
  const { user } = useAuth();

  return (
    <Link
      href={user ? "/dashboard" : "/"}
      className={`${className} font-bold leading-none tracking-tight`}
      style={{ fontFamily: "var(--font-baloo)" }}
      aria-label={user ? "Mealpush dashboard" : "Mealpush home"}
    >
      <span className="text-[#174c32]">meal</span>
      <span className="text-[#94bf4a]">push</span>
    </Link>
  );
}
