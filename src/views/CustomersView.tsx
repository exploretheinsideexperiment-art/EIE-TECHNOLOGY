import React, { useState } from 'react';
import { Users, Search, Trash2, ShieldCheck, Mail, Phone, Calendar } from 'lucide-react';
import type { Customer } from '../types';
import { api } from '../utils/api';

interface CustomersViewProps {
  customers: Customer[];
  onRefresh: () => Promise<void>;
}

export const CustomersView: React.FC<CustomersViewProps> = ({ customers, onRefresh }) => {
  const [search, setSearch] = useState('');
  const [filterMinSpent, setFilterMinSpent] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = customers.filter((c) => {
    const phoneStr = c.phone || '';
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      phoneStr.toLowerCase().includes(search.toLowerCase());
    const spent = c.totalAmount || c.totalSpent || 0;
    const matchesSpent = filterMinSpent ? spent >= 500 : true;
    return matchesSearch && matchesSpent;
  });

  const handleDelete = async (id: string, name: string) => {
    if (
      !confirm(
        `GDPR Compliance Action:\nPermanently purge customer record "${name}" and erase identifiable records?`
      )
    )
      return;
    try {
      setDeletingId(id);
      await api.deleteCustomer(id);
      await onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to delete customer');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Customer Directory & Privacy
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {customers.length} REGISTERED
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Track customer lifetime spend and fulfill GDPR right-to-be-forgotten deletion requests
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterMinSpent(!filterMinSpent)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              filterMinSpent
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-[#0c1422] text-slate-400 border-[#18263a] hover:text-white'
            }`}
          >
            ★ High Value (&gt; ₹500)
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div>
        <input
          type="text"
          placeholder="Search by customer name, email address, or phone number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl bg-[#0c1422] border border-[#1b2b42] text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-400"
        />
      </div>

      {/* Customers Table */}
      <div className="rounded-2xl bg-[#0c1422] border border-[#18263a] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#090d16] border-b border-[#18263a] text-[11px] font-mono uppercase text-slate-400 tracking-wider">
              <tr>
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Orders</th>
                <th className="py-3 px-4">Total Spent</th>
                <th className="py-3 px-4">First Activity</th>
                <th className="py-3 px-4">Last Activity</th>
                <th className="py-3 px-4 text-right">Privacy / GDPR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#142033]">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-[#0f192b] transition">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white">{c.name}</div>
                    <span className="text-[10px] text-slate-500 font-mono">ID: {c.id}</span>
                  </td>
                  <td className="py-3.5 px-4 space-y-0.5">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Mail className="w-3 h-3 text-slate-500" />
                      <span>{c.email}</span>
                    </div>
                    {c.phone && (
                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>{c.phone}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-200">
                    {c.totalPayments} orders
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-400 text-sm">
                    ₹{(c.totalAmount || c.totalSpent || 0).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                    {new Date(c.firstPaymentDate || c.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                    {new Date(c.lastPaymentAt || c.lastPaymentDate || c.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleDelete(c.id, c.name)}
                      disabled={deletingId === c.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/30 transition disabled:opacity-50"
                      title="Erase Customer Records (GDPR)"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Erase</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="py-12 text-center text-slate-500 text-xs font-mono">
            No customers found matching search criteria.
          </div>
        )}
      </div>
    </div>
  );
};
