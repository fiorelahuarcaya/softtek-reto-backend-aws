import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables } from "../core/db";
import { randomUUID } from "node:crypto";
import { fetchSWPeople, fetchSWPlanets } from "../clients/swapi";
import { fetchWikiSummary } from "../clients/wikipedia";
import { getCachedOrFetch } from "../core/cache";
import type { SWPerson, SWPlanet, WikiSummary } from "../models/fusion.types";

type Resource = "people" | "planets";
interface FusionResult {
  base: SWPerson | SWPlanet | null;
  wiki: WikiSummary | null;
  fetchedAt: string;
}

export const handler = async (event: any) => {
  const start = Date.now();
  const r = (event.queryStringParameters?.resource ?? "people") as Resource;
  const q = (event.queryStringParameters?.q ?? "").trim();
  if (!q) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "q is required" }),
    };
  }

  const key = `cache#${r}#${q.toLowerCase()}`;

  const data = await getCachedOrFetch<FusionResult>(
    key,
    async () => {
      const base =
        r === "people" ? await fetchSWPeople(q) : await fetchSWPlanets(q);
      const nameForWiki =
        (base && ("name" in base ? base.name : (base as any).title)) || q;
      const wiki = await fetchWikiSummary(nameForWiki, "en");
      return { base, wiki, fetchedAt: new Date().toISOString() };
    },
    1800
  );

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
          durationMs: Date.now() - start,
        },
      })
    );
  } catch {
    /* ignore offline errors */
  }

  const status = data.base ? 200 : 404;
  return { statusCode: status, body: JSON.stringify(data) };
};

export default handler;
