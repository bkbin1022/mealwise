import type { Metadata } from "next";
import { redirect } from "next/navigation";
import MealDashboard from "@/components/dashboard/meal-dashboard";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dashboard | Mealpush",
  description: "Your Mealpush weekly meal-prep dashboard.",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims?.sub) {
    redirect("/auth");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const fullName = user?.user_metadata?.full_name;
  const rawAvatarUrl = user?.user_metadata?.avatar_url;
  const userName =
    typeof fullName === "string" && fullName.trim()
      ? fullName.trim().split(" ")[0]
      : user?.email?.split("@")[0] ?? "there";
  const avatarUrl =
    typeof rawAvatarUrl === "string" && /^https?:\/\//.test(rawAvatarUrl)
      ? rawAvatarUrl
      : undefined;

  return (
    <MealDashboard
      userId={user?.id ?? String(claimsData.claims.sub)}
      userName={userName}
      userEmail={user?.email ?? "Mealpush member"}
      avatarUrl={avatarUrl}
      todayISO={new Date().toISOString().slice(0, 10)}
    />
  );
}
