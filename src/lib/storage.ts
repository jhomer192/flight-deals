import type { Watch, Deal, RouteHistory } from './types';

const WATCHES_KEY = 'flight-deals:watches';
const DEALS_KEY = 'flight-deals:deals';
const HISTORY_KEY = 'flight-deals:history';

export function loadWatches(): Watch[] {
  try {
    const raw = localStorage.getItem(WATCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveWatches(watches: Watch[]): void {
  localStorage.setItem(WATCHES_KEY, JSON.stringify(watches));
}

export function loadDeals(): Deal[] {
  try {
    const raw = localStorage.getItem(DEALS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveDeals(deals: Deal[]): void {
  localStorage.setItem(DEALS_KEY, JSON.stringify(deals));
}

export function loadHistory(): RouteHistory[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveHistory(history: RouteHistory[]): void {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}
