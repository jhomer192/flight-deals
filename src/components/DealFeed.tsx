import type { Deal } from '../lib/types';
import { DealCard } from './DealCard';

interface Props {
  deals: Deal[];
  onViewHistory: (origin: string, destination: string) => void;
}

export function DealFeed({ deals, onViewHistory }: Props) {
  if (deals.length === 0) {
    return (
      <div className="text-center py-8" style={{ color: 'var(--text-dim)' }}>
        <p className="text-lg">No deals found yet</p>
        <p className="text-sm mt-1">
          Add a watch and deals below your budget will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {deals.map((deal) => (
        <DealCard key={deal.id} deal={deal} onViewHistory={onViewHistory} />
      ))}
    </div>
  );
}
