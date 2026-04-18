import type { Watch } from '../lib/types';
import { getAirport } from '../lib/airport-search';

interface Props {
  watches: Watch[];
  onDelete: (id: string) => void;
  onSelect: (watch: Watch) => void;
  selectedId: string | null;
}

function formatAirport(code: string): string {
  if (code === 'anywhere') return 'Anywhere';
  const airport = getAirport(code);
  return airport ? `${code} (${airport.city})` : code;
}

export function WatchList({ watches, onDelete, onSelect, selectedId }: Props) {
  if (watches.length === 0) {
    return (
      <div className="text-center py-8" style={{ color: 'var(--text-dim)' }}>
        <p className="text-lg">No active watches</p>
        <p className="text-sm mt-1">Add a watch to start tracking flight prices</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {watches.map((w) => (
        <div
          key={w.id}
          onClick={() => onSelect(w)}
          className="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors border"
          style={selectedId === w.id
            ? { backgroundColor: 'color-mix(in srgb, var(--accent) 15%, transparent)', borderColor: 'color-mix(in srgb, var(--accent) 40%, transparent)' }
            : { backgroundColor: 'color-mix(in srgb, var(--surface) 50%, transparent)', borderColor: 'var(--border)' }}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-mono font-bold" style={{ color: 'var(--text)' }}>
                {formatAirport(w.homeAirport)}
              </span>
              <span style={{ color: 'var(--text-dim)' }}>&rarr;</span>
              <span className="font-mono font-bold" style={{ color: 'var(--text)' }}>
                {formatAirport(w.destination)}
              </span>
            </div>
            <div className="text-xs mt-1 space-y-0.5" style={{ color: 'var(--text-dim)' }}>
              <div>Under ${w.maxBudget} &middot; Depart {w.dateRangeStart} to {w.dateRangeEnd}</div>
              {w.returnRangeStart && w.returnRangeEnd && (
                <div>Return {w.returnRangeStart} to {w.returnRangeEnd}</div>
              )}
              {w.watchDays && w.watchDays.length > 0 && (
                <div>{w.watchDays.map(d => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', ')} only</div>
              )}
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(w.id);
            }}
            className="ml-3 text-lg leading-none transition-colors hover:text-red-400"
            style={{ color: 'var(--text-dim)' }}
            title="Delete watch"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}
