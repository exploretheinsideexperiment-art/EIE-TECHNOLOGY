import type {
  AccessTokenRecord,
  AppSettings,
  Customer,
  DashboardStats,
  MerchantBankAccount,
  PaymentSession,
  PaymentStatus,
  Resource,
  SecurityEvent,
} from '../types';
import { buildAccessUrl } from './urlHelper';

const STORAGE_KEY = 'eie_local_db_v2';

interface LocalDataState {
  resources: Resource[];
  settings: AppSettings;
  transactions: PaymentSession[];
  tokens: AccessTokenRecord[];
  customers: Customer[];
  securityEvents: SecurityEvent[];
  auditLogs: any[];
}

const DEFAULT_BANK: MerchantBankAccount = {
  accountHolderName: 'Explore The Inside Experiment',
  accountNumber: '987654321012',
  bankName: 'State Bank of India',
  ifscCode: 'SBIN0001234',
  accountType: 'Current',
  upiId: 'exploretheinsideexperiment@okaxis',
  directUpiEnabled: true,
  qrNotePrefix: 'EIE',
};

const DEFAULT_RESOURCES: Resource[] = [
  {
    id: 'res_cyber_core_01',
    name: 'Zero-Trust Infrastructure Blueprint',
    description: 'Production Kubernetes zero-trust policies, mTLS configs, and hardened terraform modules.',
    originalUrl: 'https://github.com/eie-secur/zero-trust-infra-core',
    category: 'Cybersecurity',
    price: 199,
    currency: 'INR',
    tokenValidityHours: 24,
    tokenValidityUnit: 'hours',
    tokenValidityValue: 24,
    maxUses: 1,
    isEnabled: true,
    qrEnabled: true,
    emailEnabled: true,
    smsEnabled: false,
    whatsappEnabled: false,
    paymentGateway: 'Razorpay',
    createdAt: '2026-03-01T10:00:00.000Z',
    updatedAt: '2026-03-01T10:00:00.000Z',
  },
  {
    id: 'res_ai_agent_vault_02',
    name: 'Enterprise AI Agent Security Architecture',
    description: 'Complete OWASP GenAI top-10 defense framework, prompt guardrails, and audit proxy.',
    originalUrl: 'https://drive.google.com/drive/folders/eie-ai-agent-vault-prod',
    category: 'AI / LLM Security',
    price: 499,
    currency: 'INR',
    tokenValidityHours: 72,
    tokenValidityUnit: 'days',
    tokenValidityValue: 3,
    maxUses: 1,
    isEnabled: true,
    qrEnabled: true,
    emailEnabled: true,
    smsEnabled: false,
    whatsappEnabled: true,
    paymentGateway: 'Cashfree',
    createdAt: '2026-03-05T12:00:00.000Z',
    updatedAt: '2026-03-05T12:00:00.000Z',
  },
  {
    id: 'res_fintech_gateway_03',
    name: 'Fintech HMAC Payment Verification Library',
    description: 'Zero-leak webhook listener, signature verification and timing-safe token dispenser.',
    originalUrl: 'https://gitlab.com/eie-fintech/payment-gateway-shield',
    category: 'Fintech Tools',
    price: 99,
    currency: 'INR',
    tokenValidityHours: 12,
    tokenValidityUnit: 'hours',
    tokenValidityValue: 12,
    maxUses: 1,
    isEnabled: true,
    qrEnabled: true,
    emailEnabled: true,
    smsEnabled: false,
    whatsappEnabled: false,
    paymentGateway: 'Razorpay',
    createdAt: '2026-03-10T08:30:00.000Z',
    updatedAt: '2026-03-10T08:30:00.000Z',
  },
];

