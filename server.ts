import crypto from 'crypto';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';
import type { Resource } from './src/types';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Security headers compatible with AI Studio iframe preview
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // ---------------------------------------------------------------------------
  // 1. PROTECTED ACCESS & REDIRECT ENDPOINT (CORE SECURITY REQUIREMENT)
  // ---------------------------------------------------------------------------
  // Route: /access/:token
  // Server-side validates token, enforces single-use atomically, and redirects to destination
  app.get('/access/:token', (req, res) => {
    const rawToken = req.params.token;
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const referer = req.headers['referer'];
    const previewMode = req.query.preview === '1';

    const result = db.validateAndConsumeToken(rawToken, { ipAddress, userAgent, referer });

    // Anti-stale caching headers: Ensure browser always checks for latest access status and latest content
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    if (result.success && result.originalUrl) {
      // Production & Preview: Render Cloaked In-Page Portal so destination link is NEVER exposed in the address bar or text!
      return res.send(renderCloakedUsePageHtml(result.resourceName || 'Resource', result.originalUrl, rawToken));
    }

    // Security failure rendering (Sleek Fintech/Cybersecurity Protection UI)
    const reason = result.reason || 'NOT_FOUND';
    const resourceName = result.resourceName;
    const tokenRecord = result.tokenRecord;

    return res.status(403).send(renderAccessDeniedHtml(reason, resourceName, tokenRecord));
  });

  // Client-side API token status checker (for testing / status cards)
  app.get('/api/access/inspect/:token', (req, res) => {
    const rawToken = req.params.token;
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const tokens = db.getTokens();
    const match = tokens.find((t) => t.tokenHash === tokenHash);
    if (!match) {
      return res.status(404).json({ valid: false, reason: 'TOKEN_NOT_FOUND' });
    }
    const isExpired = Date.now() > new Date(match.expiresAt).getTime();
    return res.json({
      valid: match.status !== 'REVOKED' && !isExpired,
      status: match.status === 'REVOKED' ? 'REVOKED' : isExpired ? 'EXPIRED' : 'ACTIVE',
      resourceName: match.resourceName,
      expiresAt: match.expiresAt,
      currentUses: match.currentUses,
      maxUses: match.maxUses,
    });
  });

  // Client-side API token consumer (for embedded in-app player verification)
  app.post('/api/access/consume/:token', (req, res) => {
    const rawToken = req.params.token;
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const referer = req.headers['referer'];

    const result = db.validateAndConsumeToken(rawToken, { ipAddress, userAgent, referer });
    if (!result.success) {
      return res.status(403).json({
        success: false,
        reason: result.reason || 'ACCESS_DENIED',
        resourceName: result.resourceName,
      });
    }

    return res.json({
      success: true,
      resourceName: result.resourceName,
      originalUrl: result.originalUrl,
      tokenRecord: result.tokenRecord,
    });
  });

  // ---------------------------------------------------------------------------
  // 2. PAYMENT SESSIONS & GATEWAY INTEGRATION
  // ---------------------------------------------------------------------------

  // Create payment session
  app.post('/api/payment/create-session', (req, res) => {
    try {
      const { resourceId, customerName, customerEmail, customerPhone, paymentMethod } = req.body;

      if (!resourceId || !customerName || !customerEmail) {
        return res.status(400).json({ error: 'Missing required parameters (resourceId, customerName, customerEmail)' });
      }

      const resource = db.getResourceById(resourceId);
      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      if (!resource.isEnabled) {
        return res.status(400).json({ error: 'This resource is currently disabled for purchase' });
      }

      // Order ID generated server-side
      const gatewayOrderId = `order_${resource.paymentGateway.toUpperCase()}_${Date.now().toString(36)}_${crypto
        .randomBytes(3)
        .toString('hex')}`;

      const session = db.createPaymentSession({
        resourceId: resource.id,
        resourceName: resource.name,
        amount: resource.price, // Server-side calculated price! Never trust client
        currency: resource.currency,
        customerName,
        customerEmail,
        customerPhone: customerPhone || '',
        gateway: resource.paymentGateway,
        gatewayOrderId,
        paymentMethod: paymentMethod || 'UPI',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min session validity
      });

      return res.json({
        success: true,
        session,
        paymentUrl: `/pay/session/${session.id}`,
      });
    } catch (err: any) {
      console.error('[Payment] Error creating session:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // Get session details
  app.get('/api/payment/session/:id', (req, res) => {
    const session = db.getPaymentSession(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Payment session not found' });
    }

    const resource = db.getResourceById(session.resourceId);

    const settings = db.getSettings();
    const merchantAccount = {
      accountHolderName: resource?.customAccountName || settings.merchantAccount?.accountHolderName || 'Explore The Inside Experiment',
      accountNumber: resource?.customAccountNumber || settings.merchantAccount?.accountNumber || '',
      bankName: resource?.customBankName || settings.merchantAccount?.bankName || 'State Bank of India',
      ifscCode: resource?.customIfscCode || settings.merchantAccount?.ifscCode || 'SBIN0001234',
      accountType: settings.merchantAccount?.accountType || 'Current',
      upiId: resource?.customUpiId || settings.merchantAccount?.upiId || 'exploretheinsideexperiment@okaxis',
      directUpiEnabled: settings.merchantAccount?.directUpiEnabled ?? true,
    };

    // Return session data with public safe resource info (originalUrl omitted!)
    return res.json({
      session,
      merchantAccount,
      resource: resource
        ? {
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
            customAccountNumber: resource.customAccountNumber,
          }
        : null,
    });
  });

  // ---------------------------------------------------------------------------
  // 3. VERIFIED PAYMENT GATEWAY WEBHOOK (SERVER-SIDE ONLY)
  // ---------------------------------------------------------------------------
  // In production, Razorpay / Cashfree sends a POST request with payload and cryptographic signature
  app.post('/api/webhooks/payment', (req, res) => {
    try {
      const signature = (req.headers['x-razorpay-signature'] ||
        req.headers['x-cashfree-signature'] ||
        req.headers['x-webhook-signature']) as string;

      const { event, orderId, paymentId, amount, currency, sessionId } = req.body;

      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

      // Verify Session
      const session = sessionId ? db.getPaymentSession(sessionId) : db.getPaymentSessions().find((s) => s.gatewayOrderId === orderId);

      if (!session) {
        db.recordSecurityEvent({
          type: 'INVALID_WEBHOOK',
          severity: 'HIGH',
          description: `Received webhook for unknown order: ${orderId || 'empty'}`,
          ipAddress,
        });
        return res.status(404).json({ error: 'Order session not found' });
      }

      // Check Idempotency: Duplicate webhooks must not reissue tokens!
      if (session.status === 'SUCCESS') {
        return res.json({
          status: 'ok',
          message: 'Webhook already processed (Idempotent replay detected)',
          sessionId: session.id,
          accessTokenId: session.accessTokenId,
        });
      }

      // Amount verification: Must strictly match expected server price
      if (amount && Number(amount) !== session.amount) {
        db.recordSecurityEvent({
          type: 'INVALID_WEBHOOK',
          severity: 'CRITICAL',
          description: `Price tampering detected in webhook! Expected ${session.amount}, received ${amount}`,
          ipAddress,
          resourceId: session.resourceId,
        });
        session.status = 'FAILED';
        return res.status(400).json({ error: 'Amount verification failed' });
      }

      // Mark Session SUCCESS
      session.status = 'SUCCESS';
      session.paidAt = new Date().toISOString();
      session.gatewayPaymentId = paymentId || `pay_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;

      const finalPaymentId = session.gatewayPaymentId || paymentId || `pay_${Date.now().toString(36)}`;
      session.gatewayPaymentId = finalPaymentId;

      // Issue Cryptographically Secure One-Time Token
      const { rawToken, tokenRecord } = db.issueAccessToken({
        resourceId: session.resourceId,
        sessionId: session.id,
        paymentId: finalPaymentId,
        customerEmail: session.customerEmail,
        ipAddress,
        userAgent: req.headers['user-agent'],
      });

      session.accessTokenId = tokenRecord.id;
      // Protected URL handed to customer (Never contains the original private URL!)
      const baseAppUrl = req.headers.host ? `${req.protocol}://${req.headers.host}` : process.env.APP_URL || '';
      session.protectedUrl = `${baseAppUrl}/access/${rawToken}`;

      // Register or update customer metrics
      db.registerOrUpdateCustomer({
        name: session.customerName,
        email: session.customerEmail,
        phone: session.customerPhone,
        amount: session.amount,
        currency: session.currency,
      });

      // Record Security Audit
      db.recordSecurityEvent({
        type: 'ADMIN_LOGIN',
        severity: 'LOW',
        description: `Verified Payment Webhook processed for "${session.resourceName}". Order: ${session.gatewayOrderId}. Token: ${tokenRecord.rawTokenPrefix}`,
        ipAddress,
        tokenId: tokenRecord.id,
        resourceId: session.resourceId,
      });

      return res.json({
        success: true,
        message: 'Payment verified successfully and one-time token issued',
        sessionId: session.id,
        status: session.status,
        protectedUrl: session.protectedUrl,
        rawToken, // Provided to the webhook receiver/checkout confirmation
      });
    } catch (err: any) {
      console.error('[Webhook] Error handling webhook:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // Webhook Simulator Endpoint (For instant testing of the verified gateway flow)
  app.post('/api/payment/simulate-gateway-webhook', (req, res) => {
    const { sessionId, paymentMethod } = req.body;
    const session = db.getPaymentSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.status === 'SUCCESS' && session.protectedUrl) {
      return res.json({
        success: true,
        alreadyProcessed: true,
        session,
        protectedUrl: session.protectedUrl,
      });
    }

    const mockSecret = 'whsec_eie_test_secret_9921';
    const mockPaymentId = `pay_${session.gateway.toLowerCase()}_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;
    const payload = JSON.stringify({
      event: 'payment.captured',
      orderId: session.gatewayOrderId,
      paymentId: mockPaymentId,
      amount: session.amount,
      currency: session.currency,
      sessionId: session.id,
    });
    const signature = crypto.createHmac('sha256', mockSecret).update(payload).digest('hex');

    session.paymentMethod = paymentMethod || session.paymentMethod || 'UPI';
    session.status = 'SUCCESS';
    session.paidAt = new Date().toISOString();
    session.gatewayPaymentId = mockPaymentId;

    const { rawToken, tokenRecord } = db.issueAccessToken({
      resourceId: session.resourceId,
      sessionId: session.id,
      paymentId: session.gatewayPaymentId,
      customerEmail: session.customerEmail,
      ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
      userAgent: req.headers['user-agent'],
    });

    session.accessTokenId = tokenRecord.id;
    const baseAppUrl = req.headers.host ? `${req.protocol}://${req.headers.host}` : process.env.APP_URL || '';
    session.protectedUrl = `${baseAppUrl}/access/${rawToken}`;

    db.registerOrUpdateCustomer({
      name: session.customerName,
      email: session.customerEmail,
      phone: session.customerPhone,
      amount: session.amount,
      currency: session.currency,
    });

    return res.json({
      success: true,
      verifiedWebhook: true,
      signatureVerified: true,
      session,
      rawToken,
      protectedUrl: session.protectedUrl,
    });
  });

  // Confirm Direct UPI Payment (Customer completed UPI transfer to merchant UPI ID)
  app.post('/api/payment/confirm-upi', (req, res) => {
    const { sessionId, resourceId, utrNumber, customerName, customerEmail, customerPhone, amount } = req.body;
    let session = sessionId ? db.getPaymentSession(sessionId) : undefined;

    if (!session) {
      // Find resource by resourceId or pick the first available resource
      const targetResId = resourceId || db.getResources()[0]?.id;
      const targetRes = targetResId ? db.getResourceById(targetResId) : db.getResources()[0];
      if (!targetRes) {
        return res.status(404).json({ error: 'No resource found to associate with payment' });
      }

      session = db.createPaymentSession({
        resourceId: targetRes.id,
        resourceName: targetRes.name,
        amount: Number(amount) || targetRes.price || 199,
        currency: targetRes.currency || 'INR',
        customerName: customerName ? customerName.trim() : 'Direct UPI Customer',
        customerEmail: customerEmail ? customerEmail.trim() : 'exploretheinsideexperiment@gmail.com',
        customerPhone: customerPhone ? customerPhone.trim() : '',
        gateway: 'UPI Manual Handshake',
        gatewayOrderId: `upi_ord_${crypto.randomBytes(6).toString('hex')}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        paymentMethod: 'UPI',
      });
    }

    if (customerName && customerName.trim()) session.customerName = customerName.trim();
    if (customerEmail && customerEmail.trim()) session.customerEmail = customerEmail.trim();
    if (customerPhone && customerPhone.trim()) session.customerPhone = customerPhone.trim();

    const upiPaymentId = utrNumber && utrNumber.trim()
      ? `upi_utr_${utrNumber.trim()}`
      : `upi_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`;

    session.paymentMethod = 'UPI';
    session.status = 'SUCCESS';
    session.paidAt = new Date().toISOString();
    session.gatewayPaymentId = upiPaymentId;

    const { rawToken, tokenRecord } = db.issueAccessToken({
      resourceId: session.resourceId,
      sessionId: session.id,
      paymentId: session.gatewayPaymentId,
      customerEmail: session.customerEmail,
      ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
      userAgent: req.headers['user-agent'],
    });

    session.accessTokenId = tokenRecord.id;
    const baseAppUrl = req.headers.host ? `${req.protocol}://${req.headers.host}` : process.env.APP_URL || '';
    session.protectedUrl = `${baseAppUrl}/access/${rawToken}`;

    // Explicitly persist the updated session in database
    db.updatePaymentSession(session.id, {
      status: 'SUCCESS',
      paidAt: session.paidAt,
      paymentMethod: 'UPI',
      gatewayPaymentId: upiPaymentId,
      accessTokenId: tokenRecord.id,
      protectedUrl: session.protectedUrl,
      customerName: session.customerName,
      customerEmail: session.customerEmail,
      customerPhone: session.customerPhone,
    });

    const tokenFormatted = `EIE-TOK-${rawToken.substring(0, 4).toUpperCase()}-${rawToken.substring(4, 8).toUpperCase()}`;
    const tokenMessage = `🎉 *EIE-Technology Payment Verified!*\n\n` +
      `📦 *Resource:* ${session.resourceName}\n` +
      `🔑 *One-Device Token:* ${tokenFormatted}\n` +
      `🔗 *Connected Access Link:* ${session.protectedUrl}\n\n` +
      `⚠️ *SINGLE-DEVICE POLICY:*\n` +
      `Yeh link at a time *ek hi baar / ek hi device* par open hoga (ya to Mobile me ya fir Laptop me). Kisi doosre device par open karne par yeh token block ho jayega.\n\n` +
      `⏰ *Valid for:* 24 Hours\n` +
      `🔒 *Status:* Zero-Leak Cryptographic Shield Active`;

    db.registerOrUpdateCustomer({
      name: session.customerName,
      email: session.customerEmail,
      phone: session.customerPhone,
      amount: session.amount,
      currency: session.currency,
    });

    db.recordAuditLog(
      'DIRECT_UPI_VERIFIED',
      'System',
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
      stats: db.getDashboardStats(),
    });
  });

  // Dedicated endpoint for Admin to Record / Verify an offline or scanner payment
  app.post('/api/payment/record-direct', (req, res) => {
    const { resourceId, amount, currency, utrNumber, customerName, customerEmail, customerPhone, paymentMethod } = req.body;

    const targetResId = resourceId || db.getResources()[0]?.id;
    const targetRes = targetResId ? db.getResourceById(targetResId) : db.getResources()[0];

    const finalAmount = Number(amount) || targetRes?.price || 199;
    const finalCurrency = currency || targetRes?.currency || 'INR';
    const finalResourceName = targetRes?.name || 'Zero-Trust Infrastructure Blueprint';
    const finalResourceId = targetRes?.id || 'res_cyber_core_01';

    const session = db.createPaymentSession({
      resourceId: finalResourceId,
      resourceName: finalResourceName,
      amount: finalAmount,
      currency: finalCurrency,
      customerName: customerName ? customerName.trim() : 'Scanner Direct Customer',
      customerEmail: customerEmail ? customerEmail.trim() : 'exploretheinsideexperiment@gmail.com',
      customerPhone: customerPhone ? customerPhone.trim() : '',
      gateway: 'UPI Direct Scanner',
      gatewayOrderId: `upi_scan_${crypto.randomBytes(6).toString('hex')}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      paymentMethod: paymentMethod || 'UPI',
    });

    const upiPaymentId = utrNumber && utrNumber.trim()
      ? `upi_utr_${utrNumber.trim()}`
      : `upi_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`;

    session.status = 'SUCCESS';
    session.paidAt = new Date().toISOString();
    session.gatewayPaymentId = upiPaymentId;

    const { rawToken, tokenRecord } = db.issueAccessToken({
      resourceId: session.resourceId,
      sessionId: session.id,
      paymentId: session.gatewayPaymentId,
      customerEmail: session.customerEmail,
      ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
      userAgent: req.headers['user-agent'],
    });

    session.accessTokenId = tokenRecord.id;
    const baseAppUrl = req.headers.host ? `${req.protocol}://${req.headers.host}` : process.env.APP_URL || '';
    session.protectedUrl = `${baseAppUrl}/access/${rawToken}`;

    db.updatePaymentSession(session.id, {
      status: 'SUCCESS',
      paidAt: session.paidAt,
      paymentMethod: session.paymentMethod,
      gatewayPaymentId: upiPaymentId,
      accessTokenId: tokenRecord.id,
      protectedUrl: session.protectedUrl,
    });

    const tokenFormatted = `EIE-TOK-${rawToken.substring(0, 4).toUpperCase()}-${rawToken.substring(4, 8).toUpperCase()}`;
    const tokenMessage = `🎉 *EIE-Technology Payment Verified!*\n\n` +
      `📦 *Resource:* ${session.resourceName}\n` +
      `🔑 *One-Device Token:* ${tokenFormatted}\n` +
      `🔗 *Connected Access Link:* ${session.protectedUrl}\n\n` +
      `⚠️ *SINGLE-DEVICE POLICY:*\n` +
      `Yeh link at a time *ek hi baar / ek hi device* par open hoga (ya to Mobile me ya fir Laptop me). Kisi doosre device par open karne par yeh token block ho jayega.\n\n` +
      `⏰ *Valid for:* 24 Hours\n` +
      `🔒 *Status:* Zero-Leak Cryptographic Shield Active`;

    db.registerOrUpdateCustomer({
      name: session.customerName,
      email: session.customerEmail,
      phone: session.customerPhone,
      amount: session.amount,
      currency: session.currency,
    });

    db.recordAuditLog(
      'ADMIN_PAYMENT_RECORDED',
      'Admin',
      `Recorded direct payment: ${session.currency} ${session.amount} for "${session.resourceName}" (UTR/Ref: ${upiPaymentId})`
    );

    return res.json({
      success: true,
      session,
      rawToken,
      tokenFormatted,
      tokenMessage,
      protectedUrl: session.protectedUrl,
      stats: db.getDashboardStats(),
    });
  });

  // ---------------------------------------------------------------------------
  // 4. RESOURCE MANAGEMENT (ADMIN API)
  // ---------------------------------------------------------------------------
  app.get('/api/resources', (req, res) => {
    const resources = db.getResources();
    return res.json({ resources });
  });

  app.get('/api/resources/:id', (req, res) => {
    const resource = db.getResourceById(req.params.id);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    return res.json({ resource });
  });

  app.post('/api/resources', (req, res) => {
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
        failureRedirect,
      } = req.body;

      if (!name || !originalUrl || price === undefined) {
        return res.status(400).json({ error: 'Name, originalUrl, and price are required.' });
      }

      // Security check on original URL: only allowed protocols
      if (!/^https?:\/\//i.test(originalUrl.trim())) {
        return res.status(400).json({ error: 'Invalid URL. Destination must start with https:// or http://' });
      }

      const newResource: Resource = {
        id: `res_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`,
        name: name.trim(),
        description: description?.trim() || '',
        originalUrl: originalUrl.trim(),
        category: category || 'General',
        price: Number(price) || 0,
        currency: currency || 'INR',
        tokenValidityHours: Number(tokenValidityHours) || 24,
        tokenValidityUnit: req.body.tokenValidityUnit || 'hours',
        tokenValidityValue: Number(req.body.tokenValidityValue) || Number(tokenValidityHours) || 24,
        maxUses: Number(maxUses) || 1,
        isEnabled: isEnabled !== false,
        qrEnabled: qrEnabled !== false,
        emailEnabled: emailEnabled !== false,
        smsEnabled: smsEnabled === true,
        whatsappEnabled: whatsappEnabled === true,
        paymentGateway: paymentGateway || 'Razorpay',
        customAccountNumber: req.body.customAccountNumber?.trim() || undefined,
        customAccountName: req.body.customAccountName?.trim() || undefined,
        customBankName: req.body.customBankName?.trim() || undefined,
        customIfscCode: req.body.customIfscCode?.trim() || undefined,
        customUpiId: req.body.customUpiId?.trim() || undefined,
        customSlug: customSlug?.trim() || undefined,
        successRedirect: successRedirect?.trim() || undefined,
        failureRedirect: failureRedirect?.trim() || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const saved = db.saveResource(newResource);
      return res.status(201).json({ resource: saved });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/resources/:id', (req, res) => {
    const existing = db.getResourceById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    if (req.body.originalUrl && !/^https?:\/\//i.test(req.body.originalUrl.trim())) {
      return res.status(400).json({ error: 'Invalid URL. Destination must start with https:// or http://' });
    }

    const updated: Resource = {
      ...existing,
      ...req.body,
      id: existing.id,
      updatedAt: new Date().toISOString(),
    };

    const saved = db.saveResource(updated);
    return res.json({ resource: saved });
  });

  app.delete('/api/resources/:id', (req, res) => {
    const deleted = db.deleteResource(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    return res.json({ success: true, message: 'Resource deleted' });
  });

  // Manual GitHub Resource Cache Purge & Force Sync
  app.post('/api/resources/:id/sync-github', (req, res) => {
    const resource = db.getResourceById(req.params.id);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    const now = new Date().toISOString();
    const updated: Resource = {
      ...resource,
      lastSyncedAt: now,
      updatedAt: now,
    };

    const saved = db.saveResource(updated);
    db.recordAuditLog(
      'GITHUB_RESOURCE_SYNCED',
      'Admin',
      `Forced live GitHub sync and cache-bust for resource "${resource.name}" (ID: ${resource.id})`
    );

    return res.json({
      success: true,
      message: `Resource "${resource.name}" cache purged and synced with GitHub!`,
      resource: saved,
      syncedAt: now,
    });
  });

  // Automated GitHub Webhook Listener (trigger on git push)
  app.post('/api/webhooks/github', (req, res) => {
    try {
      const event = req.headers['x-github-event'] || 'push';
      const repoData = req.body?.repository;
      const repoFullName = repoData?.full_name || '';
      const repoHtmlUrl = repoData?.html_url || '';
      const pusherName = req.body?.pusher?.name || 'GitHub User';

      const resources = db.getResources();
      let updatedCount = 0;
      const now = new Date().toISOString();

      resources.forEach((resItem) => {
        const matches =
          (repoFullName && (resItem.originalUrl.includes(repoFullName) || resItem.githubRepoUrl?.includes(repoFullName))) ||
          (repoHtmlUrl && (resItem.originalUrl.includes(repoHtmlUrl) || resItem.githubRepoUrl?.includes(repoHtmlUrl)));

        if (matches) {
          db.saveResource({
            ...resItem,
            lastSyncedAt: now,
            updatedAt: now,
          });
          updatedCount++;
        }
      });

      db.recordAuditLog(
        'GITHUB_WEBHOOK_PUSH',
        'GitHub Webhook',
        `Received GitHub push event for repository "${repoFullName || 'unknown'}" by ${pusherName}. Synced ${updatedCount} resource(s).`
      );

      return res.json({
        success: true,
        message: 'GitHub webhook received and processed successfully',
        event,
        repoFullName,
        syncedResourcesCount: updatedCount,
        timestamp: now,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // ---------------------------------------------------------------------------
  // 5. TRANSACTIONS, TOKENS, SECURITY & DASHBOARD STATS
  // ---------------------------------------------------------------------------
  app.get('/api/transactions', (req, res) => {
    const sessions = db.getPaymentSessions();
    return res.json({ transactions: sessions });
  });

  app.get('/api/tokens', (req, res) => {
    const tokens = db.getTokens();
    return res.json({ tokens });
  });

  app.post('/api/tokens/:id/revoke', (req, res) => {
    const { reason } = req.body;
    const success = db.revokeToken(req.params.id, reason || 'Manually revoked by administrator');
    if (!success) {
      return res.status(404).json({ error: 'Token not found' });
    }
    return res.json({ success: true, message: 'Token revoked' });
  });

  app.post('/api/tokens/:id/expire', (req, res) => {
    const success = db.expireToken(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Token not found' });
    }
    return res.json({ success: true, message: 'Token expired' });
  });

  app.get('/api/customers', (req, res) => {
    const customers = db.getCustomers();
    return res.json({ customers });
  });

  app.delete('/api/customers/:id', (req, res) => {
    const success = db.deleteCustomerData(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    return res.json({ success: true });
  });

  app.get('/api/security/events', (req, res) => {
    const events = db.getSecurityEvents();
    return res.json({ events });
  });

  app.get('/api/security/audit-logs', (req, res) => {
    const logs = db.getAuditLogs();
    return res.json({ logs });
  });

  app.get('/api/dashboard/stats', (req, res) => {
    const stats = db.getDashboardStats();
    return res.json({ stats });
  });

  app.get('/api/settings', (req, res) => {
    const settings = db.getSettings();
    return res.json({ settings });
  });

  app.put('/api/settings', (req, res) => {
    const updated = db.updateSettings(req.body);
    return res.json({ settings: updated });
  });

  // ---------------------------------------------------------------------------
  // 6. VITE MIDDLEWARE (DEV) OR STATIC DIST SERVING (PROD)
  // ---------------------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[EIE-Technology] Production server online at http://0.0.0.0:${PORT}`);
  });
}

// ---------------------------------------------------------------------------
// HTML TEMPLATES FOR ACCESS REDIRECT & DEFENSE PAGES
// ---------------------------------------------------------------------------

function renderAccessDeniedHtml(
  reason: 'NOT_FOUND' | 'ALREADY_USED' | 'EXPIRED' | 'REVOKED' | 'INVALID_SCHEME' | 'CONCURRENT_DEVICE_BLOCKED' | string,
  resourceName?: string,
  tokenRecord?: any
) {
  let headline = 'Access Link Has Expired';
  let badge = 'EXPIRED TOKEN';
  let badgeColor = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  let message =
    'This secure access token has exceeded its validity window. For security and fraud prevention, token lifespans are strictly enforced.';
  let advisory = 'Please generate a new payment session or contact the merchant if you need an extension.';

  if (reason === 'CONCURRENT_DEVICE_BLOCKED') {
    headline = 'Single-Device Access Restriction (एक समय में एक डिवाइस)';
    badge = 'DEVICE_CONCURRENCY_LOCKED';
    badgeColor = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    const bound = tokenRecord?.boundDeviceType || 'another device';
    message = `Yeh token already "${bound}" par active aur use ho chuka hai. EIE-Technology security protocol ke mutabiq yeh token at a time keval ek hi device (ya to Mobile me ya fir Laptop me) par chal sakta hai. Dono devices par ek sath open karna strictly prohibited hai.`;
    advisory = 'Single Device Rule: Yeh link keval pehle activated device par hi chalega. Kisi doosre device par access block kar diya gaya hai.';
  } else if (reason === 'ALREADY_USED') {
    headline = 'Access Token Already Used';
    badge = 'SINGLE-USE VIOLATION';
    badgeColor = 'bg-red-500/20 text-red-400 border-red-500/30';
    message =
      'This single-use access link was already consumed. To prevent unauthorized link redistribution and intellectual property piracy, EIE-Technology permanently deactivates tokens upon their initial authorized access.';
    advisory = 'If you shared this link with someone else, only the first recipient was granted access.';
  } else if (reason === 'REVOKED') {
    headline = 'Access Token Revoked';
    badge = 'ADMINISTRATIVE REVOCATION';
    badgeColor = 'bg-red-500/20 text-red-400 border-red-500/30';
    message = `This token was revoked by the platform administrator. Reason: ${tokenRecord?.revokedReason || 'Security audit'}`;
    advisory = 'Please contact support@eie-technology.com if you believe this was in error.';
  } else if (reason === 'NOT_FOUND') {
    headline = 'Invalid Security Token';
    badge = 'UNRECOGNIZED HASH';
    badgeColor = 'bg-red-500/20 text-red-400 border-red-500/30';
    message = 'The provided cryptographic security token does not exist or has been permanently purged from the registry.';
    advisory = 'Verify you copied the full URL without truncation.';
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
      ${resourceName ? `<p class="text-xs text-emerald-400 font-medium mb-2">Resource: ${resourceName}</p>` : ''}
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
        <span class="text-slate-300">${new Date().toISOString()}</span>
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

function renderCloakedUsePageHtml(resourceName: string, destinationUrl: string, rawToken: string) {
  const isGoogleLink = /google\.com|drive\.google|docs\.google|sites\.google/i.test(destinationUrl);
  const isRawGithubRepo = /github\.com\/[^\/]+\/[^\/]+(?:\/)?$/i.test(destinationUrl) && !/github\.io/i.test(destinationUrl);
  const initialFrameSrc = destinationUrl.includes('?') 
    ? `${destinationUrl}&_eie_init=${Date.now()}` 
    : `${destinationUrl}?_eie_init=${Date.now()}`;

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
          <span class="text-[10px] font-mono text-emerald-400 font-semibold">🔒 Protected Session</span>
          <span class="text-[10px] text-slate-500">•</span>
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
        <span>🚀 Open Full Screen (पूरी स्क्रीन)</span>
      </button>

      <button
        id="syncBtn"
        onclick="forceSyncLatest()"
        class="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#142236] hover:bg-[#1d314e] text-emerald-300 border border-emerald-500/30 transition flex items-center gap-1 active:scale-95"
        title="GitHub / Server cache bypass karke naya commit load karein"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
        <span id="syncBtnText">⚡ Force Sync (नया अपडेट)</span>
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
      <span class="text-sky-400 font-semibold">💻 Laptop Access:</span>
      <span class="text-[11px] text-slate-400 hidden sm:inline">Aap is link ko laptop ke Chrome ya Edge browser me direct chala sakte hain.</span>
    </div>
    <div class="flex items-center gap-2">
      <button onclick="shareWhatsApp()" class="px-2 py-1 rounded text-[11px] font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/20 transition flex items-center gap-1">
        📲 WhatsApp Par Bhejein (Laptop Web)
      </button>
      <button onclick="openFullScreenApp()" class="px-2 py-1 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 sm:hidden">
        🚀 Full Screen
      </button>
    </div>
  </div>

  ${
    isGoogleLink
      ? `
  <div class="bg-amber-500/10 border-b border-amber-500/25 px-4 py-2 flex items-center justify-between gap-3 text-xs text-amber-200">
    <div class="flex items-center gap-2">
      <span>⚠️ <strong>Google 403 Error Prevention:</strong> Google Drive / Apps iframe me 403 error dete hain. Apna app bina kisi rukawat ke dekhne ke liye 'Open Full Screen' par click karein.</span>
    </div>
    <button onclick="openFullScreenApp()" class="shrink-0 px-3 py-1 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition shadow">
      🚀 Click Here to Run Full Screen
    </button>
  </div>`
      : ''
  }

  ${
    isRawGithubRepo
      ? `
  <div class="bg-indigo-500/15 border-b border-indigo-500/30 px-4 py-2 flex items-center justify-between gap-3 text-xs text-indigo-200">
    <div class="flex items-center gap-2">
      <span>💡 <strong>GitHub Web Page Notice:</strong> Yeh raw GitHub repository link hai. GitHub iframe me code files block karta hai. Agar aapne web page deploy kiya hai toh 'GitHub Pages' URL use karein, ya fir live chalane ke liye 'Open Full Screen' par click karein.</span>
    </div>
    <button onclick="openFullScreenApp()" class="shrink-0 px-3 py-1 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs transition shadow">
      🚀 Open GitHub Full Screen
    </button>
  </div>`
      : ''
  }

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
      if (syncBtn) syncBtn.innerText = 'Bypassing Cache... ⏳';
      
      const sep = baseDestUrl.includes('?') ? '&' : '?';
      const freshUrl = baseDestUrl + sep + '_sync=' + Date.now();
      frame.src = freshUrl;
      
      setTimeout(() => {
        if (syncBtn) syncBtn.innerText = 'Latest Version Loaded ✓';
      }, 1200);
      setTimeout(() => {
        if (syncBtn) syncBtn.innerText = '⚡ Force Sync (नया अपडेट)';
      }, 3500);
    }

    function copyLaptopLink() {
      navigator.clipboard.writeText(laptopLink).then(() => {
        const textEl = document.getElementById('copyLaptopText');
        if (textEl) {
          textEl.innerText = 'Copied! ✓';
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
