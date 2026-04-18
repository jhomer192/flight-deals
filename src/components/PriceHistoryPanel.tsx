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
    <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">
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
          className="text-slate-400 hover:text-white text-xl leading-none"
        >
          &times;
        </button>
      </div>

      {loading ? (
        <div className="h-32 flex items-center justify-center text-slate-500">
          Loading price data...
        </div>
      ) : (
        <>
          <Sparkline prices={prices} width={500} height={160} />
          <div className="grid grid-cols-3 gap-4 mt-4 text-center">
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wide">Lowest</div>
              <div className="text-lg font-bold text-green-400">${min}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wide">Average</div>
              <div className="text-lg font-bold text-slate-300">${avg}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wide">Highest</div>
              <div className="text-lg font-bold text-red-400">${max}</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
