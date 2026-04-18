import { useState, useCallback } from 'react';

/**
 * Like useState, but persists to localStorage under the given key.
 */
export function useLocalState<T>(key: string, initial: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [value, setValueRaw] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initial;
    } catch {
      return initial;
    }
  });

  const setValue = useCallback(
    (v: T | ((prev: T) => T)) => {
      setValueRaw((prev) => {
        const next = typeof v === 'function' ? (v as (prev: T) => T)(prev) : v;
        localStorage.setItem(key, JSON.stringify(next));
        return next;
      });
    },
    [key],
  );

  return [value, setValue];
}
