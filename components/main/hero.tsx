import Link from "next/link";

type MealCardProps = { type: "plan" | "plate" | "prep" };

function MealCard({ type }: Readonly<MealCardProps>) {
  const backgrounds = { plan: "#E7F0DC", plate: "#FCEEDB", prep: "#DDEBDD" };

  return (
    <svg viewBox="0 0 320 390" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="size-full">
      <rect width="320" height="390" rx="28" fill={backgrounds[type]} />
      {type === "plan" && <>
        <circle cx="264" cy="50" r="84" fill="#C5DDB4" />
        {[78, 167].map((y) => <g key={y}><rect x="26" y={y} width="268" height="74" rx="18" fill="#FAFCF7" /><rect x="44" y={y + 20} width="95" height="12" rx="6" fill="#315D42" opacity=".2" /><rect x="44" y={y + 43} width="138" height="8" rx="4" fill="#315D42" opacity=".12" /></g>)}
        <circle cx="250" cy="204" r="24" fill="#D7E7C8" /><path d="M239 205L248 214L265 194" stroke="#315D42" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="26" y="256" width="268" height="108" rx="18" fill="#315D42" /><rect x="48" y="280" width="115" height="11" rx="5.5" fill="white" opacity=".85" /><path d="M236 326C257 326 274 309 274 288C253 288 236 305 236 326Z" fill="#B7D686" />
      </>}
      {type === "plate" && <>
        <circle cx="160" cy="197" r="118" fill="#FFF9F0" /><circle cx="160" cy="197" r="89" fill="#E7F0DC" />
        <path d="M128 130C151 123 180 132 192 156C204 181 196 213 172 228C147 242 115 232 102 207C89 181 102 142 128 130Z" fill="#F1A55B" /><circle cx="133" cy="169" r="23" fill="#FAE9B3" /><circle cx="174" cy="198" r="21" fill="#F6D274" />
        <path d="M132 221C146 200 174 195 194 209C203 215 207 225 207 236C180 247 151 244 132 221Z" fill="#6EAC72" /><circle cx="116" cy="257" r="11" fill="#E45E4D" /><circle cx="216" cy="160" r="11" fill="#E45E4D" />
        <rect x="39" y="309" width="242" height="49" rx="15" fill="#FFF9F0" /><rect x="57" y="326" width="81" height="10" rx="5" fill="#315D42" opacity=".25" />
      </>}
      {type === "prep" && <>
        <circle cx="280" cy="326" r="92" fill="#B7D686" /><rect x="35" y="61" width="250" height="245" rx="27" fill="#FFFDF9" /><rect x="55" y="83" width="210" height="80" rx="18" fill="#FCEEDB" />
        <path d="M76 121C76 100 94 91 112 99C123 104 129 115 126 128C123 141 110 149 96 146C84 143 76 133 76 121Z" fill="#E45E4D" /><path d="M145 105C161 89 188 94 198 115C206 132 194 150 176 150C154 150 138 126 145 105Z" fill="#F1A55B" /><path d="M212 99C236 99 249 121 239 141C229 160 201 158 194 137C187 117 198 99 212 99Z" fill="#6EAC72" />
        <rect x="55" y="178" width="101" height="104" rx="18" fill="#E7F0DC" /><rect x="165" y="178" width="100" height="104" rx="18" fill="#315D42" /><path d="M185 232C198 211 223 203 241 216C251 224 253 238 248 250C225 258 202 252 185 232Z" fill="#B7D686" />
      </>}
    </svg>
  );
}

const cards = [
  { type: "plan" as const, label: "AI meal plan", className: "-mr-9 z-10 w-[38%] -rotate-6 translate-y-6" },
  { type: "plate" as const, label: "Balanced meal", className: "z-20 w-[43%] -translate-y-3" },
  { type: "prep" as const, label: "Meal preparation", className: "-ml-9 z-10 w-[38%] rotate-6 translate-y-6" },
];

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-[#f7faf5] px-6 pb-20 pt-6 sm:pb-28 sm:pt-8">
      <div className="absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(circle_at_50%_5%,#dceccb,transparent_62%)]" />
      <div className="mx-auto max-w-6xl">
        <nav className="hero-reveal grid grid-cols-[1fr_auto_1fr] items-center gap-4" aria-label="Main navigation">
          <Link href="/" className="text-2xl font-bold leading-none tracking-tight" style={{ fontFamily: "var(--font-baloo)" }}><span className="text-[#174c32]">meal</span><span className="text-[#94bf4a]">wise</span></Link>
          <div className="hidden items-center gap-6 text-sm font-semibold text-[#315d42] sm:flex">
            <a href="#features" className="transition hover:text-[#174c32]">Features</a>
            <a href="#pricing" className="transition hover:text-[#174c32]">Pricing</a>
          </div>
          <div className="flex items-center justify-self-end gap-2 text-sm font-semibold text-[#315d42]">
            <Link href="/auth" className="rounded-full border border-[#315d42]/20 bg-[#e7f0dc] px-4 py-2 transition hover:bg-[#d9e8cc]">Sign in</Link>
            <a href="#start" className="rounded-full bg-[#315d42] px-4 py-2 text-white transition hover:bg-[#254a34]">Start now</a>
          </div>
        </nav>
        <div className="mt-20 flex flex-col items-center gap-10 text-center sm:mt-24">
          <div className="hero-reveal flex max-w-3xl flex-col items-center gap-6 [animation-delay:80ms]">
            <h1 className="text-balance font-serif text-5xl leading-[1.04] tracking-[-0.055em] text-[#193426] sm:text-6xl md:text-7xl">Pick ingredidents,<br /><span className="text-[#5f8e4f]">build your week.</span></h1>
            <p className="max-w-xl text-pretty text-base leading-7 text-[#52705b] sm:text-lg">Mealwise turns your preferences, goals, and schedule into a weekly menu and a smarter grocery list.</p>
          </div>
          <div id="start" className="hero-reveal flex flex-col items-center gap-4 [animation-delay:160ms]">
            <div className="flex flex-wrap justify-center gap-3"><a href="#plan" className="rounded-full bg-[#315d42] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#254a34]">Create my plan</a></div>
            <p className="text-xs font-medium text-[#68816d]">No nutrition expertise needed. Ready in three minutes.</p>
          </div>
          <div className="hero-fan flex w-full max-w-3xl items-center justify-center pt-3">{cards.map((card) => <div key={card.type} className={`aspect-[4/5] shrink-0 overflow-hidden rounded-[1.4rem] bg-white shadow-[0_24px_70px_rgba(49,93,66,0.18)] outline outline-1 outline-[#315d42]/10 ${card.className}`}><span className="sr-only">{card.label}</span><MealCard type={card.type} /></div>)}</div>
        </div>
      </div>
    </section>
  );
}
