import { useEffect, useRef, useState } from "react";
import { Check, Copy, Fingerprint, Lock, ScanLine, ShieldCheck } from "lucide-react";
import { computeSHA256 } from "@/lib/fx/format";

const HEX = "0123456789abcdef";
const DEMO_HASH = "e3b0c44298fc1c149afbf4c899";
const rnd = (n: number) => Array.from({ length: n }, () => HEX[Math.floor(Math.random() * 16)]).join("");
const reduce = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Crisp vector landscape (renders sharp at any resolution / DPR). */
function Landscape() {
  return (
    <svg viewBox="0 0 640 400" preserveAspectRatio="xMidYMid slice" className="lp-landscape" shapeRendering="geometricPrecision">
      <defs>
        <linearGradient id="lsSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a3a78" />
          <stop offset=".45" stopColor="#6f86d6" />
          <stop offset="1" stopColor="#cfe0ff" />
        </linearGradient>
        <linearGradient id="lsLake" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5f8fb8" />
          <stop offset="1" stopColor="#1b3a4f" />
        </linearGradient>
        <linearGradient id="lsSnow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#c9d6f2" />
        </linearGradient>
        <linearGradient id="lsRock" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5b6a8c" />
          <stop offset="1" stopColor="#2c3752" />
        </linearGradient>
      </defs>
      <rect width="640" height="400" fill="url(#lsSky)" />
      <circle cx="510" cy="86" r="30" fill="#fff6d8" opacity=".85" />
      <path d="M0 220 120 120l70 70 90-130 110 150 80-70 170 120v140H0Z" fill="url(#lsRock)" />
      <path d="m280 60 52 74-26-12-22 28-18-30-24 24Z M120 120l30 36-16-6-14 20-14-18-12 10Z M470 140l36 40-18-8-18 18-12-20Z" fill="url(#lsSnow)" />
      <path d="M0 238c60-30 120-24 190-6 90-26 150-24 230 2 80-22 150-10 220 14v152H0Z" fill="#1f5a45" />
      <path d="M0 262c80-14 150-8 230 8 100-18 190-14 410 6v124H0Z" fill="#173f36" />
      {Array.from({ length: 26 }, (_, i) => (
        <path key={i} d={`M${i * 25 + 6} 262 ${i * 25 + 14} 236 ${i * 25 + 22} 262Z`} fill="#0f2e2a" opacity=".9" />
      ))}
      <rect y="268" width="640" height="132" fill="url(#lsLake)" />
      <g opacity=".5" transform="translate(0 536) scale(1 -1)">
        <path d="M0 220 120 120l70 70 90-130 110 150 80-70 170 120v140H0Z" fill="#7f92c6" />
      </g>
      <rect y="268" width="640" height="132" fill="url(#lsLake)" opacity=".55" />
      <path d="M0 300h640M0 330h640M0 362h640" stroke="#ffffff" strokeOpacity=".12" strokeWidth="1.5" />
    </svg>
  );
}

function HashCard() {
  const [text, setText] = useState(DEMO_HASH);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let alive = true;
    let tick: number | undefined;
    let n = 0;
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const loop = async () => {
      while (alive) {
        setDone(false);
        if (!reduce()) tick = window.setInterval(() => setText(rnd(26)), 70);
        await wait(1400);
        let hash = "";
        try {
          hash = await computeSHA256(new Blob([`imageseal-sample-${n++}`]));
        } catch {
          /* Web Crypto unavailable on insecure origins — keep the computing state */
        }
        window.clearInterval(tick);
        if (!alive) return;
        if (hash) {
          setText(hash.slice(0, 26));
          setDone(true);
        }
        await wait(3600);
      }
    };
    loop();
    return () => {
      alive = false;
      window.clearInterval(tick);
    };
  }, []);

  return (
    <div className={`lp-hashcard ${done ? "is-done" : ""}`}>
      <div className="lp-hashcard-top">
        <div>
          <small>IMAGE FINGERPRINT</small>
          <strong>Original Image</strong>
        </div>
        <ScanLine size={22} />
      </div>
      <div className="lp-hashrow">
        <span>SHA-256</span>
        <code>{text}…</code>
        {done ? <Check size={16} /> : <Copy size={16} />}
      </div>
      <p>{done ? "Fingerprint generated and ready to store" : "Generating unique fingerprint…"}</p>
    </div>
  );
}

export default function LandingLaptop() {
  const ref = useRef<HTMLDivElement>(null);

  // Light parallax: pointer position drives two CSS variables (rAF throttled).
  useEffect(() => {
    const el = ref.current;
    if (!el || reduce()) return;
    let raf = 0;
    const move = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", String(((e.clientX - r.left) / r.width - 0.5).toFixed(3)));
        el.style.setProperty("--my", String(((e.clientY - r.top) / r.height - 0.5).toFixed(3)));
      });
    };
    el.addEventListener("pointermove", move);
    return () => {
      el.removeEventListener("pointermove", move);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="lp-stage" ref={ref} aria-hidden="true">
      <span className="lp-orbit" />
      <span className="lp-platform p1" />
      <span className="lp-platform p2" />

      <div className="lp-laptop">
        <div className="lp-screen">
          <div className="lp-photo">
            <Landscape />
            <span className="scan-sweep">
              <i />
            </span>
            <span className="lp-frame">
              <b className="c tl" />
              <b className="c tr" />
              <b className="c bl" />
              <b className="c br" />
              <span className="lp-lock">
                <Lock size={26} strokeWidth={2.2} />
              </span>
            </span>
          </div>
        </div>
        <div className="lp-deck">
          <span />
        </div>
      </div>

      <div className="lp-fpchip">
        <Fingerprint size={44} strokeWidth={1.6} />
      </div>
      <div className="lp-sealed">
        <Check size={18} strokeWidth={3} /> SEALED
      </div>
      <div className="lp-shield">
        <svg viewBox="0 0 120 140" role="img" aria-hidden="true">
          <defs>
            <linearGradient id="shG" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#d6f0b0" />
              <stop offset="1" stopColor="#6fc23a" />
            </linearGradient>
          </defs>
          <path d="M60 6c14 12 32 17 50 18v44c0 36-22 58-50 70C32 126 10 104 10 68V24c18-1 36-6 50-18Z" fill="#0f2a1c" stroke="url(#shG)" strokeWidth="6" strokeLinejoin="round" />
          <rect x="38" y="62" width="44" height="36" rx="8" fill="url(#shG)" />
          <path d="M46 62V52a14 14 0 0 1 28 0v10" fill="none" stroke="url(#shG)" strokeWidth="7" strokeLinecap="round" />
          <circle cx="60" cy="79" r="5" fill="#0f2a1c" />
        </svg>
      </div>

      <HashCard />
      <div className="lp-check">
        <ShieldCheck size={26} />
        <div>
          <strong>Integrity check</strong>
          <span>Ready when you are</span>
        </div>
      </div>
    </div>
  );
}
