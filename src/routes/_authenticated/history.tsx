import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { BadgeCheck, Trash2, XCircle, History as HistoryIcon, Trash, Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/fx/AppHeader";
import { ImageThumb } from "@/components/fx/ImageThumb";
import { EmptyState } from "@/components/fx/ui";
import { HashText, countDiff } from "@/components/fx/HashText";
import { fmtTs } from "@/lib/fx/format";
import { removeStoredImages } from "@/lib/fx/storage";
import { downloadBlob } from "@/lib/fx/images";

export const Route = createFileRoute("/_authenticated/history")({ component: HistoryPage });

interface HistoryRow {
  id: string;
  original_name: string;
  original_sha256: string;
  original_image_id: string;
  check_name: string;
  check_storage_path: string;
  check_sha256: string;
  matched: boolean;
  created_at: string;
  visual_similarity: number | null;
  difference_percent: number | null;
  analysis_summary: string | null;
}

function HistoryPage() {
  const queryClient = useQueryClient();
  const historyQ = useQuery({
    queryKey: ["verifications"],
    queryFn: async () => {
      const rows: HistoryRow[] = [];
      for (let page = 0; ; page += 1) {
        const { data, error } = await supabase
          .from("verifications")
          .select("*")
          .order("created_at", { ascending: false })
          .range(page * 1000, page * 1000 + 999);
        if (error) throw error;
        rows.push(...((data ?? []) as HistoryRow[]));
        if (!data || data.length < 1000) return rows;
      }
    },
  });
  const imagesQ = useQuery({
    queryKey: ["images"],
    queryFn: async () => {
      const rows: { id: string; storage_path: string }[] = [];
      for (let page = 0; ; page += 1) {
        const { data, error } = await supabase
          .from("images")
          .select("id,storage_path")
          .range(page * 1000, page * 1000 + 999);
        if (error) throw error;
        rows.push(...(data ?? []));
        if (!data || data.length < 1000) return rows;
      }
    },
  });
  const imagePaths = useMemo(
    () => new Map((imagesQ.data ?? []).map((image) => [image.id, image.storage_path])),
    [imagesQ.data],
  );
  const rows = historyQ.data ?? [];
  const downloadPath = async (path: string, name: string) => {
    try {
      const { data, error } = await supabase.storage.from("images").download(path);
      if (error) throw error;
      downloadBlob(data, name);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Download failed.");
    }
  };

  const deleteRow = async (row: HistoryRow) => {
    if (!window.confirm(`Delete verification for “${row.check_name}”?`)) return;
    try {
      if (row.check_storage_path) {
        await removeStoredImages([row.check_storage_path]);
      }
      const { error } = await supabase.from("verifications").delete().eq("id", row.id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["verifications"] });
      toast.success("Verification record deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete this record.");
    }
  };

  const clearHistory = async () => {
    if (!rows.length || !window.confirm("Clear all verification records and uploaded copies?"))
      return;
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Please sign in again.");
      const paths: string[] = [];
      for (let page = 0; ; page += 1) {
        const { data, error } = await supabase
          .from("verifications")
          .select("check_storage_path")
          .eq("owner", auth.user.id)
          .range(page * 1000, page * 1000 + 999);
        if (error) throw error;
        paths.push(...(data ?? []).map((row) => row.check_storage_path).filter(Boolean));
        if (!data || data.length < 1000) break;
      }
      await removeStoredImages(paths);
      const { error } = await supabase.from("verifications").delete().eq("owner", auth.user.id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["verifications"] });
      toast.success("Verification history cleared.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not clear history.");
    }
  };

  return (
    <div className="min-h-screen bg-surface-900">
      <AppHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="eyebrow">ACTIVITY</p>
            <h1 className="text-2xl font-bold text-slate-50">Verification History</h1>
            <p className="text-sm text-slate-500 mt-1">
              Your exact SHA-256 verification records, newest first.
            </p>
          </div>
          {rows.length > 0 && (
            <button className="btn-outline delete-button" onClick={clearHistory}>
              <Trash size={14} /> Clear history
            </button>
          )}
        </div>
        {historyQ.isLoading ? (
          <div className="skeleton h-64 rounded-xl" />
        ) : historyQ.isError ? (
          <div className="analysis-note">
            Could not load verification history. Refresh to try again.
          </div>
        ) : rows.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={HistoryIcon}
              title="No verification history"
              message="Completed image checks will appear here."
            />
          </div>
        ) : (
          <div className="history-list">
            {rows.map((row) => {
              const diff = countDiff(row.original_sha256, row.check_sha256);
              return (
                <article key={row.id} className="card p-5 space-y-4 animate-in">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      {row.matched ? (
                        <span className="badge-verified">
                          <BadgeCheck size={11} /> IMAGE VERIFIED – HASH MATCHED
                        </span>
                      ) : (
                        <span className="badge-flagged">
                          <XCircle size={11} /> IMAGE MODIFIED – HASH NOT MATCHED
                        </span>
                      )}
                      <span className="text-xs text-slate-500 ml-3">{fmtTs(row.created_at)}</span>
                    </div>
                    <button className="btn-ghost delete-button" onClick={() => deleteRow(row)}>
                      <Trash2 size={14} /> Delete record
                    </button>
                  </div>
                  {!row.matched && (
                    <p className="text-xs text-slate-500">
                      Exact hashes differ at {diff} of 64 hexadecimal positions. This proves the
                      files differ; it does not identify the specific visual change.
                    </p>
                  )}
                  <div className="verification-metrics">
                    <span>
                      SHA-256: <strong>{row.matched ? "MATCHED" : "NOT MATCHED"}</strong>
                    </span>
                    <span>
                      Visual similarity:{" "}
                      <strong>
                        {row.visual_similarity === null
                          ? "Unavailable"
                          : `${row.visual_similarity.toFixed(1)}%`}
                      </strong>
                    </span>
                    <span>
                      Pixel difference:{" "}
                      <strong>
                        {row.difference_percent === null
                          ? "Unavailable"
                          : `${row.difference_percent.toFixed(1)}%`}
                      </strong>
                    </span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="space-y-2 min-w-0">
                      <p className="section-label">Original · {row.original_name}</p>
                      <ImageThumb
                        path={imagePaths.get(row.original_image_id) ?? ""}
                        alt={row.original_name}
                        className="w-full h-48 object-contain rounded-lg bg-black/20"
                      />
                      <HashText hash={row.original_sha256} compareTo={row.check_sha256} />
                      <button
                        className="btn-ghost text-xs"
                        onClick={() =>
                          downloadPath(
                            imagePaths.get(row.original_image_id) ?? "",
                            row.original_name,
                          )
                        }
                      >
                        <Download size={13} /> Download original
                      </button>
                    </div>
                    <div className="space-y-2 min-w-0">
                      <p className="section-label">Uploaded copy · {row.check_name}</p>
                      <ImageThumb
                        path={row.check_storage_path}
                        alt={row.check_name}
                        className="w-full h-48 object-contain rounded-lg bg-black/20"
                      />
                      <HashText
                        hash={row.check_sha256}
                        compareTo={row.original_sha256}
                        className={row.matched ? "hash-display-verified" : "hash-display-tampered"}
                      />
                      <button
                        className="btn-ghost text-xs"
                        onClick={() => downloadPath(row.check_storage_path, row.check_name)}
                      >
                        <Download size={13} /> Download uploaded copy
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
