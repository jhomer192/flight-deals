import type { Airport } from './types';
import airports from '../data/airports.json';

const airportList: Airport[] = airports;

/** Build a lookup map for O(1) code resolution */
const byCode = new Map<string, Airport>();
for (const a of airportList) {
  byCode.set(a.code, a);
}

export function getAirport(code: string): Airport | undefined {
  return byCode.get(code.toUpperCase());
}

/**
 * Fuzzy search airports by query string.
 * Matches against IATA code, city name, country, and airport name.
 * Returns up to `limit` results, sorted by relevance.
 */
export function searchAirports(query: string, limit = 10): Airport[] {
  if (!query.trim()) return [];

  const q = query.toLowerCase().trim();
  const scored: Array<{ airport: Airport; score: number }> = [];

  for (const airport of airportList) {
    const code = airport.code.toLowerCase();
    const city = airport.city.toLowerCase();
    const country = airport.country.toLowerCase();
    const name = airport.name.toLowerCase();

    let score = 0;

    // Exact code match is highest priority
    if (code === q) {
      score = 100;
    } else if (code.startsWith(q)) {
      score = 80;
    } else if (city === q) {
      score = 70;
    } else if (city.startsWith(q)) {
      score = 60;
    } else if (country.startsWith(q)) {
      score = 40;
    } else if (name.startsWith(q)) {
      score = 35;
    } else if (city.includes(q)) {
      score = 30;
    } else if (name.includes(q)) {
      score = 20;
    } else if (country.includes(q)) {
      score = 15;
    } else {
      // Check if query words all appear somewhere
      const words = q.split(/\s+/);
      const combined = `${code} ${city} ${country} ${name}`;
      const allMatch = words.every((w) => combined.includes(w));
      if (allMatch) {
        score = 10;
      }
    }

    if (score > 0) {
      scored.push({ airport, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.airport);
}

export function getAllAirports(): Airport[] {
  return airportList;
}
