"""Validate the Mealpush 500-recipe optimization dataset and write reports."""

from __future__ import annotations

import csv
import json
import math
import re
from collections import Counter, defaultdict
from difflib import SequenceMatcher
from itertools import combinations
from pathlib import Path
from statistics import mean
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
REPORTS_DIR = ROOT / "reports"

EXPECTED_PROTEINS = {
    "chicken": 110,
    "beef": 70,
    "pork": 45,
    "turkey": 35,
    "fish": 45,
    "shrimp_seafood": 25,
    "egg_based": 35,
    "tofu_vegetarian": 65,
    "beans_lentils_chickpeas": 50,
    "other": 20,
}

EXPECTED_CUISINES = {
    "american_western": 80,
    "korean": 60,
    "japanese": 45,
    "chinese_inspired": 45,
    "mexican_tex_mex": 60,
    "mediterranean": 55,
    "italian": 45,
    "indian": 40,
    "southeast_asian": 35,
    "middle_eastern": 20,
    "other_fusion": 15,
}

ALLOWED_CATEGORIES = {
    "protein", "carb", "vegetable", "fruit", "fat", "dairy",
    "sauce", "seasoning", "herb", "pantry", "other",
}
ALLOWED_UNITS = {"g", "ml", "piece"}
ALLOWED_MEAL_TYPES = {
    "rice_bowl", "pasta", "wrap", "salad", "stir_fry", "curry",
    "stew", "soup", "roasted_meal", "sheet_pan", "noodle_bowl",
    "grain_bowl", "burrito_bowl", "sandwich", "breakfast", "other",
}
ALLOWED_DIETARY_TAGS = {
    "high_protein", "vegetarian", "vegan", "pescatarian", "dairy_free",
    "gluten_free", "low_carb", "high_fiber", "budget", "freezer_friendly",
    "quick", "spicy",
}
ALLOWED_ALLERGENS = {
    "dairy", "egg", "fish", "shellfish", "soy", "wheat", "peanuts",
    "tree_nuts", "sesame",
}
ALLOWED_METHODS = {
    "stovetop", "oven", "roasting", "baking", "grilling", "air_fryer",
    "slow_cooker", "pressure_cooker", "no_cook", "rice_cooker",
}
ALLOWED_FLAVORS = {
    "savory", "spicy", "sweet", "tangy", "smoky", "creamy", "fresh",
    "umami", "herbaceous", "rich", "mild",
}
REQUIRED_FIELDS = {
    "recipe_id", "name", "slug", "description", "primary_protein", "cuisine",
    "meal_type", "servings", "ingredients", "instructions",
    "nutrition_per_serving", "timing", "estimated_cost", "meal_prep",
    "equipment", "dietary_tags", "allergens", "difficulty", "spice_level",
    "ingredient_count", "core_ingredients", "supporting_ingredients",
    "optimization_tags", "prep_components", "cooking_methods", "flavor_profile",
    "variety_group",
}


