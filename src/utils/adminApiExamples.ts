/**
 * ADMIN API - Exemples d'Utilisation
 * 
 * Ce fichier montre comment utiliser le client adminApi
 * pour gérer l'application depuis le tableau de bord
 */

import { adminApi } from './src/utils/adminApi';

// ============================================================
// STATISTIQUES
// ============================================================

/**
 * Récupérer les statistiques du dashboard
 */
async function exampleGetStats() {
  try {
    const response = await adminApi.getStats();
    console.log('Stats:', response.data);
    // Affiche: {
    //   totalUsers: 150,
    //   totalDeposits: 25000,
    //   pendingDeposits: 5,
    //   totalWithdrawals: 8000,
    //   pendingWithdrawals: 2,
    //   totalInvestments: 15000,
    //   activeInvestments: 8,
    //   totalCommissions: 1200
    // }
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// ============================================================
// UTILISATEURS
// ============================================================

/**
 * Récupérer tous les utilisateurs
 */
async function exampleGetAllUsers() {
  try {
    const response = await adminApi.getAllUsers(100);
    console.log('Utilisateurs:', response.data);
    // Affiche: [
    //   {
    //     id: 'uuid-1',
    //     phone: '+212612345678',
    //     full_name: 'Ali Ben',
    //     country_code: 'MA',
    //     balance: 500,
    //     total_invested: 2000,
    //     total_earned: 300,
    //     is_active: true,
    //     referral_code: 'ALI123',
    //     created_at: '2025-11-20'
    //   },
    //   ...
    // ]
  } catch (error) {
    console.error('Erreur:', error);
  }
}

/**
 * Bloquer un utilisateur
 */
async function exampleBanUser() {
  try {
    const userId = 'user-uuid-123';
    const response = await adminApi.toggleUserStatus(userId, false); // false = inactif
    console.log('Utilisateur bloqué:', response.message);
  } catch (error) {
    console.error('Erreur:', error);
  }
}

/**
 * Débloquer un utilisateur
 */
async function exampleUnbanUser() {
  try {
    const userId = 'user-uuid-123';
    const response = await adminApi.toggleUserStatus(userId, true); // true = actif
    console.log('Utilisateur débloqué:', response.message);
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// ============================================================
// DÉPÔTS
// ============================================================

/**
 * Récupérer tous les dépôts
 */
async function exampleGetAllDeposits() {
  try {
    // Sans filtre - tous les dépôts
    const response1 = await adminApi.getAllDeposits(undefined, 100);
    
    // Avec filtre - seulement les en attente
    const response2 = await adminApi.getAllDeposits('pending', 50);
    
    // Seulement les approuvés
    const response3 = await adminApi.getAllDeposits('approved', 100);
    
    console.log('Dépôts:', response2.data);
    // Affiche: [
    //   {
    //     id: 'deposit-1',
    //     user_id: 'user-123',
    //     amount: 500,
    //     payment_method: 'card',
    //     status: 'pending',
    //     created_at: '2025-11-20T10:30:00',
    //     user: { phone: '+212612345678', full_name: 'Ali' }
    //   },
    //   ...
    // ]
  } catch (error) {
    console.error('Erreur:', error);
  }
}

/**
 * Approuver un dépôt
 */
async function exampleApproveDeposit() {
  try {
    const depositId = 'deposit-uuid-123';
    const response = await adminApi.approveDeposit(depositId);
    console.log('Dépôt approuvé:', response.message);
    // Le montant est automatiquement ajouté au portefeuille
  } catch (error) {
    console.error('Erreur:', error);
  }
}

/**
 * Rejeter un dépôt
 */
async function exampleRejectDeposit() {
  try {
    const depositId = 'deposit-uuid-123';
    const response = await adminApi.rejectDeposit(depositId);
    console.log('Dépôt rejeté:', response.message);
    // Le montant ne sera pas ajouté
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// ============================================================
// RETRAITS
// ============================================================

/**
 * Récupérer tous les retraits
 */
async function exampleGetAllWithdrawals() {
  try {
    // En attente
    const response = await adminApi.getAllWithdrawals('pending', 100);
    console.log('Retraits en attente:', response.data);
    // Affiche: [
    //   {
    //     id: 'withdrawal-1',
    //     user_id: 'user-123',
    //     amount: 200,
    //     bank_name: 'Bank Al-Maghrib',
    //     status: 'pending',
    //     created_at: '2025-11-20',
    //     user: { phone: '+212612345678', full_name: 'Ali' }
    //   },
    //   ...
    // ]
  } catch (error) {
    console.error('Erreur:', error);
  }
}

/**
 * Approuver un retrait
 */
async function exampleApproveWithdrawal() {
  try {
    const withdrawalId = 'withdrawal-uuid-123';
    const response = await adminApi.approveWithdrawal(withdrawalId);
    console.log('Retrait approuvé:', response.message);
    // Le montant est déduit du portefeuille
  } catch (error) {
    console.error('Erreur:', error);
  }
}

/**
 * Rejeter un retrait
 */
async function exampleRejectWithdrawal() {
  try {
    const withdrawalId = 'withdrawal-uuid-123';
    const response = await adminApi.rejectWithdrawal(withdrawalId);
    console.log('Retrait rejeté:', response.message);
    // Le montant reste dans le portefeuille
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// ============================================================
// INVESTISSEMENTS VIP
// ============================================================

/**
 * Récupérer tous les investissements VIP
 */
async function exampleGetAllVIPInvestments() {
  try {
    // Tous les actifs
    const response = await adminApi.getAllVIPInvestments('active', 100);
    console.log('Investissements VIP actifs:', response.data);
    // Affiche: [
    //   {
    //     id: 'vip-1',
    //     user_id: 'user-123',
    //     product_id: 'product-1',
    //     amount: 1000,
    //     status: 'active',
    //     start_date: '2025-11-01',
    //     end_date: '2025-12-01',
    //     user: { phone: '+212612345678', full_name: 'Ali' }
    //   },
    //   ...
    // ]
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// ============================================================
// LOGS D'ACTIVITÉ
// ============================================================

/**
 * Récupérer les logs d'activité
 */
async function exampleGetLogs() {
  try {
    const response = await adminApi.getLogs();
    console.log('Derniers logs:', response.data);
    // Affiche: [
    //   {
    //     id: 'log-1',
    //     admin_id: 'admin-123',
    //     user_id: 'user-456',
    //     action: 'deposit_approved',
    //     details: 'Dépôt de 500 approuvé',
    //     created_at: '2025-11-20T11:45:00',
    //     admin_phone: '+212612345678',
    //     admin_name: 'Admin User',
    //     user_phone: '+212987654321',
    //     user_name: 'Ali Ben'
    //   },
    //   ...
    // ]
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// ============================================================
// BANQUES
// ============================================================

/**
 * Récupérer toutes les banques
 */
async function exampleGetBanks() {
  try {
    const response = await adminApi.getBanks();
    console.log('Banques disponibles:', response.data);
    // Affiche: [
    //   { id: 'bank-1', name: 'Bank Al-Maghrib', code: 'BAM', country_code: 'MA' },
    //   { id: 'bank-2', name: 'Banque Populaire', code: 'BP', country_code: 'MA' },
    //   ...
    // ]
  } catch (error) {
    console.error('Erreur:', error);
  }
}

/**
 * Créer une nouvelle banque
 */
async function exampleCreateBank() {
  try {
    const response = await adminApi.createBank(
      'Bank Al-Amal', // name
      'BAA',           // code
      'MA'             // country_code
    );
    console.log('Banque créée:', response.data);
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// ============================================================
// RAPPORTS
// ============================================================

/**
 * Générer un rapport de dépôts
 */
async function exampleGetDepositReport() {
  try {
    const response = await adminApi.getDepositReport(
      '2025-11-01',  // startDate
      '2025-11-30'   // endDate
    );
    console.log('Rapport dépôts:', response.data);
    // Affiche statistiques mensuelles
  } catch (error) {
    console.error('Erreur:', error);
  }
}

/**
 * Générer un rapport de retraits
 */
async function exampleGetWithdrawalReport() {
  try {
    const response = await adminApi.getWithdrawalReport(
      '2025-11-01',  // startDate
      '2025-11-30'   // endDate
    );
    console.log('Rapport retraits:', response.data);
    // Affiche statistiques mensuelles
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// ============================================================
// PATTERNS COMMUNS
// ============================================================

/**
 * Pattern: Approuver tous les dépôts en attente
 */
async function approveAllPendingDeposits() {
  try {
    const response = await adminApi.getAllDeposits('pending');
    const deposits = response.data || [];

    for (const deposit of deposits) {
      await adminApi.approveDeposit(deposit.id);
      console.log(`✓ Dépôt ${deposit.id} approuvé`);
    }

    console.log(`Total approuvé: ${deposits.length}`);
  } catch (error) {
    console.error('Erreur:', error);
  }
}

/**
 * Pattern: Afficher rapport quotidien
 */
async function showDailyReport() {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const stats = await adminApi.getStats();
    const deposits = await adminApi.getDepositReport(today, today);
    const withdrawals = await adminApi.getWithdrawalReport(today, today);

    console.log('📊 RAPPORT QUOTIDIEN');
    console.log(`Date: ${today}`);
    console.log(`Total utilisateurs: ${stats.data.totalUsers}`);
    console.log(`Dépôts aujourd'hui: ${deposits.length}`);
    console.log(`Retraits aujourd'hui: ${withdrawals.length}`);
    console.log(`Dépôts en attente: ${stats.data.pendingDeposits}`);
    console.log(`Retraits en attente: ${stats.data.pendingWithdrawals}`);
  } catch (error) {
    console.error('Erreur:', error);
  }
}

/**
 * Pattern: Auditer utilisateur suspect
 */
async function auditSuspiciousUser(userId: string) {
  try {
    const users = await adminApi.getAllUsers();
    const user = users.data.find((u: any) => u.id === userId);

    if (!user) {
      console.log('Utilisateur non trouvé');
      return;
    }

    console.log('👤 AUDIT UTILISATEUR');
    console.log(`Nom: ${user.full_name}`);
    console.log(`Téléphone: ${user.phone}`);
    console.log(`Solde: ${user.balance}`);
    console.log(`Investi: ${user.total_invested}`);
    console.log(`Gains: ${user.total_earned}`);
    console.log(`Statut: ${user.is_active ? 'Actif' : 'Inactif'}`);
    console.log(`Inscription: ${user.created_at}`);
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// ============================================================
// EXPORT
// ============================================================

export {
  exampleGetStats,
  exampleGetAllUsers,
  exampleBanUser,
  exampleUnbanUser,
  exampleGetAllDeposits,
  exampleApproveDeposit,
  exampleRejectDeposit,
  exampleGetAllWithdrawals,
  exampleApproveWithdrawal,
  exampleRejectWithdrawal,
  exampleGetAllVIPInvestments,
  exampleGetLogs,
  exampleGetBanks,
  exampleCreateBank,
  exampleGetDepositReport,
  exampleGetWithdrawalReport,
  approveAllPendingDeposits,
  showDailyReport,
  auditSuspiciousUser
};

// ============================================================
// UTILISATION:
// ============================================================
// 
// Dans un composant React:
// 
// import { approveAllPendingDeposits } from './adminApiExamples';
// 
// function MyAdminComponent() {
//   async function handleApproveAll() {
//     await approveAllPendingDeposits();
//     // Recharger les données
//   }
// 
//   return (
//     <button onClick={handleApproveAll}>
//       Approuver tous les dépôts
//     </button>
//   );
// }
//
