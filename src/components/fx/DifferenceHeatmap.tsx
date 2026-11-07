import { useEffect, useState } from "react";
import { createWorker } from "tesseract.js";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { analyzeImageBlobs, type VisualAnalysis } from "@/lib/fx/images";

export default function DifferenceHeatmap({
  originalPath,
  candidatePath,
}: {
  originalPath: string;
  candidatePath: string;
}) {
  const [analysis, setAnalysis] = useState<VisualAnalysis | null>(null);
  const [error, setError] = useState("");
  const [ocr, setOcr] = useState<{ original: string; candidate: string } | null>(null);
  const [ocrProgress, setOcrProgress] = useState("");
  useEffect(() => {
    let cancelled = false;
    let worker: Awaited<ReturnType<typeof createWorker>> | null = null;
    const analyze = async () => {
      try {
        const [left, right] = await Promise.all([
          supabase.storage.from("images").download(originalPath),
          supabase.storage.from("images").download(candidatePath),
        ]);
        if (left.error) throw left.error;
        if (right.error) throw right.error;
        const visual = await analyzeImageBlobs(left.data, right.data);
        if (!cancelled) setAnalysis(visual);
        setOcrProgress("Scanning text in the browser…");
        worker = await createWorker("eng", 1, {
          logger: (message) => {
            if (!cancelled && message.status === "recognizing text")
              setOcrProgress(`Reading visible text · ${Math.round(message.progress * 100)}%`);
          },
        });
        const [leftText, rightText] = await Promise.all([
          worker.recognize(left.data),
          worker.recognize(right.data),
        ]);
        if (!cancelled)
          setOcr({ original: leftText.data.text.trim(), candidate: rightText.data.text.trim() });
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Image analysis could not be completed.");
      } finally {
        if (worker) await worker.terminate();
        if (!cancelled) setOcrProgress("");
      }
    };
    void analyze();
    return () => {
      cancelled = true;
      if (worker) void worker.terminate();
    };
  }, [originalPath, candidatePath]);

  if (!analysis && !error)
    return (
      <div className="analysis-note flex items-center gap-2">
        <Loader2 size={15} className="animate-spin" />
        Aligning image regions and generating the visual analysis…
      </div>
    );
  const originalText = ocr?.original || "No readable text detected.";
  const candidateText = ocr?.candidate || "No readable text detected.";
  const textChanged = !!ocr && originalText !== candidateText;
  return (
    <section className="card p-4 space-y-3">
      <div className="analysis-note">
        <strong>Visual modification analysis · approximate</strong>
        <p>
          Visual Similarity:{" "}
          {analysis ? `${analysis.similarity.toFixed(1)}% (SSIM)` : "Unavailable"} · Pixel
          difference: {analysis ? `${analysis.differencePercent.toFixed(1)}%` : "Unavailable"}.
        </p>
        <p>{analysis?.summary ?? error}</p>
        <p>
          SHA-256 remains the exact integrity status. Visual changes may be caused by editing,
          resizing, recompression, colour conversion, or metadata changes; this analysis does not
          establish intent or authenticity.
        </p>
      </div>
      {analysis && (
        <div className="heatmap-layout">
          <div className="heatmap-stage">
            <img src={analysis.base} alt="Original image normalized to the comparison frame" />
            <img
              className="heatmap-overlay"
              src={analysis.heatmap}
              alt="Heatmap: yellow marks moderate colour differences and red marks larger differences"
            />
          </div>
          <div className="heatmap-legend">
            <span className="heat-low" /> Similar pixels <span className="heat-mid" /> Moderate
            difference <span className="heat-high" /> Larger difference
          </div>
          {analysis.bounds && (
            <p className="text-xs text-slate-500">
              Bounding region: x {analysis.bounds.x}px, y {analysis.bounds.y}px,{" "}
              {analysis.bounds.width}×{analysis.bounds.height}px in the normalized frame.
            </p>
          )}
        </div>
      )}
      <div className="ocr-result">
        <div className="flex items-center justify-between">
          <strong>OCR text comparison</strong>
          {ocrProgress && <span className="text-xs text-slate-500">{ocrProgress}</span>}
        </div>
        {ocr ? (
          <div className="ocr-columns">
            <div>
              <span>Original text</span>
              <pre>{originalText}</pre>
            </div>
            <div>
              <span>Uploaded image text</span>
              <pre className={textChanged ? "ocr-changed" : ""}>{candidateText}</pre>
            </div>
          </div>
        ) : (
          !error && (
            <p className="text-xs text-slate-500">
              OCR runs locally in your browser; images are not sent to an OCR service.
            </p>
          )
        )}
        {error && <p className="text-xs text-slate-500">OCR unavailable: {error}</p>}
      </div>
    </section>
  );
}
