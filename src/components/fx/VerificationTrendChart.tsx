import { useMemo } from "react";

interface VerificationRecord {
  matched: boolean;
  created_at: string;
}

export default function VerificationTrendChart({ records }: { records: VerificationRecord[] }) {
  const data = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setUTCHours(0, 0, 0, 0);
      date.setUTCDate(date.getUTCDate() - (6 - index));
      return {
        key: date.toISOString().slice(0, 10),
        label: date.toLocaleDateString(undefined, { weekday: "short", timeZone: "UTC" }),
        matched: 0,
        modified: 0,
      };
    });
    const byDay = new Map(days.map((day) => [day.key, day]));
    for (const record of records) {
      const day = byDay.get(new Date(record.created_at).toISOString().slice(0, 10));
      if (day) day[record.matched ? "matched" : "modified"] += 1;
    }
    return days;
  }, [records]);
  const max = Math.max(1, ...data.map((day) => day.matched + day.modified));
  const chartHeight = 132;
  const top = 8;
  const baseline = top + chartHeight;

  return (
    <section
      className="card analytics-chart-card"
      aria-label="Verification activity for the last seven days"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">ANALYTICS</p>
          <h2 className="card-title">Verification activity</h2>
          <p className="text-xs text-slate-500 mt-1">Actual checks recorded over the last 7 days</p>
        </div>
        <div className="chart-legend">
          <span>
            <i className="legend-match" />
            Matched
          </span>
          <span>
            <i className="legend-modified" />
            Not matched
          </span>
        </div>
      </div>
      <div className="analytics-chart">
        <svg
          viewBox="0 0 700 178"
          role="img"
          aria-label="Matched and unmatched verification counts by day"
        >
          {[0, 1, 2, 3].map((line) => {
            const y = top + (chartHeight / 3) * line;
            return <line key={line} x1="28" x2="692" y1={y} y2={y} className="chart-gridline" />;
          })}
          {data.map((day, index) => {
            const center = 75 + index * 92;
            const matchedHeight = (day.matched / max) * chartHeight;
            const modifiedHeight = (day.modified / max) * chartHeight;
            return (
              <g key={day.key}>
                <rect
                  x={center - 19}
                  y={baseline - matchedHeight}
                  width="16"
                  height={matchedHeight}
                  rx="4"
                  className="chart-bar-match"
                >
                  <title>{`${day.label}: ${day.matched} matched`}</title>
                </rect>
                <rect
                  x={center + 3}
                  y={baseline - modifiedHeight}
                  width="16"
                  height={modifiedHeight}
                  rx="4"
                  className="chart-bar-modified"
                >
                  <title>{`${day.label}: ${day.modified} not matched`}</title>
                </rect>
                <text x={center} y="166" textAnchor="middle" className="chart-day-label">
                  {day.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      {records.length === 0 && (
        <p className="text-xs text-slate-500">No verification activity recorded yet.</p>
      )}
    </section>
  );
}
