import api from './api';
import { PaymentMethodPayload } from '../types/extra';

export const adminApi = {
  // Stats
  getStats: async () => {
    try {
      const response = await (api as any).request('/admin/stats', { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching stats:', error);
      return { success: false, error: 'Erreur lors de la récupération des statistiques' };
    }
  },

  // Users
  getAllUsers: async (limit = 100) => {
    try {
      const response = await (api as any).request(`/admin/users?limit=${limit}`, { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching users:', error);
      return { success: false, error: 'Erreur lors de la récupération des utilisateurs' };
    }
  },

  toggleUserStatus: async (userId: string, isActive: boolean) => {
    try {
      const response = await (api as any).request(`/admin/users/${userId}/toggle-status`, {
        method: 'POST',
        body: JSON.stringify({ is_active: isActive })
      });
      return response;
    } catch (error) {
      console.error('Error toggling user status:', error);
      return { success: false, error: 'Erreur lors de la mise à jour' };
    }
  },

  // Deposits
  getAllDeposits: async (status?: string, limit = 100) => {
    try {
      const query = new URLSearchParams();
      if (status) query.append('status', status);
      query.append('limit', limit.toString());
      const response = await (api as any).request(`/admin/deposits?${query}`, { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching deposits:', error);
      return { success: false, error: 'Erreur lors de la récupération des dépôts' };
    }
  },

  // Deposit approvals (detailed submissions)
  getDepositApprovals: async (status: string = 'pending', limit = 100) => {
    try {
      const q = new URLSearchParams();
      if (status) q.append('status', status);
      q.append('limit', limit.toString());
      const response = await (api as any).request(`/admin/deposit-approvals?${q}`, { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching deposit approvals:', error);
      return { success: false, error: 'Erreur lors de la récupération des approbations de dépôts' };
    }
  },

  approveDeposit: async (depositId: string) => {
    try {
      const response = await (api as any).request(`/admin/deposits/${depositId}/approve`, { method: 'POST' });
      return response;
    } catch (error) {
      console.error('Error approving deposit:', error);
      return { success: false, error: 'Erreur lors de l\'approbation' };
    }
  },

  rejectDeposit: async (depositId: string) => {
    try {
      const response = await (api as any).request(`/admin/deposits/${depositId}/reject`, { method: 'POST' });
      return response;
    } catch (error) {
      console.error('Error rejecting deposit:', error);
      return { success: false, error: 'Erreur lors du rejet' };
    }
  },

  // Deposit approvals actions (by approval id)
  approveDepositApproval: async (approvalId: string) => {
    try {
      const response = await (api as any).request(`/admin/deposit-approvals/${approvalId}/approve`, { method: 'POST' });
      return response;
    } catch (error) {
      console.error('Error approving deposit approval:', error);
      return { success: false, error: 'Erreur lors de l\'approbation' };
    }
  },

  rejectDepositApproval: async (approvalId: string, reason?: string) => {
    try {
      const response = await (api as any).request(`/admin/deposit-approvals/${approvalId}/reject`, { method: 'POST', body: JSON.stringify({ reason }) });
      return response;
    } catch (error) {
      console.error('Error rejecting deposit approval:', error);
      return { success: false, error: 'Erreur lors du rejet' };
    }
  },


  // Withdrawals
  getAllWithdrawals: async (status?: string, limit = 100) => {
    try {
      const query = new URLSearchParams();
      if (status) query.append('status', status);
      query.append('limit', limit.toString());
      const response = await (api as any).request(`/admin/withdrawals?${query}`, { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      return { success: false, error: 'Erreur lors de la récupération des retraits' };
    }
  },

  // Withdrawal approvals (detailed submissions)
  getWithdrawalApprovals: async (status: string = 'pending', limit = 100) => {
    try {
      const q = new URLSearchParams();
      if (status) q.append('status', status);
      q.append('limit', limit.toString());
      const response = await (api as any).request(`/admin/withdrawal-approvals?${q}`, { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching withdrawal approvals:', error);
      return { success: false, error: 'Erreur lors de la récupération des approbations de retraits' };
    }
  },

  approveWithdrawal: async (withdrawalId: string) => {
    try {
      const response = await (api as any).request(`/admin/withdrawals/${withdrawalId}/approve`, { method: 'POST' });
      return response;
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      return { success: false, error: 'Erreur lors de l\'approbation' };
    }
  },

  rejectWithdrawal: async (withdrawalId: string) => {
    try {
      const response = await (api as any).request(`/admin/withdrawals/${withdrawalId}/reject`, { method: 'POST' });
      return response;
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      return { success: false, error: 'Erreur lors du rejet' };
    }
  },

  // Withdrawal approvals actions (by approval id)
  approveWithdrawalApproval: async (approvalId: string) => {
    try {
      const response = await (api as any).request(`/admin/withdrawal-approvals/${approvalId}/approve`, { method: 'POST' });
      return response;
    } catch (error) {
      console.error('Error approving withdrawal approval:', error);
      return { success: false, error: 'Erreur lors de l\'approbation' };
    }
  },

  rejectWithdrawalApproval: async (approvalId: string, reason?: string) => {
    try {
      const response = await (api as any).request(`/admin/withdrawal-approvals/${approvalId}/reject`, { method: 'POST', body: JSON.stringify({ notes: reason }) });
      return response;
    } catch (error) {
      console.error('Error rejecting withdrawal approval:', error);
      return { success: false, error: 'Erreur lors du rejet' };
    }
  },

  // VIP Investments
  getAllVIPInvestments: async (status?: string, limit = 100) => {
    try {
      const query = new URLSearchParams();
      if (status) query.append('status', status);
      query.append('limit', limit.toString());
      const response = await (api as any).request(`/admin/vip-investments?${query}`, { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching VIP investments:', error);
      return { success: false, error: 'Erreur lors de la récupération des investissements VIP' };
    }
  },

  // VIP Products CRUD
  getAllVIPProducts: async () => {
    try {
      const response = await (api as any).request('/admin/vip-products', { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching VIP products:', error);
      return { success: false, error: 'Erreur lors de la récupération des produits VIP' };
    }
  },

  createVIPProduct: async (data: { level: number; name: string; min_amount: number; daily_return?: number; duration?: number; color?: string; is_active?: boolean }) => {
    try {
      const response = await (api as any).request('/admin/vip-products', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return response;
    } catch (error) {
      console.error('Error creating VIP product:', error);
      return { success: false, error: 'Erreur lors de la création du produit VIP' };
    }
  },

  updateVIPProduct: async (productId: string, data: any) => {
    try {
      const response = await (api as any).request(`/admin/vip-products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      return response;
    } catch (error) {
      console.error('Error updating VIP product:', error);
      return { success: false, error: 'Erreur lors de la mise à jour du produit VIP' };
    }
  },

  deleteVIPProduct: async (productId: string) => {
    try {
      const response = await (api as any).request(`/admin/vip-products/${productId}`, { method: 'DELETE' });
      return response;
    } catch (error) {
      console.error('Error deleting VIP product:', error);
      return { success: false, error: 'Erreur lors de la suppression du produit VIP' };
    }
  },

  // User CRUD
  createUser: async (data: any) => {
    try {
      const response = await (api as any).request('/admin/users', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return response;
    } catch (error) {
      console.error('Error creating user:', error);
      return { success: false, error: 'Erreur lors de la création d\'utilisateur' };
    }
  },

  updateUser: async (userId: string, data: any) => {
    try {
      const response = await (api as any).request(`/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      return response;
    } catch (error) {
      console.error('Error updating user:', error);
      return { success: false, error: 'Erreur lors de la mise à jour d\'utilisateur' };
    }
  },

  deleteUser: async (userId: string) => {
    try {
      const response = await (api as any).request(`/admin/users/${userId}`, { method: 'DELETE' });
      return response;
    } catch (error) {
      console.error('Error deleting user:', error);
      return { success: false, error: 'Erreur lors de la suppression d\'utilisateur' };
    }
  },

  // Adjust user balance (admin)
  adjustUserBalance: async (userId: string, amount: number, type: 'credit' | 'debit', reason?: string) => {
    try {
      const response = await (api as any).request(`/admin/users/${userId}/adjust-balance`, {
        method: 'POST',
        body: JSON.stringify({ amount, type, reason })
      });
      return response;
    } catch (error) {
      console.error('Error adjusting user balance:', error);
      return { success: false, error: 'Erreur lors de l\'ajustement du solde' };
    }
  },

  // Banks CRUD
  getAllBanks: async () => {
    try {
      const response = await (api as any).request('/admin/banks', { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching banks:', error);
      return { success: false, error: 'Erreur lors de la récupération des banques' };
    }
  },

  deleteBank: async (bankId: string, force?: boolean) => {
    try {
      const qp = force ? '?force=true' : '';
      const response = await (api as any).request(`/admin/banks/${bankId}${qp}`, { method: 'DELETE' });
      return response;
    } catch (error) {
      console.error('Error deleting bank:', error);
      return { success: false, error: 'Erreur lors de la suppression de la banque' };
    }
  },

  updateVIPInvestmentStatus: async (investmentId: string, status: string) => {
    try {
      const response = await (api as any).request(`/admin/vip-investments/${investmentId}/toggle-status`, {
        method: 'POST',
        body: JSON.stringify({ status })
      });
      return response;
    } catch (error) {
      console.error('Error updating investment status:', error);
      return { success: false, error: 'Erreur lors de la mise à jour du statut' };
    }
  },

  // Logs
  getLogs: async (limit = 200) => {
    try {
      const response = await (api as any).request(`/admin/logs?limit=${limit}`, { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching logs:', error);
      return { success: false, error: 'Erreur lors de la récupération des logs' };
    }
  },

  // Banks
  getBanks: async () => {
    try {
      const response = await (api as any).request('/admin/banks', { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching banks:', error);
      return { success: false, error: 'Erreur lors de la récupération des banques' };
    }
  },

  createBank: async (name: string, code?: string, countryCode?: string) => {
    try {
      const response = await (api as any).request('/admin/banks', {
        method: 'POST',
        body: JSON.stringify({ name, code, country_code: countryCode })
      });
      return response;
    } catch (error) {
      console.error('Error creating bank:', error);
      return { success: false, error: 'Erreur lors de la création de la banque' };
    }
  },

  // Payment Methods CRUD
  getAllPaymentMethods: async () => {
    try {
      const response = await (api as any).request('/admin/payment-methods', { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      return { success: false, error: 'Erreur lors de la récupération des modes de paiement' };
    }
  },

  createPaymentMethod: async (data: PaymentMethodPayload) => {
    try {
      const payload: PaymentMethodPayload = { ...data };
      const response = await (api as any).request('/admin/payment-methods', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      return response;
    } catch (error) {
      console.error('Error creating payment method:', error);
      return { success: false, error: 'Erreur lors de la création du mode de paiement' };
    }
  },

  togglePaymentMethod: async (id: string) => {
    try {
      const response = await (api as any).request(`/admin/payment-methods/${id}/toggle`, { method: 'PUT' });
      return response;
    } catch (error) {
      console.error('Error toggling payment method:', error);
      return { success: false, error: 'Erreur lors de la mise à jour du mode de paiement' };
    }
  },

  deletePaymentMethod: async (id: string) => {
    try {
      const response = await (api as any).request(`/admin/payment-methods/${id}`, { method: 'DELETE' });
      return response;
    } catch (error) {
      console.error('Error deleting payment method:', error);
      return { success: false, error: 'Erreur lors de la suppression du mode de paiement' };
    }
  },

  // Reports
  getDepositReport: async (startDate?: string, endDate?: string) => {
    try {
      const query = new URLSearchParams();
      if (startDate) query.append('start_date', startDate);
      if (endDate) query.append('end_date', endDate);
      const response = await (api as any).request(`/admin/reports/deposits?${query}`, { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching deposit report:', error);
      return { success: false, error: 'Erreur lors de la génération du rapport' };
    }
  },

  getWithdrawalReport: async (startDate?: string, endDate?: string) => {
    try {
      const query = new URLSearchParams();
      if (startDate) query.append('start_date', startDate);
      if (endDate) query.append('end_date', endDate);
      const response = await (api as any).request(`/admin/reports/withdrawals?${query}`, { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching withdrawal report:', error);
      return { success: false, error: 'Erreur lors de la génération du rapport' };
    }
  },

  // ==================== GIFT CODES ====================
  createGiftCode: async (amount: number, expiresInMinutes?: number) => {
    try {
      const response = await (api as any).request('/gift/admin/create', {
        method: 'POST',
        body: JSON.stringify({ amount, expires_in_minutes: expiresInMinutes || 30 })
      });
      return response;
    } catch (error) {
      console.error('Error creating gift code:', error);
      return { success: false, error: 'Erreur lors de la création du code cadeau' };
    }
  },

  getGiftCodes: async (includeRedeemed: boolean = false, limit: number = 100) => {
    try {
      const query = new URLSearchParams();
      query.append('include_redeemed', includeRedeemed.toString());
      query.append('limit', limit.toString());
      const response = await (api as any).request(`/gift/admin/list?${query}`, { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching gift codes:', error);
      return { success: false, error: 'Erreur lors de la récupération des codes cadeaux' };
    }
  },

  deleteGiftCode: async (codeId: string) => {
    try {
      const response = await (api as any).request(`/gift/admin/${codeId}`, { method: 'DELETE' });
      return response;
    } catch (error) {
      console.error('Error deleting gift code:', error);
      return { success: false, error: 'Erreur lors de la suppression du code cadeau' };
    }
  },

  getGiftCodeStats: async () => {
    try {
      const response = await (api as any).request('/gift/admin/stats', { method: 'GET' });
      return response;
    } catch (error) {
      console.error('Error fetching gift code stats:', error);
      return { success: false, error: 'Erreur lors de la récupération des statistiques' };
    }
  },
};

export default adminApi;

