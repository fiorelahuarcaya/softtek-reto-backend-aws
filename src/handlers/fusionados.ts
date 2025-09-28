import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables } from "../core/db";
import { randomUUID } from "node:crypto";
import { fetchSWPeople, fetchSWPlanets } from "../clients/swapi";
import { fetchWikiSummary } from "../clients/wikipedia";
import { getCachedOrFetch, getCachedOrFetchMeta } from "../core/cache";
import type { SWPerson, SWPlanet, WikiSummary } from "../models/fusion.types";
import { createLogger } from "../core/logger";

type Resource = "people" | "planets";
interface FusionResult {
  base: SWPerson | SWPlanet | null;
  wiki: WikiSummary | null;
  fetchedAt: string;
}

export const handler = async (event: any, context: any) => {
  const start = Date.now();
  const log = createLogger({
    component: "fusionados",
    reqId: context?.awsRequestId,
    gwReqId: event?.requestContext?.requestId,
    path: event?.rawPath,
    stage: event?.requestContext?.stage,
  });

  const r = (event.queryStringParameters?.resource ?? "people") as Resource;
  const q = (event.queryStringParameters?.q ?? "").trim();

  log.info("REQUEST_RECEIVED", { resource: r, q });

  if (!q) {
    log.warn("BAD_REQUEST_MISSING_Q");
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "q is required" }),
    };
  }

  const key = `cache#${r}#${q.toLowerCase()}`;

  try {
    const { payload: data, source } = await getCachedOrFetchMeta<FusionResult>(
      key,
      async () => {
        const t0 = Date.now();
        const base =
          r === "people" ? await fetchSWPeople(q) : await fetchSWPlanets(q);
        const t1 = Date.now();
        log.debug("EXTERNAL_SWAPI_DONE", { ms: t1 - t0, found: !!base });

        const nameForWiki =
          (base && ("name" in base ? base.name : (base as any).title)) || q;
        const t2 = Date.now();
        const wiki = await fetchWikiSummary(nameForWiki, "en");
        const t3 = Date.now();
        log.debug("EXTERNAL_WIKI_DONE", {
          ms: t3 - t2,
          found: !!wiki,
          title: nameForWiki,
        });

        return { base, wiki, fetchedAt: new Date().toISOString() };
      },
      1800
    );

    const status = data.base ? 200 : 404;

    // Historial
    try {
      const sk = `${new Date().toISOString()}#${randomUUID()}`;
      await ddb.send(
        new PutCommand({
          TableName: Tables.history,
          Item: {
            pk: "fusionados",
            sk,
            resource: r,
            q,
            hasBase: !!data.base,
            hasWiki: !!data.wiki,
            cacheSource: source,
            durationMs: Date.now() - start,
          },
        })
      );
      log.debug("HISTORY_SAVED", { sk });
    } catch (err: any) {
      log.warn("HISTORY_SAVE_FAILED", { error: err?.message });
    }

    log.info("RESPONSE_SENDING", {
      status,
      cacheSource: source,
      totalMs: Date.now() - start,
    });
    return {
      statusCode: status,
      headers: {
        "Content-Type": "application/json",
        "X-Cache": source === "MISS" ? "Miss" : "Hit",
        "X-Cache-Source": source,
      },
      body: JSON.stringify({ ...data, _cache: source }),
    };
  } catch (err: any) {
    log.error("UNHANDLED_ERROR", { error: err?.message, stack: err?.stack });
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Internal error" }),
    };
  }
};

export default handler;
