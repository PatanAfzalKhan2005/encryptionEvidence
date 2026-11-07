import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Download, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { computeSHA256, formatBytes, fmtTs } from "@/lib/fx/format";
import { readImageDimensions, downloadBlob } from "@/lib/fx/images";
import { removeStoredImages } from "@/lib/fx/storage";
import { ImageThumb } from "@/components/fx/ImageThumb";
import ImageCompareSlider from "@/components/fx/ImageCompareSlider";
import DifferenceHeatmap from "@/components/fx/DifferenceHeatmap";

export interface BaseImage {
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
interface VersionRow extends Omit<BaseImage, "created_at"> {
  created_at: string;
  version_number: number;
  original_image_id: string;
}
const ACCEPTED = ["image/jpeg", "image/png"];
const NO_VERSIONS: VersionRow[] = [];

export default function ImageVersionsDialog({
  original,
  onClose,
  onCopy,
}: {
  original: BaseImage;
  onClose: () => void;
  onCopy: (hash: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<[string, string]>([original.id, ""]);
  const versionsQ = useQuery({
    queryKey: ["image-versions", original.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("image_versions")
        .select("*")
        .eq("original_image_id", original.id)
        .order("version_number", { ascending: true });
      if (error) throw error;
      return (data ?? []) as VersionRow[];
    },
  });
  const versions = versionsQ.data ?? NO_VERSIONS;
  const all = useMemo(
    () => [{ ...original, version_number: 1 }, ...versions],
    [original, versions],
  );
  const selectedItems = selected.map((id) => all.find((item) => item.id === id) ?? null);

  const uploadVersion = async (file?: File) => {
    if (!file || busy) return;
    if (
      !(ACCEPTED.includes(file.type) || /\.(jpe?g|png)$/i.test(file.name)) ||
      file.size > 25 * 1024 * 1024
    ) {
      toast.error("Choose a JPG or PNG image up to 25 MB.");
      return;
    }
    setBusy(true);
    try {
      const hash = await computeSHA256(file);
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Please sign in again.");
      const { data: existingOriginal } = await supabase
        .from("images")
        .select("id,name,created_at")
        .eq("sha256", hash)
        .maybeSingle();
      let duplicateId = existingOriginal?.id;
      if (!duplicateId) {
        const { data: existingVersion, error } = await supabase
          .from("image_versions")
          .select("original_image_id")
          .eq("sha256", hash)
          .maybeSingle();
        if (error) throw error;
        duplicateId = existingVersion?.original_image_id;
      }
      if (duplicateId) {
        const { error } = await supabase.from("duplicate_uploads").insert({
          owner: auth.user.id,
          existing_image_id: duplicateId,
          upload_name: file.name,
          sha256: hash,
        });
        if (error) throw error;
        await queryClient.invalidateQueries({ queryKey: ["duplicate-uploads"] });
        toast.info("Duplicate Image Detected. This version already exists in your account.");
        return;
      }
      const dimensions = await readImageDimensions(file);
      const nextVersion = Math.max(1, ...all.map((item) => item.version_number)) + 1;
      const safe = file.name.replace(/[^\w.\-()]+/g, "_");
      const path = `${auth.user.id}/${crypto.randomUUID()}_v${nextVersion}_${safe}`;
      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(path, file, { contentType: file.type });
      if (uploadError) throw uploadError;
      const { error } = await supabase.from("image_versions").insert({
        owner: auth.user.id,
        original_image_id: original.id,
        version_number: nextVersion,
        name: file.name,
        mime_type: file.type || null,
        file_size: file.size,
        storage_path: path,
        sha256: hash,
        ...dimensions,
      });
      if (error) {
        await removeStoredImages([path]);
        throw error;
      }
      await queryClient.invalidateQueries({ queryKey: ["image-versions", original.id] });
      await queryClient.invalidateQueries({ queryKey: ["images"] });
      toast.success(`Version ${nextVersion} stored securely.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save this version.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  const deleteVersion = async (version: VersionRow) => {
    if (!window.confirm(`Delete version ${version.version_number}, “${version.name}”?`)) return;
    try {
      await removeStoredImages([version.storage_path]);
      const { error } = await supabase.from("image_versions").delete().eq("id", version.id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["image-versions", original.id] });
      toast.success("Image version deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete this version.");
    }
  };

  const downloadVersion = async (version: BaseImage) => {
    try {
      const { data, error } = await supabase.storage.from("images").download(version.storage_path);
      if (error) throw error;
      downloadBlob(data, version.name);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Download failed.");
    }
  };

  return (
    <div
      className="preview-modal version-modal"
      role="dialog"
      aria-modal="true"
      aria-label={`Versions of ${original.name}`}
      onClick={onClose}
    >
      <section className="version-panel" onClick={(event) => event.stopPropagation()}>
        <header className="version-panel-header">
          <div>
            <p className="eyebrow">IMAGE VERSIONS</p>
            <h2>{original.name}</h2>
            <p>
              Each uploaded version is stored separately; the registered original remains unchanged.
            </p>
          </div>
          <button className="preview-close" onClick={onClose} aria-label="Close versions">
            <X />
          </button>
        </header>
        <div className="version-add">
          <input
            ref={input}
            className="hidden"
            type="file"
            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
            onChange={(event) => uploadVersion(event.target.files?.[0])}
          />
          <button className="btn-primary" disabled={busy} onClick={() => input.current?.click()}>
            <Plus size={14} />
            {busy ? "Processing version…" : "Upload new version"}
          </button>
        </div>
        {versionsQ.isLoading ? (
          <div className="skeleton h-32 rounded-xl" />
        ) : versionsQ.isError ? (
          <div className="analysis-note">
            Could not load image versions. Apply migration 0007 and try again.
          </div>
        ) : (
          <div className="version-timeline">
            {all.map((version) => (
              <article key={version.id} className="version-entry">
                <div className="version-number">
                  {version.version_number === 1 ? "O" : version.version_number}
                </div>
                <div className="version-thumb">
                  <ImageThumb path={version.storage_path} alt={version.name} />
                </div>
                <div className="version-details">
                  <strong>
                    {version.version_number === 1
                      ? "Original Version"
                      : `Version ${version.version_number}`}
                  </strong>
                  <span>
                    {version.name} · {formatBytes(version.file_size)} ·{" "}
                    {version.width && version.height ? `${version.width}×${version.height}` : ""}
                  </span>
                  <time>{fmtTs(version.created_at)}</time>
                  <code>{version.sha256}</code>
                </div>
                <div className="version-actions">
                  <button
                    className="btn-icon"
                    title="Copy hash"
                    onClick={() => onCopy(version.sha256)}
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    className="btn-icon"
                    title="Download version"
                    onClick={() => downloadVersion(version)}
                  >
                    <Download size={14} />
                  </button>
                  {version.version_number > 1 && (
                    <button
                      className="btn-icon delete-button"
                      title="Delete version"
                      onClick={() => deleteVersion(version as VersionRow)}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
        {all.length > 1 && (
          <section className="version-compare">
            <h3>Compare versions</h3>
            <div className="version-selectors">
              {selected.map((value, index) => (
                <label key={index}>
                  {index === 0 ? "First version" : "Second version"}
                  <select
                    value={value}
                    onChange={(event) =>
                      setSelected((previous) =>
                        index === 0
                          ? [event.target.value, previous[1]]
                          : [previous[0], event.target.value],
                      )
                    }
                  >
                    <option value="">Choose a version</option>
                    {all.map((version) => (
                      <option key={version.id} value={version.id}>
                        {version.version_number === 1
                          ? "Original"
                          : `Version ${version.version_number}`}{" "}
                        · {version.name}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            {selectedItems[0] &&
              selectedItems[1] &&
              selectedItems[0].id !== selectedItems[1].id && (
                <>
                  <ImageCompareSlider
                    originalPath={selectedItems[0].storage_path}
                    candidatePath={selectedItems[1].storage_path}
                    originalName={selectedItems[0].name}
                    candidateName={selectedItems[1].name}
                  />
                  <DifferenceHeatmap
                    originalPath={selectedItems[0].storage_path}
                    candidatePath={selectedItems[1].storage_path}
                  />
                </>
              )}
          </section>
        )}
      </section>
    </div>
  );
}
