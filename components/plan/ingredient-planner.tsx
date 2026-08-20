"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import MealpushLogo from "@/components/shared/mealpush-logo";
import { createClient } from "@/lib/supabase/client";
import {
  ingredientCategories,
  ingredients,
  type Ingredient,
  type IngredientCategory,
} from "@/lib/mealpush/ingredients";

const questions: Record<
  IngredientCategory,
  { eyebrow: string; title: string; description: string }
> = {
  Protein: {
    eyebrow: "Step one / Protein",
    title: "Choose your proteins.",
    description: "Pick everything you would enjoy eating this week.",
  },
  Carbs: {
    eyebrow: "Step two / Carbs",
    title: "Choose your carbs.",
    description: "Select the satisfying bases you want in your meal plan.",
  },
  Vegetables: {
    eyebrow: "Step three / Vegetables",
    title: "Choose your vegetables.",
    description: "Pick the vegetables you will actually look forward to eating.",
  },
  Fats: {
    eyebrow: "Step four / Healthy fats",
    title: "Choose your healthy fats.",
    description: "Add a few choices to keep your meals filling and flavorful.",
  },
  Extras: {
    eyebrow: "Final step / Extras",
    title: "Add the finishing touches.",
    description: "Choose the extras that make your meals feel complete.",
  },
};

type Flow = "ingredients" | "optimizing" | "results";

