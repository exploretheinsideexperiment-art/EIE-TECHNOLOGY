import React, { useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Search,
  ExternalLink,
  Download,
} from 'lucide-react';
import type { PaymentSession } from '../types';

interface TransactionsViewProps {
  sessions: PaymentSession[];
  onOpenReceipt: (session: PaymentSession) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({ sessions, onOpenReceipt }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'PENDING' | 'FAILED'>('ALL');

  const filtered = sessions.filter((s) => {
    const matchesSearch =
      s.customerName.toLowerCase().includes(search.toLowerCase()) ||
      s.customerEmail.toLowerCase().includes(search.toLowerCase()) ||
      s.gatewayOrderId.toLowerCase().includes(search.toLowerCase()) ||
      s.resourceName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportCSV = () => {
    const headers = ['ID,Gateway Order ID,Resource,Amount,Currency,Customer,Email,Status,Date'];
    const rows = filtered.map(
      (s) =>
        `"${s.id}","${s.gatewayOrderId}","${s.resourceName}","${s.amount}","${s.currency}","${s.customerName}","${s.customerEmail}","${s.status}","${s.createdAt}"`
    );
    const blob = new Blob([[...headers, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Payments & Transactions
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {sessions.length} RECORDED
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Verified gateway transactions and one-time link dispatch status
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-[#142033] hover:bg-[#1a2b45] text-slate-200 text-xs font-semibold border border-[#213552] transition"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="w-full sm:flex-1">
          <input
            type="text"
            placeholder="Search by customer, email, order ID, or resource..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-[#0c1422] border border-[#1b2b42] text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-400"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {(['ALL', 'SUCCESS', 'PENDING', 'FAILED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
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

      {/* Transactions Table */}
      <div className="rounded-2xl bg-[#0c1422] border border-[#18263a] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#090d16] border-b border-[#18263a] text-[11px] font-mono uppercase text-slate-400 tracking-wider">
              <tr>
                <th className="py-3 px-4">Transaction / Order</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Resource</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#142033]">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-[#0f192b] transition">
                  <td className="py-3.5 px-4">
                    <div className="font-mono font-bold text-white text-xs">{s.gatewayOrderId}</div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {s.paymentMethod} • {s.gateway}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-200">{s.customerName}</div>
                    <div className="text-[11px] text-slate-400">{s.customerEmail}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-emerald-300">{s.resourceName}</div>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-white">
                    {s.currency} {s.amount.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                        s.status === 'SUCCESS'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : s.status === 'PENDING'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {s.status === 'SUCCESS' && <CheckCircle2 className="w-3 h-3" />}
                      {s.status === 'PENDING' && <Clock className="w-3 h-3" />}
                      {s.status === 'FAILED' && <XCircle className="w-3 h-3" />}
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onOpenReceipt(s)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#142033] hover:bg-[#1a2b45] text-slate-200 text-xs font-semibold border border-[#213552] transition"
                    >
                      <FileText className="w-3 h-3 text-emerald-400" />
                      <span>Receipt</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="py-12 text-center text-slate-500 text-xs font-mono">
            No transactions match the selected filter.
          </div>
        )}
      </div>
    </div>
  );
};
