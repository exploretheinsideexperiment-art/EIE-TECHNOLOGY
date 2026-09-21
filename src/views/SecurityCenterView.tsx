import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Download,
  CheckCircle2,
  XCircle,
  FileCode,
  Fingerprint,
} from 'lucide-react';
import type { SecurityEvent } from '../types';

interface SecurityCenterViewProps {
  events: SecurityEvent[];
  auditLogs: any[];
}

export const SecurityCenterView: React.FC<SecurityCenterViewProps> = ({ events, auditLogs }) => {
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');

  const replayedBlocked = events.filter((e) => e.type === 'TOKEN_REPLAY_ATTEMPT' || e.type === 'REPLAYED_TOKEN').length;
  const invalidWebhooks = events.filter((e) => e.type === 'INVALID_WEBHOOK').length;
  const tokenNotFound = events.filter((e) => e.type === 'TOKEN_NOT_FOUND' || e.type === 'FAILED_TOKEN').length;
  const expiredAttempts = events.filter((e) => e.type === 'TOKEN_EXPIRED' || e.type === 'EXPIRED_TOKEN').length;

  const filteredEvents = events.filter((e) => {
    return severityFilter === 'ALL' || e.severity === severityFilter;
  });

  const exportAuditLog = () => {
    const data = {
      exportTimestamp: new Date().toISOString(),
      platform: 'EIE-Technology Zero-Leak Engine',
      securitySummary: {
        replayedBlocked,
        invalidWebhooks,
        tokenNotFound,
        expiredAttempts,
        totalEvents: events.length,
      },
      events,
      auditLogs,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EIE_Security_Audit_${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              EIE Cybersecurity Operations Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              SHIELD LEVEL 5 ACTIVE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time defensive telemetry: Link replay interception, webhook HMAC audits, and CSPRNG integrity
          </p>
        </div>

        <button
          onClick={exportAuditLog}
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-[#142033] hover:bg-[#1a2b45] text-slate-200 text-xs font-semibold border border-[#213552] transition"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Export Forensic Audit JSON</span>
        </button>
      </div>

      {/* Security Telemetry Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#0c1422] border border-[#18263a] shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Replays Blocked</span>
            <Lock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400">{replayedBlocked}</div>
          <p className="text-[10px] text-slate-500 font-mono mt-1">Single-use token reuse traps</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#0c1422] border border-[#18263a] shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Invalid Webhooks</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-400">{invalidWebhooks}</div>
          <p className="text-[10px] text-slate-500 font-mono mt-1">HMAC signature mismatches</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#0c1422] border border-[#18263a] shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Brute Force Status</span>
            <Fingerprint className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-base font-bold font-mono text-sky-400 mt-1">256-BIT SECURE</div>
          <p className="text-[10px] text-slate-500 font-mono mt-1">10^77 collision barrier</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#0c1422] border border-[#18263a] shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Expired Ingress Intercepts</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black font-mono text-rose-400">{expiredAttempts}</div>
          <p className="text-[10px] text-slate-500 font-mono mt-1">Outdated token attempts</p>
        </div>
      </div>

      {/* Live Defensive Interception Log */}
      <div className="rounded-2xl bg-[#0c1422] border border-[#18263a] overflow-hidden shadow-xl">
        <div className="p-4 border-b border-[#18263a] bg-[#090d16] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Security Event Ledger ({events.length})
            </h2>
            <p className="text-[11px] text-slate-400">Cryptographically logged incoming ingress attempts and policy audits</p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition ${
                  severityFilter === sev
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-[#0c1422] text-slate-400 hover:text-white border border-[#18263a]'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-[#142033] max-h-96 overflow-y-auto">
          {filteredEvents.map((evt) => (
            <div key={evt.id} className="p-4 hover:bg-[#0f192b] transition flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      evt.severity === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : evt.severity === 'HIGH'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {evt.severity} • {evt.type}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    IP: {evt.ipAddress || 'Internal Engine'}
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-sans">{evt.description}</p>
                {evt.userAgent && (
                  <p className="text-[10px] text-slate-500 font-mono truncate max-w-xl">
                    Client: {evt.userAgent}
                  </p>
                )}
              </div>

              <div className="text-right shrink-0">
                <span className="text-[11px] font-mono text-slate-400">
                  {new Date(evt.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
                <div className="text-[10px] text-slate-500 font-mono">
                  {new Date(evt.timestamp).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}

          {filteredEvents.length === 0 && (
            <div className="py-12 text-center text-slate-500 text-xs font-mono">
              No security events recorded under this severity level.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
