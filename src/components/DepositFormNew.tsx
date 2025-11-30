import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Copy, Loader } from 'lucide-react';
import { useToast } from './ToastContainer';
import api from '../utils/api';
import { PLATFORM_CONFIG } from '../constants';
import { formatCurrency } from '../utils/calculations';
import { Bank } from '../types';

interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  bank_id?: string;
  bank_name?: string;
}

interface DepositFormProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const DepositForm: React.FC<DepositFormProps> = ({ onBack, onSuccess }) => {
  const [step, setStep] = useState<'amount' | 'payment' | 'confirmation' | 'processing' | 'success'>('amount');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (step === 'payment') {
      void (async () => {
        try {
          const res = await api.getPaymentMethods();
          console.debug('getPaymentMethods response:', res);
          if (res?.success) setPaymentMethods(res.data || []);
        } catch (err) {
          console.error(err);
          toast.error('Impossible de charger les modes de paiement');
        }
      })();
    }
  }, [step]);

  // no bank step anymore: payment methods are loaded when entering 'payment'

  const handleConfirm = async () => {
    setStep('processing');
    setLoading(true);
    try {
      const res = await api.createDeposit({
        amount,
        payment_method: paymentMethod,
        account_number: accountNumber,
        depositor_name: depositorName,
        deposit_number: depositNumber,
        deposit_reference: depositReference
      });
      if (res?.success) {
        toast.success('Dépôt créé');
        setStep('success');
        setTimeout(onSuccess, 900);
      } else {
        toast.error(res?.error || 'Erreur');
        setStep('confirmation');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la création');
      setStep('confirmation');
    } finally {
      setLoading(false);
    }
  };

  const [depositorName, setDepositorName] = useState<string>('');
  const [depositNumber, setDepositNumber] = useState<string>('');
  const [depositReference, setDepositReference] = useState<string>('');

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack}><ArrowLeft /></button>
        <h3 className="font-bold">Dépôt</h3>
        <div style={{ width: 32 }} />
      </div>

      {step === 'amount' && (
        <div>
          <input type="number" value={amount || ''} onChange={e => setAmount(Number(e.target.value))} className="w-full p-2 border rounded" placeholder="Montant" />
          <div className="mt-3 flex gap-2">
            <button className="flex-1 bg-green-500 text-white p-2 rounded" onClick={() => setStep('payment')}>Suivant</button>
          </div>
        </div>
      )}

      {step === 'payment' && (
        <div>
          {paymentMethods.length > 0 ? (
            paymentMethods.map(m => (
              <button key={m.id} onClick={() => { setPaymentMethod(m.id); setStep('details'); }} className="w-full p-3 mb-2 border rounded hover:bg-blue-50 transition-colors" >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{m.name}</div>
                    {m.code && <div className="text-xs text-gray-500">Code: {m.code}</div>}
                    {m.bank_name && <div className="text-xs text-gray-500">Banque: {m.bank_name}</div>}
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-6 text-gray-600">Aucune méthode de paiement disponible.</div>
          )}
        </div>
      )}

      {step === 'payment' && (
        <div>
          {paymentMethods.length > 0 ? (
            paymentMethods.map(m => (
              <button key={m.id} onClick={() => { setPaymentMethod(m.id); setStep('details'); }} className="w-full p-3 mb-2 border rounded hover:bg-blue-50 transition-colors" >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{m.name}</div>
                    {m.code && <div className="text-xs text-gray-500">Code: {m.code}</div>}
                    {m.bank_name && <div className="text-xs text-gray-500">Banque: {m.bank_name}</div>}
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-6 text-gray-600">
              Aucune méthode de paiement disponible pour cette sélection.
              <div className="mt-3">
                <button onClick={() => setStep('bank')} className="px-4 py-2 border rounded">Retour aux banques</button>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 'details' && (
        <div>
          <input value={depositorName} onChange={e => setDepositorName(e.target.value)} className="w-full p-2 border rounded mt-2" placeholder="Nom du déposant (obligatoire)" />
          <input value={depositNumber} onChange={e => setDepositNumber(e.target.value)} className="w-full p-2 border rounded mt-2" placeholder="Numéro de dépôt (obligatoire)" />
          <input value={depositReference} onChange={e => setDepositReference(e.target.value)} className="w-full p-2 border rounded mt-2" placeholder="ID de référence de dépôt (obligatoire)" />
          <input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} className="w-full p-2 border rounded mt-2" placeholder="Numéro du compte / wallet" />
          <div className="mt-3 flex gap-2">
            <button onClick={() => setStep('payment')} className="flex-1 p-2 border rounded">Précédent</button>
            <button onClick={() => {
              if (!depositorName.trim() || !depositNumber.trim() || !depositReference.trim() || !accountNumber.trim()) { toast.error('Tous les champs obligatoires doivent être remplis'); return; }
              setStep('confirmation');
            }} className="flex-1 bg-green-500 text-white p-2 rounded">Suivant</button>
          </div>
        </div>
      )}

      {step === 'confirmation' && (
        <div>
          <div className="p-3 border rounded mb-3">
            <div>Montant: {formatCurrency(amount)}</div>
            <div>Mode: {paymentMethods.find(m => m.id === paymentMethod)?.name || ''}</div>
            <div>Nom déposant: {depositorName}</div>
            <div>Num dépôt: {depositNumber}</div>
            <div>ID référence: {depositReference}</div>
            {paymentMethods.find(m => m.id === paymentMethod)?.code && (
              <div>Code: {paymentMethods.find(m => m.id === paymentMethod)?.code} <button onClick={() => navigator.clipboard.writeText(paymentMethods.find(m => m.id === paymentMethod)?.code || '')}>Copier</button></div>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep('bank')} className="flex-1 p-2 border rounded">Précédent</button>
            <button onClick={handleConfirm} className="flex-1 bg-green-600 text-white p-2 rounded">Confirmer</button>
          </div>
        </div>
      )}

      {step === 'processing' && (
        <div className="text-center p-6"><Loader className="animate-spin mx-auto" /><div>Traitement...</div></div>
      )}

      {step === 'success' && (
        <div className="text-center p-6"><CheckCircle className="text-green-500" /><div>Dépôt créé</div></div>
      )}
    </div>
  );
};

export default DepositForm;
