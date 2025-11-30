# APUIC Capital - VIP Investment Management System

## Project Overview
APUIC Capital is a comprehensive VIP investment management platform with referral system, deposits, and withdrawals functionality. The system is built with a React frontend and Node.js/Express backend using PostgreSQL database.

## Recent Changes (November 24, 2025)
- **Admin Dashboard**: Complete admin system for managing deposits, withdrawals, and users
  - Real-time statistics (users, revenue, investments, commissions)
  - Deposit management with approve/reject functionality
  - Withdrawal management with approve/reject functionality
  - User management with wallet and investment details
  - Admin routing with auto-detection based on `is_admin` flag
- **Improved Deposit Form**: Professional 3-step workflow matching UI mockups
  - Step 1: Amount selection with preset amounts and custom input
  - Step 2: Payment method selection (6 methods)
  - Step 3: Bank details and account information
  - Confirmation with copy-to-clipboard functionality
  - Success screen with reference number
- **Improved Withdrawal Form**: Complete redesign matching deposit form pattern
  - 3-step withdrawal workflow with visual progression
  - Amount selection with fee calculation (6%)
  - Bank and account details input
  - Confirmation and success states
  - Purple gradient design (distinguishes from green deposit form)
- **API Utilities**: New admin API client (`adminApi.ts`)
  - Stats retrieval
  - Deposit management endpoints
  - Withdrawal management endpoints
  - User management endpoints
- **Fixed Dependencies**: 
  - Made `request()` method public in ApiClient for admin usage
  - Added VIPLevel type import to calculations.ts
  - Removed unused imports and fixed ESLint warnings
- **Imported from GitHub** and configured for Replit environment
- **Database Migration**: Migrated from MySQL to PostgreSQL
  - Installed `pg` driver and removed `mysql2`
  - Converted all SQL query placeholders from `?` to PostgreSQL numbered format (`$1`, `$2`, etc.)
  - Updated database configuration to support Replit's DATABASE_URL
  - Created complete database schema with all tables and seed data
- **Frontend Configuration**: 
  - Configured Vite to run on port 5000 with host 0.0.0.0
  - Fixed HMR settings for Replit's proxy environment
- **Backend Configuration**:
  - Backend runs on port 3001 (localhost)
  - All MySQL-specific syntax converted to PostgreSQL
  - VIP earnings cron job running every minute
- **Deployment**: Configured for autoscale deployment

## Project Architecture

### Frontend (React + TypeScript + Vite)
- **Port**: 5000 (exposed via Replit proxy)
- **Location**: `/src`
- **Key Features**:
  - User authentication (login/signup with phone number)
  - VIP investment dashboard
  - Enhanced deposit form with 3-step workflow
  - Enhanced withdrawal form with 3-step workflow
  - Admin dashboard for app management
  - Referral tracking system
  - Transaction history
- **Key Components**:
  - `DepositForm.tsx` - Professional deposit workflow with amount/payment/confirmation steps
  - `WithdrawalForm.tsx` - Complete withdrawal workflow with 6% fee calculation
  - `AdminDashboard.tsx` - Full admin panel with statistics and management controls
  - `Dashboard.tsx` - User main dashboard with VIP investments and wallet

### Backend (Node.js + Express + TypeScript)
- **Port**: 3001 (internal)
- **Location**: `/backend`
- **Database**: PostgreSQL (via Replit Database)
- **Key Features**:
  - JWT-based authentication
  - VIP investment management with daily earnings
  - Deposit/withdrawal processing
  - Multi-level referral commission system (30%, 3%, 3%)
  - **Admin functionality** for approving/rejecting deposits and withdrawals
  - Automated cron jobs for daily VIP earnings distribution

## Database Schema

### Main Tables
1. **users** - User accounts with phone authentication and admin flag
2. **wallets** - User wallet balances and totals
3. **vip_products** - 10 VIP levels from Bronze to Ultimate (3K to 5M)
4. **vip_investments** - Active VIP investments with daily returns
5. **daily_earnings** - Daily earnings distribution history
6. **deposits** - Deposit requests (pending/approved/rejected)
7. **withdrawals** - Withdrawal requests with 2-per-day limit
8. **banks** - Bank and mobile money provider information
9. **transactions** - Complete transaction history
10. **referral_commissions** - Commission payouts
11. **activity_logs** - Admin activity tracking

### Seed Data
- 10 VIP product levels with 10% daily returns for 90 days
- 8 banks/payment methods (traditional banks + mobile money)
- System configuration (fees, limits, commission rates)

