export function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

/** Alias kept for components that render a persisted byte size. */
export const fmtBytesCompat = formatBytes;

/** "2026-11-03 15:51:02" style timestamp from a Date or ISO string. */
export function fmtTs(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "—";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ${p(
    date.getHours(),
  )}:${p(date.getMinutes())}:${p(date.getSeconds())}`;
}

export function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "—";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

export function timeAgo(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** Real SHA-256 via the Web Crypto API (client-side, https or localhost only). */
export async function computeSHA256(
  blob: Blob,
  onStage?: (stage: "binary" | "fingerprint" | "generated") => void,
): Promise<string> {
  onStage?.("binary");
  const buffer = await blob.arrayBuffer();
  onStage?.("fingerprint");
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  onStage?.("generated");
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
