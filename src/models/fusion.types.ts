export interface SWAPIListResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface SWPerson {
  name: string;
  height: string;
  mass: string;
  hair_color: string;
  skin_color: string;
  eye_color: string;
  birth_year: string;
  gender: string;
  homeworld: string;
  films: string[];
  species: string[];
  vehicles: string[];
  starships: string[];
  created: string;
  edited: string;
  url: string;
}

export interface SWPlanet {
  name: string;
  rotation_period: string;
  orbital_period: string;
  diameter: string;
  climate: string; // p.ej. "arid, temperate"
  gravity: string; // p.ej. "1 standard"
  terrain: string;
  surface_water: string;
  population: string; // "unknown"
  residents: string[];
  films: string[];
  created: string;
  edited: string;
  url: string;
}

// Wikipedia
export interface WikiSummary {
  title: string;
  extract: string;
  url?: string;
  thumbnail?: string;
}
