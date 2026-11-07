/** Number of hex characters that differ between two hashes (positional). */
export function countDiff(a: string, b: string): number {
  const len = Math.max(a.length, b.length);
  let n = 0;
  for (let i = 0; i < len; i++) if (a[i]?.toLowerCase() !== b[i]?.toLowerCase()) n++;
  return n;
}

/**
 * Readable SHA-256 display. When `compareTo` is given and the hashes differ,
 * every differing character is highlighted so the mismatch is obvious.
 */
export function HashText({
  hash,
  compareTo,
  className = "hash-display",
}: {
  hash: string;
  compareTo?: string | undefined;
  className?: string;
}) {
  const differs = compareTo !== undefined && compareTo.toLowerCase() !== hash.toLowerCase();
  return (
    <code className={`block break-all ${className}`}>
      {differs
        ? hash.split("").map((ch, i) =>
            ch.toLowerCase() !== compareTo![i]?.toLowerCase() ? (
              <mark key={i} className="bg-red-500/35 text-red-100 rounded-[2px]">
                {ch}
              </mark>
            ) : (
              <span key={i}>{ch}</span>
            ),
          )
        : hash}
    </code>
  );
}