def load_json(path: Path) -> Any:
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def is_number(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def add_error(
    errors_by_recipe: dict[str, list[str]],
    recipe_id: str,
    message: str,
) -> None:
    errors_by_recipe[recipe_id].append(message)


def validate_taxonomy(ingredients: dict[str, Any], global_errors: list[str]) -> None:
    if not isinstance(ingredients, dict) or not ingredients:
        global_errors.append("ingredients.json must contain a non-empty object")
        return
    for ingredient_id, spec in ingredients.items():
        if not re.fullmatch(r"[a-z0-9]+(?:_[a-z0-9]+)*", ingredient_id):
            global_errors.append(f"Invalid ingredient_id format: {ingredient_id}")
        if spec.get("category") not in ALLOWED_CATEGORIES:
            global_errors.append(f"{ingredient_id} has an invalid category")
        if spec.get("basis_unit") not in ALLOWED_UNITS:
            global_errors.append(f"{ingredient_id} has an invalid basis unit")
        if not is_number(spec.get("basis_quantity")) or spec["basis_quantity"] <= 0:
            global_errors.append(f"{ingredient_id} has an invalid basis quantity")
        if not isinstance(spec.get("display_name"), str) or not spec["display_name"].strip():
            global_errors.append(f"{ingredient_id} is missing a display name")
        nutrition = spec.get("nutrition_per_basis_estimate", {})
        for field in ("protein_g", "carbs_g", "fat_g", "fiber_g"):
            if not is_number(nutrition.get(field)) or nutrition[field] < 0:
                global_errors.append(f"{ingredient_id} has invalid estimated {field}")


def validate_recipe(
    recipe: dict[str, Any],
    ingredients: dict[str, Any],
    errors_by_recipe: dict[str, list[str]],
) -> None:
    recipe_id = str(recipe.get("recipe_id", "<missing-id>"))
    missing = REQUIRED_FIELDS - set(recipe)
    if missing:
        add_error(errors_by_recipe, recipe_id, f"Missing fields: {', '.join(sorted(missing))}")
        return

    if not re.fullmatch(r"MP\d{4}", recipe_id):
        add_error(errors_by_recipe, recipe_id, "recipe_id must match MP0001 format")
    if not isinstance(recipe["name"], str) or not recipe["name"].strip():
        add_error(errors_by_recipe, recipe_id, "name must be a non-empty string")
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", recipe["slug"]):
        add_error(errors_by_recipe, recipe_id, "slug is not normalized kebab-case")
    if recipe["primary_protein"] not in EXPECTED_PROTEINS:
        add_error(errors_by_recipe, recipe_id, "primary_protein is not allowed")
    if recipe["cuisine"] not in EXPECTED_CUISINES:
        add_error(errors_by_recipe, recipe_id, "cuisine is not allowed")
    if recipe["meal_type"] not in ALLOWED_MEAL_TYPES:
        add_error(errors_by_recipe, recipe_id, "meal_type is not allowed")
    if not is_number(recipe["servings"]) or recipe["servings"] <= 0:
        add_error(errors_by_recipe, recipe_id, "servings must be positive")

    rows = recipe["ingredients"]
    if not isinstance(rows, list) or not rows:
        add_error(errors_by_recipe, recipe_id, "ingredients must be a non-empty list")
        rows = []
    seen_ingredients: set[str] = set()
    for index, row in enumerate(rows):
        ingredient_id = row.get("ingredient_id")
        if ingredient_id in seen_ingredients:
            add_error(errors_by_recipe, recipe_id, f"ingredient {ingredient_id} appears more than once")
        seen_ingredients.add(ingredient_id)
        if ingredient_id not in ingredients:
            add_error(errors_by_recipe, recipe_id, f"unknown ingredient_id at ingredient row {index + 1}: {ingredient_id}")
            continue
        if row.get("unit") not in ALLOWED_UNITS:
            add_error(errors_by_recipe, recipe_id, f"invalid unit for {ingredient_id}")
        elif row["unit"] != ingredients[ingredient_id]["basis_unit"]:
            add_error(errors_by_recipe, recipe_id, f"unit does not match taxonomy for {ingredient_id}")
        if row.get("category") != ingredients[ingredient_id]["category"]:
            add_error(errors_by_recipe, recipe_id, f"category does not match taxonomy for {ingredient_id}")
        if not is_number(row.get("quantity")) or row["quantity"] <= 0:
            add_error(errors_by_recipe, recipe_id, f"quantity must be positive for {ingredient_id}")
        if not isinstance(row.get("optional"), bool):
            add_error(errors_by_recipe, recipe_id, f"optional must be boolean for {ingredient_id}")

    if recipe["ingredient_count"] != len(rows):
        add_error(errors_by_recipe, recipe_id, "ingredient_count does not match ingredient rows")
    if not 6 <= recipe["ingredient_count"] <= 12:
        add_error(errors_by_recipe, recipe_id, "ingredient_count should be between 6 and 12")

    core = recipe["core_ingredients"]
    supporting = recipe["supporting_ingredients"]
    if not isinstance(core, list) or not 2 <= len(core) <= 5:
        add_error(errors_by_recipe, recipe_id, "core_ingredients must contain 2–5 IDs")
    elif not set(core).issubset(seen_ingredients):
        add_error(errors_by_recipe, recipe_id, "core_ingredients must be present in ingredients")
    if not isinstance(supporting, list) or not set(supporting).issubset(seen_ingredients):
        add_error(errors_by_recipe, recipe_id, "supporting_ingredients must be present in ingredients")
    if set(core) & set(supporting):
        add_error(errors_by_recipe, recipe_id, "core and supporting ingredients must not overlap")

    instructions = recipe["instructions"]
    if not isinstance(instructions, list) or not 3 <= len(instructions) <= 8:
        add_error(errors_by_recipe, recipe_id, "instructions must contain 3–8 steps")
    elif any(not isinstance(step, str) or len(step.strip()) < 12 for step in instructions):
        add_error(errors_by_recipe, recipe_id, "instructions contain an empty or overly short step")

    nutrition = recipe["nutrition_per_serving"]
    for field in ("calories_kcal", "protein_g", "carbs_g", "fat_g"):
        if not is_number(nutrition.get(field)) or nutrition[field] <= 0:
            add_error(errors_by_recipe, recipe_id, f"nutrition {field} must be positive")
    if not is_number(nutrition.get("fiber_g")) or nutrition["fiber_g"] < 0:
        add_error(errors_by_recipe, recipe_id, "nutrition fiber_g must be nonnegative")
    if all(is_number(nutrition.get(field)) for field in ("calories_kcal", "protein_g", "carbs_g", "fat_g")):
        macro_calories = nutrition["protein_g"] * 4 + nutrition["carbs_g"] * 4 + nutrition["fat_g"] * 9
        tolerance = max(25, nutrition["calories_kcal"] * 0.08)
        if abs(nutrition["calories_kcal"] - macro_calories) > tolerance:
            add_error(errors_by_recipe, recipe_id, "calories are inconsistent with macro calories")

    timing = recipe["timing"]
    for field in ("prep_minutes", "cook_minutes"):
        if not is_number(timing.get(field)) or timing[field] < 0:
            add_error(errors_by_recipe, recipe_id, f"timing {field} must be nonnegative")
    if not is_number(timing.get("total_minutes")) or timing["total_minutes"] <= 0:
        add_error(errors_by_recipe, recipe_id, "total_minutes must be positive")
    elif abs(timing["total_minutes"] - timing.get("prep_minutes", 0) - timing.get("cook_minutes", 0)) > 1:
        add_error(errors_by_recipe, recipe_id, "total_minutes must approximately equal prep + cook")

    cost = recipe["estimated_cost"]
    if not is_number(cost.get("cost_per_serving_usd")) or cost["cost_per_serving_usd"] <= 0:
        add_error(errors_by_recipe, recipe_id, "cost_per_serving_usd must be positive")
    if not is_number(cost.get("cost_total_usd")) or cost["cost_total_usd"] <= 0:
        add_error(errors_by_recipe, recipe_id, "cost_total_usd must be positive")
    if is_number(cost.get("cost_per_serving_usd")) and is_number(cost.get("cost_total_usd")) and is_number(recipe["servings"]):
        expected_total = cost["cost_per_serving_usd"] * recipe["servings"]
        if abs(cost["cost_total_usd"] - expected_total) > 0.05:
            add_error(errors_by_recipe, recipe_id, "cost total is inconsistent with per-serving cost")
        expected_tier = "budget" if cost["cost_per_serving_usd"] <= 4 else "moderate" if cost["cost_per_serving_usd"] <= 7 else "premium"
        if cost.get("cost_tier") != expected_tier:
            add_error(errors_by_recipe, recipe_id, "cost_tier does not match cost_per_serving_usd")

    meal_prep = recipe["meal_prep"]
    for field in ("meal_prep_score", "reheat_score", "batch_cooking_score"):
        if not is_number(meal_prep.get(field)) or not 1 <= meal_prep[field] <= 10:
            add_error(errors_by_recipe, recipe_id, f"{field} must be between 1 and 10")
    if is_number(meal_prep.get("meal_prep_score")) and meal_prep["meal_prep_score"] < 5:
        add_error(errors_by_recipe, recipe_id, "meal_prep_score must be at least 5")
    if not isinstance(meal_prep.get("freezer_friendly"), bool):
        add_error(errors_by_recipe, recipe_id, "freezer_friendly must be boolean")
    if not is_number(meal_prep.get("fridge_storage_days")) or not 1 <= meal_prep["fridge_storage_days"] <= 7:
        add_error(errors_by_recipe, recipe_id, "fridge_storage_days must be between 1 and 7")
    if not is_number(meal_prep.get("freezer_storage_days")) or not 0 <= meal_prep["freezer_storage_days"] <= 365:
        add_error(errors_by_recipe, recipe_id, "freezer_storage_days is unreasonable")
    if meal_prep.get("freezer_friendly") is False and meal_prep.get("freezer_storage_days") != 0:
        add_error(errors_by_recipe, recipe_id, "non-freezer-friendly recipes must use 0 freezer days")

    if recipe["difficulty"] not in {"easy", "medium"}:
        add_error(errors_by_recipe, recipe_id, "difficulty must be easy or medium")
    if not isinstance(recipe["spice_level"], int) or not 0 <= recipe["spice_level"] <= 5:
        add_error(errors_by_recipe, recipe_id, "spice_level must be an integer from 0 to 5")
    if not set(recipe["dietary_tags"]).issubset(ALLOWED_DIETARY_TAGS):
        add_error(errors_by_recipe, recipe_id, "dietary_tags contains an unsupported value")
    if not set(recipe["allergens"]).issubset(ALLOWED_ALLERGENS):
        add_error(errors_by_recipe, recipe_id, "allergens contains an unsupported value")
    expected_allergens = sorted({allergen for row in rows if row.get("ingredient_id") in ingredients for allergen in ingredients[row["ingredient_id"]].get("allergens", [])})
    if sorted(recipe["allergens"]) != expected_allergens:
        add_error(errors_by_recipe, recipe_id, "allergens do not match ingredient taxonomy")
    if not set(recipe["cooking_methods"]).issubset(ALLOWED_METHODS) or not recipe["cooking_methods"]:
        add_error(errors_by_recipe, recipe_id, "cooking_methods contains an unsupported value")
    if not set(recipe["flavor_profile"]).issubset(ALLOWED_FLAVORS) or not recipe["flavor_profile"]:
        add_error(errors_by_recipe, recipe_id, "flavor_profile contains an unsupported value")
    if not isinstance(recipe["variety_group"], str) or not re.fullmatch(r"[a-z0-9]+(?:_[a-z0-9]+)*", recipe["variety_group"]):
        add_error(errors_by_recipe, recipe_id, "variety_group must be normalized snake_case")
    if not isinstance(recipe["prep_components"], list) or not recipe["prep_components"]:
        add_error(errors_by_recipe, recipe_id, "prep_components must be non-empty")
    elif any(not re.fullmatch(r"[a-z0-9]+(?:_[a-z0-9]+)*", value) for value in recipe["prep_components"]):
        add_error(errors_by_recipe, recipe_id, "prep_components must use snake_case")
    optimization = recipe["optimization_tags"]
    expected_optimization_fields = {
        "high_protein", "low_cost", "low_ingredient_count", "quick_prep", "good_for_batching",
    }
    if set(optimization) != expected_optimization_fields or any(not isinstance(value, bool) for value in optimization.values()):
        add_error(errors_by_recipe, recipe_id, "optimization_tags must contain all five boolean fields")
    if optimization.get("low_cost") != (cost.get("cost_per_serving_usd", 999) <= 4):
        add_error(errors_by_recipe, recipe_id, "optimization low_cost flag is inconsistent")
    if optimization.get("low_ingredient_count") != (recipe["ingredient_count"] <= 8):
        add_error(errors_by_recipe, recipe_id, "optimization low_ingredient_count flag is inconsistent")
    if optimization.get("quick_prep") != (timing.get("prep_minutes", 999) <= 15):
        add_error(errors_by_recipe, recipe_id, "optimization quick_prep flag is inconsistent")


def duplicate_warnings(recipes: list[dict[str, Any]]) -> list[dict[str, Any]]:
    warnings: list[dict[str, Any]] = []
    for first, second in combinations(recipes, 2):
        core_a = set(first["core_ingredients"])
        core_b = set(second["core_ingredients"])
        core_similarity = len(core_a & core_b) / len(core_a | core_b)
        if core_similarity < 0.55:
            continue
        name_similarity = SequenceMatcher(None, first["name"].lower(), second["name"].lower()).ratio()
        same_cuisine = first["cuisine"] == second["cuisine"]
        same_meal_type = first["meal_type"] == second["meal_type"]
        score = (
            core_similarity * 0.50
            + name_similarity * 0.20
            + (0.15 if same_cuisine else 0)
            + (0.15 if same_meal_type else 0)
        )
        if score >= 0.90:
            warnings.append(
                {
                    "first": first["recipe_id"],
                    "second": second["recipe_id"],
                    "score": round(score, 3),
                    "core_similarity": round(core_similarity, 3),
                    "name_similarity": round(name_similarity, 3),
                }
            )
    return sorted(warnings, key=lambda item: item["score"], reverse=True)


def validate_exports(recipes: list[dict[str, Any]], global_errors: list[str]) -> None:
    recipes_csv = DATA_DIR / "recipes.csv"
    ingredients_csv = DATA_DIR / "recipe_ingredients.csv"
    if not recipes_csv.exists() or not ingredients_csv.exists():
        global_errors.append("One or both required CSV exports are missing")
        return
    with recipes_csv.open(encoding="utf-8-sig", newline="") as handle:
        recipe_rows = list(csv.DictReader(handle))
    with ingredients_csv.open(encoding="utf-8-sig", newline="") as handle:
        ingredient_rows = list(csv.DictReader(handle))
    if len(recipe_rows) != len(recipes):
        global_errors.append("recipes.csv row count does not match recipes.json")
    if {row["recipe_id"] for row in recipe_rows} != {recipe["recipe_id"] for recipe in recipes}:
        global_errors.append("recipes.csv recipe IDs do not match recipes.json")
    expected_ingredient_rows = sum(len(recipe["ingredients"]) for recipe in recipes)
    if len(ingredient_rows) != expected_ingredient_rows:
        global_errors.append("recipe_ingredients.csv row count does not match recipes.json")
    if not {row["recipe_id"] for row in ingredient_rows}.issubset({recipe["recipe_id"] for recipe in recipes}):
        global_errors.append("recipe_ingredients.csv references an unknown recipe")


def table(counter: Counter[str]) -> str:
    lines = ["| Value | Count |", "|---|---:|"]
    lines.extend(f"| `{key}` | {value} |" for key, value in counter.most_common())
    return "\n".join(lines)


def make_validation_report(
    recipes: list[dict[str, Any]],
    global_errors: list[str],
    errors_by_recipe: dict[str, list[str]],
    warnings: list[dict[str, Any]],
) -> str:
    invalid_ids = {recipe_id for recipe_id, errors in errors_by_recipe.items() if errors}
    valid_count = len(recipes) - len(invalid_ids)
    status = "PASS" if not global_errors and not invalid_ids and len(recipes) == 500 else "FAIL"
    lines = [
        "# Mealpush Recipe Database Validation Report",
        "",
        f"**Validation status:** {status}",
        f"**Recipes loaded:** {len(recipes)}",
        f"**Valid recipes:** {valid_count}",
        f"**Recipe-level errors:** {sum(len(items) for items in errors_by_recipe.values())}",
        f"**Global errors:** {len(global_errors)}",
        f"**Potential duplicate warnings:** {len(warnings)}",
        "",
        "Nutrition and pricing fields are ingredient-derived estimates for optimization and must not be treated as medical advice or live retail pricing.",
        "",
        "## Automated checks",
        "",
        "- Exactly 500 recipes",
        "- Unique recipe IDs, slugs, and names",
        "- Required schema fields and allowed enum values",
        "- Ingredient taxonomy references, metric units, categories, and positive quantities",
        "- Core/supporting ingredient integrity and declared ingredient counts",
        "- Positive servings, nutrition, and internally consistent macro calories",
        "- Timing, cost totals, storage windows, and score ranges",
        "- Protein and cuisine quota distributions",
        "- CSV export row counts and recipe references",
        "- Pairwise duplicate-concept similarity",
        "",
    ]
    if global_errors:
        lines.extend(["## Global errors", ""] + [f"- {error}" for error in global_errors] + [""])
    if invalid_ids:
        lines.extend(["## Recipe errors", ""])
        for recipe_id in sorted(invalid_ids):
            lines.append(f"### {recipe_id}")
            lines.append("")
            lines.extend(f"- {error}" for error in errors_by_recipe[recipe_id])
            lines.append("")
    lines.extend(["## Distribution verification", "", "### Primary protein", "", table(Counter(recipe["primary_protein"] for recipe in recipes)), "", "### Cuisine", "", table(Counter(recipe["cuisine"] for recipe in recipes)), ""])
    lines.extend(["## Potential duplicate concepts", ""])
    if warnings:
        lines.extend(["These entries are retained for review; the validator never deletes data.", "", "| Recipe A | Recipe B | Similarity | Core overlap | Name similarity |", "|---|---|---:|---:|---:|"])
        lines.extend(f"| {item['first']} | {item['second']} | {item['score']:.3f} | {item['core_similarity']:.3f} | {item['name_similarity']:.3f} |" for item in warnings[:100])
    else:
        lines.append("No recipe pairs crossed the configured 0.90 similarity-review threshold.")
    lines.append("")
    return "\n".join(lines)


def make_summary(recipes: list[dict[str, Any]], warnings: list[dict[str, Any]], status: str) -> str:
    protein_counts = Counter(recipe["primary_protein"] for recipe in recipes)
    cuisine_counts = Counter(recipe["cuisine"] for recipe in recipes)
    meal_counts = Counter(recipe["meal_type"] for recipe in recipes)
    ingredient_reuse = Counter(
        row["ingredient_id"]
        for recipe in recipes
        for row in recipe["ingredients"]
    )
    quick_bands = Counter()
    for recipe in recipes:
        minutes = recipe["timing"]["total_minutes"]
        band = "≤30" if minutes <= 30 else "31–45" if minutes <= 45 else "46–60" if minutes <= 60 else ">60"
        quick_bands[band] += 1

    total = len(recipes)
    freezer_percent = 100 * sum(recipe["meal_prep"]["freezer_friendly"] for recipe in recipes) / total
    high_protein_percent = 100 * sum(recipe["optimization_tags"]["high_protein"] for recipe in recipes) / total
    easy_percent = 100 * sum(recipe["difficulty"] == "easy" for recipe in recipes) / total
    lines = [
        "# Mealpush Recipe Database Summary",
        "",
        f"**Validation status:** {status}",
        f"**Total recipes:** {total}",
        "",
        "All nutrition and grocery-price values are modeled estimates derived from standardized ingredient quantities. They are suitable for product prototyping and optimization, not medical advice or live price quoting.",
        "",
        "## Key averages",
        "",
        "| Metric | Average |",
        "|---|---:|",
        f"| Protein per serving | {mean(recipe['nutrition_per_serving']['protein_g'] for recipe in recipes):.1f} g |",
        f"| Calories per serving | {mean(recipe['nutrition_per_serving']['calories_kcal'] for recipe in recipes):.0f} kcal |",
        f"| Cost per serving | ${mean(recipe['estimated_cost']['cost_per_serving_usd'] for recipe in recipes):.2f} |",
        f"| Ingredient count | {mean(recipe['ingredient_count'] for recipe in recipes):.1f} |",
        f"| Meal-prep score | {mean(recipe['meal_prep']['meal_prep_score'] for recipe in recipes):.1f}/10 |",
        "",
        "## Coverage percentages",
        "",
        f"- Freezer friendly: {freezer_percent:.1f}%",
        f"- High protein: {high_protein_percent:.1f}%",
        f"- Easy difficulty: {easy_percent:.1f}%",
        "",
        "## Primary protein distribution",
        "",
        table(protein_counts),
        "",
        "## Cuisine distribution",
        "",
        table(cuisine_counts),
        "",
        "## Meal type distribution",
        "",
        table(meal_counts),
        "",
        "## Prep-time distribution",
        "",
        table(quick_bands),
        "",
        "## Top 20 most reused ingredients",
        "",
        "| Ingredient ID | Recipe count |",
        "|---|---:|",
    ]
    lines.extend(f"| `{ingredient_id}` | {count} |" for ingredient_id, count in ingredient_reuse.most_common(20))
    lines.extend(["", "## Duplicate review", "", f"Potential duplicate pairs flagged: {len(warnings)}."])
    if warnings:
        lines.append("See `validation_report.md` for the retained review list; no recipes were silently removed.")
    else:
        lines.append("No pairs crossed the configured duplicate-review threshold.")
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    ingredients = load_json(DATA_DIR / "ingredients.json")
    recipes = load_json(DATA_DIR / "recipes.json")
    global_errors: list[str] = []
    errors_by_recipe: dict[str, list[str]] = defaultdict(list)

    validate_taxonomy(ingredients, global_errors)
    if not isinstance(recipes, list):
        global_errors.append("recipes.json must contain a list")
        recipes = []
    if len(recipes) != 500:
        global_errors.append(f"Expected exactly 500 recipes; found {len(recipes)}")

    for recipe in recipes:
        validate_recipe(recipe, ingredients, errors_by_recipe)

    for field in ("recipe_id", "slug", "name"):
        values = [recipe.get(field) for recipe in recipes]
        duplicates = [value for value, count in Counter(values).items() if count > 1]
        if duplicates:
            global_errors.append(f"Duplicate {field} values: {duplicates[:10]}")

    if Counter(recipe["primary_protein"] for recipe in recipes) != Counter(EXPECTED_PROTEINS):
        global_errors.append("Primary protein distribution does not match the 500-recipe target")
    if Counter(recipe["cuisine"] for recipe in recipes) != Counter(EXPECTED_CUISINES):
        global_errors.append("Cuisine distribution does not match the 500-recipe target")
    easy_count = sum(recipe["difficulty"] == "easy" for recipe in recipes)
    if recipes and easy_count / len(recipes) < 0.75:
        global_errors.append("Fewer than 75% of recipes are easy")
    prep_score_count = sum(recipe["meal_prep"]["meal_prep_score"] >= 7 for recipe in recipes)
    if recipes and prep_score_count / len(recipes) < 0.85:
        global_errors.append("Fewer than 85% of recipes have a meal-prep score of 7 or higher")

    validate_exports(recipes, global_errors)
    warnings = duplicate_warnings(recipes)
    invalid_ids = {recipe_id for recipe_id, errors in errors_by_recipe.items() if errors}
    status = "PASS" if not global_errors and not invalid_ids and len(recipes) == 500 else "FAIL"

    report = make_validation_report(recipes, global_errors, errors_by_recipe, warnings)
    summary = make_summary(recipes, warnings, status)
    (REPORTS_DIR / "validation_report.md").write_text(report + "\n", encoding="utf-8")
    (REPORTS_DIR / "database_summary.md").write_text(summary + "\n", encoding="utf-8")

    print(f"Validation status: {status}")
    print(f"Recipes: {len(recipes)}; invalid: {len(invalid_ids)}; global errors: {len(global_errors)}")
    print(f"Potential duplicate warnings: {len(warnings)}")
    print(f"Reports written to {REPORTS_DIR}")
    return 0 if status == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
