import type { WikiSummary } from "../models/fusion.types";

const UA = "sofftek-reto/1.0 (contacto@example.com)";

async function httpGet(url: string, timeoutMs = 5000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      headers: { accept: "application/json", "user-agent": UA },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(t);
  }
}

/** Intenta summary directo; si falla, busca el título y reintenta */
export async function fetchWikiSummary(
  title: string,
  lang = "en"
): Promise<WikiSummary | null> {
  // 1) Summary directo
  let res = await httpGet(
    `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
  );
  if (res.ok) {
    const j: any = await res.json();
    return {
      title: j.title,
      extract: j.extract,
      url: j?.content_urls?.desktop?.page,
      thumbnail: j?.thumbnail?.source,
    };
  }

  // 2) Fallback: buscar
  const s = await httpGet(
    `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(title)}&format=json&srlimit=1`
  );
  if (!s.ok) return null;
  const sj: any = await s.json();
  const candidate: string | undefined = sj?.query?.search?.[0]?.title;
  if (!candidate) return null;

  // 3) Summary del título encontrado
  res = await httpGet(
    `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(candidate)}`
  );
  if (!res.ok) return null;
  const jj: any = await res.json();
  return {
    title: jj.title,
    extract: jj.extract,
    url: jj?.content_urls?.desktop?.page,
    thumbnail: jj?.thumbnail?.source,
  };
}
