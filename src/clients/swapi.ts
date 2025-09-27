import type {
  SWAPIListResponse,
  SWPerson,
  SWPlanet,
} from "../models/fusion.types";

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      accept: "application/json",
      "user-agent": "sofftek-reto/1.0 (contacto@example.com)",
    },
  });
  if (!res.ok) throw new Error(`SWAPI ${res.status} for ${url}`);
  return (await res.json()) as T;
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
