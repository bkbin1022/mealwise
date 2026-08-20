import ingredientDatabase from "@/data/ingredients.json";
import recipeDatabase from "@/data/recipes.json";
import type { Ingredient, IngredientCategory } from "@/lib/mealpush/ingredients";
import type { MealRecommendation } from "@/lib/mealpush/recommendation-types";

type DatasetIngredient = {
  display_name: string;
  category: string;
};

type DatasetRecipe = {
  recipe_id: string;
  name: string;
  slug: string;
  description: string;
  primary_protein: string;
  cuisine: string;
  meal_type: string;
  servings: number;
  ingredients: Array<{
    ingredient_id: string;
    name: string;
    quantity: number;
    unit: "g" | "ml" | "piece";
    category: string;
    optional: boolean;
  }>;
  instructions: string[];
  nutrition_per_serving: {
    calories_kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
  };
  timing: {
    prep_minutes: number;
    cook_minutes: number;
    total_minutes: number;
  };
  estimated_cost: {
    cost_per_serving_usd: number;
    cost_total_usd: number;
    cost_tier: string;
  };
  meal_prep: {
    meal_prep_score: number;
    reheat_score: number;
    freezer_friendly: boolean;
    fridge_storage_days: number;
    freezer_storage_days: number;
    batch_cooking_score: number;
  };
  dietary_tags: string[];
  ingredient_count: number;
  core_ingredients: string[];
  supporting_ingredients: string[];
  optimization_tags: {
    high_protein: boolean;
    low_cost: boolean;
    low_ingredient_count: boolean;
    quick_prep: boolean;
    good_for_batching: boolean;
  };
  variety_group: string;
};

const taxonomy = ingredientDatabase as Record<string, DatasetIngredient>;
const recipes = recipeDatabase as DatasetRecipe[];

const categoryPalettes: Record<IngredientCategory, Array<[string, string, string]>> = {
  Protein: [
    ["#F4C89B", "#D98F56", "#FFF3E3"],
    ["#EBA49C", "#A9544D", "#FFE0DC"],
    ["#F29B72", "#D75E49", "#FFE1D3"],
    ["#E8C98E", "#9B7645", "#FFF2D5"],
  ],
  Carbs: [
    ["#F3E5C4", "#B99655", "#FFF9E9"],
    ["#D8793F", "#A7552B", "#FFE0BD"],
    ["#E9BE58", "#A87821", "#FFF0B6"],
    ["#D7BF8D", "#8E6B39", "#F6E8C8"],
  ],
  Vegetables: [
    ["#5E9F58", "#2F6B42", "#DCECCB"],
    ["#EE964B", "#C35628", "#FFE0BD"],
    ["#E6664F", "#A6382D", "#FAD9D3"],
    ["#8EAA63", "#456E43", "#E7F0DC"],
  ],
  Fats: [
    ["#A6C665", "#55793F", "#EEF4D8"],
    ["#CFB844", "#71843D", "#F5E49A"],
    ["#BA7F52", "#7E4F34", "#E9C09C"],
    ["#C98B48", "#8F582C", "#F2D5AE"],
  ],
  Extras: [
    ["#F1D85B", "#A68F24", "#FFF3A8"],
    ["#6FA362", "#316943", "#DDECCF"],
    ["#D9B7D9", "#925D9D", "#F4E4F2"],
    ["#EBA49C", "#A9544D", "#FFE4DF"],
  ],
};

function plannerCategory(databaseCategory: string): IngredientCategory | null {
  if (databaseCategory === "protein") return "Protein";
  if (databaseCategory === "carb") return "Carbs";
  if (databaseCategory === "vegetable") return "Vegetables";
  if (databaseCategory === "fat") return "Fats";
  if (["fruit", "dairy", "sauce", "seasoning", "herb", "pantry"].includes(databaseCategory)) {
    return "Extras";
  }
  return null;
}

function ingredientUsage() {
  const usage = new Map<string, number>();
  for (const recipe of recipes) {
    for (const row of recipe.ingredients) {
      usage.set(row.ingredient_id, (usage.get(row.ingredient_id) ?? 0) + 1);
    }
  }
  return usage;
}

export function getSelectableIngredients(): Ingredient[] {
  const usage = ingredientUsage();
  const coreIds = new Set(recipes.flatMap((recipe) => recipe.core_ingredients));
  const grouped = new Map<IngredientCategory, Array<{ id: string; name: string; uses: number }>>();

  for (const [id, item] of Object.entries(taxonomy)) {
    const category = plannerCategory(item.category);
    if (!category) continue;
    const isPrimaryChoice = coreIds.has(id) || category === "Fats";
    const uses = usage.get(id) ?? 0;
    if (!isPrimaryChoice && (category !== "Extras" || uses === 0)) continue;
    const current = grouped.get(category) ?? [];
    current.push({ id, name: item.display_name, uses });
    grouped.set(category, current);
  }

  return (["Protein", "Carbs", "Vegetables", "Fats", "Extras"] as IngredientCategory[])
    .flatMap((category) => {
      const limit = category === "Extras" ? 28 : Number.POSITIVE_INFINITY;
      return (grouped.get(category) ?? [])
        .sort((first, second) => second.uses - first.uses || first.name.localeCompare(second.name))
        .slice(0, limit)
        .map((item, index) => ({
          id: item.id,
          name: item.name,
          category,
          colors: categoryPalettes[category][index % categoryPalettes[category].length],
          recipeCount: item.uses,
        }));
    });
}

type ScoredRecipe = {
  recipe: DatasetRecipe;
  baseScore: number;
  ingredientIds: Set<string>;
  matchedIds: string[];
};

