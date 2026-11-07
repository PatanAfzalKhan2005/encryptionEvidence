import { supabase } from "@/integrations/supabase/client";

/** Supabase storage bulk removal is sent in small bounded batches. */
export async function removeStoredImages(paths: string[]) {
  const uniquePaths = [...new Set(paths.filter(Boolean))];
  for (let index = 0; index < uniquePaths.length; index += 100) {
    const { error } = await supabase.storage
      .from("images")
      .remove(uniquePaths.slice(index, index + 100));
    if (error) throw error;
  }
}
