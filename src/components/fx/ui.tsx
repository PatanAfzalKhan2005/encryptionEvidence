import { useEffect, useState } from "react";
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  ShieldAlert,
  Circle,
  ChevronLeft,
  ChevronRight,
  Inbox,
  ServerCrash,
  Loader2,
  X,
} from "lucide-react";

/* ── StatusBadge ─────────────────────────────────────────── */
const BADGE_CFG: Record<string, { cls: string; icon: React.ReactNode; label: string }> = {
  VERIFIED: { cls: "badge-verified", icon: <CheckCircle size={9} />, label: "Verified" },
  PENDING: { cls: "badge-pending", icon: <Clock size={9} />, label: "Pending" },
  FLAGGED: { cls: "badge-flagged", icon: <AlertTriangle size={9} />, label: "Flagged" },
  TAMPERING_DETECTED: { cls: "badge-flagged", icon: <ShieldAlert size={9} />, label: "Tampering" },
  ACTIVE: {
    cls: "badge-verified",
    icon: <Circle size={7} className="fill-current" />,
    label: "Active",
  },
  CLOSED: { cls: "badge-neutral", icon: <Circle size={7} />, label: "Closed" },
  INACTIVE: { cls: "badge-neutral", icon: <Circle size={7} />, label: "Inactive" },
  ENCRYPTED: { cls: "badge-info", icon: <CheckCircle size={9} />, label: "Encrypted" },
  HASHED: { cls: "badge-info", icon: <CheckCircle size={9} />, label: "Hashed" },
  CRITICAL: { cls: "badge-flagged", icon: <AlertTriangle size={9} />, label: "Critical" },
  HIGH: { cls: "badge-pending", icon: <AlertTriangle size={9} />, label: "High" },
  MEDIUM: { cls: "badge-info", icon: null, label: "Medium" },
  LOW: { cls: "badge-verified", icon: null, label: "Low" },
  SUCCESS: { cls: "badge-verified", icon: <CheckCircle size={9} />, label: "Success" },
  FAILED: { cls: "badge-flagged", icon: <AlertTriangle size={9} />, label: "Failed" },
  SYSTEM: { cls: "badge-neutral", icon: null, label: "System" },
  UNKNOWN: { cls: "badge-neutral", icon: null, label: "Unknown" },
  STORED: { cls: "badge-info", icon: <CheckCircle size={9} />, label: "Stored" },
  UPLOADED: { cls: "badge-info", icon: <CheckCircle size={9} />, label: "Uploaded" },
};

