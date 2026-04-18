import type { Watch, Deal, PricePoint, FlightDataProvider } from './types';

// Realistic base prices (round-trip USD) for common route pairs.
// Keyed as "ORIGIN-DEST". If a pair isn't listed we derive a price
// from distance-bucket heuristics.
const BASE_PRICES: Record<string, number> = {
  'JFK-LAX': 300, 'JFK-SFO': 320, 'JFK-MIA': 220, 'JFK-ORD': 180,
  'JFK-LHR': 650, 'JFK-CDG': 700, 'JFK-NRT': 900, 'JFK-HND': 920,
  'JFK-BCN': 680, 'JFK-FCO': 720, 'JFK-DUB': 550, 'JFK-CUN': 350,
  'JFK-BOG': 400, 'JFK-GRU': 750, 'JFK-ICN': 950, 'JFK-SIN': 1100,
  'JFK-DXB': 850, 'LAX-NRT': 800, 'LAX-HND': 820, 'LAX-SIN': 950,
  'LAX-SYD': 1050, 'LAX-HNL': 350, 'LAX-CUN': 320, 'LAX-LHR': 700,
  'LAX-CDG': 750, 'LAX-ICN': 780, 'LAX-PVG': 700, 'LAX-MEX': 280,
  'ORD-LHR': 600, 'ORD-NRT': 850, 'ORD-CUN': 300, 'ORD-LAX': 220,
  'ORD-MIA': 200, 'ORD-DFW': 180, 'SFO-NRT': 780, 'SFO-HKG': 800,
  'SFO-LHR': 720, 'SFO-SYD': 1000, 'ATL-LHR': 650, 'ATL-CUN': 280,
  'ATL-MIA': 150, 'MIA-CUN': 200, 'MIA-BOG': 300, 'MIA-GRU': 600,
  'MIA-MAD': 600, 'DFW-CUN': 280, 'DFW-LHR': 700, 'SEA-NRT': 700,
  'SEA-ICN': 750, 'BOS-LHR': 580, 'BOS-DUB': 500, 'DEN-CUN': 350,
  'LHR-CDG': 150, 'LHR-AMS': 130, 'LHR-BCN': 180, 'LHR-FCO': 200,
  'LHR-DXB': 550, 'LHR-BOM': 650, 'LHR-SIN': 750, 'LHR-JNB': 800,
  'LHR-SYD': 1100, 'LHR-HKG': 700, 'CDG-NRT': 850, 'FRA-NRT': 800,
  'SIN-BKK': 180, 'SIN-HKG': 280, 'SIN-NRT': 500, 'SIN-SYD': 500,
  'HKG-NRT': 400, 'HKG-TPE': 200, 'HKG-BKK': 250, 'DXB-DEL': 300,
  'DXB-BOM': 280, 'DXB-LHR': 550, 'DXB-SIN': 500, 'SYD-AKL': 300,
  'SYD-SIN': 550, 'SYD-NRT': 700, 'SYD-LAX': 1000,
};

const AIRLINES = [
  'Delta', 'United', 'American Airlines', 'Southwest', 'JetBlue',
  'Alaska Airlines', 'Spirit', 'Frontier', 'British Airways', 'Lufthansa',
  'Air France', 'KLM', 'Emirates', 'Qatar Airways', 'Singapore Airlines',
  'ANA', 'JAL', 'Cathay Pacific', 'Korean Air', 'Turkish Airlines',
  'Qantas', 'LATAM', 'Avianca', 'Ryanair', 'EasyJet', 'Norwegian',
  'Air Canada', 'WestJet', 'Iberia', 'Swiss',
];

// Popular destination airports used for "anywhere" watches
const POPULAR_DESTINATIONS = [
  'LAX', 'JFK', 'LHR', 'CDG', 'NRT', 'BCN', 'FCO', 'CUN', 'SIN',
  'BKK', 'DXB', 'SYD', 'AMS', 'HKG', 'ICN', 'LIS', 'ATH', 'DUB',
  'MIA', 'SFO', 'MEX', 'GRU', 'CPT', 'HNL', 'AKL', 'PRG', 'VIE',
  'KEF', 'BOG', 'MAD',
];

/** Seeded PRNG so mock data is deterministic per route+day */
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return h;
}

function getBasePrice(origin: string, dest: string): number {
  const key = `${origin}-${dest}`;
  const reverseKey = `${dest}-${origin}`;
  if (BASE_PRICES[key]) return BASE_PRICES[key];
  if (BASE_PRICES[reverseKey]) return BASE_PRICES[reverseKey];
  // Derive from hash — domestic-ish ($150-400), international ($400-1200)
  const h = Math.abs(hashString(key));
  const domestic = origin.length === 3 && dest.length === 3; // always true for IATA
  // Use hash to bucket
  const bucket = h % 5;
  const prices = domestic
    ? [180, 250, 350, 500, 750]
    : [180, 250, 350, 500, 750];
  return prices[bucket] + (h % 100);
}

