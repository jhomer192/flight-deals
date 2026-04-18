import type { Deal } from '../lib/types';
import { getAirport } from '../lib/airport-search';

interface Props {
  deal: Deal;
  onViewHistory: (origin: string, destination: string) => void;
}

function airportLabel(code: string): string {
  const a = getAirport(code);
  return a ? `${code} \u2014 ${a.city}` : code;
}

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function buildBookingUrl(deal: Deal): string {
  const params = new URLSearchParams({
    hl: 'en',
    gl: 'us',
    curr: 'USD',
  });
  // Kayak works reliably with IATA codes and dates in the URL
  return `https://www.kayak.com/flights/${deal.origin}-${deal.destination}/${deal.departDate}/${deal.returnDate}?sort=bestflight_a`;
}

export function DealCard({ deal, onViewHistory }: Props) {
  return (
    <div className="border rounded-xl p-4 transition-colors" style={{ backgroundColor: 'color-mix(in srgb, var(--surface) 60%, transparent)', borderColor: 'var(--border)' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Route */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-bold text-sm" style={{ color: 'var(--text)' }}>
              {airportLabel(deal.origin)}
            </span>
            <svg className="w-4 h-4 shrink-0" style={{ color: 'var(--text-dim)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            <span className="font-mono font-bold text-sm" style={{ color: 'var(--text)' }}>
              {airportLabel(deal.destination)}
            </span>
          </div>

          {/* Details */}
          <div className="mt-2 flex items-center gap-3 text-xs flex-wrap" style={{ color: 'var(--text-dim)' }}>
            <span>{deal.airline}</span>
            <span style={{ color: 'var(--border)' }}>|</span>
            <span>
              {formatDate(deal.departDate)} {'\u2014'} {formatDate(deal.returnDate)}
            </span>
          </div>
        </div>

        {/* Price + savings */}
        <div className="text-right shrink-0">
          <div className="text-xl font-bold" style={{ color: 'var(--text)' }}>
            ${deal.price}
          </div>
          <div className="text-xs line-through" style={{ color: 'var(--text-dim)' }}>
            ${deal.maxBudget}
          </div>
          <div className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full border" style={{ color: 'var(--accent)', backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)', borderColor: 'color-mix(in srgb, var(--accent) 30%, transparent)' }}>
            -{deal.savingsPercent}%
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <button
          onClick={() => onViewHistory(deal.origin, deal.destination)}
          className="text-xs transition-colors cursor-pointer"
          style={{ color: 'var(--accent-2)' }}
        >
          View price history &rarr;
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => window.open(`https://www.google.com/travel/flights?q=Flights+${deal.origin}+to+${deal.destination}+on+${deal.departDate}+return+${deal.returnDate}`, '_blank', 'noopener')}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer border"
            style={{ color: 'var(--accent)', borderColor: 'var(--accent)', backgroundColor: 'transparent' }}
          >
            Google
          </button>
          <button
            onClick={() => window.open(buildBookingUrl(deal), '_blank', 'noopener')}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--bg)' }}
          >
            Kayak &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
