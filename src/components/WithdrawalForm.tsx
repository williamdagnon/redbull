import React, { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle, Copy, Loader, ChevronRight } from 'lucide-react';
import { useToast } from './ToastContainer';
import api from '../utils/api';
import { PLATFORM_CONFIG } from '../constants';
import { formatCurrency, calculateWithdrawalFees } from '../utils/calculations';

interface Props {
  onBack: () => void;
  onSuccess: () => void;
  userBalance?: number;
  userCountry?: string;
}

type Step = 'amount' | 'bankDetails' | 'confirmation' | 'processing' | 'success';

const presetAmounts = [3000, 6000, 15000, 30000, 65000, 150000, 350000, 700000];

const WithdrawalForm: React.FC<Props> = ({ onBack, onSuccess, userBalance = 0, userCountry = 'TG' }) => {
  const toast = useToast();
  
  // State
  const [step, setStep] = useState<Step>('amount');
  const [amount, setAmount] = useState<number>(0);
  const [methods, setMethods] = useState<any[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<any | null>(null);
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [accountHolder, setAccountHolder] = useState<string>('');
  const [transferId, setTransferId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Load payment methods when entering bankDetails (repurposed)
  useEffect(() => {
    if (step === 'bankDetails') {
      setIsLoading(true);
      api.getPaymentMethods()
        .then(res => {
          const data = (res && res.data) || [];
          setMethods(data);
        })
        .catch(err => {
          console.error(err);
          toast.error('Impossible de charger les modes de paiement');
        })
        .finally(() => setIsLoading(false));
    }
  }, [step]);

  const { fees: withdrawalFees, netAmount } = calculateWithdrawalFees(amount);

  // Handlers
  const handleSelectAmount = (selectedAmount: number) => {
    if (selectedAmount <= userBalance) {
      setAmount(selectedAmount);
    } else {
      toast.error('Solde insuffisant');
    }
  };

  const handleContinueFromAmount = () => {
    if (!amount || amount < PLATFORM_CONFIG.minWithdrawal) {
      toast.error(`Montant minimum: ${formatCurrency(PLATFORM_CONFIG.minWithdrawal)}`);
      return;
    }
    if (amount > userBalance) {
      toast.error('Solde insuffisant');
      return;
    }
    setStep('bankDetails');
  };

  const handleSelectMethod = (m: any) => {
    setSelectedMethod(m);
  };

  const handleContinueFromBankDetails = () => {
    if (!selectedMethod) {
      toast.error('Sélectionnez un mode de paiement');
      return;
    }
    if (!accountNumber.trim()) {
      toast.error('Entrez votre numéro de compte');
      return;
    }
    if (!accountHolder.trim()) {
      toast.error('Entrez le nom du titulaire');
      return;
    }
    setStep('confirmation');
  };

  const handleConfirmWithdrawal = async () => {
    if (!selectedMethod) {
      toast.error('Sélectionnez un mode de paiement');
      return;
    }
    
    setIsLoading(true);
    setStep('processing');

    try {
      const payload = {
        amount,
        payment_method_id: selectedMethod?.id,
        payment_method_name: selectedMethod?.name,
        account_number: accountNumber,
        account_holder_name: accountHolder,
      };

      const res = await api.createWithdrawal(payload);

      if (res?.success) {
        setTransferId(`RET${Date.now()}`);
        toast.success('Retrait créé avec succès');
        setStep('success');
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        toast.error(res?.error || 'Erreur lors de la création du retrait');
        setStep('confirmation');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la création du retrait');
      setStep('confirmation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copié!');
    } catch {
      toast.error('Impossible de copier');
    }
  };

  const handleBack = () => {
    if (step === 'bankDetails') {
      setStep('amount');
    } else if (step === 'confirmation') {
      setStep('bankDetails');
    } else {
      onBack();
    }
  };

  // Render Amount Step
  const renderAmountStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <button onClick={onBack} className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4 font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour
        </button>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Retrait</h2>
        <p className="text-gray-600">Sélectionnez le montant à retirer</p>
      </div>

      {/* Solde Disponible */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
        <div className="text-center">
          <div className="text-sm text-gray-600 mb-1">Solde disponible</div>
          <div className="text-3xl font-bold text-blue-600">{formatCurrency(userBalance)}</div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-4">Montants Recommandés</label>
        <div className="grid grid-cols-2 gap-3">
          {presetAmounts.map(preset => (
            <button
              key={`preset-${preset}`}
              onClick={() => handleSelectAmount(preset)}
              disabled={preset > userBalance}
              className={`p-3 rounded-xl font-bold text-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                amount === preset
                  ? 'bg-purple-500 text-white shadow-lg ring-2 ring-purple-300'
                  : 'bg-white border-2 border-gray-200 text-gray-900 hover:border-purple-500 disabled:border-gray-300'
              }`}
            >
              {preset.toLocaleString('fr-FR')}
            </button>
          ))}
        </div>
      </div>

      {amount > 0 && (
        <div className="bg-gradient-to-b from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-semibold text-gray-600 uppercase">Montant demandé</div>
              <div className="text-2xl font-bold text-purple-600 mt-1">{formatCurrency(amount)}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-600 uppercase">Frais (6%)</div>
              <div className="text-2xl font-bold text-red-600 mt-1">-{formatCurrency(withdrawalFees)}</div>
            </div>
          </div>
          <div className="border-t border-purple-200 pt-3">
            <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Montant net</div>
            <div className="text-3xl font-bold text-green-600">{formatCurrency(netAmount)}</div>
          </div>
        </div>
      )}
    </div>
  );

  // Render Payment Method / Details Step
  const renderBankDetailsStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Détails de Retrait</h2>
        <p className="text-gray-600 text-sm mt-1">Choisissez un mode de paiement puis entrez les informations nécessaires</p>
      </div>

      {/* Montant Net à Recevoir */}
      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
        <div className="text-center">
          <div className="text-sm text-gray-600 mb-1">Montant net à recevoir</div>
          <div className="text-3xl font-bold text-green-600">{formatCurrency(netAmount)}</div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      ) : (
        <>
          {/* Payment Methods List */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Mode de Paiement</label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {methods.length > 0 ? (
                methods.map((m) => (
                  <button
                    key={`method-${m.id}`}
                    onClick={() => handleSelectMethod(m)}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-3 ${
                      selectedMethod?.id === m.id
                        ? 'bg-purple-50 border-purple-500'
                        : 'bg-white border-gray-200 hover:border-purple-500'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {m.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{m.name}</div>
                      {m.account_holder_name && <div className="text-xs text-gray-600">{m.account_holder_name}</div>}
                    </div>
                    {selectedMethod?.id === m.id && (
                      <CheckCircle className="w-6 h-6 text-purple-500 flex-shrink-0" />
                    )}
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-gray-600">Aucun mode de paiement disponible</div>
              )}
            </div>
          </div>

          {/* Account Number Input */}
          {selectedMethod && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Numéro de Compte</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Entrez votre numéro de compte"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Titulaire du Compte</label>
                <input
                  type="text"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder="Entrez le nom complet"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                />
              </div>
            </div>
          )}

          {/* Warning */}
          {selectedMethod && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
              <div className="flex gap-3">
                <span className="text-xl flex-shrink-0">⚠️</span>
                <div className="text-sm text-amber-900">
                  <strong>Important:</strong> Vérifiez que vos informations correspondent à votre compte de retrait. Les retraits rejetés sont automatiquement remboursés.
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  // Render Confirmation Step
  const renderConfirmationStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Confirmez le Retrait</h2>
        <p className="text-gray-600 text-sm mt-1">Vérifiez vos informations</p>
      </div>

      <div className="bg-gradient-to-b from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs font-semibold text-gray-600 uppercase">Montant demandé</div>
            <div className="text-2xl font-bold text-purple-600 mt-1">{formatCurrency(amount)}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-600 uppercase">Frais (6%)</div>
            <div className="text-lg font-bold text-red-600 mt-1">-{formatCurrency(withdrawalFees)}</div>
          </div>
        </div>

        <div className="border-t border-purple-200 pt-4">
          <div className="text-xs font-semibold text-gray-600 uppercase mb-2">Montant net à recevoir</div>
          <div className="text-3xl font-bold text-green-600">{formatCurrency(netAmount)}</div>
        </div>

        <div className="border-t border-purple-200 pt-4 space-y-3">
          <div>
            <div className="text-xs font-semibold text-gray-600 uppercase">Mode de Paiement</div>
            <div className="font-semibold text-gray-900 mt-1">{selectedMethod?.name}</div>
          </div>

          <div>
            <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Numéro de Compte</div>
            <div className="flex items-center justify-between bg-white rounded-lg p-3">
              <div className="font-mono font-semibold text-gray-900">{accountNumber}</div>
              <button
                onClick={() => handleCopy(accountNumber)}
                className="p-2 hover:bg-purple-100 rounded-lg transition"
              >
                <Copy className="w-4 h-4 text-purple-600" />
              </button>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Titulaire</div>
            <div className="font-semibold text-gray-900">{accountHolder}</div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
        <div className="text-sm text-blue-900">
          En cliquant sur <strong>"Confirmer le Retrait"</strong>, vous confirmez que les informations ci-dessus sont correctes. Frais de 6% seront déduits du montant.
        </div>
      </div>
    </div>
  );

  // Render Processing Step
  const renderProcessingStep = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center mb-4 animate-pulse">
        <Loader className="w-10 h-10 text-purple-600 animate-spin" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">Traitement en cours...</h3>
      <p className="text-gray-600">Veuillez patienter</p>
    </div>
  );

  // Render Success Step
  const renderSuccessStep = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6 animate-bounce">
        <CheckCircle className="w-14 h-14 text-green-600" />
      </div>
      <h3 className="text-2xl font-bold text-green-600 mb-2">Retrait Créé!</h3>
      <p className="text-gray-600 text-center mb-6">Votre demande a été enregistrée avec succès.</p>

      <div className="w-full bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6 space-y-3">
        <div>
          <div className="text-xs font-semibold text-gray-600 uppercase">Numéro de Référence</div>
          <div className="flex items-center justify-between mt-2">
            <div className="font-mono font-bold text-lg text-gray-900">{transferId}</div>
            <button
              onClick={() => handleCopy(transferId)}
              className="p-2 hover:bg-purple-100 rounded-lg transition"
            >
              <Copy className="w-5 h-5 text-purple-600" />
            </button>
          </div>
        </div>

        <div className="border-t border-purple-200 pt-3">
          <div className="text-xs font-semibold text-gray-600 uppercase">Montant Net</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(netAmount)}</div>
        </div>
      </div>

      <div className="mt-8 text-center text-sm text-gray-600">
        <p>Votre demande est en attente d'approbation.</p>
        <p>Vous serez notifié dès que votre retrait sera validé.</p>
      </div>
    </div>
  );

  // Render function
  const renderContent = () => {
    switch (step) {
      case 'amount':
        return renderAmountStep();
      case 'bankDetails':
        return renderBankDetailsStep();
      case 'confirmation':
        return renderConfirmationStep();
      case 'processing':
        return renderProcessingStep();
      case 'success':
        return renderSuccessStep();
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-purple-50 to-white">
      {/* Header */}
      {step !== 'amount' && step !== 'success' && (
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="text-center">
              <div className="text-sm font-medium opacity-90">Retrait</div>
              <div className="text-2xl font-bold">{formatCurrency(amount)}</div>
            </div>
            <div className="w-10" />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6">
          {renderContent()}
        </div>
      </div>

      {/* Footer Buttons */}
      {step !== 'success' && step !== 'processing' && (
        <div className="bg-white border-t border-gray-200 p-6 sticky bottom-0">
          <div className="max-w-2xl mx-auto flex gap-3">
            {step !== 'amount' && (
              <button
                onClick={handleBack}
                disabled={isLoading}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 disabled:opacity-50 transition"
              >
                Précédent
              </button>
            )}
            <button
              onClick={
                step === 'amount'
                  ? handleContinueFromAmount
                  : step === 'bankDetails'
                  ? handleContinueFromBankDetails
                  : step === 'confirmation'
                  ? handleConfirmWithdrawal
                  : () => {}
              }
              disabled={
                isLoading ||
                (step === 'amount' && amount === 0) ||
                (step === 'bankDetails' && (!selectedBank || !accountNumber || !accountHolder))
              }
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 transition transform hover:scale-105 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Traitement...
                </>
              ) : step === 'confirmation' ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Confirmer le Retrait
                </>
              ) : (
                <>
                  Suivant
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Success Footer */}
      {step === 'success' && (
        <div className="bg-white border-t border-gray-200 p-6 sticky bottom-0">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={onSuccess}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition transform hover:scale-105"
            >
              Retourner au Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WithdrawalForm;
