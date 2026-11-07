import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Images,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Copy,
  CloudUpload,
  Loader2,
  BadgeCheck,
  ArrowRight,
  Upload,
  Search,
  LayoutGrid,
  List,
  Trash2,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/fx/AppHeader";
import { ImageThumb } from "@/components/fx/ImageThumb";
import { HashText, countDiff } from "@/components/fx/HashText";
import { StatCard, EmptyState, SkeletonCard } from "@/components/fx/ui";
import { computeSHA256, formatBytes, fmtTs } from "@/lib/fx/format";
import { removeStoredImages } from "@/lib/fx/storage";
import { readImageDimensions, downloadBlob } from "@/lib/fx/images";
import DigitalFingerprintCard from "@/components/fx/DigitalFingerprintCard";
import { ScanFrame, StepProgress, FingerprintGen } from "@/components/fx/ScanFrame";
import ImageVersionsDialog from "@/components/fx/ImageVersionsDialog";
import VerificationTrendChart from "@/components/fx/VerificationTrendChart";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — ImageSeal" },
      {
        name: "description",
        content: "Upload images, generate SHA-256 hashes and verify originals.",
      },
      { property: "og:title", content: "Dashboard — ImageSeal" },
      {
        property: "og:description",
        content: "Upload images, generate SHA-256 hashes and verify originals.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
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
interface VerificationRow {
  id: string;
  original_name: string;
  original_sha256: string;
  original_image_id: string;
  check_name: string;
  check_storage_path: string;
  check_sha256: string;
  matched: boolean;
  created_at: string;
}

const ACCEPTED = ["image/jpeg", "image/png"];
const UPLOAD_STAGES = [
  "received",
  "binary",
  "fingerprint",
  "generated",
  "upload",
  "store",
] as const;
function stageOrder(stage: (typeof UPLOAD_STAGES)[number]) {
  return UPLOAD_STAGES.indexOf(stage);
}
function stageLabel(stage: (typeof UPLOAD_STAGES)[number]) {
  return {
    received: "Image received",
    binary: "Reading image binary data",
    fingerprint: "Generating SHA-256 fingerprint",
    generated: "Hash generated",
    upload: "Uploading image file",
    store: "Original image securely stored",
  }[stage];
}

async function fetchImages(): Promise<ImageRow[]> {
  const rows: ImageRow[] = [];
  for (let page = 0; ; page += 1) {
    const { data, error } = await supabase
      .from("images")
      .select("*")
      .order("created_at", { ascending: false })
      .range(page * 1000, page * 1000 + 999);
    if (error) throw error;
    rows.push(...((data ?? []) as ImageRow[]));
    if (!data || data.length < 1000) return rows;
  }
}

async function fetchVerifications(): Promise<VerificationRow[]> {
  const rows: VerificationRow[] = [];
  for (let page = 0; ; page += 1) {
    const { data, error } = await supabase
      .from("verifications")
      .select("*")
      .order("created_at", { ascending: false })
      .range(page * 1000, page * 1000 + 999);
    if (error) throw error;
    rows.push(...((data ?? []) as VerificationRow[]));
    if (!data || data.length < 1000) return rows;
  }
}

export function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const imagesQ = useQuery({ queryKey: ["images"], queryFn: fetchImages });
  const verificationsQ = useQuery({ queryKey: ["verifications"], queryFn: fetchVerifications });
  const duplicatesQ = useQuery({
    queryKey: ["duplicate-uploads"],
    queryFn: async () => {
      const rows: { id: string }[] = [];
      for (let page = 0; ; page += 1) {
        const { data, error } = await supabase
          .from("duplicate_uploads")
          .select("id")
          .range(page * 1000, page * 1000 + 999);
        if (error) throw error;
        rows.push(...(data ?? []));
        if (!data || data.length < 1000) return rows;
      }
    },
  });

  const [justUploaded, setJustUploaded] = useState<ImageRow | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploadHash, setUploadHash] = useState<string | null>(null);
  const [uploadStage, setUploadStage] = useState<
    "received" | "binary" | "fingerprint" | "generated" | "upload" | "store"
  >("received");
  const [processingPreview, setProcessingPreview] = useState<{
    name: string;
    url: string;
    size: number;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [previewImage, setPreviewImage] = useState<ImageRow | null>(null);
  const [versionImage, setVersionImage] = useState<ImageRow | null>(null);
  const [sortNewest, setSortNewest] = useState(true);

  const images = useMemo(() => imagesQ.data ?? [], [imagesQ.data]);
  const verifications = useMemo(() => verificationsQ.data ?? [], [verificationsQ.data]);
  const matched = verifications.filter((v) => v.matched).length;
  const modified = verifications.length - matched;

  const imageById = useMemo(() => new Map(images.map((i) => [i.id, i])), [images]);
  const featured = useMemo(() => justUploaded ?? images[0] ?? null, [justUploaded, images]);
  const visibleImages = useMemo(
    () =>
      images
        .filter((img) => img.name.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) =>
          sortNewest
            ? b.created_at.localeCompare(a.created_at)
            : a.created_at.localeCompare(b.created_at),
        ),
    [images, search, sortNewest],
  );
  useEffect(
    () => () => {
      if (processingPreview?.url) URL.revokeObjectURL(processingPreview.url);
    },
    [processingPreview?.url],
  );

  const stats = [
    {
      icon: <Images size={15} />,
      label: "Total Original Images Uploaded",
      value: images.length,
      accent: "blue",
    },
    {
      icon: <ShieldCheck size={15} />,
      label: "Total Verifications",
      value: verifications.length,
      accent: "cyan",
    },
    { icon: <CheckCircle size={15} />, label: "Hash Matched", value: matched, accent: "green" },
    {
      icon: <XCircle size={15} />,
      label: "Hash Not Matched",
      value: modified,
      accent: modified > 0 ? "red" : "slate",
    },
    {
      icon: <Images size={15} />,
      label: "Modified Images",
      value: new Set(verifications.filter((v) => !v.matched).map((v) => v.check_storage_path)).size,
      accent: modified > 0 ? "red" : "slate",
    },
    {
      icon: <Copy size={15} />,
      label: "Duplicate Uploads",
      value: duplicatesQ.isError ? "—" : (duplicatesQ.data?.length ?? 0),
      accent: "amber",
    },
  ];

  const handleFile = async (file: File | undefined) => {
    if (!file || busy) return;
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
    setUploadStage("received");
    setUploadHash(null);
    setProcessingPreview({ name: file.name, url: URL.createObjectURL(file), size: file.size });
    try {
      // Stages are emitted by the actual file read and Web Crypto operations.
      const hash = await computeSHA256(file, (stage) => setUploadStage(stage));
      setUploadHash(hash);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("You are signed out. Please sign in again.");

      const { data: duplicate, error: duplicateError } = await supabase
        .from("images")
        .select("*")
        .eq("sha256", hash)
        .maybeSingle();
      if (duplicateError) throw duplicateError;
      let existing = duplicate;
      if (!existing) {
        const { data: versionDuplicate, error: versionError } = await supabase
          .from("image_versions")
          .select("original_image_id")
          .eq("sha256", hash)
          .maybeSingle();
        if (versionError) throw versionError;
        if (versionDuplicate) {
          const { data: parent, error: parentError } = await supabase
            .from("images")
            .select("*")
            .eq("id", versionDuplicate.original_image_id)
            .maybeSingle();
          if (parentError) throw parentError;
          existing = parent;
        }
      }
      if (existing) {
        const { error } = await supabase.from("duplicate_uploads").insert({
          owner: userData.user.id,
          existing_image_id: existing.id,
          upload_name: file.name,
          sha256: hash,
        });
        if (error) throw error;
        setJustUploaded(existing as ImageRow);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["duplicate-uploads"] }),
          queryClient.invalidateQueries({ queryKey: ["images"] }),
        ]);
        toast.info(
          `Duplicate Image Detected. The existing original was uploaded ${fmtTs(existing.created_at)}.`,
        );
        return;
      }
      const dimensions = await readImageDimensions(file);

      // 2. Store the original image privately.
      const safe = file.name.replace(/[^\w.\-()]+/g, "_");
      const path = `${userData.user.id}/${crypto.randomUUID()}_${safe}`;
      setUploadStage("upload");
      const { error: upErr } = await supabase.storage
        .from("images")
        .upload(path, file, file.type ? { contentType: file.type } : undefined);
      if (upErr) throw upErr;
      setUploadStage("store");

      // 3. Record it with its hash and upload time.
      const { data: row, error: insErr } = await supabase
        .from("images")
        .insert({
          owner: userData.user.id,
          name: file.name,
          mime_type: file.type || null,
          file_size: file.size,
          storage_path: path,
          sha256: hash,
          ...dimensions,
        })
        .select()
        .single();
      if (insErr) {
        await supabase.storage.from("images").remove([path]);
        throw insErr;
      }

      setJustUploaded(row as ImageRow);
      await queryClient.invalidateQueries({ queryKey: ["images"] });
      toast.success("IMAGE SUCCESSFULLY SEALED");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setBusy(false);
      setProcessingPreview(null);
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

  const downloadOriginal = async (image: ImageRow) => {
    try {
      const { data, error } = await supabase.storage.from("images").download(image.storage_path);
      if (error) throw error;
      downloadBlob(data, image.name);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not download this image.");
    }
  };

  const deleteImage = async (img: ImageRow) => {
    if (
      !window.confirm(
        `Delete “${img.name}” and its verification history? This also removes its stored image files.`,
      )
    )
      return;
    try {
      const paths = [img.storage_path];
      const { data: versions, error: versionsError } = await supabase
        .from("image_versions")
        .select("storage_path")
        .eq("original_image_id", img.id);
      if (versionsError) throw versionsError;
      paths.push(...(versions ?? []).map((version) => version.storage_path));
      for (let page = 0; ; page += 1) {
        const { data: related, error: lookupError } = await supabase
          .from("verifications")
          .select("check_storage_path")
          .eq("original_image_id", img.id)
          .range(page * 1000, page * 1000 + 999);
        if (lookupError) throw lookupError;
        paths.push(...(related ?? []).map((row) => row.check_storage_path).filter(Boolean));
        if (!related || related.length < 1000) break;
      }
      await removeStoredImages(paths);
      const { error } = await supabase.from("images").delete().eq("id", img.id);
      if (error) throw error;
      if (justUploaded?.id === img.id) setJustUploaded(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["images"] }),
        queryClient.invalidateQueries({ queryKey: ["verifications"] }),
        queryClient.invalidateQueries({ queryKey: ["duplicate-uploads"] }),
      ]);
      toast.success("Original image and related verification history deleted.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete this image.");
    }
  };

  const deleteVerification = async (row: VerificationRow) => {
    if (!window.confirm(`Delete the verification record for “${row.check_name}”?`)) return;
    try {
      if (row.check_storage_path) {
        const { error } = await supabase.storage.from("images").remove([row.check_storage_path]);
        if (error) throw error;
      }
      const { error } = await supabase.from("verifications").delete().eq("id", row.id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["verifications"] });
      toast.success("Verification record deleted.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete this verification.");
    }
  };

  const clearHistory = async () => {
    if (
      !verifications.length ||
      !window.confirm(`Clear all ${verifications.length} verification records and uploaded copies?`)
    )
      return;
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Please sign in again.");
      const paths = verifications.map((v) => v.check_storage_path).filter(Boolean);
      if (paths.length) {
        const { error } = await supabase.storage.from("images").remove(paths);
        if (error) throw error;
      }
      const { error } = await supabase.from("verifications").delete().eq("owner", auth.user.id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["verifications"] });
      toast.success("Verification history cleared.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not clear history.");
    }
  };

  return (
    <div className="min-h-screen bg-surface-900">
      <AppHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Heading */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-extrabold text-slate-50 tracking-tight">
              Image Integrity Dashboard
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Upload an original image — its SHA-256 fingerprint is generated automatically and kept
              with it.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button className="btn-primary" onClick={() => inputRef.current?.click()}>
              <Upload size={14} /> Upload Image
            </button>
            <button
              className="btn-outline"
              onClick={() => navigate({ to: "/verify", search: { id: undefined } })}
            >
              <ShieldCheck size={14} /> Verify Image
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          {imagesQ.isLoading || verificationsQ.isLoading || duplicatesQ.isLoading
            ? Array(6)
                .fill(0)
                .map((_, i) => <SkeletonCard key={i} />)
            : stats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>

        <VerificationTrendChart records={verifications} />

        {/* Upload zone */}
        <div
          className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
            dragOver
              ? "border-accent/60 bg-accent/5"
              : "border-surface-400/30 bg-surface-800/40 hover:border-surface-400/50"
          }`}
          onClick={() => !busy && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
            className="hidden"
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          {busy ? (
            <div className="flex flex-col items-center gap-3 py-2">
              {processingPreview && (
                <ScanFrame src={processingPreview.url} alt={`Scanning ${processingPreview.name}`} />
              )}
              <FingerprintGen hash={uploadHash} />
              <StepProgress
                step={stageOrder(uploadStage) + 1}
                total={UPLOAD_STAGES.length}
                label="Sealing image"
              />
              <p className="text-xs font-semibold text-slate-300">{stageLabel(uploadStage)}</p>
              <div className="seal-sequence">
                {UPLOAD_STAGES.map((stage) => (
                  <span
                    key={stage}
                    className={
                      stage === uploadStage
                        ? "step-active"
                        : stageOrder(stage) < stageOrder(uploadStage)
                          ? "step-done"
                          : ""
                    }
                  >
                    {stageLabel(stage)}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 py-2">
              <div className="w-11 h-11 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-1">
                <CloudUpload size={20} className="text-accent" />
              </div>
              <p className="text-sm font-semibold text-slate-300">
                Drag & drop an image here, or click to browse
              </p>
              <p className="text-2xs text-slate-600">
                JPG, JPEG or PNG · up to 25 MB · SHA-256 generated automatically on upload
              </p>
            </div>
          )}
        </div>

        {/* Featured latest original */}
        {featured && (
          <div className="card overflow-hidden animate-in">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-400/20">
              <p className="card-title" id={`image-${featured.id}`}>
                {justUploaded ? "Just Uploaded — Original Image" : "Latest Original Image"}
                {justUploaded && <span className="badge-verified ml-2">New</span>}
              </p>
              {justUploaded && <span className="seal-success">IMAGE SUCCESSFULLY SEALED</span>}
            </div>
            <div className="grid md:grid-cols-2 gap-5 p-5">
              <ImageThumb
                path={featured.storage_path}
                alt={featured.name}
                className="w-full max-h-80 object-contain rounded-lg bg-black/30 border border-surface-400/20"
              />
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-slate-200 break-all">{featured.name}</p>
                  <p className="text-2xs text-slate-600 mt-1">
                    Uploaded {fmtTs(featured.created_at)} · {formatBytes(featured.file_size)}
                    {featured.mime_type ? ` · ${featured.mime_type}` : ""}
                  </p>
                </div>
                <div>
                  <p className="text-2xs text-slate-500 font-semibold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    SHA-256 Hash
                  </p>
                  <div className="relative">
                    <code className="hash-display block break-all">{featured.sha256}</code>
                    <button
                      className="absolute top-2 right-2 btn-icon bg-surface-700/80"
                      onClick={() => copyHash(featured.sha256)}
                      title="Copy hash"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                </div>
                <button
                  className="btn-primary w-full justify-center"
                  onClick={() => navigate({ to: "/verify", search: { id: featured.id } })}
                >
                  <ShieldCheck size={14} /> Verify This Image <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Gallery */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-400/20">
            <p className="card-title" id="original-images">
              Original Images
            </p>
            <div className="flex gap-2 items-center">
              <label className="gallery-search">
                <Search size={14} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search images"
                  aria-label="Search original images"
                />
              </label>
              <select
                className="gallery-sort"
                aria-label="Sort images by date"
                value={sortNewest ? "newest" : "oldest"}
                onChange={(e) => setSortNewest(e.target.value === "newest")}
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
              </select>
              <button className="btn-icon" title="Grid view" onClick={() => setViewMode("grid")}>
                <LayoutGrid size={15} />
              </button>
              <button className="btn-icon" title="List view" onClick={() => setViewMode("list")}>
                <List size={15} />
              </button>
            </div>
            <p className="text-2xs text-slate-600">{images.length} stored</p>
          </div>
          {imagesQ.isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
              {Array(3)
                .fill(0)
                .map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
            </div>
          ) : visibleImages.length === 0 ? (
            <EmptyState
              icon={Images}
              title="No original images yet"
              message="Upload your first image above — its SHA-256 hash is generated automatically and stored securely."
            />
          ) : (
            <div
              className={`${viewMode === "grid" ? "grid sm:grid-cols-2 lg:grid-cols-3" : "grid grid-cols-1"} gap-4 p-5`}
            >
              {visibleImages.map((img) => (
                <div
                  key={img.id}
                  className={`image-card ${viewMode === "list" ? "image-card-list" : ""}`}
                >
                  <ImageThumb
                    path={img.storage_path}
                    alt={img.name}
                    className="w-full h-40 object-cover bg-black/30"
                  />
                  <div className="p-3.5 space-y-2">
                    <div>
                      <p className="text-xs font-semibold text-slate-200 truncate">{img.name}</p>
                      <p className="text-2xs text-slate-600 mt-0.5">
                        {fmtTs(img.created_at)} · {formatBytes(img.file_size)}
                      </p>
                    </div>
                    <button
                      className="w-full text-left font-mono text-2xs text-accent/70 hover:text-accent transition-colors truncate"
                      title={`Copy full hash: ${img.sha256}`}
                      onClick={() => copyHash(img.sha256)}
                    >
                      <span className="inline-flex items-center gap-1">
                        <Copy size={9} className="shrink-0" />
                        {img.sha256.slice(0, 18)}…{img.sha256.slice(-10)}
                      </span>
                    </button>
                    <div className="flex gap-2">
                      <button
                        className="btn-outline flex-1 justify-center text-2xs py-1.5"
                        onClick={() => setPreviewImage(img)}
                      >
                        <Eye size={11} /> View
                      </button>
                      <button
                        className="btn-outline flex-1 justify-center text-2xs py-1.5"
                        onClick={() => navigate({ to: "/verify", search: { id: img.id } })}
                      >
                        <ShieldCheck size={11} /> Verify
                      </button>
                      <button
                        className="btn-outline delete-button justify-center text-2xs py-1.5"
                        title="Delete original"
                        onClick={() => deleteImage(img)}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                    <button
                      className="btn-ghost w-full justify-center text-2xs"
                      onClick={() => setVersionImage(img)}
                    >
                      Versions & compare
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      {previewImage && (
        <div
          className="preview-modal"
          role="dialog"
          aria-modal="true"
          aria-label={`Preview ${previewImage.name}`}
          onClick={() => setPreviewImage(null)}
        >
          <section className="preview-panel" onClick={(e) => e.stopPropagation()}>
            <button
              className="preview-close"
              aria-label="Close image preview"
              onClick={() => setPreviewImage(null)}
            >
              ×
            </button>
            <ImageThumb
              path={previewImage.storage_path}
              alt={previewImage.name}
              className="preview-full-image"
            />
            <div className="p-5 space-y-3">
              <div>
                <h2 className="card-title break-all">{previewImage.name}</h2>
                <p className="text-xs text-slate-500 mt-1">
                  {fmtTs(previewImage.created_at)} · {formatBytes(previewImage.file_size)}
                </p>
              </div>
              <code className="hash-display block break-all">{previewImage.sha256}</code>
              <button className="btn-outline" onClick={() => copyHash(previewImage.sha256)}>
                <Copy size={13} /> Copy hash
              </button>
            </div>
            <div className="p-5 pt-0">
              <DigitalFingerprintCard
                image={previewImage}
                onCopy={() => copyHash(previewImage.sha256)}
                onDownload={() => downloadOriginal(previewImage)}
              />
            </div>
          </section>
        </div>
      )}
      {versionImage && (
        <ImageVersionsDialog
          original={versionImage}
          onClose={() => setVersionImage(null)}
          onCopy={copyHash}
        />
      )}
    </div>
  );
}
