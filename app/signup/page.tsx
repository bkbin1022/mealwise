"use client";

import Link from "next/link";
import { type FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import MealpushLogo from "@/components/shared/mealpush-logo";
import { createClient } from "@/lib/supabase/client";

function SignupIllustration() {
  return (
    <svg
      viewBox="0 0 760 760"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="max-h-[46vh] w-auto max-w-full"
    >
      <circle cx="610" cy="132" r="112" fill="#B7D686" opacity=".8" />
      <circle cx="112" cy="250" r="66" fill="#F1A55B" opacity=".72" />
      <ellipse cx="383" cy="705" rx="290" ry="32" fill="#315D42" opacity=".12" />
      <rect x="118" y="122" width="526" height="430" rx="44" fill="#FFFDF9" />
      <rect x="151" y="158" width="206" height="28" rx="14" fill="#315D42" opacity=".14" />
      <rect x="151" y="204" width="458" height="122" rx="26" fill="#E7F0DC" />
      <rect x="151" y="346" width="219" height="172" rx="26" fill="#FCEEDB" />
      <rect x="390" y="346" width="219" height="172" rx="26" fill="#315D42" />
      <circle cx="218" cy="264" r="34" fill="#F1A55B" />
      <circle cx="292" cy="264" r="34" fill="#6EAC72" />
      <circle cx="366" cy="264" r="34" fill="#F6D274" />
      <path d="M444 249C470 210 521 203 554 232C576 251 579 280 565 304H425C421 285 428 266 444 249Z" fill="#B7D686" />
      <circle cx="218" cy="420" r="35" fill="#E45E4D" />
      <path d="M260 465C282 424 333 416 361 452C342 489 292 499 260 465Z" fill="#6EAC72" />
      <path d="M435 419C467 376 531 375 563 419C538 462 465 466 435 419Z" fill="#F1A55B" />
      <circle cx="506" cy="451" r="24" fill="#F6D274" />
      <path d="M248 620C248 551 304 495 373 495H426C495 495 551 551 551 620V681H248V620Z" fill="#315D42" />
      <path d="M330 515C333 462 363 429 410 429C457 429 487 463 490 516L468 590H352L330 515Z" fill="#E7A77C" />
      <path d="M355 384C355 329 384 293 429 293C474 293 503 329 503 384V426C503 481 474 517 429 517C384 517 355 481 355 426V384Z" fill="#754731" />
      <path d="M350 381C346 320 382 274 434 274C480 274 514 308 513 360C489 338 460 328 428 329C398 330 371 349 350 381Z" fill="#243E2D" />
      <path d="M347 329C373 282 431 265 484 285C509 295 527 313 538 337L500 357C483 329 451 318 422 324C394 329 373 347 361 371L338 356L347 329Z" fill="#94BF4A" />
      <path d="M345 353C390 335 474 340 529 371C528 392 510 401 491 394C442 376 390 377 359 393C342 402 332 383 345 353Z" fill="#6F9F47" />
      <path d="M396 409C404 416 417 416 425 409" stroke="#F1B994" strokeWidth="7" strokeLinecap="round" />
      <path d="M450 409C458 416 471 416 479 409" stroke="#F1B994" strokeWidth="7" strokeLinecap="round" />
      <path d="M419 451C431 461 450 461 462 451" stroke="#3C2118" strokeWidth="7" strokeLinecap="round" />
      <path d="M365 517C393 540 462 544 489 515L507 611H345L365 517Z" fill="#F7FAF5" />
      <circle cx="577" cy="567" r="52" fill="#FFFDF9" />
      <path d="M553 567 570 584 602 548" stroke="#315D42" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 shrink-0">
      <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.5-.2-2.2H12v4.2h5.4a4.7 4.7 0 0 1-2 3.1V20h3.3c1.9-1.8 2.9-4.4 2.9-7.8Z" />
      <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.6c-.9.6-2.1 1-3.4 1a5.9 5.9 0 0 1-5.5-4.1H3.1v2.7A10.1 10.1 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.5 13.9A6 6 0 0 1 6.2 12c0-.7.1-1.3.3-1.9V7.4H3.1A10 10 0 0 0 2 12c0 1.6.4 3.2 1.1 4.6l3.4-2.7Z" />
      <path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.9 1.5l2.9-2.9A9.8 9.8 0 0 0 12 2a10.1 10.1 0 0 0-8.9 5.4l3.4 2.7A5.9 5.9 0 0 1 12 6Z" />
    </svg>
  );
}

type Feedback = { tone: "error" | "success"; text: string } | null;

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: sessionLoading } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(
    searchParams.get("error")
      ? { tone: "error", text: "Google sign-up could not be completed. Please try again." }
      : null,
  );

  useEffect(() => {
    if (!sessionLoading && user) router.replace("/dashboard");
  }, [router, sessionLoading, user]);

  async function signUpWithEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== confirmPassword) {
      setFeedback({ tone: "error", text: "Your passwords do not match." });
      return;
    }

    setLoading(true);
    setFeedback(null);
    const { data, error } = await createClient().auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard&failure=/signup`,
      },
    });

    if (error) {
      setFeedback({ tone: "error", text: error.message });
      setLoading(false);
      return;
    }

    if (data.session) {
      router.replace("/dashboard");
      router.refresh();
      return;
    }

    setFeedback({
      tone: "success",
      text: "Check your inbox to confirm your email. Your Mealpush account is almost ready!",
    });
    setLoading(false);
  }

  async function signUpWithGoogle() {
    setLoading(true);
    setFeedback(null);
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard&failure=/signup`,
      },
    });

    if (error) {
      setFeedback({ tone: "error", text: error.message });
      setLoading(false);
    }
  }

  if (sessionLoading || user) {
    return <main className="min-h-screen bg-[#f7faf5]" />;
  }

  return (
    <main className="auth-page-enter min-h-screen bg-[#f7faf5] p-3 sm:p-5">
      <div className="auth-shell-enter mx-auto grid min-h-[calc(100dvh-1.5rem)] max-w-[90rem] overflow-hidden rounded-[2rem] bg-white shadow-[0_24px_80px_rgba(49,93,66,0.12)] sm:min-h-[calc(100dvh-2.5rem)] lg:grid-cols-[3fr_2fr]">
        <section className="auth-visual-enter relative hidden min-h-[44rem] overflow-hidden bg-[#e7f0dc] p-8 lg:flex lg:flex-col xl:p-10">
          <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_50%_0%,#c9e1ae,transparent_70%)]" />
          <div className="relative z-10">
            <MealpushLogo className="text-3xl" />
          </div>
          <div className="relative z-10 mt-auto flex flex-1 flex-col items-center justify-center text-center">
            <SignupIllustration />
            <div className="-mt-3 max-w-md space-y-2">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5f8e4f]">A better week, on repeat</p>
              <h1 className="text-3xl font-bold tracking-[-0.045em] text-[#193426] xl:text-4xl">
                Make meal prep fit your life.
              </h1>
              <p className="text-sm leading-6 text-[#52705b]">
                Save your plans, revisit recipes, and build a routine that gets easier every week.
              </p>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-8 lg:p-8 xl:p-10">
          <div className="auth-form-enter w-full max-w-[23rem] py-4">
            <div className="mb-8 flex items-center justify-between lg:hidden">
              <MealpushLogo />
              <Link href="/auth" className="text-sm font-bold text-[#5f8e4f]">Sign in</Link>
            </div>

            <div className="mb-6 space-y-2">
              <p className="hidden text-sm font-semibold text-[#5f8e4f] lg:block">Start your free account</p>
              <h2 className="text-3xl font-bold tracking-[-0.045em] text-[#193426] xl:text-4xl">Plan once. Eat well all week.</h2>
              <p className="text-sm leading-6 text-[#68816d]">Create your account and keep every optimized meal plan in one place.</p>
            </div>

            <button
              disabled={loading}
              type="button"
              onClick={signUpWithGoogle}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#315d42]/15 bg-white px-5 py-3.5 text-sm font-bold text-[#315d42] transition hover:border-[#94bf4a] hover:bg-[#f7faf5] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <GoogleMark />
              {loading ? "Connecting..." : "Sign up with Google"}
            </button>

            <div className="my-5 flex items-center gap-3 text-xs font-semibold text-[#8a9b8d]">
              <span className="h-px flex-1 bg-[#315d42]/10" />
              or use email
              <span className="h-px flex-1 bg-[#315d42]/10" />
            </div>

            <form className="space-y-3.5" onSubmit={signUpWithEmail}>
              <label className="block space-y-1.5 text-sm font-bold text-[#315d42]">
                Name
                <input
                  required
                  autoComplete="name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-xl border border-[#315d42]/15 bg-[#f9fcf6] px-4 py-3 text-base font-medium text-[#193426] outline-none transition placeholder:text-[#97a89b] focus:border-[#5f8e4f] focus:ring-4 focus:ring-[#dceccb]"
                />
              </label>
              <label className="block space-y-1.5 text-sm font-bold text-[#315d42]">
                Email address
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-[#315d42]/15 bg-[#f9fcf6] px-4 py-3 text-base font-medium text-[#193426] outline-none transition placeholder:text-[#97a89b] focus:border-[#5f8e4f] focus:ring-4 focus:ring-[#dceccb]"
                />
              </label>
              <div className="grid gap-3.5 sm:grid-cols-2">
                <label className="block space-y-1.5 text-sm font-bold text-[#315d42]">
                  Password
                  <input
                    required
                    minLength={6}
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="6+ characters"
                    className="w-full rounded-xl border border-[#315d42]/15 bg-[#f9fcf6] px-4 py-3 text-base font-medium text-[#193426] outline-none transition placeholder:text-[#97a89b] focus:border-[#5f8e4f] focus:ring-4 focus:ring-[#dceccb]"
                  />
                </label>
                <label className="block space-y-1.5 text-sm font-bold text-[#315d42]">
                  Confirm
                  <input
                    required
                    minLength={6}
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Repeat password"
                    className="w-full rounded-xl border border-[#315d42]/15 bg-[#f9fcf6] px-4 py-3 text-base font-medium text-[#193426] outline-none transition placeholder:text-[#97a89b] focus:border-[#5f8e4f] focus:ring-4 focus:ring-[#dceccb]"
                  />
                </label>
              </div>
              <button
                disabled={loading}
                type="submit"
                className="w-full rounded-xl bg-[#315d42] px-5 py-3.5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(49,93,66,0.18)] transition hover:-translate-y-0.5 hover:bg-[#254a34] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating your account..." : "Create my account"}
              </button>
            </form>

            {feedback && (
              <p
                role={feedback.tone === "error" ? "alert" : "status"}
                className={`mt-5 rounded-xl px-4 py-3 text-center text-sm font-semibold ${
                  feedback.tone === "success"
                    ? "bg-[#e7f0dc] text-[#315d42]"
                    : "bg-[#fce8e4] text-[#9a3d2f]"
                }`}
              >
                {feedback.text}
              </p>
            )}

            <p className="mt-5 text-center text-sm text-[#718478]">
              Already have an account?{" "}
              <Link href="/auth" className="font-extrabold text-[#5f8e4f] hover:text-[#315d42]">Sign in</Link>
            </p>
            <p className="mt-4 text-center text-xs leading-5 text-[#839488]">
              By creating an account, you agree to Mealpush&apos;s Terms of Use and Privacy Policy.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#f7faf5]" />}>
      <SignupForm />
    </Suspense>
  );
}
