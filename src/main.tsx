import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { FlightDataProviderRoot } from './lib/provider-context'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FlightDataProviderRoot>
      <App />
    </FlightDataProviderRoot>
  </StrictMode>,
)
