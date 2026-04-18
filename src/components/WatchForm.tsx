import { useState } from 'react';
import { AirportInput } from './AirportInput';
import type { Watch } from '../lib/types';

interface Props {
  onAdd: (watch: Watch) => void;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function WatchForm({ onAdd }: Props) {
  const [homeAirport, setHomeAirport] = useState('');
  const [destination, setDestination] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [returnStart, setReturnStart] = useState('');
  const [returnEnd, setReturnEnd] = useState('');
  const [separateReturn, setSeparateReturn] = useState(false);
  const [watchDays, setWatchDays] = useState<number[]>([]);
  const [expanded, setExpanded] = useState(false);

  function toggleDay(day: number) {
    setWatchDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!homeAirport || !destination || !maxBudget || !dateStart || !dateEnd) return;

    const watch: Watch = {
      id: `w-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      homeAirport,
      destination,
      maxBudget: Number(maxBudget),
      dateRangeStart: dateStart,
      dateRangeEnd: dateEnd,
      returnRangeStart: separateReturn && returnStart ? returnStart : undefined,
      returnRangeEnd: separateReturn && returnEnd ? returnEnd : undefined,
      watchDays: watchDays.length > 0 ? watchDays : undefined,
      createdAt: new Date().toISOString(),
    };

    onAdd(watch);
    setHomeAirport('');
    setDestination('');
    setMaxBudget('');
    setDateStart('');
    setDateEnd('');
    setReturnStart('');
    setReturnEnd('');
    setWatchDays([]);
    setSeparateReturn(false);
    setExpanded(false);
  }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full font-semibold py-3 px-6 rounded-xl transition-colors"
        style={{ backgroundColor: 'var(--accent)', color: 'var(--bg)' }}
      >
        + Add Watch
      </button>
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form
      onSubmit={handleSubmit}
      className="border rounded-xl p-5 space-y-4"
      style={{ backgroundColor: 'color-mix(in srgb, var(--surface) 50%, transparent)', borderColor: 'var(--border)' }}
    >
      <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>New Price Watch</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AirportInput
          label="From (Home Airport)"
          value={homeAirport}
          onChange={setHomeAirport}
          placeholder="e.g. JFK, LAX, London..."
        />
        <AirportInput
          label="To (Destination)"
          value={destination}
          onChange={setDestination}
          placeholder="e.g. Tokyo, BCN..."
          allowAnywhere
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-dim)' }}>
          Max Budget (round-trip, USD)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-dim)' }}>$</span>
          <input
            type="number"
            min={50}
            max={10000}
            step={10}
            value={maxBudget}
            onChange={(e) => setMaxBudget(e.target.value)}
            placeholder="500"
            className="w-full rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none"
            style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
        </div>
      </div>

      {/* Departure dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-dim)' }}>
            Earliest Departure
          </label>
          <input
            type="date"
            min={today}
            value={dateStart}
            onChange={(e) => setDateStart(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none [color-scheme:dark]"
            style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-dim)' }}>
            Latest Departure
          </label>
          <input
            type="date"
            min={dateStart || today}
            value={dateEnd}
            onChange={(e) => setDateEnd(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none [color-scheme:dark]"
            style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
        </div>
      </div>

      {/* Separate return dates toggle */}
      <label className="flex items-center gap-2 cursor-pointer group">
        <input
          type="checkbox"
          checked={separateReturn}
          onChange={(e) => setSeparateReturn(e.target.checked)}
          className="w-4 h-4 rounded cursor-pointer"
          style={{ accentColor: 'var(--accent)' }}
        />
        <span className="text-sm group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-dim)' }}>
          Different return dates
        </span>
      </label>

      {separateReturn && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-dim)' }}>
              Earliest Return
            </label>
            <input
              type="date"
              min={dateStart || today}
              value={returnStart}
              onChange={(e) => setReturnStart(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none [color-scheme:dark]"
              style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-dim)' }}>
              Latest Return
            </label>
            <input
              type="date"
              min={returnStart || dateStart || today}
              value={returnEnd}
              onChange={(e) => setReturnEnd(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none [color-scheme:dark]"
              style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
          </div>
        </div>
      )}

      {/* Day of week filter */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-dim)' }}>
          Departure days (optional)
        </label>
        <div className="flex gap-1.5">
          {DAY_LABELS.map((label, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggleDay(i)}
              className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                backgroundColor: watchDays.includes(i) ? 'var(--accent)' : 'var(--bg)',
                color: watchDays.includes(i) ? 'var(--bg)' : 'var(--text-dim)',
                border: `1px solid ${watchDays.includes(i) ? 'var(--accent)' : 'var(--border)'}`,
              }}
            >
              {label}
            </button>
          ))}
        </div>
        {watchDays.length > 0 && (
          <p className="text-xs mt-1.5" style={{ color: 'var(--text-dim)' }}>
            Only showing flights departing on {watchDays.map(d => DAY_LABELS[d]).join(', ')}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!homeAirport || !destination || !maxBudget || !dateStart || !dateEnd}
          className="flex-1 font-semibold py-2.5 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: 'var(--accent)', color: 'var(--bg)' }}
        >
          Start Watching
        </button>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="px-4 py-2.5 transition-colors"
          style={{ color: 'var(--text-dim)' }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
