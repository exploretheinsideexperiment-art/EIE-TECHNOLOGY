import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type {
  AccessTokenRecord,
  AppSettings,
  Customer,
  DashboardStats,
  PaymentSession,
  PaymentStatus,
  Resource,
  SecurityEvent,
  SecuritySeverity,
  TokenStatus,
  TokenUsage,
} from '../src/types';

export function parseDeviceType(userAgent?: string): 'Mobile' | 'Laptop / Desktop' | 'Tablet' {
  if (!userAgent) return 'Laptop / Desktop';
  const ua = userAgent.toLowerCase();
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'Tablet';
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/i.test(ua)) return 'Mobile';
  return 'Laptop / Desktop';
}

interface DatabaseSchema {
  resources: Resource[];
  paymentSessions: PaymentSession[];
  accessTokens: AccessTokenRecord[];
  tokenUsages: TokenUsage[];
  customers: Customer[];
  securityEvents: SecurityEvent[];
  auditLogs: { id: string; action: string; actor: string; details: string; ipAddress?: string; timestamp: string }[];
  settings: AppSettings;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const DEFAULT_SETTINGS: AppSettings = {
  general: {
    appName: 'EIE-Technology',
    subtitle: 'Explore the Inside Experiment-Technology (Created by Vipul)',
    brandColor: '#00e599',
    supportEmail: 'security@eie-technology.com',
    publicUrl: process.env.APP_URL || 'https://eie-technology.com',
  },
  gateways: {
    razorpayKeyId: 'rzp_live_EIE9824Kx71',
    razorpaySecretMasked: '••••••••••••••••••••3a8F',
    razorpayWebhookSecretMasked: '••••••••••••••••••••92Km',
    cashfreeAppId: 'CF_EIE_APP_77810',
    cashfreeSecretMasked: '••••••••••••••••••••66b9',
    defaultGateway: 'Razorpay',
    testMode: false,
  },
  tokens: {
    defaultExpiryHours: 24,
    defaultExpiryValue: 24,
    defaultExpiryUnit: 'hours',
    defaultMaxUses: 1,
    ipBinding: false,
    deviceBinding: false,
    replayProtection: true,
  },
  merchantAccount: {
    accountHolderName: 'Explore The Inside Experiment',
    accountNumber: '987654321012',
    bankName: 'State Bank of India',
    ifscCode: 'SBIN0001234',
    accountType: 'Current',
    upiId: 'exploretheinsideexperiment@okaxis',
    directUpiEnabled: true,
    qrNotePrefix: 'EIE',
  },
  notifications: {
    emailSubject: 'Verified Access: Your One-Time Security Link is Ready',
    emailTemplate: 'Hello {{customer_name}},\n\nYour payment of {{currency}} {{amount}} for "{{resource_name}}" was successfully verified by EIE-Technology.\n\nYour Protected Access Link:\n{{protected_url}}\n\n* Note: This is a cryptographically secured one-time link. After first access, it deactivates automatically to prevent unauthorized redistribution.\n\nEIE-Technology - Explore the Inside Experiment-Technology (Created by Vipul)',
    smsTemplate: 'EIE-Tech: Payment of {{currency}} {{amount}} verified for {{resource_name}}. Your single-use secure link: {{protected_url}}',
    whatsappTemplate: '🔒 *EIE-Technology Security Notice*\n\nPayment verified for *{{resource_name}}*.\nAmount: {{currency}} {{amount}}\n\nAccess Link: {{protected_url}}\n(Expires in 24 hours. Single-use only)',
  },
  domain: {
    customDomain: 'eie-technology.com',
    payDomain: 'pay.eie-technology.com',
  },
  pwa: {
    enableInstallPrompt: true,
    offlineCacheEnabled: true,
  },
};

function getInitialData(): DatabaseSchema {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  const sampleResources: Resource[] = [
    {
      id: 'res_cyber_core_01',
      name: 'Zero-Trust Infrastructure Blueprint',
      description: 'Production Kubernetes zero-trust policies, mTLS configs, and hardened terraform modules.',
      originalUrl: 'https://github.com/eie-secur/zero-trust-infra-core',
      category: 'Cybersecurity',
      price: 199,
      currency: 'INR',
      tokenValidityHours: 24,
      maxUses: 1,
      isEnabled: true,
      qrEnabled: true,
      emailEnabled: true,
      smsEnabled: true,
      whatsappEnabled: true,
      paymentGateway: 'Razorpay',
      createdAt: twoDaysAgo.toISOString(),
      updatedAt: yesterday.toISOString(),
    },
    {
      id: 'res_fintech_api_02',
      name: 'High-Throughput Payment Engine SDK',
      description: 'Distributed ledger payment routing service with automated reconciliation and idempotency.',
      originalUrl: 'https://github.com/eie-secur/fintech-payment-engine',
      category: 'Developer Tools',
      price: 499,
      currency: 'INR',
      tokenValidityHours: 48,
      maxUses: 1,
      isEnabled: true,
      qrEnabled: true,
      emailEnabled: true,
      smsEnabled: true,
      whatsappEnabled: false,
      paymentGateway: 'Razorpay',
      createdAt: twoDaysAgo.toISOString(),
      updatedAt: twoDaysAgo.toISOString(),
    },
    {
      id: 'res_audit_playbook_03',
      name: 'SOC2 & ISO-27001 Compliance Matrix',
      description: 'Exhaustive audit-ready templates, risk assessment spreadsheets, and policy controls.',
      originalUrl: 'https://github.com/eie-secur/compliance-framework-2026',
      category: 'Compliance',
      price: 299,
      currency: 'INR',
      tokenValidityHours: 12,
      maxUses: 1,
      isEnabled: true,
      qrEnabled: true,
      emailEnabled: true,
      smsEnabled: false,
      whatsappEnabled: true,
      paymentGateway: 'Cashfree',
      createdAt: yesterday.toISOString(),
      updatedAt: yesterday.toISOString(),
    },
  ];

  return {
    resources: sampleResources,
    paymentSessions: [],
    accessTokens: [],
    tokenUsages: [],
    customers: [],
    securityEvents: [],
    auditLogs: [],
    settings: DEFAULT_SETTINGS,
  };
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('[DB] Error reading DB file, reinitializing default data:', err);
    }
    const initial = getInitialData();
    this.saveData(initial);
    return initial;
  }

  private saveData(data: DatabaseSchema): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DB] Error persisting to DB file:', err);
    }
  }

  public getResources(): Resource[] {
    return this.data.resources;
  }

  public getResourceById(id: string): Resource | undefined {
    return this.data.resources.find((r) => r.id === id);
  }

  public saveResource(resource: Resource): Resource {
    let calculatedHours = resource.tokenValidityHours || 24;
    if (resource.tokenValidityUnit && resource.tokenValidityValue) {
      const val = Number(resource.tokenValidityValue) || 1;
      if (resource.tokenValidityUnit === 'hours') calculatedHours = val;
      else if (resource.tokenValidityUnit === 'days') calculatedHours = val * 24;
      else if (resource.tokenValidityUnit === 'months') calculatedHours = val * 30 * 24;
      else if (resource.tokenValidityUnit === 'years') calculatedHours = val * 365 * 24;
    }

    const finalResource: Resource = {
      ...resource,
      tokenValidityHours: calculatedHours,
    };

    const existingIndex = this.data.resources.findIndex((r) => r.id === finalResource.id);
    if (existingIndex >= 0) {
      this.data.resources[existingIndex] = { ...finalResource, updatedAt: new Date().toISOString() };
    } else {
      this.data.resources.push(finalResource);
    }
    this.saveData(this.data);
    this.recordAuditLog('RESOURCE_SAVED', 'Admin', `Saved resource: ${finalResource.name} (${finalResource.price} ${finalResource.currency})`);
    return finalResource;
  }

  public deleteResource(id: string): boolean {
    const res = this.data.resources.find((r) => r.id === id);
    if (!res) return false;
    this.data.resources = this.data.resources.filter((r) => r.id !== id);
    this.saveData(this.data);
    this.recordAuditLog('RESOURCE_DELETED', 'Admin', `Deleted resource: ${res.name} (ID: ${id})`);
    return true;
  }

  // Payment Sessions
  public createPaymentSession(sessionData: Omit<PaymentSession, 'id' | 'createdAt' | 'status'>): PaymentSession {
    const session: PaymentSession = {
      ...sessionData,
      id: `sess_${crypto.randomBytes(8).toString('hex')}`,
      status: 'CREATED',
      createdAt: new Date().toISOString(),
    };
    this.data.paymentSessions.unshift(session);
    this.saveData(this.data);
    return session;
  }

  public getPaymentSession(id: string): PaymentSession | undefined {
    return this.data.paymentSessions.find((s) => s.id === id);
  }

  public updatePaymentSession(id: string, updates: Partial<PaymentSession>): PaymentSession | undefined {
    const session = this.data.paymentSessions.find((s) => s.id === id);
    if (!session) return undefined;
    Object.assign(session, updates);
    this.saveData(this.data);
    return session;
  }

  public getPaymentSessions(): PaymentSession[] {
    return this.data.paymentSessions;
  }

  // Cryptographic CSPRNG Token Generation
  public issueAccessToken(options: {
    resourceId: string;
    sessionId: string;
    paymentId: string;
    customerEmail: string;
    ipAddress?: string;
    userAgent?: string;
  }): { rawToken: string; tokenRecord: AccessTokenRecord } {
    const resource = this.getResourceById(options.resourceId);
    if (!resource) {
      throw new Error(`Resource ${options.resourceId} not found`);
    }

    // High entropy 32 bytes (256-bit) CSPRNG URL-safe token
    const rawToken = crypto.randomBytes(32).toString('base64url');
    // SHA-256 hash stored in DB
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const rawTokenPrefix = rawToken.substring(0, 6) + '...';

    const now = new Date();
    let validityHours = resource.tokenValidityHours || 24;
    if (resource.tokenValidityUnit && resource.tokenValidityValue) {
      const val = Number(resource.tokenValidityValue) || 1;
      if (resource.tokenValidityUnit === 'hours') validityHours = val;
      else if (resource.tokenValidityUnit === 'days') validityHours = val * 24;
      else if (resource.tokenValidityUnit === 'months') validityHours = val * 30 * 24;
      else if (resource.tokenValidityUnit === 'years') validityHours = val * 365 * 24;
    }
    const expiryMs = validityHours * 60 * 60 * 1000;
    const expiresAt = new Date(now.getTime() + expiryMs).toISOString();

    const tokenRecord: AccessTokenRecord = {
      id: `tok_${crypto.randomBytes(6).toString('hex')}`,
      tokenHash,
      rawTokenPrefix,
      resourceId: resource.id,
      resourceName: resource.name,
      paymentId: options.paymentId,
      sessionId: options.sessionId,
      customerEmail: options.customerEmail,
      createdAt: now.toISOString(),
      expiresAt,
      maxUses: resource.maxUses || 1,
      currentUses: 0,
      status: 'ACTIVE',
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
    };

    this.data.accessTokens.unshift(tokenRecord);
    this.saveData(this.data);

    this.recordAuditLog(
      'TOKEN_ISSUED',
      'System',
      `Issued single-use access token for resource "${resource.name}" to ${options.customerEmail} (Expires: ${expiresAt})`
    );

    return { rawToken, tokenRecord };
  }

  // Atomic Token Consumption & Validation
  public validateAndConsumeToken(
    rawToken: string,
    meta: { ipAddress: string; userAgent: string; referer?: string }
  ): {
    success: boolean;
    reason?: 'NOT_FOUND' | 'ALREADY_USED' | 'EXPIRED' | 'REVOKED' | 'INVALID_SCHEME';
    originalUrl?: string;
    resourceName?: string;
    tokenRecord?: AccessTokenRecord;
  } {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const tokenRecord = this.data.accessTokens.find((t) => t.tokenHash === tokenHash);

    if (!tokenRecord) {
      this.recordSecurityEvent({
        type: 'FAILED_TOKEN',
        severity: 'MEDIUM',
        description: 'Unrecognized token verification attempt',
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });
      return { success: false, reason: 'NOT_FOUND' };
    }

    const resource = this.getResourceById(tokenRecord.resourceId);
    if (!resource) {
      return { success: false, reason: 'NOT_FOUND' };
    }

    // Check Revocation
    if (tokenRecord.status === 'REVOKED') {
      this.recordSecurityEvent({
        type: 'FAILED_TOKEN',
        severity: 'HIGH',
        description: `Access attempt on revoked token ${tokenRecord.rawTokenPrefix} for resource "${resource.name}"`,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        tokenId: tokenRecord.id,
        resourceId: resource.id,
      });
      return { success: false, reason: 'REVOKED', resourceName: resource.name, tokenRecord };
    }

    // Check Expiration
    const now = Date.now();
    const expiryTime = new Date(tokenRecord.expiresAt).getTime();
    if (now > expiryTime || tokenRecord.status === 'EXPIRED') {
      tokenRecord.status = 'EXPIRED';
      this.saveData(this.data);
      this.recordSecurityEvent({
        type: 'EXPIRED_TOKEN',
        severity: 'LOW',
        description: `Expired token access attempt for resource "${resource.name}" (Expired at ${tokenRecord.expiresAt})`,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        tokenId: tokenRecord.id,
        resourceId: resource.id,
      });
      return { success: false, reason: 'EXPIRED', resourceName: resource.name, tokenRecord };
    }

    // Check Usage Limit (Single-use enforcement)
    if (tokenRecord.currentUses >= tokenRecord.maxUses || tokenRecord.status === 'USED') {
      tokenRecord.status = 'USED';
      this.saveData(this.data);
      this.recordSecurityEvent({
        type: 'REPLAYED_TOKEN',
        severity: 'MEDIUM',
        description: `Blocked replay attempt on already-used token ${tokenRecord.rawTokenPrefix} for "${resource.name}". Access link is permanently disabled.`,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        tokenId: tokenRecord.id,
        resourceId: resource.id,
      });
      return { success: false, reason: 'ALREADY_USED', resourceName: resource.name, tokenRecord };
    }

    // Security Check: Destination URL validation (Strict Open-Redirect & SSRF Protection)
    const originalUrl = resource.originalUrl.trim();
    if (!/^https?:\/\//i.test(originalUrl)) {
      this.recordSecurityEvent({
        type: 'FAILED_TOKEN',
        severity: 'CRITICAL',
        description: `Blocked unsafe redirect scheme: "${originalUrl}" on resource "${resource.name}"`,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        resourceId: resource.id,
      });
      return { success: false, reason: 'INVALID_SCHEME' };
    }

    // ---------------------------------------------------------------------------
    // Single-Device Policy Enforcement (At a time ek hi device: Mobile ya Laptop)
    // ---------------------------------------------------------------------------
    const currentDeviceType = parseDeviceType(meta.userAgent);

    if (tokenRecord.boundDeviceType) {
      // If already bound to a device type, block access from any different device
      if (tokenRecord.boundDeviceType !== currentDeviceType) {
        this.recordSecurityEvent({
          type: 'SUSPICIOUS_IP',
          severity: 'HIGH',
          description: `Single-device restriction violated for token ${tokenRecord.rawTokenPrefix}. Token is locked to "${tokenRecord.boundDeviceType}", but access was attempted from "${currentDeviceType}". Single device policy strictly enforced.`,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
          tokenId: tokenRecord.id,
          resourceId: resource.id,
        });

        this.data.tokenUsages.unshift({
          id: `use_${crypto.randomBytes(6).toString('hex')}`,
          tokenId: tokenRecord.id,
          resourceId: resource.id,
          resourceName: resource.name,
          accessedAt: new Date().toISOString(),
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
          status: 'DENIED_CONCURRENT_DEVICE',
          destinationDomain: new URL(originalUrl).hostname,
        });
        this.saveData(this.data);

        return {
          success: false,
          reason: 'CONCURRENT_DEVICE_BLOCKED' as any,
          resourceName: resource.name,
          tokenRecord,
        };
      }
    } else {
      // First access locks the token to this device type (Mobile or Laptop)
      tokenRecord.boundDeviceType = currentDeviceType;
      tokenRecord.boundUserAgent = meta.userAgent;
      tokenRecord.boundIpAddress = meta.ipAddress;
    }

    // Atomic Consumption
    tokenRecord.currentUses += 1;
    if (tokenRecord.currentUses >= tokenRecord.maxUses) {
      tokenRecord.status = 'USED';
    }

    // Record Usage Audit
    this.data.tokenUsages.unshift({
      id: `use_${crypto.randomBytes(6).toString('hex')}`,
      tokenId: tokenRecord.id,
      resourceId: resource.id,
      resourceName: resource.name,
      accessedAt: new Date().toISOString(),
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      status: 'GRANTED',
      destinationDomain: new URL(originalUrl).hostname,
    });

    this.saveData(this.data);

    this.recordAuditLog(
      'TOKEN_ACCESSED_GRANTED',
      'Customer',
      `Authorized single-use token ${tokenRecord.rawTokenPrefix} consumed. Performing server-side redirect for "${resource.name}". Remaining uses: ${
        tokenRecord.maxUses - tokenRecord.currentUses
      }`
    );

    return {
      success: true,
      originalUrl,
      resourceName: resource.name,
      tokenRecord,
    };
  }

  // Token Management Actions
  public revokeToken(tokenId: string, reason: string): boolean {
    const token = this.data.accessTokens.find((t) => t.id === tokenId);
    if (!token) return false;
    token.status = 'REVOKED';
    token.revokedAt = new Date().toISOString();
    token.revokedReason = reason;
    this.saveData(this.data);
    this.recordSecurityEvent({
      type: 'TOKEN_REVOCATION',
      severity: 'MEDIUM',
      description: `Administrator manually revoked token ${token.rawTokenPrefix}. Reason: ${reason}`,
      tokenId: token.id,
      resourceId: token.resourceId,
    });
    return true;
  }

  public expireToken(tokenId: string): boolean {
    const token = this.data.accessTokens.find((t) => t.id === tokenId);
    if (!token) return false;
    token.status = 'EXPIRED';
    token.expiresAt = new Date().toISOString();
    this.saveData(this.data);
    return true;
  }

  public getTokens(): AccessTokenRecord[] {
    return this.data.accessTokens;
  }

  public getTokenUsages(): TokenUsage[] {
    return this.data.tokenUsages;
  }

  // Security Events & Audit Logs
  public recordSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): void {
    const secEvent: SecurityEvent = {
      ...event,
      id: `sec_${crypto.randomBytes(6).toString('hex')}`,
      timestamp: new Date().toISOString(),
    };
    this.data.securityEvents.unshift(secEvent);
    // Limit to latest 500 events
    if (this.data.securityEvents.length > 500) {
      this.data.securityEvents.pop();
    }
    this.saveData(this.data);
  }

  public getSecurityEvents(): SecurityEvent[] {
    return this.data.securityEvents;
  }

  public recordAuditLog(action: string, actor: string, details: string, ipAddress?: string): void {
    this.data.auditLogs.unshift({
      id: `aud_${crypto.randomBytes(6).toString('hex')}`,
      action,
      actor,
      details,
      ipAddress,
      timestamp: new Date().toISOString(),
    });
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs.pop();
    }
    this.saveData(this.data);
  }

  public getAuditLogs() {
    return this.data.auditLogs;
  }

  // Customers
  public getCustomers(): Customer[] {
    return this.data.customers;
  }

  public registerOrUpdateCustomer(data: { name: string; email: string; phone?: string; amount: number; currency: string }): Customer {
    let customer = this.data.customers.find((c) => c.email.toLowerCase() === data.email.toLowerCase());
    const now = new Date().toISOString();
    if (customer) {
      customer.name = data.name || customer.name;
      customer.phone = data.phone || customer.phone;
      customer.totalPayments += 1;
      customer.totalAmount += data.amount;
      customer.lastPaymentAt = now;
    } else {
      customer = {
        id: `cust_${crypto.randomBytes(6).toString('hex')}`,
        name: data.name,
        email: data.email,
        phone: data.phone,
        totalPayments: 1,
        totalAmount: data.amount,
        currency: data.currency,
        lastPaymentAt: now,
        activeTokensCount: 1,
        createdAt: now,
      };
      this.data.customers.unshift(customer);
    }
    this.saveData(this.data);
    return customer;
  }

  public deleteCustomerData(customerId: string): boolean {
    const cust = this.data.customers.find((c) => c.id === customerId);
    if (!cust) return false;
    this.data.customers = this.data.customers.filter((c) => c.id !== customerId);
    this.saveData(this.data);
    this.recordAuditLog('CUSTOMER_GDPR_DELETED', 'Admin', `Deleted customer record for ${cust.email}`);
    return true;
  }

  // Settings
  public getSettings(): AppSettings {
    return this.data.settings;
  }

  public updateSettings(newSettings: Partial<AppSettings>): AppSettings {
    this.data.settings = {
      ...this.data.settings,
      ...newSettings,
      general: { ...this.data.settings.general, ...(newSettings.general || {}) },
      gateways: { ...this.data.settings.gateways, ...(newSettings.gateways || {}) },
      tokens: { ...this.data.settings.tokens, ...(newSettings.tokens || {}) },
      notifications: { ...this.data.settings.notifications, ...(newSettings.notifications || {}) },
      merchantAccount: {
        ...(this.data.settings.merchantAccount || {
          accountHolderName: 'Explore The Inside Experiment',
          accountNumber: '987654321012',
          bankName: 'State Bank of India',
          ifscCode: 'SBIN0001234',
          accountType: 'Current',
          upiId: 'exploretheinsideexperiment@okaxis',
          directUpiEnabled: true,
          qrNotePrefix: 'EIE',
        }),
        ...(newSettings.merchantAccount || newSettings.bankAccount || {}),
      },
      domain: { ...this.data.settings.domain, ...(newSettings.domain || {}) },
      pwa: { ...this.data.settings.pwa, ...(newSettings.pwa || {}) },
    };
    this.saveData(this.data);
    this.recordAuditLog('SETTINGS_UPDATED', 'Admin', 'Updated platform configuration');
    return this.data.settings;
  }

  // Dashboard Stats
  public getDashboardStats(): DashboardStats {
    const sessions = this.data.paymentSessions;
    const tokens = this.data.accessTokens;

    const totalPayments = sessions.length;
    const successfulPayments = sessions.filter((s) => s.status === 'SUCCESS').length;
    const failedPayments = sessions.filter((s) => s.status === 'FAILED').length;
    const pendingPayments = sessions.filter((s) => s.status === 'PENDING' || s.status === 'CREATED').length;
    const totalRevenue = sessions
      .filter((s) => s.status === 'SUCCESS')
      .reduce((sum, s) => sum + (s.amount || 0), 0);

    const todayStr = new Date().toISOString().split('T')[0];
    const todayTransactions = sessions.filter((s) => (s.paidAt || s.createdAt).startsWith(todayStr)).length;

    const activeTokens = tokens.filter((t) => t.status === 'ACTIVE').length;
    const usedTokens = tokens.filter((t) => t.status === 'USED').length;
    const expiredTokens = tokens.filter((t) => t.status === 'EXPIRED').length;
    const revokedTokens = tokens.filter((t) => t.status === 'REVOKED').length;

    // Daily revenue grouped by last 7 days
    const days: { [date: string]: { amount: number; count: number } } = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dateKey = d.toISOString().split('T')[0];
      days[dateKey] = { amount: 0, count: 0 };
    }

    sessions.forEach((s) => {
      if (s.status === 'SUCCESS' && s.paidAt) {
        const dateKey = s.paidAt.split('T')[0];
        if (days[dateKey]) {
          days[dateKey].amount += s.amount;
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
  }
}

export const db = new Database();
