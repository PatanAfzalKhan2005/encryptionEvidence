import { useState } from "react";
import { Maximize2, X } from "lucide-react";
import { useImageUrl } from "@/components/fx/ImageThumb";

export default function ImageCompareSlider({
  originalPath,
  candidatePath,
  originalName,
  candidateName,
}: {
  originalPath: string;
  candidatePath: string;
  originalName: string;
  candidateName: string;
}) {
  const [position, setPosition] = useState(50);
  const [zoom, setZoom] = useState(false);
  const { data: original } = useImageUrl(originalPath);
  const { data: candidate } = useImageUrl(candidatePath);
  if (!original || !candidate) return <div className="skeleton h-72 rounded-xl" />;
  const frame = (large = false) => (
    <div className={`compare-frame ${large ? "compare-frame-large" : ""}`}>
      <img src={original} alt={`Original: ${originalName}`} className="compare-image" />
      <div className="compare-overlay" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        <img src={candidate} alt={`Uploaded: ${candidateName}`} className="compare-image" />
      </div>
      <span className="compare-label compare-label-left">Uploaded copy</span>
      <span className="compare-label compare-label-right">Original</span>
      <div className="compare-divider" style={{ left: `${position}%` }}>
        <span />
      </div>
      {!large && (
        <button
          className="compare-zoom"
          onClick={() => setZoom(true)}
          aria-label="Open comparison full screen"
        >
          <Maximize2 size={16} />
        </button>
      )}
    </div>
  );
  return (
    <section className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="card-title">Visual comparison</p>
          <p className="text-xs text-slate-500 mt-1">
            Drag the slider to inspect both images. This visual view is separate from exact hash
            verification.
          </p>
        </div>
      </div>
      {frame()}
      <input
        aria-label="Image comparison position"
        className="compare-range"
        type="range"
        min="0"
        max="100"
        value={position}
        onChange={(e) => setPosition(Number(e.target.value))}
      />
      {zoom && (
        <div
          className="compare-modal"
          role="dialog"
          aria-modal="true"
          onClick={() => setZoom(false)}
        >
          <button className="compare-close" onClick={() => setZoom(false)} aria-label="Close">
            <X />
          </button>
          <div onClick={(e) => e.stopPropagation()}>{frame(true)}</div>
        </div>
      )}
    </section>
  );
}
