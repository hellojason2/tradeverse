-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'TRADER', 'ADMIN', 'MANAGER', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('NOT_VERIFIED', 'ACTIVE', 'SUSPENDED', 'BANNED', 'DELETED');

-- CreateEnum
CREATE TYPE "CopyStatus" AS ENUM ('PENDING', 'ACTIVE', 'PAUSED', 'CLOSED', 'BREACHED');

-- CreateEnum
CREATE TYPE "TxnType" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'SETTLEMENT', 'FEE', 'REFUND', 'ATLAS_GOLD_PURCHASE', 'ATLAS_GOLD_REDEEM');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('MT4', 'MT5');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('PENDING', 'ACTIVE', 'ERROR', 'CLOSED');

-- CreateEnum
CREATE TYPE "RiskType" AS ENUM ('FIXED', 'PROPORTIONAL');

-- CreateEnum
CREATE TYPE "StrategyStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'CLOSED');

-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('NOT_STARTED', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateTable
CREATE TABLE "mt_accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "broker" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "account_type" TEXT NOT NULL,
    "status" "AccountStatus" NOT NULL DEFAULT 'PENDING',
    "copy_pro_account_id" TEXT,
    "copy_pro_api_id" TEXT,
    "password" TEXT NOT NULL,
    "server" TEXT NOT NULL,
    "balance" DECIMAL(19,8),
    "equity" DECIMAL(19,8),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mt_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strategies" (
    "id" TEXT NOT NULL,
    "master_account_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "riskType" "RiskType" NOT NULL,
    "riskValue" DECIMAL(19,8) NOT NULL,
    "follower_split_pct" DECIMAL(5,4) NOT NULL,
    "status" "StrategyStatus" NOT NULL DEFAULT 'DRAFT',
    "min_risk_capital" DECIMAL(19,8),
    "max_risk_capital" DECIMAL(19,8),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "strategies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "copy_relations" (
    "id" TEXT NOT NULL,
    "slave_account_id" TEXT NOT NULL,
    "strategy_id" TEXT NOT NULL,
    "follower_user_id" TEXT NOT NULL,
    "status" "CopyStatus" NOT NULL DEFAULT 'PENDING',
    "risk_capital" DECIMAL(19,8) NOT NULL,
    "follower_split_pct_snapshot" DECIMAL(5,4) NOT NULL,
    "trader_split_pct_snapshot" DECIMAL(5,4) NOT NULL,
    "insurance_split_pct_snapshot" DECIMAL(5,4) NOT NULL,
    "platform_split_pct_snapshot" DECIMAL(5,4) NOT NULL,
    "copy_pro_copier_id" TEXT,
    "equity_protector_pct" DECIMAL(5,4),
    "activated_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "copy_relations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trades" (
    "id" TEXT NOT NULL,
    "copy_relation_id" TEXT NOT NULL,
    "ticket" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "lots" DECIMAL(10,2) NOT NULL,
    "open_price" DECIMAL(19,8) NOT NULL,
    "close_price" DECIMAL(19,8),
    "profit" DECIMAL(19,8),
    "opened_at" TIMESTAMP(3) NOT NULL,
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT,
    "display_name" TEXT,
    "avatar_url" TEXT,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "kyc_status" "KycStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "referral_code" TEXT,
    "referred_by_code" TEXT,
    "two_fa_enabled" BOOLEAN NOT NULL DEFAULT false,
    "two_fa_secret" TEXT,
    "email_verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configs" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configs_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "balance" DECIMAL(19,8) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "amount" DECIMAL(19,8) NOT NULL,
    "type" "TxnType" NOT NULL,
    "reference" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "strategy_id" TEXT NOT NULL,
    "copy_relation_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atlas_gold_holdings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "balance" DECIMAL(19,8) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "atlas_gold_holdings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atlas_gold_transactions" (
    "id" TEXT NOT NULL,
    "holding_id" TEXT NOT NULL,
    "amount" DECIMAL(19,8) NOT NULL,
    "type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "atlas_gold_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "strategies_master_account_id_key" ON "strategies"("master_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "copy_relations_slave_account_id_key" ON "copy_relations"("slave_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "trades_ticket_copy_relation_id_key" ON "trades"("ticket", "copy_relation_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_referral_code_key" ON "users"("referral_code");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_user_id_key" ON "wallets"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_copy_relation_id_key" ON "subscriptions"("copy_relation_id");

-- CreateIndex
CREATE UNIQUE INDEX "atlas_gold_holdings_user_id_key" ON "atlas_gold_holdings"("user_id");

-- AddForeignKey
ALTER TABLE "copy_relations" ADD CONSTRAINT "copy_relations_strategy_id_fkey" FOREIGN KEY ("strategy_id") REFERENCES "strategies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_copy_relation_id_fkey" FOREIGN KEY ("copy_relation_id") REFERENCES "copy_relations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atlas_gold_transactions" ADD CONSTRAINT "atlas_gold_transactions_holding_id_fkey" FOREIGN KEY ("holding_id") REFERENCES "atlas_gold_holdings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
