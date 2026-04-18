import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { FlightDataProvider } from './types';
import { MockFlightDataProvider } from './mock-provider';
import { AmadeusFlightDataProvider } from './amadeus-provider';

interface ProviderState {
  provider: FlightDataProvider;
  isDemo: boolean;
  /** Non-null when the Amadeus provider threw an error */
  providerError: string | null;
  setProviderError: (err: string | null) => void;
}

const FlightDataContext = createContext<ProviderState | null>(null);

function createProvider(): { provider: FlightDataProvider; isDemo: boolean } {
  const clientId = import.meta.env.VITE_AMADEUS_CLIENT_ID as string | undefined;
  const clientSecret = import.meta.env.VITE_AMADEUS_CLIENT_SECRET as string | undefined;

  if (clientId && clientSecret) {
    return {
      provider: new AmadeusFlightDataProvider(clientId, clientSecret),
      isDemo: false,
    };
  }

  return { provider: new MockFlightDataProvider(), isDemo: true };
}

export function FlightDataProviderRoot({ children }: { children: ReactNode }) {
  const [state] = useState(createProvider);
  const [providerError, setProviderError] = useState<string | null>(null);

  // Clear error after 15 seconds
  useEffect(() => {
    if (!providerError) return;
    const t = setTimeout(() => setProviderError(null), 15_000);
    return () => clearTimeout(t);
  }, [providerError]);

  return (
    <FlightDataContext.Provider
      value={{ ...state, providerError, setProviderError }}
    >
      {children}
    </FlightDataContext.Provider>
  );
}

export function useFlightDataProvider(): ProviderState {
  const ctx = useContext(FlightDataContext);
  if (!ctx) {
    throw new Error('useFlightDataProvider must be used within FlightDataProviderRoot');
  }
  return ctx;
}
