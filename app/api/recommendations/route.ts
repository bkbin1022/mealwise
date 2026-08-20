import { recommendMealPlan } from "@/lib/mealpush/recipe-database";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (
    !payload
    || typeof payload !== "object"
    || !("selectedIngredientIds" in payload)
    || !Array.isArray(payload.selectedIngredientIds)
    || payload.selectedIngredientIds.length > 120
    || payload.selectedIngredientIds.some((id) => typeof id !== "string")
  ) {
    return Response.json(
      { error: "selectedIngredientIds must be an array of ingredient IDs." },
      { status: 400 },
    );
  }

  const selectedIngredientIds = [...new Set(payload.selectedIngredientIds)];
  const recommendations = recommendMealPlan(selectedIngredientIds);

  return Response.json({ recommendations });
}
