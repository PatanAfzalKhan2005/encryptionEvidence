import { Fingerprint, Lock, ScanLine } from "lucide-react";
import type { ReactNode } from "react";
import ImageSealLogo from "@/components/fx/ImageSealLogo";
import AuthIllustration from "@/components/fx/AuthIllustration";

const POINTS = [
  { icon: Fingerprint, text: "SHA-256 fingerprint for every image" },
  { icon: Lock, text: "Private storage under your account" },
  { icon: ScanLine, text: "Instant match or modified result" },
];

export default function AuthSplit({ children }: { children: ReactNode }) {
  return (
    <div className="sg-page">
      <span className="sg-blob b1" aria-hidden="true" />
      <span className="sg-blob b2" aria-hidden="true" />
      <section className="sg-left">
        <div className="sg-brand">
          <ImageSealLogo size={44} />
          <span>ImageSeal</span>
        </div>
        <div className="sg-hero-copy">
          <h1>
            Prove every image
            <br />
            is <em>still the original.</em>
          </h1>
          <p>Seal an image once, then check any copy against it with a cryptographic fingerprint.</p>
        </div>
        <AuthIllustration />
        <ul className="sg-points">
          {POINTS.map(({ icon: Icon, text }) => (
            <li key={text}>
              <Icon size={15} /> {text}
            </li>
          ))}
        </ul>
      </section>
      <main className="sg-right">
        <div className="sg-mobile-brand">
          <ImageSealLogo size={40} /> <strong>ImageSeal</strong>
        </div>
        <div className="sg-card">{children}</div>
      </main>
    </div>
  );
}
