import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'
import { ActivateAccountScreen } from './components/auth/ActivateAccountScreen.tsx'
import { ForgotPasswordScreen } from './components/auth/ForgotPasswordScreen.tsx'
import { ResetPasswordScreen } from './components/auth/ResetPasswordScreen.tsx'

import "./main.css"
import "./styles/theme.css"
import "./index.css"

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <BrowserRouter>
      <Routes>
        {/* Rotas públicas de autenticação */}
        <Route path="/ativar" element={<ActivateAccountScreen />} />
        <Route path="/esqueci-senha" element={<ForgotPasswordScreen />} />
        <Route path="/redefinir-senha" element={<ResetPasswordScreen />} />
        
        {/* App principal (com AuthWrapper) */}
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
   </ErrorBoundary>
)
