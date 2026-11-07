import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ShieldCheck,
  CloudUpload,
  BadgeCheck,
  XCircle,
  Copy,
  Images,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/fx/AppHeader";
import { ImageThumb } from "@/components/fx/ImageThumb";
import { EmptyState } from "@/components/fx/ui";
import { HashText, countDiff } from "@/components/fx/HashText";
import { ScanFrame, StepProgress, FingerprintGen } from "@/components/fx/ScanFrame";
import { computeSHA256, formatBytes, fmtTs } from "@/lib/fx/format";
import ImageCompareSlider from "@/components/fx/ImageCompareSlider";
import DifferenceHeatmap from "@/components/fx/DifferenceHeatmap";
import {
  analyzeImageBlobs,
  downloadBlob,
  readImageDimensions,
  type VisualAnalysis,
} from "@/lib/fx/images";
import { sha256Matches } from "@/lib/fx/verification";

export const Route = createFileRoute("/_authenticated/verify")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search["id"] === "string" ? search["id"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Verify Image — ImageSeal" },
      {
        name: "description",
        content: "Compare an uploaded image against its original using SHA-256 hashes.",
      },
      { property: "og:title", content: "Verify Image — ImageSeal" },
      {
        property: "og:description",
        content: "Compare an uploaded image against its original using SHA-256 hashes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VerifyPage,
});

interface ImageRow {
  id: string;
  name: string;
  mime_type: string | null;
  file_size: number;
  storage_path: string;
  sha256: string;
  created_at: string;
  width: number | null;
  height: number | null;
}

const ACCEPTED = ["image/jpeg", "image/png"];
const OPTIONAL_SCHEMA_CODES = new Set(["42703", "PGRST204"]);
const VERIFY_STEPS = [
  "Reading and hashing image",
  "Checking your session",
  "Comparing with the original",
  "Uploading the copy",
  "Recording the result",
] as const;

function isOptionalVerificationColumnError(error: { code?: string; message?: string }) {
  return (
    OPTIONAL_SCHEMA_CODES.has(error.code ?? "") &&
    /visual_similarity|difference_percent|analysis_summary|original_width|original_height|check_width|check_height/i.test(
      error.message ?? "",
    )
  );
}

function verificationErrorMessage(error: unknown) {
  const detail =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
        ? String(error.message)
        : String(error ?? "");
  const normalized = detail.toLowerCase();

  if (normalized.includes("bucket not found") || normalized.includes("bucket_id")) {
    return "Image storage is not configured. The private 'images' bucket is missing.";
  }
  if (
    normalized.includes("row-level security") ||
    normalized.includes("permission denied") ||
    normalized.includes("not authorized")
  ) {
    return "ImageSeal could not access or save this image for your account. Check your sign-in and storage permissions.";
  }
  if (
    normalized.includes("payload too large") ||
    normalized.includes("file size limit") ||
    normalized.includes("entity too large")
  ) {
    return "This image exceeds the storage limit. Choose a smaller image and retry.";
  }
  if (
    normalized.includes("failed to fetch") ||
    normalized.includes("network") ||
    normalized.includes("fetch failed")
  ) {
    return "ImageSeal could not reach Supabase. Check your connection and configured project URL, then retry.";
  }
  if (normalized.includes("invalid jwt") || normalized.includes("jwt expired")) {
    return "Your sign-in session has expired. Sign in again and retry the verification.";
  }
  if (normalized.includes("does not exist") && normalized.includes("verifications")) {
    return "The verification database table is missing. Apply the ImageSeal database migrations.";
  }
  if (normalized.includes("mime type") || normalized.includes("unsupported format")) {
    return "The selected file format is not supported. Choose a readable JPG or PNG image.";
  }
  return detail
    ? `Image verification could not be completed: ${detail}`
    : "Image verification failed without an error message. Check the browser console and Supabase project logs.";
}

