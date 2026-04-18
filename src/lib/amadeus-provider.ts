import type { Watch, Deal, PricePoint, FlightDataProvider } from './types';

// ---------------------------------------------------------------------------
// Amadeus Self-Service API provider
// ---------------------------------------------------------------------------

const AUTH_URL = 'https://test.api.amadeus.com/v1/security/oauth2/token';
const FLIGHT_OFFERS_URL =
  'https://test.api.amadeus.com/v2/shopping/flight-offers';

// IATA carrier code -> human-readable name (common carriers)
const CARRIER_NAMES: Record<string, string> = {
  AA: 'American Airlines', DL: 'Delta', UA: 'United', WN: 'Southwest',
  B6: 'JetBlue', AS: 'Alaska Airlines', NK: 'Spirit', F9: 'Frontier',
  BA: 'British Airways', LH: 'Lufthansa', AF: 'Air France', KL: 'KLM',
  EK: 'Emirates', QR: 'Qatar Airways', SQ: 'Singapore Airlines',
  NH: 'ANA', JL: 'JAL', CX: 'Cathay Pacific', KE: 'Korean Air',
  TK: 'Turkish Airlines', QF: 'Qantas', LA: 'LATAM', AV: 'Avianca',
  FR: 'Ryanair', U2: 'EasyJet', DY: 'Norwegian', AC: 'Air Canada',
  WS: 'WestJet', IB: 'Iberia', LX: 'Swiss', TP: 'TAP Portugal',
  SK: 'SAS', AY: 'Finnair', OS: 'Austrian', SN: 'Brussels Airlines',
  EI: 'Aer Lingus', LO: 'LOT Polish', RO: 'TAROM', W6: 'Wizz Air',
  VY: 'Vueling', A3: 'Aegean Airlines', MS: 'EgyptAir', ET: 'Ethiopian',
  SA: 'South African Airways', MH: 'Malaysia Airlines', TG: 'Thai Airways',
  GA: 'Garuda Indonesia', CI: 'China Airlines', BR: 'EVA Air',
  OZ: 'Asiana Airlines', AI: 'Air India', '9W': 'Jet Airways',
  AM: 'Aeromexico', CM: 'Copa Airlines', JJ: 'LATAM Brasil',
  G3: 'Gol', AD: 'Azul', AR: 'Aerolineas Argentinas',
};

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface CacheEntry<T> {
  data: T;
  ts: number;
}

function cacheKey(route: string, date: string): string {
  return `amadeus:${route}:${date}`;
}

function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.ts > CACHE_TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = { data, ts: Date.now() };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // localStorage full — ignore
  }
}

