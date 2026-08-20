"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function MealSelectionIllustration() {
  return (
    <svg viewBox="0 0 760 820" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="max-h-[43vh] w-auto max-w-full">
      <ellipse cx="388" cy="755" rx="279" ry="34" fill="#315D42" opacity=".12" />
      <circle cx="635" cy="150" r="126" fill="#B7D686" opacity=".75" />
      <circle cx="103" cy="276" r="72" fill="#F1A55B" opacity=".7" />
      <path d="M94 677C94 586 168 512 259 512H440C531 512 605 586 605 677V720H94V677Z" fill="#315D42" />
      <path d="M232 528C235 454 260 408 313 390H415C481 416 503 462 508 528L475 626H258L232 528Z" fill="#E4A476" />
      <path d="M279 438C279 376 314 335 366 335C418 335 452 376 452 438V478C452 539 416 580 366 580C316 580 279 539 279 478V438Z" fill="#71452F" />
      <path d="M290 426C286 362 320 310 377 310C424 310 459 344 460 398C438 375 405 364 371 364C341 364 313 386 290 426Z" fill="#243E2D" />
      <path d="M265 350C292 298 357 279 416 299C447 310 468 332 480 361L438 383C420 351 382 337 349 343C317 349 293 369 281 398L255 382L265 350Z" fill="#94BF4A" />
      <path d="M258 378C304 355 409 355 483 391C484 416 466 429 443 422C382 400 315 401 277 421C258 431 243 410 258 378Z" fill="#6F9F47" />
      <path d="M329 460C338 468 353 468 362 460" stroke="#F3C2A4" strokeWidth="7" strokeLinecap="round" />
      <path d="M392 460C401 468 416 468 425 460" stroke="#F3C2A4" strokeWidth="7" strokeLinecap="round" />
      <path d="M357 504C372 515 395 515 410 504" stroke="#3C2118" strokeWidth="7" strokeLinecap="round" />
      <path d="M294 567C326 590 405 598 448 565L470 645H269L294 567Z" fill="#F7FAF5" />
      <path d="M430 524C479 507 531 531 550 581L578 654L520 675L486 608C476 588 452 582 430 591L396 605L375 549L430 524Z" fill="#71452F" />
      <path d="M535 642C562 630 590 644 600 671L610 701L566 716L549 679L514 690L500 651L535 642Z" fill="#71452F" />
      <rect x="477" y="498" width="201" height="170" rx="28" fill="#FFFDF9" transform="rotate(8 477 498)" />
      <rect x="496" y="518" width="96" height="14" rx="7" fill="#315D42" opacity=".17" transform="rotate(8 496 518)" />
      <rect x="498" y="550" width="152" height="94" rx="19" fill="#E7F0DC" transform="rotate(8 498 550)" />
      <circle cx="547" cy="596" r="25" fill="#F1A55B" /><circle cx="591" cy="598" r="24" fill="#6EAC72" /><circle cx="620" cy="579" r="15" fill="#E45E4D" />
      <path d="M481 257C501 231 538 227 563 247C587 266 588 303 567 326C546 350 507 347 486 324C469 305 468 276 481 257Z" fill="#FCEEDB" />
      <path d="M516 272C525 258 544 255 558 267C572 279 571 299 559 311C546 324 526 322 514 309C504 297 505 282 516 272Z" fill="#F1A55B" />
      <path d="M534 269C535 258 542 250 552 246" stroke="#315D42" strokeWidth="6" strokeLinecap="round" />
      <path d="M144 454C144 421 171 395 204 395H232C265 395 292 421 292 454V496H144V454Z" fill="#FFFDF9" />
      <path d="M168 449C168 428 185 412 206 412C227 412 244 428 244 449C244 470 227 486 206 486C185 486 168 470 168 449Z" fill="#6EAC72" />
      <path d="M191 445L203 457L224 434" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(searchParams.get("error") ? "Google sign-in could not be completed. Please try again." : null);
  const [loading, setLoading] = useState(false);

  async function signInWithEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  async function signInWithGoogle() {
    setLoading(true);
    setMessage(null);
    const { error } = await createClient().auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback?next=/` } });
    if (error) {
      setMessage(error.message);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7faf5] p-3 sm:p-5">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-[90rem] overflow-hidden rounded-[2rem] bg-white shadow-[0_24px_80px_rgba(49,93,66,0.12)] sm:min-h-[calc(100vh-2.5rem)] lg:h-[calc(100vh-2.5rem)] lg:min-h-0 lg:grid-cols-[3fr_2fr]">
        <section className="relative hidden overflow-hidden bg-[#e7f0dc] p-8 lg:flex lg:flex-col xl:p-10">
          <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_50%_0%,#c9e1ae,transparent_70%)]" />
          <Link href="/" className="relative z-10 text-3xl font-bold leading-none tracking-tight" style={{ fontFamily: "var(--font-baloo)" }}><span className="text-[#174c32]">meal</span><span className="text-[#94bf4a]">wise</span></Link>
          <div className="relative z-10 mt-auto flex flex-1 flex-col items-center justify-center text-center">
            <MealSelectionIllustration />
            <div className="-mt-4 max-w-md space-y-2"><p className="text-xs font-bold tracking-[0.16em] text-[#5f8e4f] uppercase">Made for your rhythm</p><h1 className="text-3xl font-bold tracking-[-0.045em] text-[#193426] xl:text-4xl">Good meals, already figured out.</h1><p className="text-sm leading-6 text-[#52705b]">Choose what you love. Mealwise makes the rest of the week feel easy.</p></div>
          </div>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-8 lg:p-8 xl:p-10">
          <div className="w-full max-w-[22rem]">
            <div className="mb-8 flex items-center justify-between lg:hidden"><Link href="/" className="text-2xl font-bold leading-none tracking-tight" style={{ fontFamily: "var(--font-baloo)" }}><span className="text-[#174c32]">meal</span><span className="text-[#94bf4a]">wise</span></Link><span className="text-sm font-semibold text-[#52705b]">Welcome back</span></div>
            <div className="mb-7 space-y-2"><p className="hidden text-sm font-semibold text-[#5f8e4f] lg:block">Welcome back</p><h2 className="text-3xl font-bold tracking-[-0.045em] text-[#193426] xl:text-4xl">Your week starts here.</h2><p className="text-sm leading-6 text-[#68816d]">Sign in to pick up your next meal plan.</p></div>
            <form className="space-y-4" onSubmit={signInWithEmail}>
              <label className="block space-y-2 text-sm font-bold text-[#315d42]">Email address<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="w-full rounded-xl border border-[#315d42]/15 bg-[#f9fcf6] px-4 py-3 text-base font-medium text-[#193426] outline-none transition placeholder:text-[#97a89b] focus:border-[#5f8e4f] focus:ring-4 focus:ring-[#dceccb]" /></label>
              <label className="block space-y-2 text-sm font-bold text-[#315d42]">Password<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" className="w-full rounded-xl border border-[#315d42]/15 bg-[#f9fcf6] px-4 py-3 text-base font-medium text-[#193426] outline-none transition placeholder:text-[#97a89b] focus:border-[#5f8e4f] focus:ring-4 focus:ring-[#dceccb]" /></label>
              <div className="flex justify-end"><span className="text-sm font-bold text-[#5f8e4f]">Forgot password?</span></div>
              <button disabled={loading} type="submit" className="w-full rounded-xl bg-[#315d42] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#254a34] disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Signing in..." : "Sign in"}</button>
            </form>
            <div className="my-5 flex items-center gap-3 text-xs font-semibold text-[#8a9b8d]"><span className="h-px flex-1 bg-[#315d42]/10" />or continue with<span className="h-px flex-1 bg-[#315d42]/10" /></div>
            <button disabled={loading} type="button" onClick={signInWithGoogle} className="w-full rounded-xl border border-[#315d42]/15 bg-white px-5 py-3.5 text-sm font-bold text-[#315d42] transition hover:bg-[#f7faf5] disabled:cursor-not-allowed disabled:opacity-60">Continue with Google</button>
            {message && <p role="alert" className="mt-5 rounded-xl bg-[#fce8e4] px-4 py-3 text-center text-sm font-semibold text-[#9a3d2f]">{message}</p>}
            <p className="mt-6 text-center text-xs leading-5 text-[#839488]">By continuing, you agree to Mealwise&apos;s Terms of Use and Privacy Policy.</p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function AuthPage() {
  return <Suspense fallback={<main className="min-h-screen bg-[#f7faf5]" />}><AuthForm /></Suspense>;
}
