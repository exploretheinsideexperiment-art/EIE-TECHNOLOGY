import React, { useState } from 'react';
import {
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Ban,
  AlertTriangle,
  Search,
  History,
  ShieldAlert,
  Copy,
  Check,
} from 'lucide-react';
import type { AccessTokenRecord } from '../types';
import { api } from '../utils/api';

interface TokensViewProps {
  tokens: AccessTokenRecord[];
  onRefresh: () => Promise<void>;
}

export const TokensView: React.FC<TokensViewProps> = ({ tokens, onRefresh }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'USED' | 'EXPIRED' | 'REVOKED'>('ALL');
  const [selectedTokenForHistory, setSelectedTokenForHistory] = useState<AccessTokenRecord | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const filtered = tokens.filter((t) => {
    const matchesSearch =
      t.customerEmail.toLowerCase().includes(search.toLowerCase()) ||
      t.tokenHash.toLowerCase().includes(search.toLowerCase()) ||
      t.resourceName.toLowerCase().includes(search.toLowerCase()) ||
      t.rawTokenPrefix.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleRevoke = async (token: AccessTokenRecord) => {
    const reason = prompt('Enter revocation reason (e.g. Chargeback, Policy violation):', 'Administrative revocation');
    if (!reason) return;
    try {
      setActionLoading(token.id);
      await api.revokeToken(token.id, reason);
      await onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to revoke token');
    } finally {
      setActionLoading(null);
    }
  };

  const handleExpire = async (token: AccessTokenRecord) => {
    if (!confirm('Immediately expire this token?')) return;
    try {
      setActionLoading(token.id);
      await api.expireToken(token.id);
      await onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to expire token');
    } finally {
      setActionLoading(null);
    }
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Cryptographic Token Vault
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {tokens.length} MANAGED TOKENS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Raw tokens are never stored; only SHA-256 hashes and CSPRNG prefix identifiers are persisted
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="w-full sm:flex-1">
          <input
            type="text"
            placeholder="Search by customer email, token prefix, resource, or SHA-256 hash..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-[#0c1422] border border-[#1b2b42] text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-400"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
          {(['ALL', 'ACTIVE', 'USED', 'EXPIRED', 'REVOKED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === st
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-[#0c1422] text-slate-400 hover:text-white border border-[#18263a]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-[#0c1422] border border-[#18263a] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#090d16] border-b border-[#18263a] text-[11px] font-mono uppercase text-slate-400 tracking-wider">
              <tr>
                <th className="py-3 px-4">Token Identifier / Hash</th>
                <th className="py-3 px-4">Resource</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Usage Count</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Expires</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#142033]">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-[#0f192b] transition">
                  <td className="py-3.5 px-4 font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-emerald-400">{t.rawTokenPrefix}••••</span>
                      <button
                        onClick={() => copyHash(t.tokenHash)}
                        className="text-slate-500 hover:text-slate-300"
                        title="Copy SHA-256 Hash"
                      >
                        {copiedHash === t.tokenHash ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                    <div className="text-[10px] text-slate-500 truncate max-w-[140px]" title={t.tokenHash}>
                      SHA256: {t.tokenHash.substring(0, 16)}...
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-200">{t.resourceName}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="text-slate-300">{t.customerEmail}</div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">
                    <span className="font-bold text-white">{t.currentUses}</span> / {t.maxUses}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                        t.status === 'ACTIVE'
                          ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                          : t.status === 'USED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : t.status === 'EXPIRED'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {t.status === 'ACTIVE' && <KeyRound className="w-3 h-3" />}
                      {t.status === 'USED' && <ShieldCheck className="w-3 h-3" />}
                      {t.status === 'EXPIRED' && <Clock className="w-3 h-3" />}
                      {t.status === 'REVOKED' && <Ban className="w-3 h-3" />}
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                    {new Date(t.expiresAt).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedTokenForHistory(t)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        title="View Usage History"
                      >
                        <History className="w-3.5 h-3.5 text-sky-400" />
                      </button>

                      {t.status === 'ACTIVE' && (
                        <>
                          <button
                            onClick={() => handleRevoke(t)}
                            disabled={actionLoading === t.id}
                            className="px-2 py-1 rounded-lg text-[10px] font-mono font-semibold bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 transition"
                            title="Revoke Token"
                          >
                            Revoke
                          </button>
                          <button
                            onClick={() => handleExpire(t)}
                            disabled={actionLoading === t.id}
                            className="px-2 py-1 rounded-lg text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 transition"
                            title="Expire Token"
                          >
                            Expire
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="py-12 text-center text-slate-500 text-xs font-mono">
            No tokens match the selected filter.
          </div>
        )}
      </div>

      {/* Access History Audit Modal */}
      {selectedTokenForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#0c1422] border border-[#1e2f47] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#18263a]">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Token Access Audit Log</h3>
              </div>
              <button
                onClick={() => setSelectedTokenForHistory(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#080d16] border border-[#162338] font-mono text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Token Prefix:</span>
                <span className="text-emerald-400 font-bold">{selectedTokenForHistory.rawTokenPrefix}••••</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Resource:</span>
                <span className="text-slate-200">{selectedTokenForHistory.resourceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Customer:</span>
                <span className="text-slate-200">{selectedTokenForHistory.customerEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Usage Status:</span>
                <span className="text-white font-bold">{selectedTokenForHistory.status}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider mb-2">
                Recorded Ingress Attempts ({(selectedTokenForHistory.usageHistory || []).length})
              </h4>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {(selectedTokenForHistory.usageHistory || []).map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border text-xs font-mono space-y-1 ${
                      item.granted
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                    }`}
                  >
                    <div className="flex justify-between font-bold">
                      <span>{item.granted ? '✓ ACCESS GRANTED (302 REDIRECT)' : '✗ BLOCKED (REPLAY INTERCEPT)'}</span>
                      <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-[11px] opacity-80">IP: {item.ipAddress}</div>
                    <div className="text-[10px] opacity-60 truncate">User-Agent: {item.userAgent}</div>
                  </div>
                ))}
                {(selectedTokenForHistory.usageHistory || []).length === 0 && (
                  <p className="text-xs text-slate-500 py-4 text-center">No access attempts recorded yet.</p>
                )}
              </div>
            </div>

            <button
              onClick={() => setSelectedTokenForHistory(null)}
              className="w-full py-2.5 rounded-xl bg-[#142033] hover:bg-[#1a2b45] text-slate-200 text-xs font-semibold transition"
            >
              Close Log
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
