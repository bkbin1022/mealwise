import IngredientPlanner from "@/components/plan/ingredient-planner";

export default async function PlanPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ week?: string | string[] }>;
}>) {
  const query = await searchParams;
  const requestedWeek = Array.isArray(query.week) ? query.week[0] : query.week;
  const planWeek = requestedWeek && /^\d{4}-\d{2}-\d{2}$/.test(requestedWeek)
    ? requestedWeek
    : undefined;

  return <IngredientPlanner planWeek={planWeek} />;
}
