import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'
import { ActivateAccountScreen } from './components/auth/ActivateAccountScreen.tsx'
import { ForgotPasswordScreen } from './components/auth/ForgotPasswordScreen.tsx'
import { ResetPasswordScreen } from './components/auth/ResetPasswordScreen.tsx'
import { LandingPage } from './pages/marketing/LandingPage.tsx'
import { PaymentSuccessPage } from './pages/marketing/PaymentSuccessPage.tsx'
import { PaymentPendingPage } from './pages/marketing/PaymentPendingPage.tsx'
import { PaymentErrorPage } from './pages/marketing/PaymentErrorPage.tsx'

import "./main.css"
import "./styles/theme.css"
import "./index.css"

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <BrowserRouter>
      <Routes>
        {/* Landing pública */}
        <Route path="/" element={<LandingPage />} />

        {/* Rotas públicas de autenticação */}
        <Route path="/ativar" element={<ActivateAccountScreen />} />
        <Route path="/esqueci-senha" element={<ForgotPasswordScreen />} />
        <Route path="/redefinir-senha" element={<ResetPasswordScreen />} />

        {/* Rotas de retorno do Mercado Pago */}
        <Route path="/pagamento/sucesso" element={<PaymentSuccessPage />} />
        <Route path="/pagamento/pendente" element={<PaymentPendingPage />} />
        <Route path="/pagamento/erro" element={<PaymentErrorPage />} />

        {/* Alias: /login → /app */}
        <Route path="/login" element={<Navigate to="/app" replace />} />

        {/* App principal (com AuthWrapper) */}
        <Route path="/app/*" element={<App />} />
      </Routes>
    </BrowserRouter>
   </ErrorBoundary>
)
