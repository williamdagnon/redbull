import { useState } from "react";
import api from "../utils/api";

interface PaymentProps {
  amount?: number;
  payWay?: string | number | null;
  accountNumber?: string;
  accountHolderName?: string;
  ussdCode?: string;
  minDeposit?: number;
}

const TmoneyPayment: React.FC<PaymentProps> = ({ 
  amount: initialAmount, 
  payWay, 
  accountNumber: initialAccountNumber,
  accountHolderName: initialAccountHolderName,
  ussdCode: initialUssdCode,
  minDeposit: initialMinDeposit
}) => {
  // ---- States ----
  const [currentStep, setCurrentStep] = useState(1);
  const [customerMobile, setCustomerMobile] = useState("");
  const [transferId, setTransferId] = useState("");
  const [amount] = useState<number>(initialAmount ?? 5000);
  const [account] = useState(initialAccountNumber ?? "90 00 00 00");
  const [accountHolderName] = useState(initialAccountHolderName ?? "Company Name");
  const [ussd] = useState(initialUssdCode ?? "*145#");
  const [minDeposit] = useState(initialMinDeposit ?? 1000);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ---- Validation du montant minimum ----
  const isAmountValid = amount >= minDeposit;

  // ---- Helpers ----
  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 2000);
  };

  const copyToClipboard = (txt: string) => {
    navigator.clipboard.writeText(txt);
    showMessage("Copié !");
  };

  // ---- Navigation ----
  const nextStep = () => {
    if (currentStep === 1) {
      // Validation montant minimum
      if (!isAmountValid) {
        showMessage(`Montant minimum : ${minDeposit} XOF`);
        return;
      }
      // Numéro mobile sans code pays (6-14 chiffres)
      if (!/^\d{6,14}$/.test(customerMobile)) {
        showMessage("Numéro invalide ! (6-14 chiffres)");
        return;
      }
    }
    if (currentStep === 2) {
      if (!transferId || !/^\d{9,11}$/.test(transferId)) {
        showMessage("ID de transfert invalide !");
        return;
      }
    }
    setCurrentStep((s) => s + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  };

  // ---- UI ----
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center">

      {/* Bouton Retour */}
      <div className="w-full bg-white p-2 px-4">
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold text-sm"
        >
          ← Retour au tableau de bord
        </button>
      </div>

      {/* Header */}
      <div className="w-full bg-white shadow p-4 flex items-center">
        <img src="/goldpay.png" className="h-12 mr-4" alt="logo" />
        <h1 className="text-xl font-semibold text-gray-800">
          Assistant de paiement
        </h1>
      </div>

      {/* Montant */}
      <div className="w-full bg-gradient-to-r from-yellow-300 to-yellow-500 p-6 text-white">
        <p className="text-2xl mb-2">Montant :</p>
        <p className="text-5xl font-bold">{amount}</p>
        <p className="text-lg font-semibold -mt-2">XOF</p>
      </div>

      {/* Wizard Steps */}
      <div className="w-full max-w-2xl mt-6">
        <div className="flex justify-between mb-6">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold
                  ${currentStep >= step ? "bg-green-500" : "bg-gray-300"}
                `}
              >
                {step}
              </div>
              <p className="text-sm mt-1 text-center text-gray-700">
                {step === 1 && "Général"}
                {step === 2 && "Compte"}
                {step === 3 && "Confirmé"}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ----- Step Content ----- */}
      <div className="w-full max-w-2xl bg-white shadow p-6 mt-4 rounded-xl">

        {currentStep === 1 && (
          <div>
            <div className="bg-yellow-100 border border-yellow-400 p-3 rounded mb-4">
              <p className="font-semibold text-yellow-800">Montant : {amount} XOF</p>
              <p className="text-sm text-yellow-700">Minimum requis : {minDeposit} XOF</p>
              {isAmountValid ? (
                <p className="text-sm text-green-700 mt-1">✓ Montant valide</p>
              ) : (
                <p className="text-sm text-red-700 mt-1">✗ Montant insuffisant</p>
              )}
            </div>

            <label className="block font-semibold mb-2">Numéro Mobile :</label>
            <input
              type="text"
              maxLength={14}
              className="w-full border p-3 rounded mt-2"
              placeholder="Tapez votre numéro mobile"
              value={customerMobile}
              onChange={(e) => setCustomerMobile(e.target.value.replace(/\D/g, ''))}
            />
           

            <p className="bg-green-200 p-3 mt-4 rounded">
              Veuillez utiliser la même méthode de transfert.
            </p>
          </div>
        )}

        {currentStep === 2 && (
          <div>
            <p className="bg-green-200 p-3 rounded mb-4">
              Envoyez {amount} XOF au compte suivant :
            </p>

            <div className="border-2 border-red-500 p-4 rounded mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Titulaire du compte :</label>
              <p className="text-lg font-bold text-red-600">{accountHolderName}</p>
            </div>

            <div className="border-2 border-red-500 p-4 rounded mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Numéro de compte :</label>
              <p className="text-xl font-bold text-red-600">{account}</p>
              <button
                onClick={() => copyToClipboard(account)}
                className="text-blue-600 underline mt-2"
              >
                Copier
              </button>
            </div>

            {/* USSD */}
            

            <div className="border-2 border-red-500 p-4 rounded mt-6">
              <label className="block font-semibold text-red-600 mb-2">
                Entrez l'ID de transfert :
              </label>
              <input
                type="text"
                maxLength={20}
                className="w-full border p-3 rounded mt-2"
                placeholder="ID de transfert (9-11 chiffres)"
                value={transferId}
                onChange={(e) => setTransferId(e.target.value.replace(/\D/g, ''))}
              />
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div>
            <h3 className="text-lg font-bold mb-4">Récapitulatif du dépôt :</h3>
            
            <div className="bg-blue-50 border border-blue-200 p-3 rounded mb-3">
              <p className="text-sm">Montant : <b className="text-lg text-blue-700">{amount} XOF</b></p>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-3 rounded mb-3">
              <p className="text-sm">Numéro mobile : <b className="text-blue-700"> {customerMobile}</b></p>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-3 rounded mb-3">
              <p className="text-sm">Compte bénéficiaire : <b className="text-blue-700">{account}</b></p>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-3 rounded mb-4">
              <p className="text-sm">ID de transfert : <b className="text-blue-700">{transferId}</b></p>
            </div>

            <p className="bg-green-100 border border-green-300 p-3 rounded">
              ✓ Vérifiez que toutes les informations sont correctes, puis cliquez sur <b>Soumettre</b> pour envoyer votre dépôt en attente d'approbation admin.
            </p>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex w-full max-w-2xl justify-between mt-4 mb-4">
        {currentStep > 1 && (
          <button
            onClick={prevStep}
            className="bg-gray-300 px-6 py-2 rounded font-semibold"
          >
            Précédent
          </button>
        )}

        {currentStep < 3 && (
          <button
            onClick={nextStep}
            disabled={currentStep === 1 && !isAmountValid}
            className="bg-green-600 text-white px-6 py-2 rounded font-semibold disabled:opacity-50"
          >
            Suivant
          </button>
        )}

        {currentStep === 3 && (
          <button
            className="bg-blue-600 text-white px-6 py-2 rounded font-semibold disabled:opacity-50"
            disabled={isLoading}
            onClick={async () => {
              if (isLoading) return;
              setIsLoading(true);
              try {
                const payload = { 
                  amount, 
                  pay_way_id: payWay ?? 'tmoney',
                  transfer_id: transferId,
                  customer_mobile: customerMobile
                };
                const res = await api.request('/recharge', {
                  method: 'POST',
                  body: JSON.stringify(payload)
                });
                if (res && (res as any).status === 1) {
                  showMessage('✓ Dépôt soumis avec succès. Veuillez patienter l\'approbation Admin !');
                  setTimeout(() => {
                    window.location.href = '/dashboard';
                  }, 2000);
                } else {
                  showMessage((res as any)?.msg || 'Erreur');
                }
              } catch (err) {
                const error = err as Error;
                console.error('Error:', err);
                showMessage(error?.message || 'Erreur réseau');
              } finally {
                setIsLoading(false);
              }
            }}
          >
            {isLoading ? 'Envoi...' : 'Soumettre'}
          </button>
        )}
      </div>

      {message && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-black text-white px-4 py-2 rounded">
          {message}
        </div>
      )}
    </div>
  );
};

export default TmoneyPayment;
