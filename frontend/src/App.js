import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import './App.css';

// Pages
import LandingPage from './pages/LandingPage';
import MenuPage from './pages/MenuPage';
import CartPage from './pages/CartPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import ContactPage from './pages/ContactPage';
import BackofficePage from './pages/BackofficePage';
import DemoPage from './pages/DemoPage';
import OnboardingPage from './pages/OnboardingPage';
import SignupPage from './pages/SignupPage';
import SubscriptionSuccessPage from './pages/SubscriptionSuccessPage';
import FloorPlanPage from './pages/FloorPlanPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <SocketProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<AdminLoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/demo" element={<DemoPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/subscription/success" element={<SubscriptionSuccessPage />} />
              <Route path="/subscription/cancel" element={<OnboardingPage />} />
              <Route path="/menu" element={<MenuPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/order-tracking" element={<OrderTrackingPage />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/payment-cancel" element={<PaymentCancel />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/backoffice" element={<BackofficePage />} />
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/floor-plan" element={<FloorPlanPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
            </Routes>
          </SocketProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

const PaymentSuccess = () => {
  const [searchParams] = new URLSearchParams(window.location.search);
  const sessionId = searchParams.get('session_id');
  const [checking, setChecking] = React.useState(true);
  const [orderStatus, setOrderStatus] = React.useState(null);

  React.useEffect(() => {
    if (sessionId) {
      checkPaymentStatus();
    }
  }, [sessionId]);

  const checkPaymentStatus = async () => {
    const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
    const maxAttempts = 5;
    let attempts = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setChecking(false);
        return;
      }

      try {
        const response = await fetch(`${API}/payments/checkout-status/${sessionId}`);
        const data = await response.json();

        if (data.payment_status === 'paid') {
          setOrderStatus('success');
          setChecking(false);
        } else if (data.status === 'expired') {
          setOrderStatus('error');
          setChecking(false);
        } else {
          attempts++;
          setTimeout(poll, 2000);
        }
      } catch (error) {
        console.error('Error checking payment:', error);
        attempts++;
        setTimeout(poll, 2000);
      }
    };

    poll();
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF5500] mx-auto mb-4"></div>
          <p className="text-[#71717A]">A verificar pagamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        {orderStatus === 'success' ? (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#18181B] mb-2">Pagamento Confirmado!</h2>
            <p className="text-[#71717A] mb-6">O seu pedido foi pago com sucesso</p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-[#FF5500] hover:bg-[#CC4400] text-white rounded-full py-3 px-6 font-bold transition-all"
            >
              Voltar ao Início
            </button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#18181B] mb-2">Erro no Pagamento</h2>
            <p className="text-[#71717A] mb-6">Houve um erro ao processar o pagamento</p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-[#FF5500] hover:bg-[#CC4400] text-white rounded-full py-3 px-6 font-bold transition-all"
            >
              Voltar ao Início
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const PaymentCancel = () => {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-[#18181B] mb-2">Pagamento Cancelado</h2>
        <p className="text-[#71717A] mb-6">O pagamento foi cancelado. Pode tentar novamente.</p>
        <button
          onClick={() => window.location.href = '/'}
          className="bg-[#FF5500] hover:bg-[#CC4400] text-white rounded-full py-3 px-6 font-bold transition-all"
        >
          Voltar ao Início
        </button>
      </div>
    </div>
  );
};

export default App;