// ---------------------------------------------------------------------------
// Token management
// ---------------------------------------------------------------------------

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getToken(clientId: string, clientSecret: string): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 30_000) {
    return cachedToken.value;
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Amadeus auth failed (${res.status}): ${text}`);
  }

  const json = await res.json();
  cachedToken = {
    value: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
  return cachedToken.value;
}

// ---------------------------------------------------------------------------
// Rate-limited fetch (1 req/sec for test tier)
// ---------------------------------------------------------------------------

let lastRequestTime = 0;

async function rateLimitedFetch(
  url: string,
  init: RequestInit,
  maxRetries = 3,
): Promise<Response> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Enforce 1 req/sec
    const now = Date.now();
    const wait = Math.max(0, 1000 - (now - lastRequestTime));
    if (wait > 0) {
      await new Promise((r) => setTimeout(r, wait));
    }
    lastRequestTime = Date.now();

    const res = await fetch(url, init);

    if (res.status === 429) {
      // Back off exponentially
      const backoff = 1000 * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, backoff));
      continue;
    }

    return res;
  }

  // Last attempt — no retry
  const now = Date.now();
  const wait = Math.max(0, 1000 - (now - lastRequestTime));
  if (wait > 0) {
    await new Promise((r) => setTimeout(r, wait));
  }
  lastRequestTime = Date.now();
  return fetch(url, init);
}

// ---------------------------------------------------------------------------
// Amadeus response types (partial)
// ---------------------------------------------------------------------------

interface AmadeusOffer {
  id: string;
  price: { grandTotal: string; currency: string };
  validatingAirlineCodes?: string[];
  itineraries: Array<{
    segments: Array<{
      carrierCode: string;
      departure: { iataCode: string; at: string };
      arrival: { iataCode: string; at: string };
    }>;
  }>;
}

interface AmadeusResponse {
  data?: AmadeusOffer[];
  errors?: Array<{ detail: string; status: number; code: number; title: string }>;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export class AmadeusFlightDataProvider implements FlightDataProvider {
  private clientId: string;
  private clientSecret: string;
  /** Accumulated price points from real searches, for pseudo-history */
  private priceLog: Map<string, PricePoint[]> = new Map();

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.loadPriceLog();
  }

  // -- Price log persistence ------------------------------------------------

  private loadPriceLog(): void {
    try {
      const raw = localStorage.getItem('amadeus:priceLog');
      if (raw) {
        const entries: Array<[string, PricePoint[]]> = JSON.parse(raw);
        this.priceLog = new Map(entries);
      }
    } catch { /* ignore */ }
  }

  private savePriceLog(): void {
    try {
      const entries = Array.from(this.priceLog.entries());
      localStorage.setItem('amadeus:priceLog', JSON.stringify(entries));
    } catch { /* ignore */ }
  }

  private logPrice(origin: string, dest: string, price: number): void {
    const key = `${origin}-${dest}`;
    const today = new Date().toISOString().slice(0, 10);
    if (!this.priceLog.has(key)) this.priceLog.set(key, []);
    const pts = this.priceLog.get(key)!;
    // Avoid duplicating today's entry
    if (pts.length === 0 || pts[pts.length - 1].date !== today) {
      pts.push({ date: today, price });
    } else {
      // Update with lower price
      const last = pts[pts.length - 1];
      if (price < last.price) last.price = price;
    }
    // Keep at most 90 days
    while (pts.length > 90) pts.shift();
    this.savePriceLog();
  }

  // -- Core search ----------------------------------------------------------

  private async searchOffers(
    origin: string,
    destination: string,
    departDate: string,
    returnDate: string,
  ): Promise<AmadeusOffer[]> {
    const ck = cacheKey(`${origin}-${destination}`, `${departDate}_${returnDate}`);
    const cached = readCache<AmadeusOffer[]>(ck);
    if (cached) return cached;

    const token = await getToken(this.clientId, this.clientSecret);
    const params = new URLSearchParams({
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate: departDate,
      returnDate: returnDate,
      adults: '1',
      max: '5',
      currencyCode: 'USD',
    });

    const url = `${FLIGHT_OFFERS_URL}?${params}`;
    const res = await rateLimitedFetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Amadeus search failed (${res.status}): ${text}`);
    }

    const json: AmadeusResponse = await res.json();

    if (json.errors && json.errors.length > 0) {
      throw new Error(
        `Amadeus API error: ${json.errors.map((e) => e.detail || e.title).join('; ')}`,
      );
    }

    const offers = json.data ?? [];
    writeCache(ck, offers);
    return offers;
  }

  // -- FlightDataProvider interface -----------------------------------------

  async getDeals(watches: Watch[]): Promise<Deal[]> {
    const deals: Deal[] = [];
    const errors: string[] = [];

    for (const watch of watches) {
      if (watch.destination === 'anywhere') {
        // Amadeus requires a specific destination — skip "anywhere" watches
        continue;
      }

      // Sample departure dates within the watch range
      const start = new Date(watch.dateRangeStart);
      const end = new Date(watch.dateRangeEnd);
      const rangeDays = Math.max(
        1,
        Math.floor((end.getTime() - start.getTime()) / 86400000),
      );

      // Pick up to 5 sample dates to stay within rate limits
      const sampleCount = Math.min(rangeDays, 5);
      const datesToCheck: Date[] = [];
      for (let i = 0; i < sampleCount; i++) {
        const dayOffset = Math.floor((i / sampleCount) * rangeDays);
        const d = new Date(start);
        d.setDate(d.getDate() + dayOffset);

        // Filter by day of week if set
        if (watch.watchDays && watch.watchDays.length > 0) {
          if (!watch.watchDays.includes(d.getDay())) continue;
        }
        datesToCheck.push(d);
      }

      for (const departDate of datesToCheck) {
        // Calculate return date
        let returnDate: Date;
        if (watch.returnRangeStart) {
          returnDate = new Date(watch.returnRangeStart);
          if (returnDate <= departDate) {
            returnDate = new Date(departDate);
            returnDate.setDate(returnDate.getDate() + 3);
          }
        } else {
          returnDate = new Date(departDate);
          returnDate.setDate(returnDate.getDate() + 7);
        }

        const depStr = departDate.toISOString().slice(0, 10);
        const retStr = returnDate.toISOString().slice(0, 10);

        try {
          const offers = await this.searchOffers(
            watch.homeAirport,
            watch.destination,
            depStr,
            retStr,
          );

          for (const offer of offers) {
            const price = parseFloat(offer.price.grandTotal);

            // Log for price history
            this.logPrice(watch.homeAirport, watch.destination, price);

            if (price >= watch.maxBudget) continue;

            const carrierCode =
              offer.validatingAirlineCodes?.[0] ??
              offer.itineraries[0]?.segments[0]?.carrierCode ??
              '??';

            const airline =
              CARRIER_NAMES[carrierCode] ?? carrierCode;

            const savingsPercent = Math.round(
              ((watch.maxBudget - price) / watch.maxBudget) * 100,
            );

            deals.push({
              id: `amadeus-${watch.id}-${offer.id}`,
              watchId: watch.id,
              origin: watch.homeAirport,
              destination: watch.destination,
              airline,
              price,
              departDate: depStr,
              returnDate: retStr,
              maxBudget: watch.maxBudget,
              savingsPercent,
              foundAt: new Date().toISOString(),
            });
          }
        } catch (err) {
          errors.push(
            err instanceof Error ? err.message : String(err),
          );
        }
      }
    }

    if (errors.length > 0 && deals.length === 0) {
      throw new Error(errors.join('\n'));
    }

    deals.sort((a, b) => b.savingsPercent - a.savingsPercent);
    return deals;
  }

  async getPriceHistory(
    origin: string,
    destination: string,
  ): Promise<PricePoint[]> {
    const key = `${origin}-${destination}`;
    return this.priceLog.get(key) ?? [];
  }
}
