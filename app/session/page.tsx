import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PrepSessionScreen from "@/components/session/prep-session-screen";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Prepare session | Mealpush",
  description: "Move through your full Mealpush prep plan, one step at a time.",
};

export default async function SessionPage({
  searchParams,
}: PageProps<"/session">) {
  const supabase = await createClient();
  const { data: claimsData, error } = await supabase.auth.getClaims();

  if (error || !claimsData?.claims?.sub) {
    redirect("/auth?next=/session");
  }

  const params = await searchParams;
  const rawWeek = Array.isArray(params.week) ? params.week[0] : params.week;
  const rawStart = Array.isArray(params.start) ? params.start[0] : params.start;
  const weekKey =
    typeof rawWeek === "string" && /^\d{4}-\d{2}-\d{2}$/.test(rawWeek)
      ? rawWeek
      : undefined;

  return (
    <PrepSessionScreen
      userId={String(claimsData.claims.sub)}
      initialWeekKey={weekKey}
      initialRecipeId={typeof rawStart === "string" ? rawStart : undefined}
      todayISO={new Date().toISOString().slice(0, 10)}
    />
  );
}
