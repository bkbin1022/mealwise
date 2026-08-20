export const ingredientCategories = [
  "Protein",
  "Carbs",
  "Vegetables",
  "Fats",
  "Extras",
] as const;

export type IngredientCategory = (typeof ingredientCategories)[number];

export type Ingredient = {
  id: string;
  name: string;
  category: IngredientCategory;
  colors: [string, string, string];
  recipeCount?: number;
};

export const ingredients: Ingredient[] = [
  { id: "chicken", name: "Chicken", category: "Protein", colors: ["#F4C89B", "#D98F56", "#FFF3E3"] },
  { id: "beef", name: "Beef", category: "Protein", colors: ["#8C493D", "#C66D52", "#F5D4C9"] },
  { id: "salmon", name: "Salmon", category: "Protein", colors: ["#F29B72", "#E56C51", "#FFE1D3"] },
  { id: "egg", name: "Egg", category: "Protein", colors: ["#F8D368", "#FFF8DB", "#F0B64C"] },
  { id: "turkey", name: "Turkey", category: "Protein", colors: ["#D8A878", "#A96845", "#F2DDC2"] },
  { id: "pork", name: "Pork", category: "Protein", colors: ["#EBA49C", "#C86E67", "#FFE0DC"] },
  { id: "shrimp", name: "Shrimp", category: "Protein", colors: ["#F29C79", "#E66B55", "#FFE3D7"] },
  { id: "tofu", name: "Tofu", category: "Protein", colors: ["#EFE2C5", "#CDBA90", "#FFF9EA"] },
  { id: "rice", name: "Rice", category: "Carbs", colors: ["#F3E5C4", "#D5BD86", "#FFF9E9"] },
  { id: "sweet-potato", name: "Sweet Potato", category: "Carbs", colors: ["#D8793F", "#F0A85B", "#FFE0BD"] },
  { id: "potato", name: "Potato", category: "Carbs", colors: ["#CCAA67", "#98733C", "#F1DCAC"] },
  { id: "pasta", name: "Pasta", category: "Carbs", colors: ["#E9BE58", "#C99332", "#FFF0B6"] },
  { id: "quinoa", name: "Quinoa", category: "Carbs", colors: ["#D7B46D", "#98703A", "#F8E5BB"] },
  { id: "oats", name: "Oats", category: "Carbs", colors: ["#D7BF8D", "#AE8951", "#F6E8C8"] },
  { id: "broccoli", name: "Broccoli", category: "Vegetables", colors: ["#5E9F58", "#2F6B42", "#B9D88A"] },
  { id: "onion", name: "Onion", category: "Vegetables", colors: ["#D9B7D9", "#925D9D", "#F4E4F2"] },
  { id: "carrot", name: "Carrot", category: "Vegetables", colors: ["#EE964B", "#D3662E", "#B3D273"] },
  { id: "bell-pepper", name: "Bell Pepper", category: "Vegetables", colors: ["#E6664F", "#B53E31", "#8EBC65"] },
  { id: "spinach", name: "Spinach", category: "Vegetables", colors: ["#72A866", "#326D47", "#B8D99E"] },
  { id: "zucchini", name: "Zucchini", category: "Vegetables", colors: ["#7EAA55", "#3D713F", "#CDE1A6"] },
  { id: "avocado", name: "Avocado", category: "Fats", colors: ["#A6C665", "#55793F", "#F1D274"] },
  { id: "olive-oil", name: "Olive Oil", category: "Fats", colors: ["#CFB844", "#71843D", "#F5E49A"] },
  { id: "almonds", name: "Almonds", category: "Fats", colors: ["#BA7F52", "#7E4F34", "#E9C09C"] },
  { id: "peanut-butter", name: "Peanut Butter", category: "Fats", colors: ["#C98B48", "#8F582C", "#EAC08A"] },
  { id: "greek-yogurt", name: "Greek Yogurt", category: "Extras", colors: ["#F4F0E7", "#9DB7C7", "#DCE9EE"] },
  { id: "feta", name: "Feta", category: "Extras", colors: ["#F0EAD9", "#C9BE9F", "#FFFFFF"] },
  { id: "lemon", name: "Lemon", category: "Extras", colors: ["#F1D85B", "#C1A52F", "#FFF3A8"] },
  { id: "herbs", name: "Fresh Herbs", category: "Extras", colors: ["#6FA362", "#316943", "#B8D497"] },
];
