"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import MealpushLogo from "@/components/shared/mealpush-logo";
import {
  currentRecipes,
  previousRecipes,
  recipesFromSelection,
  type Recipe,
  type StoredWeekPlans,
} from "@/lib/mealpush/recipes";

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

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function startOfWeek(date: Date) {
  return addDays(date, -date.getDay());
}

function getCalendarWeeks(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1, 12);
  const gridStart = startOfWeek(firstDay);

  return Array.from({ length: 6 }, (_, weekIndex) =>
    Array.from({ length: 7 }, (_, dayIndex) =>
      addDays(gridStart, weekIndex * 7 + dayIndex),
    ),
  );
}

function formatWeekRange(weekKey: string) {
  const start = parseLocalDate(weekKey);
  const end = addDays(start, 6);
  const startMonth = start.toLocaleDateString("en-US", { month: "short" });
  const endMonth = end.toLocaleDateString("en-US", { month: "short" });

  if (start.getMonth() === end.getMonth()) {
    return `${startMonth} ${start.getDate()}–${end.getDate()}`;
  }

  return `${startMonth} ${start.getDate()}–${endMonth} ${end.getDate()}`;
}

function RecipeArtwork({ recipe }: Readonly<{ recipe: Recipe }>) {
  const colors = {
    orange: { background: "#F6D7BE", food: "#E97945", accent: "#7DA55A" },
    green: { background: "#DDEBD5", food: "#E99270", accent: "#4E8A5D" },
    yellow: { background: "#F5E7B9", food: "#D89D43", accent: "#6E9A59" },
  }[recipe.tone];

  return (
    <svg viewBox="0 0 420 230" aria-hidden="true" className="size-full">
      <rect width="420" height="230" fill={colors.background} />
      <circle cx="360" cy="34" r="82" fill="white" opacity=".22" />
      <ellipse cx="210" cy="195" rx="138" ry="18" fill="#173C2A" opacity=".12" />
      <ellipse cx="210" cy="128" rx="128" ry="84" fill="#FFFDF8" />
      <ellipse cx="210" cy="128" rx="101" ry="64" fill="#EAF2E4" />
      <path d="M123 125C136 89 175 73 208 87C230 97 243 119 238 143C232 170 205 185 177 177C143 168 113 153 123 125Z" fill={colors.food} />
      <path d="M231 101C253 77 292 80 308 109C324 138 301 169 268 169C239 169 214 128 231 101Z" fill={colors.accent} />
      <circle cx="179" cy="119" r="15" fill="#F5CC68" />
      <circle cx="276" cy="135" r="12" fill="#F7E7A8" />
      <circle cx="215" cy="158" r="10" fill="#D95043" />
      <path d="M318 67C339 60 354 47 363 28" stroke="#315D42" strokeWidth="7" strokeLinecap="round" />
      <path d="M330 63C343 71 354 72 366 69" stroke="#315D42" strokeWidth="7" strokeLinecap="round" />
    </svg>
  );
}

function RecipeCard({
  recipe,
  selected,
  onSelect,
}: Readonly<{ recipe: Recipe; selected: boolean; onSelect: () => void }>) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`min-w-[17.5rem] snap-start overflow-hidden rounded-[1.75rem] border bg-white text-left transition duration-300 sm:min-w-0 ${
        selected
          ? "-translate-y-1 border-[#315d42] shadow-[0_20px_45px_rgba(23,60,42,0.15)]"
          : "border-[#315d42]/10 shadow-[0_12px_32px_rgba(23,60,42,0.07)] hover:-translate-y-1"
      }`}
    >
      <div className="aspect-[1.82/1] overflow-hidden"><RecipeArtwork recipe={recipe} /></div>
      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#6f8f63]">{recipe.servings} servings</p>
          {selected && <span className="rounded-full bg-[#e7f0dc] px-2.5 py-1 text-[10px] font-extrabold text-[#315d42]">Up first</span>}
        </div>
        <h3 className="mt-2 text-xl font-extrabold leading-tight text-[#172b20]">{recipe.title}</h3>
        <p className="mt-1 text-sm text-[#718076]">{recipe.subtitle}</p>
        <div className="mt-4 flex gap-4 border-t border-[#315d42]/10 pt-3 text-xs font-bold text-[#516659]">
          <span>{recipe.time} min</span><span>{recipe.calories} kcal</span><span>{recipe.protein}g protein</span>
        </div>
      </div>
    </button>
  );
}

