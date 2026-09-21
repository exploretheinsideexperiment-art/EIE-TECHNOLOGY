import React from 'react';
import { X, CheckCircle, ShieldCheck, Printer, Download } from 'lucide-react';
import type { PaymentSession } from '../types';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: PaymentSession | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, session }) => {
  if (!isOpen || !session) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#0c1422] border border-[#1e2f47] rounded-2xl shadow-2xl overflow-hidden print:m-0 print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Modal Top Bar (hidden during print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#18263a] bg-[#090d16] print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-bold text-white">Payment Receipt</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Content */}
        <div className="p-6 md:p-8 space-y-6 print:p-4 text-left">
          {/* Brand Header */}
          <div className="text-center pb-4 border-b border-[#1a293e] print:border-gray-200">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-3">
              <ShieldCheck className="w-7 h-7 text-emerald-400" />
            </div>
            <h2 className="text-lg font-black tracking-tight text-white print:text-black">EIE-Technology</h2>
            <p className="text-xs font-mono text-emerald-400 print:text-emerald-700">Explore the Inside Experiment-Technology</p>
            <p className="text-[10px] text-slate-400 font-mono">(Created by Vipul)</p>
            <p className="text-[10px] text-slate-400 mt-1">Official Cryptographic Transaction Receipt</p>
          </div>

          {/* Status Badge */}
          <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 print:text-emerald-800 text-xs font-mono font-semibold">
            <CheckCircle className="w-4 h-4" />
            <span>PAYMENT VERIFIED & SETTLED</span>
          </div>

          {/* Details Table */}
          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between py-1.5 border-b border-[#141f30] print:border-gray-100">
              <span className="text-slate-400 print:text-gray-500">Transaction ID:</span>
              <span className="text-white font-semibold print:text-black">{session.gatewayPaymentId || session.id}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-[#141f30] print:border-gray-100">
              <span className="text-slate-400 print:text-gray-500">Gateway Order ID:</span>
              <span className="text-slate-300 print:text-black">{session.gatewayOrderId}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-[#141f30] print:border-gray-100">
              <span className="text-slate-400 print:text-gray-500">Date & Time:</span>
              <span className="text-slate-300 print:text-black">
                {session.paidAt ? new Date(session.paidAt).toLocaleString() : new Date(session.createdAt).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-[#141f30] print:border-gray-100">
              <span className="text-slate-400 print:text-gray-500">Customer:</span>
              <span className="text-slate-300 print:text-black">{session.customerName} ({session.customerEmail})</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-[#141f30] print:border-gray-100">
              <span className="text-slate-400 print:text-gray-500">Resource:</span>
              <span className="text-emerald-300 font-bold print:text-emerald-700">{session.resourceName}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-[#141f30] print:border-gray-100">
              <span className="text-slate-400 print:text-gray-500">Payment Method:</span>
              <span className="text-slate-300 print:text-black">{session.paymentMethod || 'UPI / QR'} ({session.gateway})</span>
            </div>

            <div className="flex justify-between py-2 text-sm font-sans border-t-2 border-emerald-500/30 print:border-gray-400 pt-3">
              <span className="font-bold text-white print:text-black">Amount Paid:</span>
              <span className="font-bold text-emerald-400 print:text-emerald-700 text-base">
                {session.currency} {session.amount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="p-3 rounded-xl bg-[#090d16] border border-[#162338] print:border-gray-200 text-[11px] text-slate-400 print:text-gray-600">
            🔒 <strong className="text-slate-300 print:text-black">Zero-Leak Security Architecture:</strong> For intellectual property protection, original server resource endpoints are cloaked. Protected access was dispatched via secure one-time cryptographic token.
          </div>

          {/* Buttons (hidden during print) */}
          <div className="flex items-center gap-3 pt-2 print:hidden">
            <button
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#142033] hover:bg-[#1a2b45] text-white text-xs font-semibold border border-[#213552] transition"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Print Receipt</span>
            </button>

            <button
              onClick={() => {
                const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(session, null, 2));
                const dl = document.createElement('a');
                dl.setAttribute('href', jsonStr);
                dl.setAttribute('download', `receipt_${session.id}.json`);
                dl.click();
              }}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#142033] hover:bg-[#1a2b45] text-slate-300 text-xs font-semibold border border-[#213552] transition"
            >
              <Download className="w-4 h-4" />
              <span>JSON</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
