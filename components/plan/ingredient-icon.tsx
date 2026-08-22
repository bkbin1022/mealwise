import Image from "next/image";
import type { Ingredient } from "@/lib/mealpush/ingredients";

type IngredientIconName =
  | "chicken"
  | "beef"
  | "salmon"
  | "egg"
  | "turkey"
  | "pork"
  | "shrimp"
  | "tofu"
  | "rice"
  | "sweet-potato"
  | "potato"
  | "pasta"
  | "quinoa"
  | "oats"
  | "broccoli"
  | "onion"
  | "carrot"
  | "bell-pepper"
  | "spinach"
  | "zucchini"
  | "avocado"
  | "olive-oil"
  | "almonds"
  | "peanut-butter"
  | "greek-yogurt";

const iconAliases: Record<IngredientIconName, string[]> = {
  chicken: ["chicken", "chicken_breast", "chicken_thigh"],
  beef: ["beef", "beef_sirloin", "ground_beef"],
  salmon: ["salmon", "cod", "canned_tuna", "scallops"],
  egg: ["egg"],
  turkey: ["turkey", "turkey_breast", "ground_turkey"],
  pork: ["pork", "pork_tenderloin", "ground_pork"],
  shrimp: ["shrimp"],
  tofu: ["tofu", "firm_tofu", "extra_firm_tofu", "tempeh", "seitan", "halloumi"],
  rice: ["rice", "brown_rice", "white_rice"],
  "sweet-potato": ["sweet_potato"],
  potato: ["potato"],
  pasta: ["pasta", "whole_wheat_pasta", "rice_noodles", "udon_noodles", "soba_noodles"],
  quinoa: ["quinoa", "couscous", "bulgur"],
  oats: ["oats"],
  broccoli: ["broccoli", "cauliflower"],
  onion: ["onion", "green_onion"],
  carrot: ["carrot"],
  "bell-pepper": ["bell_pepper"],
  spinach: ["spinach", "cabbage", "bok_choy", "green_beans", "peas"],
  zucchini: ["zucchini", "cucumber", "eggplant"],
  avocado: ["avocado"],
  "olive-oil": ["olive_oil", "sesame_oil", "avocado_oil"],
  almonds: ["almonds"],
  "peanut-butter": ["peanut_butter"],
  "greek-yogurt": ["greek_yogurt", "coconut_milk", "feta"],
};

const standaloneIngredientIconIds = new Set([
  // Protein
  "beef_sirloin",
  "black_beans",
  "brown_lentils",
  "canned_tuna",
  "chicken_breast",
  "chicken_thigh",
  "chickpeas",
  "cod",
  "edamame",
  "egg",
  "extra_firm_tofu",
  "firm_tofu",
  "ground_beef",
  "ground_pork",
  "ground_turkey",
  "halloumi",
  "kidney_beans",
  "pork_tenderloin",
  "salmon",
  "scallops",
  "seitan",
  "shrimp",
  "tempeh",
  "turkey_breast",
  "white_beans",
  // Carbs
  "brown_rice",
  "bulgur",
  "corn_tortilla",
  "couscous",
  "pasta",
  "pita",
  "potato",
  "quinoa",
  "rice_noodles",
  "soba_noodles",
  "sweet_potato",
  "tortilla",
  "udon_noodles",
  "white_rice",
  "whole_wheat_pasta",
  // Vegetables
  "bell_pepper",
  "bok_choy",
  "broccoli",
  "cabbage",
  "carrot",
  "cauliflower",
  "cherry_tomato",
  "corn",
  "cucumber",
  "eggplant",
  "green_beans",
  "mushroom",
  "onion",
  "peas",
  "spinach",
  "tomato",
  "zucchini",
  // Fats
  "almonds",
  "avocado",
  "avocado_oil",
  "olive_oil",
  "peanut_butter",
  "sesame_oil",
  // Extras
  "balsamic_vinegar",
  "basil",
  "bbq_sauce",
  "chili_powder",
  "cilantro",
  "coconut_milk",
  "cumin",
  "curry_powder",
  "dijon_mustard",
  "fish_sauce",
  "garam_masala",
  "garlic",
  "ginger",
  "gochujang",
  "greek_yogurt",
  "green_onion",
  "honey",
  "italian_seasoning",
  "lemon",
  "lime",
  "parsley",
  "rice_vinegar",
  "salsa",
  "smoked_paprika",
  "soy_sauce",
  "tamari",
  "tomato_sauce",
  "turmeric",
]);

function resolveIconName(id: string): IngredientIconName | null {
  const normalizedId = id.replaceAll("-", "_");

  for (const [name, aliases] of Object.entries(iconAliases) as Array<
    [IngredientIconName, string[]]
  >) {
    if (aliases.includes(normalizedId)) return name;
  }

  return null;
}

