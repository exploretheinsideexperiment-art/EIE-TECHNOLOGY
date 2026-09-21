import React, { useState } from 'react';
import { QrCode, Download, Printer, Share2, RefreshCw, CheckCircle, XCircle, Search } from 'lucide-react';
import type { Resource } from '../types';

interface QRManagementViewProps {
  resources: Resource[];
  onOpenQRModal: (resource: Resource) => void;
  onOpenCustomerCheckout: (resource: Resource) => void;
}

export const QRManagementView: React.FC<QRManagementViewProps> = ({
  resources,
  onOpenQRModal,
  onOpenCustomerCheckout,
}) => {
  const [search, setSearch] = useState('');

  const filtered = resources.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              QR Code Payment Station
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              STANDALONE PORTAL QR
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Download, print, or deploy high-resolution payment QR stands that point to EIE-Technology sessions
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search resources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0c1422] border border-[#1b2b42] text-xs text-white focus:outline-none focus:border-emerald-400"
          />
        </div>
      </div>

      {/* Grid of Resource QR Standees */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((res) => (
          <div
            key={res.id}
            className="rounded-2xl bg-[#0c1422] border border-[#18263a] hover:border-[#213550] transition p-6 flex flex-col justify-between shadow-lg"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-[#142033] text-emerald-400 border border-[#1d2f4a]">
                  {res.paymentGateway}
                </span>
                {res.qrEnabled ? (
                  <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                    <CheckCircle className="w-3 h-3" /> QR Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-mono text-slate-500">
                    <XCircle className="w-3 h-3" /> Disabled
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-base font-bold text-white tracking-tight">{res.name}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{res.description}</p>
              </div>

              {/* QR Preview Mini-Standee */}
              <div
                onClick={() => onOpenQRModal(res)}
                className="w-full py-8 rounded-xl bg-[#070b14] border border-[#142033] flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500/40 transition group"
              >
                <div className="w-24 h-24 rounded-xl bg-white p-2 border-2 border-emerald-400/60 shadow-md group-hover:scale-105 transition flex items-center justify-center">
                  <QrCode className="w-16 h-16 text-slate-900" />
                </div>
                <span className="text-[11px] font-mono text-emerald-400 mt-3 font-semibold group-hover:underline">
                  Click to View & Print Full Standee
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-slate-300 p-2.5 rounded-lg bg-[#080d16]">
                <span>Gate Price:</span>
                <span className="font-bold text-emerald-400">
                  {res.currency} {res.price}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-[#162338] mt-4 flex items-center gap-2">
              <button
                onClick={() => onOpenQRModal(res)}
                className="flex-1 py-2 px-3 rounded-xl bg-[#142033] hover:bg-[#1a2b45] text-slate-200 text-xs font-semibold border border-[#213552] transition flex items-center justify-center gap-1.5"
              >
                <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                <span>Manage QR</span>
              </button>
              <button
                onClick={() => onOpenCustomerCheckout(res)}
                className="py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition"
              >
                Test Pay
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
