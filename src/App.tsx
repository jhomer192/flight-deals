import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocalState } from './hooks/useLocalState';
import { useFlightDataProvider } from './lib/provider-context';
import type { Watch, Deal } from './lib/types';
import { WatchForm } from './components/WatchForm';
import { WatchList } from './components/WatchList';
import { DealFeed } from './components/DealFeed';
import { DashboardStats } from './components/DashboardStats';
import { PriceHistoryPanel } from './components/PriceHistoryPanel';
import { ThemePicker } from './components/ThemePicker';

const REFRESH_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

/** Deduplicate deals: keep only the cheapest per (origin, destination) route. */
function deduplicateDeals(deals: Deal[]): Deal[] {
  const best = new Map<string, Deal>();
  for (const deal of deals) {
    const key = `${deal.origin}:${deal.destination}`;
    const existing = best.get(key);
    if (!existing || deal.price < existing.price) {
      best.set(key, deal);
    }
  }
  return Array.from(best.values());
}

function App() {
  const { provider, isDemo, providerError, setProviderError } = useFlightDataProvider();
  const [watches, setWatches] = useLocalState<Watch[]>('flight-deals:watches', []);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedWatch, setSelectedWatch] = useState<Watch | null>(null);
  const [historyRoute, setHistoryRoute] = useState<{
    origin: string;
    destination: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [isBackgroundRefresh, setIsBackgroundRefresh] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [minutesAgo, setMinutesAgo] = useState<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshDeals = useCallback(async (background = false) => {
    if (watches.length === 0) {
      setDeals([]);
      return;
    }
    if (background) {
      setIsBackgroundRefresh(true);
    } else {
      setLoading(true);
    }
    try {
      const newDeals = await provider.getDeals(watches);
      setDeals(deduplicateDeals(newDeals));
      setLastChecked(new Date());
      setMinutesAgo(0);
      setProviderError(null);
    } catch (err) {
      setProviderError(err instanceof Error ? err.message : String(err));
      setDeals([]);
    } finally {
      setLoading(false);
      setIsBackgroundRefresh(false);
    }
  }, [watches, provider, setProviderError]);

  // Initial fetch + set up 30-minute polling interval
  useEffect(() => {
    refreshDeals();

    if (watches.length === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      refreshDeals(true);
    }, REFRESH_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [refreshDeals, watches.length]);

  // Tick the "X min ago" counter every minute
  useEffect(() => {
    if (!lastChecked) return;
    const tick = setInterval(() => {
      setMinutesAgo(Math.floor((Date.now() - lastChecked.getTime()) / 60_000));
    }, 60_000);
    return () => clearInterval(tick);
  }, [lastChecked]);

  function addWatch(watch: Watch) {
    setWatches((prev) => [...prev, watch]);
  }

  function deleteWatch(id: string) {
    setWatches((prev) => prev.filter((w) => w.id !== id));
    if (selectedWatch?.id === id) {
      setSelectedWatch(null);
    }
  }

  function handleViewHistory(origin: string, destination: string) {
    setHistoryRoute({ origin, destination });
  }

  const visibleDeals = selectedWatch
    ? deals.filter((d) => d.watchId === selectedWatch.id)
    : deals;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      {/* Demo mode banner */}
      {isDemo && (
        <div
          className="text-center text-sm py-2 px-4"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--accent-2) 20%, var(--bg))',
            color: 'var(--accent-2)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          Demo mode &mdash; prices are simulated. Add Amadeus API keys for real prices.
        </div>
      )}

      {/* Error banner */}
      {providerError && (
        <div
          className="text-center text-sm py-2 px-4"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--accent-3) 15%, var(--bg))',
            color: 'var(--accent-3)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          Amadeus API error: {providerError}
        </div>
      )}

      {/* Header */}
      <header className="border-b sticky top-0 z-40 backdrop-blur-sm" style={{ borderColor: 'var(--border)', backgroundColor: 'color-mix(in srgb, var(--bg) 80%, transparent)' }}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--accent)' }}>
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
              Flight Deals
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemePicker />
            <div className="text-xs" style={{ color: 'var(--text-dim)' }}>
              {watches.length} watch{watches.length !== 1 ? 'es' : ''} active
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Dashboard Stats */}
        <DashboardStats deals={deals} watches={watches} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar: Watches */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Watches</h2>
              {selectedWatch && (
                <button
                  onClick={() => setSelectedWatch(null)}
                  className="text-xs"
                  style={{ color: 'var(--accent)' }}
                >
                  Show all deals
                </button>
              )}
            </div>
            <WatchForm onAdd={addWatch} />
            <WatchList
              watches={watches}
              onDelete={deleteWatch}
              onSelect={setSelectedWatch}
              selectedId={selectedWatch?.id ?? null}
            />
          </div>

          {/* Main: Deal Feed */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                {selectedWatch ? 'Deals for Watch' : 'All Deals'}
                {loading && (
                  <span className="ml-2 text-sm font-normal" style={{ color: 'var(--text-dim)' }}>
                    refreshing...
                  </span>
                )}
                {!loading && isBackgroundRefresh && (
                  <span className="ml-2 text-sm font-normal" style={{ color: 'var(--text-dim)' }}>
                    auto-refreshing...
                  </span>
                )}
                {!loading && !isBackgroundRefresh && lastChecked && (
                  <span className="ml-2 text-sm font-normal" style={{ color: 'var(--text-dim)' }}>
                    checked {minutesAgo === 0 ? 'just now' : `${minutesAgo}m ago`}
                  </span>
                )}
              </h2>
              <span className="text-sm" style={{ color: 'var(--text-dim)' }}>
                {visibleDeals.length} deal{visibleDeals.length !== 1 ? 's' : ''} found
              </span>
            </div>

            {historyRoute && (
              <PriceHistoryPanel
                origin={historyRoute.origin}
                destination={historyRoute.destination}
                onClose={() => setHistoryRoute(null)}
              />
            )}

            <DealFeed deals={visibleDeals} onViewHistory={handleViewHistory} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12 py-6 text-center text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}>
        Flight Deals Watcher &middot; {isDemo ? 'Mock data for demonstration \u00b7 Prices are simulated' : 'Powered by Amadeus API'}
      </footer>
    </div>
  );
}

export default App;