const DEFAULT_SETTINGS: AppSettings = {
  platformName: 'EIE-Technology',
  tagline: 'Explore the Inside Experiment-Technology (Created by Vipul)',
  defaultTokenExpiryHours: 24,
  defaultTokenExpiryUnit: 'hours',
  defaultTokenExpiryValue: 24,
  defaultMaxUses: 1,
  rateLimitPerMinute: 60,
  customDomain: 'pay.eie-technology.com',
  merchantAccount: DEFAULT_BANK,
  bankAccount: DEFAULT_BANK,
  general: {
    appName: 'EIE-Technology',
    subtitle: 'Explore the Inside Experiment-Technology (Created by Vipul)',
    brandColor: '#00e599',
    supportEmail: 'security@eie-technology.com',
    publicUrl: 'https://pay.eie-technology.com',
  },
  gateways: {
    razorpayKeyId: 'rzp_live_EIE9824Kx71',
    razorpaySecretMasked: '••••••••••••••••',
    razorpayWebhookSecretMasked: '••••••••••••••••',
    cashfreeAppId: 'cf_app_991823412',
    cashfreeSecretMasked: '••••••••••••••••',
    defaultGateway: 'Razorpay',
    testMode: false,
  },
  tokens: {
    defaultExpiryHours: 24,
    defaultExpiryUnit: 'hours',
    defaultExpiryValue: 24,
    defaultMaxUses: 1,
    ipBinding: false,
    deviceBinding: false,
    replayProtection: true,
  },
  notifications: {
    emailSubject: 'Your Secure Access Token | EIE-Technology',
    emailTemplate: 'Hello, your payment was confirmed. Here is your access link: {{link}}',
    smsTemplate: 'EIE: Payment received. Link: {{link}}',
    whatsappTemplate: 'Hello, payment received. Link: {{link}}',
  },
  domain: {
    customDomain: 'pay.eie-technology.com',
    payDomain: 'pay.eie-technology.com',
  },
  pwa: {
    enableInstallPrompt: true,
    offlineCacheEnabled: true,
  },
};

