// src/pages/RechargePage.tsx
import { useState, useEffect } from "react";
import QuickAmounts from "../components/QuickAmounts";
import Loader from "../components/Loader";
import Payment from "./Payment";
import api from "../utils/api";

interface PaymentMethod {
  id?: string;
  name?: string;
  payment_method?: string;
  title?: string;
  description?: string;
  account_number?: string;
  account_holder_name?: string;
  ussd_code?: string;
  min_deposit?: number | string;
}

const quickValues = [2000,5000,10000,20000,50000,100000,200000,500000];

export default function RechargePage() {
  const [amount, setAmount] = useState<number>(2000);
  const [selectedQuick, setSelectedQuick] = useState<number | null>(2000);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [payWay, setPayWay] = useState<string | number | null>(null);
  const [loadingMethods, setLoadingMethods] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  // Track the selected payment method details
  const selectedMethod = methods.find((m: PaymentMethod) => String(m.id ?? m.name) === String(payWay));

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingMethods(true);
      try {
        const resp = await api.getPaymentMethods() as { success: boolean; data: PaymentMethod[] };
        if (!mounted) return;
        if (resp && resp.success) {
          const list = resp.data || [];
          setMethods(list);
          if (list.length > 0) setPayWay(list[0].id ?? list[0].payment_method ?? list[0].name ?? null);
        }
      } catch {
        // ignore
      } finally {
        if (mounted) setLoadingMethods(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleQuick = (v: number) => { setSelectedQuick(v); setAmount(v); };

  const startPayment = () => {
    if (!amount || amount <= 0) { alert('Montant invalide'); return; }
    if (!payWay) { alert('Veuillez sélectionner une méthode'); return; }
    setShowPayment(true);
  };

  const goToDashboard = () => {
    window.location.href = '/';
  };

  if (showPayment) {
    return (
      <Payment 
        amount={amount} 
        payWay={payWay} 
        accountNumber={selectedMethod?.account_number || ''} 
        accountHolderName={selectedMethod?.account_holder_name || ''}
        ussdCode={selectedMethod?.ussd_code || ''}
        minDeposit={selectedMethod?.min_deposit ? Number(selectedMethod.min_deposit) : 1000}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-40">
      <div className="p-4 bg-blue-600 text-white relative flex items-center justify-between">
        <button onClick={goToDashboard} className="text-2xl font-bold">◀</button>
        <h1 className="text-center font-semibold flex-1">Recharge</h1>
        <div className="w-8"></div>
      </div>

      <div className="max-w-xl mx-auto p-4">
        <div className="bg-white p-4 rounded-lg border mt-4">
          <label className="block text-sm font-medium text-gray-700">Montant du dépôt</label>
          <div className="mt-3">
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-600 font-semibold">FCFA</span>
              <input
                type="number"
                className="w-full pl-14 p-2 border rounded-md outline-none"
                placeholder="Montant du dépôt"
                value={amount}
                onChange={(e) => { setAmount(Number(e.target.value)); setSelectedQuick(null); }}
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Montant rapide</label>
            <QuickAmounts values={quickValues} selected={selectedQuick} onSelect={handleQuick} />
          </div>

          <a href="/rechargeLists" className="block text-right text-blue-600 mt-4">Historique &gt;</a>

          <div className="mt-6">
            <button
              className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold disabled:opacity-50"
              onClick={startPayment}
              disabled={!amount || amount <= 0 || !payWay}
            >
              Démarrer le paiement
            </button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border mt-4">
          <h3 className="font-semibold mb-3">Méthode de paiement</h3>
          {loadingMethods ? (
            <div className="text-sm text-gray-500">Chargement des méthodes...</div>
          ) : methods.length === 0 ? (
            <div className="text-sm text-gray-500">Aucune méthode disponible</div>
          ) : (
            methods.map((m: PaymentMethod) => (
              <label key={m.id ?? m.name} className="flex items-center space-x-3 p-2 border rounded mb-2">
                <input 
                  type="radio" 
                  name="paymethod" 
                  checked={String(payWay) === String(m.id ?? m.name)} 
                  onChange={() => setPayWay((m.id ?? m.name) || null)} 
                />
                <div className="flex-1">
                  <div className="font-medium">{m.name || m.title || m.payment_method}</div>
                  <div className="text-xs text-gray-500">{m.description || ''}</div>
                  {m.account_number && (
                    <div className="text-xs text-gray-600 font-semibold">Compte : {m.account_number}</div>
                  )}
                </div>
              </label>
            ))
          )}
        </div>

        <div className="bg-white p-4 rounded-lg border mt-4">
          <h3 className="font-semibold mb-2">Explication</h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p>1. Ne modifiez pas le montant du dépôt. Toute modification non autorisée du montant du dépôt entraînera un non-crédit du dépôt.</p>
            <p>2. Chaque dépôt doit être initié via cette page.</p>
            <p>3. Le dépôt est reçu sous 5 minutes.</p>
            <p>4. En raison du grand nombre d'utilisateurs, réessayez si nécessaire.</p>
          </div>
        </div>
      </div>

      <Loader visible={false} />
    </div>
  );
}