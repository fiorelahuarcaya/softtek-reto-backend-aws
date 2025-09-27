import { request } from "undici";
import type { WikiSummary } from "../models/fusion.types";

const UA = "sofftek-reto/1.0 (contacto@example.com)";

async function httpGet(url: string) {
  return request(url, {
    method: "GET",
    headers: { accept: "application/json", "user-agent": UA },
  });
}

/**
 * Intenta summary directo; si falla (404/429/403), busca título y reintenta summary.
 */
export async function fetchWikiSummary(
  title: string,
  lang = "en"
): Promise<WikiSummary | null> {
  // 1) Intento directo
  const summaryUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  let res = await httpGet(summaryUrl);

  if (res.statusCode < 400) {
    const j: any = await res.body.json();
    return {
      title: j.title,
      extract: j.extract,
      url: j?.content_urls?.desktop?.page,
      thumbnail: j?.thumbnail?.source,
    };
  }

  const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
    title
  )}&format=json&srlimit=1`;
  const s = await httpGet(searchUrl);
  if (s.statusCode >= 400) return null;

  const sj: any = await s.body.json();
  const candidate: string | undefined = sj?.query?.search?.[0]?.title;
  if (!candidate) return null;

  const finalUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(candidate)}`;
  res = await httpGet(finalUrl);
  if (res.statusCode >= 400) return null;

  const jj: any = await res.body.json();
  return {
    title: jj.title,
    extract: jj.extract,
    url: jj?.content_urls?.desktop?.page,
    thumbnail: jj?.thumbnail?.source,
  };
}
