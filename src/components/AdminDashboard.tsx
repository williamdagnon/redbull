import React, { useEffect, useState } from 'react';
import {
  LogOut, BarChart3, Users, TrendingUp, FileText, CheckCircle,
  XCircle, Clock, AlertCircle, Loader, Settings, Activity,
  Ban, Unlock, Crown, RefreshCw, Wallet, Plus, Edit2, Trash2,
  Building2, Zap, Gift, Copy, Check
} from 'lucide-react';
import { useToast } from './ToastContainer';
import { formatCurrency } from '../utils/calculations';
import { adminApi } from '../utils/adminApi';
import { FormModal, ConfirmDialog } from './AdminForms';
import { UserType } from '../types';

interface Props {
  user?: UserType | null;
  onLogout: () => void;
}

type AdminTab = 'stats' | 'deposits' | 'withdrawals' | 'users' | 'vip' | 'banks' | 'paymentMethods' | 'investments' | 'logs' | 'gift-codes' | 'settings';

interface Deposit {
  id: string;
  user_id: string;
  amount: number;
  payment_method: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user?: { phone: string; full_name?: string };
}

interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  bank_name: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user?: { phone: string; full_name?: string };
}

interface User {
  id: string;
  phone: string;
  full_name?: string;
  country_code: string;
  balance?: number;
  total_invested?: number;
  total_earned?: number;
  is_active?: boolean;
  referral_code?: string;
  created_at: string;
}

interface VIPProduct {
  id: string;
  level: number;
  name: string;
  min_amount: number;
  daily_return?: number;
  duration?: number;
  color?: string;
  is_active: boolean;
  created_at: string;
}

interface Bank {
  id: string;
  name: string;
  code?: string;
  country_code?: string;
  is_active?: boolean;
  created_at: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  code?: string;
  description?: string;
  is_active?: boolean;
  created_at?: string;
  bank_id?: string;
  bank_name?: string;
}

interface UserInvestment {
  id: string;
  user_id: string;
  product_id: string;
  amount: number;
  status: 'active' | 'completed' | 'cancelled' | 'paused';
  start_date: string;
  end_date?: string;
  user?: { phone: string; full_name?: string };
  product?: { name: string; level?: number };
}

interface Stats {
  totalUsers: number;
  totalDeposits: number;
  pendingDeposits: number;
  totalWithdrawals: number;
  pendingWithdrawals: number;
  totalInvestments: number;
  activeInvestments: number;
  totalCommissions: number;
  totalVolume?: number;
  activeUsers?: number;
}

interface ActivityLog {
  id: string;
  user_id?: string;
  admin_id?: string;
  action: string;
  details?: string;
  created_at: string;
  user_phone?: string;
  user_name?: string;
  admin_phone?: string;
  admin_name?: string;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export const AdminDashboard: React.FC<Props> = ({ user, onLogout }) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<AdminTab>('stats');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Stats State
  const [stats, setStats] = useState<Stats | null>(null);

