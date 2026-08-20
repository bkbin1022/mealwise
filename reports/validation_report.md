# Mealpush Recipe Database Validation Report

**Validation status:** PASS
**Recipes loaded:** 500
**Valid recipes:** 500
**Recipe-level errors:** 0
**Global errors:** 0
**Potential duplicate warnings:** 0

Nutrition and pricing fields are ingredient-derived estimates for optimization and must not be treated as medical advice or live retail pricing.

## Automated checks

- Exactly 500 recipes
- Unique recipe IDs, slugs, and names
- Required schema fields and allowed enum values
- Ingredient taxonomy references, metric units, categories, and positive quantities
- Core/supporting ingredient integrity and declared ingredient counts
- Positive servings, nutrition, and internally consistent macro calories
- Timing, cost totals, storage windows, and score ranges
- Protein and cuisine quota distributions
- CSV export row counts and recipe references
- Pairwise duplicate-concept similarity

## Distribution verification

### Primary protein

| Value | Count |
|---|---:|
| `chicken` | 110 |
| `beef` | 70 |
| `tofu_vegetarian` | 65 |
| `beans_lentils_chickpeas` | 50 |
| `pork` | 45 |
| `fish` | 45 |
| `egg_based` | 35 |
| `turkey` | 35 |
| `shrimp_seafood` | 25 |
| `other` | 20 |

### Cuisine

| Value | Count |
|---|---:|
| `american_western` | 80 |
| `korean` | 60 |
| `mexican_tex_mex` | 60 |
| `mediterranean` | 55 |
| `italian` | 45 |
| `chinese_inspired` | 45 |
| `japanese` | 45 |
| `indian` | 40 |
| `southeast_asian` | 35 |
| `middle_eastern` | 20 |
| `other_fusion` | 15 |

## Potential duplicate concepts

No recipe pairs crossed the configured 0.90 similarity-review threshold.

