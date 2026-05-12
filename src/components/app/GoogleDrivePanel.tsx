"use client";

import * as React from "react";
import { Folder, FolderOpen, RefreshCw, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import type { TripRow } from "@/types/database";

interface Props {
  trip: TripRow;
  onTripUpdated: (trip: TripRow) => void;
  onSynced: () => void;
}

interface ApiOk<T> { ok: true; data: T }
interface ApiErr { ok: false; error: string }

interface StatusData {
  configured: boolean;
  connected: boolean;
  access_token?: string;
}

// Minimal Google Picker types so we don't need @types/google.picker.
type PickerEvent = "loaded" | "cancel" | "picked";
interface PickedDoc {
  id: string;
  name: string;
  mimeType: string;
}
interface PickerResponse {
  action: PickerEvent;
  docs?: PickedDoc[];
}
interface PickerBuilder {
  setAppId(id: string): PickerBuilder;
  setOAuthToken(t: string): PickerBuilder;
  setDeveloperKey(k: string): PickerBuilder;
  addView(view: unknown): PickerBuilder;
  setCallback(cb: (r: PickerResponse) => void): PickerBuilder;
  setTitle(t: string): PickerBuilder;
  build(): { setVisible(v: boolean): void };
}
interface DocsView {
  setIncludeFolders(b: boolean): DocsView;
  setSelectFolderEnabled(b: boolean): DocsView;
  setMimeTypes(m: string): DocsView;
}

interface GoogleNS {
  picker: {
    PickerBuilder: new () => PickerBuilder;
    DocsView: new (viewId?: string) => DocsView;
    ViewId: { FOLDERS: string };
    Action: { PICKED: string; CANCEL: string };
  };
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
const APP_ID = process.env.NEXT_PUBLIC_GOOGLE_PROJECT_NUMBER;

function getPicker(): GoogleNS["picker"] | null {
  const g = typeof window !== "undefined" ? window.google : undefined;
  return (g?.picker as GoogleNS["picker"] | undefined) ?? null;
}

function loadPickerApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (getPicker()) return Promise.resolve();
  if (window.__tripos_picker_loading) return window.__tripos_picker_loading;

  window.__tripos_picker_loading = new Promise<void>((resolve, reject) => {
    const onApiLoad = () => {
      if (!window.gapi) return reject(new Error("gapi not present"));
      window.gapi.load("picker", () => resolve());
    };
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://apis.google.com/js/api.js"]');
    if (existing) {
      if (window.gapi) onApiLoad();
      else existing.addEventListener("load", onApiLoad, { once: true });
      return;
    }
    const s = document.createElement("script");
    s.src = "https://apis.google.com/js/api.js";
    s.async = true;
    s.defer = true;
    s.onload = onApiLoad;
    s.onerror = () => reject(new Error("Failed to load Google API script"));
    document.head.appendChild(s);
  });
  return window.__tripos_picker_loading;
}

export function GoogleDrivePanel({ trip, onTripUpdated, onSynced }: Props) {
  const { push } = useToast();
  const [status, setStatus] = React.useState<StatusData | null>(null);
  const [syncing, setSyncing] = React.useState(false);
  const [pickerBusy, setPickerBusy] = React.useState(false);

  const refreshStatus = React.useCallback(async () => {
    const res = await fetch("/api/google/status");
    const json = (await res.json()) as ApiOk<StatusData> | ApiErr;
    if (json.ok) setStatus(json.data);
  }, []);

  React.useEffect(() => { void refreshStatus(); }, [refreshStatus]);

  // Reflect ?google_connected=1 returned by callback.
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("google_connected") === "1") {
      push({ title: "Google Drive connected" });
      params.delete("google_connected");
      const q = params.toString();
      window.history.replaceState(null, "", window.location.pathname + (q ? `?${q}` : ""));
      void refreshStatus();
    }
    const err = params.get("google_oauth_error");
    if (err) {
      push({ title: "Google connect failed", body: err });
      params.delete("google_oauth_error");
      const q = params.toString();
      window.history.replaceState(null, "", window.location.pathname + (q ? `?${q}` : ""));
    }
  }, [push, refreshStatus]);

  async function connect() {
    const returnTo = `/app/trips/${trip.id}/memories`;
    window.location.href = `/api/google/connect?return_to=${encodeURIComponent(returnTo)}`;
  }

  async function disconnect() {
    if (!confirm("Disconnect Google Drive? You can reconnect any time.")) return;
    const res = await fetch("/api/google/disconnect", { method: "POST" });
    const json = await res.json();
    if (json.ok) {
      push({ title: "Disconnected" });
      void refreshStatus();
    }
  }

  async function openPicker() {
    setPickerBusy(true);
    try {
      if (!API_KEY) throw new Error("NEXT_PUBLIC_GOOGLE_API_KEY missing");
      if (!APP_ID) throw new Error("NEXT_PUBLIC_GOOGLE_PROJECT_NUMBER missing");

      const tokenRes = await fetch("/api/google/status?token=1");
      const tokenJson = (await tokenRes.json()) as ApiOk<StatusData> | ApiErr;
      if (!tokenJson.ok || !tokenJson.data.access_token) {
        throw new Error("Not connected");
      }
      await loadPickerApi();
      const picker = getPicker();
      if (!picker) throw new Error("Picker not available");

      const view = new picker.DocsView(picker.ViewId.FOLDERS)
        .setIncludeFolders(true)
        .setSelectFolderEnabled(true)
        .setMimeTypes("application/vnd.google-apps.folder");

      const built = new picker.PickerBuilder()
        .setAppId(APP_ID)
        .setOAuthToken(tokenJson.data.access_token!)
        .setDeveloperKey(API_KEY)
        .setTitle("Pick the folder with this trip's photos")
        .addView(view)
        .setCallback(async (r) => {
          if (r.action !== "picked") return;
          const folder = r.docs?.[0];
          if (!folder) return;
          const res = await fetch(`/api/trips/${trip.id}/drive-folder`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ drive_folder_id: folder.id, drive_folder_name: folder.name }),
          });
          const json = (await res.json()) as ApiOk<{ trip: TripRow }> | ApiErr;
          if (json.ok) {
            onTripUpdated(json.data.trip);
            push({ title: `Linked to "${folder.name}"`, body: "Hit Sync to import photos." });
          } else {
            push({ title: "Could not save folder", body: json.error });
          }
        })
        .build();
      built.setVisible(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not open picker";
      push({ title: "Picker error", body: msg });
    } finally {
      setPickerBusy(false);
    }
  }

  async function sync() {
    setSyncing(true);
    const res = await fetch("/api/google/drive/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trip_id: trip.id }),
    });
    const json = (await res.json()) as ApiOk<{ count: number; written: number }> | ApiErr;
    setSyncing(false);
    if (!json.ok) {
      push({ title: "Sync failed", body: json.error });
      return;
    }
    push({ title: "Synced", body: `${json.data.count} photos imported.` });
    onSynced();
    void refreshStatus();
  }

  if (!status) {
    return (
      <div className="rounded-2xl border border-white/[0.07] bg-surface/40 p-4 text-[12.5px] text-faint">
        Checking Drive status…
      </div>
    );
  }

  if (!status.configured) {
    return (
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-4 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
        <div className="text-[12.5px]">
          <div className="font-medium text-amber-200">Google Drive not configured</div>
          <div className="text-amber-200/70 mt-0.5">
            Add <code className="px-1 rounded bg-black/30">GOOGLE_OAUTH_CLIENT_ID</code> and{" "}
            <code className="px-1 rounded bg-black/30">GOOGLE_OAUTH_CLIENT_SECRET</code> to .env, then restart dev.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-surface/40 p-5 flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 ${status.connected ? "bg-cyan/15 text-cyan" : "bg-white/[0.05] text-faint"}`}>
          {trip.drive_folder_id ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-medium truncate">
            {!status.connected
              ? "Connect Google Drive"
              : trip.drive_folder_id
              ? trip.drive_folder_name || "Linked folder"
              : "Pick a folder for this trip"}
          </div>
          <div className="text-[11px] text-faint truncate">
            {!status.connected
              ? "Auto-import photos and match them to your stops."
              : trip.drive_folder_id
              ? trip.drive_last_synced_at
                ? `Last synced ${new Date(trip.drive_last_synced_at).toLocaleString()}`
                : "Ready to sync — click below."
              : "Pick a folder that contains this trip's photos."}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!status.connected ? (
          <Button size="sm" onClick={connect}>Connect</Button>
        ) : (
          <>
            <Button size="sm" variant="ghost" onClick={openPicker} disabled={pickerBusy}>
              {pickerBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Folder className="w-3.5 h-3.5" />}
              {trip.drive_folder_id ? "Change folder" : "Pick folder"}
            </Button>
            {trip.drive_folder_id && (
              <Button size="sm" onClick={sync} disabled={syncing}>
                {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                {syncing ? "Syncing…" : "Sync"}
              </Button>
            )}
            <button
              onClick={disconnect}
              className="text-[11px] text-faint hover:text-fg transition-colors px-2"
            >
              Disconnect
            </button>
          </>
        )}
        {status.connected && !trip.drive_folder_id && (
          <span className="inline-flex items-center gap-1 text-[11px] text-cyan">
            <CheckCircle2 className="w-3 h-3" /> Connected
          </span>
        )}
      </div>
    </div>
  );
}
