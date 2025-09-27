import { request } from "undici";
import type {
  SWAPIListResponse,
  SWPerson,
  SWPlanet,
} from "../models/fusion.types";

async function getJson<T>(url: string): Promise<T> {
  const { body, statusCode } = await request(url, {
    method: "GET",
    headers: {
      accept: "application/json",
      "user-agent": "sofftek-reto/1.0 (contacto@example.com)",
    },
  });
  if (statusCode >= 400) throw new Error(`SWAPI ${statusCode} for ${url}`);
  return (await body.json()) as T;
}

export async function fetchSWPeople(q: string): Promise<SWPerson | null> {
  const json = await getJson<SWAPIListResponse<SWPerson>>(
    `https://swapi.py4e.com/api/people/?search=${encodeURIComponent(q)}`
  );
  return json.results?.[0] ?? null;
}

export async function fetchSWPlanets(q: string): Promise<SWPlanet | null> {
  const json = await getJson<SWAPIListResponse<SWPlanet>>(
    `https://swapi.py4e.com/api/planets/?search=${encodeURIComponent(q)}`
  );
  return json.results?.[0] ?? null;
}