function IngredientGlyph({
  name,
  base,
  dark,
}: Readonly<{ name: IngredientIconName | null; base: string; dark: string }>) {
  const cream = "#FFFDF9";
  const green = "#315D42";

  switch (name) {
    case "chicken":
      return (
        <>
          <path d="M31 57c-8-7-8-20 1-29 9-9 24-7 29 3 5 11-2 24-14 27-6 2-12 1-16-1Z" fill={base} />
          <path d="m56 29 8-8m-2 4 5 5m-9-8 5-5" fill="none" />
          <path d="M34 42c4 5 11 7 17 5" fill="none" opacity=".75" />
        </>
      );
    case "beef":
      return (
        <>
          <path d="M24 48c-2-13 8-24 23-25 14-1 25 7 26 19 1 14-11 26-28 27-13 0-20-8-21-21Z" fill={base} />
          <path d="M38 39c7-6 18-5 22 2 5 8-3 17-12 16-9-1-15-11-10-18Z" fill={cream} />
          <path d="M29 52c6-2 11 1 15 6" fill="none" opacity=".7" />
        </>
      );
    case "salmon":
      return (
        <>
          <path d="M20 53c12-20 31-29 52-20-4 17-18 30-39 34L20 53Z" fill={base} />
          <path d="M27 51c12-2 27-9 38-17M35 59l-6-8m17 4-7-9m19 2-7-8" fill="none" />
          <path d="M20 53 13 65l18-3" fill={cream} />
        </>
      );
    case "egg":
      return (
        <>
          <path d="M20 49c0-11 9-16 18-18 8-2 11-10 20-7 8 2 8 11 14 16 7 6 4 18-4 24-8 7-20 3-29 5-11 2-19-8-19-20Z" fill={cream} />
          <circle cx="49" cy="47" r="13" fill={base} />
          <path d="M44 41c3-3 8-3 11 0" fill="none" stroke={cream} opacity=".7" />
        </>
      );
    case "turkey":
      return (
        <>
          <path d="M28 60c-8-9-4-27 8-34 12-7 28-3 32 9 4 13-6 27-21 31-8 2-15 0-19-6Z" fill={base} />
          <path d="m63 31 7-8m-4 3 5 5m-9-7 5-5" fill="none" />
          <path d="M35 46c6-7 16-9 24-4M39 55c6-5 13-6 19-3" fill="none" opacity=".7" />
        </>
      );
    case "pork":
      return (
        <>
          <path d="M23 54c-2-14 8-26 22-28 17-3 30 8 29 23-1 13-13 23-29 23-13 0-21-7-22-18Z" fill={base} />
          <circle cx="57" cy="44" r="8" fill={cream} />
          <circle cx="57" cy="44" r="3" fill={dark} />
          <path d="M29 59c8-3 14 0 19 6" fill="none" opacity=".65" />
        </>
      );
    case "shrimp":
      return (
        <>
          <path d="M67 29C49 20 27 31 25 49c-2 15 13 24 26 16 9-6 10-18 3-24-7-6-17-2-17 6 0 6 6 9 11 7" fill="none" stroke={base} strokeWidth="10" />
          <path d="m64 29 10-9-1 15 9 5-15 3" fill={base} />
          <path d="M32 36l7 8m1-14 7 9m3-11 5 9" fill="none" stroke={cream} />
          <circle cx="65" cy="30" r="2.5" fill={dark} stroke="none" />
        </>
      );
    case "tofu":
      return (
        <>
          <path d="m25 40 22-13 24 12-23 14-23-13Z" fill={cream} />
          <path d="m25 40 23 13v25L25 64V40Z" fill={base} />
          <path d="m48 53 23-14v25L48 78V53Z" fill={base} opacity=".75" />
          <circle cx="37" cy="55" r="2" fill={dark} stroke="none" opacity=".55" />
          <circle cx="58" cy="58" r="2" fill={dark} stroke="none" opacity=".4" />
        </>
      );
    case "rice":
      return (
        <>
          <path d="M22 48h52c-1 18-10 27-26 27S23 66 22 48Z" fill={base} />
          <path d="M27 47c3-14 38-18 43 0" fill={cream} />
          <path d="M33 41c2-3 5-3 7 0m3-5c2-3 5-3 7 0m3 5c2-3 5-3 7 0" fill="none" />
        </>
      );
    case "sweet-potato":
      return (
        <>
          <path d="M25 57c-4-12 5-27 20-33 15-6 29 0 29 12 0 13-14 28-29 33-10 4-17 0-20-12Z" fill={base} />
          <path d="M62 28c0-8 5-13 13-14-1 8-5 13-13 14Z" fill="#6EAC72" />
          <path d="M36 52c7-8 15-12 25-12M37 61c8-3 14-8 18-14" fill="none" opacity=".65" />
        </>
      );
    case "potato":
      return (
        <>
          <path d="M20 52c0-16 12-28 28-29 17-1 29 10 28 25-1 16-15 27-32 27-15 0-24-9-24-23Z" fill={base} />
          <circle cx="38" cy="40" r="2.5" fill={dark} stroke="none" opacity=".65" />
          <circle cx="57" cy="35" r="2" fill={dark} stroke="none" opacity=".55" />
          <circle cx="60" cy="57" r="3" fill={dark} stroke="none" opacity=".55" />
          <path d="M31 60c5 4 11 5 16 2" fill="none" opacity=".5" />
        </>
      );
    case "pasta":
      return (
        <>
          <path d="M20 51h56c-2 17-11 25-28 25S22 68 20 51Z" fill={base} />
          <path d="M28 48c2-14 10-22 19-22 8 0 11 8 5 13-5 4-12 2-12-3 0-4 5-6 10-4 8 4 6 15-2 16m8 0c2-9 7-14 15-15" fill="none" stroke="#D39B32" strokeWidth="5" />
          <path d="M26 51h44" fill="none" />
        </>
      );
    case "quinoa":
      return (
        <>
          <path d="M21 49h54c-1 17-11 26-27 26S22 66 21 49Z" fill={base} />
          <path d="M27 47c4-15 38-16 43 0" fill={cream} />
          {[34, 43, 52, 61].map((cx, index) => (
            <circle key={cx} cx={cx} cy={index % 2 ? 42 : 38} r="2.7" fill={dark} stroke="none" opacity=".7" />
          ))}
        </>
      );
    case "oats":
      return (
        <>
          <path d="M48 73V25m0 17-12-9m12 20 13-10m-13 21-14-8" fill="none" />
          <ellipse cx="33" cy="30" rx="5" ry="9" fill={base} transform="rotate(-42 33 30)" />
          <ellipse cx="63" cy="39" rx="5" ry="9" fill={base} transform="rotate(42 63 39)" />
          <ellipse cx="31" cy="53" rx="5" ry="9" fill={base} transform="rotate(-48 31 53)" />
          <ellipse cx="54" cy="24" rx="5" ry="9" fill={base} transform="rotate(25 54 24)" />
        </>
      );
    case "broccoli":
      return (
        <>
          <path d="M42 48h14l6 26H35l7-26Z" fill={base} />
          <circle cx="35" cy="39" r="13" fill="#6EAC72" />
          <circle cx="51" cy="31" r="16" fill={base} />
          <circle cx="64" cy="43" r="13" fill="#6EAC72" />
          <path d="M48 48c0-8 5-14 11-17" fill="none" />
        </>
      );
    case "onion":
      return (
        <>
          <path d="M49 24c2 9 18 15 20 28 2 13-7 23-21 23S25 66 27 52c2-13 18-19 22-28Z" fill={base} />
          <path d="M49 24c-3-5-1-10 4-14m-4 14c4-5 9-7 14-6" fill="none" stroke={green} />
          <path d="M48 37v29M39 40c-4 10-2 20 5 28m13-28c4 10 2 20-5 28" fill="none" opacity=".65" />
        </>
      );
    case "carrot":
      return (
        <>
          <path d="m33 32 34 7-27 37-7-44Z" fill={base} />
          <path d="M35 31c-7-8-6-15-1-21 7 6 9 13 5 21m1 1c3-10 10-15 18-15-1 9-6 15-18 18" fill="#6EAC72" />
          <path d="m39 43 11 2m-8 9 9 2" fill="none" opacity=".65" />
        </>
      );
    case "bell-pepper":
      return (
        <>
          <path d="M31 34c8-7 27-7 35 0 7 7 8 26 1 36-6 8-15 5-19 1-5 4-14 7-20-1-7-10-5-29 3-36Z" fill={base} />
          <path d="M48 34c-2-10 2-16 10-19" fill="none" stroke={green} />
          <path d="M48 38v30M35 40c-3 11-2 20 4 29m22-29c3 11 2 20-4 29" fill="none" opacity=".6" />
        </>
      );
    case "spinach":
      return (
        <>
          <path d="M47 73C20 61 19 34 35 22c15 5 23 22 12 51Z" fill={base} />
          <path d="M49 73c-4-28 6-48 25-53 12 17 3 42-25 53Z" fill="#6EAC72" />
          <path d="M48 72 36 35m13 35 16-36M39 47l-10-5m29 4 12-8" fill="none" />
        </>
      );
    case "zucchini":
      return (
        <>
          <path d="M24 61c-4-8 2-17 13-22l30-14c6 6 8 12 5 18L39 67c-7 4-13 2-15-6Z" fill={base} />
          <path d="m67 25 8-6 4 7-8 6" fill="#6EAC72" />
          <path d="M34 57 65 35M42 62l26-19" fill="none" stroke={cream} opacity=".65" />
          <circle cx="30" cy="59" r="7" fill={cream} opacity=".75" />
        </>
      );
    case "avocado":
      return (
        <>
          <path d="M48 18c9 0 23 25 23 38 0 12-10 20-23 20s-23-8-23-20c0-13 14-38 23-38Z" fill={base} />
          <path d="M48 28c6 0 16 20 16 29 0 8-7 13-16 13s-16-5-16-13c0-9 10-29 16-29Z" fill="#DCECCB" />
          <circle cx="48" cy="57" r="9" fill="#BA7F52" />
        </>
      );
    case "olive-oil":
      return (
        <>
          <path d="M39 20h18v13l7 9v30c0 5-4 8-8 8H40c-5 0-8-3-8-8V42l7-9V20Z" fill={base} />
          <path d="M39 20h18v9H39z" fill={green} />
          <rect x="37" y="45" width="22" height="20" rx="8" fill={cream} />
          <path d="M48 60c-6-4-7-10 0-15 7 5 6 11 0 15Z" fill="#6EAC72" stroke="none" />
        </>
      );
    case "almonds":
      return (
        <>
          <path d="M28 61c-7-11 0-26 13-32 9 10 6 27-7 35-2 1-4 0-6-3Z" fill={base} />
          <path d="M48 66c-7-12 0-28 14-34 10 11 6 29-8 37-2 1-5 0-6-3Z" fill={base} opacity=".8" />
          <path d="M32 55c2-8 5-14 10-20m11 25c2-9 6-16 11-22" fill="none" opacity=".65" />
        </>
      );
    case "peanut-butter":
      return (
        <>
          <path d="M29 35h38v38c0 5-4 8-8 8H37c-5 0-8-3-8-8V35Z" fill={base} />
          <path d="M27 25h42v13H27z" fill={green} />
          <rect x="34" y="46" width="28" height="23" rx="8" fill={cream} />
          <path d="M41 59c3-7 11-9 16-4-2 7-10 10-16 4Z" fill="#C98B48" stroke="none" />
        </>
      );
    case "greek-yogurt":
      return (
        <>
          <path d="M23 49h51c-2 18-10 27-26 27S25 67 23 49Z" fill={cream} />
          <path d="M28 47c4-14 35-15 41 0" fill={base} opacity=".65" />
          <path d="M58 43c3-10 8-17 15-22m-13 19 9 4" fill="none" />
          <circle cx="42" cy="40" r="4" fill="#6EAC72" stroke="none" />
          <circle cx="51" cy="43" r="3" fill="#F1A55B" stroke="none" />
        </>
      );
    default:
      return (
        <>
          <path d="M26 54c0-19 10-31 26-31 15 0 23 13 20 30-3 15-13 23-27 21-12-1-19-8-19-20Z" fill={base} />
          <path d="M35 42c9-7 21-8 30-1" fill="none" />
          <circle cx="40" cy="54" r="3" fill={dark} stroke="none" opacity=".8" />
          <circle cx="56" cy="57" r="4" fill={dark} stroke="none" opacity=".65" />
          <path d="M45 24c1-8 7-13 15-13" fill="none" stroke={green} />
        </>
      );
  }
}

export default function IngredientIcon({ ingredient }: Readonly<{ ingredient: Ingredient }>) {
  const ingredientId = ingredient.id.replaceAll("-", "_");

  if (standaloneIngredientIconIds.has(ingredientId)) {
    return (
      <Image
        src={`/ingredient-icons/${ingredientId}.svg`}
        alt=""
        aria-hidden="true"
        width={96}
        height={96}
        unoptimized
        className="size-[4.5rem] shrink-0 transition-transform duration-200 group-hover:scale-105"
      />
    );
  }

  const [base, dark, light] = ingredient.colors;
  const iconName = resolveIconName(ingredient.id);

  return (
    <svg
      viewBox="0 0 96 96"
      aria-hidden="true"
      className="size-[4.5rem] shrink-0 transition-transform duration-200 group-hover:scale-105"
    >
      <circle cx="48" cy="48" r="45" fill={light} />
      <circle cx="69" cy="27" r="11" fill="#FFFFFF" opacity=".32" />
      <g
        stroke={dark}
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <IngredientGlyph name={iconName} base={base} dark={dark} />
      </g>
    </svg>
  );
}
