import React, { useState, useEffect } from 'react';
import { Copy, TrendingUp, Gift, Loader, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../utils/calculations';
import api from '../utils/api';
import { useToast } from './ToastContainer';
import { Referral } from '../types/extra';

interface ReferralStats {
  total_referrals: number;
  active_referrals: number;
  level1_count: number;
  level2_count: number;
  level3_count: number;
  level1_commission: number;
  level2_commission: number;
  level3_commission: number;
  total_commission_earned: number;
  pending_commissions: number;
  pending_level1_commission: number;
  pending_level2_commission: number;
  pending_level3_commission: number;
  referral_code: string;
}

interface Commission {
  id: string;
  amount: number;
  level: number;
  from_user_id: string;
  from_user_phone?: string;
  from_user_name?: string;
  transaction_id?: string;
  created_at: string;
  status: 'pending' | 'paid';
}

export const TeamTab: React.FC<{ referralCode?: string | null }> = ({ referralCode: propReferralCode }) => {
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [referralCode, setReferralCode] = useState(propReferralCode);
  const [referralLink, setReferralLink] = useState<string>('');
  const toast = useToast();

  useEffect(() => {
    loadTeamData();
    // Generate referral link - dynamic based on domain
    if (referralCode) {
      const domain = window.location.origin;
      // En localhost, ajouter le port et le chemin; en prod, utiliser le domaine
      setReferralLink(`${domain}?ref=${referralCode}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referralCode]);

  const loadTeamData = async () => {
    setIsLoading(true);
    try {
      // Load referral stats
      const statsResp = await api.getReferralStats();
      if (statsResp.success && statsResp.data) {
        setReferralStats(statsResp.data as ReferralStats);
        const data = statsResp.data as unknown as { referral_code?: string };
        if (data.referral_code) {
          setReferralCode(data.referral_code);
        }
      }

      // Load commissions
      const commissionsResp = await api.getCommissions(100);
      if (commissionsResp.success && commissionsResp.data) {
        setCommissions(commissionsResp.data as unknown as Commission[]);
      }

      // Load referrals (team members)
      const teamResp = await api.getTeam();
      if (teamResp.success && teamResp.data) {
        setReferrals(teamResp.data || []);
      }
    } catch (error) {
      console.error('Error loading team data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string | null | undefined) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success('Code copié !');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Referral Code Section */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800">
        <div className="flex items-center space-x-2 mb-4">
         
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">Parrainage</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-slate-300 mb-3">Votre code de parrainage unique :</p>
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 bg-white dark:bg-slate-800 px-4 py-3 rounded-lg font-mono font-bold text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700">
            {referralCode || 'Non disponible'}
          </div>
          <button
            onClick={() => copyToClipboard(referralCode)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors"
            title="Copier le code"
          >
            <Copy className="w-5 h-5" />
          </button>
        </div>

        {/* Referral Link */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-slate-300 mb-2">Votre lien de parrainage :</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white dark:bg-slate-800 px-4 py-3 rounded-lg text-sm font-mono text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 break-all">
              {referralLink || 'Non disponible'}
            </div>
            <button
              onClick={() => copyToClipboard(referralLink)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors"
              title="Copier le lien"
            >
              <Copy className="w-5 h-5" />
            </button>
            {navigator.share && (
              <button
                onClick={() => {
                  navigator.share({
                    title: 'APUIC Capital - Parrainage',
                    text: 'Rejoins-moi sur APUIC Capital et gagnons ensemble !',
                    url: referralLink
                  }).catch(() => toast.info('Partage annulé'));
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg transition-colors"
                title="Partager le lien"
              >
                <span className="text-sm">Partager</span>
              </button>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-500 dark:text-slate-400">
          Commissions : Niveau 1: 30% | Niveau 2: 3% | Niveau 3: 3% - Crédités automatiquement après le premier dépôt
        </p>
      </div>

        {/* Referrals List */}
        <div className="space-y-3">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">Mes Parrainés</h3>
          {referrals.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-100 dark:border-slate-700 text-center">Aucun parrainé pour le moment.</div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {referrals.map((r) => (
                <div key={r.id} className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-gray-100 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">{r.full_name || r.phone || 'Utilisateur'}</div>
                    <div className="text-xs text-gray-500 dark:text-slate-400">{r.phone} • Inscrit le {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</div>
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">{r.status || ''}</div>
                </div>
              ))}
            </div>
          )}
        </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700 shadow-sm">
          <div className="text-sm text-gray-600 dark:text-slate-400 mb-2">Total Parrainés</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{referralStats?.total_referrals || 0}</div>
          <div className="text-xs text-gray-500 dark:text-slate-500 mt-2">
            {referralStats?.active_referrals || 0} actifs
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700 shadow-sm">
          <div className="text-sm text-gray-600 dark:text-slate-400 mb-2">Commission Niveau 1</div>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(referralStats?.level1_commission || 0)}
          </div>
          <div className="text-xs text-gray-500 dark:text-slate-500 mt-2">
            {referralStats?.level1_count || 0} parrainage(s)
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700 shadow-sm">
          <div className="text-sm text-gray-600 dark:text-slate-400 mb-2">Commission Niveau 2</div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(referralStats?.level2_commission || 0)}
          </div>
          <div className="text-xs text-gray-500 dark:text-slate-500 mt-2">
            {referralStats?.level2_count || 0} indirecte(s)
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700 shadow-sm">
          <div className="text-sm text-gray-600 dark:text-slate-400 mb-2">Commission Niveau 3</div>
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
            {formatCurrency(referralStats?.level3_commission || 0)}
          </div>
          <div className="text-xs text-gray-500 dark:text-slate-500 mt-2">
            {referralStats?.level3_count || 0} indirecte(s)
          </div>
        </div>
      </div>

      {/* Total Commission Highlight */}
      

      {/* Commission Breakdown Table */}
      <div className="space-y-3">
        <h3 className="font-bold text-lg text-gray-900 dark:text-white">Historique des Commissions</h3>
        
        {commissions.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center border border-gray-100 dark:border-slate-700">
            <AlertCircle className="w-12 h-12 mx-auto text-gray-400 dark:text-slate-500 mb-3" />
            <p className="text-gray-600 dark:text-slate-400">Aucune commission reçue pour le moment</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {commissions.map(commission => (
              <div
                key={commission.id}
                className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-100 dark:border-slate-700 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className={`p-2 rounded-lg ${
                      commission.level === 1
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : commission.level === 2
                        ? 'bg-blue-100 dark:bg-blue-900/30'
                        : 'bg-purple-100 dark:bg-purple-900/30'
                    }`}>
                      <Gift className={`w-4 h-4 ${
                        commission.level === 1
                          ? 'text-green-600 dark:text-green-400'
                          : commission.level === 2
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-purple-600 dark:text-purple-400'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        Niveau {commission.level}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-slate-400">
                        De {commission.from_user_name || commission.from_user_phone || 'Utilisateur'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-slate-500 mt-1">
                        {new Date(commission.created_at).toLocaleString('fr-FR')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600 dark:text-green-400 text-lg">
                      +{formatCurrency(commission.amount)}
                    </div>
                    <div className={`text-xs px-2 py-1 rounded mt-1 inline-block ${
                      commission.status === 'paid'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                    }`}>
                      {commission.status === 'paid' ? '✓ Payé' : '✓ Payé'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-xl p-4 border border-yellow-100 dark:border-yellow-800">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Commission Directe (Niveau 1)</h4>
          <p className="text-sm text-gray-600 dark:text-slate-300">30% des investissements de vos parrainés directs</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Commission Indirecte (Niveaux 2-3)</h4>
          <p className="text-sm text-gray-600 dark:text-slate-300">3% (Niveau 2) et 3% (Niveau 3) des investissements</p>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-pink-500 to-rose-600 rounded-2xl p-6 text-white shadow-lg">
        <h3 className="font-bold text-lg mb-2">Augmentez vos Commissions</h3>
        <p className="text-sm mb-4 opacity-90">Partagez votre code de parrainage et gagnez des commissions récurrentes sur les investissements de votre réseau.</p>
        <button
          onClick={() => copyToClipboard(referralCode)}
          className="bg-white text-pink-600 px-4 py-2 rounded-lg font-semibold hover:bg-pink-50 transition-colors"
        >
          Copier mon code
        </button>
      </div>
    </div>
  );
};
