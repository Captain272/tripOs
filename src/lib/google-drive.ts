/**
 * Google Drive helpers. Uses the Drive v3 REST API directly (no SDK).
 * Files are filtered by mimeType image/*. We read the lightweight
 * `imageMediaMetadata` field for time/GPS — no need to download the file.
 */

const DRIVE_BASE = "https://www.googleapis.com/drive/v3";

export interface DriveImage {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string | null;
  thumbnailLink: string | null;
  imageMediaMetadata: {
    time?: string; // "YYYY:MM:DD HH:MM:SS"
    location?: { latitude?: number; longitude?: number };
    width?: number;
    height?: number;
  } | null;
  createdTime: string | null;
}

interface ListResponse {
  files?: DriveImage[];
  nextPageToken?: string;
}

const FIELDS =
  "nextPageToken,files(id,name,mimeType,webViewLink,thumbnailLink,createdTime,imageMediaMetadata(time,location,width,height))";

export async function listFolderImages(
  folderId: string,
  accessToken: string
): Promise<DriveImage[]> {
  const out: DriveImage[] = [];
  let pageToken: string | undefined = undefined;
  // q: images in folder, not trashed.
  // Both direct children and trashed=false are enforced via q.
  const baseQ = `'${folderId.replace(/'/g, "\\'")}' in parents and mimeType contains 'image/' and trashed = false`;

  for (let i = 0; i < 10; i++) { // safety cap: 10 pages × 100 = 1000 photos
    const url = new URL(`${DRIVE_BASE}/files`);
    url.searchParams.set("q", baseQ);
    url.searchParams.set("fields", FIELDS);
    url.searchParams.set("pageSize", "100");
    url.searchParams.set("supportsAllDrives", "true");
    url.searchParams.set("includeItemsFromAllDrives", "true");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      throw new Error(`Drive list failed: ${res.status} ${await res.text()}`);
    }
    const data = (await res.json()) as ListResponse;
    if (data.files) out.push(...data.files);
    if (!data.nextPageToken) break;
    pageToken = data.nextPageToken;
  }
  return out;
}

/** Parse Drive's "YYYY:MM:DD HH:MM:SS" into an ISO string (UTC-naive). */
export function parseDriveTime(time: string | undefined): string | null {
  if (!time) return null;
  const m = time.match(/^(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
  if (!m) return null;
  const [, y, mo, d, h, mi, s] = m;
  // EXIF time is usually local-to-camera with no timezone — treat as UTC for sorting.
  return `${y}-${mo}-${d}T${h}:${mi}:${s}Z`;
}
