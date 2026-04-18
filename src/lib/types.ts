export interface Airport {
  code: string;
  city: string;
  country: string;
  name: string;
}

export interface Watch {
  id: string;
  homeAirport: string;
  destination: string; // IATA code or "anywhere"
  maxBudget: number;
  dateRangeStart: string; // ISO date string -- earliest departure
  dateRangeEnd: string;   // latest departure
  returnRangeStart?: string; // earliest return (optional, defaults to departure dates)
  returnRangeEnd?: string;   // latest return
  watchDays?: number[];   // days of week to watch: 0=Sun, 1=Mon, ..., 6=Sat
  createdAt: string;
}

export interface Deal {
  id: string;
  watchId: string;
  origin: string;
  destination: string;
  airline: string;
  price: number;
  departDate: string;
  returnDate: string;
  maxBudget: number;
  savingsPercent: number;
  foundAt: string;
}

export interface PricePoint {
  date: string;
  price: number;
}

export interface RouteHistory {
  origin: string;
  destination: string;
  prices: PricePoint[];
}

/**
 * Provider interface for flight price data.
 *
 * The mock provider is used by default. To plug in a real provider
 * (e.g. SerpAPI Google Flights, Amadeus, Skyscanner), implement this
 * interface and pass it to the FlightDataContext.
 *
 * Example:
 *   class SerpApiProvider implements FlightDataProvider {
 *     async getDeals(watches: Watch[]): Promise<Deal[]> {
 *       // Call SerpAPI with each watch's parameters
 *       // Map response to Deal[]
 *     }
 *     async getPriceHistory(origin: string, destination: string): Promise<PricePoint[]> {
 *       // Return cached historical prices
 *     }
 *   }
 */
export interface FlightDataProvider {
  getDeals(watches: Watch[]): Promise<Deal[]>;
  getPriceHistory(origin: string, destination: string): Promise<PricePoint[]>;
}
