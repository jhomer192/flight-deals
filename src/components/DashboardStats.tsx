import type { Deal, Watch } from '../lib/types';

interface Props {
  deals: Deal[];
  watches: Watch[];
}

export function DashboardStats({ deals, watches }: Props) {
  const cheapest = deals.length
    ? deals.reduce((a, b) => (a.price < b.price ? a : b))
    : null;

  const avgSavings = deals.length
    ? Math.round(
        deals.reduce((sum, d) => sum + d.savingsPercent, 0) / deals.length,
      )
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
        <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">
          Active Watches
        </div>
        <div className="text-3xl font-bold text-white">{watches.length}</div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
        <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">
          Cheapest Deal
        </div>
        <div className="text-3xl font-bold text-green-400">
          {cheapest ? `$${cheapest.price}` : '—'}
        </div>
        {cheapest && (
          <div className="text-xs text-slate-500 mt-1">
            {cheapest.origin} &rarr; {cheapest.destination}
          </div>
        )}
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
        <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">
          Avg Savings
        </div>
        <div className="text-3xl font-bold text-blue-400">
          {deals.length ? `${avgSavings}%` : '—'}
        </div>
        {deals.length > 0 && (
          <div className="text-xs text-slate-500 mt-1">
            across {deals.length} deal{deals.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}
