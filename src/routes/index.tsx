import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Fingerprint,
  Image as ImageIcon,
  Layers,
  Lock,
  ScanFace,
  ShieldCheck,
} from "lucide-react";
import ImageSealLogo from "@/components/fx/ImageSealLogo";
import LandingLaptop from "@/components/fx/LandingLaptop";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ImageSeal — Know your image is exactly as sealed" },
      {
        name: "description",
        content: "Create a SHA-256 fingerprint for every original image and verify any copy in seconds.",
      },
    ],
  }),
  component: LandingPage,
});

const NAV = [
  { id: "home", label: "Home" },
  { id: "features", label: "Features" },
  { id: "how", label: "How It Works" },
  { id: "contact", label: "Contact" },
];

const FEATURES = [
  { icon: ImageIcon, tone: "lav", title: "Image Integrity", text: "Check exact file identity" },
  { icon: Fingerprint, tone: "lime", title: "SHA-256 Fingerprint", text: "Unique cryptographic digest" },
  { icon: Layers, tone: "lav", title: "Modification Detection", text: "Spot visual changes" },
  { icon: ScanFace, tone: "lime", title: "Visual Comparison", text: "Inspect images side by side" },
];

const STEPS = [
  { n: "01", title: "Upload original", text: "Store your image privately." },
  { n: "02", title: "Generate fingerprint", text: "Create its SHA-256 hash." },
  { n: "03", title: "Verify any copy", text: "Compare hashes and inspect." },
];

function LandingPage() {
  const navigate = useNavigate();
  const [active, setActive] = useState("home");

  // Highlight the nav item for the section in view, and fade sections in on scroll.
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      document.querySelectorAll(".lp-reveal").forEach((el) => el.classList.add("in"));
      return;
    }
    const spy = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-40% 0px -55% 0px" },
    );
    const reveal = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            reveal.unobserve(e.target);
          }
        }),
      { threshold: 0.15 },
    );
    NAV.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) spy.observe(el);
    });
    document.querySelectorAll(".lp-reveal").forEach((el) => reveal.observe(el));
    return () => {
      spy.disconnect();
      reveal.disconnect();
    };
  }, []);

  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const signIn = () => navigate({ to: "/auth" });

  return (
    <div className="lp">
      <span className="lp-glow g1" aria-hidden="true" />
      <span className="lp-glow g2" aria-hidden="true" />

      <header className="lp-nav">
        <button className="lp-logo" onClick={() => go("home")} aria-label="ImageSeal home">
          <ImageSealLogo size={46} />
          <span>
            Image<b>Seal</b>
          </span>
        </button>
        <nav aria-label="Main">
          {NAV.map(({ id, label }) => (
            <button key={id} className={active === id ? "on" : ""} onClick={() => go(id)}>
              {label}
            </button>
          ))}
        </nav>
        <span className="lp-badge">
          <ShieldCheck size={16} /> Secure Image Integrity
        </span>
        <button className="lp-btn ghost" onClick={signIn}>
          Sign In <ArrowRight size={17} />
        </button>
      </header>

      <section id="home" className="lp-hero">
        <div className="lp-copy">
          <p className="lp-eyebrow lp-rise" style={{ animationDelay: "0.05s" }}>
            <ShieldCheck size={18} /> IMAGE INTEGRITY, MADE SIMPLE
          </p>
          <h1 className="lp-rise" style={{ animationDelay: "0.15s" }}>
            Know your image
            <br />
            is <em>exactly as sealed.</em>
          </h1>
          <p className="lp-tag lp-rise" style={{ animationDelay: "0.3s" }}>
            Secure <i>·</i> Verify <i>·</i> Detect Modifications
          </p>
          <p className="lp-lead lp-rise" style={{ animationDelay: "0.4s" }}>
            Create a unique SHA-256 fingerprint for every original. Verify a copy in seconds and see a clear result,
            backed by your private image library.
          </p>
          <div className="lp-cta lp-rise" style={{ animationDelay: "0.5s" }}>
            <button className="lp-btn solid" onClick={signIn}>
              Sign Up <ArrowRight size={18} />
            </button>
            <button className="lp-btn ghost" onClick={signIn}>
              Sign In
            </button>
            <span className="lp-note">
              <Lock size={16} /> Private storage · Exact SHA-256 checks
            </span>
          </div>
          <ul className="lp-ticks lp-rise" style={{ animationDelay: "0.6s" }}>
            <li>
              <CheckCircle2 size={20} /> Byte-for-byte verification
            </li>
            <li>
              <CheckCircle2 size={20} /> Your images stay yours
            </li>
          </ul>
        </div>
        <LandingLaptop />
      </section>

      <section id="features" className="lp-features">
        {FEATURES.map(({ icon: Icon, tone, title, text }, i) => (
          <article key={title} className="lp-card lp-reveal" style={{ transitionDelay: `${i * 90}ms` }}>
            <span className={`lp-ico ${tone}`}>
              <Icon size={26} />
            </span>
            <div>
              <strong>{title}</strong>
              <span>{text}</span>
            </div>
          </article>
        ))}
      </section>

      <section id="how" className="lp-steps lp-reveal">
        {STEPS.map(({ n, title, text }, i) => (
          <div key={n} className="lp-step">
            <span className="lp-num">{n}</span>
            <div>
              <strong>{title}</strong>
              <span>{text}</span>
            </div>
            {i < STEPS.length - 1 && <hr aria-hidden="true" />}
          </div>
        ))}
      </section>

      <footer id="contact" className="lp-foot">
        <svg className="lp-wave" viewBox="0 0 1440 140" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="wvG" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#9fa0ff" />
              <stop offset=".6" stopColor="#b7d894" />
              <stop offset="1" stopColor="#9fa0ff" />
            </linearGradient>
          </defs>
          <path d="M0 90C240 20 420 20 720 80s520 40 720-20" fill="none" stroke="url(#wvG)" strokeWidth="2" />
          <path d="M0 110C260 50 460 60 760 100s480 20 680-30" fill="none" stroke="url(#wvG)" strokeWidth="1.2" opacity=".5" />
        </svg>
        <div className="lp-foot-row">
          <div className="lp-foot-brand">
            <ImageSealLogo size={38} />
            <b>ImageSeal</b>
            <span>Integrity you can check.</span>
          </div>
          <button onClick={signIn}>
            <em>Account help?</em> Sign in
          </button>
        </div>
      </footer>
    </div>
  );
}
