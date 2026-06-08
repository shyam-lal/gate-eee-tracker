import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './contexts/ThemeContext'
import { CreditProvider } from './contexts/CreditContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <CreditProvider>
        <App />
      </CreditProvider>
    </ThemeProvider>
  </StrictMode>,
)