## Environment Variables

### Shared Environment
- `VITE_API_URL` - Backend API URL (automatically set to Replit domain)
- `PORT` - Backend port (3001)
- `NODE_ENV` - Development/Production

### Database (Auto-configured by Replit)
- `DATABASE_URL` - PostgreSQL connection string
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`

## Workflows

### Frontend Workflow
- **Name**: Frontend
- **Command**: `npm run dev`
- **Port**: 5000 (webview)
- **Purpose**: React development server with HMR

### Backend Workflow
- **Name**: Backend
- **Command**: `cd backend && npm run dev`
- **Port**: 3001 (console)
- **Purpose**: Express API server with auto-reload

## Key Business Rules

### VIP Investments
- Daily returns: 10% for all levels
- Duration: 90 days
- Earnings distributed 24 hours after purchase time
- Precise timing: Purchase at 11:30 AM → First earning next day at 11:30 AM

### Referral Commissions
- Level 1: 30% on first deposit
- Level 2: 3% on first deposit
- Level 3: 3% on first deposit
- Paid immediately upon deposit approval

### Withdrawals
- Maximum 2 withdrawals per user per day
- 6% withdrawal fee (deducted from withdrawal amount)
- Balance deducted immediately
- Refunded if rejected by admin
- Admin approval workflow in admin dashboard

### Deposits
- Minimum deposit from system config
- Requires admin approval (visible in admin dashboard)
- Credited to balance only after approval
- Triggers referral commissions (first deposit only)
- Admin can approve/reject deposits in real-time

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with phone/password
- `POST /api/auth/signup` - Register new user
- `GET /api/auth/me` - Get current user

### VIP
- `GET /api/vip/products` - List VIP levels
- `POST /api/vip/purchase` - Purchase VIP level
- `GET /api/vip/investments` - User's investments
- `GET /api/vip/earnings` - Daily earnings history

### Deposits & Withdrawals
- `POST /api/deposits` - Create deposit request
- `GET /api/deposits/my-deposits` - User's deposits
- `POST /api/withdrawals` - Create withdrawal request
- `GET /api/withdrawals/my-withdrawals` - User's withdrawals
- `GET /api/withdrawals/banks` - Available banks

### Admin (requires admin role)
- `GET /api/admin/stats` - Platform statistics (total users, deposits, withdrawals, investments, commissions)
- `GET /api/admin/users` - All users with wallet data
- `GET /api/deposits/all` - All deposits (with optional status filter)
- `POST /api/deposits/:id/approve` - Approve deposit
- `POST /api/deposits/:id/reject` - Reject deposit
- `GET /api/withdrawals/all` - All withdrawals (with optional status filter)
- `POST /api/withdrawals/:id/approve` - Approve withdrawal
- `POST /api/withdrawals/:id/reject` - Reject withdrawal

## Development Notes

### Database Migrations
- Schema file: `backend/src/db/schema.sql`
- Migration command: `cd backend && npm run migrate`
- All tables created with indexes and foreign keys
- Seed data inserted for VIP products, banks, and system config

### Code Structure
- Frontend components in `/src/components`
- Backend services in `/backend/src/services`
- Backend routes in `/backend/src/routes`
- Database queries use PostgreSQL numbered placeholders (`$1`, `$2`)
- All routes protected with JWT middleware except login/signup
- Admin routes require `requireAdmin` middleware

### Admin Features
- Admin detection on login based on `is_admin` flag
- Real-time statistics dashboard
- Deposit management with filtering and approval workflow
- Withdrawal management with filtering and approval workflow
- User management with wallet and investment details
- All admin operations require admin role

### Known Issues
- WebSocket HMR warnings in browser console (cosmetic, doesn't affect functionality)
- One PostgreSQL index skipped due to DATE() function immutability requirement
- One minor ESLint warning: unused 'user' prop in AdminDashboard (can be used for future features)

## Deployment
- **Target**: Autoscale (serverless)
- **Build**: `npm run build`
- **Run**: `npm run dev`
- Configured for automatic scaling based on traffic

## Support Regions
- Côte d'Ivoire (CI)
- Togo (TG)
- Burkina Faso (BF)
- Cameroun (CM)
- Bénin (BJ)

## User Preferences
- Use professional green gradient for user-facing features
- Purple gradient for admin/management features
- Implement 3-step workflows for complex operations (deposits, withdrawals)
- Support French language interface throughout the app