  // Deposits State
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [depositFilter, setDepositFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [depositApprovals, setDepositApprovals] = useState<any[]>([]);

  // Withdrawals State
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [withdrawalFilter, setWithdrawalFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [withdrawalApprovals, setWithdrawalApprovals] = useState<any[]>([]);

  // Users State
  const [users, setUsers] = useState<User[]>([]);
  const [vipProducts, setVipProducts] = useState<VIPProduct[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [userInvestments, setUserInvestments] = useState<UserInvestment[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  // Gift Codes State
  const [giftCodes, setGiftCodes] = useState<any[]>([]);
  const [giftCodeStats, setGiftCodeStats] = useState<any>(null);
  const [showGiftCodeModal, setShowGiftCodeModal] = useState(false);
  const [giftCodeAmount, setGiftCodeAmount] = useState<number | string>('');
  const [giftCodeExpiresInMinutes, setGiftCodeExpiresInMinutes] = useState<number | string>(30);

  // Modal & Dialog State
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustTargetUser, setAdjustTargetUser] = useState<User | null>(null);
  const [isAdjustLoading, setIsAdjustLoading] = useState(false);
  const [showVipModal, setShowVipModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: string; id: string; title: string; message: string } | null>(null);
  const [forceDelete, setForceDelete] = useState(false);

  // Load Stats
  const loadStats = async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.getStats() as ApiResponse<Stats>;
      if (response?.success && response?.data) {
        setStats(response.data);
      } else {
        toast.error('Erreur lors du chargement des statistiques');
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  // Load Deposits
  const loadDeposits = async (filter?: 'all' | 'pending' | 'approved' | 'rejected') => {
    setIsLoading(true);
    try {
      if (filter === 'pending') {
        // load detailed approval queue for pending
        await loadDepositApprovals();
      } else {
        const response = await adminApi.getAllDeposits(filter === 'all' ? undefined : filter) as ApiResponse<Deposit[]>;
        if (response?.success && response?.data) {
          setDeposits(response.data);
        } else {
          toast.error('Erreur lors du chargement des dépôts');
        }
      }
    } catch (error) {
      console.error('Error loading deposits:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDepositApprovals = async (status: string = 'pending', limit = 200) => {
    setIsLoading(true);
    try {
      const response = await adminApi.getDepositApprovals(status, limit) as ApiResponse<any[]>;
      if (response?.success && response?.data) {
        setDepositApprovals(response.data);
      } else {
        toast.error('Erreur lors du chargement des approbations de dépôts');
      }
    } catch (error) {
      console.error('Error loading deposit approvals:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  // Load Withdrawals
  const loadWithdrawals = async (filter?: 'all' | 'pending' | 'approved' | 'rejected') => {
    setIsLoading(true);
    try {
      if (filter === 'pending') {
        await loadWithdrawalApprovals();
      } else {
        const response = await adminApi.getAllWithdrawals(filter === 'all' ? undefined : filter) as ApiResponse<Withdrawal[]>;
        if (response?.success && response?.data) {
          setWithdrawals(response.data);
        } else {
          toast.error('Erreur lors du chargement des retraits');
        }
      }
    } catch (error) {
      console.error('Error loading withdrawals:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const loadWithdrawalApprovals = async (status: string = 'pending', limit = 200) => {
    setIsLoading(true);
    try {
      const response = await adminApi.getWithdrawalApprovals(status, limit) as ApiResponse<any[]>;
      if (response?.success && response?.data) {
        setWithdrawalApprovals(response.data);
      } else {
        toast.error('Erreur lors du chargement des approbations de retraits');
      }
    } catch (error) {
      console.error('Error loading withdrawal approvals:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  // Load Users
  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.getAllUsers() as ApiResponse<User[]>;
      if (response?.success && response?.data) {
        setUsers(response.data);
      } else {
        toast.error('Erreur lors du chargement des utilisateurs');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  // Load VIP Products
  const loadVipProducts = async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.getAllVIPProducts() as ApiResponse<VIPProduct[]>;
      if (response?.success && response?.data) {
        setVipProducts(response.data);
      } else {
        toast.error('Erreur lors du chargement des produits VIP');
      }
    } catch (error) {
      console.error('Error loading VIP products:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  // Load Banks
  const loadBanks = async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.getAllBanks() as ApiResponse<Bank[]>;
      if (response?.success && response?.data) {
        setBanks(response.data);
      } else {
        toast.error('Erreur lors du chargement des banques');
      }
    } catch (error) {
      console.error('Error loading banks:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  // Load Payment Methods
  const loadPaymentMethods = async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.getAllPaymentMethods() as ApiResponse<PaymentMethod[]>;
      if (response?.success && response?.data) {
        setPaymentMethods(response.data);
      } else {
        toast.error('Erreur lors du chargement des modes de paiement');
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  // Load User Investments
  const loadUserInvestments = async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.getAllVIPInvestments() as ApiResponse<UserInvestment[]>;
      if (response?.success && response?.data) {
        setUserInvestments(response.data);
      } else {
        toast.error('Erreur lors du chargement des investissements');
      }
    } catch (error) {
      console.error('Error loading investments:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  // Load Logs
  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.getLogs() as ApiResponse<ActivityLog[]>;
      if (response?.success && response?.data) {
        setLogs(response.data);
      } else {
        toast.error('Erreur lors du chargement des logs');
      }
    } catch (error) {
      console.error('Error loading logs:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  // Load Gift Codes
  const loadGiftCodes = async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.getGiftCodes(false, 200) as ApiResponse<any[]>;
      if (response?.success && response?.data) {
        setGiftCodes(response.data);
      } else {
        toast.error('Erreur lors du chargement des codes cadeaux');
      }
    } catch (error) {
      console.error('Error loading gift codes:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  // Load Gift Code Stats
  const loadGiftCodeStats = async () => {
    try {
      const response = await adminApi.getGiftCodeStats() as ApiResponse<any>;
      if (response?.success && response?.data) {
        setGiftCodeStats(response.data);
      }
    } catch (error) {
      console.error('Error loading gift code stats:', error);
    }
  };

  // Handle Tab Change
  const handleTabChange = async (tab: AdminTab) => {
    setActiveTab(tab);
    if (tab === 'stats') await loadStats();
    else if (tab === 'deposits') await loadDeposits(depositFilter);
    else if (tab === 'withdrawals') {
      await loadWithdrawals(withdrawalFilter);
      // Ensure payment methods are loaded so we can resolve method names in the approvals list
      await loadPaymentMethods();
    }
    else if (tab === 'users') await loadUsers();
    else if (tab === 'vip') await loadVipProducts();
    else if (tab === 'banks') await loadBanks();
    else if (tab === 'paymentMethods') await loadPaymentMethods();
    else if (tab === 'investments') await loadUserInvestments();
    else if (tab === 'logs') await loadLogs();
    else if (tab === 'gift-codes') {
      await loadGiftCodes();
      await loadGiftCodeStats();
    }
  };

  // Approve/Reject Deposit
  const handleDepositAction = async (depositId: string, action: 'approve' | 'reject') => {
    setIsLoading(true);
    try {
      const response = action === 'approve' 
        ? await adminApi.approveDeposit(depositId)
        : await adminApi.rejectDeposit(depositId);

      if (response.success) {
        toast.success(`Dépôt ${action === 'approve' ? 'approuvé' : 'rejeté'}`);
        await loadDeposits(depositFilter);
      } else {
        toast.error(response.error || 'Erreur lors de l\'opération');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur lors de l\'opération');
    } finally {
      setIsLoading(false);
    }
  };

  // Approve/Reject Withdrawal
  const handleWithdrawalAction = async (withdrawalId: string, action: 'approve' | 'reject') => {
    setIsLoading(true);
    try {
      const response = action === 'approve'
        ? await adminApi.approveWithdrawal(withdrawalId)
        : await adminApi.rejectWithdrawal(withdrawalId);

      if (response.success) {
        toast.success(`Retrait ${action === 'approve' ? 'approuvé' : 'rejeté'}`);
        await loadWithdrawals(withdrawalFilter);
      } else {
        toast.error(response.error || 'Erreur lors de l\'opération');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur lors de l\'opération');
    } finally {
      setIsLoading(false);
    }
  };

  // Create User
  const handleCreateUser = async (data: Record<string, string | number>) => {
    const response = await adminApi.createUser(data);
    if (response.success) {
      toast.success('Utilisateur créé avec succès');
      await loadUsers();
      setShowUserModal(false);
    } else {
      throw new Error(response.error || 'Erreur');
    }
  };

  // Create VIP Product
  const handleCreateVipProduct = async (data: Record<string, string | number>) => {
    const vipData = {
      level: Number(data.level),
      name: String(data.name),
      min_amount: Number(data.min_amount),
      daily_return: data.daily_return ? Number(data.daily_return) : undefined,
      duration: data.duration ? Number(data.duration) : undefined,
    };
    const response = await adminApi.createVIPProduct(vipData);
    if (response.success) {
      toast.success('Produit VIP créé avec succès');
      await loadVipProducts();
      setShowVipModal(false);
    } else {
      throw new Error(response.error || 'Erreur');
    }
  };

  // Create Bank
  const handleCreateBank = async (data: Record<string, string | number>) => {
    const response = await adminApi.createBank(String(data.name), data.code ? String(data.code) : undefined, data.country_code ? String(data.country_code) : undefined);
    if (response.success) {
      toast.success('Banque créée avec succès');
      await loadBanks();
      setShowBankModal(false);
    } else {
      throw new Error(response.error || 'Erreur');
    }
  };

  // Delete Bank (optional force to reassign payment methods)
  const handleDeleteBank = async (bankId: string, force = false) => {
    const response = await adminApi.deleteBank(bankId, force);
    if (response.success) {
      toast.success('Banque supprimée');
      await loadBanks();
    } else {
      throw new Error(response.error || 'Erreur');
    }
  };

  // Create Payment Method
  const handleCreatePaymentMethod = async (data: Record<string, string | number>) => {
    const payload: import('../types/extra').PaymentMethodPayload = {
      name: String(data.name),
      code: String(data.code || ''),
      description: data.description ? String(data.description) : undefined,
      bank_id: data.bank_id ? String(data.bank_id) : undefined,
      account_holder_name: data.account_holder_name ? String(data.account_holder_name) : undefined,
      account_number: data.account_number ? String(data.account_number) : undefined,
      min_deposit: typeof data.min_deposit !== 'undefined' ? Number(data.min_deposit) : undefined,
    };

    const response = await adminApi.createPaymentMethod(payload);
    if (response.success) {
      toast.success('Mode de paiement créé avec succès');
      await loadPaymentMethods();
      setShowPaymentModal(false);
    } else {
      throw new Error(response.error || 'Erreur');
    }
  };

  // Toggle Payment Method
  const handleTogglePaymentMethod = async (id: string) => {
    const response = await adminApi.togglePaymentMethod(id);
    if (response.success) {
      toast.success('Mode de paiement mis à jour');
      await loadPaymentMethods();
    } else {
      toast.error(response.error || 'Erreur');
    }
  };

  const handleDeletePaymentMethod = async (id: string) => {
    const response = await adminApi.deletePaymentMethod(id);
    if (response.success) {
      toast.success('Mode de paiement supprimé');
      await loadPaymentMethods();
    } else {
      toast.error(response.error || 'Erreur');
    }
  };

  // Update Investment Status
  const handleUpdateInvestmentStatus = async (investmentId: string, newStatus: string) => {
    const response = await adminApi.updateVIPInvestmentStatus(investmentId, newStatus);
    if (response.success) {
      toast.success('Investissement mis à jour');
      await loadUserInvestments();
    } else {
      throw new Error(response.error || 'Erreur');
    }
  };

  // Create Gift Code
  const handleCreateGiftCode = async () => {
    if (!giftCodeAmount || Number(giftCodeAmount) <= 0) {
      toast.error('Montant invalide');
      return;
    }

    if (!giftCodeExpiresInMinutes || Number(giftCodeExpiresInMinutes) <= 0) {
      toast.error('Durée d\'expiration invalide');
      return;
    }

    setIsLoading(true);
    try {
      const response = await adminApi.createGiftCode(Number(giftCodeAmount), Number(giftCodeExpiresInMinutes));
      if (response.success) {
        toast.success(`Code cadeau créé: ${response.data?.code}`);
        setGiftCodeAmount('');
        setGiftCodeExpiresInMinutes(30);
        setShowGiftCodeModal(false);
        await loadGiftCodes();
        await loadGiftCodeStats();
      } else {
        toast.error(response.error || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete Gift Code
  const handleDeleteGiftCode = async (codeId: string) => {
    setIsLoading(true);
    try {
      const response = await adminApi.deleteGiftCode(codeId);
      if (response.success) {
        toast.success('Code cadeau supprimé');
        await loadGiftCodes();
        await loadGiftCodeStats();
      } else {
        toast.error(response.error || 'Erreur');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle User Status
  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await adminApi.toggleUserStatus(userId, !currentStatus);
      if (response.success) {
        toast.success(`Utilisateur ${!currentStatus ? 'débloqué' : 'bloqué'}`);
        await loadUsers();
      } else {
        toast.error(response.error || 'Erreur lors de l\'opération');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur lors de l\'opération');
    }
  };

  // Open adjust balance modal
  const openAdjustModal = (user: User) => {
    setAdjustTargetUser(user);
    setShowAdjustModal(true);
  };

  // Submit adjust balance (admin)
  const handleAdjustSubmit = async (data: Record<string, string | number>) => {
    if (!adjustTargetUser) return;
    const amount = Number(data.amount);
    const type = String(data.type) as 'credit' | 'debit';
    const reason = data.reason ? String(data.reason) : undefined;

    setIsAdjustLoading(true);
    try {
      const response = await adminApi.adjustUserBalance(adjustTargetUser.id, amount, type, reason);
      if (response.success) {
        toast.success('Solde ajusté avec succès');
        await loadUsers();
        setShowAdjustModal(false);
        setAdjustTargetUser(null);
      } else {
        throw new Error(response.error || 'Erreur lors de l\'ajustement');
      }
    } catch (error: any) {
      console.error('Adjust error:', error);
      toast.error(error?.message || 'Erreur lors de l\'opération');
    } finally {
      setIsAdjustLoading(false);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      if (activeTab === 'stats') {
        await loadStats();
      } else if (activeTab === 'deposits') {
        await loadDeposits(depositFilter);
      } else if (activeTab === 'withdrawals') {
        await loadWithdrawals(withdrawalFilter);
      } else if (activeTab === 'users') {
        await loadUsers();
      } else if (activeTab === 'vip') {
        await loadVipProducts();
      } else if (activeTab === 'banks') {
        await loadBanks();
      } else if (activeTab === 'investments') {
        await loadUserInvestments();
      } else if (activeTab === 'logs') {
        await loadLogs();
      }
    };

    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Render Stats Tab
  const renderStatsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-6 h-6" />
            <span className="text-3xl font-bold">{stats?.totalUsers || 0}</span>
          </div>
          <p className="text-sm opacity-90">Utilisateurs Total</p>
        </div>

        {/* Total Deposits */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-6 h-6" />
            <span className="text-xl font-bold">{formatCurrency(stats?.totalDeposits || 0)}</span>
          </div>
          <p className="text-sm opacity-90">Dépôts Total</p>
        </div>

        {/* Pending Deposits */}
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-6 h-6" />
            <span className="text-3xl font-bold">{stats?.pendingDeposits || 0}</span>
          </div>
          <p className="text-sm opacity-90">Dépôts En Attente</p>
        </div>

        {/* Total Withdrawals */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition">
          <div className="flex items-center justify-between mb-2">
            <FileText className="w-6 h-6" />
            <span className="text-xl font-bold">{formatCurrency(stats?.totalWithdrawals || 0)}</span>
          </div>
          <p className="text-sm opacity-90">Retraits Total</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pending Withdrawals */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="w-6 h-6" />
            <span className="text-3xl font-bold">{stats?.pendingWithdrawals || 0}</span>
          </div>
          <p className="text-sm opacity-90">Retraits En Attente</p>
        </div>

        {/* Active Investments */}
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="w-6 h-6" />
            <span className="text-3xl font-bold">{stats?.activeInvestments || 0}</span>
          </div>
          <p className="text-sm opacity-90">Investissements Actifs</p>
        </div>

        {/* Total Commissions */}
        <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition">
          <div className="flex items-center justify-between mb-2">
            <Wallet className="w-6 h-6" />
            <span className="text-xl font-bold">{formatCurrency(stats?.totalCommissions || 0)}</span>
          </div>
          <p className="text-sm opacity-90">Commissions Total</p>
        </div>
      </div>
    </div>
  );

  // Render Deposits Tab
  const renderDepositsTab = () => (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'approved', 'rejected'] as const).map(filter => (
          <button
            key={filter}
            onClick={() => {
              setDepositFilter(filter);
              loadDeposits(filter);
            }}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              depositFilter === filter
                ? 'bg-green-500 text-white shadow-lg'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {filter === 'all' ? 'Tous' : filter === 'pending' ? 'En Attente' : filter === 'approved' ? 'Approuvés' : 'Rejetés'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader className="w-8 h-8 animate-spin text-green-500" />
        </div>
      ) : (
        <div className="space-y-3">
          {depositFilter === 'pending' ? (
            depositApprovals.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Aucun dépôt en attente</p>
            ) : (
              depositApprovals.map((appr: any) => (
                <div key={appr.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-semibold text-gray-900">{appr.user_name || appr.user_id}</div>
                      <div className="text-sm text-gray-600">Numéro de dépôt: {appr.customer_mobile || 'N/A'}</div>
                    </div>
                    <div className="text-right text-sm text-gray-500">{new Date(appr.created_at).toLocaleString('fr-FR')}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                    <div>
                      <div className="text-xs text-gray-600">Montant</div>
                      <div className="font-semibold text-gray-900">{formatCurrency(appr.amount)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Méthode</div>
                      <div className="font-semibold text-gray-900">{appr.payment_method || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">ID de transfert</div>
                      <div className="font-semibold text-gray-900">{appr.transfer_id || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Id utilisateur</div>
                      <div className="font-semibold text-gray-900">{appr.deposit_id || 'N/A'}</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        if (!confirm('Approuver ce dépôt ?')) return;
                        setIsLoading(true);
                        try {
                          const res = await adminApi.approveDepositApproval(appr.id);
                          if (res.success) {
                            toast.success('Dépôt approuvé');
                            await loadDepositApprovals();
                          } else {
                            toast.error(res.error || 'Erreur');
                          }
                        } catch (err) {
                          console.error(err);
                          toast.error('Erreur');
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                    >
                      Approuver
                    </button>
                    <button
                      onClick={async () => {
                        const reason = prompt('Raison du rejet (optionnel) :') || undefined;
                        if (reason === null) return;
                        setIsLoading(true);
                        try {
                          const res = await adminApi.rejectDepositApproval(appr.id, reason);
                          if (res.success) {
                            toast.success('Dépôt rejeté');
                            await loadDepositApprovals();
                          } else {
                            toast.error(res.error || 'Erreur');
                          }
                        } catch (err) {
                          console.error(err);
                          toast.error('Erreur');
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                    >
                      Rejeter
                    </button>
                  </div>
                </div>
              ))
            )
          ) : (
            deposits.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Aucun dépôt trouvé</p>
            ) : (
              deposits.map((deposit: Deposit) => (
                <div key={deposit.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:shadow-md transition">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{deposit.user?.phone || deposit.user_id}</div>
                    <div className="text-sm text-gray-600">
                      {deposit.payment_method} • {formatCurrency(deposit.amount)} •{' '}
                      {new Date(deposit.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        deposit.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : deposit.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {deposit.status === 'pending'
                        ? 'En Attente'
                        : deposit.status === 'approved'
                        ? 'Approuvé'
                        : 'Rejeté'}
                    </span>

                    {deposit.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDepositAction(deposit.id, 'approve')}
                          disabled={isLoading}
                          className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition"
                          title="Approuver"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDepositAction(deposit.id, 'reject')}
                          disabled={isLoading}
                          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition"
                          title="Rejeter"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )
          )}
        </div>
      )}
    </div>
  );

  // Render Withdrawals Tab
  const renderWithdrawalsTab = () => (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'approved', 'rejected'] as const).map(filter => (
          <button
            key={filter}
            onClick={() => {
              setWithdrawalFilter(filter);
              loadWithdrawals(filter);
            }}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              withdrawalFilter === filter
                ? 'bg-purple-500 text-white shadow-lg'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {filter === 'all' ? 'Tous' : filter === 'pending' ? 'En Attente' : filter === 'approved' ? 'Approuvés' : 'Rejetés'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      ) : (
        <div className="space-y-3">
          {withdrawalFilter === 'pending' ? (
            withdrawalApprovals.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Aucun retrait en attente</p>
            ) : (
              withdrawalApprovals.map((appr: any) => (
                <div key={appr.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-semibold text-gray-900">{appr.user_name || appr.user_id}</div>
                      <div className="text-sm text-gray-600">Téléphone: {appr.phone || 'N/A'}</div>
                    </div>
                    <div className="text-right text-sm text-gray-500">{new Date(appr.created_at).toLocaleString('fr-FR')}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                    <div>
                      <div className="text-xs text-gray-600">Montant</div>
                      <div className="font-semibold text-gray-900">{formatCurrency(appr.amount)}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-600">Mode</div>
                        <div className="font-semibold text-gray-900">
                          {(
                            // Prefer explicit payment method name from approval (appr.payment_method),
                            // otherwise lookup by payment_method_id in loaded paymentMethods,
                            // otherwise fall back to bank_name or id.
                            paymentMethods.find(pm => String(pm.id) === String(appr.payment_method_id))?.name
                            || appr.payment_method
                            || appr.bank_name
                            || appr.payment_method_id
                            || 'N/A'
                          )}
                        </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Compte</div>
                      <div className="font-semibold text-gray-900">{appr.account_number || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Titulaire</div>
                      <div className="font-semibold text-gray-900">{appr.account_holder_name || 'N/A'}</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        if (!confirm('Approuver ce retrait ?')) return;
                        setIsLoading(true);
                        try {
                          const res = await adminApi.approveWithdrawalApproval(appr.id);
                          if (res.success) {
                            toast.success('Retrait approuvé');
                            await loadWithdrawalApprovals();
                          } else {
                            toast.error(res.error || 'Erreur');
                          }
                        } catch (err) {
                          console.error(err);
                          toast.error('Erreur');
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                    >
                      Approuver
                    </button>
                    <button
                      onClick={async () => {
                        const reason = prompt('Raison du rejet (obligatoire) :');
                        if (!reason) return;
                        setIsLoading(true);
                        try {
                          const res = await adminApi.rejectWithdrawalApproval(appr.id, reason);
                          if (res.success) {
                            toast.success('Retrait rejeté');
                            await loadWithdrawalApprovals();
                          } else {
                            toast.error(res.error || 'Erreur');
                          }
                        } catch (err) {
                          console.error(err);
                          toast.error('Erreur');
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                    >
                      Rejeter
                    </button>
                  </div>
                </div>
              ))
            )
          ) : (
            withdrawals.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Aucun retrait trouvé</p>
            ) : (
              withdrawals.map((withdrawal: Withdrawal) => (
                <div key={withdrawal.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:shadow-md transition">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{withdrawal.user?.phone || withdrawal.user_id}</div>
                    <div className="text-sm text-gray-600">
                      {withdrawal.bank_name} • {formatCurrency(withdrawal.amount)} •{' '}
                      {new Date(withdrawal.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        withdrawal.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : withdrawal.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {withdrawal.status === 'pending'
                        ? 'En Attente'
                        : withdrawal.status === 'approved'
                        ? 'Approuvé'
                        : 'Rejeté'}
                  </span>

                    {withdrawal.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleWithdrawalAction(withdrawal.id, 'approve')}
                          disabled={isLoading}
                          className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition"
                          title="Approuver"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleWithdrawalAction(withdrawal.id, 'reject')}
                          disabled={isLoading}
                          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition"
                          title="Rejeter"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )
          )}
        </div>
      )}
    </div>
  );

  // Render Users Tab
  const renderUsersTab = () => (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Rechercher par téléphone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={loadUsers}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
        >
          <RefreshCw className="w-5 h-5" />
          Actualiser
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="space-y-3">
          {users.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Aucun utilisateur trouvé</p>
          ) : (
            users
              .filter(u => !searchQuery || u.phone.includes(searchQuery) || u.full_name?.includes(searchQuery))
              .map(u => (
                <div key={u.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 flex items-center gap-2">
                        {u.full_name || u.phone}
                        {u.is_active ? (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Actif</span>
                        ) : (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Inactif</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">{u.phone} • {u.country_code}</div>
                      {u.referral_code && <div className="text-xs text-gray-500 mt-1">Code ref: {u.referral_code}</div>}
                    </div>
                    <div className="text-right text-sm text-gray-500">{new Date(u.created_at).toLocaleDateString('fr-FR')}</div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-3 pt-3 border-t">
                    <div>
                      <div className="text-xs text-gray-600">Solde</div>
                      <div className="font-semibold text-gray-900">{formatCurrency(u.balance || 0)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Investi</div>
                      <div className="font-semibold text-gray-900">{formatCurrency(u.total_invested || 0)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Gains</div>
                      <div className="font-semibold text-green-600">{formatCurrency(u.total_earned || 0)}</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleUserStatus(u.id, u.is_active || false)}
                      className={`flex-1 px-3 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                        u.is_active
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {u.is_active ? (
                        <>
                          <Ban className="w-4 h-4" />
                          Bloquer
                        </>
                      ) : (
                        <>
                          <Unlock className="w-4 h-4" />
                          Débloquer
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => openAdjustModal(u)}
                      className="flex-1 px-3 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 bg-blue-100 text-blue-700 hover:bg-blue-200"
                    >
                      <Wallet className="w-4 h-4" />
                      Ajuster solde
                    </button>
                  </div>
                </div>
              ))
          )}
        </div>
      )}
    </div>
  );

  // Render VIP Products Tab
  const renderVIPTab = () => (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setShowVipModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
        >
          <Plus className="w-5 h-5" />
          Ajouter un produit VIP
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader className="w-8 h-8 animate-spin text-yellow-500" />
        </div>
      ) : (
        <div className="space-y-3">
          {vipProducts.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Aucun produit VIP trouvé</p>
          ) : (
            vipProducts.map((product: VIPProduct) => {
              const isOutOfStock = product.min_amount >= 100000;
              return (
                <div key={product.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <Crown className="w-5 h-5 text-yellow-500" />
                      <div>
                        <div className="font-semibold text-gray-900">{product.name} (Niveau {product.level})</div>
                        <div className="text-sm text-gray-600">Min: {formatCurrency(product.min_amount)}</div>
                      </div>
                    </div>
                    {isOutOfStock ? (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                        Stock épuisé
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        {product.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-3 pt-3 border-t text-sm">
                    <div>
                      <div className="text-xs text-gray-600">Rendement</div>
                      <div className="font-semibold text-gray-900">{product.daily_return || 'N/A'}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Durée</div>
                      <div className="font-semibold text-gray-900">{product.duration || 'N/A'} jours</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Créé</div>
                      <div className="font-semibold text-gray-900">{new Date(product.created_at).toLocaleDateString('fr-FR')}</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowVipModal(true)}
                      className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition flex items-center justify-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Modifier
                    </button>
                    <button
                      onClick={() => {
                        setConfirmAction({
                          type: 'deleteVip',
                          id: product.id,
                          title: 'Supprimer le produit VIP',
                          message: `Êtes-vous sûr de vouloir supprimer "${product.name}" ?`
                        });
                        setShowConfirm(true);
                      }}
                      className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );

  // Render Banks Tab
  const renderBanksTab = () => (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setShowBankModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        >
          <Plus className="w-5 h-5" />
          Ajouter une banque
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="space-y-3">
          {banks.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Aucune banque trouvée</p>
          ) : (
            banks.map((bank: Bank) => (
              <div key={bank.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3 flex-1">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-semibold text-gray-900">{bank.name}</div>
                      {bank.code && <div className="text-sm text-gray-600">Code: {bank.code}</div>}
                      {bank.country_code && <div className="text-xs text-gray-500">{bank.country_code}</div>}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    bank.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {bank.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowBankModal(true)}
                    className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition flex items-center justify-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Modifier
                  </button>
                  <button
                    onClick={() => {
                      setConfirmAction({
                        type: 'deleteBank',
                        id: bank.id,
                        title: 'Supprimer la banque',
                        message: `Êtes-vous sûr de vouloir supprimer "${bank.name}" ?`
                      });
                      setShowConfirm(true);
                    }}
                    className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );

  // Render Payment Methods Tab
  const renderPaymentMethodsTab = () => (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setShowPaymentModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        >
          <Plus className="w-5 h-5" />
          Ajouter un mode de paiement
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="space-y-3">
          {paymentMethods.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Aucun mode de paiement trouvé</p>
          ) : (
            paymentMethods.map((method: PaymentMethod) => (
              <div key={method.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3 flex-1">
                    <Wallet className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-semibold text-gray-900">{method.name}</div>
                      {method.code && <div className="text-sm text-gray-600">Code: {method.code}</div>}
                      {method.description && <div className="text-xs text-gray-500">{method.description}</div>}
                      {method.bank_name && <div className="text-xs text-gray-500 mt-1">Banque: {method.bank_name}</div>}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    method.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {method.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleTogglePaymentMethod(method.id)}
                    className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition flex items-center justify-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Activer / Désactiver
                  </button>
                  <button
                    onClick={() => {
                      setConfirmAction({
                        type: 'deletePaymentMethod',
                        id: method.id,
                        title: 'Supprimer le mode de paiement',
                        message: `Êtes-vous sûr de vouloir supprimer "${method.name}" ?`
                      });
                      setShowConfirm(true);
                    }}
                    className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );

  // Render User Investments Tab
  const renderInvestmentsTab = () => (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Rechercher par téléphone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={loadUserInvestments}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
        >
          <RefreshCw className="w-5 h-5" />
          Actualiser
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="space-y-3">
          {userInvestments.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Aucun investissement trouvé</p>
          ) : (
            userInvestments
              .filter(inv => !searchQuery || inv.user?.phone.includes(searchQuery) || inv.user?.full_name?.includes(searchQuery))
              .map((investment: UserInvestment) => (
                <div key={investment.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <Zap className="w-5 h-5 text-purple-600" />
                      <div>
                        <div className="font-semibold text-gray-900">{investment.user?.phone || investment.user_id}</div>
                        <div className="text-sm text-gray-600">{investment.user?.full_name}</div>
                        <div className="text-xs text-gray-500 mt-1">Produit: {investment.product?.name || 'N/A'}</div>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      investment.status === 'active'
                        ? 'bg-blue-100 text-blue-800'
                        : investment.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : investment.status === 'paused'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {investment.status === 'active' ? 'Actif' :
                       investment.status === 'completed' ? 'Complété' :
                       investment.status === 'paused' ? 'Pausé' : 'Annulé'}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-3 pt-3 border-t text-sm">
                    <div>
                      <div className="text-xs text-gray-600">Montant</div>
                      <div className="font-semibold text-gray-900">{formatCurrency(investment.amount)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Début</div>
                      <div className="font-semibold text-gray-900">{new Date(investment.start_date).toLocaleDateString('fr-FR')}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Fin</div>
                      <div className="font-semibold text-gray-900">{investment.end_date ? new Date(investment.end_date).toLocaleDateString('fr-FR') : 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Durée</div>
                      <div className="font-semibold text-gray-900">
                        {investment.end_date ? Math.ceil((new Date(investment.end_date).getTime() - new Date(investment.start_date).getTime()) / (1000 * 60 * 60 * 24)) : 'N/A'} j
                      </div>
                    </div>
                  </div>

                  {investment.status === 'active' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateInvestmentStatus(investment.id, 'paused')}
                        className="flex-1 px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition flex items-center justify-center gap-2"
                      >
                        <Clock className="w-4 h-4" />
                        Mettre en pause
                      </button>
                      <button
                        onClick={() => {
                          setConfirmAction({
                            type: 'cancelInvestment',
                            id: investment.id,
                            title: 'Annuler l\'investissement',
                            message: 'Êtes-vous sûr de vouloir annuler cet investissement ?'
                          });
                          setShowConfirm(true);
                        }}
                        className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Annuler
                      </button>
                    </div>
                  )}

                  {investment.status === 'paused' && (
                    <button
                      onClick={() => handleUpdateInvestmentStatus(investment.id, 'active')}
                      className="w-full px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition flex items-center justify-center gap-2"
                    >
                      <Zap className="w-4 h-4" />
                      Reprendre
                    </button>
                  )}
                </div>
              ))
          )}
        </div>
      )}
    </div>
  );

  // Render Logs Tab
  const renderLogsTab = () => (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader className="w-8 h-8 animate-spin text-gray-500" />
        </div>
      ) : (
        <div className="space-y-2">
          {logs.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Aucun log trouvé</p>
          ) : (
            logs.map(log => (
              <div key={log.id} className="bg-white border border-gray-200 rounded-lg p-3 text-sm hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{log.action}</div>
                    {log.user_phone && (
                      <div className="text-gray-600">
                        Utilisateur: {log.user_name || log.user_phone}
                      </div>
                    )}
                    {log.admin_phone && (
                      <div className="text-gray-600">
                        Admin: {log.admin_name || log.admin_phone}
                      </div>
                    )}
                    {log.details && <div className="text-gray-500 mt-1">{log.details}</div>}
                  </div>
                  <div className="text-gray-500 whitespace-nowrap ml-4">{new Date(log.created_at).toLocaleString('fr-FR')}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );

  // Render Gift Codes Tab
  const renderGiftCodesTab = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Gift className="w-8 h-8 text-purple-600" />
          Gestion des Codes Cadeaux
        </h2>
        <button
          onClick={() => setShowGiftCodeModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          <Plus className="w-5 h-5" />
          Créer un code
        </button>
      </div>

      {/* Statistics */}
      {giftCodeStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
            <p className="text-sm text-gray-600">Codes Générés</p>
            <p className="text-3xl font-bold text-purple-600">{giftCodeStats.totalCodes}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-gray-600">Codes Utilisés</p>
            <p className="text-3xl font-bold text-blue-600">{giftCodeStats.redeemedCodes}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <p className="text-sm text-gray-600">Montant Distribué</p>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(giftCodeStats.totalRedeemed)}</p>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
            <p className="text-sm text-gray-600">Valeur Totale</p>
            <p className="text-3xl font-bold text-orange-600">{formatCurrency(giftCodeStats.totalValue)}</p>
          </div>
        </div>
      )}

      {/* Gift Codes List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : giftCodes.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center border border-gray-200">
          <Gift className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">Aucun code cadeau créé</p>
        </div>
      ) : (
        <div className="space-y-3">
          {giftCodes.map((code: any) => (
            <div key={code.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-mono font-bold text-lg text-purple-600">{code.code}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Montant: <span className="font-semibold">{formatCurrency(code.amount)}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Créé: {new Date(code.created_at).toLocaleDateString('fr-FR')}
                    {code.expires_in_minutes && ` | Expire dans: ${code.expires_in_minutes} minutes`}
                  </div>
                  {code.redeemed_by && (
                    <div className="text-xs text-green-600 mt-1">
                      ✓ Utilisé par {code.redeemed_by_phone} - {new Date(code.redeemed_at).toLocaleDateString('fr-FR')}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(code.code);
                      toast.success('Code copié');
                    }}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                    title="Copier le code"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                  {!code.redeemed_by && (
                    <button
                      onClick={() => {
                        if (confirm('Supprimer ce code ?')) {
                          handleDeleteGiftCode(code.id);
                        }
                      }}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                      title="Supprimer"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Gift Code Modal */}
      {showGiftCodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Créer un Code Cadeau</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant (FCFA)</label>
                <input
                  type="number"
                  min="1"
                  value={giftCodeAmount}
                  onChange={(e) => setGiftCodeAmount(e.target.value)}
                  placeholder="ex: 1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Durée d'Expiration (minutes)</label>
                <input
                  type="number"
                  min="1"
                  value={giftCodeExpiresInMinutes}
                  onChange={(e) => setGiftCodeExpiresInMinutes(e.target.value)}
                  placeholder="ex: 30"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">Le code expirera après ce nombre de minutes</p>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setShowGiftCodeModal(false);
                  setGiftCodeAmount('');
                  setGiftCodeExpiresInMinutes(30);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateGiftCode}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Créer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Render Settings Tab
  const renderSettingsTab = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Paramètres Système</h3>
      <div className="space-y-3">
        <div className="p-4 border border-gray-200 rounded-lg">
          <h4 className="font-semibold text-gray-900">Administrateur Actuel</h4>
          <p className="text-gray-600 mt-1">{user?.phone}</p>
        </div>
        <div className="p-4 border border-gray-200 rounded-lg">
          <h4 className="font-semibold text-gray-900">Actions Disponibles</h4>
          <ul className="text-gray-600 mt-2 space-y-1 text-sm">
            <li>✓ Gérer les dépôts et retraits</li>
            <li>✓ Gérer les utilisateurs</li>
            <li>✓ Voir les investissements VIP</li>
            <li>✓ Consulter les logs d\'activité</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'stats' as AdminTab, label: 'Statistiques', icon: BarChart3 },
    { id: 'deposits' as AdminTab, label: 'Dépôts', icon: TrendingUp },
    { id: 'withdrawals' as AdminTab, label: 'Retraits', icon: FileText },
    { id: 'users' as AdminTab, label: 'Utilisateurs', icon: Users },
    { id: 'vip' as AdminTab, label: 'Produits VIP', icon: Crown },
    { id: 'banks' as AdminTab, label: 'Banques', icon: Building2 },
    { id: 'paymentMethods' as AdminTab, label: 'Modes Paiement', icon: Wallet },
    { id: 'investments' as AdminTab, label: 'Investissements', icon: Zap },
    { id: 'gift-codes' as AdminTab, label: 'Codes Cadeaux', icon: Gift },
    { id: 'logs' as AdminTab, label: 'Logs', icon: Activity },
    { id: 'settings' as AdminTab, label: 'Paramètres', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              Tableau de Bord Admin
            </h1>
            <p className="text-gray-600 mt-1">Gérez les dépôts, retraits, utilisateurs et investissements</p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition shadow-md"
          >
            <LogOut className="w-5 h-5" />
            Déconnexion
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6 border-b border-gray-200 overflow-x-auto">
          <div className="flex">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-4 py-4 font-medium border-b-2 transition whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {activeTab === 'stats' && renderStatsTab()}
          {activeTab === 'deposits' && renderDepositsTab()}
          {activeTab === 'withdrawals' && renderWithdrawalsTab()}
          {activeTab === 'users' && renderUsersTab()}
          {activeTab === 'vip' && renderVIPTab()}
          {activeTab === 'banks' && renderBanksTab()}
          {activeTab === 'paymentMethods' && renderPaymentMethodsTab()}
          {activeTab === 'investments' && renderInvestmentsTab()}
          {activeTab === 'gift-codes' && renderGiftCodesTab()}
          {activeTab === 'logs' && renderLogsTab()}
          {activeTab === 'settings' && renderSettingsTab()}
        </div>

        {/* Modals & Dialogs */}
        <FormModal
          isOpen={showUserModal}
          onClose={() => setShowUserModal(false)}
          title="Ajouter un utilisateur"
          fields={[
            { name: 'phone', label: 'Téléphone', type: 'text', required: true },
            { name: 'full_name', label: 'Nom complet', type: 'text', required: true },
            { name: 'password', label: 'Mot de passe', type: 'password', required: true },
            { name: 'country_code', label: 'Code pays', type: 'text', required: true },
          ]}
          onSubmit={handleCreateUser}
          isLoading={isLoading}
        />

        <FormModal
          isOpen={showVipModal}
          onClose={() => setShowVipModal(false)}
          title="Ajouter un produit VIP"
          fields={[
            { name: 'level', label: 'Niveau', type: 'number', required: true },
            { name: 'name', label: 'Nom', type: 'text', required: true },
            { name: 'min_amount', label: 'Montant minimum (F)', type: 'number', required: true },
            { name: 'daily_return', label: 'Rendement quotidien (%)', type: 'number' },
            { name: 'duration', label: 'Durée (jours)', type: 'number' },
          ]}
          onSubmit={handleCreateVipProduct}
          isLoading={isLoading}
        />

        <FormModal
          isOpen={showBankModal}
          onClose={() => setShowBankModal(false)}
          title="Ajouter une banque"
          fields={[
            { name: 'name', label: 'Nom de la banque', type: 'text', required: true },
            { name: 'code', label: 'Code', type: 'text' },
            { name: 'country_code', label: 'Code pays', type: 'text' },
          ]}
          onSubmit={handleCreateBank}
          isLoading={isLoading}
        />

        <FormModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          title="Ajouter un mode de paiement"
          fields={
            [
              { name: 'name', label: 'Nom (ex: MTN Mobile Money)', type: 'text', required: true },
              { name: 'code', label: 'Code (ex: MTN)', type: 'text' },
              { name: 'description', label: 'Description', type: 'text' },
              { name: 'bank_id', label: 'Banque', type: 'select', options: banks.map(b => ({ value: b.id, label: b.name })), required: true },
              { name: 'account_holder_name', label: 'Titulaire du compte (optionnel)', type: 'text' },
              { name: 'account_number', label: 'Numéro de compte (optionnel)', type: 'text' },
              { name: 'min_deposit', label: 'Dépôt minimum (FCFA, optionnel)', type: 'number' }
            ]
          }
          onSubmit={handleCreatePaymentMethod}
          isLoading={isLoading}
        />

        <FormModal
          isOpen={showAdjustModal}
          onClose={() => { setShowAdjustModal(false); setAdjustTargetUser(null); }}
          title={`Ajuster le solde - ${adjustTargetUser?.phone || ''}`}
          fields={[
            { name: 'amount', label: 'Montant (FCFA)', type: 'number', required: true },
            { name: 'type', label: 'Type', type: 'select', options: [{ value: 'credit', label: 'Crédit' }, { value: 'debit', label: 'Débit' }], required: true },
            { name: 'reason', label: 'Raison (optionnel)', type: 'text' }
          ]}
          onSubmit={handleAdjustSubmit}
          isLoading={isAdjustLoading}
        />

        {confirmAction && confirmAction.type === 'deleteBank' ? (
          // Custom confirm modal to allow "force" reassign
          showConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-md w-full p-6">
                <h2 className="text-xl font-bold mb-2">{confirmAction.title}</h2>
                <p className="text-gray-600 mb-4">{confirmAction.message}</p>
                <label className="flex items-center gap-2 mb-4">
                  <input type="checkbox" checked={forceDelete} onChange={(e) => setForceDelete(e.target.checked)} />
                  <span className="text-sm text-gray-700">Forcer la réaffectation des modes de paiement si nécessaire</span>
                </label>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowConfirm(false);
                      setConfirmAction(null);
                      setForceDelete(false);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await handleDeleteBank(confirmAction.id, forceDelete);
                        setShowConfirm(false);
                        setConfirmAction(null);
                        setForceDelete(false);
                      } catch (error) {
                        console.error('Error deleting bank:', error);
                        toast.error((error as Error).message || 'Erreur lors de la suppression');
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    {isLoading ? 'Traitement...' : 'Supprimer (forcer si demandé)'}
                  </button>
                </div>
              </div>
            </div>
          )
        ) : (
          <ConfirmDialog
            isOpen={showConfirm}
            title={confirmAction?.title || ''}
            message={confirmAction?.message || ''}
            isDangerous={confirmAction?.type === 'cancelInvestment' || confirmAction?.type === 'deleteBank' || confirmAction?.type === 'deleteVip' || confirmAction?.type === 'deletePaymentMethod'}
            isLoading={isLoading}
            onConfirm={async () => {
              if (!confirmAction) return;
              try {
                if (confirmAction.type === 'deleteVip') {
                  await adminApi.deleteVIPProduct(confirmAction.id);
                  toast.success('Produit VIP supprimé');
                  await loadVipProducts();
                } else if (confirmAction.type === 'cancelInvestment') {
                  await handleUpdateInvestmentStatus(confirmAction.id, 'cancelled');
                } else if (confirmAction.type === 'deletePaymentMethod') {
                  await handleDeletePaymentMethod(confirmAction.id);
                }
                setShowConfirm(false);
                setConfirmAction(null);
              } catch (error) {
                console.error('Error:', error);
                toast.error('Erreur lors de l\'opération');
              }
            }}
            onCancel={() => {
              setShowConfirm(false);
              setConfirmAction(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
