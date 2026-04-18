# Flight Deals Watcher

A frontend-only SPA that monitors flight prices and alerts when deals drop below your budget threshold.

## Features

- **Watch Configuration**: Set home airport (fuzzy IATA code autocomplete from 507 airports), destination (or "anywhere"), budget, and travel dates
- **Deal Feed**: Live list of deals below your threshold, sorted by savings percentage. Each card shows route, airline, price, dates, and savings
- **Price History**: 30-day SVG sparkline chart per route with min/avg/max statistics
- **Dashboard Stats**: Cheapest deal, average savings, active watches count
- **Persistence**: All watches and settings saved to localStorage

## Tech Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS v4 (dark theme)
- No backend required — ships with a mock data provider

## Getting Started

```bash
npm install
npm run dev
```

## Build

```bash
npm run build    # production build to dist/
npx tsc --noEmit # type check
```

## Architecture

All data flows through a `FlightDataProvider` interface (`src/lib/types.ts`). The included `MockFlightDataProvider` generates realistic prices with seeded PRNG — deterministic per route and day, with occasional 30-50% deal drops.

To plug in a real API (SerpAPI, Amadeus, Skyscanner), implement the `FlightDataProvider` interface and swap it in `App.tsx`.

### Key files

| Path | Description |
|------|-------------|
| `src/lib/types.ts` | Type definitions + FlightDataProvider interface |
| `src/lib/mock-provider.ts` | Mock price engine with realistic fluctuations |
| `src/lib/airport-search.ts` | Fuzzy airport search over bundled dataset |
| `src/data/airports.json` | 507 major world airports |
| `src/components/` | All UI components |
| `src/hooks/useLocalState.ts` | localStorage-backed React state hook |
