import React, { useState } from 'react';
import {
  Settings, User, Copy, Check, AlertCircle, Loader, Gift, Phone, Calendar, User as UserIcon
} from 'lucide-react';
import { useToast } from './ToastContainer';
import { UserType } from '../types';
import { formatCurrency } from '../utils/calculations';
import api from '../utils/api';

interface SettingsTabProps {
  user: UserType | null;
  wallet: any | null;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ user, wallet }) => {
  const toast = useToast();
  const [giftCode, setGiftCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopyField = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
    toast.success(`${fieldName} copié`);
  };

  const handleRedeemGiftCode = async () => {
    if (!giftCode.trim()) {
      toast.error('Veuillez entrer un code cadeau');
      return;
    }

    setIsRedeeming(true);
    try {
      const response = await api.redeemGiftCode(giftCode.trim());
      
      if (response.success) {
        toast.success(response.data?.message || 'Code cadeau rédemptionné avec succès !');
        setGiftCode('');
        // Refresh wallet if available
        window.dispatchEvent(new CustomEvent('wallet:updated'));
      } else {
        toast.error(response.error || 'Erreur lors de la rédemption du code');
      }
    } catch (error) {
      console.error('Error redeeming gift code:', error);
      toast.error('Erreur lors de la rédemption');
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* ==================== USER DETAILS SECTION ==================== */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-2xl p-6 border border-blue-200 dark:border-blue-700">
        <div className="flex items-center gap-3 mb-4">
          <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Détails du Compte</h2>
        </div>

        <div className="space-y-3">
          {/* Full Name */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Nom Complet</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{user?.full_name || 'N/A'}</p>
                </div>
              </div>
              <button
                onClick={() => handleCopyField(user?.full_name || '', 'Nom complet')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                {copiedField === 'full_name' ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* Phone Number */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Téléphone</p>
                  <p className="font-semibold text-gray-900 dark:text-white">+{user?.country_code} {user?.phone}</p>
                </div>
              </div>
              <button
                onClick={() => handleCopyField(`+${user?.country_code} ${user?.phone}`, 'Téléphone')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                {copiedField === 'phone' ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* Account Creation Date */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Date de Création du Compte</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Referral Code */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <Gift className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Code de Parrainage</p>
                  <p className="font-semibold text-gray-900 dark:text-white font-mono">{user?.referral_code || 'N/A'}</p>
                </div>
              </div>
              <button
                onClick={() => handleCopyField(user?.referral_code || '', 'Code de parrainage')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition flex-shrink-0"
              >
                {copiedField === 'referral_code' ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== GIFT CODES SECTION ==================== */}
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 rounded-2xl p-6 border border-purple-200 dark:border-purple-700">
        <div className="flex items-center gap-3 mb-4">
          <Gift className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Code Cadeau</h2>
            <p className="text-xs text-gray-600 dark:text-gray-300">Comment ça marche ?</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 border border-purple-200 dark:border-purple-600">
          <div className="flex gap-2 items-start mb-3">
            <AlertCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <p className="font-semibold mb-2">Comment utiliser un code cadeau :</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>L'administrateur génère un code cadeau avec un montant défini</li>
                <li>Vous recevez le code cadeau par SMS ou email</li>
                <li>Entrez le code ci-dessous et cliquez sur "Utiliser le code"</li>
                <li>Le montant est immédiatement crédité à votre compte !</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Gift Code Input */}
        <div className="space-y-3">
          <label className="block">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Entrez votre code cadeau
            </span>
            <input
              type="text"
              placeholder="ex: GIFT-A1B2C3D4E5"
              value={giftCode}
              onChange={(e) => setGiftCode(e.target.value.toUpperCase())}
              disabled={isRedeeming}
              className="w-full px-4 py-3 border border-purple-300 dark:border-purple-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed uppercase"
            />
          </label>

          <button
            onClick={handleRedeemGiftCode}
            disabled={isRedeeming || !giftCode.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2 disabled:cursor-not-allowed"
          >
            {isRedeeming ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                En cours...
              </>
            ) : (
              <>
                <Gift className="w-5 h-5" />
                Utiliser le code cadeau
              </>
            )}
          </button>

          <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
            💡 Les codes cadeaux sont à usage unique et peuvent expirer. Assurez-vous d'utiliser le code avant sa date d'expiration.
          </p>
        </div>
      </div>

      {/* ==================== WALLET SUMMARY ==================== */}
      {wallet && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900 dark:to-emerald-800 rounded-2xl p-6 border border-green-200 dark:border-green-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Résumé du Portefeuille</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Solde Actuel</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(wallet.balance || 0)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Investi</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatCurrency(wallet.total_invested || 0)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Gains</p>
              <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{formatCurrency(wallet.total_earned || 0)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Retraits</p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">{formatCurrency(wallet.total_withdrawn || 0)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsTab;
