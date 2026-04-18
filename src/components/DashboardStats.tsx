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
      <div className="rounded-xl p-4 text-center border" style={{ backgroundColor: 'color-mix(in srgb, var(--surface) 50%, transparent)', borderColor: 'var(--border)' }}>
        <div className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--text-dim)' }}>
          Active Watches
        </div>
        <div className="text-3xl font-bold" style={{ color: 'var(--text)' }}>{watches.length}</div>
      </div>

      <div className="rounded-xl p-4 text-center border" style={{ backgroundColor: 'color-mix(in srgb, var(--surface) 50%, transparent)', borderColor: 'var(--border)' }}>
        <div className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--text-dim)' }}>
          Cheapest Deal
        </div>
        <div className="text-3xl font-bold" style={{ color: 'var(--accent)' }}>
          {cheapest ? `$${cheapest.price}` : '\u2014'}
        </div>
        {cheapest && (
          <div className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
            {cheapest.origin} &rarr; {cheapest.destination}
          </div>
        )}
      </div>

      <div className="rounded-xl p-4 text-center border" style={{ backgroundColor: 'color-mix(in srgb, var(--surface) 50%, transparent)', borderColor: 'var(--border)' }}>
        <div className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--text-dim)' }}>
          Avg Savings
        </div>
        <div className="text-3xl font-bold" style={{ color: 'var(--accent-2)' }}>
          {deals.length ? `${avgSavings}%` : '\u2014'}
        </div>
        {deals.length > 0 && (
          <div className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
            across {deals.length} deal{deals.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}
