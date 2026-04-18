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
      <div className="text-center py-8 text-slate-500">
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
          className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
            selectedId === w.id
              ? 'bg-blue-600/20 border border-blue-500/40'
              : 'bg-slate-800/50 border border-slate-700 hover:border-slate-600'
          }`}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-mono font-bold text-white">
                {formatAirport(w.homeAirport)}
              </span>
              <span className="text-slate-500">&rarr;</span>
              <span className="font-mono font-bold text-white">
                {formatAirport(w.destination)}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Under ${w.maxBudget} &middot; {w.dateRangeStart} to {w.dateRangeEnd}
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(w.id);
            }}
            className="text-slate-500 hover:text-red-400 ml-3 text-lg leading-none transition-colors"
            title="Delete watch"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}