function IngredientArt({ ingredient }: Readonly<{ ingredient: Ingredient }>) {
  const [base, dark, light] = ingredient.colors;

  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className="size-16 shrink-0">
      <circle cx="32" cy="32" r="29" fill={light} />
      <path
        d="M18 35C18 23 24 16 34 16C44 16 50 24 48 35C46 46 39 51 30 50C22 49 18 43 18 35Z"
        fill={base}
      />
      <path
        d="M23 27C29 22 39 21 45 27"
        stroke={dark}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="27" cy="35" r="3" fill={dark} opacity=".85" />
      <circle cx="39" cy="38" r="4" fill={dark} opacity=".7" />
      <path
        d="M29 17C30 11 35 8 41 9"
        stroke="#315D42"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IngredientCard({
  ingredient,
  selected,
  onToggle,
}: Readonly<{
  ingredient: Ingredient;
  selected: boolean;
  onToggle: () => void;
}>) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={`group relative flex min-h-40 flex-col items-center justify-center gap-3 rounded-[1.5rem] border p-5 text-center shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(49,93,66,0.12)] active:translate-y-0 ${
        selected
          ? "border-[#94bf4a] bg-[#e7f0dc] text-[#315d42] ring-4 ring-[#94bf4a]/15"
          : "border-[#315d42]/10 bg-white text-[#193426] hover:border-[#94bf4a]/60"
      }`}
    >
      <span
        className={`absolute right-4 top-4 flex size-6 items-center justify-center rounded-full border transition ${
          selected
            ? "border-[#315d42] bg-[#315d42]"
            : "border-[#315d42]/15 bg-[#f7faf5] group-hover:border-[#94bf4a]"
        }`}
      >
        {selected && (
          <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3 text-white">
            <path
              d="m3 8.2 3.1 3.1L13 4.8"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <IngredientArt ingredient={ingredient} />
      <span className="text-lg font-extrabold leading-tight">{ingredient.name}</span>
    </button>
  );
}

function OptimizationStep({ onDone }: Readonly<{ onDone: () => void }>) {
  const [phase, setPhase] = useState("Matching ingredients into practical meals");

  useEffect(() => {
    const nutritionTimer = window.setTimeout(
      () => setPhase("Balancing nutrition, variety, and prep time"),
      900,
    );
    const finishTimer = window.setTimeout(
      () => setPhase("Putting the finishing touches on your week"),
      1900,
    );
    const doneTimer = window.setTimeout(onDone, 3200);

    return () => {
      window.clearTimeout(nutritionTimer);
      window.clearTimeout(finishTimer);
      window.clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <main className="plan-step-enter flex min-h-screen items-center justify-center bg-[#f7faf5] px-5">
      <div className="max-w-lg text-center" role="status" aria-live="polite">
        <div className="plan-optimizer-orbit mx-auto flex size-28 items-center justify-center rounded-full border border-[#94bf4a]/30 bg-[#e7f0dc] shadow-[0_0_0_18px_rgba(231,240,220,0.7)]">
          <svg viewBox="0 0 64 64" aria-hidden="true" className="size-14">
            <path
              d="M18 35C18 23 24 16 34 16C44 16 50 24 48 35C46 46 39 51 30 50C22 49 18 43 18 35Z"
              fill="#94bf4a"
            />
            <path
              d="M23 27C29 22 39 21 45 27"
              fill="none"
              stroke="#315d42"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M29 17C30 11 35 8 41 9"
              fill="none"
              stroke="#315d42"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <p className="mt-12 text-xs font-extrabold uppercase tracking-[0.17em] text-[#5f8e4f]">
          All ready!
        </p>
        <h1
          className="mt-3 text-4xl font-bold tracking-[-0.05em] text-[#193426] sm:text-6xl"
          style={{ fontFamily: "var(--font-baloo)" }}
        >
          Preparing your meal...
        </h1>
        <p className="mt-5 text-base leading-7 text-[#68816d]">{phase}</p>
      </div>
    </main>
  );
}

type MealResult = {
  name: string;
  detail: string;
  calories: number;
  price: string;
  macros: {
    protein: string;
    carbs: string;
    fat: string;
  };
  ingredients: string[];
  steps: string[];
  videoUrl: string;
};

function MealPhotoPlaceholder({ className = "" }: Readonly<{ className?: string }>) {
  return (
    <div
      className={`flex items-center justify-center rounded-2xl border border-dashed border-[#315d42]/18 bg-[#f3f7f0] text-center ${className}`}
      aria-label="Reserved space for a meal photo"
    >
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#6f8773]">
          Meal photo
        </p>
        <p className="mt-1 text-xs font-bold text-[#9aaa9c]">Coming soon</p>
      </div>
    </div>
  );
}

function MealDetailModal({
  meal,
  onClose,
}: Readonly<{ meal: MealResult; onClose: () => void }>) {
  return (
    <div
      className="plan-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-[#10261a]/55 p-3 backdrop-blur-sm sm:p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="meal-detail-title"
        className="plan-modal-pop flex h-[88vh] w-[94vw] max-w-6xl flex-col overflow-hidden rounded-[2rem] bg-[#fffdf9] shadow-[0_36px_100px_rgba(16,38,26,0.32)] md:h-[76vh] md:w-[72vw]"
      >
        <header className="flex shrink-0 items-start justify-between gap-5 border-b border-[#315d42]/10 px-5 py-4 sm:px-8 sm:py-5">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#5f8e4f]">
              Your Mealpush recipe
            </p>
            <h2
              id="meal-detail-title"
              className="mt-1 text-2xl font-bold tracking-[-0.035em] text-[#193426] sm:text-3xl"
              style={{ fontFamily: "var(--font-baloo)" }}
            >
              {meal.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full border border-[#315d42]/15 bg-white px-4 py-2 text-sm font-extrabold text-[#315d42] transition hover:border-[#94bf4a] hover:bg-[#f7faf5]"
          >
            Close
          </button>
        </header>

        <div className="grid flex-1 overflow-y-auto lg:grid-cols-[0.9fr_1.1fr]">
          <div className="border-b border-[#315d42]/10 bg-[#eef5e8] p-5 sm:p-8 lg:border-b-0 lg:border-r">
            <MealPhotoPlaceholder className="aspect-[4/3] w-full bg-white/55" />
            <p className="mt-5 text-sm leading-6 text-[#68816d]">{meal.detail}</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white p-3">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#78907c]">
                  Per serving
                </p>
                <p className="mt-1 text-lg font-extrabold text-[#193426]">
                  {meal.calories} kcal
                </p>
              </div>
              <div className="rounded-xl bg-white p-3">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#78907c]">
                  Est. cost
                </p>
                <p className="mt-1 text-lg font-extrabold text-[#193426]">{meal.price}</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              {[
                ["Protein", meal.macros.protein],
                ["Carbs", meal.macros.carbs],
                ["Fat", meal.macros.fat],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-[#315d42] px-2 py-3 text-white">
                  <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#cbe6a7]">
                    {label}
                  </p>
                  <p className="mt-1 text-sm font-extrabold">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 sm:p-8">
            <div className="grid gap-8 xl:grid-cols-2">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#5f8e4f]">
                  Ingredients
                </p>
                <ul className="mt-4 space-y-3">
                  {meal.ingredients.map((ingredient) => (
                    <li key={ingredient} className="flex items-start gap-3 text-sm text-[#526b58]">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#94bf4a]" />
                      <span>{ingredient}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#5f8e4f]">
                  How to make it
                </p>
                <ol className="mt-4 space-y-4">
                  {meal.steps.map((step, index) => (
                    <li key={step} className="flex gap-3 text-sm leading-6 text-[#526b58]">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#e7f0dc] text-xs font-extrabold text-[#315d42]">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <a
              href={meal.videoUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl bg-[#315d42] px-5 py-3.5 text-sm font-extrabold text-white transition hover:bg-[#254a34]"
            >
              <svg viewBox="0 0 20 20" aria-hidden="true" className="size-5">
                <path d="M7 5.7 14 10l-7 4.3V5.7Z" fill="currentColor" />
              </svg>
              Find a cooking video on YouTube
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

function HealthyMealIllustration() {
  return (
    <svg
      viewBox="0 0 760 700"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="max-h-[58vh] w-full"
    >
      <circle cx="612" cy="128" r="112" fill="#B7D686" opacity=".82" />
      <circle cx="120" cy="205" r="68" fill="#F1A55B" opacity=".72" />
      <ellipse cx="390" cy="638" rx="300" ry="30" fill="#315D42" opacity=".12" />
      <path d="M185 568C185 459 272 371 380 371H451C558 371 646 459 646 568V626H185V568Z" fill="#315D42" />
      <path d="M312 395C322 337 354 305 410 298C467 303 503 337 514 397L487 493H340L312 395Z" fill="#F0C3A1" />
      <path d="M330 239C330 169 368 123 425 123C482 123 520 169 520 239V287C520 356 481 402 425 402C369 402 330 356 330 287V239Z" fill="#F0C3A1" />
      <path d="M328 237C322 168 362 108 429 108C483 108 527 148 529 209C506 185 473 173 438 173C393 173 355 196 328 237Z" fill="#81513A" />
      <path d="M361 257C370 264 384 264 393 257" stroke="#A86E50" strokeWidth="7" strokeLinecap="round" />
      <path d="M454 257C463 264 477 264 486 257" stroke="#A86E50" strokeWidth="7" strokeLinecap="round" />
      <path d="M405 309C420 319 441 319 456 309" stroke="#6D3D2D" strokeWidth="7" strokeLinecap="round" />
      <path d="M348 398C384 422 466 425 506 396L542 530H310L348 398Z" fill="#F7FAF5" />
      <path d="M287 439C234 448 202 483 198 533L193 594L257 596L268 530C270 509 287 495 311 493L354 489L349 427L287 439Z" fill="#F0C3A1" />
      <path d="M535 423C579 410 621 432 638 475L668 550L612 572L578 499C571 483 551 476 535 484L486 506L461 450L535 423Z" fill="#F0C3A1" />
      <path d="M613 537C638 525 668 537 679 562L691 591L647 609L630 577L597 589L583 550L613 537Z" fill="#F0C3A1" />
      <path d="M612 545 530 365" stroke="#315D42" strokeWidth="8" strokeLinecap="round" />
      <ellipse cx="520" cy="347" rx="28" ry="13" fill="#F7FAF5" transform="rotate(18 520 347)" />
      <path d="M499 342C513 324 540 324 553 345C536 355 515 354 499 342Z" fill="#6EAC72" />
      <rect x="145" y="572" width="510" height="70" rx="24" fill="#FFFDF9" />
      <path d="M266 555C266 509 303 472 349 472H449C495 472 532 509 532 555C532 586 507 611 476 611H322C291 611 266 586 266 555Z" fill="#E7F0DC" />
      <path d="M288 548C328 525 375 519 418 532C452 542 483 561 509 584H290C281 573 280 560 288 548Z" fill="#F1A55B" />
      <circle cx="354" cy="540" r="27" fill="#6EAC72" />
      <circle cx="437" cy="554" r="24" fill="#F6D274" />
      <circle cx="390" cy="567" r="16" fill="#E45E4D" />
      <path d="M253 608H545" stroke="#315D42" strokeWidth="8" strokeLinecap="round" opacity=".2" />
    </svg>
  );
}

function SignupModal({ onClose }: Readonly<{ onClose: () => void }>) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function signUpWithEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const { data, error } = await createClient().auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setMessage(
      data.session
        ? "Your account is ready. Welcome to Mealpush!"
        : "Check your inbox to confirm your email and finish creating your account.",
    );
    setLoading(false);
  }

  async function signUpWithGoogle() {
    setLoading(true);
    setMessage(null);
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
    }
  }

  return (
    <div
      className="plan-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-[#10261a]/60 p-3 backdrop-blur-sm sm:p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="signup-title"
        className="plan-modal-pop grid max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-[2rem] bg-white shadow-[0_36px_100px_rgba(16,38,26,0.34)] lg:grid-cols-[3fr_2fr] lg:overflow-hidden"
      >
        <div className="relative hidden min-h-[38rem] overflow-hidden bg-[#e7f0dc] p-8 lg:flex lg:flex-col">
          <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_50%_0%,#c9e1ae,transparent_70%)]" />
          <div className="relative z-10 text-3xl font-bold leading-none" style={{ fontFamily: "var(--font-baloo)" }}>
            <span className="text-[#174c32]">meal</span>
            <span className="text-[#94bf4a]">wise</span>
          </div>
          <div className="relative z-10 mt-auto flex flex-1 flex-col items-center justify-center text-center">
            <HealthyMealIllustration />
            <div className="-mt-7 max-w-md">
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#5f8e4f]">
                Keep your best weeks
              </p>
              <h2
                className="mt-2 text-3xl font-bold tracking-[-0.04em] text-[#193426]"
                style={{ fontFamily: "var(--font-baloo)" }}
              >
                Your next meal is already figured out.
              </h2>
            </div>
          </div>
        </div>

        <div className="relative flex items-center justify-center p-6 sm:p-9 lg:min-h-[38rem] lg:p-10">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-5 rounded-full border border-[#315d42]/15 bg-white px-3.5 py-2 text-xs font-extrabold text-[#315d42] transition hover:border-[#94bf4a]"
          >
            Close
          </button>

          <div className="w-full max-w-sm pt-8 lg:pt-0">
            <p className="text-sm font-extrabold text-[#5f8e4f]">Save this plan for free</p>
            <h2
              id="signup-title"
              className="mt-2 text-3xl font-bold tracking-[-0.045em] text-[#193426]"
              style={{ fontFamily: "var(--font-baloo)" }}
            >
              Create your account.
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#68816d]">
              Keep your results, revisit recipes, and make next week even easier.
            </p>

            <form className="mt-6 space-y-3.5" onSubmit={signUpWithEmail}>
              <label className="block text-sm font-bold text-[#315d42]">
                Name
                <input
                  required
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Your name"
                  className="mt-1.5 w-full rounded-xl border border-[#315d42]/15 bg-[#f9fcf6] px-4 py-3 text-sm font-semibold text-[#193426] outline-none transition placeholder:text-[#97a89b] focus:border-[#5f8e4f] focus:ring-4 focus:ring-[#dceccb]"
                />
              </label>
              <label className="block text-sm font-bold text-[#315d42]">
                Email address
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="mt-1.5 w-full rounded-xl border border-[#315d42]/15 bg-[#f9fcf6] px-4 py-3 text-sm font-semibold text-[#193426] outline-none transition placeholder:text-[#97a89b] focus:border-[#5f8e4f] focus:ring-4 focus:ring-[#dceccb]"
                />
              </label>
              <label className="block text-sm font-bold text-[#315d42]">
                Password
                <input
                  required
                  minLength={6}
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 6 characters"
                  className="mt-1.5 w-full rounded-xl border border-[#315d42]/15 bg-[#f9fcf6] px-4 py-3 text-sm font-semibold text-[#193426] outline-none transition placeholder:text-[#97a89b] focus:border-[#5f8e4f] focus:ring-4 focus:ring-[#dceccb]"
                />
              </label>
              <button
                disabled={loading || success}
                type="submit"
                className="w-full rounded-xl bg-[#315d42] px-5 py-3.5 text-sm font-extrabold text-white transition hover:bg-[#254a34] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating account..." : success ? "Account created" : "Create free account"}
              </button>
            </form>

            <div className="my-4 flex items-center gap-3 text-[11px] font-bold text-[#8a9b8d]">
              <span className="h-px flex-1 bg-[#315d42]/10" />
              or
              <span className="h-px flex-1 bg-[#315d42]/10" />
            </div>
            <button
              disabled={loading}
              type="button"
              onClick={signUpWithGoogle}
              className="w-full rounded-xl border border-[#315d42]/15 bg-white px-5 py-3.5 text-sm font-extrabold text-[#315d42] transition hover:bg-[#f7faf5] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Continue with Google
            </button>

            {message && (
              <p
                role="status"
                className={`mt-4 rounded-xl px-4 py-3 text-center text-sm font-bold ${
                  success ? "bg-[#e7f0dc] text-[#315d42]" : "bg-[#fce8e4] text-[#9a3d2f]"
                }`}
              >
                {message}
              </p>
            )}

            <p className="mt-4 text-center text-xs text-[#839488]">
              Already have an account?{" "}
              <Link href="/auth" className="font-extrabold text-[#5f8e4f] hover:text-[#315d42]">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function ResultsStep({
  selected,
  onRestart,
}: Readonly<{ selected: Ingredient[]; onRestart: () => void }>) {
  const { user } = useAuth();
  const [activeMeal, setActiveMeal] = useState<MealResult | null>(null);
  const [showSignup, setShowSignup] = useState(false);
  const categoryChoices = (category: IngredientCategory) =>
    selected.filter((item) => item.category === category).map((item) => item.name);
  const protein = categoryChoices("Protein")[0] ?? "Your favorite protein";
  const carb = categoryChoices("Carbs")[0] ?? "a grain base";
  const vegetable = categoryChoices("Vegetables")[0] ?? "seasonal vegetables";
  const healthyFat = categoryChoices("Fats")[0] ?? "olive oil";
  const finishingTouch =
    categoryChoices("Extras")[0] ?? categoryChoices("Fats")[0] ?? "fresh herbs";
  const meals: MealResult[] = [
    {
      name: `${protein} and ${carb} bowl`,
      detail: `With ${vegetable} and ${finishingTouch}`,
      calories: 520,
      price: "$4.80",
      macros: { protein: "42g", carbs: "58g", fat: "14g" },
      ingredients: [
        `5 oz ${protein}`,
        `3/4 cup cooked ${carb}`,
        `1 cup ${vegetable}`,
        `1 tbsp ${healthyFat}`,
        `${finishingTouch}, to finish`,
        "Sea salt and black pepper",
      ],
      steps: [
        `Season and cook the ${protein} until golden and cooked through.`,
        `Warm the ${carb} and roast or saute the ${vegetable}.`,
        `Layer everything in a bowl, add ${healthyFat}, and finish with ${finishingTouch}.`,
      ],
      videoUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${protein} ${carb} meal prep bowl recipe`)}`,
    },
    {
      name: `Roasted ${protein} tray prep`,
      detail: `${vegetable} on the side, ready for fast lunches`,
      calories: 485,
      price: "$5.10",
      macros: { protein: "46g", carbs: "39g", fat: "16g" },
      ingredients: [
        `6 oz ${protein}`,
        `1 1/2 cups ${vegetable}`,
        `1/2 cup cooked ${carb}`,
        `1 tbsp ${healthyFat}`,
        `${finishingTouch}, to taste`,
        "Garlic, salt, and black pepper",
      ],
      steps: [
        "Heat the oven to 425°F and line a sheet pan.",
        `Toss the ${protein} and ${vegetable} with ${healthyFat} and seasonings.`,
        `Roast until caramelized, then portion with ${carb} and ${finishingTouch}.`,
      ],
      videoUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${protein} sheet pan meal prep recipe`)}`,
    },
    {
      name: `${carb} meal-prep salad`,
      detail: "A flexible base for the rest of your selected ingredients",
      calories: 440,
      price: "$3.90",
      macros: { protein: "31g", carbs: "54g", fat: "12g" },
      ingredients: [
        `1 cup cooked ${carb}`,
        `4 oz ${protein}`,
        `1 cup chopped ${vegetable}`,
        `1 tbsp ${healthyFat}`,
        `${finishingTouch}, to finish`,
        "Lemon juice, salt, and pepper",
      ],
      steps: [
        `Cook the ${carb}, spread it on a tray, and let it cool.`,
        `Chop the ${vegetable} and slice the cooked ${protein}.`,
        `Toss everything with ${healthyFat}, lemon, and ${finishingTouch}; chill before packing.`,
      ],
      videoUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${carb} high protein meal prep salad recipe`)}`,
    },
  ];

  useEffect(() => {
    if (!activeMeal && !showSignup) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveMeal(null);
        setShowSignup(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeMeal, showSignup]);

  return (
    <main className="plan-step-enter min-h-screen bg-[#f7faf5] px-5 py-6 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between">
          <MealpushLogo />
          <Link
            href={user ? "/dashboard" : "/auth"}
            className="rounded-full border border-[#315d42]/20 bg-[#e7f0dc] px-4 py-2 text-sm font-bold text-[#315d42] transition hover:bg-[#d9e8cc]"
          >
            {user ? "Dashboard" : "Sign in"}
          </Link>
        </header>

        <section className="mx-auto mt-14 max-w-3xl text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-[#5f8e4f]">
            Meal optimization complete
          </p>
          <h1
            className="mt-4 text-4xl font-bold tracking-[-0.05em] text-[#193426] sm:text-6xl"
            style={{ fontFamily: "var(--font-baloo)" }}
          >
            Your prep plan is ready.
          </h1>
          <p className="mt-4 text-lg leading-7 text-[#68816d]">
            A flexible, low-waste week built around the ingredients you chose.
          </p>
        </section>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {meals.map((meal, index) => (
            <button
              type="button"
              key={meal.name}
              onClick={() => setActiveMeal(meal)}
              className="group rounded-[1.75rem] border border-[#315d42]/10 bg-white p-4 text-left shadow-[0_18px_50px_rgba(49,93,66,0.08)] transition duration-200 hover:-translate-y-1 hover:border-[#94bf4a]/70 hover:shadow-[0_24px_60px_rgba(49,93,66,0.14)] sm:p-5"
            >
              <MealPhotoPlaceholder
                className={`aspect-[16/10] w-full transition group-hover:border-[#94bf4a]/60 ${
                  index === 0
                    ? "bg-[#eef5e8]"
                    : index === 1
                      ? "bg-[#fff5e8]"
                      : "bg-[#edf3e9]"
                }`}
              />
              <div className="px-1 pb-1 pt-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#5f8e4f]">
                    Meal {index + 1}
                  </p>
                  <p className="text-xs font-extrabold text-[#315d42]">{meal.price} / serving</p>
                </div>
                <h2 className="mt-2 text-xl font-extrabold leading-tight text-[#193426] sm:text-2xl">
                  {meal.name}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#68816d]">{meal.detail}</p>
                <div className="mt-5 grid grid-cols-4 gap-2 border-t border-[#315d42]/10 pt-4 text-center">
                  {[
                    ["Calories", `${meal.calories}`],
                    ["Protein", meal.macros.protein],
                    ["Carbs", meal.macros.carbs],
                    ["Fat", meal.macros.fat],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-[9px] font-bold uppercase tracking-[0.06em] text-[#8b9b8e]">
                        {label}
                      </p>
                      <p className="mt-1 text-xs font-extrabold text-[#315d42]">{value}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-5 text-center text-xs font-extrabold text-[#5f8e4f]">
                  View recipe
                </p>
              </div>
            </button>
          ))}
        </div>

        <div className="mx-auto mt-10 flex max-w-3xl flex-col items-center pb-8">
          {user ? (
            <Link
              href="/dashboard"
              className="w-full rounded-2xl bg-[#315d42] px-6 py-6 text-center text-xl font-extrabold text-white shadow-[0_18px_42px_rgba(49,93,66,0.2)] transition hover:-translate-y-0.5 hover:bg-[#254a34]"
            >
              View this week on dashboard
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setShowSignup(true)}
              className="w-full rounded-2xl bg-[#315d42] px-6 py-6 text-center text-xl font-extrabold text-white shadow-[0_18px_42px_rgba(49,93,66,0.2)] transition hover:-translate-y-0.5 hover:bg-[#254a34]"
            >
              Save your results!
            </button>
          )}
          <button
            type="button"
            onClick={onRestart}
            className="mt-5 rounded-full border border-[#315d42]/15 bg-white px-6 py-3 text-sm font-extrabold text-[#315d42] transition hover:border-[#94bf4a] hover:bg-[#f9fcf6]"
          >
            Start over
          </button>
        </div>
      </div>

      {activeMeal && <MealDetailModal meal={activeMeal} onClose={() => setActiveMeal(null)} />}
      {showSignup && !user && <SignupModal onClose={() => setShowSignup(false)} />}
    </main>
  );
}

export default function IngredientPlanner({ planWeek }: Readonly<{ planWeek?: string }>) {
  const { user } = useAuth();
  const [flow, setFlow] = useState<Flow>("ingredients");
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const category = ingredientCategories[categoryIndex];
  const question = questions[category];
  const visibleIngredients = useMemo(
    () => ingredients.filter((ingredient) => ingredient.category === category),
    [category],
  );
  const selected = selectedIds
    .map((id) => ingredients.find((ingredient) => ingredient.id === id))
    .filter((ingredient): ingredient is Ingredient => Boolean(ingredient));
  const currentSelectedCount = selected.filter(
    (ingredient) => ingredient.category === category,
  ).length;
  const isLastCategory = categoryIndex === ingredientCategories.length - 1;

  function toggleIngredient(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function continueFlow() {
    if (isLastCategory) {
      setFlow("optimizing");
      return;
    }

    setCategoryIndex((index) => index + 1);
  }

  function goBack() {
    if (categoryIndex === 0) return;
    setCategoryIndex((index) => index - 1);
  }

  function restart() {
    setSelectedIds([]);
    setCategoryIndex(0);
    setFlow("ingredients");
  }

  function finishOptimization() {
    if (planWeek && user) {
      try {
        const storageKey = `mealpush-week-plans:${user.id}`;
        const existingValue = window.localStorage.getItem(storageKey);
        const existingPlans = existingValue
          ? (JSON.parse(existingValue) as Record<string, { selectedIds: string[]; savedAt: string }>)
          : {};

        existingPlans[planWeek] = {
          selectedIds,
          savedAt: new Date().toISOString(),
        };
        window.localStorage.setItem(storageKey, JSON.stringify(existingPlans));
      } catch {
        // The result screen still works when browser storage is unavailable.
      }
    }

    setFlow("results");
  }

  if (flow === "optimizing") {
    return <OptimizationStep onDone={finishOptimization} />;
  }

  if (flow === "results") {
    return <ResultsStep selected={selected} onRestart={restart} />;
  }

  return (
    <main className="min-h-screen bg-[#f7faf5] px-5 py-6 sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col">
        <header className="flex items-center justify-between gap-5">
          <MealpushLogo />
          <p className="shrink-0 rounded-full border border-[#315d42]/10 bg-white px-4 py-2 text-xs font-extrabold text-[#5f8e4f]">
            {categoryIndex + 1} of {ingredientCategories.length}
          </p>
        </header>

        <nav aria-label="Ingredient selection progress" className="mt-7">
          <div className="grid grid-cols-5 gap-2">
            {ingredientCategories.map((item, index) => (
              <div key={item} className="min-w-0">
                <div
                  className={`h-1.5 rounded-full transition-colors duration-300 ${
                    index <= categoryIndex ? "bg-[#94bf4a]" : "bg-[#dfe8db]"
                  }`}
                />
                <p
                  className={`mt-2 truncate text-center text-[10px] font-extrabold uppercase tracking-[0.08em] sm:text-xs ${
                    index === categoryIndex ? "text-[#315d42]" : "text-[#93a296]"
                  }`}
                >
                  {item}
                </p>
              </div>
            ))}
          </div>
        </nav>

        <section key={category} className="plan-step-enter flex flex-1 flex-col">
          <div className="mx-auto mt-8 max-w-3xl text-center sm:mt-10">
            <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-[#5f8e4f]">
              {question.eyebrow}
            </p>
            <h1
              className="mt-3 text-4xl font-bold tracking-[-0.05em] text-[#193426] sm:text-6xl"
              style={{ fontFamily: "var(--font-baloo)" }}
            >
              {question.title}
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-[#68816d] sm:text-lg">
              {question.description}
            </p>
          </div>

          <div className="mx-auto mt-8 grid w-full max-w-5xl grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {visibleIngredients.map((ingredient) => (
              <IngredientCard
                key={ingredient.id}
                ingredient={ingredient}
                selected={selectedIds.includes(ingredient.id)}
                onToggle={() => toggleIngredient(ingredient.id)}
              />
            ))}
          </div>

          <div className="mx-auto mt-auto flex w-full max-w-5xl items-end justify-between gap-4 pb-2 pt-8">
            <button
              type="button"
              disabled={categoryIndex === 0}
              onClick={goBack}
              className="rounded-full border border-[#315d42]/15 bg-white px-5 py-3 text-sm font-extrabold text-[#315d42] transition hover:border-[#94bf4a] hover:bg-[#f9fcf6] disabled:cursor-not-allowed disabled:opacity-0"
            >
              Back
            </button>

            <div className="text-right">
              <p className="mb-2 text-sm font-bold text-[#78907c]">
                {currentSelectedCount} selected
              </p>
              <button
                type="button"
                onClick={continueFlow}
                className="rounded-xl bg-[#315d42] px-6 py-3.5 text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(49,93,66,0.18)] transition hover:-translate-y-0.5 hover:bg-[#254a34]"
              >
                {isLastCategory ? "Prepare my meal!" : "Next"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
