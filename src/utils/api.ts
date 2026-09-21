import type {
  AccessTokenRecord,
  AppSettings,
  Customer,
  DashboardStats,
  PaymentSession,
  Resource,
  SecurityEvent,
} from '../types';
import { localFallback } from './localFallback';

async function safeFetchJson(url: string, options?: RequestInit): Promise<any> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
      throw new Error(`HTTP ${res.status}: Not valid JSON or endpoint not found`);
    }
    return await res.json();
  } catch (err) {
    // Backend not responding or static hosting (like GitHub Pages)
    return null;
  }
}

export const api = {
  // Resources
  async getResources(): Promise<Resource[]> {
    const data = await safeFetchJson('/api/resources');
    if (data && data.resources) {
      return data.resources;
    }
    return localFallback.getResources();
  },

  async getResource(id: string): Promise<Resource | null> {
    const data = await safeFetchJson(`/api/resources/${id}`);
    if (data && data.resource) {
      return data.resource;
    }
    return localFallback.getResources().find((r) => r.id === id) || null;
  },

  async saveResource(resource: Partial<Resource>): Promise<Resource> {
    const isNew = !resource.id || resource.id.startsWith('temp_');
    const url = isNew ? '/api/resources' : `/api/resources/${resource.id}`;
    const method = isNew ? 'POST' : 'PUT';

    const data = await safeFetchJson(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resource),
    });

    if (data && data.resource) {
      return data.resource;
    }
    return localFallback.saveResource(resource);
  },

  async deleteResource(id: string): Promise<boolean> {
    const data = await safeFetchJson(`/api/resources/${id}`, { method: 'DELETE' });
    if (data !== null) {
      return true;
    }
    return localFallback.deleteResource(id);
  },

  async syncGithubResource(id: string): Promise<any> {
    const data = await safeFetchJson(`/api/resources/${id}/sync-github`, { method: 'POST' });
    if (data !== null) {
      return data;
    }
    return { success: true, message: 'Resource cache purged and synced with GitHub', syncedAt: new Date().toISOString() };
  },

  // Payment
  async createPaymentSession(payload: {
    resourceId: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    paymentMethod?: string;
  }): Promise<{ session: PaymentSession; paymentUrl: string }> {
    const data = await safeFetchJson('/api/payment/create-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (data && data.session) {
      return data;
    }
    return localFallback.createPaymentSession(payload);
  },

  async getPaymentSession(id: string): Promise<{ session: PaymentSession; resource: Partial<Resource> | null }> {
    const data = await safeFetchJson(`/api/payment/session/${id}`);
    if (data && data.session) {
      return data;
    }
    const session = localFallback.getTransactions().find((s) => s.id === id);
    if (!session) throw new Error('Session not found');
    const resource = localFallback.getResources().find((r) => r.id === session.resourceId) || null;
    return { session, resource };
  },

  async simulateGatewayWebhook(sessionId: string, paymentMethod?: string): Promise<any> {
    const data = await safeFetchJson('/api/payment/simulate-gateway-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, paymentMethod }),
    });

    if (data && data.session) {
      return data;
    }
    return localFallback.simulateGatewayWebhook(sessionId, paymentMethod);
  },

  async confirmUpiPayment(params: {
    sessionId: string;
    utrNumber?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
  }): Promise<any> {
    const data = await safeFetchJson('/api/payment/confirm-upi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (data && data.session) {
      return data;
    }
    return localFallback.confirmUpiPayment(params);
  },

  async recordDirectPayment(params: {
    resourceId?: string;
    amount?: number;
    currency?: string;
    utrNumber?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    paymentMethod?: string;
  }): Promise<any> {
    const data = await safeFetchJson('/api/payment/record-direct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (data && data.session) {
      return data;
    }
    return localFallback.confirmUpiPayment({
      sessionId: 'sess_direct_' + Date.now(),
      utrNumber: params.utrNumber,
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      customerPhone: params.customerPhone,
    });
  },

  // Transactions
  async getTransactions(): Promise<PaymentSession[]> {
    const data = await safeFetchJson('/api/transactions');
    if (data && data.transactions) {
      return data.transactions;
    }
    return localFallback.getTransactions();
  },

  // Tokens
  async getTokens(): Promise<AccessTokenRecord[]> {
    const data = await safeFetchJson('/api/tokens');
    if (data && data.tokens) {
      return data.tokens;
    }
    return localFallback.getTokens();
  },

  async revokeToken(id: string, reason?: string): Promise<boolean> {
    const data = await safeFetchJson(`/api/tokens/${id}/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (data !== null) return true;
    return localFallback.revokeToken(id);
  },

  async expireToken(id: string): Promise<boolean> {
    const data = await safeFetchJson(`/api/tokens/${id}/expire`, {
      method: 'POST',
    });
    if (data !== null) return true;
    return localFallback.expireToken(id);
  },

  async inspectToken(token: string): Promise<any> {
    const data = await safeFetchJson(`/api/access/inspect/${encodeURIComponent(token)}`);
    if (data !== null) return data;
    return localFallback.inspectToken(token);
  },

  async validateAndConsumeToken(token: string): Promise<any> {
    const data = await safeFetchJson(`/api/access/consume/${encodeURIComponent(token)}`, {
      method: 'POST',
    });
    if (data !== null) return data;
    return localFallback.validateAndConsumeToken(token);
  },

  // Customers
  async getCustomers(): Promise<Customer[]> {
    const data = await safeFetchJson('/api/customers');
    if (data && data.customers) {
      return data.customers;
    }
    return localFallback.getCustomers();
  },

  async deleteCustomer(id: string): Promise<boolean> {
    const data = await safeFetchJson(`/api/customers/${id}`, { method: 'DELETE' });
    if (data !== null) return true;
    return localFallback.deleteCustomer(id);
  },

  // Security & Audit
  async getSecurityEvents(): Promise<SecurityEvent[]> {
    const data = await safeFetchJson('/api/security/events');
    if (data && data.events) {
      return data.events;
    }
    return localFallback.getSecurityEvents();
  },

  async getAuditLogs(): Promise<any[]> {
    const data = await safeFetchJson('/api/security/audit-logs');
    if (data && data.logs) {
      return data.logs;
    }
    return localFallback.getAuditLogs();
  },

  // Dashboard Stats
  async getDashboardStats(): Promise<DashboardStats> {
    const data = await safeFetchJson('/api/dashboard/stats');
    if (data && data.stats) {
      return data.stats;
    }
    return localFallback.getDashboardStats();
  },

  // Settings
  async getSettings(): Promise<AppSettings> {
    const data = await safeFetchJson('/api/settings');
    if (data && data.settings) {
      return data.settings;
    }
    return localFallback.getSettings();
  },

  async updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const data = await safeFetchJson('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (data && data.settings) {
      return data.settings;
    }
    return localFallback.updateSettings(settings);
  },
};
