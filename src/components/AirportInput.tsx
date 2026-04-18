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
        setSelectedLabel(`${airports[0].code} \u2014 ${airports[0].city}`);
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
    setSelectedLabel(`${airport.code} \u2014 ${airport.city}`);
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
      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-dim)' }}>
        {label}
      </label>
      {value ? (
        <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
          <span className="flex-1 text-sm" style={{ color: 'var(--text)' }}>{selectedLabel}</span>
          <button
            type="button"
            onClick={clear}
            className="text-lg leading-none"
            style={{ color: 'var(--text-dim)' }}
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
          className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
          style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
        />
      )}
      {open && !value && (
        <div className="absolute z-50 w-full mt-1 rounded-lg shadow-xl max-h-60 overflow-auto" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
          {allowAnywhere && (
            <button
              type="button"
              onClick={selectAnywhere}
              className="w-full text-left px-3 py-2 text-sm border-b"
              style={{ color: 'var(--accent-2)', borderColor: 'var(--border)' }}
            >
              Anywhere \u2014 find deals to any destination
            </button>
          )}
          {results.map((a) => (
            <button
              type="button"
              key={a.code}
              onClick={() => select(a)}
              className="w-full text-left px-3 py-2 text-sm transition-colors"
              style={{ color: 'var(--text)' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--border)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <span className="font-mono font-bold">{a.code}</span>
              <span className="ml-2" style={{ color: 'var(--text-dim)' }}>
                {a.city}, {a.country}
              </span>
              <span className="ml-1 text-xs" style={{ color: 'var(--text-dim)' }}>\u2014 {a.name}</span>
            </button>
          ))}
          {query.trim().length > 0 && results.length === 0 && (
            <div className="px-3 py-2 text-sm" style={{ color: 'var(--text-dim)' }}>
              No airports found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
