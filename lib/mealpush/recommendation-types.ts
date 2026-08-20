export type MealRecommendation = {
  recipeId: string;
  name: string;
  detail: string;
  cuisine: string;
  mealType: string;
  servings: number;
  totalMinutes: number;
  calories: number;
  costPerServing: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  ingredients: string[];
  ingredientIds: string[];
  steps: string[];
  videoUrl: string;
  matchedIngredientIds: string[];
  matchedIngredientNames: string[];
  selectionMatchPercent: number;
  mealPrepScore: number;
  freezerFriendly: boolean;
};
