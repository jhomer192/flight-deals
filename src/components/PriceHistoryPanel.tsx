import { useEffect, useState } from 'react';
import type { PricePoint } from '../lib/types';
import { MockFlightDataProvider } from '../lib/mock-provider';
import { getAirport } from '../lib/airport-search';
import { Sparkline } from './Sparkline';

interface Props {
  origin: string;
  destination: string;
  onClose: () => void;
}

const provider = new MockFlightDataProvider();

export function PriceHistoryPanel({ origin, destination, onClose }: Props) {
  const [prices, setPrices] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    provider.getPriceHistory(origin, destination).then((data) => {
      setPrices(data);
      setLoading(false);
    });
  }, [origin, destination]);

  const originLabel = getAirport(origin);
  const destLabel = getAirport(destination);

  const values = prices.map((p) => p.price);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;
  const avg = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;

  return (
    <div className="border rounded-xl p-5" style={{ backgroundColor: 'color-mix(in srgb, var(--surface) 70%, transparent)', borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold" style={{ color: 'var(--text)' }}>
          30-Day Price History:{' '}
          <span className="font-mono">
            {origin} ({originLabel?.city ?? '?'})
          </span>
          {' '}&rarr;{' '}
          <span className="font-mono">
            {destination} ({destLabel?.city ?? '?'})
          </span>
        </h3>
        <button
          onClick={onClose}
          className="text-xl leading-none"
          style={{ color: 'var(--text-dim)' }}
        >
          &times;
        </button>
      </div>

      {loading ? (
        <div className="h-32 flex items-center justify-center" style={{ color: 'var(--text-dim)' }}>
          Loading price data...
        </div>
      ) : (
        <>
          <Sparkline prices={prices} width={500} height={160} />
          <div className="grid grid-cols-3 gap-4 mt-4 text-center">
            <div>
              <div className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-dim)' }}>Lowest</div>
              <div className="text-lg font-bold" style={{ color: 'var(--accent)' }}>${min}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-dim)' }}>Average</div>
              <div className="text-lg font-bold" style={{ color: 'var(--text)' }}>${avg}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-dim)' }}>Highest</div>
              <div className="text-lg font-bold" style={{ color: 'var(--accent-3)' }}>${max}</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
