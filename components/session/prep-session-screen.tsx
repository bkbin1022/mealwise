"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import MealpushLogo from "@/components/shared/mealpush-logo";
import {
  currentRecipes,
  previousRecipes,
  recipesFromRecommendations,
  recipesFromSelection,
  type Recipe,
  type StoredWeekPlans,
} from "@/lib/mealpush/recipes";

type SessionPhase = "ready" | "active" | "complete";

const toneStyles: Record<Recipe["tone"], { base: string; accent: string; soft: string }> = {
  orange: { base: "#d66f43", accent: "#f1aa63", soft: "#f8dfca" },
  green: { base: "#47795a", accent: "#91bd6d", soft: "#dceacb" },
  yellow: { base: "#d19c38", accent: "#f0ca68", soft: "#f6e8b7" },
};

function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfWeek(date: Date) {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  return start;
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function formatWeekRange(weekKey: string) {
  const start = parseLocalDate(weekKey);
  const end = addDays(start, 6);
  const startLabel = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endLabel = end.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${startLabel} – ${endLabel}`;
}

function MealArtwork({ recipe }: Readonly<{ recipe: Recipe }>) {
  const colors = toneStyles[recipe.tone];

  return (
    <svg viewBox="0 0 520 420" aria-hidden="true" className="h-full w-full">
      <circle cx="260" cy="205" r="172" fill={colors.soft} opacity="0.23" />
      <circle cx="260" cy="205" r="137" fill="#f8f4e8" />
      <circle cx="260" cy="205" r="119" fill={colors.base} />
      <path d="M155 198c26-52 72-79 121-76 51 3 87 36 100 82-31 35-69 55-116 56-47 1-82-19-105-62Z" fill={colors.accent} />
      <path d="M178 183c29-28 67-42 103-35 30 5 55 22 73 49-27-3-48 2-68 16-34 23-70 20-108-30Z" fill="#e8d08d" />
      <circle cx="211" cy="218" r="24" fill="#89aa63" />
      <circle cx="304" cy="187" r="20" fill="#6e9659" />
      <path d="m246 159 18 18-20 18-19-18Z" fill="#f5eee0" />
      <path d="M151 303c64 42 154 48 222 4" fill="none" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="5" strokeLinecap="round" />
      <path d="M404 91c20 26 29 60 25 95" fill="none" stroke={colors.accent} strokeWidth="7" strokeLinecap="round" />
      <circle cx="420" cy="75" r="9" fill={colors.accent} />
    </svg>
  );
}

function SessionHeader({ progress }: Readonly<{ progress: number }>) {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 pt-4 sm:px-7 sm:pt-6">
      <div className="rounded-full bg-[#f5f7f1] px-4 py-2 shadow-sm">
        <MealpushLogo className="text-xl sm:text-2xl" />
      </div>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/12">
        <div
          className="h-full rounded-full bg-[#b7df76] transition-[width] duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <Link
        href="/dashboard"
        aria-label="Exit preparation session"
        className="flex size-10 items-center justify-center rounded-full border border-white/15 text-white transition hover:bg-white/10"
      >
        <svg viewBox="0 0 20 20" aria-hidden="true" className="size-4">
          <path d="m5 5 10 10M15 5 5 15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </Link>
    </header>
  );
}

export default function PrepSessionScreen({
  userId,
  initialWeekKey,
  initialRecipeId,
  todayISO,
}: Readonly<{
  userId: string;
  initialWeekKey?: string;
  initialRecipeId?: string;
  todayISO: string;
}>) {
  const currentWeekKey = useMemo(
    () => formatDateKey(startOfWeek(parseLocalDate(todayISO))),
    [todayISO],
  );
  const previousWeekKey = useMemo(
    () => formatDateKey(addDays(parseLocalDate(currentWeekKey), -7)),
    [currentWeekKey],
  );
  const weekKey = initialWeekKey ?? currentWeekKey;
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [phase, setPhase] = useState<SessionPhase>("ready");
  const [mealIndex, setMealIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;

    Promise.resolve().then(() => {
      let nextRecipes: Recipe[] | null = null;

      try {
        const storedValue = window.localStorage.getItem(`mealpush-week-plans:${userId}`);
        const storedPlans = storedValue
          ? (JSON.parse(storedValue) as StoredWeekPlans)
          : {};
        const storedPlan = storedPlans[weekKey];

        if (storedPlan?.recipes?.length) {
          nextRecipes = recipesFromRecommendations(storedPlan.recipes);
        } else if (storedPlan) {
          nextRecipes = recipesFromSelection(storedPlan.selectedIds, weekKey);
        }
      } catch {
        nextRecipes = null;
      }

      if (!nextRecipes && weekKey === currentWeekKey) nextRecipes = currentRecipes;
      if (!nextRecipes && weekKey === previousWeekKey) nextRecipes = previousRecipes;

      if (nextRecipes && initialRecipeId) {
        const startIndex = nextRecipes.findIndex((recipe) => recipe.id === initialRecipeId);
        if (startIndex > 0) {
          nextRecipes = [
            nextRecipes[startIndex],
            ...nextRecipes.slice(0, startIndex),
            ...nextRecipes.slice(startIndex + 1),
          ];
        }
      }

      if (!cancelled) {
        setRecipes(nextRecipes);
        setLoaded(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [currentWeekKey, initialRecipeId, previousWeekKey, userId, weekKey]);

  const totalSteps = recipes?.reduce((sum, recipe) => sum + recipe.steps.length, 0) ?? 0;
  const completedBeforeMeal =
    recipes?.slice(0, mealIndex).reduce((sum, recipe) => sum + recipe.steps.length, 0) ?? 0;
  const completedSteps =
    phase === "complete"
      ? totalSteps
      : phase === "active"
        ? completedBeforeMeal + stepIndex
        : 0;
  const progress = totalSteps ? (completedSteps / totalSteps) * 100 : 0;
  const activeRecipe = recipes?.[mealIndex];
  const activeStep = activeRecipe?.steps[stepIndex];
  const isLastStep = Boolean(activeRecipe && stepIndex === activeRecipe.steps.length - 1);
  const isLastMeal = Boolean(recipes && mealIndex === recipes.length - 1);
  const totalTime = recipes?.reduce((sum, recipe) => sum + recipe.time, 0) ?? 0;
  const totalServings = recipes?.reduce((sum, recipe) => sum + recipe.servings, 0) ?? 0;

  function goNext() {
    if (!activeRecipe) return;
    if (!isLastStep) {
      setStepIndex((current) => current + 1);
      return;
    }
    if (!isLastMeal) {
      setMealIndex((current) => current + 1);
      setStepIndex(0);
      return;
    }
    setPhase("complete");
  }

  function goBack() {
    if (stepIndex > 0) {
      setStepIndex((current) => current - 1);
      return;
    }
    if (mealIndex > 0 && recipes) {
      const previousMealIndex = mealIndex - 1;
      setMealIndex(previousMealIndex);
      setStepIndex(recipes[previousMealIndex].steps.length - 1);
    }
  }

  if (!loaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#10291d] text-white">
        <div className="text-center">
          <div className="mx-auto size-12 animate-pulse rounded-full border-4 border-[#b7df76] border-r-transparent" />
          <p className="mt-5 text-sm font-extrabold tracking-wide text-[#c8d9ce]">Loading your prep session...</p>
        </div>
      </main>
    );
  }

  if (!recipes?.length || !activeRecipe) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#10291d] p-5 text-white">
        <section className="w-full max-w-lg rounded-[2rem] bg-[#f5f7f1] p-8 text-center text-[#173c2a] sm:p-10">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#6f8f63]">No prep session yet</p>
          <h1 className="mt-3 text-4xl font-bold tracking-[-0.045em]" style={{ fontFamily: "var(--font-baloo)" }}>Plan this week first.</h1>
          <p className="mt-3 text-sm leading-6 text-[#687c6e]">Choose ingredients and build your meal lineup before starting a session.</p>
          <Link href={`/plan?week=${weekKey}`} className="mt-7 inline-flex rounded-2xl bg-[#173c2a] px-7 py-4 font-extrabold text-white transition hover:bg-[#244e39]">Create this plan</Link>
        </section>
      </main>
    );
  }

  if (phase === "ready") {
    return (
      <main className="min-h-screen overflow-hidden bg-[#10291d] pb-8 text-white">
        <SessionHeader progress={0} />
        <section className="session-step-enter mx-auto grid min-h-[calc(100vh-5.5rem)] w-full max-w-6xl items-center gap-7 px-4 py-7 sm:px-7 lg:grid-cols-[0.9fr_1.1fr] lg:py-10">
          <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-[2.5rem] bg-[#1a3a2a]">
            <MealArtwork recipe={recipes[0]} />
            <div className="absolute inset-x-5 bottom-5 rounded-2xl bg-[#10291d]/85 p-4 backdrop-blur-md">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#b7df76]">First up</p>
              <p className="mt-1 font-extrabold">{recipes[0].title}</p>
            </div>
          </div>
          <div className="lg:pl-6">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#b7df76]">{formatWeekRange(weekKey)} · Prep session</p>
            <h1 className="mt-4 max-w-2xl text-5xl font-bold leading-[0.95] tracking-[-0.055em] sm:text-6xl" style={{ fontFamily: "var(--font-baloo)" }}>One session.<br />The whole week.</h1>
            <p className="mt-5 max-w-xl text-sm leading-6 text-[#b9cbc0] sm:text-base">Move through every meal in order. We&apos;ll keep you focused on one clear step at a time.</p>
            <div className="mt-7 grid grid-cols-3 gap-2">
              {[["Meals", recipes.length], ["Steps", totalSteps], ["Est. time", `${totalTime} min`]].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-white/[0.07] px-3 py-4">
                  <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#8faa99]">{label}</p>
                  <p className="mt-1.5 text-lg font-extrabold text-white">{value}</p>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setPhase("active")} className="mt-7 w-full rounded-2xl bg-[#b7df76] px-6 py-4 text-base font-extrabold text-[#173c2a] shadow-[0_14px_36px_rgba(183,223,118,0.18)] transition hover:bg-[#c7e991] sm:w-auto sm:min-w-64">Start session</button>
          </div>
        </section>
      </main>
    );
  }

  if (phase === "complete") {
    return (
      <main className="min-h-screen overflow-hidden bg-[#10291d] pb-8 text-white">
        <SessionHeader progress={100} />
        <section className="session-step-enter mx-auto flex min-h-[calc(100vh-5.5rem)] w-full max-w-3xl flex-col items-center justify-center px-5 py-10 text-center">
          <div className="flex size-24 items-center justify-center rounded-full bg-[#b7df76] text-[#173c2a] shadow-[0_0_0_14px_rgba(183,223,118,0.1)]">
            <svg viewBox="0 0 36 36" aria-hidden="true" className="size-11"><path d="m8 18.5 6.5 6.5L28 11" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <p className="mt-8 text-xs font-extrabold uppercase tracking-[0.19em] text-[#b7df76]">Session complete</p>
          <h1 className="mt-3 text-5xl font-bold leading-none tracking-[-0.055em] sm:text-7xl" style={{ fontFamily: "var(--font-baloo)" }}>Your week is ready.</h1>
          <p className="mt-5 max-w-lg text-sm leading-6 text-[#b9cbc0] sm:text-base">You finished {recipes.length} meals, {totalSteps} cooking steps, and prepared {totalServings} servings.</p>
          <div className="mt-8 flex w-full max-w-xl flex-col gap-2">
            {recipes.map((recipe) => (
              <div key={recipe.id} className="flex items-center gap-3 rounded-2xl bg-white/[0.07] px-4 py-3 text-left">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#b7df76] text-[#173c2a]"><svg viewBox="0 0 20 20" aria-hidden="true" className="size-4"><path d="m4.5 10 3.5 3.5 7.5-8" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
                <span className="min-w-0"><span className="block truncate font-extrabold">{recipe.title}</span><span className="block text-xs text-[#9fb2a6]">{recipe.servings} servings ready</span></span>
              </div>
            ))}
          </div>
          <Link href="/dashboard" className="mt-8 rounded-2xl bg-[#b7df76] px-9 py-4 font-extrabold text-[#173c2a] transition hover:bg-[#c7e991]">Back to dashboard</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#10291d] pb-8 text-white">
      <SessionHeader progress={progress} />
      <section className="mx-auto grid min-h-[calc(100vh-5.5rem)] w-full max-w-6xl items-center gap-7 px-4 py-7 sm:px-7 lg:grid-cols-[0.86fr_1.14fr] lg:py-9">
        <div className="order-2 lg:order-1">
          <div className="hidden aspect-square w-full overflow-hidden rounded-[2.5rem] bg-[#1a3a2a] lg:block">
            <MealArtwork recipe={activeRecipe} />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {recipes.map((recipe, index) => (
              <div key={recipe.id} className={`rounded-2xl border px-3 py-3 transition ${index === mealIndex ? "border-[#b7df76] bg-[#b7df76]/10" : index < mealIndex ? "border-white/5 bg-white/[0.06]" : "border-white/10"}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className={`flex size-6 items-center justify-center rounded-full text-[10px] font-extrabold ${index < mealIndex ? "bg-[#b7df76] text-[#173c2a]" : index === mealIndex ? "border border-[#b7df76] text-[#b7df76]" : "border border-white/20 text-[#879c8f]"}`}>
                    {index < mealIndex ? <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3"><path d="m3 8 3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg> : index + 1}
                  </span>
                  <span className="text-[9px] font-extrabold uppercase tracking-[0.08em] text-[#8fa296]">{recipe.time}m</span>
                </div>
                <p className={`mt-2 line-clamp-2 text-xs font-extrabold leading-4 ${index > mealIndex ? "text-[#819488]" : "text-white"}`}>{recipe.title}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="order-1 lg:order-2 lg:pl-7" aria-live="polite">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#b7df76]">Meal {mealIndex + 1} of {recipes.length}</p>
            <p className="text-xs font-bold text-[#93a79a]">Step {stepIndex + 1} / {activeRecipe.steps.length}</p>
          </div>
          <div key={`${activeRecipe.id}-${stepIndex}`} className="session-step-enter">
            <h1 className="mt-4 text-4xl font-bold leading-none tracking-[-0.045em] sm:text-5xl" style={{ fontFamily: "var(--font-baloo)" }}>{activeRecipe.title}</h1>
            <p className="mt-2 text-sm text-[#a9bdb0]">{activeRecipe.subtitle}</p>

            <div className="mt-7 rounded-[2rem] bg-[#f5f7f1] p-6 text-[#173c2a] shadow-[0_22px_60px_rgba(3,15,8,0.25)] sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#6f8f63]">Do this now</p>
                <span className="rounded-full bg-[#e4eddc] px-3 py-1 text-[10px] font-extrabold text-[#52705b]">{Math.max(3, Math.round(activeRecipe.time / activeRecipe.steps.length))} min</span>
              </div>
              <p className="mt-6 min-h-28 text-2xl font-extrabold leading-snug tracking-[-0.02em] sm:text-3xl">{activeStep}</p>
              <div className="mt-7 flex gap-2">
                {activeRecipe.steps.map((step, index) => (
                  <span key={step} className={`h-1.5 flex-1 rounded-full transition-colors ${index <= stepIndex ? "bg-[#94bf4a]" : "bg-[#dbe4d7]"}`} />
                ))}
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button type="button" onClick={goBack} disabled={mealIndex === 0 && stepIndex === 0} className="rounded-2xl border border-white/15 px-5 py-4 text-sm font-extrabold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30">Previous</button>
              <button type="button" onClick={goNext} className="flex-1 rounded-2xl bg-[#b7df76] px-6 py-4 text-sm font-extrabold text-[#173c2a] shadow-[0_14px_34px_rgba(183,223,118,0.16)] transition hover:bg-[#c7e991]">
                {!isLastStep ? "Next step" : !isLastMeal ? "Next meal" : "Finish session"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
