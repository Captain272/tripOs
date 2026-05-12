const KEY = process.env.PEXELS_API_KEY;

export interface PexelsPhoto {
  url: string;
  thumb: string;
  photographer: string;
  photographer_url: string;
  source_url: string;
}

interface PexelsApiResponse {
  photos?: Array<{
    id: number;
    src: { medium: string; large: string; landscape: string; small: string };
    photographer: string;
    photographer_url: string;
    url: string;
  }>;
}

export const hasPexels = () => Boolean(KEY);

function mapPhoto(p: NonNullable<PexelsApiResponse["photos"]>[number]): PexelsPhoto {
  return {
    url: p.src.landscape || p.src.large,
    thumb: p.src.medium || p.src.small,
    photographer: p.photographer,
    photographer_url: p.photographer_url,
    source_url: p.url,
  };
}

export async function searchPexels(query: string): Promise<PexelsPhoto | null> {
  const photos = await searchPexelsMany(query, 1);
  return photos[0] || null;
}

export async function searchPexelsMany(query: string, count = 5): Promise<PexelsPhoto[]> {
  if (!KEY) return [];
  const q = query.trim();
  if (!q) return [];
  const n = Math.max(1, Math.min(15, count));
  const url = `https://api.pexels.com/v1/search?per_page=${n}&orientation=landscape&query=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { Authorization: KEY } });
  if (!res.ok) return [];
  const data = (await res.json()) as PexelsApiResponse;
  return (data.photos || []).map(mapPhoto);
}
