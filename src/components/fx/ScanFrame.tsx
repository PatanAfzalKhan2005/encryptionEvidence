import { useEffect, useRef, useState } from "react";

/**
 * Image with a glowing laser sweeping top → bottom and animated corner brackets.
 * The animation is pure CSS (transform/opacity only), so it stays on the GPU and
 * costs nothing while `active` is false.
 */
export function ScanFrame({
  src,
  alt,
  active = true,
  className = "",
}: {
  src: string;
  alt: string;
  active?: boolean;
  className?: string;
}) {
  return (
    <div className={`scan-frame ${active ? "is-scanning" : ""} ${className}`}>
      <img src={src} alt={alt} />
      {active && (
        <>
          <span className="scan-sweep" aria-hidden="true">
            <i />
          </span>
          <span className="scan-glow" aria-hidden="true" />
        </>
      )}
      <span className="scan-corner tl" aria-hidden="true" />
      <span className="scan-corner tr" aria-hidden="true" />
      <span className="scan-corner bl" aria-hidden="true" />
      <span className="scan-corner br" aria-hidden="true" />
    </div>
  );
}

/** Progress bar driven by real completed steps (never a timer). */
export function StepProgress({
  step,
  total,
  label,
}: {
  step: number;
  total: number;
  label: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round((step / total) * 100)));
  return (
    <div className="step-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={label}>
      <div className="step-progress-head">
        <span>{label}</span>
        <strong>{pct}%</strong>
      </div>
      <div className="step-progress-track">
        <span style={{ width: `${pct}%` }} />
      </div>
      <small>
        Step {Math.min(step, total)} of {total}
      </small>
    </div>
  );
}

const HEX = "0123456789abcdef";
const reduceMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * SHA-256 fingerprint animation. While the digest is being computed (`hash` empty)
 * the characters flicker; the moment the real digest exists they lock in from left
 * to right, and the indicator changes from "computing" to "generated".
 */
export function FingerprintGen({ hash, className = "" }: { hash?: string | null; className?: string }) {
  const [text, setText] = useState(() => "0".repeat(64));
  const [locked, setLocked] = useState(0);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    window.clearInterval(timer.current);
    if (hash) {
      if (reduceMotion()) {
        setText(hash);
        setLocked(64);
        return;
      }
      let n = 0;
      timer.current = window.setInterval(() => {
        n = Math.min(64, n + 4);
        setLocked(n);
        setText(
          hash.slice(0, n) +
            Array.from({ length: 64 - n }, () => HEX[Math.floor(Math.random() * 16)]).join(""),
        );
        if (n >= 64) window.clearInterval(timer.current);
      }, 28);
    } else {
      setLocked(0);
      if (reduceMotion()) return;
      timer.current = window.setInterval(() => {
        setText(Array.from({ length: 64 }, () => HEX[Math.floor(Math.random() * 16)]).join(""));
      }, 90);
    }
    return () => window.clearInterval(timer.current);
  }, [hash]);

  const done = !!hash && locked >= 64;
  return (
    <div className={`fp-gen ${done ? "is-done" : hash ? "is-locking" : "is-computing"} ${className}`}>
      <div className="fp-gen-head">
        <i aria-hidden="true" />
        <span>{done ? "SHA-256 generated" : hash ? "Locking fingerprint…" : "Computing SHA-256…"}</span>
      </div>
      <code aria-label={hash ? `SHA-256 ${hash}` : "SHA-256 being computed"}>
        {text.split("").map((c, i) => (
          <b key={i} className={i < locked ? "on" : ""}>
            {c}
          </b>
        ))}
      </code>
    </div>
  );
}
