export default function ImageSealLogo({
  size = 56,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`imageseal-logo ${className}`}
      style={{ width: size, height: size }}
      aria-label="ImageSeal scanning shield logo"
    >
      <svg viewBox="0 0 64 64" fill="none" role="img" aria-hidden="true">
        <rect x="7" y="8" width="37" height="37" rx="8" stroke="currentColor" strokeWidth="2.4" />
        <circle cx="18" cy="19" r="3" fill="currentColor" />
        <path
          d="m10 39 11-11 7 7 5-5 8 8"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M43 31c3 3 7 5 12 6v8c0 8-6 13-12 16-6-3-12-8-12-16v-8c5-1 9-3 12-6Z"
          fill="var(--brand-primary)"
          stroke="var(--brand-sage)"
          strokeWidth="2"
        />
        <path
          d="M41 47c0-3 2-5 4-5s4 2 4 5m-13 0c0-6 4-10 9-10s9 4 9 10m-14 3c1-3 3-5 5-5s4 2 5 5"
          stroke="var(--brand-sage)"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
        <path
          className="logo-scan"
          d="M9 27h35"
          stroke="var(--brand-sage)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