function scoreRecipe(recipe: DatasetRecipe, selected: Set<string>): ScoredRecipe {
  const ingredientIds = new Set(recipe.ingredients.map((item) => item.ingredient_id));
  const matchedIds = [...selected].filter((id) => ingredientIds.has(id));
  const coreMatches = recipe.core_ingredients.filter((id) => selected.has(id)).length;
  const coverage = selected.size ? matchedIds.length / selected.size : 0;
  const coreCoverage = selected.size ? coreMatches / recipe.core_ingredients.length : 0;
  const qualityScore =
    recipe.meal_prep.meal_prep_score * 2.2
    + recipe.meal_prep.reheat_score * 1.1
    + recipe.meal_prep.batch_cooking_score * 1.2
    + (recipe.optimization_tags.high_protein ? 5 : 0)
    + (recipe.optimization_tags.low_cost ? 3 : 0)
    + (recipe.optimization_tags.quick_prep ? 2 : 0)
    - recipe.estimated_cost.cost_per_serving_usd * 0.8
    - Math.max(0, recipe.ingredient_count - 9) * 0.7;
  const matchScore = selected.size
    ? coverage * 58 + coreCoverage * 22 + matchedIds.length * 7 + coreMatches * 5
    : 0;

  return {
    recipe,
    baseScore: qualityScore + matchScore,
    ingredientIds,
    matchedIds,
  };
}

function formatIngredientQuantity(quantity: number, unit: string) {
  if (unit === "piece") return `${quantity} ${quantity === 1 ? "piece" : "pieces"}`;
  return `${quantity} ${unit}`;
}

function toRecommendation(item: ScoredRecipe, selectedCount: number): MealRecommendation {
  const recipe = item.recipe;
  const matchedIngredientNames = item.matchedIds.map(
    (id) => taxonomy[id]?.display_name ?? id.replaceAll("_", " "),
  );

  return {
    recipeId: recipe.recipe_id,
    name: recipe.name,
    detail: recipe.description,
    cuisine: recipe.cuisine,
    mealType: recipe.meal_type,
    servings: recipe.servings,
    totalMinutes: recipe.timing.total_minutes,
    calories: recipe.nutrition_per_serving.calories_kcal,
    costPerServing: recipe.estimated_cost.cost_per_serving_usd,
    macros: {
      protein: recipe.nutrition_per_serving.protein_g,
      carbs: recipe.nutrition_per_serving.carbs_g,
      fat: recipe.nutrition_per_serving.fat_g,
      fiber: recipe.nutrition_per_serving.fiber_g,
    },
    ingredients: recipe.ingredients.map(
      (row) => `${formatIngredientQuantity(row.quantity, row.unit)} ${row.name}${row.optional ? " (optional)" : ""}`,
    ),
    ingredientIds: [...item.ingredientIds],
    steps: recipe.instructions,
    videoUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${recipe.name} meal prep recipe`)}`,
    matchedIngredientIds: item.matchedIds,
    matchedIngredientNames,
    selectionMatchPercent: selectedCount
      ? Math.round((item.matchedIds.length / selectedCount) * 100)
      : 0,
    mealPrepScore: recipe.meal_prep.meal_prep_score,
    freezerFriendly: recipe.meal_prep.freezer_friendly,
  };
}

export function recommendMealPlan(selectedIngredientIds: string[]): MealRecommendation[] {
  const knownIds = new Set(Object.keys(taxonomy));
  const selected = new Set(selectedIngredientIds.filter((id) => knownIds.has(id)));
  const selectedProteins = [...selected].filter(
    (id) => taxonomy[id]?.category === "protein",
  );
  const scoredRecipes = recipes.map((recipe) => scoreRecipe(recipe, selected));
  const proteinMatches = selectedProteins.length
    ? scoredRecipes.filter((candidate) =>
        selectedProteins.some((id) => candidate.ingredientIds.has(id)),
      )
    : scoredRecipes;
  const candidateSource = proteinMatches.length >= 3 ? proteinMatches : scoredRecipes;
  const candidates = candidateSource
    .sort((first, second) => second.baseScore - first.baseScore || first.recipe.recipe_id.localeCompare(second.recipe.recipe_id))
    .slice(0, 160);
  const chosen: ScoredRecipe[] = [];
  const covered = new Set<string>();
  const reusedIngredients = new Set<string>();

  while (chosen.length < 3 && candidates.length) {
    let bestIndex = -1;
    let bestScore = Number.NEGATIVE_INFINITY;

    candidates.forEach((candidate, index) => {
      const newMatches = candidate.matchedIds.filter((id) => !covered.has(id)).length;
      const sharedIngredients = [...candidate.ingredientIds].filter((id) => reusedIngredients.has(id)).length;
      const sameCuisine = chosen.some((item) => item.recipe.cuisine === candidate.recipe.cuisine);
      const sameMealType = chosen.some((item) => item.recipe.meal_type === candidate.recipe.meal_type);
      const sameProtein = chosen.some((item) => item.recipe.primary_protein === candidate.recipe.primary_protein);
      const sameVarietyGroup = chosen.some((item) => item.recipe.variety_group === candidate.recipe.variety_group);
      const combinationScore =
        candidate.baseScore
        + newMatches * 16
        + Math.min(sharedIngredients, 5) * 1.4
        - (sameCuisine ? 8 : 0)
        - (sameMealType ? 8 : 0)
        - (sameProtein ? 4 : 0)
        - (sameVarietyGroup ? 38 : 0);

      if (combinationScore > bestScore) {
        bestScore = combinationScore;
        bestIndex = index;
      }
    });

    const [best] = candidates.splice(bestIndex, 1);
    chosen.push(best);
    best.matchedIds.forEach((id) => covered.add(id));
    best.ingredientIds.forEach((id) => reusedIngredients.add(id));
  }

  return chosen.map((item) => toRecommendation(item, selected.size));
}
