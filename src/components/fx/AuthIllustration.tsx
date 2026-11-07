import { Fingerprint, ShieldCheck } from "lucide-react";

/** Animated security hero: scanned image, glowing shield and fingerprint scanner. */
export default function AuthIllustration() {
  return (
    <div className="sg-illus" aria-hidden="true">
      <span className="sg-ring r1" />
      <span className="sg-ring r2" />
      <span className="sg-ring r3" />

      <div className="sg-photo">
        <svg viewBox="0 0 320 220" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="sgSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#dcdcff" />
              <stop offset="1" stopColor="#f3f8ea" />
            </linearGradient>
          </defs>
          <rect width="320" height="220" fill="url(#sgSky)" />
          <circle cx="238" cy="62" r="26" fill="#B7D894" opacity=".9" />
          <path d="M0 175 78 96l52 56 44-38 146 110H0Z" fill="#9FA0FF" opacity=".85" />
          <path d="M0 196 96 134l60 48 56-34 108 72H0Z" fill="#36415A" />
        </svg>
        <span className="scan-sweep">
          <i />
        </span>
        <span className="scan-corner tl" />
        <span className="scan-corner tr" />
        <span className="scan-corner bl" />
        <span className="scan-corner br" />
      </div>

      <div className="sg-shield">
        <ShieldCheck size={64} strokeWidth={1.5} />
        <Fingerprint className="sg-shield-fp" size={26} strokeWidth={1.6} />
      </div>

      <div className="sg-chip c1">
        <i /> SHA-256
      </div>
      <div className="sg-chip c2">
        <i /> Verified
      </div>
    </div>
  );
}
