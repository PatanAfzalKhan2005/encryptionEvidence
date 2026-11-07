import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Signed URL for a privately-stored image (cached for the hour it is valid). */
export function useImageUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ["image-url", path],
    enabled: !!path,
    staleTime: 50 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("images").createSignedUrl(path!, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
  });
}

export function ImageThumb({ path, className, alt }: { path: string; className?: string; alt?: string }) {
  const { data: url, isLoading, isError } = useImageUrl(path);
  if (isLoading) return <div className={`skeleton ${className ?? ""}`} />;
  if (isError || !url)
    return (
      <div className={`${className ?? ""} flex items-center justify-center bg-surface-700/60 text-slate-600 text-2xs`}>
        Unavailable
      </div>
    );
  return <img src={url} alt={alt ?? "Stored image"} className={className} loading="lazy" />;
}
