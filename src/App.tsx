import React, { useState, useEffect, useCallback } from 'react';
import { Header, type ActiveTab } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ResourceModal } from './components/ResourceModal';
import { ReceiptModal } from './components/ReceiptModal';
import { QRModal } from './components/QRModal';
import { OfflineIndicator } from './components/OfflineIndicator';

import { DashboardView } from './views/DashboardView';
import { ResourcesView } from './views/ResourcesView';
import { CustomerPaymentView } from './views/CustomerPaymentView';
import { ProtectedUsePortalView } from './views/ProtectedUsePortalView';
import { QRManagementView } from './views/QRManagementView';
import { TransactionsView } from './views/TransactionsView';
import { TokensView } from './views/TokensView';
import { CustomersView } from './views/CustomersView';
import { SecurityCenterView } from './views/SecurityCenterView';
import { SettingsView } from './views/SettingsView';

import { api } from './utils/api';
import type {
  Resource,
  PaymentSession,
  AccessTokenRecord,
  Customer,
  SecurityEvent,
  DashboardStats,
  AppSettings,
} from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [activeToken, setActiveToken] = useState<string | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [transactions, setTransactions] = useState<PaymentSession[]>([]);
  const [tokens, setTokens] = useState<AccessTokenRecord[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [selectedResourceForEdit, setSelectedResourceForEdit] = useState<Resource | null>(null);

  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedSessionForReceipt, setSelectedSessionForReceipt] = useState<PaymentSession | null>(null);

  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [selectedResourceForQR, setSelectedResourceForQR] = useState<Resource | null>(null);

  const [customerPayResourceId, setCustomerPayResourceId] = useState<string | null>(null);

  // Fetch all live data
  const loadAllData = useCallback(async () => {
    try {
      const [
        resList,
        txList,
        tokList,
        custList,
        secList,
        audList,
        dashStats,
        appSettings,
      ] = await Promise.all([
        api.getResources(),
        api.getTransactions(),
        api.getTokens(),
        api.getCustomers(),
        api.getSecurityEvents(),
        api.getAuditLogs(),
        api.getDashboardStats(),
        api.getSettings(),
      ]);

      setResources(resList);
      setTransactions(txList);
      setTokens(tokList);
      setCustomers(custList);
      setSecurityEvents(secList);
      setAuditLogs(audList);
      setStats(dashStats);
      setSettings(appSettings);
    } catch (err) {
      console.error('[EIE] Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();

    // Check URL query parameters for direct pay session links (e.g. ?pay=res_id) or access tokens (?token=...)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tokenParam = params.get('token') || params.get('access');
      if (tokenParam) {
        setActiveToken(tokenParam);
        setActiveTab('use_portal');
      } else {
        const payParam = params.get('pay');
        if (payParam) {
          setCustomerPayResourceId(payParam);
          setActiveTab('pay_customer');
        }
        const tabParam = params.get('tab') as ActiveTab;
        if (tabParam) {
          setActiveTab(tabParam);
        }
      }
    }

    // Real-time live synchronization every 3 seconds so payments and token stats update instantly
    const pollInterval = setInterval(() => {
      loadAllData();
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [loadAllData]);

  // Refresh live data whenever user switches views / tabs
  useEffect(() => {
    loadAllData();
  }, [activeTab, loadAllData]);

  // Modal Handlers
  const handleOpenAddResource = () => {
    setSelectedResourceForEdit(null);
    setIsResourceModalOpen(true);
  };

  const handleOpenEditResource = (resource: Resource) => {
    setSelectedResourceForEdit(resource);
    setIsResourceModalOpen(true);
  };

  const handleSaveResource = async (resourceData: Partial<Resource>) => {
    await api.saveResource(resourceData);
    await loadAllData();
  };

  const handleDeleteResource = async (id: string) => {
    await api.deleteResource(id);
    await loadAllData();
  };

  const handleOpenQRModal = (resource: Resource) => {
    setSelectedResourceForQR(resource);
    setIsQRModalOpen(true);
  };

  const handleOpenReceipt = (session: PaymentSession) => {
    setSelectedSessionForReceipt(session);
    setIsReceiptModalOpen(true);
  };

  const handleOpenCustomerCheckout = (resource: Resource) => {
    setCustomerPayResourceId(resource.id);
    setActiveTab('pay_customer');
  };

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950 font-sans pb-20 lg:pb-10">
      {/* Top Header & Navigation */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenNewResource={handleOpenAddResource}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <div className="w-10 h-10 rounded-xl border-2 border-emerald-500 border-t-transparent animate-spin" />
            <p className="text-xs font-mono text-emerald-400">Loading EIE-Technology Defense Engine...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                stats={stats}
                sessions={transactions}
                tokens={tokens}
                securityEvents={securityEvents}
                resources={resources}
                onOpenResource={handleOpenQRModal}
                onNavigateTab={setActiveTab}
                onRefresh={loadAllData}
              />
            )}

            {activeTab === 'resources' && (
              <ResourcesView
                resources={resources}
                onAddResource={handleOpenAddResource}
                onEditResource={handleOpenEditResource}
                onDeleteResource={handleDeleteResource}
                onOpenQR={handleOpenQRModal}
                onOpenCustomerCheckout={handleOpenCustomerCheckout}
              />
            )}

            {activeTab === 'pay_customer' && (
              <CustomerPaymentView
                resources={resources}
                initialResourceId={customerPayResourceId}
                settings={settings}
                onPaymentSuccess={loadAllData}
                onOpenReceipt={handleOpenReceipt}
              />
            )}

            {activeTab === 'use_portal' && (
              <ProtectedUsePortalView
                token={activeToken || ''}
                onBackToStore={() => {
                  setActiveToken(null);
                  setActiveTab('pay_customer');
                }}
                onOpenReceipt={handleOpenReceipt}
              />
            )}

            {activeTab === 'qr_manager' && (
              <QRManagementView
                resources={resources}
                onOpenQRModal={handleOpenQRModal}
                onOpenCustomerCheckout={handleOpenCustomerCheckout}
              />
            )}

            {activeTab === 'transactions' && (
              <TransactionsView
                sessions={transactions}
                onOpenReceipt={handleOpenReceipt}
              />
            )}

            {activeTab === 'tokens' && (
              <TokensView
                tokens={tokens}
                onRefresh={loadAllData}
              />
            )}

            {activeTab === 'customers' && (
              <CustomersView
                customers={customers}
                onRefresh={loadAllData}
              />
            )}

            {activeTab === 'security' && (
              <SecurityCenterView
                events={securityEvents}
                auditLogs={auditLogs}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                settings={settings}
                onRefresh={loadAllData}
              />
            )}
          </>
        )}
      </main>

      {/* Mobile Admin Bottom Navigation Bar + FAB (+) */}
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenNewResource={handleOpenAddResource}
      />

      {/* Modals */}
      <ResourceModal
        isOpen={isResourceModalOpen}
        onClose={() => setIsResourceModalOpen(false)}
        onSave={handleSaveResource}
        initialResource={selectedResourceForEdit}
      />

      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        session={selectedSessionForReceipt}
      />

      <QRModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        resource={selectedResourceForQR}
        settings={settings}
        onOpenCheckout={handleOpenCustomerCheckout}
        onPaymentSuccess={loadAllData}
      />

      {/* Offline Status Toast Indicator */}
      <OfflineIndicator />
    </div>
  );
}
