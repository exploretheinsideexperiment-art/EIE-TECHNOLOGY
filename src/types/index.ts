export type PaymentStatus =
  | 'CREATED'
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED'
  | 'EXPIRED'
  | 'REFUNDED';

export type TokenStatus = 'ACTIVE' | 'USED' | 'EXPIRED' | 'REVOKED';

export type SecuritySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TokenValidityUnit = 'hours' | 'days' | 'months' | 'years';

export interface MerchantBankAccount {
  accountHolderName: string;
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  accountType: 'Savings' | 'Current';
  upiId: string;
  directUpiEnabled: boolean;
  qrNotePrefix?: string;
}

export interface Resource {
  id: string;
  name: string;
  description: string;
  originalUrl: string;
  category: string;
  price: number;
  currency: string;
  tokenValidityHours: number;
  tokenValidityUnit?: TokenValidityUnit;
  tokenValidityValue?: number;
  customUpiId?: string;
  customAccountNumber?: string;
  customAccountName?: string;
  customIfscCode?: string;
  customBankName?: string;
  maxUses: number;
  isEnabled: boolean;
  qrEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  whatsappEnabled: boolean;
  paymentGateway: 'Razorpay' | 'Cashfree' | 'Stripe' | 'UPI Standard';
  customSlug?: string;
  autoCacheBust?: boolean;
  githubRepoUrl?: string;
  lastSyncedAt?: string;
  successRedirect?: string;
  failureRedirect?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentSession {
  id: string;
  resourceId: string;
  resourceName: string;
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  gateway: string;
  gatewayOrderId: string;
  gatewayPaymentId?: string;
  paymentMethod?: string;
  status: PaymentStatus;
  createdAt: string;
  paidAt?: string;
  expiresAt: string;
  accessTokenId?: string;
  protectedUrl?: string;
}

export interface AccessTokenRecord {
  id: string;
  tokenHash: string;
  rawTokenPrefix: string;
  resourceId: string;
  resourceName: string;
  paymentId: string;
  sessionId: string;
  customerEmail: string;
  createdAt: string;
  expiresAt: string;
  maxUses: number;
  currentUses: number;
  status: TokenStatus;
  ipAddress?: string;
  userAgent?: string;
  boundDeviceType?: 'Mobile' | 'Laptop / Desktop' | 'Tablet';
  boundDeviceId?: string;
  boundUserAgent?: string;
  boundIpAddress?: string;
  singleDeviceEnforced?: boolean;
  revokedAt?: string;
  revokedReason?: string;
  usageHistory?: Array<{ timestamp: string; ipAddress: string; userAgent: string; granted: boolean }>;
}

export interface TokenUsage {
  id: string;
  tokenId: string;
  resourceId: string;
  resourceName: string;
  accessedAt: string;
  ipAddress: string;
  userAgent: string;
  status: 'GRANTED' | 'DENIED_USED' | 'DENIED_EXPIRED' | 'DENIED_REVOKED' | 'DENIED_NOT_FOUND' | 'RATE_LIMITED' | 'DENIED_CONCURRENT_DEVICE';
  destinationDomain?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  totalPayments: number;
  totalAmount: number;
  totalSpent?: number;
  currency: string;
  lastPaymentAt: string;
  firstPaymentDate?: string;
  lastPaymentDate?: string;
  activeTokensCount: number;
  createdAt: string;
}

export interface SecurityEvent {
  id: string;
  type:
    | 'FAILED_TOKEN'
    | 'EXPIRED_TOKEN'
    | 'REPLAYED_TOKEN'
    | 'TOKEN_REPLAY_ATTEMPT'
    | 'TOKEN_NOT_FOUND'
    | 'TOKEN_EXPIRED'
    | 'SUSPICIOUS_IP'
    | 'RATE_LIMIT'
    | 'INVALID_WEBHOOK'
    | 'AUTH_FAILURE'
    | 'ADMIN_LOGIN'
    | 'TOKEN_REVOCATION'
    | 'RESOURCE_MODIFIED';
  severity: SecuritySeverity;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  resourceId?: string;
  tokenId?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface AuditLog {
  id: string;
  action: string;
  actor: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}

export interface AppSettings {
  platformName?: string;
  tagline?: string;
  defaultTokenExpiryHours?: number;
  defaultTokenExpiryUnit?: TokenValidityUnit;
  defaultTokenExpiryValue?: number;
  defaultMaxUses?: number;
  rateLimitPerMinute?: number;
  customDomain?: string;
  merchantAccount?: MerchantBankAccount;
  bankAccount?: MerchantBankAccount;
  general: {
    appName: string;
    subtitle: string;
    brandColor: string;
    supportEmail: string;
    publicUrl: string;
  };
  gateways: {
    razorpayKeyId: string;
    razorpaySecretMasked: string;
    razorpayWebhookSecretMasked: string;
    cashfreeAppId: string;
    cashfreeSecretMasked: string;
    defaultGateway: string;
    testMode: boolean;
  };
  tokens: {
    defaultExpiryHours: number;
    defaultExpiryUnit?: TokenValidityUnit;
    defaultExpiryValue?: number;
    defaultMaxUses: number;
    ipBinding: boolean;
    deviceBinding: boolean;
    replayProtection: boolean;
  };
  notifications: {
    emailSubject: string;
    emailTemplate: string;
    smsTemplate: string;
    whatsappTemplate: string;
  };
  domain: {
    customDomain: string;
    payDomain: string;
  };
  pwa: {
    enableInstallPrompt: boolean;
    offlineCacheEnabled: boolean;
  };
}

export interface DashboardStats {
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
  totalRevenue: number;
  todayTransactions: number;
  activeTokens: number;
  usedTokens: number;
  expiredTokens: number;
  revokedTokens: number;
  revenueByDay: { date: string; amount: number; count: number }[];
  conversionRate: number;
}
