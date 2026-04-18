import type { Deal } from '../lib/types';
import { getAirport } from '../lib/airport-search';

interface Props {
  deal: Deal;
  onViewHistory: (origin: string, destination: string) => void;
}

function airportLabel(code: string): string {
  const a = getAirport(code);
  return a ? `${code} — ${a.city}` : code;
}

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function DealCard({ deal, onViewHistory }: Props) {
  const savingsColor =
    deal.savingsPercent >= 40
      ? 'text-green-400 bg-green-400/10 border-green-400/30'
      : deal.savingsPercent >= 20
        ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30'
        : 'text-teal-400 bg-teal-400/10 border-teal-400/30';

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Route */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-bold text-white text-sm">
              {airportLabel(deal.origin)}
            </span>
            <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            <span className="font-mono font-bold text-white text-sm">
              {airportLabel(deal.destination)}
            </span>
          </div>

          {/* Details */}
          <div className="mt-2 flex items-center gap-3 text-xs text-slate-400 flex-wrap">
            <span>{deal.airline}</span>
            <span className="text-slate-600">|</span>
            <span>
              {formatDate(deal.departDate)} — {formatDate(deal.returnDate)}
            </span>
          </div>
        </div>

        {/* Price + savings */}
        <div className="text-right shrink-0">
          <div className="text-xl font-bold text-white">
            ${deal.price}
          </div>
          <div className="text-xs text-slate-500 line-through">
            ${deal.maxBudget}
          </div>
          <div className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${savingsColor}`}>
            -{deal.savingsPercent}%
          </div>
        </div>
      </div>

      <button
        onClick={() => onViewHistory(deal.origin, deal.destination)}
        className="mt-3 text-xs text-blue-400 hover:text-blue-300 transition-colors"
      >
        View price history &rarr;
      </button>
    </div>
  );
}
