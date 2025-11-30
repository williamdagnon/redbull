import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useToast } from './ToastContainer';

const ProductDetails: React.FC = () => {
  const [investments, setInvestments] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const toast = useToast();

  useEffect(() => {
    api.getVIPInvestments().then(res => {
      if (res?.success) setInvestments(res.data || []);
      else toast.error(res?.error || 'Erreur');
    }).catch(() => toast.error('Erreur'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-1">
          <h4 className="font-bold mb-2">Mes achats</h4>
          {investments.length ? investments.map(inv => (
            <div key={inv.id} onClick={() => setSelected(inv)} className={`p-3 mb-2 border rounded ${selected?.id === inv.id ? 'bg-slate-100' : ''}`}>
              <div className="font-medium">{inv.product_name || inv.vip_level}</div>
              <div className="text-sm">Montant: {inv.amount}</div>
              <div className="text-sm">Statut: {inv.status}</div>
            </div>
          )) : <div className="text-sm text-slate-500">Aucun achat trouvé.</div>}
        </div>

        <div className="col-span-2">
          <h4 className="font-bold mb-2">Détails</h4>
          {selected ? (
            <div className="p-3 border rounded">
              <div>Produit: {selected.product_name || selected.vip_level}</div>
              <div>Montant: {selected.amount}</div>
              <div>Retour journalier: {selected.daily_return_amount}</div>
              <div>Début: {selected.start_date}</div>
              <div>Fin: {selected.end_date}</div>
              <div>Gain accumulé: {selected.total_earned}</div>
            </div>
          ) : (
            <div className="text-sm text-slate-500">Sélectionnez un achat pour voir les détails.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
