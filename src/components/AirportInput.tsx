import { useState, useRef, useEffect } from 'react';
import { searchAirports } from '../lib/airport-search';
import type { Airport } from '../lib/types';

interface Props {
  value: string;
  onChange: (code: string) => void;
  placeholder?: string;
  allowAnywhere?: boolean;
  label: string;
}

export function AirportInput({ value, onChange, placeholder, allowAnywhere, label }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Airport[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value && !selectedLabel) {
      const airports = searchAirports(value, 1);
      if (airports.length > 0) {
        setSelectedLabel(`${airports[0].code} — ${airports[0].city}`);
      } else if (value === 'anywhere') {
        setSelectedLabel('Anywhere');
      }
    }
  }, [value, selectedLabel]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleInput(q: string) {
    setQuery(q);
    setOpen(true);
    if (q.trim().length > 0) {
      setResults(searchAirports(q, 8));
    } else {
      setResults([]);
    }
  }

  function select(airport: Airport) {
    onChange(airport.code);
    setSelectedLabel(`${airport.code} — ${airport.city}`);
    setQuery('');
    setResults([]);
    setOpen(false);
  }

  function selectAnywhere() {
    onChange('anywhere');
    setSelectedLabel('Anywhere');
    setQuery('');
    setResults([]);
    setOpen(false);
  }

  function handleFocus() {
    setOpen(true);
    if (query.trim().length > 0) {
      setResults(searchAirports(query, 8));
    }
  }

  function clear() {
    onChange('');
    setSelectedLabel('');
    setQuery('');
    setResults([]);
  }

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-slate-400 mb-1">
        {label}
      </label>
      {value ? (
        <div className="flex items-center gap-2 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2">
          <span className="text-white flex-1 text-sm">{selectedLabel}</span>
          <button
            type="button"
            onClick={clear}
            className="text-slate-400 hover:text-white text-lg leading-none"
          >
            &times;
          </button>
        </div>
      ) : (
        <input
          type="text"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={handleFocus}
          placeholder={placeholder ?? 'Search airports...'}
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
        />
      )}
      {open && !value && (
        <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl max-h-60 overflow-auto">
          {allowAnywhere && (
            <button
              type="button"
              onClick={selectAnywhere}
              className="w-full text-left px-3 py-2 hover:bg-slate-700 text-blue-400 text-sm border-b border-slate-700"
            >
              Anywhere — find deals to any destination
            </button>
          )}
          {results.map((a) => (
            <button
              type="button"
              key={a.code}
              onClick={() => select(a)}
              className="w-full text-left px-3 py-2 hover:bg-slate-700 text-sm"
            >
              <span className="text-white font-mono font-bold">{a.code}</span>
              <span className="text-slate-400 ml-2">
                {a.city}, {a.country}
              </span>
              <span className="text-slate-500 ml-1 text-xs">— {a.name}</span>
            </button>
          ))}
          {query.trim().length > 0 && results.length === 0 && (
            <div className="px-3 py-2 text-slate-500 text-sm">
              No airports found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
