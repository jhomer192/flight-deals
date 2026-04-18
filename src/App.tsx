import { useState, useEffect, useCallback } from 'react';
import { useLocalState } from './hooks/useLocalState';
import { MockFlightDataProvider } from './lib/mock-provider';
import type { Watch, Deal } from './lib/types';
import { WatchForm } from './components/WatchForm';
import { WatchList } from './components/WatchList';
import { DealFeed } from './components/DealFeed';
import { DashboardStats } from './components/DashboardStats';
import { PriceHistoryPanel } from './components/PriceHistoryPanel';
import { ThemePicker } from './components/ThemePicker';

const provider = new MockFlightDataProvider();

function App() {
  const [watches, setWatches] = useLocalState<Watch[]>('flight-deals:watches', []);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedWatch, setSelectedWatch] = useState<Watch | null>(null);
  const [historyRoute, setHistoryRoute] = useState<{
    origin: string;
    destination: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshDeals = useCallback(async () => {
    if (watches.length === 0) {
      setDeals([]);
      return;
    }
    setLoading(true);
    const newDeals = await provider.getDeals(watches);
    setDeals(newDeals);
    setLoading(false);
  }, [watches]);

  useEffect(() => {
    refreshDeals();
  }, [refreshDeals]);

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
        Flight Deals Watcher &middot; Mock data for demonstration &middot; Prices are simulated
      </footer>
    </div>
  );
}

export default App;