function generatePriceForDay(
  origin: string,
  dest: string,
  dayOffset: number,
): number {
  const base = getBasePrice(origin, dest);
  const seed = hashString(`${origin}-${dest}-${dayOffset}`);
  const r = seededRandom(seed);

  // Normal fluctuation: +/- 20%
  let multiplier = 0.8 + r * 0.4;

  // ~8% chance of a deal drop (30-50% off)
  const dealSeed = seededRandom(seed + 7);
  if (dealSeed < 0.08) {
    multiplier = 0.5 + seededRandom(seed + 13) * 0.2;
  }

  // Slight upward trend near departure
  if (dayOffset > 20) {
    multiplier += (dayOffset - 20) * 0.005;
  }

  return Math.round(base * multiplier);
}

function pickAirline(origin: string, dest: string): string {
  const h = Math.abs(hashString(`${origin}-${dest}-airline`));
  return AIRLINES[h % AIRLINES.length];
}

export class MockFlightDataProvider implements FlightDataProvider {
  async getDeals(watches: Watch[]): Promise<Deal[]> {
    const deals: Deal[] = [];
    const today = new Date();

    for (const watch of watches) {
      const destinations =
        watch.destination === 'anywhere'
          ? POPULAR_DESTINATIONS.filter((d) => d !== watch.homeAirport)
          : [watch.destination];

      for (const dest of destinations) {
        // Check prices for several departure dates within range
        const start = new Date(watch.dateRangeStart);
        const end = new Date(watch.dateRangeEnd);
        const rangeDays = Math.max(
          1,
          Math.floor((end.getTime() - start.getTime()) / 86400000),
        );

        // Determine return date range
        const retStart = watch.returnRangeStart ? new Date(watch.returnRangeStart) : null;
        const retEnd = watch.returnRangeEnd ? new Date(watch.returnRangeEnd) : null;

        // When day filtering is on, check every day in range.
        // Otherwise sample up to 10 evenly spaced dates.
        const hasDayFilter = watch.watchDays && watch.watchDays.length > 0;
        const checkDates = hasDayFilter ? rangeDays : Math.min(rangeDays, 10);

        for (let i = 0; i < checkDates; i++) {
          const dayInRange = hasDayFilter ? i : Math.floor((i / checkDates) * rangeDays);
          const departDate = new Date(start);
          departDate.setDate(departDate.getDate() + dayInRange);

          // Filter by day of week
          if (hasDayFilter && !watch.watchDays!.includes(departDate.getDay())) continue;

          // Calculate return date
          const returnDate = new Date(departDate);
          if (retStart && retEnd) {
            // Pick a return date within the return range
            const retRangeDays = Math.max(1, Math.floor((retEnd.getTime() - retStart.getTime()) / 86400000));
            const retDayOffset = Math.floor((i / checkDates) * retRangeDays);
            returnDate.setTime(retStart.getTime());
            returnDate.setDate(returnDate.getDate() + retDayOffset);
            // Ensure return is after departure
            if (returnDate <= departDate) {
              returnDate.setTime(departDate.getTime());
              returnDate.setDate(returnDate.getDate() + 3);
            }
          } else {
            returnDate.setDate(returnDate.getDate() + 7); // default 7-day trip
          }

          const dayOffset = Math.floor(
            (departDate.getTime() - today.getTime()) / 86400000,
          );
          const price = generatePriceForDay(
            watch.homeAirport,
            dest,
            dayOffset,
          );

          if (price < watch.maxBudget) {
            const savingsPercent = Math.round(
              ((watch.maxBudget - price) / watch.maxBudget) * 100,
            );
            deals.push({
              id: `deal-${watch.id}-${dest}-${dayInRange}`,
              watchId: watch.id,
              origin: watch.homeAirport,
              destination: dest,
              airline: pickAirline(watch.homeAirport, dest),
              price,
              departDate: departDate.toISOString().slice(0, 10),
              returnDate: returnDate.toISOString().slice(0, 10),
              maxBudget: watch.maxBudget,
              savingsPercent,
              foundAt: new Date().toISOString(),
            });
          }
        }
      }
    }

    // Sort by savings percent descending
    deals.sort((a, b) => b.savingsPercent - a.savingsPercent);
    return deals;
  }

  async getPriceHistory(
    origin: string,
    destination: string,
  ): Promise<PricePoint[]> {
    const points: PricePoint[] = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const price = generatePriceForDay(origin, destination, -i);
      points.push({
        date: date.toISOString().slice(0, 10),
        price,
      });
    }

    return points;
  }
}