function VerifyPage() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const imagesQ = useQuery({
    queryKey: ["images"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("images")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ImageRow[];
    },
  });
  const images = imagesQ.data ?? [];
  const original = id ? (images.find((i) => i.id === id) ?? null) : null;

  const [candidate, setCandidate] = useState<{
    name: string;
    hash: string;
    originalHash: string;
    path: string;
    size: number;
    similarity: number | null;
    differencePercent: number | null;
    createdAt: string;
    width: number;
    height: number;
  } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [verifyStep, setVerifyStep] = useState(0);
  const [verifyHash, setVerifyHash] = useState<string | null>(null);
  const [scanPreview, setScanPreview] = useState<{ url: string; name: string } | null>(null);

  // Switching to another original starts a fresh comparison.
  useEffect(() => setCandidate(null), [id]);

  const matched = candidate
    ? sha256Matches(candidate.hash, candidate.originalHash)
    : null;

  const verify = async (file: File | undefined) => {
    if (!file || !original || busy) return;
    const ok = ACCEPTED.includes(file.type) || /\.(jpe?g|png)$/i.test(file.name);
    if (!ok) {
      toast.error("Only JPG, JPEG and PNG images are supported.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      toast.error("Images up to 25 MB are supported.");
      return;
    }
    setBusy(true);
    setVerifyStep(1);
    setVerifyHash(null);
    const previewUrl = URL.createObjectURL(file);
    setScanPreview({ url: previewUrl, name: file.name });
    try {
      setVerifyStep(2);
      const { data: userData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!userData.user) throw new Error("You are signed out. Please sign in again.");

      const { data: originalRecord, error: originalError } = await supabase
        .from("images")
        .select("*")
        .eq("id", original.id)
        .eq("owner", userData.user.id)
        .maybeSingle();
      if (originalError) throw originalError;
      if (!originalRecord) {
        throw new Error("The selected original image was not found or is no longer accessible.");
      }

      setVerifyStep(1);
      const hash = await computeSHA256(file);
      setVerifyHash(hash);
      const dimensions = await readImageDimensions(file).catch(() => {
        throw new Error("The selected file is not a readable JPG or PNG image.");
      });

      let visual: VisualAnalysis | null = null;
      setVerifyStep(3);
      const { data: originalBlob, error: downloadError } = await supabase.storage
        .from("images")
        .download(originalRecord.storage_path);
      if (downloadError) throw downloadError;
      if (!sha256Matches(await computeSHA256(originalBlob), originalRecord.sha256)) {
        throw new Error(
          "The stored original image no longer matches its saved SHA-256 hash. Verification was stopped.",
        );
      }
      const isMatch = sha256Matches(hash, originalRecord.sha256);
      try {
        visual = await analyzeImageBlobs(originalBlob, file);
      } catch (analysisError) {
        console.warn("Visual similarity analysis unavailable", analysisError);
      }

      const safe = file.name.replace(/[^\w.\-()]+/g, "_");
      const path = `${userData.user.id}/${crypto.randomUUID()}_${safe}`;
      setVerifyStep(4);
      const contentType =
        file.type || (/\.(?:png)$/i.test(file.name) ? "image/png" : "image/jpeg");
      const { error: upErr } = await supabase.storage
        .from("images")
        .upload(path, file, { contentType, upsert: false });
      if (upErr) throw upErr;

      setVerifyStep(5);
      const verificationRecord = {
        owner: userData.user.id,
        original_image_id: originalRecord.id,
        original_name: originalRecord.name,
        original_sha256: originalRecord.sha256,
        check_name: file.name,
        check_mime_type: contentType,
        check_file_size: file.size,
        check_storage_path: path,
        check_sha256: hash,
        matched: isMatch,
      };
      let { data: savedVerification, error: insErr } = await supabase
        .from("verifications")
        .insert({
          ...verificationRecord,
          original_width: originalRecord.width,
          original_height: originalRecord.height,
          visual_similarity: visual?.similarity ?? null,
          difference_percent: visual?.differencePercent ?? null,
          analysis_summary: visual?.summary ?? null,
          check_width: dimensions.width,
          check_height: dimensions.height,
        })
        .select("created_at")
        .single();
      if (insErr && isOptionalVerificationColumnError(insErr)) {
        ({ data: savedVerification, error: insErr } = await supabase
          .from("verifications")
          .insert(verificationRecord)
          .select("created_at")
          .single());
      }
      if (insErr) {
        const { error: cleanupError } = await supabase.storage.from("images").remove([path]);
        if (cleanupError) {
          console.error("Could not remove the failed verification upload.", cleanupError);
        }
        throw insErr;
      }
      if (!savedVerification) {
        throw new Error("Supabase did not return the saved verification record.");
      }

      setCandidate({
        name: file.name,
        hash,
        originalHash: originalRecord.sha256,
        path,
        size: file.size,
        similarity: visual?.similarity ?? null,
        differencePercent: visual?.differencePercent ?? null,
        createdAt: savedVerification.created_at,
        width: dimensions.width,
        height: dimensions.height,
      });
      await queryClient.invalidateQueries({ queryKey: ["verifications"] });
      if (isMatch) toast.success("Verified — hash matched.");
      else toast.error("Hash mismatch — the image appears modified.");
    } catch (err) {
      console.error("Image verification failed.", err);
      toast.error(verificationErrorMessage(err));
    } finally {
      setBusy(false);
      setScanPreview(null);
      URL.revokeObjectURL(previewUrl);
    }
  };

  const copyHash = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      toast.success("Hash copied to clipboard.");
    } catch {
      toast.error("Could not copy the hash.");
    }
  };

  const downloadResult = () => {
    if (!candidate) return;
    const result = {
      original: {
        imageId: original.id,
        filename: original.name,
        sha256: candidate.originalHash,
      },
      uploaded: { filename: candidate.name, sha256: candidate.hash },
      sha256Status: matched ? "MATCHED" : "NOT MATCHED",
      visualSimilarityPercent: candidate.similarity,
      pixelDifferencePercent: candidate.differencePercent,
      verifiedAt: candidate.createdAt,
      note: "SHA-256 is the exact byte-integrity result. Visual similarity is approximate and may be affected by resizing, recompression, colour conversion, and metadata changes.",
    };
    downloadBlob(
      new Blob([JSON.stringify(result, null, 2)], { type: "application/json" }),
      `imageseal-verification-${candidate.createdAt.replace(/[:.]/g, "-")}.json`,
    );
  };

  /* ── No original selected → pick one ───────────────────── */
  if (!original) {
    return (
      <div className="min-h-screen bg-surface-900">
        <AppHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
          <div>
            <h1 className="text-xl font-extrabold text-slate-50 tracking-tight">Verify Image</h1>
            <p className="text-xs text-slate-500 mt-1">
              {imagesQ.isError
                ? verificationErrorMessage(imagesQ.error)
                : imagesQ.isLoading
                  ? "Loading your images..."
                  : images.length === 0
                    ? "Upload an original image on the dashboard first."
                    : "Select the original image to verify against."}
            </p>
          </div>
          {imagesQ.isLoading ? null : imagesQ.isError ? (
            <div className="card p-5 space-y-3" role="alert">
              <p className="text-sm text-red-300">{verificationErrorMessage(imagesQ.error)}</p>
              <button className="btn-outline text-xs" onClick={() => imagesQ.refetch()}>
                Retry loading images
              </button>
            </div>
          ) : images.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={Images}
                title="Nothing to verify yet"
                message="An original image must be uploaded before it can be verified."
                action={
                  <button
                    className="btn-primary text-xs"
                    onClick={() => navigate({ to: "/dashboard" })}
                  >
                    Go to Dashboard <ArrowRight size={13} />
                  </button>
                }
              />
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => navigate({ to: "/verify", search: { id: img.id } })}
                  className="rounded-xl bg-surface-700/40 border border-surface-400/30 overflow-hidden text-left hover:border-accent/40 transition-colors animate-in"
                >
                  <ImageThumb
                    path={img.storage_path}
                    alt={img.name}
                    className="w-full h-40 object-cover bg-black/30"
                  />
                  <div className="p-3.5">
                    <p className="text-xs font-semibold text-slate-200 truncate">{img.name}</p>
                    <p className="text-2xs text-slate-600 mt-0.5">{fmtTs(img.created_at)}</p>
                    <code className="block font-mono text-2xs text-accent/60 truncate mt-1">
                      {img.sha256}
                    </code>
                  </div>
                </button>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  /* ── Original selected → side-by-side comparison ───────── */
  return (
    <div className="min-h-screen bg-surface-900">
      <AppHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-extrabold text-slate-50 tracking-tight">Verify Image</h1>
            <p className="text-xs text-slate-500 mt-1">
              Original: <span className="text-slate-300 font-medium">{original.name}</span> ·
              uploaded {fmtTs(original.created_at)}
            </p>
          </div>
          <button
            className="btn-outline shrink-0 text-xs"
            onClick={() => navigate({ to: "/verify", search: { id: undefined } })}
          >
            <RefreshCw size={13} /> Change Original
          </button>
        </div>

        {/* Side-by-side */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Original column */}
          <div className="card p-5 space-y-3">
            <p className="section-label">Original Image</p>
            <ImageThumb
              path={original.storage_path}
              alt={original.name}
              className="w-full max-h-80 object-contain rounded-lg bg-black/30 border border-surface-400/20"
            />
            <div>
              <p className="text-xs font-semibold text-slate-200 break-all">{original.name}</p>
              <p className="text-2xs text-slate-600 mt-0.5">
                {fmtTs(original.created_at)} · {formatBytes(original.file_size)}
              </p>
            </div>
            <div className="relative">
              <p className="text-2xs text-slate-500 font-semibold uppercase tracking-widest mb-1">
                SHA-256 Hash
              </p>
              <HashText
                hash={candidate?.originalHash ?? original.sha256}
                compareTo={candidate?.hash}
              />
              <button
                className="absolute top-7 right-2 btn-icon bg-surface-700/80"
                onClick={() => copyHash(candidate?.originalHash ?? original.sha256)}
                title="Copy hash"
              >
                <Copy size={12} />
              </button>
            </div>
          </div>

          {/* Candidate column */}
          <div className="card p-5 space-y-3">
            <p className="section-label">Uploaded for Verification</p>
            {candidate ? (
              <>
                <ImageThumb
                  path={candidate.path}
                  alt={candidate.name}
                  className={`w-full max-h-80 object-contain rounded-lg bg-black/30 border ${
                    matched ? "border-forensic-green/30" : "border-red-500/30"
                  }`}
                />
                <div>
                  <p className="text-xs font-semibold text-slate-200 break-all">{candidate.name}</p>
                  <p className="text-2xs text-slate-600 mt-0.5">
                    Just uploaded · {formatBytes(candidate.size)} · {candidate.width}×
                    {candidate.height}px
                  </p>
                </div>
                <div className="relative">
                  <p className="text-2xs text-slate-500 font-semibold uppercase tracking-widest mb-1">
                    SHA-256 Hash
                  </p>
                  <HashText
                    hash={candidate.hash}
                    compareTo={candidate.originalHash}
                    className={matched ? "hash-display-verified" : "hash-display-tampered"}
                  />
                  <button
                    className="absolute top-7 right-2 btn-icon bg-surface-700/80"
                    onClick={() => copyHash(candidate.hash)}
                    title="Copy hash"
                  >
                    <Copy size={12} />
                  </button>
                </div>
              </>
            ) : (
              <div
                className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer flex-1 flex flex-col items-center justify-center min-h-[220px] ${
                  dragOver
                    ? "border-accent/60 bg-accent/5"
                    : "border-surface-400/30 hover:border-surface-400/50"
                }`}
                onClick={() => !busy && document.getElementById("verify-file-input")?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  verify(e.dataTransfer.files?.[0]);
                }}
              >
                <input
                  id="verify-file-input"
                  type="file"
                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                  className="hidden"
                  onChange={(e) => {
                    verify(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
                {busy ? (
                  <div className="flex flex-col items-center gap-3">
                    {scanPreview && (
                      <ScanFrame src={scanPreview.url} alt={`Scanning ${scanPreview.name}`} />
                    )}
                    <FingerprintGen hash={verifyHash} />
                    <StepProgress
                      step={verifyStep}
                      total={VERIFY_STEPS.length}
                      label={VERIFY_STEPS[Math.max(0, verifyStep - 1)] ?? "Verifying"}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-11 h-11 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-1">
                      <CloudUpload size={20} className="text-accent" />
                    </div>
                    <p className="text-sm font-semibold text-slate-300">
                      Upload the image to verify
                    </p>
                    <p className="text-2xs text-slate-600">
                      Drag & drop or click · JPG, JPEG or PNG · up to 25 MB
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Result */}
        {candidate && matched !== null && (
          <div
            className={`rounded-xl border p-5 result-reveal ${
              matched ? "bg-green-500/8 border-green-500/25" : "bg-red-500/8 border-red-500/25"
            }`}
          >
            <div className="flex items-center gap-2.5 mb-2">
              {matched ? (
                <BadgeCheck size={18} className="text-forensic-green" />
              ) : (
                <XCircle size={18} className="text-red-400" />
              )}
              <p
                className={`text-sm font-bold tracking-wide ${matched ? "text-forensic-green" : "text-red-400"}`}
              >
                {matched ? "IMAGE VERIFIED – HASH MATCHED" : "IMAGE MODIFIED – HASH NOT MATCHED"}
              </p>
            </div>
            <p
              className={`text-xs leading-relaxed ${matched ? "text-green-300/80" : "text-red-300/80"}`}
            >
              {matched
                ? "The uploaded image is identical to the original image. No modifications detected."
                : "The uploaded image does not match the original image. Possible modifications detected."}
            </p>
            <div className="verification-metrics">
              <span>
                SHA-256 status: <strong>{matched ? "MATCHED" : "NOT MATCHED"}</strong>
              </span>
              <span>
                Visual similarity:{" "}
                <strong>
                  {candidate.similarity === null
                    ? "Unavailable"
                    : `${candidate.similarity.toFixed(1)}% (SSIM)`}
                </strong>
              </span>
              <span>
                Pixel difference:{" "}
                <strong>
                  {candidate.differencePercent === null
                    ? "Unavailable"
                    : `${candidate.differencePercent.toFixed(1)}%`}
                </strong>
              </span>
              <span>
                Checked: <strong>{fmtTs(candidate.createdAt)}</strong>
              </span>
            </div>
            <p
              className={`text-2xs mt-3 font-semibold ${matched ? "text-green-300/70" : "text-red-300/90"}`}
            >
              {matched
                ? "Hash comparison: both SHA-256 values are identical (64 of 64 characters match)."
                : `Hash comparison: the SHA-256 values are different — ${countDiff(
                    candidate.originalHash,
                    candidate.hash,
                  )} of 64 characters differ (highlighted above).`}
            </p>
            {!matched && (
              <p className="text-2xs text-slate-600 mt-1">
                Even a change as small as a single pixel, word or line produces a completely
                different SHA-256 hash.
              </p>
            )}
            <div className="flex gap-2 mt-4 flex-wrap">
              <button
                className="btn-outline text-xs py-1.5"
                onClick={() => {
                  setCandidate(null);
                  toast.info("Upload another image to verify again.");
                }}
              >
                <CloudUpload size={13} /> Verify Another Image
              </button>
              <button
                className="btn-ghost text-xs py-1.5"
                onClick={() => navigate({ to: "/dashboard" })}
              >
                Back to Dashboard <ArrowRight size={12} />
              </button>
              <button className="btn-outline text-xs py-1.5" onClick={downloadResult}>
                Download result
              </button>
            </div>
          </div>
        )}
        {candidate && (
          <ImageCompareSlider
            originalPath={original.storage_path}
            candidatePath={candidate.path}
            originalName={original.name}
            candidateName={candidate.name}
          />
        )}
        {candidate && !matched && (
          <div className="analysis-note">
            <strong>Image modification analysis</strong>
            <p>
              Exact hash verification found different file bytes. Use the visual comparison slider
              above to inspect possible changed regions, added or missing content, and colour
              changes. This visual review is approximate and does not change the SHA-256 result.
            </p>
            <p>
              Text recognition is not configured in this browser build; image text changes should be
              reviewed visually.
            </p>
          </div>
        )}
        {candidate && !matched && (
          <DifferenceHeatmap originalPath={original.storage_path} candidatePath={candidate.path} />
        )}
      </main>
    </div>
  );
}