export function StatusBadge({ status }: { status?: string | null }) {
  const cfg = BADGE_CFG[status ?? ""] || { cls: "badge-neutral", icon: null, label: status ?? "—" };
  return (
    <span className={cfg.cls}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

/* ── StatCard ────────────────────────────────────────────── */
const ACCENT_MAP: Record<string, { icon: string; val: string; glow: string }> = {
  blue: {
    icon: "text-blue-400  bg-blue-500/10  border-blue-500/15",
    val: "text-blue-400",
    glow: "",
  },
  green: {
    icon: "text-green-400 bg-green-500/10 border-green-500/15",
    val: "text-green-400",
    glow: "",
  },
  amber: {
    icon: "text-amber-400 bg-amber-500/10 border-amber-500/15",
    val: "text-amber-400",
    glow: "",
  },
  red: {
    icon: "text-red-400   bg-red-500/10   border-red-500/15",
    val: "text-red-400",
    glow: "glow-red",
  },
  cyan: {
    icon: "text-cyan-400  bg-cyan-500/10  border-cyan-500/15",
    val: "text-cyan-400",
    glow: "",
  },
  purple: {
    icon: "text-purple-400 bg-purple-500/10 border-purple-500/15",
    val: "text-purple-400",
    glow: "",
  },
  slate: {
    icon: "text-slate-400 bg-surface-500/60 border-surface-300/40",
    val: "text-slate-300",
    glow: "",
  },
};

export function StatCard({
  icon,
  label,
  value,
  sub,
  accent = "blue",
  trend,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: string;
  accent?: string;
  trend?: number;
}) {
  const a = ACCENT_MAP[accent] ?? ACCENT_MAP["blue"]!;
  const [animatedValue, setAnimatedValue] = useState<number | React.ReactNode>(
    typeof value === "number" ? 0 : value,
  );
  useEffect(() => {
    if (typeof value !== "number") {
      setAnimatedValue(value);
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAnimatedValue(value);
      return;
    }
    const start = performance.now();
    const duration = 520;
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setAnimatedValue(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return (
    <div
      className={`card p-4 flex flex-col gap-3 transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 ${a.glow}`}
    >
      <div className="flex items-start justify-between">
        <div
          className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${a.icon}`}
        >
          {icon}
        </div>
        {trend !== undefined && (
          <span
            className={`text-2xs font-semibold ${trend >= 0 ? "text-forensic-green" : "text-forensic-red"}`}
          >
            {trend >= 0 ? "+" : ""}
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className={`text-2xl font-bold leading-none tracking-tight ${a.val}`}>{animatedValue}</p>
        <p className="text-xs font-medium text-slate-400 mt-1.5">{label}</p>
        {sub && <p className="text-2xs text-slate-600 mt-0.5 leading-relaxed">{sub}</p>}
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="card p-4 space-y-3">
      <div className="skeleton w-8 h-8 rounded-lg" />
      <div className="skeleton h-6 w-10 rounded" />
      <div className="skeleton h-3 w-20 rounded" />
    </div>
  );
}

/* ── Modal ───────────────────────────────────────────────── */
export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;
  const sizes = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative w-full ${sizes[size]} bg-surface-700/95 border border-surface-400/40 rounded-xl shadow-modal max-h-[90vh] flex flex-col backdrop-blur-xl scale-in`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-400/25 shrink-0">
          <h2 className="text-sm font-bold text-slate-100">{title}</h2>
          <button onClick={onClose} className="btn-icon" aria-label="Close">
            <X size={14} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-5">{children}</div>
      </div>
    </div>
  );
}

/* ── ConfirmationDialog ──────────────────────────────────── */
export function ConfirmationDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  danger = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-slate-400 leading-relaxed mb-5">{message}</p>
      <div className="flex justify-end gap-2">
        <button className="btn-outline" onClick={onClose}>
          Cancel
        </button>
        <button
          className={danger ? "btn-danger" : "btn-primary"}
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

/* ── EmptyState ──────────────────────────────────────────── */
export function EmptyState({
  icon: Icon = Inbox,
  title = "No data found",
  message,
  action,
}: {
  icon?: React.ElementType;
  title?: string;
  message?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-xl bg-surface-700/60 border border-surface-400/30 flex items-center justify-center mb-4">
        <Icon size={22} className="text-slate-600" />
      </div>
      <p className="text-sm font-semibold text-slate-400 mb-1">{title}</p>
      {message && <p className="text-xs text-slate-600 max-w-xs leading-relaxed mb-5">{message}</p>}
      {action}
    </div>
  );
}

/* ── LoadingState ────────────────────────────────────────── */
export function LoadingState({ rows = 5 }: { rows?: number }) {
  return (
    <div className="p-5 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3 items-center" style={{ opacity: 1 - i * 0.12 }}>
          <div className="skeleton h-3 w-24 rounded" />
          <div className="skeleton h-3 flex-1 rounded" />
          <div className="skeleton h-3 w-16 rounded" />
          <div className="skeleton h-5 w-14 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/* ── ErrorState ──────────────────────────────────────────── */
export function ErrorState({
  message = "Something went wrong.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
        <ServerCrash size={22} className="text-red-400" />
      </div>
      <p className="text-sm font-semibold text-slate-300 mb-1">Failed to Load</p>
      <p className="text-xs text-slate-500 max-w-xs leading-relaxed mb-5">{message}</p>
      {onRetry && (
        <button className="btn-outline text-xs" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
}

/* ── Pagination ──────────────────────────────────────────── */
export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1);
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-surface-400/25">
      <p className="text-2xs text-slate-600">
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <button
          className="btn-icon p-1.5"
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
          aria-label="Previous"
        >
          <ChevronLeft size={13} />
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`w-7 h-7 text-2xs rounded-lg font-semibold transition-all duration-150 ${
              p === page
                ? "bg-accent text-white shadow-sm"
                : "text-slate-500 hover:bg-surface-600/60 hover:text-slate-200"
            }`}
          >
            {p}
          </button>
        ))}
        <button
          className="btn-icon p-1.5"
          disabled={page === totalPages}
          onClick={() => onChange(page + 1)}
          aria-label="Next"
        >
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}

/* ── Tabs ────────────────────────────────────────────────── */
export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string; count?: number }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-0 border-b border-surface-400/25 mb-5">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-all duration-150 ${
            active === tab.id
              ? "border-accent text-accent"
              : "border-transparent text-slate-500 hover:text-slate-300 hover:border-surface-300/40"
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={`ml-1.5 px-1.5 py-0.5 rounded-full text-2xs ${
                active === tab.id ? "bg-accent/20 text-accent" : "bg-surface-500/60 text-slate-500"
              }`}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ── Spinner ─────────────────────────────────────────────── */
export function Spinner({ size = 18 }: { size?: number }) {
  return <Loader2 size={size} className="animate-spin text-accent" />;
}

/* ── UserAvatar ──────────────────────────────────────────── */
export function UserAvatar({
  name,
  size = "sm",
}: {
  name?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const initials =
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";
  const sz =
    size === "lg" ? "w-10 h-10 text-sm" : size === "md" ? "w-8 h-8 text-xs" : "w-7 h-7 text-xs";
  return (
    <div
      className={`${sz} rounded-lg bg-gradient-to-br from-accent/30 to-accent/10 border border-accent/20 flex items-center justify-center font-bold text-accent shrink-0`}
    >
      {initials}
    </div>
  );
}
