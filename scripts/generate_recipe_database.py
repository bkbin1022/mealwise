"""Generate the deterministic Mealpush meal-prep optimization dataset.

The generator deliberately creates a normalized ingredient taxonomy first,
then a 500-concept manifest, and finally expands that manifest in batches of
50 recipes. Nutrition and grocery costs are transparent estimates derived
from the ingredient quantities stored in this file; they are not medical or
retail-price claims.
"""

from __future__ import annotations

import csv
import json
import random
import re
import unicodedata
from collections import Counter
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
SEED = 20260820
ALLOWED_UNITS = {"g", "ml", "piece"}

PROTEIN_QUOTAS = {
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

CUISINE_QUOTAS = {
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

MEAL_LABELS = {
    "rice_bowl": "Rice Bowl",
    "pasta": "Pasta",
    "wrap": "Wrap",
    "salad": "Meal-Prep Salad",
    "stir_fry": "Stir-Fry",
    "curry": "Curry",
    "stew": "Stew",
    "soup": "Soup",
    "roasted_meal": "Roast",
    "sheet_pan": "Sheet-Pan Meal",
    "noodle_bowl": "Noodle Bowl",
    "grain_bowl": "Grain Bowl",
    "burrito_bowl": "Burrito Bowl",
    "sandwich": "Sandwich",
    "breakfast": "Breakfast Prep",
    "other": "Meal Prep",
}


def ingredient(
    display_name: str,
    category: str,
    protein: float,
    carbs: float,
    fat: float,
    fiber: float,
    cost: float,
    *,
    unit: str = "g",
    basis: float = 100,
    allergens: tuple[str, ...] = (),
) -> dict[str, Any]:
    return {
        "display_name": display_name,
        "category": category,
        "basis_quantity": basis,
        "basis_unit": unit,
        "nutrition_per_basis_estimate": {
            "protein_g": protein,
            "carbs_g": carbs,
            "fat_g": fat,
            "fiber_g": fiber,
        },
        "estimated_cost_per_basis_usd": cost,
        "allergens": list(allergens),
    }


# Estimates are intentionally rounded and intended for optimization prototypes.
INGREDIENTS: dict[str, dict[str, Any]] = {
    # Proteins
    "chicken_breast": ingredient("Chicken breast", "protein", 31, 0, 3.6, 0, 1.20),
    "chicken_thigh": ingredient("Chicken thigh", "protein", 26, 0, 10.9, 0, 0.95),
    "ground_beef": ingredient("Lean ground beef", "protein", 26, 0, 12, 0, 1.35),
    "beef_sirloin": ingredient("Beef sirloin", "protein", 27, 0, 10, 0, 1.75),
    "pork_tenderloin": ingredient("Pork tenderloin", "protein", 26, 0, 4, 0, 1.10),
    "ground_pork": ingredient("Lean ground pork", "protein", 25, 0, 12, 0, 0.95),
    "ground_turkey": ingredient("Lean ground turkey", "protein", 27, 0, 8, 0, 1.15),
    "turkey_breast": ingredient("Turkey breast", "protein", 29, 0, 2, 0, 1.30),
    "salmon": ingredient("Salmon", "protein", 22, 0, 12, 0, 2.10, allergens=("fish",)),
    "cod": ingredient("Cod", "protein", 23, 0, 1, 0, 1.60, allergens=("fish",)),
    "canned_tuna": ingredient("Canned tuna", "protein", 25, 0, 1, 0, 1.25, allergens=("fish",)),
    "shrimp": ingredient("Shrimp", "protein", 24, 0, 1, 0, 1.85, allergens=("shellfish",)),
    "scallops": ingredient("Scallops", "protein", 20, 5, 1, 0, 2.25, allergens=("shellfish",)),
    "egg": ingredient("Egg", "protein", 6.3, 0.4, 4.8, 0, 0.30, unit="piece", basis=1, allergens=("egg",)),
    "firm_tofu": ingredient("Firm tofu", "protein", 15, 3, 9, 2, 0.65, allergens=("soy",)),
    "extra_firm_tofu": ingredient("Extra-firm tofu", "protein", 17, 3, 9, 2, 0.72, allergens=("soy",)),
    "tempeh": ingredient("Tempeh", "protein", 20, 8, 11, 5, 0.95, allergens=("soy",)),
    "black_beans": ingredient("Black beans", "protein", 9, 24, 0.5, 9, 0.35),
    "chickpeas": ingredient("Chickpeas", "protein", 9, 27, 2.6, 8, 0.38),
    "brown_lentils": ingredient("Brown lentils", "protein", 9, 20, 0.4, 8, 0.28),
    "kidney_beans": ingredient("Kidney beans", "protein", 9, 23, 0.5, 7, 0.35),
    "white_beans": ingredient("White beans", "protein", 8, 22, 0.6, 6, 0.38),
    "seitan": ingredient("Seitan", "protein", 25, 12, 2, 1, 1.10, allergens=("wheat",)),
    "edamame": ingredient("Shelled edamame", "protein", 12, 9, 5, 5, 0.85, allergens=("soy",)),
    "halloumi": ingredient("Halloumi", "protein", 22, 2, 26, 0, 1.55, allergens=("dairy",)),

    # Carbohydrates
    "white_rice": ingredient("White rice", "carb", 7, 80, 0.7, 1, 0.22),
    "brown_rice": ingredient("Brown rice", "carb", 8, 77, 2.8, 4, 0.28),
    "quinoa": ingredient("Quinoa", "carb", 14, 64, 6, 7, 0.75),
    "whole_wheat_pasta": ingredient("Whole-wheat pasta", "carb", 14, 70, 2.5, 9, 0.38, allergens=("wheat",)),
    "pasta": ingredient("Pasta", "carb", 13, 75, 1.5, 3, 0.30, allergens=("wheat",)),
    "potato": ingredient("Potato", "carb", 2, 17, 0.1, 2.2, 0.18),
    "sweet_potato": ingredient("Sweet potato", "carb", 1.6, 20, 0.1, 3, 0.25),
    "tortilla": ingredient("Whole-wheat tortilla", "carb", 5, 24, 4, 4, 0.42, unit="piece", basis=1, allergens=("wheat",)),
    "corn_tortilla": ingredient("Corn tortilla", "carb", 2, 12, 1, 2, 0.24, unit="piece", basis=1),
    "soba_noodles": ingredient("Soba noodles", "carb", 14, 71, 1, 5, 0.55, allergens=("wheat",)),
    "rice_noodles": ingredient("Rice noodles", "carb", 6, 80, 0.6, 1, 0.40),
    "udon_noodles": ingredient("Udon noodles", "carb", 9, 71, 1, 3, 0.42, allergens=("wheat",)),
    "couscous": ingredient("Couscous", "carb", 13, 77, 0.6, 5, 0.35, allergens=("wheat",)),
    "bulgur": ingredient("Bulgur", "carb", 12, 76, 1.3, 18, 0.32, allergens=("wheat",)),
    "oats": ingredient("Rolled oats", "carb", 17, 66, 7, 11, 0.25),
    "barley": ingredient("Pearled barley", "carb", 10, 74, 1.2, 15, 0.30, allergens=("wheat",)),
    "whole_grain_bread": ingredient("Whole-grain bread", "carb", 4, 20, 2, 3, 0.32, unit="piece", basis=1, allergens=("wheat",)),
    "pita": ingredient("Whole-wheat pita", "carb", 6, 35, 1.5, 5, 0.55, unit="piece", basis=1, allergens=("wheat",)),

    # Vegetables and fruit
    "broccoli": ingredient("Broccoli", "vegetable", 2.8, 7, 0.4, 2.6, 0.38),
    "onion": ingredient("Onion", "vegetable", 1.1, 9, 0.1, 1.7, 0.20),
    "bell_pepper": ingredient("Bell pepper", "vegetable", 1, 6, 0.3, 2.1, 0.55),
    "carrot": ingredient("Carrot", "vegetable", 0.9, 10, 0.2, 2.8, 0.22),
    "spinach": ingredient("Spinach", "vegetable", 2.9, 3.6, 0.4, 2.2, 0.65),
    "zucchini": ingredient("Zucchini", "vegetable", 1.2, 3.1, 0.3, 1, 0.42),
    "cabbage": ingredient("Cabbage", "vegetable", 1.3, 6, 0.1, 2.5, 0.25),
    "mushroom": ingredient("Mushroom", "vegetable", 3.1, 3.3, 0.3, 1, 0.65),
    "green_beans": ingredient("Green beans", "vegetable", 1.8, 7, 0.2, 3.4, 0.48),
    "tomato": ingredient("Tomato", "vegetable", 0.9, 3.9, 0.2, 1.2, 0.42),
    "cherry_tomato": ingredient("Cherry tomato", "vegetable", 0.9, 3.9, 0.2, 1.2, 0.68),
    "cauliflower": ingredient("Cauliflower", "vegetable", 1.9, 5, 0.3, 2, 0.40),
    "kale": ingredient("Kale", "vegetable", 2.9, 4.4, 1.5, 4.1, 0.72),
    "cucumber": ingredient("Cucumber", "vegetable", 0.7, 3.6, 0.1, 0.5, 0.38),
    "corn": ingredient("Corn", "vegetable", 3.4, 19, 1.5, 2.7, 0.42),
    "peas": ingredient("Green peas", "vegetable", 5.4, 14, 0.4, 5.7, 0.36),
    "bok_choy": ingredient("Bok choy", "vegetable", 1.5, 2.2, 0.2, 1, 0.62),
    "eggplant": ingredient("Eggplant", "vegetable", 1, 6, 0.2, 3, 0.48),
    "celery": ingredient("Celery", "vegetable", 0.7, 3, 0.2, 1.6, 0.40),
    "butternut_squash": ingredient("Butternut squash", "vegetable", 1, 12, 0.1, 2, 0.45),
    "lemon": ingredient("Lemon", "fruit", 1.1, 9, 0.3, 2.8, 0.55),
    "lime": ingredient("Lime", "fruit", 0.7, 11, 0.2, 2.8, 0.58),
    "pineapple": ingredient("Pineapple", "fruit", 0.5, 13, 0.1, 1.4, 0.62),
    "mango": ingredient("Mango", "fruit", 0.8, 15, 0.4, 1.6, 0.85),

    # Fats, dairy, sauces, seasonings, herbs, and pantry items
    "olive_oil": ingredient("Olive oil", "fat", 0, 0, 100, 0, 0.95, unit="ml"),
    "sesame_oil": ingredient("Sesame oil", "fat", 0, 0, 100, 0, 1.25, unit="ml", allergens=("sesame",)),
    "avocado_oil": ingredient("Avocado oil", "fat", 0, 0, 100, 0, 1.10, unit="ml"),
    "avocado": ingredient("Avocado", "fat", 2, 9, 15, 7, 0.95),
    "peanut_butter": ingredient("Peanut butter", "fat", 25, 20, 50, 6, 0.80, allergens=("peanuts",)),
    "almonds": ingredient("Almonds", "fat", 21, 22, 50, 12, 1.25, allergens=("tree_nuts",)),
    "greek_yogurt": ingredient("Greek yogurt", "dairy", 10, 4, 2, 0, 0.75, allergens=("dairy",)),
    "feta": ingredient("Feta", "dairy", 14, 4, 21, 0, 1.35, allergens=("dairy",)),
    "cheddar": ingredient("Cheddar", "dairy", 25, 1.3, 33, 0, 1.20, allergens=("dairy",)),
    "mozzarella": ingredient("Mozzarella", "dairy", 24, 3, 17, 0, 1.10, allergens=("dairy",)),
    "coconut_milk": ingredient("Light coconut milk", "sauce", 1.5, 3, 7, 0, 0.58, unit="ml"),
    "soy_sauce": ingredient("Soy sauce", "sauce", 8, 5, 0.6, 0.8, 0.48, unit="ml", allergens=("soy", "wheat")),
    "tamari": ingredient("Tamari", "sauce", 10, 6, 0, 0, 0.72, unit="ml", allergens=("soy",)),
    "gochujang": ingredient("Gochujang", "sauce", 5, 45, 2, 3, 0.95, allergens=("soy", "wheat")),
    "doenjang": ingredient("Doenjang", "sauce", 12, 22, 6, 5, 0.85, allergens=("soy",)),
    "miso": ingredient("Miso", "sauce", 12, 26, 6, 5, 0.90, allergens=("soy",)),
    "teriyaki_sauce": ingredient("Teriyaki sauce", "sauce", 5, 40, 0, 0, 0.68, unit="ml", allergens=("soy", "wheat")),
    "tomato_sauce": ingredient("Tomato sauce", "sauce", 1.5, 7, 0.4, 2, 0.28, unit="ml"),
    "salsa": ingredient("Tomato salsa", "sauce", 1.5, 8, 0.2, 2, 0.42),
    "bbq_sauce": ingredient("BBQ sauce", "sauce", 1, 40, 0.5, 1, 0.55, unit="ml"),
    "tahini": ingredient("Tahini", "sauce", 17, 21, 54, 9, 1.10, allergens=("sesame",)),
    "pesto": ingredient("Basil pesto", "sauce", 5, 6, 46, 1, 1.25, allergens=("dairy", "tree_nuts")),
    "red_curry_paste": ingredient("Red curry paste", "sauce", 4, 18, 6, 4, 1.10),
    "green_curry_paste": ingredient("Green curry paste", "sauce", 4, 16, 5, 4, 1.10),
    "fish_sauce": ingredient("Fish sauce", "sauce", 5, 4, 0, 0, 0.78, unit="ml", allergens=("fish",)),
    "oyster_sauce": ingredient("Oyster sauce", "sauce", 3, 22, 0, 0, 0.72, unit="ml", allergens=("shellfish",)),
    "buffalo_sauce": ingredient("Buffalo sauce", "sauce", 1, 2, 1, 0, 0.65, unit="ml"),
    "dijon_mustard": ingredient("Dijon mustard", "sauce", 4, 6, 3, 3, 0.58),
    "garlic": ingredient("Garlic", "seasoning", 6, 33, 0.5, 2.1, 0.55),
    "ginger": ingredient("Ginger", "seasoning", 1.8, 18, 0.8, 2, 0.65),
    "chili_powder": ingredient("Chili powder", "seasoning", 14, 50, 14, 35, 0.95),
    "cumin": ingredient("Ground cumin", "seasoning", 18, 44, 22, 11, 0.72),
    "smoked_paprika": ingredient("Smoked paprika", "seasoning", 14, 54, 13, 35, 0.85),
    "curry_powder": ingredient("Curry powder", "seasoning", 13, 58, 14, 33, 0.75),
    "garam_masala": ingredient("Garam masala", "seasoning", 14, 46, 15, 12, 1.05),
    "turmeric": ingredient("Ground turmeric", "seasoning", 10, 67, 3, 23, 0.82),
    "italian_seasoning": ingredient("Italian seasoning", "seasoning", 11, 61, 7, 37, 0.72),
    "zaatar": ingredient("Za'atar", "seasoning", 10, 45, 15, 20, 1.20, allergens=("sesame",)),
    "cinnamon": ingredient("Ground cinnamon", "seasoning", 4, 81, 1.2, 53, 0.68),
    "brown_sugar": ingredient("Brown sugar", "pantry", 0, 98, 0, 0, 0.20),
    "honey": ingredient("Honey", "pantry", 0.3, 82, 0, 0.2, 0.75, unit="ml"),
    "rice_vinegar": ingredient("Rice vinegar", "pantry", 0, 0.1, 0, 0, 0.42, unit="ml"),
    "balsamic_vinegar": ingredient("Balsamic vinegar", "pantry", 0.5, 17, 0, 0, 0.62, unit="ml"),
    "cornstarch": ingredient("Cornstarch", "pantry", 0.3, 91, 0.1, 0.9, 0.25),
    "cilantro": ingredient("Cilantro", "herb", 2.1, 3.7, 0.5, 2.8, 0.78),
    "parsley": ingredient("Parsley", "herb", 3, 6, 0.8, 3.3, 0.72),
    "basil": ingredient("Basil", "herb", 3.2, 2.7, 0.6, 1.6, 0.95),
    "dill": ingredient("Dill", "herb", 3.5, 7, 1.1, 2.1, 1.10),
    "green_onion": ingredient("Green onion", "herb", 1.8, 7, 0.2, 2.6, 0.62),
    "mint": ingredient("Mint", "herb", 3.8, 15, 0.9, 8, 1.20),
}


PROTEIN_GROUPS = {
    "chicken": ["chicken_breast", "chicken_thigh"],
    "beef": ["ground_beef", "beef_sirloin"],
    "pork": ["pork_tenderloin", "ground_pork"],
    "turkey": ["ground_turkey", "turkey_breast"],
    "fish": ["salmon", "cod", "canned_tuna"],
    "shrimp_seafood": ["shrimp", "scallops"],
    "egg_based": ["egg"],
    "tofu_vegetarian": ["firm_tofu", "extra_firm_tofu", "tempeh"],
    "beans_lentils_chickpeas": ["black_beans", "chickpeas", "brown_lentils", "kidney_beans", "white_beans"],
    "other": ["seitan", "edamame", "halloumi"],
}


def style(
    label: str,
    key: str,
    sauces: list[str],
    seasonings: list[str],
    flavors: list[str],
) -> dict[str, Any]:
    return {
        "label": label,
        "key": key,
        "sauces": sauces,
        "seasonings": seasonings,
        "flavors": flavors,
    }


CUISINE_PROFILES: dict[str, dict[str, Any]] = {
    "american_western": {
        "styles": [
            style("Smoky BBQ", "smoky_bbq", ["bbq_sauce"], ["smoked_paprika", "garlic"], ["smoky", "savory", "sweet"]),
            style("Garlic Herb", "garlic_herb", ["dijon_mustard"], ["garlic", "parsley"], ["savory", "herbaceous"]),
            style("Buffalo", "buffalo", ["buffalo_sauce"], ["garlic", "smoked_paprika"], ["spicy", "tangy"]),
            style("Honey Mustard", "honey_mustard", ["dijon_mustard", "honey"], ["garlic"], ["sweet", "tangy"]),
            style("Balsamic", "balsamic", ["balsamic_vinegar"], ["garlic", "italian_seasoning"], ["tangy", "savory"]),
            style("Rustic Tomato", "rustic_tomato", ["tomato_sauce"], ["garlic", "smoked_paprika"], ["rich", "savory"]),
        ],
        "carbs": ["brown_rice", "potato", "sweet_potato", "quinoa", "whole_wheat_pasta"],
        "vegetables": ["broccoli", "green_beans", "bell_pepper", "spinach", "mushroom", "carrot"],
        "meal_types": ["sheet_pan", "grain_bowl", "roasted_meal", "pasta", "wrap", "stew"],
        "oil": "olive_oil",
    },
    "korean": {
        "styles": [
            style("Gochujang", "gochujang", ["gochujang", "soy_sauce"], ["garlic", "ginger"], ["spicy", "savory", "umami"]),
            style("Bulgogi", "bulgogi", ["soy_sauce", "brown_sugar"], ["garlic", "ginger"], ["sweet", "savory", "umami"]),
            style("Doenjang", "doenjang", ["doenjang"], ["garlic", "green_onion"], ["rich", "umami"]),
            style("Sesame Soy", "sesame_soy", ["soy_sauce"], ["garlic", "green_onion"], ["savory", "umami"]),
            style("Spicy Garlic", "spicy_garlic", ["gochujang", "rice_vinegar"], ["garlic", "chili_powder"], ["spicy", "tangy"]),
            style("Ginger Scallion", "ginger_scallion", ["tamari"], ["ginger", "green_onion"], ["fresh", "savory"]),
        ],
        "carbs": ["white_rice", "brown_rice", "rice_noodles", "sweet_potato"],
        "vegetables": ["cabbage", "carrot", "spinach", "mushroom", "broccoli", "zucchini"],
        "meal_types": ["rice_bowl", "stir_fry", "noodle_bowl", "stew", "sheet_pan"],
        "oil": "sesame_oil",
    },
    "japanese": {
        "styles": [
            style("Teriyaki", "teriyaki", ["teriyaki_sauce"], ["garlic", "ginger"], ["sweet", "savory", "umami"]),
            style("Miso Ginger", "miso_ginger", ["miso", "rice_vinegar"], ["ginger", "garlic"], ["umami", "tangy"]),
            style("Tamari Sesame", "tamari_sesame", ["tamari"], ["ginger", "green_onion"], ["savory", "umami"]),
            style("Sweet Soy", "sweet_soy", ["soy_sauce", "honey"], ["ginger"], ["sweet", "umami"]),
            style("Miso Herb", "miso_herb", ["miso"], ["garlic", "green_onion"], ["mild", "umami"]),
            style("Tangy Ginger", "tangy_ginger", ["rice_vinegar", "tamari"], ["ginger"], ["tangy", "fresh"]),
        ],
        "carbs": ["white_rice", "brown_rice", "soba_noodles", "udon_noodles"],
        "vegetables": ["broccoli", "carrot", "bok_choy", "mushroom", "cabbage", "green_beans"],
        "meal_types": ["rice_bowl", "noodle_bowl", "stir_fry", "sheet_pan", "soup"],
        "oil": "sesame_oil",
    },
    "chinese_inspired": {
        "styles": [
            style("Ginger Garlic", "ginger_garlic", ["soy_sauce"], ["ginger", "garlic"], ["savory", "umami"]),
            style("Sweet Chili", "sweet_chili", ["soy_sauce", "honey"], ["chili_powder", "garlic"], ["sweet", "spicy"]),
            style("Sesame Tamari", "sesame_tamari", ["tamari"], ["ginger", "green_onion"], ["umami", "savory"]),
            style("Black Pepper", "black_pepper_style", ["oyster_sauce"], ["garlic", "ginger"], ["rich", "savory"]),
            style("Pineapple Soy", "pineapple_soy", ["soy_sauce"], ["ginger", "garlic"], ["sweet", "tangy"]),
            style("Chili Garlic", "chili_garlic", ["soy_sauce", "rice_vinegar"], ["chili_powder", "garlic"], ["spicy", "tangy"]),
        ],
        "carbs": ["white_rice", "brown_rice", "rice_noodles", "udon_noodles"],
        "vegetables": ["broccoli", "bell_pepper", "bok_choy", "carrot", "cabbage", "mushroom"],
        "meal_types": ["stir_fry", "rice_bowl", "noodle_bowl", "sheet_pan"],
        "oil": "sesame_oil",
    },
    "mexican_tex_mex": {
        "styles": [
            style("Chipotle", "chipotle", ["salsa"], ["chili_powder", "cumin"], ["smoky", "spicy"]),
            style("Salsa Verde", "salsa_verde", ["salsa", "lime"], ["garlic", "cilantro"], ["tangy", "fresh"]),
            style("Fajita", "fajita", ["lime"], ["chili_powder", "cumin"], ["smoky", "savory"]),
            style("Cilantro Lime", "cilantro_lime", ["lime"], ["cilantro", "garlic"], ["fresh", "tangy"]),
            style("Enchilada-Style", "enchilada", ["tomato_sauce"], ["chili_powder", "cumin"], ["rich", "spicy"]),
            style("Roasted Tomato", "roasted_tomato", ["salsa"], ["smoked_paprika", "garlic"], ["savory", "smoky"]),
        ],
        "carbs": ["brown_rice", "white_rice", "corn_tortilla", "tortilla", "sweet_potato"],
        "vegetables": ["bell_pepper", "onion", "corn", "tomato", "zucchini", "spinach"],
        "meal_types": ["burrito_bowl", "wrap", "rice_bowl", "sheet_pan", "stew"],
        "oil": "avocado_oil",
    },
    "mediterranean": {
        "styles": [
            style("Lemon Herb", "lemon_herb", ["lemon"], ["garlic", "parsley"], ["fresh", "herbaceous", "tangy"]),
            style("Tahini", "tahini", ["tahini", "lemon"], ["garlic", "parsley"], ["creamy", "savory"]),
            style("Balsamic Herb", "balsamic_herb", ["balsamic_vinegar"], ["garlic", "basil"], ["tangy", "herbaceous"]),
            style("Tomato Olive", "tomato_olive", ["tomato_sauce"], ["garlic", "parsley"], ["rich", "savory"]),
            style("Dill Yogurt", "dill_yogurt", ["greek_yogurt", "lemon"], ["dill", "garlic"], ["creamy", "fresh"]),
            style("Smoky Paprika", "smoky_paprika", ["lemon"], ["smoked_paprika", "garlic"], ["smoky", "tangy"]),
        ],
        "carbs": ["quinoa", "couscous", "bulgur", "brown_rice", "pita"],
        "vegetables": ["cherry_tomato", "cucumber", "zucchini", "spinach", "bell_pepper", "eggplant"],
        "meal_types": ["grain_bowl", "salad", "sheet_pan", "wrap", "roasted_meal"],
        "oil": "olive_oil",
    },
    "italian": {
        "styles": [
            style("Tuscan Tomato", "tuscan_tomato", ["tomato_sauce"], ["garlic", "italian_seasoning"], ["rich", "herbaceous"]),
            style("Basil Pesto", "basil_pesto", ["pesto"], ["garlic", "basil"], ["herbaceous", "savory"]),
            style("Balsamic Garlic", "balsamic_garlic", ["balsamic_vinegar"], ["garlic", "italian_seasoning"], ["tangy", "savory"]),
            style("Roasted Tomato", "italian_roasted_tomato", ["tomato_sauce"], ["smoked_paprika", "basil"], ["smoky", "rich"]),
            style("Lemon Basil", "lemon_basil", ["lemon"], ["garlic", "basil"], ["fresh", "herbaceous"]),
            style("Creamy Herb", "creamy_herb", ["greek_yogurt"], ["garlic", "italian_seasoning"], ["creamy", "mild"]),
        ],
        "carbs": ["pasta", "whole_wheat_pasta", "potato", "quinoa"],
        "vegetables": ["zucchini", "spinach", "cherry_tomato", "mushroom", "broccoli", "eggplant"],
        "meal_types": ["pasta", "grain_bowl", "sheet_pan", "soup", "roasted_meal"],
        "oil": "olive_oil",
    },
    "indian": {
        "styles": [
            style("Tikka", "tikka", ["greek_yogurt", "tomato_sauce"], ["garam_masala", "garlic"], ["spicy", "rich"]),
            style("Coconut Curry", "coconut_curry", ["coconut_milk"], ["curry_powder", "turmeric"], ["creamy", "rich"]),
            style("Masala", "masala", ["tomato_sauce"], ["garam_masala", "ginger"], ["spicy", "savory"]),
            style("Turmeric Ginger", "turmeric_ginger", ["coconut_milk"], ["turmeric", "ginger"], ["mild", "rich"]),
            style("Tomato Cumin", "tomato_cumin", ["tomato_sauce"], ["cumin", "garam_masala"], ["savory", "rich"]),
            style("Spiced Yogurt", "spiced_yogurt", ["greek_yogurt"], ["curry_powder", "garlic"], ["creamy", "spicy"]),
        ],
        "carbs": ["white_rice", "brown_rice", "quinoa", "potato"],
        "vegetables": ["cauliflower", "spinach", "peas", "tomato", "onion", "bell_pepper"],
        "meal_types": ["curry", "rice_bowl", "stew", "sheet_pan", "grain_bowl"],
        "oil": "olive_oil",
    },
    "southeast_asian": {
        "styles": [
            style("Thai Basil", "thai_basil", ["fish_sauce", "lime"], ["garlic", "basil"], ["fresh", "savory", "umami"]),
            style("Red Curry", "red_curry", ["red_curry_paste", "coconut_milk"], ["ginger", "garlic"], ["spicy", "creamy"]),
            style("Green Curry", "green_curry", ["green_curry_paste", "coconut_milk"], ["ginger", "basil"], ["spicy", "fresh"]),
            style("Lemongrass-Style", "lemongrass_style", ["lime", "fish_sauce"], ["ginger", "garlic"], ["tangy", "fresh"]),
            style("Peanut Lime", "peanut_lime", ["peanut_butter", "lime"], ["ginger", "chili_powder"], ["creamy", "tangy"]),
            style("Sweet Chili Basil", "sweet_chili_basil", ["honey", "fish_sauce"], ["chili_powder", "basil"], ["sweet", "spicy"]),
        ],
        "carbs": ["white_rice", "brown_rice", "rice_noodles"],
        "vegetables": ["bell_pepper", "carrot", "bok_choy", "cabbage", "green_beans", "mushroom"],
        "meal_types": ["rice_bowl", "noodle_bowl", "curry", "stir_fry", "salad"],
        "oil": "sesame_oil",
    },
    "middle_eastern": {
        "styles": [
            style("Za'atar", "zaatar", ["lemon"], ["zaatar", "garlic"], ["herbaceous", "tangy"]),
            style("Tahini Lemon", "tahini_lemon", ["tahini", "lemon"], ["garlic", "parsley"], ["creamy", "tangy"]),
            style("Shawarma-Spiced", "shawarma_spiced", ["greek_yogurt"], ["cumin", "smoked_paprika"], ["rich", "savory"]),
            style("Harissa-Style", "harissa_style", ["tomato_sauce"], ["chili_powder", "cumin"], ["spicy", "smoky"]),
            style("Herbed Yogurt", "herbed_yogurt", ["greek_yogurt", "lemon"], ["mint", "garlic"], ["fresh", "creamy"]),
            style("Sumac-Style", "sumac_style", ["lemon"], ["smoked_paprika", "parsley"], ["tangy", "herbaceous"]),
        ],
        "carbs": ["bulgur", "couscous", "brown_rice", "pita", "quinoa"],
        "vegetables": ["cucumber", "tomato", "eggplant", "spinach", "bell_pepper", "carrot"],
        "meal_types": ["grain_bowl", "wrap", "salad", "sheet_pan", "stew"],
        "oil": "olive_oil",
    },
    "other_fusion": {
        "styles": [
            style("Miso Pesto", "miso_pesto", ["miso", "pesto"], ["garlic"], ["umami", "herbaceous"]),
            style("Gochujang Lime", "gochujang_lime", ["gochujang", "lime"], ["garlic"], ["spicy", "tangy"]),
            style("Curry BBQ", "curry_bbq", ["bbq_sauce"], ["curry_powder", "garlic"], ["smoky", "spicy"]),
            style("Tahini Soy", "tahini_soy", ["tahini", "tamari"], ["ginger"], ["creamy", "umami"]),
            style("Balsamic Chili", "balsamic_chili", ["balsamic_vinegar"], ["chili_powder", "garlic"], ["tangy", "spicy"]),
            style("Sesame Tomato", "sesame_tomato", ["tomato_sauce", "tamari"], ["ginger", "garlic"], ["rich", "umami"]),
        ],
        "carbs": ["quinoa", "brown_rice", "sweet_potato", "rice_noodles", "whole_wheat_pasta"],
        "vegetables": ["broccoli", "bell_pepper", "spinach", "cabbage", "mushroom", "zucchini"],
        "meal_types": ["grain_bowl", "rice_bowl", "stir_fry", "wrap", "sheet_pan", "noodle_bowl"],
        "oil": "olive_oil",
    },
}


CARBS_BY_MEAL_TYPE = {
    "pasta": ["pasta", "whole_wheat_pasta"],
    "wrap": ["tortilla", "corn_tortilla", "pita"],
    "sandwich": ["whole_grain_bread", "pita"],
    "noodle_bowl": ["rice_noodles", "soba_noodles", "udon_noodles"],
    "breakfast": ["oats", "potato", "sweet_potato", "whole_grain_bread"],
    "burrito_bowl": ["white_rice", "brown_rice", "quinoa"],
    "rice_bowl": ["white_rice", "brown_rice", "quinoa"],
}


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "-", normalized.lower()).strip("-")


def expand_slots(quotas: dict[str, int]) -> list[str]:
    return [key for key, count in quotas.items() for _ in range(count)]


def select_carb(profile: dict[str, Any], meal_type: str, offset: int) -> str:
    candidates = CARBS_BY_MEAL_TYPE.get(meal_type, profile["carbs"])
    if meal_type in {"rice_bowl", "burrito_bowl"}:
        preferred = [item for item in profile["carbs"] if item in candidates]
        if preferred:
            candidates = preferred
    return candidates[offset % len(candidates)]


def make_manifest() -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    rng = random.Random(SEED)
    protein_slots = expand_slots(PROTEIN_QUOTAS)
    cuisine_slots = expand_slots(CUISINE_QUOTAS)
    rng.shuffle(protein_slots)
    rng.shuffle(cuisine_slots)

    pair_counts: Counter[tuple[str, str]] = Counter()
    group_counts: Counter[str] = Counter()
    used_signatures: set[tuple[Any, ...]] = set()
    used_names: set[str] = set()
    manifest: list[dict[str, Any]] = []
    designs: list[dict[str, Any]] = []

    for index, (protein_group, cuisine) in enumerate(zip(protein_slots, cuisine_slots, strict=True), start=1):
        profile = CUISINE_PROFILES[cuisine]
        pair_offset = pair_counts[(protein_group, cuisine)]
        group_offset = group_counts[protein_group]
        pair_counts[(protein_group, cuisine)] += 1
        group_counts[protein_group] += 1

        chosen: dict[str, Any] | None = None
        for attempt in range(80):
            style_index = (pair_offset + index + attempt * 2) % len(profile["styles"])
            meal_index = (pair_offset * 2 + index + attempt * 3) % len(profile["meal_types"])
            protein_index = (group_offset + attempt) % len(PROTEIN_GROUPS[protein_group])
            recipe_style = profile["styles"][style_index]
            meal_type = profile["meal_types"][meal_index]
            protein_id = PROTEIN_GROUPS[protein_group][protein_index]
            carb_id = select_carb(profile, meal_type, pair_offset + attempt + index)
            vegetable_index = (index + pair_offset + attempt) % len(profile["vegetables"])
            vegetable_id = profile["vegetables"][vegetable_index]
            second_vegetable_id = profile["vegetables"][(vegetable_index + 2 + attempt) % len(profile["vegetables"])]
            if second_vegetable_id == vegetable_id:
                continue

            signature = (
                cuisine,
                meal_type,
                tuple(sorted((protein_id, carb_id, vegetable_id, second_vegetable_id))),
                recipe_style["key"],
            )
            if signature in used_signatures:
                continue

            protein_name = INGREDIENTS[protein_id]["display_name"]
            meal_label = MEAL_LABELS[meal_type]
            name = f"{recipe_style['label']} {protein_name} {meal_label}"
            if name in used_names:
                name = f"{name} with {INGREDIENTS[vegetable_id]['display_name']}"
            if name in used_names:
                name = f"{name} and {INGREDIENTS[second_vegetable_id]['display_name']}"
            if name in used_names:
                continue

            chosen = {
                "recipe_id": f"MP{index:04d}",
                "name": name,
                "slug": slugify(name),
                "primary_protein": protein_group,
                "cuisine": cuisine,
                "meal_type": meal_type,
                "protein_id": protein_id,
                "carb_id": carb_id,
                "vegetable_ids": [vegetable_id, second_vegetable_id],
                "style": recipe_style,
                "oil_id": profile["oil"],
                "core_ingredients": [protein_id, carb_id, vegetable_id, second_vegetable_id],
            }
            used_signatures.add(signature)
            used_names.add(name)
            break

        if chosen is None:
            raise RuntimeError(f"Unable to create a unique concept for recipe {index}")

        designs.append(chosen)
        manifest.append(
            {
                "recipe_id": chosen["recipe_id"],
                "name": chosen["name"],
                "primary_protein": chosen["primary_protein"],
                "cuisine": chosen["cuisine"],
                "meal_type": chosen["meal_type"],
                "core_ingredients": chosen["core_ingredients"],
            }
        )

    if Counter(item["primary_protein"] for item in manifest) != Counter(PROTEIN_QUOTAS):
        raise RuntimeError("Manifest protein distribution does not match its quotas")
    if Counter(item["cuisine"] for item in manifest) != Counter(CUISINE_QUOTAS):
        raise RuntimeError("Manifest cuisine distribution does not match its quotas")
    if len({item["name"] for item in manifest}) != 500:
        raise RuntimeError("Manifest contains duplicate names")

    return manifest, designs


def amount_for(ingredient_id: str, role: str, servings: int, ordinal: int = 0) -> float:
    spec = INGREDIENTS[ingredient_id]
    if role == "protein":
        if ingredient_id == "egg":
            return servings * 2
        if ingredient_id in {"black_beans", "chickpeas", "brown_lentils", "kidney_beans", "white_beans"}:
            return servings * 180
        if ingredient_id in {"firm_tofu", "extra_firm_tofu", "tempeh", "edamame"}:
            return servings * 175
        if ingredient_id == "halloumi":
            return servings * 105
        return servings * 150
    if role == "carb":
        if spec["basis_unit"] == "piece":
            return servings * (2 if ingredient_id == "whole_grain_bread" else 1)
        if ingredient_id in {"potato", "sweet_potato"}:
            return servings * 210
        if ingredient_id in {"white_rice", "brown_rice", "quinoa", "couscous", "bulgur", "barley"}:
            return servings * 75
        if ingredient_id == "oats":
            return servings * 65
        return servings * 85
    if role == "vegetable":
        return servings * (105 if ordinal == 0 else 75)
    if role == "oil":
        return servings * 6
    if role == "sauce":
        if ingredient_id in {"tomato_sauce", "coconut_milk", "salsa"}:
            return servings * (70 if ordinal == 0 else 35)
        if ingredient_id in {"greek_yogurt", "tahini", "pesto", "peanut_butter"}:
            return servings * 24
        if spec["basis_unit"] == "ml":
            return servings * 14
        return servings * 12
    if role == "seasoning":
        if spec["category"] == "herb":
            return servings * 4
        if ingredient_id in {"garlic", "ginger"}:
            return servings * 4
        if ingredient_id in {"honey", "rice_vinegar", "balsamic_vinegar"}:
            return servings * 8
        return servings * 2
    raise ValueError(f"Unknown ingredient role: {role}")


def ingredient_row(ingredient_id: str, quantity: float, optional: bool = False) -> dict[str, Any]:
    spec = INGREDIENTS[ingredient_id]
    if spec["basis_unit"] == "piece":
        normalized_quantity: int | float = int(round(quantity))
    else:
        normalized_quantity = int(round(quantity))
    return {
        "ingredient_id": ingredient_id,
        "name": spec["display_name"],
        "quantity": normalized_quantity,
        "unit": spec["basis_unit"],
        "category": spec["category"],
        "optional": optional,
    }


def cooking_methods_for(meal_type: str, carb_id: str, index: int) -> list[str]:
    if meal_type in {"sheet_pan", "roasted_meal"}:
        methods = ["oven", "roasting"]
    elif meal_type in {"stew", "soup", "curry"}:
        methods = ["stovetop"] if index % 5 else ["slow_cooker"]
    elif meal_type == "breakfast" and index % 2:
        methods = ["baking"]
    else:
        methods = ["stovetop"]
    if carb_id in {"white_rice", "brown_rice"}:
        methods.append("rice_cooker")
    return list(dict.fromkeys(methods))


def equipment_for(methods: list[str], meal_type: str) -> list[str]:
    equipment: list[str] = []
    if "stovetop" in methods:
        equipment.extend(["stovetop", "skillet"])
    if any(method in methods for method in ("oven", "roasting", "baking")):
        equipment.extend(["oven", "sheet_pan"])
    if "rice_cooker" in methods:
        equipment.append("rice_cooker")
    if "slow_cooker" in methods:
        equipment.append("slow_cooker")
    if meal_type in {"soup", "stew", "curry", "pasta", "noodle_bowl"}:
        equipment.append("saucepan")
    return list(dict.fromkeys(equipment))


def timing_slots() -> list[int]:
    slots = (
        [25, 28, 30] * 50
        + [35, 40, 45] * 75
        + [50, 55, 60, 50] * 25
        + [65] * 25
    )
    rng = random.Random(SEED + 11)
    rng.shuffle(slots)
    return slots


def make_instructions(
    design: dict[str, Any],
    methods: list[str],
    servings: int,
) -> list[str]:
    protein_name = INGREDIENTS[design["protein_id"]]["display_name"].lower()
    carb_name = INGREDIENTS[design["carb_id"]]["display_name"].lower()
    vegetables = [INGREDIENTS[item]["display_name"].lower() for item in design["vegetable_ids"]]
    sauce_names = [INGREDIENTS[item]["display_name"].lower() for item in design["style"]["sauces"]]
    seasoning_names = [INGREDIENTS[item]["display_name"].lower() for item in design["style"]["seasonings"]]
    sauce_phrase = ", ".join(sauce_names + seasoning_names)

    if design["carb_id"] in {"tortilla", "corn_tortilla", "whole_grain_bread", "pita"}:
        carb_step = f"Warm the {carb_name} briefly so it stays flexible, then let it cool before assembly."
    elif design["carb_id"] in {"potato", "sweet_potato"}:
        carb_step = f"Cut the {carb_name} into even pieces and roast or simmer until just tender."
    elif design["carb_id"] in {"pasta", "whole_wheat_pasta", "rice_noodles", "soba_noodles", "udon_noodles"}:
        carb_step = f"Boil the {carb_name} until just tender, drain well, and spread it out to stop the cooking."
    else:
        carb_step = f"Cook the {carb_name} until tender, then spread it on a tray so it cools evenly."

    steps = [
        carb_step,
        f"Combine the {sauce_phrase}; reserve a small portion for finishing.",
    ]
    if design["protein_id"] == "egg":
        steps.append("Cook the eggs gently until fully set, then divide them into meal-size portions.")
    elif design["protein_id"] == "canned_tuna":
        steps.append(f"Fold the {protein_name} into the sauce mixture and warm it gently without drying it out.")
    elif design["protein_id"] in {"black_beans", "chickpeas", "brown_lentils", "kidney_beans", "white_beans"}:
        steps.append(f"Simmer the {protein_name} with the sauce mixture until seasoned throughout and slightly thickened.")
    elif design["protein_id"] in {"firm_tofu", "extra_firm_tofu", "tempeh", "seitan", "edamame", "halloumi"}:
        steps.append(f"Sear the {protein_name} until browned, then coat it evenly with the sauce mixture.")
    elif "slow_cooker" in methods:
        steps.append(f"Add the {protein_name}, sauce mixture, and {vegetables[0]} to the slow cooker and cook until tender.")
    elif any(method in methods for method in ("oven", "roasting", "baking")):
        steps.append(f"Coat the {protein_name} with the sauce mixture and roast it until cooked through and lightly browned.")
    else:
        steps.append(f"Cook the {protein_name} in a large skillet with the sauce mixture until safely cooked through and browned.")
    steps.extend(
        [
            f"Cook the {vegetables[0]} and {vegetables[1]} until just tender, keeping enough texture for reheating.",
            f"Divide the components among {servings} containers, cool briefly, and add the reserved sauce before sealing.",
        ]
    )
    return steps


def nutrition_and_cost(rows: list[dict[str, Any]], servings: int) -> tuple[dict[str, Any], float]:
    totals = {"protein_g": 0.0, "carbs_g": 0.0, "fat_g": 0.0, "fiber_g": 0.0}
    cost_total = 0.0
    for row in rows:
        spec = INGREDIENTS[row["ingredient_id"]]
        factor = row["quantity"] / spec["basis_quantity"]
        for nutrient in totals:
            totals[nutrient] += spec["nutrition_per_basis_estimate"][nutrient] * factor
        cost_total += spec["estimated_cost_per_basis_usd"] * factor

    per_serving = {key: round(value / servings, 1) for key, value in totals.items()}
    per_serving["calories_kcal"] = round(
        per_serving["protein_g"] * 4
        + per_serving["carbs_g"] * 4
        + per_serving["fat_g"] * 9
    )
    nutrition = {
        "calories_kcal": per_serving["calories_kcal"],
        "protein_g": per_serving["protein_g"],
        "carbs_g": per_serving["carbs_g"],
        "fat_g": per_serving["fat_g"],
        "fiber_g": per_serving["fiber_g"],
    }
    return nutrition, cost_total


def scores_for(meal_type: str, protein_group: str, total_minutes: int) -> dict[str, Any]:
    meal_prep_base = {
        "salad": 7,
        "sandwich": 6,
        "wrap": 7,
        "breakfast": 8,
        "stew": 10,
        "soup": 9,
        "curry": 10,
        "sheet_pan": 10,
        "roasted_meal": 9,
    }.get(meal_type, 9)
    reheat = {
        "salad": 5,
        "sandwich": 6,
        "wrap": 7,
        "stew": 10,
        "soup": 10,
        "curry": 10,
        "pasta": 8,
        "noodle_bowl": 8,
    }.get(meal_type, 9)
    batch = {
        "sandwich": 7,
        "wrap": 8,
        "breakfast": 8,
        "sheet_pan": 10,
        "stew": 10,
        "soup": 10,
        "curry": 10,
    }.get(meal_type, 9)
    freezer_friendly = meal_type not in {"salad", "sandwich"} and protein_group != "egg_based"
    fridge_days = 3 if protein_group in {"fish", "shrimp_seafood"} or meal_type == "salad" else 4
    if protein_group in {"tofu_vegetarian", "beans_lentils_chickpeas", "other"}:
        fridge_days = max(fridge_days, 4)
    return {
        "meal_prep_score": meal_prep_base,
        "reheat_score": reheat,
        "freezer_friendly": freezer_friendly,
        "fridge_storage_days": fridge_days,
        "freezer_storage_days": 60 if freezer_friendly else 0,
        "batch_cooking_score": batch,
        "quick": total_minutes <= 30,
    }


def make_recipe(design: dict[str, Any], index: int, total_minutes: int) -> dict[str, Any]:
    servings = [4, 4, 5, 4, 6][index % 5]
    ingredient_ids_with_roles: list[tuple[str, str, int]] = [
        (design["protein_id"], "protein", 0),
        (design["carb_id"], "carb", 0),
        (design["vegetable_ids"][0], "vegetable", 0),
        (design["vegetable_ids"][1], "vegetable", 1),
    ]
    ingredient_ids_with_roles.extend(
        (item, "sauce", ordinal)
        for ordinal, item in enumerate(design["style"]["sauces"])
    )
    ingredient_ids_with_roles.extend(
        (item, "seasoning", ordinal)
        for ordinal, item in enumerate(design["style"]["seasonings"])
    )
    ingredient_ids_with_roles.append((design["oil_id"], "oil", 0))

    # Preserve order while preventing a profile from listing the same ingredient twice.
    unique_roles: list[tuple[str, str, int]] = []
    seen: set[str] = set()
    for item in ingredient_ids_with_roles:
        if item[0] not in seen:
            seen.add(item[0])
            unique_roles.append(item)

    rows = [
        ingredient_row(
            ingredient_id,
            amount_for(ingredient_id, role, servings, ordinal),
            optional=INGREDIENTS[ingredient_id]["category"] == "herb" and index % 7 == 0,
        )
        for ingredient_id, role, ordinal in unique_roles
    ]
    nutrition, raw_cost_total = nutrition_and_cost(rows, servings)
    cost_per_serving = round(raw_cost_total / servings, 2)
    cost_total = round(cost_per_serving * servings, 2)
    cost_tier = "budget" if cost_per_serving <= 4 else "moderate" if cost_per_serving <= 7 else "premium"

    prep_minutes = min(20, max(8, 9 + (index * 3) % 12))
    cook_minutes = total_minutes - prep_minutes
    methods = cooking_methods_for(design["meal_type"], design["carb_id"], index)
    meal_prep = scores_for(design["meal_type"], design["primary_protein"], total_minutes)
    ingredient_allergens = sorted(
        {
            allergen
            for row in rows
            for allergen in INGREDIENTS[row["ingredient_id"]]["allergens"]
        }
    )
    vegetarian_group = design["primary_protein"] in {
        "egg_based",
        "tofu_vegetarian",
        "beans_lentils_chickpeas",
        "other",
    }
    vegan_group = design["primary_protein"] in {
        "tofu_vegetarian",
        "beans_lentils_chickpeas",
    } or design["protein_id"] in {"seitan", "edamame"}
    has_dairy_or_egg = bool({"dairy", "egg"} & set(ingredient_allergens))
    has_animal_sauce = "fish" in ingredient_allergens or "shellfish" in ingredient_allergens
    high_protein_threshold = 23 if vegetarian_group else 30
    high_protein = nutrition["protein_g"] >= high_protein_threshold

    tags: list[str] = []
    if high_protein:
        tags.append("high_protein")
    if vegetarian_group and not has_animal_sauce:
        tags.append("vegetarian")
    if vegan_group and not has_dairy_or_egg and not has_animal_sauce:
        tags.append("vegan")
    if design["primary_protein"] in {"fish", "shrimp_seafood"}:
        tags.append("pescatarian")
    if "dairy" not in ingredient_allergens:
        tags.append("dairy_free")
    if "wheat" not in ingredient_allergens:
        tags.append("gluten_free")
    if nutrition["carbs_g"] <= 35:
        tags.append("low_carb")
    if nutrition["fiber_g"] >= 8:
        tags.append("high_fiber")
    if cost_tier == "budget":
        tags.append("budget")
    if meal_prep["freezer_friendly"]:
        tags.append("freezer_friendly")
    if meal_prep["quick"]:
        tags.append("quick")
    if "spicy" in design["style"]["flavors"]:
        tags.append("spicy")

    carb_name = INGREDIENTS[design["carb_id"]]["display_name"].lower()
    vegetable_name = INGREDIENTS[design["vegetable_ids"][0]]["display_name"].lower()
    protein_name = INGREDIENTS[design["protein_id"]]["display_name"].lower()
    flavor_text = ", ".join(design["style"]["flavors"][:2])
    supporting = [
        row["ingredient_id"]
        for row in rows
        if row["ingredient_id"] not in design["core_ingredients"]
    ]
    prep_components = [
        f"cook_{design['carb_id']}",
        f"chop_{design['vegetable_ids'][0]}",
        f"chop_{design['vegetable_ids'][1]}",
        f"cook_{design['protein_id']}",
        f"make_{design['style']['key']}_sauce",
    ]

    return {
        "recipe_id": design["recipe_id"],
        "name": design["name"],
        "slug": design["slug"],
        "description": f"A {flavor_text} meal-prep {MEAL_LABELS[design['meal_type']].lower()} with {protein_name}, {carb_name}, and {vegetable_name}.",
        "primary_protein": design["primary_protein"],
        "cuisine": design["cuisine"],
        "meal_type": design["meal_type"],
        "servings": servings,
        "ingredients": rows,
        "instructions": make_instructions(design, methods, servings),
        "nutrition_per_serving": nutrition,
        "timing": {
            "prep_minutes": prep_minutes,
            "cook_minutes": cook_minutes,
            "total_minutes": total_minutes,
        },
        "estimated_cost": {
            "cost_per_serving_usd": cost_per_serving,
            "cost_total_usd": cost_total,
            "cost_tier": cost_tier,
            "estimate_basis": "Approximate mainstream US grocery prices; varies by store and region.",
        },
        "meal_prep": {key: value for key, value in meal_prep.items() if key != "quick"},
        "equipment": equipment_for(methods, design["meal_type"]),
        "dietary_tags": tags,
        "allergens": ingredient_allergens,
        "difficulty": "easy" if index % 5 else "medium",
        "spice_level": 3 + index % 2 if "spicy" in design["style"]["flavors"] else 1 + index % 2,
        "ingredient_count": len(rows),
        "core_ingredients": design["core_ingredients"],
        "supporting_ingredients": supporting,
        "optimization_tags": {
            "high_protein": high_protein,
            "low_cost": cost_per_serving <= 4,
            "low_ingredient_count": len(rows) <= 8,
            "quick_prep": prep_minutes <= 15,
            "good_for_batching": meal_prep["batch_cooking_score"] >= 8,
        },
        "prep_components": prep_components,
        "cooking_methods": methods,
        "flavor_profile": design["style"]["flavors"],
        "variety_group": f"{design['cuisine']}_{design['style']['key']}_{design['primary_protein']}",
        "data_quality": {
            "nutrition": "ingredient-derived estimate",
            "cost": "ingredient-derived estimate",
        },
    }


def validate_batch(recipes: list[dict[str, Any]], expected_count: int) -> None:
    if len(recipes) != expected_count:
        raise RuntimeError(f"Batch validation expected {expected_count} recipes, received {len(recipes)}")
    ids = [recipe["recipe_id"] for recipe in recipes]
    names = [recipe["name"] for recipe in recipes]
    slugs = [recipe["slug"] for recipe in recipes]
    if len(set(ids)) != len(ids) or len(set(names)) != len(names) or len(set(slugs)) != len(slugs):
        raise RuntimeError("Batch validation found a duplicate identifier, name, or slug")
    for recipe in recipes:
        if not 6 <= recipe["ingredient_count"] <= 12:
            raise RuntimeError(f"{recipe['recipe_id']} has an unsuitable ingredient count")
        if recipe["ingredient_count"] != len(recipe["ingredients"]):
            raise RuntimeError(f"{recipe['recipe_id']} ingredient_count is inconsistent")
        if any(row["ingredient_id"] not in INGREDIENTS for row in recipe["ingredients"]):
            raise RuntimeError(f"{recipe['recipe_id']} references an unknown ingredient")
        if any(row["unit"] not in ALLOWED_UNITS or row["quantity"] <= 0 for row in recipe["ingredients"]):
            raise RuntimeError(f"{recipe['recipe_id']} has an invalid unit or quantity")
        if recipe["timing"]["prep_minutes"] + recipe["timing"]["cook_minutes"] != recipe["timing"]["total_minutes"]:
            raise RuntimeError(f"{recipe['recipe_id']} has inconsistent timing")


def write_outputs(manifest: list[dict[str, Any]], recipes: list[dict[str, Any]]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    taxonomy = {
        ingredient_id: {
            **spec,
            "nutrition_note": "Approximate values for dataset calculations; verify for production nutrition guidance.",
            "cost_note": "Approximate US grocery estimate; not a live price.",
        }
        for ingredient_id, spec in sorted(INGREDIENTS.items())
    }
    (DATA_DIR / "ingredients.json").write_text(
        json.dumps(taxonomy, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    (DATA_DIR / "recipe_manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    (DATA_DIR / "recipes.json").write_text(
        json.dumps(recipes, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    recipe_columns = [
        "recipe_id", "name", "primary_protein", "cuisine", "meal_type", "servings",
        "calories_kcal", "protein_g", "carbs_g", "fat_g", "fiber_g",
        "prep_minutes", "cook_minutes", "total_minutes", "cost_per_serving_usd",
        "meal_prep_score", "reheat_score", "batch_cooking_score",
        "fridge_storage_days", "freezer_friendly", "difficulty", "ingredient_count",
    ]
    with (DATA_DIR / "recipes.csv").open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=recipe_columns)
        writer.writeheader()
        for recipe in recipes:
            writer.writerow(
                {
                    "recipe_id": recipe["recipe_id"],
                    "name": recipe["name"],
                    "primary_protein": recipe["primary_protein"],
                    "cuisine": recipe["cuisine"],
                    "meal_type": recipe["meal_type"],
                    "servings": recipe["servings"],
                    **recipe["nutrition_per_serving"],
                    **recipe["timing"],
                    "cost_per_serving_usd": recipe["estimated_cost"]["cost_per_serving_usd"],
                    "meal_prep_score": recipe["meal_prep"]["meal_prep_score"],
                    "reheat_score": recipe["meal_prep"]["reheat_score"],
                    "batch_cooking_score": recipe["meal_prep"]["batch_cooking_score"],
                    "fridge_storage_days": recipe["meal_prep"]["fridge_storage_days"],
                    "freezer_friendly": str(recipe["meal_prep"]["freezer_friendly"]).lower(),
                    "difficulty": recipe["difficulty"],
                    "ingredient_count": recipe["ingredient_count"],
                }
            )

    ingredient_columns = ["recipe_id", "ingredient_id", "quantity", "unit", "category"]
    with (DATA_DIR / "recipe_ingredients.csv").open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=ingredient_columns)
        writer.writeheader()
        for recipe in recipes:
            for row in recipe["ingredients"]:
                writer.writerow({"recipe_id": recipe["recipe_id"], **{key: row[key] for key in ingredient_columns[1:]}})


def main() -> None:
    manifest, designs = make_manifest()
    times = timing_slots()
    recipes: list[dict[str, Any]] = []

    for batch_start in range(0, 500, 50):
        batch_designs = designs[batch_start : batch_start + 50]
        for offset, design in enumerate(batch_designs):
            global_index = batch_start + offset + 1
            recipes.append(make_recipe(design, global_index, times[global_index - 1]))
        validate_batch(recipes, batch_start + 50)
        print(f"Validated batch {batch_start + 1:03d}-{batch_start + 50:03d}")

    write_outputs(manifest, recipes)
    print(f"Wrote {len(INGREDIENTS)} ingredients and {len(recipes)} recipes to {DATA_DIR}")


if __name__ == "__main__":
    main()