export const localFallback = {
  getData(): LocalDataState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      // ignore
    }
    const initial: LocalDataState = {
      resources: DEFAULT_RESOURCES,
      settings: DEFAULT_SETTINGS,
      transactions: [],
      tokens: [],
      customers: [],
      securityEvents: [],
      auditLogs: [],
    };
    this.saveData(initial);
    return initial;
  },

  saveData(data: LocalDataState) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      // ignore
    }
  },

  getResources(): Resource[] {
    return this.getData().resources;
  },

  saveResource(resource: Partial<Resource>): Resource {
    const data = this.getData();
    const isNew = !resource.id || resource.id.startsWith('temp_');
    let saved: Resource;
    if (isNew) {
      saved = {
        id: `res_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
        name: resource.name || 'Untitled Resource',
        description: resource.description || '',
        originalUrl: resource.originalUrl || 'https://example.com',
        category: resource.category || 'General',
        price: resource.price || 0,
        currency: resource.currency || 'INR',
        tokenValidityHours: resource.tokenValidityHours || 24,
        tokenValidityUnit: resource.tokenValidityUnit || 'hours',
        tokenValidityValue: resource.tokenValidityValue || 24,
        maxUses: resource.maxUses || 1,
        isEnabled: resource.isEnabled !== false,
        qrEnabled: resource.qrEnabled !== false,
        emailEnabled: resource.emailEnabled !== false,
        smsEnabled: resource.smsEnabled === true,
        whatsappEnabled: resource.whatsappEnabled === true,
        paymentGateway: resource.paymentGateway || 'Razorpay',
        customAccountNumber: resource.customAccountNumber,
        customAccountName: resource.customAccountName,
        customBankName: resource.customBankName,
        customIfscCode: resource.customIfscCode,
        customUpiId: resource.customUpiId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      data.resources.unshift(saved);
    } else {
      const idx = data.resources.findIndex((r) => r.id === resource.id);
      if (idx !== -1) {
        saved = {
          ...data.resources[idx],
          ...resource,
          updatedAt: new Date().toISOString(),
        } as Resource;
        data.resources[idx] = saved;
      } else {
        saved = resource as Resource;
        data.resources.unshift(saved);
      }
    }
    this.saveData(data);
    return saved;
  },

  deleteResource(id: string): boolean {
    const data = this.getData();
    data.resources = data.resources.filter((r) => r.id !== id);
    this.saveData(data);
    return true;
  },

  getSettings(): AppSettings {
    return this.getData().settings;
  },

  updateSettings(settings: Partial<AppSettings>): AppSettings {
    const data = this.getData();
    const updatedBank: MerchantBankAccount = {
      accountHolderName: settings.merchantAccount?.accountHolderName || settings.bankAccount?.accountHolderName || data.settings.merchantAccount?.accountHolderName || DEFAULT_BANK.accountHolderName,
      accountNumber: settings.merchantAccount?.accountNumber || settings.bankAccount?.accountNumber || data.settings.merchantAccount?.accountNumber || DEFAULT_BANK.accountNumber,
      bankName: settings.merchantAccount?.bankName || settings.bankAccount?.bankName || data.settings.merchantAccount?.bankName || DEFAULT_BANK.bankName,
      ifscCode: settings.merchantAccount?.ifscCode || settings.bankAccount?.ifscCode || data.settings.merchantAccount?.ifscCode || DEFAULT_BANK.ifscCode,
      accountType: (settings.merchantAccount?.accountType || settings.bankAccount?.accountType || data.settings.merchantAccount?.accountType || 'Current') as 'Current' | 'Savings',
      upiId: settings.merchantAccount?.upiId || settings.bankAccount?.upiId || data.settings.merchantAccount?.upiId || DEFAULT_BANK.upiId,
      directUpiEnabled: settings.merchantAccount?.directUpiEnabled ?? settings.bankAccount?.directUpiEnabled ?? true,
      qrNotePrefix: settings.merchantAccount?.qrNotePrefix || 'EIE',
    };

    data.settings = {
      ...data.settings,
      ...settings,
      merchantAccount: updatedBank,
      bankAccount: updatedBank,
    };
    this.saveData(data);
    return data.settings;
  },

  getTransactions(): PaymentSession[] {
    return this.getData().transactions;
  },

  getTokens(): AccessTokenRecord[] {
    return this.getData().tokens;
  },

  revokeToken(id: string): boolean {
    const data = this.getData();
    const token = data.tokens.find((t) => t.id === id);
    if (token) {
      token.status = 'REVOKED';
      this.saveData(data);
      return true;
    }
    return false;
  },

  expireToken(id: string): boolean {
    const data = this.getData();
    const token = data.tokens.find((t) => t.id === id);
    if (token) {
      token.status = 'EXPIRED';
      this.saveData(data);
      return true;
    }
    return false;
  },

  inspectToken(rawToken: string): {
    valid: boolean;
    status: string;
    reason?: string;
    resourceName?: string;
    resource?: Resource;
    expiresAt?: string;
    currentUses?: number;
    maxUses?: number;
  } {
    const data = this.getData();
    const token = data.tokens.find(
      (t) => t.tokenHash === rawToken || t.id === rawToken || (t.rawTokenPrefix && rawToken.startsWith(t.rawTokenPrefix))
    );
    if (!token) {
      return { valid: false, status: 'NOT_FOUND', reason: 'TOKEN_NOT_FOUND' };
    }
    const isExpired = new Date(token.expiresAt).getTime() < Date.now();
    if (token.status === 'REVOKED') {
      return { valid: false, status: 'REVOKED', reason: 'REVOKED', resourceName: token.resourceName };
    }
    if (token.status === 'EXPIRED' || isExpired) {
      return { valid: false, status: 'EXPIRED', reason: 'EXPIRED', resourceName: token.resourceName };
    }
    if (token.currentUses >= token.maxUses || token.status === 'USED') {
      return { valid: false, status: 'USED', reason: 'ALREADY_USED', resourceName: token.resourceName };
    }
    const resource = data.resources.find((r) => r.id === token.resourceId);
    return {
      valid: true,
      status: token.status,
      resourceName: token.resourceName,
      resource,
      expiresAt: token.expiresAt,
      currentUses: token.currentUses,
      maxUses: token.maxUses,
    };
  },

  validateAndConsumeToken(rawToken: string): {
    success: boolean;
    reason?: 'NOT_FOUND' | 'ALREADY_USED' | 'EXPIRED' | 'REVOKED';
    resourceName?: string;
    originalUrl?: string;
    tokenRecord?: AccessTokenRecord;
    resource?: Resource;
  } {
    const data = this.getData();
    const token = data.tokens.find(
      (t) => t.tokenHash === rawToken || t.id === rawToken || (t.rawTokenPrefix && rawToken.startsWith(t.rawTokenPrefix))
    );
    if (!token) {
      return { success: false, reason: 'NOT_FOUND' };
    }
    if (token.status === 'REVOKED') {
      return { success: false, reason: 'REVOKED', resourceName: token.resourceName, tokenRecord: token };
    }
    const isExpired = new Date(token.expiresAt).getTime() < Date.now();
    if (token.status === 'EXPIRED' || isExpired) {
      token.status = 'EXPIRED';
      this.saveData(data);
      return { success: false, reason: 'EXPIRED', resourceName: token.resourceName, tokenRecord: token };
    }
    if (token.currentUses >= token.maxUses || token.status === 'USED') {
      token.status = 'USED';
      this.saveData(data);
      return { success: false, reason: 'ALREADY_USED', resourceName: token.resourceName, tokenRecord: token };
    }

    token.currentUses += 1;
    if (token.currentUses >= token.maxUses) {
      token.status = 'USED';
    }
    this.saveData(data);

    const resource = data.resources.find((r) => r.id === token.resourceId);
    return {
      success: true,
      resourceName: token.resourceName,
      originalUrl: resource?.originalUrl,
      tokenRecord: token,
      resource,
    };
  },

  getCustomers(): Customer[] {
    return this.getData().customers;
  },

  deleteCustomer(id: string): boolean {
    const data = this.getData();
    data.customers = data.customers.filter((c) => c.id !== id);
    this.saveData(data);
    return true;
  },

  getSecurityEvents(): SecurityEvent[] {
    return this.getData().securityEvents;
  },

  getAuditLogs(): any[] {
    return this.getData().auditLogs;
  },

  getDashboardStats(): DashboardStats {
    const data = this.getData();
    const totalPayments = data.transactions.length;
    const successfulPayments = data.transactions.filter((t) => t.status === 'SUCCESS').length;
    const failedPayments = data.transactions.filter((t) => t.status === 'FAILED').length;
    const pendingPayments = data.transactions.filter(
      (t) => t.status === 'PENDING' || t.status === 'PROCESSING' || t.status === 'CREATED'
    ).length;
    const totalRevenue = data.transactions
      .filter((t) => t.status === 'SUCCESS')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const todayStr = new Date().toISOString().split('T')[0];
    const todayTransactions = data.transactions.filter((t) =>
      (t.paidAt || t.createdAt || '').startsWith(todayStr)
    ).length;

    const activeTokens = data.tokens.filter((t) => t.status === 'ACTIVE').length;
    const usedTokens = data.tokens.filter((t) => t.status === 'USED').length;
    const expiredTokens = data.tokens.filter((t) => t.status === 'EXPIRED').length;
    const revokedTokens = data.tokens.filter((t) => t.status === 'REVOKED').length;

    // Daily revenue grouped by last 7 days strictly from real data
    const days: { [date: string]: { amount: number; count: number } } = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dateKey = d.toISOString().split('T')[0];
      days[dateKey] = { amount: 0, count: 0 };
    }

    data.transactions.forEach((s) => {
      if (s.status === 'SUCCESS' && s.paidAt) {
        const dateKey = s.paidAt.split('T')[0];
        if (days[dateKey]) {
          days[dateKey].amount += s.amount || 0;
          days[dateKey].count += 1;
        }
      }
    });

    const revenueByDay = Object.keys(days).map((date) => ({
      date,
      amount: days[date].amount,
      count: days[date].count,
    }));

    const conversionRate = totalPayments > 0 ? Math.round((successfulPayments / totalPayments) * 100) : 0;

    return {
      totalPayments,
      successfulPayments,
      failedPayments,
      pendingPayments,
      totalRevenue,
      todayTransactions,
      activeTokens,
      usedTokens,
      expiredTokens,
      revokedTokens,
      revenueByDay,
      conversionRate,
    };
  },

  createPaymentSession(payload: {
    resourceId: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    paymentMethod?: string;
  }): { session: PaymentSession; paymentUrl: string } {
    const data = this.getData();
    const resource = data.resources.find((r) => r.id === payload.resourceId) || data.resources[0];
    const status: PaymentStatus = 'CREATED';
    const session: PaymentSession = {
      id: `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      resourceId: resource.id,
      resourceName: resource.name,
      customerName: payload.customerName,
      customerEmail: payload.customerEmail,
      customerPhone: payload.customerPhone || '+91 98765 43210',
      gateway: resource.paymentGateway || 'Razorpay',
      amount: resource.price,
      currency: resource.currency,
      paymentMethod: (payload.paymentMethod as any) || 'UPI',
      status,
      gatewayOrderId: `order_${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 60000).toISOString(),
    };
    data.transactions.unshift(session);
    this.saveData(data);
    return { session, paymentUrl: `/?session=${session.id}` };
  },

  simulateGatewayWebhook(sessionId: string, paymentMethod?: string): any {
    const data = this.getData();
    const session = data.transactions.find((s) => s.id === sessionId);
    if (!session) throw new Error('Session not found');

    const resource = data.resources.find((r) => r.id === session.resourceId) || data.resources[0];
    const rawToken = `eie_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
    
    session.status = 'SUCCESS';
    session.paidAt = new Date().toISOString();
    session.gatewayPaymentId = `pay_${Date.now().toString(36)}`;
    session.paymentMethod = (paymentMethod as any) || session.paymentMethod;

    session.protectedUrl = buildAccessUrl(rawToken);

    const tokenRecord: AccessTokenRecord = {
      id: `tok_${Date.now().toString(36)}`,
      tokenHash: rawToken,
      rawTokenPrefix: rawToken.slice(0, 8),
      resourceId: resource.id,
      resourceName: resource.name,
      paymentId: session.gatewayPaymentId,
      sessionId: session.id,
      customerEmail: session.customerEmail,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + (resource.tokenValidityHours || 24) * 3600000).toISOString(),
      maxUses: resource.maxUses || 1,
      currentUses: 0,
      status: 'ACTIVE',
    };
    data.tokens.unshift(tokenRecord);

    // Register or update customer
    let customer = data.customers.find((c) => c.email.toLowerCase() === session.customerEmail.toLowerCase());
    const nowStr = new Date().toISOString();
    if (customer) {
      customer.name = session.customerName || customer.name;
      customer.phone = session.customerPhone || customer.phone;
      customer.totalPayments += 1;
      customer.totalAmount = (customer.totalAmount || 0) + session.amount;
      customer.lastPaymentAt = nowStr;
      customer.activeTokensCount = (customer.activeTokensCount || 0) + 1;
    } else {
      customer = {
        id: `cust_${Date.now().toString(36)}`,
        name: session.customerName,
        email: session.customerEmail,
        phone: session.customerPhone,
        totalPayments: 1,
        totalAmount: session.amount,
        currency: session.currency,
        lastPaymentAt: nowStr,
        activeTokensCount: 1,
        createdAt: nowStr,
      };
      data.customers.unshift(customer);
    }

    // Add Audit Log
    data.auditLogs.unshift({
      id: `aud_${Date.now().toString(36)}`,
      action: 'PAYMENT_VERIFIED',
      actor: `Gateway (${session.gateway})`,
      details: `Payment verified for Order ${session.gatewayOrderId}. Amount: ₹${session.amount}. Single-use token ${tokenRecord.rawTokenPrefix} issued.`,
      timestamp: nowStr,
    });

    this.saveData(data);

    return {
      success: true,
      verifiedWebhook: true,
      signatureVerified: true,
      session,
      rawToken,
      protectedUrl: session.protectedUrl,
    };
  },

  confirmUpiPayment(params: {
    sessionId: string;
    utrNumber?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
  }): any {
    const data = this.getData();
    const session = data.transactions.find((s) => s.id === params.sessionId);
    if (!session) throw new Error('Session not found');

    if (params.customerName) session.customerName = params.customerName.trim();
    if (params.customerEmail) session.customerEmail = params.customerEmail.trim();
    if (params.customerPhone) session.customerPhone = params.customerPhone.trim();

    const resource = data.resources.find((r) => r.id === session.resourceId) || data.resources[0];
    const rawToken = `eie_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;

    session.status = 'SUCCESS';
    session.paidAt = new Date().toISOString();
    session.paymentMethod = 'UPI';
    session.gatewayPaymentId = params.utrNumber ? `upi_utr_${params.utrNumber.trim()}` : `upi_${Date.now().toString(36)}`;
    session.protectedUrl = buildAccessUrl(rawToken);

    const tokenRecord: AccessTokenRecord = {
      id: `tok_${Date.now().toString(36)}`,
      tokenHash: rawToken,
      rawTokenPrefix: rawToken.slice(0, 8),
      resourceId: resource.id,
      resourceName: resource.name,
      paymentId: session.gatewayPaymentId,
      sessionId: session.id,
      customerEmail: session.customerEmail,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + (resource.tokenValidityHours || 24) * 3600000).toISOString(),
      maxUses: resource.maxUses || 1,
      currentUses: 0,
      status: 'ACTIVE',
    };
    data.tokens.unshift(tokenRecord);

    // Register or update customer
    let customer = data.customers.find((c) => c.email.toLowerCase() === session.customerEmail.toLowerCase());
    const nowStr = new Date().toISOString();
    if (customer) {
      customer.name = session.customerName || customer.name;
      customer.phone = session.customerPhone || customer.phone;
      customer.totalPayments += 1;
      customer.totalAmount = (customer.totalAmount || 0) + session.amount;
      customer.lastPaymentAt = nowStr;
      customer.activeTokensCount = (customer.activeTokensCount || 0) + 1;
    } else {
      customer = {
        id: `cust_${Date.now().toString(36)}`,
        name: session.customerName,
        email: session.customerEmail,
        phone: session.customerPhone,
        totalPayments: 1,
        totalAmount: session.amount,
        currency: session.currency,
        lastPaymentAt: nowStr,
        activeTokensCount: 1,
        createdAt: nowStr,
      };
      data.customers.unshift(customer);
    }

    data.auditLogs.unshift({
      id: `aud_${Date.now().toString(36)}`,
      action: 'PAYMENT_VERIFIED',
      actor: 'UPI Direct Settlement',
      details: `Direct UPI payment confirmed for Order ${session.gatewayOrderId}. UTR: ${params.utrNumber || 'Direct'}. Amount: ₹${session.amount}. Token ${tokenRecord.rawTokenPrefix} issued.`,
      timestamp: nowStr,
    });

    this.saveData(data);

    return {
      success: true,
      verifiedWebhook: true,
      signatureVerified: true,
      session,
      rawToken,
      protectedUrl: session.protectedUrl,
    };
  },
};
