import { useState, useEffect } from 'react';
import { LoginForm } from './components/LoginForm';
import { SignupForm } from './components/SignupForm';
import { Dashboard } from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import PaymentInpayPage from './components/PaymentInpayPage';
import { ToastProvider } from './components/ToastContainer';
import { UserType } from './types';
import api from './utils/api';

type AppMode = 'login' | 'signup' | 'dashboard' | 'admin';

function App() {
  const [appMode, setAppMode] = useState<AppMode>('signup');
  const [user, setUser] = useState<UserType | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('auth_token');
    if (token) {
      // Try to get current user
      api.getCurrentUser().then(response => {
        if (response.success && response.data) {
          setUser(response.data);
          // Check if admin
          const userData = response.data as any;
          if (userData.is_admin) {
            setAppMode('admin');
          } else {
            setAppMode('dashboard');
          }
        } else {
          localStorage.removeItem('auth_token');
          setAppMode('signup');
        }
      });
    } else {
      setAppMode('signup');
    }
    const onAuthExpired = () => {
      setUser(null);
      setAppMode('signup');
    };
    window.addEventListener('auth:expired', onAuthExpired);
    return () => window.removeEventListener('auth:expired', onAuthExpired);
  }, []);

  const handleLogin = async (phoneNumber: string, countryCode: string, password: string) => {
    const response = await api.login(phoneNumber, password, countryCode);
    if (response.success && response.data) {
      localStorage.setItem('auth_token', response.data.token);
      setUser(response.data.user);
      setAppMode(response.data.user.is_admin ? 'admin' : 'dashboard');
      return;
    }
    throw new Error(response.error || 'Erreur de connexion');
  };

  const handleSignupSuccess = async (phoneNumber: string, countryCode: string, fullName: string, password: string, referralCode?: string) => {
    // After signup and verification, token should already be in localStorage (SignupForm stored it)
    const resp = await api.getCurrentUser();
    if (resp.success && resp.data) {
      setUser(resp.data);
      setAppMode((resp.data as any).is_admin ? 'admin' : 'dashboard');
      return;
    }
    throw new Error(resp.error || 'Impossible de récupérer l\'utilisateur après inscription');
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setAppMode('signup');
  };

  return (
    <ToastProvider>
      {typeof window !== 'undefined' && window.location.pathname.startsWith('/inpay') ? (
        <PaymentInpayPage />
      ) : appMode === 'login' ? (
        <LoginForm
          onSwitchToSignup={() => setAppMode('signup')}
          onLogin={(phone, country, password) => handleLogin(phone, country, password)}
        />
      ) : appMode === 'signup' ? (
        <SignupForm
          onSwitchToLogin={() => setAppMode('login')}
          onSignupSuccess={(phone, country, name, password, refCode) => handleSignupSuccess(phone, country, name, password, refCode)}
        />
      ) : appMode === 'admin' ? (
        <AdminDashboard user={user} onLogout={handleLogout} />
      ) : (
        <Dashboard user={user} onLogout={handleLogout} />
      )}
    </ToastProvider>
  );
}

export default App;