function MonthCalendar({
  month,
  today,
  selectedWeekKey,
  hasPlan,
  onSelectWeek,
  onChangeMonth,
}: Readonly<{
  month: Date;
  today: Date;
  selectedWeekKey: string;
  hasPlan: (weekKey: string) => boolean;
  onSelectWeek: (weekKey: string) => void;
  onChangeMonth: (offset: number) => void;
}>) {
  const weeks = getCalendarWeeks(month);
  const monthName = month.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <section className="h-full rounded-[2rem] bg-white p-4 shadow-[0_14px_42px_rgba(23,60,42,0.07)] sm:p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#6f8f63]">Choose a week</p>
          <h2 className="mt-1 text-xl font-extrabold text-[#173c2a]">{monthName}</h2>
        </div>
        <div className="flex gap-2">
          {[-1, 1].map((offset) => (
            <button key={offset} type="button" onClick={() => onChangeMonth(offset)} aria-label={offset < 0 ? "Previous month" : "Next month"} className="flex size-10 items-center justify-center rounded-full border border-[#315d42]/12 bg-[#f7faf5] text-[#315d42] transition hover:border-[#94bf4a]">
              <svg viewBox="0 0 20 20" aria-hidden="true" className={`size-4 ${offset > 0 ? "rotate-180" : ""}`}><path d="m12.5 4.5-5 5.5 5 5.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-7 text-center text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#94a197]">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="mt-1.5 space-y-1">
        {weeks.map((week) => {
          const weekKey = formatDateKey(week[0]);
          const selected = weekKey === selectedWeekKey;
          const planned = hasPlan(weekKey);
          return (
            <button key={weekKey} type="button" onClick={() => onSelectWeek(weekKey)} aria-pressed={selected} className={`relative grid w-full grid-cols-7 rounded-xl px-1 py-1 transition ${selected ? "bg-[#173c2a] shadow-[0_8px_22px_rgba(23,60,42,0.18)]" : "hover:bg-[#edf3e9]"}`}>
              {week.map((date) => {
                const isToday = formatDateKey(date) === formatDateKey(today);
                const inMonth = date.getMonth() === month.getMonth();
                return (
                  <span key={formatDateKey(date)} className={`mx-auto flex size-7 items-center justify-center rounded-full text-[11px] font-extrabold sm:size-8 sm:text-xs ${isToday ? "bg-[#b7df76] text-[#173c2a]" : selected ? "text-white" : inMonth ? "text-[#53675a]" : "text-[#bcc5be]"}`}>{date.getDate()}</span>
                );
              })}
              {planned && <span className={`absolute right-1 top-1 size-2 rounded-full ${selected ? "bg-[#b7df76]" : "bg-[#94bf4a]"}`}><span className="sr-only">Plan ready</span></span>}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-[#315d42]/10 pt-3 text-xs">
        <p className="font-extrabold text-[#315d42]">{formatWeekRange(selectedWeekKey)}</p>
        <p className="hidden font-bold text-[#819086] sm:block">Green dot means plan ready</p>
      </div>
    </section>
  );
}

export default function MealDashboard({
  userId,
  userName,
  userEmail,
  avatarUrl,
  todayISO,
}: Readonly<{
  userId: string;
  userName: string;
  userEmail: string;
  avatarUrl?: string;
  todayISO: string;
}>) {
  const router = useRouter();
  const { signOut } = useAuth();
  const today = useMemo(() => parseLocalDate(todayISO), [todayISO]);
  const currentWeekKey = useMemo(() => formatDateKey(startOfWeek(today)), [today]);
  const previousWeekKey = useMemo(() => formatDateKey(addDays(parseLocalDate(currentWeekKey), -7)), [currentWeekKey]);
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1, 12));
  const [selectedWeekKey, setSelectedWeekKey] = useState(currentWeekKey);
  const [savedPlans, setSavedPlans] = useState<StoredWeekPlans>({});
  const [activeRecipeId, setActiveRecipeId] = useState(currentRecipes[0].id);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      try {
        const value = window.localStorage.getItem(`mealpush-week-plans:${userId}`);
        if (!cancelled && value) setSavedPlans(JSON.parse(value) as StoredWeekPlans);
      } catch {
        // Built-in sample weeks remain available if browser storage is unavailable.
      }
    });
    return () => { cancelled = true; };
  }, [userId]);

  const storedPlan = savedPlans[selectedWeekKey];
  const weekRecipes = storedPlan
    ? recipesFromSelection(storedPlan.selectedIds, selectedWeekKey)
    : selectedWeekKey === currentWeekKey
      ? currentRecipes
      : selectedWeekKey === previousWeekKey
        ? previousRecipes
        : null;
  const activeRecipe = weekRecipes?.find((recipe) => recipe.id === activeRecipeId) ?? weekRecipes?.[0];
  const totalTime = weekRecipes?.reduce((sum, recipe) => sum + recipe.time, 0) ?? 0;
  const totalServings = weekRecipes?.reduce((sum, recipe) => sum + recipe.servings, 0) ?? 0;
  const hasPlan = (weekKey: string) => weekKey === currentWeekKey || weekKey === previousWeekKey || Boolean(savedPlans[weekKey]);

  async function handleSignOut() {
    await signOut();
    router.replace("/");
    router.refresh();
  }

  function changeMonth(offset: number) {
    const nextMonth = new Date(month.getFullYear(), month.getMonth() + offset, 1, 12);
    setMonth(nextMonth);
    setSelectedWeekKey(formatDateKey(startOfWeek(nextMonth)));
  }

  return (
    <main className="min-h-screen bg-[#f4f5ef] px-4 pb-14 pt-5 text-[#172b20] sm:px-7 sm:pt-7">
      <div className="mx-auto max-w-6xl">
        <header className="relative z-30 flex items-center justify-between gap-5">
          <MealpushLogo />
          <div className="group relative">
            <button type="button" aria-label="Open profile menu" className="flex size-11 items-center justify-center overflow-hidden rounded-full bg-[#173c2a] text-sm font-extrabold uppercase text-white ring-4 ring-white transition group-hover:ring-[#dceccb] group-focus-within:ring-[#dceccb]">
              {avatarUrl ? <span aria-hidden="true" className="size-full bg-cover bg-center" style={{ backgroundImage: `url(${JSON.stringify(avatarUrl)})` }} /> : userName.slice(0, 1)}
            </button>
            <div className="invisible absolute right-0 top-full w-72 translate-y-1 pt-3 opacity-0 transition duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
              <div className="rounded-[1.5rem] border border-[#315d42]/10 bg-white p-4 shadow-[0_22px_60px_rgba(23,60,42,0.18)]">
                <div className="flex items-center gap-3 border-b border-[#315d42]/10 pb-4">
                  <div className="flex size-11 items-center justify-center overflow-hidden rounded-full bg-[#e7f0dc] font-extrabold uppercase text-[#315d42]">
                    {avatarUrl ? <span aria-hidden="true" className="size-full bg-cover bg-center" style={{ backgroundImage: `url(${JSON.stringify(avatarUrl)})` }} /> : userName.slice(0, 1)}
                  </div>
                  <div className="min-w-0"><p className="truncate font-extrabold text-[#173c2a]">{userName}</p><p className="truncate text-xs text-[#7c8c81]">{userEmail}</p></div>
                </div>
                <Link href="/plan" className="mt-3 block rounded-xl px-3 py-2.5 text-sm font-extrabold text-[#315d42] transition hover:bg-[#f1f5ee]">Create a new plan</Link>
                <button type="button" onClick={handleSignOut} className="mt-1 w-full rounded-xl px-3 py-2.5 text-left text-sm font-extrabold text-[#9a4b3d] transition hover:bg-[#fce8e4]">Sign out</button>
              </div>
            </div>
          </div>
        </header>

        <section className="mt-10 sm:mt-14">
          <p className="text-sm font-extrabold text-[#6f8f63]">Good to see you, {userName}.</p>
          <h1 className="mt-2 text-4xl font-bold tracking-[-0.05em] text-[#172b20] sm:text-6xl" style={{ fontFamily: "var(--font-baloo)" }}>Plan one week at a time.</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#6d7d72] sm:text-base">Choose a week from the calendar. Every week keeps its own recipes and prep session.</p>
        </section>

        <div className="mt-8 grid items-stretch gap-5 lg:grid-cols-2">
          <MonthCalendar month={month} today={today} selectedWeekKey={selectedWeekKey} hasPlan={hasPlan} onSelectWeek={setSelectedWeekKey} onChangeMonth={changeMonth} />

          {weekRecipes && activeRecipe ? (
            <section className="relative min-h-[25rem] overflow-hidden rounded-[2rem] bg-[#173c2a] px-5 py-7 text-white shadow-[0_20px_55px_rgba(23,60,42,0.2)] sm:px-8 sm:py-8">
              <div className="absolute -right-24 -top-28 size-72 rounded-full border-[44px] border-[#2d5a43] opacity-55" /><div className="absolute -bottom-24 -left-16 size-56 rounded-full bg-[#244d38]" />
              <div className="relative z-10 flex h-full flex-col items-center justify-center text-center">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#bfe48a]">{formatWeekRange(selectedWeekKey)} session</p>
                <h2 className="mt-1.5 text-2xl font-bold tracking-[-0.04em] sm:text-3xl" style={{ fontFamily: "var(--font-baloo)" }}>One prep. The whole week.</h2>
                <Link href={`/session?week=${selectedWeekKey}&start=${encodeURIComponent(activeRecipe.id)}`} className="mt-6 flex size-40 items-center justify-center rounded-full bg-[#b7df76] text-[#173c2a] shadow-[0_0_0_10px_rgba(183,223,118,0.13),0_18px_42px_rgba(4,20,11,0.28)] transition duration-300 hover:scale-[1.035] hover:bg-[#c6e990] active:scale-95 sm:size-44" aria-label="Start your meal preparation session">
                  <span><span className="block text-[10px] font-extrabold uppercase tracking-[0.18em] opacity-65">Tap to</span><span className="mt-1 block text-3xl font-bold tracking-[-0.04em] sm:text-4xl" style={{ fontFamily: "var(--font-baloo)" }}>Prepare</span></span>
                </Link>
                <p className="mt-4 max-w-sm text-xs leading-5 text-[#cbd9cf]">Starting with <span className="font-extrabold text-white">{activeRecipe.title}</span></p>
                <div className="mt-5 grid w-full max-w-md grid-cols-3 divide-x divide-white/15 rounded-xl bg-white/[0.07] px-2 py-3">
                  {[["Recipes", `${weekRecipes.length}`], ["Prep time", `${totalTime} min`], ["Meals", `${totalServings}`]].map(([label, value]) => <div key={label} className="px-1"><p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#a9bcb0]">{label}</p><p className="mt-1 text-xs font-extrabold text-white sm:text-sm">{value}</p></div>)}
                </div>
              </div>
            </section>
          ) : (
            <section className="relative min-h-[25rem] overflow-hidden rounded-[2rem] bg-[#e7f0dc] px-5 py-8 text-center">
              <div className="absolute -right-16 -top-20 size-56 rounded-full bg-[#cfe2bd]" /><div className="absolute -bottom-20 -left-12 size-48 rounded-full border-[32px] border-white/45" />
              <div className="relative z-10 flex h-full flex-col items-center justify-center">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#6f8f63]">{formatWeekRange(selectedWeekKey)}</p>
                <h2 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-[#173c2a] sm:text-3xl" style={{ fontFamily: "var(--font-baloo)" }}>This week is wide open.</h2>
                <p className="mt-2 max-w-sm text-xs leading-5 text-[#647a69]">Build a fresh prep lineup for this week.</p>
                <Link href={`/plan?week=${selectedWeekKey}`} className="mt-6 flex size-40 items-center justify-center rounded-full bg-[#173c2a] text-3xl font-bold text-white shadow-[0_18px_42px_rgba(23,60,42,0.24)] transition hover:scale-[1.035] hover:bg-[#244e39] active:scale-95 sm:size-44 sm:text-4xl" style={{ fontFamily: "var(--font-baloo)" }}>Plan!</Link>
              </div>
            </section>
          )}
        </div>

        {weekRecipes && activeRecipe && (
          <section className="mt-10">
            <div className="flex items-end justify-between gap-4">
              <div><p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#6f8f63]">{formatWeekRange(selectedWeekKey)}</p><h2 className="mt-1 text-2xl font-extrabold tracking-[-0.03em] text-[#172b20]">Your prep lineup</h2></div>
              <Link href={`/plan?week=${selectedWeekKey}`} className="text-xs font-extrabold text-[#5f8e4f] hover:text-[#315d42]">Rebuild this plan</Link>
            </div>
            <div className="dashboard-scrollbar mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-6 sm:grid sm:grid-cols-3 sm:overflow-visible">
              {weekRecipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} selected={activeRecipe.id === recipe.id} onSelect={() => setActiveRecipeId(recipe.id)} />)}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
