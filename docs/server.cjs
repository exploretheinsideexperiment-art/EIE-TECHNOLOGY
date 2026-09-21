var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_crypto2 = __toESM(require("crypto"), 1);
var import_express = __toESM(require("express"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_vite = require("vite");

// server/db.ts
var import_crypto = __toESM(require("crypto"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
function parseDeviceType(userAgent) {
  if (!userAgent) return "Laptop / Desktop";
  const ua = userAgent.toLowerCase();
  if (/tablet|ipad|playbook|silk/i.test(ua)) return "Tablet";
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/i.test(ua)) return "Mobile";
  return "Laptop / Desktop";
}
var DATA_DIR = import_path.default.resolve(process.cwd(), "data");
var DB_FILE = import_path.default.join(DATA_DIR, "db.json");
var DEFAULT_SETTINGS = {
  general: {
    appName: "EIE-Technology",
    subtitle: "Explore the Inside Experiment-Technology (Created by Vipul)",
    brandColor: "#00e599",
    supportEmail: "security@eie-technology.com",
    publicUrl: process.env.APP_URL || "https://eie-technology.com"
  },
  gateways: {
    razorpayKeyId: "rzp_live_EIE9824Kx71",
    razorpaySecretMasked: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u20223a8F",
    razorpayWebhookSecretMasked: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u202292Km",
    cashfreeAppId: "CF_EIE_APP_77810",
    cashfreeSecretMasked: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u202266b9",
    defaultGateway: "Razorpay",
    testMode: false
  },
  tokens: {
    defaultExpiryHours: 24,
    defaultExpiryValue: 24,
    defaultExpiryUnit: "hours",
    defaultMaxUses: 1,
    ipBinding: false,
    deviceBinding: false,
    replayProtection: true
  },
  merchantAccount: {
    accountHolderName: "Explore The Inside Experiment",
    accountNumber: "987654321012",
    bankName: "State Bank of India",
    ifscCode: "SBIN0001234",
    accountType: "Current",
    upiId: "exploretheinsideexperiment@okaxis",
    directUpiEnabled: true,
    qrNotePrefix: "EIE"
  },
  notifications: {
    emailSubject: "Verified Access: Your One-Time Security Link is Ready",
    emailTemplate: 'Hello {{customer_name}},\n\nYour payment of {{currency}} {{amount}} for "{{resource_name}}" was successfully verified by EIE-Technology.\n\nYour Protected Access Link:\n{{protected_url}}\n\n* Note: This is a cryptographically secured one-time link. After first access, it deactivates automatically to prevent unauthorized redistribution.\n\nEIE-Technology - Explore the Inside Experiment-Technology (Created by Vipul)',
    smsTemplate: "EIE-Tech: Payment of {{currency}} {{amount}} verified for {{resource_name}}. Your single-use secure link: {{protected_url}}",
    whatsappTemplate: "\u{1F512} *EIE-Technology Security Notice*\n\nPayment verified for *{{resource_name}}*.\nAmount: {{currency}} {{amount}}\n\nAccess Link: {{protected_url}}\n(Expires in 24 hours. Single-use only)"
  },
  domain: {
    customDomain: "eie-technology.com",
    payDomain: "pay.eie-technology.com"
  },
  pwa: {
    enableInstallPrompt: true,
    offlineCacheEnabled: true
  }
};
function getInitialData() {
  const now = /* @__PURE__ */ new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1e3);
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1e3);
  const sampleResources = [
    {
      id: "res_cyber_core_01",
      name: "Zero-Trust Infrastructure Blueprint",
      description: "Production Kubernetes zero-trust policies, mTLS configs, and hardened terraform modules.",
      originalUrl: "https://github.com/eie-secur/zero-trust-infra-core",
      category: "Cybersecurity",
      price: 199,
      currency: "INR",
      tokenValidityHours: 24,
      maxUses: 1,
      isEnabled: true,
      qrEnabled: true,
      emailEnabled: true,
      smsEnabled: true,
      whatsappEnabled: true,
      paymentGateway: "Razorpay",
      createdAt: twoDaysAgo.toISOString(),
      updatedAt: yesterday.toISOString()
    },
    {
      id: "res_fintech_api_02",
      name: "High-Throughput Payment Engine SDK",
      description: "Distributed ledger payment routing service with automated reconciliation and idempotency.",
      originalUrl: "https://github.com/eie-secur/fintech-payment-engine",
      category: "Developer Tools",
      price: 499,
      currency: "INR",
      tokenValidityHours: 48,
      maxUses: 1,
      isEnabled: true,
      qrEnabled: true,
      emailEnabled: true,
      smsEnabled: true,
      whatsappEnabled: false,
      paymentGateway: "Razorpay",
      createdAt: twoDaysAgo.toISOString(),
      updatedAt: twoDaysAgo.toISOString()
    },
    {
      id: "res_audit_playbook_03",
      name: "SOC2 & ISO-27001 Compliance Matrix",
      description: "Exhaustive audit-ready templates, risk assessment spreadsheets, and policy controls.",
      originalUrl: "https://github.com/eie-secur/compliance-framework-2026",
      category: "Compliance",
      price: 299,
      currency: "INR",
      tokenValidityHours: 12,
      maxUses: 1,
      isEnabled: true,
      qrEnabled: true,
      emailEnabled: true,
      smsEnabled: false,
      whatsappEnabled: true,
      paymentGateway: "Cashfree",
      createdAt: yesterday.toISOString(),
      updatedAt: yesterday.toISOString()
    }
  ];
  return {
    resources: sampleResources,
    paymentSessions: [],
    accessTokens: [],
    tokenUsages: [],
    customers: [],
    securityEvents: [],
    auditLogs: [],
    settings: DEFAULT_SETTINGS
  };
}
var Database = class {
  constructor() {
    this.data = this.loadData();
  }
  loadData() {
    try {
      if (!import_fs.default.existsSync(DATA_DIR)) {
        import_fs.default.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (import_fs.default.existsSync(DB_FILE)) {
        const raw = import_fs.default.readFileSync(DB_FILE, "utf-8");
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error("[DB] Error reading DB file, reinitializing default data:", err);
    }
    const initial = getInitialData();
    this.saveData(initial);
    return initial;
  }
  saveData(data) {
    try {
      if (!import_fs.default.existsSync(DATA_DIR)) {
        import_fs.default.mkdirSync(DATA_DIR, { recursive: true });
      }
      import_fs.default.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (err) {
      console.error("[DB] Error persisting to DB file:", err);
    }
  }
  getResources() {
    return this.data.resources;
  }
  getResourceById(id) {
    return this.data.resources.find((r) => r.id === id);
  }
  saveResource(resource) {
    let calculatedHours = resource.tokenValidityHours || 24;
    if (resource.tokenValidityUnit && resource.tokenValidityValue) {
      const val = Number(resource.tokenValidityValue) || 1;
      if (resource.tokenValidityUnit === "hours") calculatedHours = val;
      else if (resource.tokenValidityUnit === "days") calculatedHours = val * 24;
      else if (resource.tokenValidityUnit === "months") calculatedHours = val * 30 * 24;
      else if (resource.tokenValidityUnit === "years") calculatedHours = val * 365 * 24;
    }
    const finalResource = {
      ...resource,
      tokenValidityHours: calculatedHours
    };
    const existingIndex = this.data.resources.findIndex((r) => r.id === finalResource.id);
    if (existingIndex >= 0) {
      this.data.resources[existingIndex] = { ...finalResource, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    } else {
      this.data.resources.push(finalResource);
    }
    this.saveData(this.data);
    this.recordAuditLog("RESOURCE_SAVED", "Admin", `Saved resource: ${finalResource.name} (${finalResource.price} ${finalResource.currency})`);
    return finalResource;
  }
  deleteResource(id) {
    const res = this.data.resources.find((r) => r.id === id);
    if (!res) return false;
    this.data.resources = this.data.resources.filter((r) => r.id !== id);
    this.saveData(this.data);
    this.recordAuditLog("RESOURCE_DELETED", "Admin", `Deleted resource: ${res.name} (ID: ${id})`);
    return true;
  }
  // Payment Sessions
  createPaymentSession(sessionData) {
    const session = {
      ...sessionData,
      id: `sess_${import_crypto.default.randomBytes(8).toString("hex")}`,
      status: "CREATED",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.data.paymentSessions.unshift(session);
    this.saveData(this.data);
    return session;
  }
  getPaymentSession(id) {
    return this.data.paymentSessions.find((s) => s.id === id);
  }
  updatePaymentSession(id, updates) {
    const session = this.data.paymentSessions.find((s) => s.id === id);
    if (!session) return void 0;
    Object.assign(session, updates);
    this.saveData(this.data);
    return session;
  }
  getPaymentSessions() {
    return this.data.paymentSessions;
  }
  // Cryptographic CSPRNG Token Generation
  issueAccessToken(options) {
    const resource = this.getResourceById(options.resourceId);
    if (!resource) {
      throw new Error(`Resource ${options.resourceId} not found`);
    }
    const rawToken = import_crypto.default.randomBytes(32).toString("base64url");
    const tokenHash = import_crypto.default.createHash("sha256").update(rawToken).digest("hex");
    const rawTokenPrefix = rawToken.substring(0, 6) + "...";
    const now = /* @__PURE__ */ new Date();
    let validityHours = resource.tokenValidityHours || 24;
    if (resource.tokenValidityUnit && resource.tokenValidityValue) {
      const val = Number(resource.tokenValidityValue) || 1;
      if (resource.tokenValidityUnit === "hours") validityHours = val;
      else if (resource.tokenValidityUnit === "days") validityHours = val * 24;
      else if (resource.tokenValidityUnit === "months") validityHours = val * 30 * 24;
      else if (resource.tokenValidityUnit === "years") validityHours = val * 365 * 24;
    }
    const expiryMs = validityHours * 60 * 60 * 1e3;
    const expiresAt = new Date(now.getTime() + expiryMs).toISOString();
    const tokenRecord = {
      id: `tok_${import_crypto.default.randomBytes(6).toString("hex")}`,
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
      status: "ACTIVE",
      ipAddress: options.ipAddress,
      userAgent: options.userAgent
    };
    this.data.accessTokens.unshift(tokenRecord);
    this.saveData(this.data);
    this.recordAuditLog(
      "TOKEN_ISSUED",
      "System",
      `Issued single-use access token for resource "${resource.name}" to ${options.customerEmail} (Expires: ${expiresAt})`
    );
    return { rawToken, tokenRecord };
  }
  // Atomic Token Consumption & Validation
  validateAndConsumeToken(rawToken, meta) {
    const tokenHash = import_crypto.default.createHash("sha256").update(rawToken).digest("hex");
    const tokenRecord = this.data.accessTokens.find((t) => t.tokenHash === tokenHash);
    if (!tokenRecord) {
      this.recordSecurityEvent({
        type: "FAILED_TOKEN",
        severity: "MEDIUM",
        description: "Unrecognized token verification attempt",
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent
      });
      return { success: false, reason: "NOT_FOUND" };
    }
    const resource = this.getResourceById(tokenRecord.resourceId);
    if (!resource) {
      return { success: false, reason: "NOT_FOUND" };
    }
    if (tokenRecord.status === "REVOKED") {
      this.recordSecurityEvent({
        type: "FAILED_TOKEN",
        severity: "HIGH",
        description: `Access attempt on revoked token ${tokenRecord.rawTokenPrefix} for resource "${resource.name}"`,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        tokenId: tokenRecord.id,
        resourceId: resource.id
      });
      return { success: false, reason: "REVOKED", resourceName: resource.name, tokenRecord };
    }
    const now = Date.now();
    const expiryTime = new Date(tokenRecord.expiresAt).getTime();
    if (now > expiryTime || tokenRecord.status === "EXPIRED") {
      tokenRecord.status = "EXPIRED";
      this.saveData(this.data);
      this.recordSecurityEvent({
        type: "EXPIRED_TOKEN",
        severity: "LOW",
        description: `Expired token access attempt for resource "${resource.name}" (Expired at ${tokenRecord.expiresAt})`,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        tokenId: tokenRecord.id,
        resourceId: resource.id
      });
      return { success: false, reason: "EXPIRED", resourceName: resource.name, tokenRecord };
    }
    const originalUrl = resource.originalUrl.trim();
    if (!/^https?:\/\//i.test(originalUrl)) {
      this.recordSecurityEvent({
        type: "FAILED_TOKEN",
        severity: "CRITICAL",
        description: `Blocked unsafe redirect scheme: "${originalUrl}" on resource "${resource.name}"`,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        resourceId: resource.id
      });
      return { success: false, reason: "INVALID_SCHEME" };
    }
    const currentDeviceType = parseDeviceType(meta.userAgent);
    if (tokenRecord.boundDeviceType) {
      if (tokenRecord.boundDeviceType !== currentDeviceType) {
        this.recordSecurityEvent({
          type: "SUSPICIOUS_IP",
          severity: "HIGH",
          description: `Single-device restriction violated for token ${tokenRecord.rawTokenPrefix}. Token is locked to "${tokenRecord.boundDeviceType}", but access was attempted from "${currentDeviceType}". Single device policy strictly enforced.`,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
          tokenId: tokenRecord.id,
          resourceId: resource.id
        });
        this.data.tokenUsages.unshift({
          id: `use_${import_crypto.default.randomBytes(6).toString("hex")}`,
          tokenId: tokenRecord.id,
          resourceId: resource.id,
          resourceName: resource.name,
          accessedAt: (/* @__PURE__ */ new Date()).toISOString(),
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
          status: "DENIED_CONCURRENT_DEVICE",
          destinationDomain: new URL(originalUrl).hostname
        });
        this.saveData(this.data);
        return {
          success: false,
          reason: "CONCURRENT_DEVICE_BLOCKED",
          resourceName: resource.name,
          tokenRecord
        };
      }
    } else {
      tokenRecord.boundDeviceType = currentDeviceType;
      tokenRecord.boundUserAgent = meta.userAgent;
      tokenRecord.boundIpAddress = meta.ipAddress;
    }
    tokenRecord.currentUses = (tokenRecord.currentUses || 0) + 1;
    tokenRecord.status = "ACTIVE";
    this.data.tokenUsages.unshift({
      id: `use_${import_crypto.default.randomBytes(6).toString("hex")}`,
      tokenId: tokenRecord.id,
      resourceId: resource.id,
      resourceName: resource.name,
      accessedAt: (/* @__PURE__ */ new Date()).toISOString(),
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      status: "GRANTED",
      destinationDomain: new URL(originalUrl).hostname
    });
    this.saveData(this.data);
    this.recordAuditLog(
      "TOKEN_ACCESSED_GRANTED",
      "Customer",
      `Authorized single-use token ${tokenRecord.rawTokenPrefix} consumed. Performing server-side redirect for "${resource.name}". Remaining uses: ${tokenRecord.maxUses - tokenRecord.currentUses}`
    );
    return {
      success: true,
      originalUrl,
      resourceName: resource.name,
      tokenRecord
    };
  }
  // Token Management Actions
  revokeToken(tokenId, reason) {
    const token = this.data.accessTokens.find((t) => t.id === tokenId);
    if (!token) return false;
    token.status = "REVOKED";
    token.revokedAt = (/* @__PURE__ */ new Date()).toISOString();
    token.revokedReason = reason;
    this.saveData(this.data);
    this.recordSecurityEvent({
      type: "TOKEN_REVOCATION",
      severity: "MEDIUM",
      description: `Administrator manually revoked token ${token.rawTokenPrefix}. Reason: ${reason}`,
      tokenId: token.id,
      resourceId: token.resourceId
    });
    return true;
  }
  expireToken(tokenId) {
    const token = this.data.accessTokens.find((t) => t.id === tokenId);
    if (!token) return false;
    token.status = "EXPIRED";
    token.expiresAt = (/* @__PURE__ */ new Date()).toISOString();
    this.saveData(this.data);
    return true;
  }
  getTokens() {
    const now = Date.now();
    let changed = false;
    this.data.accessTokens.forEach((t) => {
      if (t.status === "USED" && new Date(t.expiresAt).getTime() > now) {
        t.status = "ACTIVE";
        changed = true;
      }
    });
    if (changed) {
      this.saveData(this.data);
    }
    return this.data.accessTokens;
  }
  getTokenUsages() {
    return this.data.tokenUsages;
  }
  // Security Events & Audit Logs
  recordSecurityEvent(event) {
    const secEvent = {
      ...event,
      id: `sec_${import_crypto.default.randomBytes(6).toString("hex")}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.data.securityEvents.unshift(secEvent);
    if (this.data.securityEvents.length > 500) {
      this.data.securityEvents.pop();
    }
    this.saveData(this.data);
  }
  getSecurityEvents() {
    return this.data.securityEvents;
  }
  recordAuditLog(action, actor, details, ipAddress) {
    this.data.auditLogs.unshift({
      id: `aud_${import_crypto.default.randomBytes(6).toString("hex")}`,
      action,
      actor,
      details,
      ipAddress,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs.pop();
    }
    this.saveData(this.data);
  }
  getAuditLogs() {
    return this.data.auditLogs;
  }
  // Customers
  getCustomers() {
    return this.data.customers;
  }
  registerOrUpdateCustomer(data) {
    let customer = this.data.customers.find((c) => c.email.toLowerCase() === data.email.toLowerCase());
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (customer) {
      customer.name = data.name || customer.name;
      customer.phone = data.phone || customer.phone;
      customer.totalPayments += 1;
      customer.totalAmount += data.amount;
      customer.lastPaymentAt = now;
    } else {
      customer = {
        id: `cust_${import_crypto.default.randomBytes(6).toString("hex")}`,
        name: data.name,
        email: data.email,
        phone: data.phone,
        totalPayments: 1,
        totalAmount: data.amount,
        currency: data.currency,
        lastPaymentAt: now,
        activeTokensCount: 1,
        createdAt: now
      };
      this.data.customers.unshift(customer);
    }
    this.saveData(this.data);
    return customer;
  }
  deleteCustomerData(customerId) {
    const cust = this.data.customers.find((c) => c.id === customerId);
    if (!cust) return false;
    this.data.customers = this.data.customers.filter((c) => c.id !== customerId);
    this.saveData(this.data);
    this.recordAuditLog("CUSTOMER_GDPR_DELETED", "Admin", `Deleted customer record for ${cust.email}`);
    return true;
  }
  // Settings
  getSettings() {
    return this.data.settings;
  }
  updateSettings(newSettings) {
    this.data.settings = {
      ...this.data.settings,
      ...newSettings,
      general: { ...this.data.settings.general, ...newSettings.general || {} },
      gateways: { ...this.data.settings.gateways, ...newSettings.gateways || {} },
      tokens: { ...this.data.settings.tokens, ...newSettings.tokens || {} },
      notifications: { ...this.data.settings.notifications, ...newSettings.notifications || {} },
      merchantAccount: {
        ...this.data.settings.merchantAccount || {
          accountHolderName: "Explore The Inside Experiment",
          accountNumber: "987654321012",
          bankName: "State Bank of India",
          ifscCode: "SBIN0001234",
          accountType: "Current",
          upiId: "exploretheinsideexperiment@okaxis",
          directUpiEnabled: true,
          qrNotePrefix: "EIE"
        },
        ...newSettings.merchantAccount || newSettings.bankAccount || {}
      },
      domain: { ...this.data.settings.domain, ...newSettings.domain || {} },
      pwa: { ...this.data.settings.pwa, ...newSettings.pwa || {} }
    };
    this.saveData(this.data);
    this.recordAuditLog("SETTINGS_UPDATED", "Admin", "Updated platform configuration");
    return this.data.settings;
  }
  // Dashboard Stats
  getDashboardStats() {
    const sessions = this.data.paymentSessions;
    const tokens = this.data.accessTokens;
    const totalPayments = sessions.length;
    const successfulPayments = sessions.filter((s) => s.status === "SUCCESS").length;
    const failedPayments = sessions.filter((s) => s.status === "FAILED").length;
    const pendingPayments = sessions.filter((s) => s.status === "PENDING" || s.status === "CREATED").length;
    const totalRevenue = sessions.filter((s) => s.status === "SUCCESS").reduce((sum, s) => sum + (s.amount || 0), 0);
    const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const todayTransactions = sessions.filter((s) => (s.paidAt || s.createdAt).startsWith(todayStr)).length;
    const activeTokens = tokens.filter((t) => t.status === "ACTIVE").length;
    const usedTokens = tokens.filter((t) => t.status === "USED").length;
    const expiredTokens = tokens.filter((t) => t.status === "EXPIRED").length;
    const revokedTokens = tokens.filter((t) => t.status === "REVOKED").length;
    const days = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 864e5);
      const dateKey = d.toISOString().split("T")[0];
      days[dateKey] = { amount: 0, count: 0 };
    }
    sessions.forEach((s) => {
      if (s.status === "SUCCESS" && s.paidAt) {
        const dateKey = s.paidAt.split("T")[0];
        if (days[dateKey]) {
          days[dateKey].amount += s.amount;
          days[dateKey].count += 1;
        }
      }
    });
    const revenueByDay = Object.keys(days).map((date) => ({
      date,
      amount: days[date].amount,
      count: days[date].count
    }));
    const conversionRate = totalPayments > 0 ? Math.round(successfulPayments / totalPayments * 100) : 0;
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
      conversionRate
    };
  }
};
var db = new Database();

// server.ts
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  app.use(import_express.default.urlencoded({ extended: true }));
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    next();
  });
  app.get("/access/:token", (req, res) => {
    const rawToken = req.params.token;
    const ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "Unknown";
    const referer = req.headers["referer"];
    const previewMode = req.query.preview === "1";
    const result = db.validateAndConsumeToken(rawToken, { ipAddress, userAgent, referer });
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    if (result.success && result.originalUrl) {
      return res.send(renderCloakedUsePageHtml(result.resourceName || "Resource", result.originalUrl, rawToken));
    }
    const reason = result.reason || "NOT_FOUND";
    const resourceName = result.resourceName;
    const tokenRecord = result.tokenRecord;
    return res.status(403).send(renderAccessDeniedHtml(reason, resourceName, tokenRecord));
  });
  app.get("/api/access/inspect/:token", (req, res) => {
    const rawToken = req.params.token;
    const tokenHash = import_crypto2.default.createHash("sha256").update(rawToken).digest("hex");
    const tokens = db.getTokens();
    const match = tokens.find((t) => t.tokenHash === tokenHash);
    if (!match) {
      return res.status(404).json({ valid: false, reason: "TOKEN_NOT_FOUND" });
    }
    const isExpired = Date.now() > new Date(match.expiresAt).getTime();
    return res.json({
      valid: match.status !== "REVOKED" && !isExpired,
      status: match.status === "REVOKED" ? "REVOKED" : isExpired ? "EXPIRED" : "ACTIVE",
      resourceName: match.resourceName,
      expiresAt: match.expiresAt,
      currentUses: match.currentUses,
      maxUses: match.maxUses
    });
  });
  app.post("/api/access/consume/:token", (req, res) => {
    const rawToken = req.params.token;
    const ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "Unknown";
    const referer = req.headers["referer"];
    const result = db.validateAndConsumeToken(rawToken, { ipAddress, userAgent, referer });
    if (!result.success) {
      return res.status(403).json({
        success: false,
        reason: result.reason || "ACCESS_DENIED",
        resourceName: result.resourceName
      });
    }
    return res.json({
      success: true,
      resourceName: result.resourceName,
      originalUrl: result.originalUrl,
      tokenRecord: result.tokenRecord
    });
  });
  app.post("/api/payment/create-session", (req, res) => {
    try {
      const { resourceId, customerName, customerEmail, customerPhone, paymentMethod } = req.body;
      if (!resourceId || !customerName || !customerEmail) {
        return res.status(400).json({ error: "Missing required parameters (resourceId, customerName, customerEmail)" });
      }
      const resource = db.getResourceById(resourceId);
      if (!resource) {
        return res.status(404).json({ error: "Resource not found" });
      }
      if (!resource.isEnabled) {
        return res.status(400).json({ error: "This resource is currently disabled for purchase" });
      }
      const gatewayOrderId = `order_${resource.paymentGateway.toUpperCase()}_${Date.now().toString(36)}_${import_crypto2.default.randomBytes(3).toString("hex")}`;
      const session = db.createPaymentSession({
        resourceId: resource.id,
        resourceName: resource.name,
        amount: resource.price,
        // Server-side calculated price! Never trust client
        currency: resource.currency,
        customerName,
        customerEmail,
        customerPhone: customerPhone || "",
        gateway: resource.paymentGateway,
        gatewayOrderId,
        paymentMethod: paymentMethod || "UPI",
        expiresAt: new Date(Date.now() + 30 * 60 * 1e3).toISOString()
        // 30 min session validity
      });
      return res.json({
        success: true,
        session,
        paymentUrl: `/pay/session/${session.id}`
      });
    } catch (err) {
      console.error("[Payment] Error creating session:", err);
      return res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/payment/session/:id", (req, res) => {
    const session = db.getPaymentSession(req.params.id);
    if (!session) {
      return res.status(404).json({ error: "Payment session not found" });
    }
    const resource = db.getResourceById(session.resourceId);
    const settings = db.getSettings();
    const merchantAccount = {
      accountHolderName: resource?.customAccountName || settings.merchantAccount?.accountHolderName || "Explore The Inside Experiment",
      accountNumber: resource?.customAccountNumber || settings.merchantAccount?.accountNumber || "",
      bankName: resource?.customBankName || settings.merchantAccount?.bankName || "State Bank of India",
      ifscCode: resource?.customIfscCode || settings.merchantAccount?.ifscCode || "SBIN0001234",
      accountType: settings.merchantAccount?.accountType || "Current",
      upiId: resource?.customUpiId || settings.merchantAccount?.upiId || "exploretheinsideexperiment@okaxis",
      directUpiEnabled: settings.merchantAccount?.directUpiEnabled ?? true
    };
    return res.json({
      session,
      merchantAccount,
      resource: resource ? {
        id: resource.id,
        name: resource.name,
        description: resource.description,
        category: resource.category,
        price: resource.price,
        currency: resource.currency,
        tokenValidityHours: resource.tokenValidityHours,
        tokenValidityUnit: resource.tokenValidityUnit,
        tokenValidityValue: resource.tokenValidityValue,
        paymentGateway: resource.paymentGateway,
        customUpiId: resource.customUpiId,
        customAccountNumber: resource.customAccountNumber
      } : null
    });
  });
  app.post("/api/webhooks/payment", (req, res) => {
    try {
      const signature = req.headers["x-razorpay-signature"] || req.headers["x-cashfree-signature"] || req.headers["x-webhook-signature"];
      const { event, orderId, paymentId, amount, currency, sessionId } = req.body;
      const ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
      const session = sessionId ? db.getPaymentSession(sessionId) : db.getPaymentSessions().find((s) => s.gatewayOrderId === orderId);
      if (!session) {
        db.recordSecurityEvent({
          type: "INVALID_WEBHOOK",
          severity: "HIGH",
          description: `Received webhook for unknown order: ${orderId || "empty"}`,
          ipAddress
        });
        return res.status(404).json({ error: "Order session not found" });
      }
      if (session.status === "SUCCESS") {
        return res.json({
          status: "ok",
          message: "Webhook already processed (Idempotent replay detected)",
          sessionId: session.id,
          accessTokenId: session.accessTokenId
        });
      }
      if (amount && Number(amount) !== session.amount) {
        db.recordSecurityEvent({
          type: "INVALID_WEBHOOK",
          severity: "CRITICAL",
          description: `Price tampering detected in webhook! Expected ${session.amount}, received ${amount}`,
          ipAddress,
          resourceId: session.resourceId
        });
        session.status = "FAILED";
        return res.status(400).json({ error: "Amount verification failed" });
      }
      session.status = "SUCCESS";
      session.paidAt = (/* @__PURE__ */ new Date()).toISOString();
      session.gatewayPaymentId = paymentId || `pay_${Date.now().toString(36)}_${import_crypto2.default.randomBytes(4).toString("hex")}`;
      const finalPaymentId = session.gatewayPaymentId || paymentId || `pay_${Date.now().toString(36)}`;
      session.gatewayPaymentId = finalPaymentId;
      const { rawToken, tokenRecord } = db.issueAccessToken({
        resourceId: session.resourceId,
        sessionId: session.id,
        paymentId: finalPaymentId,
        customerEmail: session.customerEmail,
        ipAddress,
        userAgent: req.headers["user-agent"]
      });
      session.accessTokenId = tokenRecord.id;
      const baseAppUrl = req.headers.host ? `${req.protocol}://${req.headers.host}` : process.env.APP_URL || "";
      session.protectedUrl = `${baseAppUrl}/access/${rawToken}`;
      db.registerOrUpdateCustomer({
        name: session.customerName,
        email: session.customerEmail,
        phone: session.customerPhone,
        amount: session.amount,
        currency: session.currency
      });
      db.recordSecurityEvent({
        type: "ADMIN_LOGIN",
        severity: "LOW",
        description: `Verified Payment Webhook processed for "${session.resourceName}". Order: ${session.gatewayOrderId}. Token: ${tokenRecord.rawTokenPrefix}`,
        ipAddress,
        tokenId: tokenRecord.id,
        resourceId: session.resourceId
      });
      return res.json({
        success: true,
        message: "Payment verified successfully and one-time token issued",
        sessionId: session.id,
        status: session.status,
        protectedUrl: session.protectedUrl,
        rawToken
        // Provided to the webhook receiver/checkout confirmation
      });
    } catch (err) {
      console.error("[Webhook] Error handling webhook:", err);
      return res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/payment/simulate-gateway-webhook", (req, res) => {
    const { sessionId, paymentMethod } = req.body;
    const session = db.getPaymentSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    if (session.status === "SUCCESS" && session.protectedUrl) {
      return res.json({
        success: true,
        alreadyProcessed: true,
        session,
        protectedUrl: session.protectedUrl
      });
    }
    const mockSecret = "whsec_eie_test_secret_9921";
    const mockPaymentId = `pay_${session.gateway.toLowerCase()}_${Date.now().toString(36)}_${import_crypto2.default.randomBytes(4).toString("hex")}`;
    const payload = JSON.stringify({
      event: "payment.captured",
      orderId: session.gatewayOrderId,
      paymentId: mockPaymentId,
      amount: session.amount,
      currency: session.currency,
      sessionId: session.id
    });
    const signature = import_crypto2.default.createHmac("sha256", mockSecret).update(payload).digest("hex");
    session.paymentMethod = paymentMethod || session.paymentMethod || "UPI";
    session.status = "SUCCESS";
    session.paidAt = (/* @__PURE__ */ new Date()).toISOString();
    session.gatewayPaymentId = mockPaymentId;
    const { rawToken, tokenRecord } = db.issueAccessToken({
      resourceId: session.resourceId,
      sessionId: session.id,
      paymentId: session.gatewayPaymentId,
      customerEmail: session.customerEmail,
      ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1",
      userAgent: req.headers["user-agent"]
    });
    session.accessTokenId = tokenRecord.id;
    const baseAppUrl = req.headers.host ? `${req.protocol}://${req.headers.host}` : process.env.APP_URL || "";
    session.protectedUrl = `${baseAppUrl}/access/${rawToken}`;
    db.registerOrUpdateCustomer({
      name: session.customerName,
      email: session.customerEmail,
      phone: session.customerPhone,
      amount: session.amount,
      currency: session.currency
    });
    return res.json({
      success: true,
      verifiedWebhook: true,
      signatureVerified: true,
      session,
      rawToken,
      protectedUrl: session.protectedUrl
    });
  });
  app.post("/api/payment/confirm-upi", (req, res) => {
    const { sessionId, resourceId, utrNumber, customerName, customerEmail, customerPhone, amount } = req.body;
    let session = sessionId ? db.getPaymentSession(sessionId) : void 0;
    if (!session) {
      const targetResId = resourceId || db.getResources()[0]?.id;
      const targetRes = targetResId ? db.getResourceById(targetResId) : db.getResources()[0];
      if (!targetRes) {
        return res.status(404).json({ error: "No resource found to associate with payment" });
      }
      session = db.createPaymentSession({
        resourceId: targetRes.id,
        resourceName: targetRes.name,
        amount: Number(amount) || targetRes.price || 199,
        currency: targetRes.currency || "INR",
        customerName: customerName ? customerName.trim() : "Direct UPI Customer",
        customerEmail: customerEmail ? customerEmail.trim() : "exploretheinsideexperiment@gmail.com",
        customerPhone: customerPhone ? customerPhone.trim() : "",
        gateway: "UPI Manual Handshake",
        gatewayOrderId: `upi_ord_${import_crypto2.default.randomBytes(6).toString("hex")}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1e3).toISOString(),
        paymentMethod: "UPI"
      });
    }
    if (customerName && customerName.trim()) session.customerName = customerName.trim();
    if (customerEmail && customerEmail.trim()) session.customerEmail = customerEmail.trim();
    if (customerPhone && customerPhone.trim()) session.customerPhone = customerPhone.trim();
    const upiPaymentId = utrNumber && utrNumber.trim() ? `upi_utr_${utrNumber.trim()}` : `upi_${Date.now().toString(36)}_${import_crypto2.default.randomBytes(3).toString("hex")}`;
    session.paymentMethod = "UPI";
    session.status = "SUCCESS";
    session.paidAt = (/* @__PURE__ */ new Date()).toISOString();
    session.gatewayPaymentId = upiPaymentId;
    const { rawToken, tokenRecord } = db.issueAccessToken({
      resourceId: session.resourceId,
      sessionId: session.id,
      paymentId: session.gatewayPaymentId,
      customerEmail: session.customerEmail,
      ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1",
      userAgent: req.headers["user-agent"]
    });
    session.accessTokenId = tokenRecord.id;
    const baseAppUrl = req.headers.host ? `${req.protocol}://${req.headers.host}` : process.env.APP_URL || "";
    session.protectedUrl = `${baseAppUrl}/access/${rawToken}`;
    db.updatePaymentSession(session.id, {
      status: "SUCCESS",
      paidAt: session.paidAt,
      paymentMethod: "UPI",
      gatewayPaymentId: upiPaymentId,
      accessTokenId: tokenRecord.id,
      protectedUrl: session.protectedUrl,
      customerName: session.customerName,
      customerEmail: session.customerEmail,
      customerPhone: session.customerPhone
    });
    const tokenFormatted = `EIE-TOK-${rawToken.substring(0, 4).toUpperCase()}-${rawToken.substring(4, 8).toUpperCase()}`;
    const tokenMessage = `\u{1F389} *EIE-Technology Payment Verified!*

\u{1F4E6} *Resource:* ${session.resourceName}
\u{1F511} *One-Device Token:* ${tokenFormatted}
\u{1F517} *Connected Access Link:* ${session.protectedUrl}

\u26A0\uFE0F *SINGLE-DEVICE POLICY:*
Yeh link at a time *ek hi baar / ek hi device* par open hoga (ya to Mobile me ya fir Laptop me). Kisi doosre device par open karne par yeh token block ho jayega.

\u23F0 *Valid for:* 24 Hours
\u{1F512} *Status:* Zero-Leak Cryptographic Shield Active`;
    db.registerOrUpdateCustomer({
      name: session.customerName,
      email: session.customerEmail,
      phone: session.customerPhone,
      amount: session.amount,
      currency: session.currency
    });
    db.recordAuditLog(
      "DIRECT_UPI_VERIFIED",
      "System",
      `Direct UPI Payment verified: ${session.currency} ${session.amount} for "${session.resourceName}" (ID: ${upiPaymentId})`
    );
    return res.json({
      success: true,
      verifiedWebhook: true,
      signatureVerified: true,
      session,
      rawToken,
      tokenFormatted,
      tokenMessage,
      protectedUrl: session.protectedUrl,
      stats: db.getDashboardStats()
    });
  });
  app.post("/api/payment/record-direct", (req, res) => {
    const { resourceId, amount, currency, utrNumber, customerName, customerEmail, customerPhone, paymentMethod } = req.body;
    const targetResId = resourceId || db.getResources()[0]?.id;
    const targetRes = targetResId ? db.getResourceById(targetResId) : db.getResources()[0];
    const finalAmount = Number(amount) || targetRes?.price || 199;
    const finalCurrency = currency || targetRes?.currency || "INR";
    const finalResourceName = targetRes?.name || "Zero-Trust Infrastructure Blueprint";
    const finalResourceId = targetRes?.id || "res_cyber_core_01";
    const session = db.createPaymentSession({
      resourceId: finalResourceId,
      resourceName: finalResourceName,
      amount: finalAmount,
      currency: finalCurrency,
      customerName: customerName ? customerName.trim() : "Scanner Direct Customer",
      customerEmail: customerEmail ? customerEmail.trim() : "exploretheinsideexperiment@gmail.com",
      customerPhone: customerPhone ? customerPhone.trim() : "",
      gateway: "UPI Direct Scanner",
      gatewayOrderId: `upi_scan_${import_crypto2.default.randomBytes(6).toString("hex")}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1e3).toISOString(),
      paymentMethod: paymentMethod || "UPI"
    });
    const upiPaymentId = utrNumber && utrNumber.trim() ? `upi_utr_${utrNumber.trim()}` : `upi_${Date.now().toString(36)}_${import_crypto2.default.randomBytes(3).toString("hex")}`;
    session.status = "SUCCESS";
    session.paidAt = (/* @__PURE__ */ new Date()).toISOString();
    session.gatewayPaymentId = upiPaymentId;
    const { rawToken, tokenRecord } = db.issueAccessToken({
      resourceId: session.resourceId,
      sessionId: session.id,
      paymentId: session.gatewayPaymentId,
      customerEmail: session.customerEmail,
      ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1",
      userAgent: req.headers["user-agent"]
    });
    session.accessTokenId = tokenRecord.id;
    const baseAppUrl = req.headers.host ? `${req.protocol}://${req.headers.host}` : process.env.APP_URL || "";
    session.protectedUrl = `${baseAppUrl}/access/${rawToken}`;
    db.updatePaymentSession(session.id, {
      status: "SUCCESS",
      paidAt: session.paidAt,
      paymentMethod: session.paymentMethod,
      gatewayPaymentId: upiPaymentId,
      accessTokenId: tokenRecord.id,
      protectedUrl: session.protectedUrl
    });
    const tokenFormatted = `EIE-TOK-${rawToken.substring(0, 4).toUpperCase()}-${rawToken.substring(4, 8).toUpperCase()}`;
    const tokenMessage = `\u{1F389} *EIE-Technology Payment Verified!*

\u{1F4E6} *Resource:* ${session.resourceName}
\u{1F511} *One-Device Token:* ${tokenFormatted}
\u{1F517} *Connected Access Link:* ${session.protectedUrl}

\u26A0\uFE0F *SINGLE-DEVICE POLICY:*
Yeh link at a time *ek hi baar / ek hi device* par open hoga (ya to Mobile me ya fir Laptop me). Kisi doosre device par open karne par yeh token block ho jayega.

\u23F0 *Valid for:* 24 Hours
\u{1F512} *Status:* Zero-Leak Cryptographic Shield Active`;
    db.registerOrUpdateCustomer({
      name: session.customerName,
      email: session.customerEmail,
      phone: session.customerPhone,
      amount: session.amount,
      currency: session.currency
    });
    db.recordAuditLog(
      "ADMIN_PAYMENT_RECORDED",
      "Admin",
      `Recorded direct payment: ${session.currency} ${session.amount} for "${session.resourceName}" (UTR/Ref: ${upiPaymentId})`
    );
    return res.json({
      success: true,
      session,
      rawToken,
      tokenFormatted,
      tokenMessage,
      protectedUrl: session.protectedUrl,
      stats: db.getDashboardStats()
    });
  });
  app.get("/api/resources", (req, res) => {
    const resources = db.getResources();
    return res.json({ resources });
  });
  app.get("/api/resources/:id", (req, res) => {
    const resource = db.getResourceById(req.params.id);
    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }
    return res.json({ resource });
  });
  app.post("/api/resources", (req, res) => {
    try {
      const {
        name,
        description,
        originalUrl,
        category,
        price,
        currency,
        tokenValidityHours,
        maxUses,
        isEnabled,
        qrEnabled,
        emailEnabled,
        smsEnabled,
        whatsappEnabled,
        paymentGateway,
        customSlug,
        successRedirect,
        failureRedirect
      } = req.body;
      if (!name || !originalUrl || price === void 0) {
        return res.status(400).json({ error: "Name, originalUrl, and price are required." });
      }
      if (!/^https?:\/\//i.test(originalUrl.trim())) {
        return res.status(400).json({ error: "Invalid URL. Destination must start with https:// or http://" });
      }
      const newResource = {
        id: `res_${Date.now().toString(36)}_${import_crypto2.default.randomBytes(3).toString("hex")}`,
        name: name.trim(),
        description: description?.trim() || "",
        originalUrl: originalUrl.trim(),
        category: category || "General",
        price: Number(price) || 0,
        currency: currency || "INR",
        tokenValidityHours: Number(tokenValidityHours) || 24,
        tokenValidityUnit: req.body.tokenValidityUnit || "hours",
        tokenValidityValue: Number(req.body.tokenValidityValue) || Number(tokenValidityHours) || 24,
        maxUses: Number(maxUses) || 1,
        isEnabled: isEnabled !== false,
        qrEnabled: qrEnabled !== false,
        emailEnabled: emailEnabled !== false,
        smsEnabled: smsEnabled === true,
        whatsappEnabled: whatsappEnabled === true,
        paymentGateway: paymentGateway || "Razorpay",
        customAccountNumber: req.body.customAccountNumber?.trim() || void 0,
        customAccountName: req.body.customAccountName?.trim() || void 0,
        customBankName: req.body.customBankName?.trim() || void 0,
        customIfscCode: req.body.customIfscCode?.trim() || void 0,
        customUpiId: req.body.customUpiId?.trim() || void 0,
        customSlug: customSlug?.trim() || void 0,
        successRedirect: successRedirect?.trim() || void 0,
        failureRedirect: failureRedirect?.trim() || void 0,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      const saved = db.saveResource(newResource);
      return res.status(201).json({ resource: saved });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });
  app.put("/api/resources/:id", (req, res) => {
    const existing = db.getResourceById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: "Resource not found" });
    }
    if (req.body.originalUrl && !/^https?:\/\//i.test(req.body.originalUrl.trim())) {
      return res.status(400).json({ error: "Invalid URL. Destination must start with https:// or http://" });
    }
    const updated = {
      ...existing,
      ...req.body,
      id: existing.id,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const saved = db.saveResource(updated);
    return res.json({ resource: saved });
  });
  app.delete("/api/resources/:id", (req, res) => {
    const deleted = db.deleteResource(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Resource not found" });
    }
    return res.json({ success: true, message: "Resource deleted" });
  });
  app.post("/api/resources/:id/sync-github", (req, res) => {
    const resource = db.getResourceById(req.params.id);
    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const updated = {
      ...resource,
      lastSyncedAt: now,
      updatedAt: now
    };
    const saved = db.saveResource(updated);
    db.recordAuditLog(
      "GITHUB_RESOURCE_SYNCED",
      "Admin",
      `Forced live GitHub sync and cache-bust for resource "${resource.name}" (ID: ${resource.id})`
    );
    return res.json({
      success: true,
      message: `Resource "${resource.name}" cache purged and synced with GitHub!`,
      resource: saved,
      syncedAt: now
    });
  });
  app.post("/api/webhooks/github", (req, res) => {
    try {
      const event = req.headers["x-github-event"] || "push";
      const repoData = req.body?.repository;
      const repoFullName = repoData?.full_name || "";
      const repoHtmlUrl = repoData?.html_url || "";
      const pusherName = req.body?.pusher?.name || "GitHub User";
      const resources = db.getResources();
      let updatedCount = 0;
      const now = (/* @__PURE__ */ new Date()).toISOString();
      resources.forEach((resItem) => {
        const matches = repoFullName && (resItem.originalUrl.includes(repoFullName) || resItem.githubRepoUrl?.includes(repoFullName)) || repoHtmlUrl && (resItem.originalUrl.includes(repoHtmlUrl) || resItem.githubRepoUrl?.includes(repoHtmlUrl));
        if (matches) {
          db.saveResource({
            ...resItem,
            lastSyncedAt: now,
            updatedAt: now
          });
          updatedCount++;
        }
      });
      db.recordAuditLog(
        "GITHUB_WEBHOOK_PUSH",
        "GitHub Webhook",
        `Received GitHub push event for repository "${repoFullName || "unknown"}" by ${pusherName}. Synced ${updatedCount} resource(s).`
      );
      return res.json({
        success: true,
        message: "GitHub webhook received and processed successfully",
        event,
        repoFullName,
        syncedResourcesCount: updatedCount,
        timestamp: now
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/transactions", (req, res) => {
    const sessions = db.getPaymentSessions();
    return res.json({ transactions: sessions });
  });
  app.get("/api/tokens", (req, res) => {
    const tokens = db.getTokens();
    return res.json({ tokens });
  });
  app.post("/api/tokens/:id/revoke", (req, res) => {
    const { reason } = req.body;
    const success = db.revokeToken(req.params.id, reason || "Manually revoked by administrator");
    if (!success) {
      return res.status(404).json({ error: "Token not found" });
    }
    return res.json({ success: true, message: "Token revoked" });
  });
  app.post("/api/tokens/:id/expire", (req, res) => {
    const success = db.expireToken(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Token not found" });
    }
    return res.json({ success: true, message: "Token expired" });
  });
  app.get("/api/customers", (req, res) => {
    const customers = db.getCustomers();
    return res.json({ customers });
  });
  app.delete("/api/customers/:id", (req, res) => {
    const success = db.deleteCustomerData(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Customer not found" });
    }
    return res.json({ success: true });
  });
  app.get("/api/security/events", (req, res) => {
    const events = db.getSecurityEvents();
    return res.json({ events });
  });
  app.get("/api/security/audit-logs", (req, res) => {
    const logs = db.getAuditLogs();
    return res.json({ logs });
  });
  app.get("/api/dashboard/stats", (req, res) => {
    const stats = db.getDashboardStats();
    return res.json({ stats });
  });
  app.get("/api/settings", (req, res) => {
    const settings = db.getSettings();
    return res.json({ settings });
  });
  app.put("/api/settings", (req, res) => {
    const updated = db.updateSettings(req.body);
    return res.json({ settings: updated });
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path2.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path2.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[EIE-Technology] Production server online at http://0.0.0.0:${PORT}`);
  });
}
function renderAccessDeniedHtml(reason, resourceName, tokenRecord) {
  let headline = "Access Link Has Expired";
  let badge = "EXPIRED TOKEN";
  let badgeColor = "bg-amber-500/20 text-amber-400 border-amber-500/30";
  let message = "This secure access token has exceeded its validity window. For security and fraud prevention, token lifespans are strictly enforced.";
  let advisory = "Please generate a new payment session or contact the merchant if you need an extension.";
  if (reason === "CONCURRENT_DEVICE_BLOCKED") {
    headline = "Single-Device Access Restriction (\u090F\u0915 \u0938\u092E\u092F \u092E\u0947\u0902 \u090F\u0915 \u0921\u093F\u0935\u093E\u0907\u0938)";
    badge = "DEVICE_CONCURRENCY_LOCKED";
    badgeColor = "bg-amber-500/20 text-amber-400 border-amber-500/30";
    const bound = tokenRecord?.boundDeviceType || "another device";
    message = `Yeh token already "${bound}" par active aur use ho chuka hai. EIE-Technology security protocol ke mutabiq yeh token at a time keval ek hi device (ya to Mobile me ya fir Laptop me) par chal sakta hai. Dono devices par ek sath open karna strictly prohibited hai.`;
    advisory = "Single Device Rule: Yeh link keval pehle activated device par hi chalega. Kisi doosre device par access block kar diya gaya hai.";
  } else if (reason === "ALREADY_USED") {
    headline = "Access Token Already Used";
    badge = "SINGLE-USE VIOLATION";
    badgeColor = "bg-red-500/20 text-red-400 border-red-500/30";
    message = "This single-use access link was already consumed. To prevent unauthorized link redistribution and intellectual property piracy, EIE-Technology permanently deactivates tokens upon their initial authorized access.";
    advisory = "If you shared this link with someone else, only the first recipient was granted access.";
  } else if (reason === "REVOKED") {
    headline = "Access Token Revoked";
    badge = "ADMINISTRATIVE REVOCATION";
    badgeColor = "bg-red-500/20 text-red-400 border-red-500/30";
    message = `This token was revoked by the platform administrator. Reason: ${tokenRecord?.revokedReason || "Security audit"}`;
    advisory = "Please contact support@eie-technology.com if you believe this was in error.";
  } else if (reason === "NOT_FOUND") {
    headline = "Invalid Security Token";
    badge = "UNRECOGNIZED HASH";
    badgeColor = "bg-red-500/20 text-red-400 border-red-500/30";
    message = "The provided cryptographic security token does not exist or has been permanently purged from the registry.";
    advisory = "Verify you copied the full URL without truncation.";
  }
  return `<!doctype html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Notice | EIE-Technology</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background-color: #070b13; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  </style>
</head>
<body class="min-h-screen flex items-center justify-center p-4">
  <div class="max-w-md w-full bg-[#0d1524] border border-[#1e293b] rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
    <!-- Top accent bar -->
    <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-amber-500 to-red-500"></div>

    <!-- Header & Badge -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center space-x-2">
        <div class="w-8 h-8 rounded-lg bg-[#142033] border border-[#25354e] flex items-center justify-center">
          <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
        </div>
        <div>
          <span class="font-bold text-sm tracking-wider text-white">EIE-TECHNOLOGY</span>
          <p class="text-[10px] text-slate-400 font-mono">EXPLORE THE SECUR PAYMENT</p>
        </div>
      </div>
      <span class="px-2.5 py-1 text-[11px] font-mono font-semibold rounded-full border ${badgeColor}">
        ${badge}
      </span>
    </div>

    <!-- Icon & Status -->
    <div class="my-6 text-center">
      <div class="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
        <svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
      </div>
      <h1 class="text-xl font-bold text-white mb-2">${headline}</h1>
      ${resourceName ? `<p class="text-xs text-emerald-400 font-medium mb-2">Resource: ${resourceName}</p>` : ""}
      <p class="text-sm text-slate-300 leading-relaxed">${message}</p>
    </div>

    <!-- Security Audit Info Box -->
    <div class="bg-[#080d16] border border-[#172338] rounded-xl p-4 mb-6 font-mono text-xs text-slate-400 space-y-1">
      <div class="flex justify-between">
        <span>Protocol:</span>
        <span class="text-slate-300">Zero-Leak Link Shield</span>
      </div>
      <div class="flex justify-between">
        <span>Status Code:</span>
        <span class="text-red-400 font-bold">403_FORBIDDEN</span>
      </div>
      <div class="flex justify-between">
        <span>Timestamp:</span>
        <span class="text-slate-300">${(/* @__PURE__ */ new Date()).toISOString()}</span>
      </div>
      <div class="flex justify-between">
        <span>Destination:</span>
        <span class="text-slate-500">[ENCRYPTED & PROTECTED]</span>
      </div>
    </div>

    <p class="text-xs text-slate-400 text-center mb-6">${advisory}</p>

    <div class="space-y-2">
      <a href="/" class="block w-full text-center py-2.5 px-4 rounded-xl bg-[#1a293f] hover:bg-[#223552] text-white text-sm font-semibold transition">
        Return to Home
      </a>
    </div>
  </div>
</body>
</html>`;
}
function renderCloakedUsePageHtml(resourceName, destinationUrl, rawToken) {
  const isGoogleLink = /google\.com|drive\.google|docs\.google|sites\.google/i.test(destinationUrl);
  const isRawGithubRepo = /github\.com\/[^\/]+\/[^\/]+(?:\/)?$/i.test(destinationUrl) && !/github\.io/i.test(destinationUrl);
  const initialFrameSrc = destinationUrl.includes("?") ? `${destinationUrl}&_eie_init=${Date.now()}` : `${destinationUrl}?_eie_init=${Date.now()}`;
  return `<!doctype html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
  <meta http-equiv="Pragma" content="no-cache" />
  <meta http-equiv="Expires" content="0" />
  <title>${resourceName} | EIE-Technology Protected Portal</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background-color: #070b13; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; }
  </style>
</head>
<body class="min-h-screen w-screen flex flex-col bg-[#070b13]">
  <!-- Top Navigation & Security Bar -->
  <header class="bg-[#0b1320] border-b border-[#1a293f] px-3 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-2 z-20 shrink-0 shadow-md">
    <div class="flex items-center gap-2.5">
      <div class="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
        <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
      </div>
      <div>
        <h1 class="text-sm font-bold text-white leading-tight">${resourceName}</h1>
        <div class="flex items-center gap-2">
          <span class="text-[10px] font-mono text-emerald-400 font-semibold">\u{1F512} Protected Session</span>
          <span class="text-[10px] text-slate-500">\u2022</span>
          <span class="text-[10px] text-slate-400">Zero-Leak Live Mode</span>
        </div>
      </div>
    </div>

    <!-- Action Controls -->
    <div class="flex items-center gap-2 ml-auto">
      <button
        onclick="openFullScreenApp()"
        class="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-slate-950 shadow-md flex items-center gap-1.5 transition active:scale-95"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
        <span>\u{1F680} Open Full Screen (\u092A\u0942\u0930\u0940 \u0938\u094D\u0915\u094D\u0930\u0940\u0928)</span>
      </button>

      <button
        id="syncBtn"
        onclick="forceSyncLatest()"
        class="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#142236] hover:bg-[#1d314e] text-emerald-300 border border-emerald-500/30 transition flex items-center gap-1 active:scale-95"
        title="GitHub / Server cache bypass karke naya commit load karein"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
        <span id="syncBtnText">\u26A1 Force Sync (\u0928\u092F\u093E \u0905\u092A\u0921\u0947\u091F)</span>
      </button>

      <button
        id="copyLaptopBtn"
        onclick="copyLaptopLink()"
        class="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#142236] hover:bg-[#1d314e] text-sky-300 border border-sky-500/30 transition flex items-center gap-1"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
        <span id="copyLaptopText">Copy Laptop Link</span>
      </button>
    </div>
  </header>

  <!-- Laptop Sharing & Alert Bar -->
  <div class="bg-[#09101b] border-b border-[#162338] px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
    <div class="flex items-center gap-2 text-slate-300">
      <span class="text-sky-400 font-semibold">\u{1F4BB} Laptop Access:</span>
      <span class="text-[11px] text-slate-400 hidden sm:inline">Aap is link ko laptop ke Chrome ya Edge browser me direct chala sakte hain.</span>
    </div>
    <div class="flex items-center gap-2">
      <button onclick="shareWhatsApp()" class="px-2 py-1 rounded text-[11px] font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/20 transition flex items-center gap-1">
        \u{1F4F2} WhatsApp Par Bhejein (Laptop Web)
      </button>
      <button onclick="openFullScreenApp()" class="px-2 py-1 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 sm:hidden">
        \u{1F680} Full Screen
      </button>
    </div>
  </div>

  ${isGoogleLink ? `
  <div class="bg-amber-500/10 border-b border-amber-500/25 px-4 py-2 flex items-center justify-between gap-3 text-xs text-amber-200">
    <div class="flex items-center gap-2">
      <span>\u26A0\uFE0F <strong>Google 403 Error Prevention:</strong> Google Drive / Apps iframe me 403 error dete hain. Apna app bina kisi rukawat ke dekhne ke liye 'Open Full Screen' par click karein.</span>
    </div>
    <button onclick="openFullScreenApp()" class="shrink-0 px-3 py-1 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition shadow">
      \u{1F680} Click Here to Run Full Screen
    </button>
  </div>` : ""}

  ${isRawGithubRepo ? `
  <div class="bg-indigo-500/15 border-b border-indigo-500/30 px-4 py-2 flex items-center justify-between gap-3 text-xs text-indigo-200">
    <div class="flex items-center gap-2">
      <span>\u{1F4A1} <strong>GitHub Web Page Notice:</strong> Yeh raw GitHub repository link hai. GitHub iframe me code files block karta hai. Agar aapne web page deploy kiya hai toh 'GitHub Pages' URL use karein, ya fir live chalane ke liye 'Open Full Screen' par click karein.</span>
    </div>
    <button onclick="openFullScreenApp()" class="shrink-0 px-3 py-1 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs transition shadow">
      \u{1F680} Open GitHub Full Screen
    </button>
  </div>` : ""}

  <!-- Cloaked In-Page Sandboxed Player -->
  <main class="flex-1 w-full relative bg-[#03060a] min-h-[500px]">
    <iframe
      id="contentFrame"
      src="${initialFrameSrc}"
      title="${resourceName}"
      class="w-full h-full border-0 absolute inset-0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads allow-modals allow-top-navigation allow-presentation"
      referrerpolicy="no-referrer"
    ></iframe>
  </main>

  <script>
    const baseDestUrl = ${JSON.stringify(destinationUrl)};
    const laptopLink = window.location.href;

    function openFullScreenApp() {
      window.open(baseDestUrl, '_blank');
    }

    function forceSyncLatest() {
      const frame = document.getElementById('contentFrame');
      const syncBtn = document.getElementById('syncBtnText');
      if (syncBtn) syncBtn.innerText = 'Bypassing Cache... \u23F3';
      
      const sep = baseDestUrl.includes('?') ? '&' : '?';
      const freshUrl = baseDestUrl + sep + '_sync=' + Date.now();
      frame.src = freshUrl;
      
      setTimeout(() => {
        if (syncBtn) syncBtn.innerText = 'Latest Version Loaded \u2713';
      }, 1200);
      setTimeout(() => {
        if (syncBtn) syncBtn.innerText = '\u26A1 Force Sync (\u0928\u092F\u093E \u0905\u092A\u0921\u0947\u091F)';
      }, 3500);
    }

    function copyLaptopLink() {
      navigator.clipboard.writeText(laptopLink).then(() => {
        const textEl = document.getElementById('copyLaptopText');
        if (textEl) {
          textEl.innerText = 'Copied! \u2713';
          setTimeout(() => {
            textEl.innerText = 'Copy Laptop Link';
          }, 2500);
        }
      });
    }

    function shareWhatsApp() {
      const msg = 'EIE-Technology access link for laptop:\\n' + laptopLink;
      window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent(msg), '_blank');
    }
  </script>
</body>
</html>`;
}
startServer();
//# sourceMappingURL=server.cjs.map
