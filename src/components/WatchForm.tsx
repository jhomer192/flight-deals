import { useState } from 'react';
import { AirportInput } from './AirportInput';
import type { Watch } from '../lib/types';

interface Props {
  onAdd: (watch: Watch) => void;
}

export function WatchForm({ onAdd }: Props) {
  const [homeAirport, setHomeAirport] = useState('');
  const [destination, setDestination] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [expanded, setExpanded] = useState(false);

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
      createdAt: new Date().toISOString(),
    };

    onAdd(watch);
    setHomeAirport('');
    setDestination('');
    setMaxBudget('');
    setDateStart('');
    setDateEnd('');
    setExpanded(false);
  }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
      >
        + Add Watch
      </button>
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 space-y-4"
    >
      <h3 className="text-lg font-semibold text-white">New Price Watch</h3>

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
        <label className="block text-sm font-medium text-slate-400 mb-1">
          Max Budget (round-trip, USD)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            $
          </span>
          <input
            type="number"
            min={50}
            max={10000}
            step={10}
            value={maxBudget}
            onChange={(e) => setMaxBudget(e.target.value)}
            placeholder="500"
            className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-7 pr-3 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">
            Earliest Departure
          </label>
          <input
            type="date"
            min={today}
            value={dateStart}
            onChange={(e) => setDateStart(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 [color-scheme:dark]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">
            Latest Departure
          </label>
          <input
            type="date"
            min={dateStart || today}
            value={dateEnd}
            onChange={(e) => setDateEnd(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 [color-scheme:dark]"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!homeAirport || !destination || !maxBudget || !dateStart || !dateEnd}
          className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors"
        >
          Start Watching
        </button>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="px-4 py-2.5 text-slate-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
