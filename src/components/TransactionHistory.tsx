import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useToast } from './ToastContainer';

const TransactionHistory: React.FC = () => {
  const [tab, setTab] = useState<'deposits'|'withdrawals'|'commissions'|'earnings'>('deposits');
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any[]>([]);
  const toast = useToast();

  useEffect(() => {
    if (tab === 'deposits') {
      api.getMyDeposits().then(res => res?.success ? setDeposits(res.data || []) : toast.error(res.error || 'Erreur'))
        .catch(e => toast.error('Erreur'));
    }
    if (tab === 'withdrawals') {
      api.getMyWithdrawals().then(res => res?.success ? setWithdrawals(res.data || []) : toast.error(res.error || 'Erreur'))
        .catch(e => toast.error('Erreur'));
    }
    if (tab === 'commissions') {
      api.getCommissions().then(res => res?.success ? setCommissions(res.data || []) : toast.error(res.error || 'Erreur'))
        .catch(e => toast.error('Erreur'));
    }
    if (tab === 'earnings') {
      api.getDailyEarnings().then(res => res?.success ? setEarnings(res.data || []) : toast.error(res.error || 'Erreur'))
        .catch(e => toast.error('Erreur'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div className="p-4">
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('deposits')} className={`px-3 py-1 rounded ${tab==='deposits'?'bg-blue-500 text-white':'bg-slate-100'}`}>Dépôts</button>
        <button onClick={() => setTab('withdrawals')} className={`px-3 py-1 rounded ${tab==='withdrawals'?'bg-blue-500 text-white':'bg-slate-100'}`}>Retraits</button>
        <button onClick={() => setTab('commissions')} className={`px-3 py-1 rounded ${tab==='commissions'?'bg-blue-500 text-white':'bg-slate-100'}`}>Commissions</button>
        <button onClick={() => setTab('earnings')} className={`px-3 py-1 rounded ${tab==='earnings'?'bg-blue-500 text-white':'bg-slate-100'}`}>Gains produits</button>
      </div>

      <div>
        {tab === 'deposits' && (
          <div>
            {deposits.length ? deposits.map(d => (
              <div key={d.id} className="p-3 mb-2 border rounded">
                <div>Montant: {d.amount}</div>
                <div>Statut: {d.status}</div>
                <div>Date: {d.created_at}</div>
              </div>
            )) : <div className="text-sm text-slate-500">Aucun dépôt trouvé.</div>}
          </div>
        )}

        {tab === 'withdrawals' && (
          <div>
            {withdrawals.length ? withdrawals.map(w => (
              <div key={w.id} className="p-3 mb-2 border rounded">
                <div>Montant: {w.amount}</div>
                <div>Statut: {w.status}</div>
                <div>Date: {w.created_at}</div>
              </div>
            )) : <div className="text-sm text-slate-500">Aucun retrait trouvé.</div>}
          </div>
        )}

        {tab === 'commissions' && (
          <div>
            {commissions.length ? commissions.map(c => (
              <div key={c.id} className="p-3 mb-2 border rounded">
                <div>Montant: {c.amount}</div>
                <div>Statut: {c.status}</div>
                <div>Date: {c.created_at}</div>
              </div>
            )) : <div className="text-sm text-slate-500">Aucune commission trouvée.</div>}
          </div>
        )}

        {tab === 'earnings' && (
          <div>
            {earnings.length ? earnings.map(e => (
              <div key={e.id} className="p-3 mb-2 border rounded">
                <div>Montant: {e.amount}</div>
                <div>Date: {e.earning_date}</div>
              </div>
            )) : <div className="text-sm text-slate-500">Aucun gain trouvé.</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;
