import React, { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle, Loader } from 'lucide-react';
import { useToast } from './ToastContainer';
import api from '../utils/api';
import { PLATFORM_CONFIG } from '../constants';
import { formatCurrency } from '../utils/calculations';

interface Props {
  onBack: () => void;
  onSuccess: () => void;
  userBalance?: number;
  userCountry?: string;
}

interface PaymentMethod {
  id?: string;
  name?: string;
}

const countries = [
  { code: 'CI', name: 'Côte d\'Ivoire' },
  { code: 'TG', name: 'Togo' },
  { code: 'BF', name: 'Burkina Faso' },
  { code: 'CM', name: 'Cameroun' },
  { code: 'BJ', name: 'Bénin' },
];

type Step = 'form' | 'confirmation' | 'processing' | 'success';

const WithdrawalFormSimple: React.FC<Props> = ({ onBack, onSuccess, userBalance = 0, userCountry = 'TG' }) => {
  const toast = useToast();
  
  // State
  const [step, setStep] = useState<Step>('form');
  const [amount, setAmount] = useState<number>(0);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [accountHolder, setAccountHolder] = useState<string>('');
  const [transferId, setTransferId] = useState<string>('');
  const [country, setCountry] = useState<string>(userCountry || 'TG');
  const [isLoading, setIsLoading] = useState(false);

  // Load payment methods on mount
  useEffect(() => {
    const loadMethods = async () => {
      try {
        const res = await api.getPaymentMethods();
        if (res?.success && res.data) {
          setMethods(res.data as PaymentMethod[]);
          if (res.data.length > 0) {
            setSelectedMethod(res.data[0].id || res.data[0].name || '');
          }
        }
      } catch (error) {
        console.error('Error loading payment methods:', error);
        toast.error('Impossible de charger les modes de paiement');
      }
    };
    loadMethods();
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!amount || amount <= 0) {
      toast.error('Montant invalide');
      return;
    }
    if (amount > userBalance) {
      toast.error('Solde insuffisant');
      return;
    }
    if (amount < PLATFORM_CONFIG.minWithdrawal) {
      toast.error(`Montant minimum: ${formatCurrency(PLATFORM_CONFIG.minWithdrawal)}`);
      return;
    }
    if (!selectedMethod) {
      toast.error('Sélectionnez un mode de paiement');
      return;
    }
    if (!accountHolder.trim()) {
      toast.error('Entrez le nom du titulaire');
      return;
    }
    if (!transferId.trim()) {
      toast.error('Entrez un numéro de dépôt');
      return;
    }
    if (!country) {
      toast.error('Sélectionnez un pays');
      return;
    }

    setStep('confirmation');
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    setStep('processing');

    try {
      // Map frontend field names to backend expected names
      const payload = {
        amount,
        payment_method_id: selectedMethod,
        account_number: transferId,
        account_holder_name: accountHolder,
        country,
      };

      const res = await api.request('/withdrawals', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res?.success) {
        toast.success('Retrait soumis avec succès');
        setStep('success');
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        toast.error(res?.error || 'Erreur lors du retrait');
        setStep('form');
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error?.message || 'Erreur réseau');
      setStep('form');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      {/* Back button */}
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 font-medium"
      >
        <ArrowLeft className="w-4 h-4" /> Retour
      </button>

      {/* Form Step */}
      {step === 'form' && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-2xl font-bold mb-4">Demande de retrait</h2>

          {/* Montant */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Montant (XOF)</label>
            <input
              type="number"
              value={amount || ''}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="Entrez le montant"
              className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Solde: {formatCurrency(userBalance)} | Min: {formatCurrency(PLATFORM_CONFIG.minWithdrawal)}
            </p>
          </div>

          {/* Mode de paiement */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mode de paiement</label>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              <option value="">Sélectionnez un mode</option>
              {methods.map((method) => (
                <option key={method.id || method.name} value={method.id || method.name || ''}>
                  {method.name}
                </option>
              ))}
            </select>
          </div>

          {/* Nom du titulaire */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nom du titulaire</label>
            <input
              type="text"
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value)}
              placeholder="Entrez le nom du titulaire"
              className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>

          {/* Numéro de dépôt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Numéro de dépôt</label>
            <input
              type="text"
              value={transferId}
              onChange={(e) => setTransferId(e.target.value)}
              placeholder="Entrez le numéro de dépôt"
              className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>

          {/* Pays */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pays</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading || !amount || !selectedMethod || !accountHolder || !transferId}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Traitement...' : 'Continuer'}
          </button>
        </form>
      )}

      {/* Confirmation Step */}
      {step === 'confirmation' && (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-xl font-bold mb-4">Confirmer le retrait</h2>

          <div className="bg-gray-50 rounded p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Montant:</span>
              <span className="font-semibold">{formatCurrency(amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Mode:</span>
              <span className="font-semibold">{methods.find(m => (m.id || m.name) === selectedMethod)?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Titulaire:</span>
              <span className="font-semibold">{accountHolder}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Numéro dépôt:</span>
              <span className="font-semibold">{transferId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pays:</span>
              <span className="font-semibold">{countries.find(c => c.code === country)?.name}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('form')}
              className="flex-1 border border-gray-300 py-2 rounded-lg font-semibold hover:bg-gray-50"
            >
              Retour
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? <Loader className="w-4 h-4 animate-spin mx-auto" /> : 'Confirmer'}
            </button>
          </div>
        </div>
      )}

      {/* Processing Step */}
      {step === 'processing' && (
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center justify-center min-h-64">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mb-4" />
          <p className="text-lg font-semibold text-gray-700">Traitement en cours...</p>
        </div>
      )}

      {/* Success Step */}
      {step === 'success' && (
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center justify-center min-h-64">
          <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
          <p className="text-xl font-bold text-gray-800">Retrait soumis avec succès!</p>
          <p className="text-sm text-gray-600 mt-2">Vous serez redirigé vers le tableau de bord.</p>
        </div>
      )}
    </div>
  );
};

export default WithdrawalFormSimple;
