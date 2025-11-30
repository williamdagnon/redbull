import React, { useState, useEffect } from 'react';
import { PhoneInput } from './PhoneInput';
import { OTPInput } from './OTPInput';
import { Shield, CheckCircle, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Logo } from './Logo';
import { useToast } from './ToastContainer';
import { COUNTRIES } from '../constants';
import { Country } from '../types';
import { validatePhoneNumber } from '../utils/calculations';
import api from '../utils/api';

interface SignupFormProps {
  onSwitchToLogin: () => void;
  onSignupSuccess: (phoneNumber: string, countryCode: string, fullName: string, password: string, referralCode?: string) => void;
}

export const SignupForm: React.FC<SignupFormProps> = ({ onSwitchToLogin, onSignupSuccess }) => {
  const [step, setStep] = useState<'registration' | 'verification' | 'success'>('registration');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]); // Côte d'Ivoire par défaut
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const [countdown, setCountdown] = useState(0);
  const [errors, setErrors] = useState<{
    phone?: string;
    password?: string;
    fullName?: string;
    referral?: string;
    otp?: string;
    general?: string;
  }>({});

  // Extract referral code from URL on component mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (refCode) {
      setReferralCode(refCode.toUpperCase());
    }
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const validatePassword = (pwd: string): boolean => {
    return pwd.length >= 6;
  };

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: typeof errors = {};
    
    if (!phoneNumber.trim()) {
      newErrors.phone = 'Le numéro de téléphone est requis';
    } else if (!validatePhoneNumber(phoneNumber, selectedCountry.code)) {
      newErrors.phone = 'Format de numéro invalide pour ce pays';
    }

    if (!password.trim()) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (!validatePassword(password)) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    if (!fullName.trim()) {
      newErrors.fullName = 'Le nom complet est requis';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.signup({
        phone: phoneNumber,
        password,
        full_name: fullName,
        country_code: selectedCountry.code,
        referral_code: referralCode || undefined
      });

      if (!response.success) {
        throw new Error(response.error || 'Inscription échouée');
      }

      // Store token locally (signup returns token)
      if (response.data && response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
      }

      // Request server to send verification code (OTP)
      try {
        const sendResp = await api.sendCode(phoneNumber, selectedCountry.code, 'signup');
        if (sendResp && sendResp.success && sendResp.data) {
          const code = (sendResp.data as { code?: string }).code;
          if (code) setOtp(code);
        }
      } catch (err) {
        console.warn('send-code error', err);
      }
      // Clear any previous OTP errors and proceed to verification step
      setErrors({});
      // Move to verification step
      setStep('verification');
      setCountdown(60);
    } catch (error: unknown) {
      const e = error as Error;
      setErrors({ general: e?.message || 'Erreur lors de l\'inscription' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (otp.length !== 6) {
      setErrors({ otp: 'Le code doit contenir 6 chiffres' });
      return;
    }

    setIsLoading(true);
    try {
      const resp = await api.verifyCode(phoneNumber, selectedCountry.code, otp);
      if (!resp.success) {
        throw new Error(resp.error || 'Vérification échouée');
      }

      setStep('success');
      // Auto-redirect to dashboard after 2 seconds
      setTimeout(() => {
        onSignupSuccess(phoneNumber, selectedCountry.code, fullName, password, referralCode || undefined);
      }, 2000);
    } catch (error: unknown) {
      const e = error as Error;
      setErrors({ otp: e?.message || 'Code de vérification incorrect' });
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP logic reusable for both form submit and auto-complete
  const verifyOTP = async () => {
    setErrors({});

    if (otp.length !== 6) {
      setErrors({ otp: 'Le code doit contenir 6 chiffres' });
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    try {
      const resp = await api.verifyCode(phoneNumber, selectedCountry.code, otp);
      if (!resp.success) throw new Error(resp.error || 'Vérification échouée');
      setStep('success');
      setTimeout(() => {
        onSignupSuccess(phoneNumber, selectedCountry.code, fullName, password, referralCode || undefined);
      }, 2000);
    } catch (error: unknown) {
      const e = error as Error;
      setErrors({ otp: e?.message || 'Code de vérification incorrect' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    try {
      const resp = await api.sendCode(phoneNumber, selectedCountry.code, 'signup');
      if (resp.success) {
        if (resp.data) {
          const code = (resp.data as { code?: string }).code;
          if (code) setOtp(code);
        }
        setCountdown(60);
        toast.success('Code renvoyé');
      } else {
        throw new Error(resp.error || "Erreur lors de l'envoi du code");
      }
    } catch (error: unknown) {
      console.error('Erreur lors du renvoi du code', error);
      const e = error as Error;
      setErrors({ general: e?.message || 'Erreur lors du renvoi du code' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPComplete = (otpValue: string) => {
    setOtp(otpValue);
    // If we're in verification step and OTP is complete, auto-verify
    if (step === 'verification' && otpValue && otpValue.length === 6) {
      verifyOTP();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center p-4 animate-fade-in-up">
      <div className="w-full max-w-md mx-auto">
        {step === 'registration' && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-gray-100 animate-scale-in">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500 to-cyan-500 rounded-full mb-4 shadow-lg animate-bounce-subtle">
                <Logo className="w-12 h-12" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2 bg-red-500 to-cyan-600 bg-clip-text text-transparent">
                Rejoignez RED BULL
              </h1>
              <p className="text-gray-600 text-sm">
                Inscrivez-vous pour démarrer votre nouvelle aventure financière
              </p>
            </div>

            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start space-x-3 animate-slide-in-left">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{errors.general}</p>
              </div>
            )}

            <form onSubmit={handleRegistrationSubmit} className="space-y-6">
              {/* Numéro de Téléphone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de Téléphone
                </label>
                <PhoneInput
                  phoneNumber={phoneNumber}
                  selectedCountry={selectedCountry}
                  onPhoneChange={setPhoneNumber}
                  onCountrySelect={setSelectedCountry}
                  error={errors.phone}
                />
                {selectedCountry && (
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedCountry.dialCode} {selectedCountry.name}
                  </p>
                )}
              </div>

              {/* Mot de Passe */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de Passe de Connexion
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              {/* Pseudo (Nom complet) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pseudo
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    errors.fullName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Votre nom complet"
                  required
                />
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                )}
              </div>

              {/* Code de Parrainage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code de Parrainage <span className="text-gray-400">(Optionnel)</span>
                </label>
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Entrez le code de parrainage (optionnel)"
                />
              </div>

              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">{errors.general}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-red-500 text-white py-3 px-4 rounded-lg font-semibold hover:from-emerald-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Inscription en cours...</span>
                  </>
                ) : (
                  <span>S'inscrire</span>
                )}
              </button>
            </form>

            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                Vous avez déjà un compte ?{' '}
                <button
                  onClick={onSwitchToLogin}
                  className="text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                >
                  Se Connecter
                </button>
              </p>
            </div>
          </div>
        )}

        {step === 'verification' && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-gray-100 animate-scale-in">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4 shadow-lg">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Code de Vérification
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                Entrez le code reçu par SMS
              </p>
              <div className="bg-gray-50 rounded-lg p-3 mb-6">
                <p className="text-sm text-gray-700">
                  Code envoyé au : <span className="font-semibold">{selectedCountry.dialCode} {phoneNumber}</span>
                </p>
              </div>
            </div>

            {errors.otp && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{errors.otp}</p>
              </div>
            )}

            <form onSubmit={handleOTPSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
                  Code à 6 chiffres
                </label>
                <OTPInput
                  length={6}
                  onComplete={handleOTPComplete}
                  error={!!errors.otp}
                  initialValue={otp}
                />
                {otp && (
                  <p className="mt-2 text-xs text-gray-500 text-center">Code (dev): <span className="font-mono">{otp}</span></p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={countdown > 0 || isLoading}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                >
                  {countdown > 0 ? `Renvoyer (${countdown}s)` : 'Renvoyer le Code'}
                </button>
                
                <button
                  type="submit"
                  disabled={isLoading || otp.length !== 6}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-emerald-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Vérification...</span>
                    </>
                  ) : (
                    "Confirmer"
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 'success' && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-gray-100 text-center animate-scale-in">
            <div className="animate-in zoom-in-50 duration-500">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Inscription Réussie !
            </h2>
            <p className="text-gray-600 mb-6">
              Bienvenue sur RED BULL. Redirection vers votre tableau de bord...
            </p>

            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-blue-600 font-semibold">Connexion automatique...</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-xs">
            © 2025 RED BULL - 5 pays. 1 vision. 90 jours pour transformer ton capital.
          </p>
        </div>
      </div>
    </div>
  );
};