import { ingredients } from "@/lib/mealpush/ingredients";

export type Recipe = {
  id: string;
  title: string;
  subtitle: string;
  time: number;
  calories: number;
  protein: number;
  servings: number;
  tone: "orange" | "green" | "yellow";
  steps: string[];
};

export type StoredWeekPlans = Record<
  string,
  {
    selectedIds: string[];
    savedAt: string;
  }
>;

export const currentRecipes: Recipe[] = [
  {
    id: "harissa-chicken",
    title: "Harissa chicken bowls",
    subtitle: "Roasted broccoli, lemon rice",
    time: 28,
    calories: 540,
    protein: 46,
    servings: 3,
    tone: "orange",
    steps: [
      "Season the chicken and heat the oven to 425°F.",
      "Roast the broccoli while the rice finishes.",
      "Slice, portion, and finish with lemon dressing.",
    ],
  },
  {
    id: "salmon-greens",
    title: "Miso salmon & greens",
    subtitle: "Sesame quinoa, crisp vegetables",
    time: 24,
    calories: 510,
    protein: 39,
    servings: 2,
    tone: "green",
    steps: [
      "Brush the salmon with the miso glaze.",
      "Cook the quinoa and quickly sauté the greens.",
      "Bake the salmon, then divide into containers.",
    ],
  },
  {
    id: "turkey-skillet",
    title: "Golden turkey skillet",
    subtitle: "Sweet potato, herbs, avocado",
    time: 26,
    calories: 475,
    protein: 42,
    servings: 3,
    tone: "yellow",
    steps: [
      "Brown the turkey with garlic and warm spices.",
      "Add the sweet potato and cook until tender.",
      "Cool slightly, then portion with avocado and herbs.",
    ],
  },
];

export const previousRecipes: Recipe[] = [
  {
    id: "lemon-salmon",
    title: "Lemon salmon trays",
    subtitle: "Herby potatoes, green beans",
    time: 31,
    calories: 525,
    protein: 41,
    servings: 3,
    tone: "green",
    steps: [
      "Roast the potatoes until their edges begin to crisp.",
      "Add the salmon and green beans to the tray.",
      "Finish with lemon and divide into three containers.",
    ],
  },
  {
    id: "beef-rice",
    title: "Ginger beef rice bowls",
    subtitle: "Carrots, spinach, sesame",
    time: 25,
    calories: 565,
    protein: 44,
    servings: 3,
    tone: "orange",
    steps: [
      "Brown the beef with ginger and garlic.",
      "Steam the rice and quickly wilt the spinach.",
      "Portion with carrots and sprinkle with sesame.",
    ],
  },
  {
    id: "tofu-quinoa",
    title: "Crispy tofu quinoa",
    subtitle: "Peppers, herbs, yogurt sauce",
    time: 27,
    calories: 455,
    protein: 30,
    servings: 2,
    tone: "yellow",
    steps: [
      "Press and season the tofu, then sear until crisp.",
      "Cook the quinoa and sauté the peppers.",
      "Pack with herbs and yogurt sauce on the side.",
    ],
  },
];

export function recipesFromSelection(
  selectedIds: string[],
  weekKey: string,
): Recipe[] {
  const selected = selectedIds
    .map((id) => ingredients.find((ingredient) => ingredient.id === id))
    .filter((ingredient) => Boolean(ingredient));
  const choice = (category: string, fallback: string) =>
    selected.find((ingredient) => ingredient?.category === category)?.name ??
    fallback;
  const protein = choice("Protein", "Chicken");
  const carb = choice("Carbs", "Rice");
  const vegetable = choice("Vegetables", "Seasonal greens");
  const extra = choice("Extras", "Fresh herbs");

  return [
    {
      id: `${weekKey}-bowl`,
      title: `${protein} & ${carb} bowls`,
      subtitle: `${vegetable}, ${extra}`,
      time: 27,
      calories: 525,
      protein: 43,
      servings: 3,
      tone: "orange",
      steps: [
        `Season and cook the ${protein}.`,
        `Prepare the ${carb} and roast the ${vegetable}.`,
        `Portion everything and finish with ${extra}.`,
      ],
    },
    {
      id: `${weekKey}-tray`,
      title: `Roasted ${protein} trays`,
      subtitle: `${vegetable}, warm ${carb}`,
      time: 30,
      calories: 490,
      protein: 45,
      servings: 3,
      tone: "green",
      steps: [
        "Heat the oven and line a large sheet pan.",
        `Roast the ${protein} and ${vegetable} until golden.`,
        `Pack with ${carb} and let cool before sealing.`,
      ],
    },
    {
      id: `${weekKey}-salad`,
      title: `${carb} prep salad`,
      subtitle: `${protein}, ${vegetable}, ${extra}`,
      time: 21,
      calories: 445,
      protein: 34,
      servings: 2,
      tone: "yellow",
      steps: [
        `Cook the ${carb} and let it cool slightly.`,
        `Slice the ${protein} and chop the ${vegetable}.`,
        `Toss together and finish with ${extra}.`,
      ],
    },
  ];
}
