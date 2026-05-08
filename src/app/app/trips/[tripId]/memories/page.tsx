"use client";

import * as React from "react";
import { use } from "react";
import { Camera, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface MediaRow {
  id: string;
  file_url: string;
  file_type: string | null;
  caption: string | null;
  day_number: number | null;
  created_at: string;
}

export default function MemoriesPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = use(params);
  const { push } = useToast();
  const [items, setItems] = React.useState<MediaRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("trip_media").select("*").eq("trip_id", tripId)
      .order("created_at", { ascending: false });
    if (!error && data) setItems(data as MediaRow[]);
    setLoading(false);
  }, [tripId]);
  React.useEffect(() => { void load(); }, [load]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const supabase = createSupabaseBrowserClient();
    for (const file of Array.from(files)) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${tripId}/${Date.now()}-${safeName}`;
      const { error } = await supabase.storage.from("trip-photos").upload(path, file, {
        cacheControl: "3600", upsert: false,
      });
      if (error) {
        push({ title: `Upload failed: ${file.name}`, body: error.message });
        continue;
      }
      const { data: signed } = await supabase.storage.from("trip-photos").createSignedUrl(path, 60 * 60 * 24);
      const url = signed?.signedUrl ?? path;
      const isImage = file.type.startsWith("image");
      await fetch("/api/media/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trip_id: tripId,
          file_url: url,
          file_type: isImage ? "image" : "document",
        }),
      });
    }
    setUploading(false);
    push({ title: "Uploaded" });
    void load();
  }

  const photos = items.filter((i) => i.file_type === "image");
  const docs = items.filter((i) => i.file_type !== "image");

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight">Memories</h2>
          <p className="text-sm text-muted">Your trip should not disappear into everyone&apos;s camera roll.</p>
        </div>
        <Button onClick={() => inputRef.current?.click()} size="sm" disabled={uploading}>
          {uploading ? (<><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>) : (<><Upload className="w-4 h-4" /> Upload</>)}
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,application/pdf"
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {loading ? (
        <div className="text-sm text-faint">Loading…</div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/[0.12] bg-surface/30 p-10 text-center">
          <Camera className="mx-auto w-6 h-6 text-faint mb-3" />
          <div className="font-display text-lg">Your trip memories will live here.</div>
          <p className="text-sm text-muted mt-1">Upload group photos, tickets, and trip documents.</p>
        </div>
      ) : (
        <>
          {photos.length > 0 && (
            <div className="mb-8">
              <div className="text-[10px] uppercase tracking-wider text-faint mb-3">Photos · {photos.length}</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {photos.map((p) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <a key={p.id} href={p.file_url} target="_blank" rel="noopener" className="block group">
                    <div className="relative aspect-square rounded-xl overflow-hidden border border-white/[0.07] bg-ink">
                      <img
                        src={p.file_url}
                        alt={p.caption || "Trip photo"}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {docs.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-faint mb-3">Documents · {docs.length}</div>
              <ul className="space-y-2">
                {docs.map((d) => (
                  <li key={d.id} className="rounded-xl border border-white/[0.07] bg-surface/40 px-4 py-3 text-[13px] flex items-center justify-between">
                    <span className="truncate">{d.caption || d.file_url.split("/").pop()}</span>
                    <a href={d.file_url} target="_blank" rel="noopener" className="text-cyan text-[11px]">Open</a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </>
  );
}
