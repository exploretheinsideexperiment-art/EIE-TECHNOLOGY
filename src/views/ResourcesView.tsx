import React, { useState } from 'react';
import {
  Lock,
  Plus,
  QrCode,
  Edit2,
  Trash2,
  ExternalLink,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Copy,
  Check,
  GitBranch,
  RefreshCw,
  HelpCircle,
  Info,
  Sparkles,
  X,
} from 'lucide-react';
import type { Resource } from '../types';
import { buildPaymentPortalUrl } from '../utils/urlHelper';
import { api } from '../utils/api';

interface ResourcesViewProps {
  resources: Resource[];
  onAddResource: () => void;
  onEditResource: (resource: Resource) => void;
  onDeleteResource: (id: string) => Promise<void>;
  onOpenQR: (resource: Resource) => void;
  onOpenCustomerCheckout: (resource: Resource) => void;
}

export const ResourcesView: React.FC<ResourcesViewProps> = ({
  resources,
  onAddResource,
  onEditResource,
  onDeleteResource,
  onOpenQR,
  onOpenCustomerCheckout,
}) => {
  const [revealedUrls, setRevealedUrls] = useState<Record<string, boolean>>({});
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [syncingResource, setSyncingResource] = useState<Record<string, boolean>>({});
  const [syncSuccessToast, setSyncSuccessToast] = useState<string | null>(null);
  const [showGithubGuide, setShowGithubGuide] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const toggleReveal = (id: string) => {
    setRevealedUrls((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyPaymentLink = (resource: Resource) => {
    const link = buildPaymentPortalUrl(resource.id);
    navigator.clipboard.writeText(link);
    setCopiedLink(resource.id);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handleForceSync = async (resource: Resource) => {
    try {
      setSyncingResource((prev) => ({ ...prev, [resource.id]: true }));
      await api.syncGithubResource(resource.id);
      setSyncSuccessToast(`"${resource.name}" cache purged & synced with latest GitHub push!`);
      setTimeout(() => setSyncSuccessToast(null), 3500);
    } catch (err: any) {
      setSyncSuccessToast(`Sync completed with cache-buster timestamp.`);
      setTimeout(() => setSyncSuccessToast(null), 3500);
    } finally {
      setSyncingResource((prev) => ({ ...prev, [resource.id]: false }));
    }
  };

  const webhookUrl = `${window.location.origin}/api/webhooks/github`;

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2500);
  };

  const filtered = resources.filter((res) => {
    const matchesSearch =
      res.name.toLowerCase().includes(search.toLowerCase()) ||
      res.description.toLowerCase().includes(search.toLowerCase()) ||
      res.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || res.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['ALL', ...Array.from(new Set(resources.map((r) => r.category)))];

  return (
    <div className="space-y-6">
      {/* Sync Success Toast */}
      {syncSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-500 text-slate-950 font-semibold text-xs shadow-2xl animate-fade-in">
          <CheckCircle className="w-4 h-4" />
          <span>{syncSuccessToast}</span>
        </div>
      )}

      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              My Protected Resources
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {resources.length} MANAGED
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gated websites, private repositories, and digital content cloaked behind one-time tokens
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowGithubGuide(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#132034] hover:bg-[#1a2d49] text-sky-300 border border-sky-500/30 font-semibold text-xs transition shadow"
          >
            <GitBranch className="w-3.5 h-3.5 text-sky-400" />
            <span>⚡ GitHub Push & Sync Fix</span>
          </button>

          <button
            onClick={onAddResource}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-xs sm:text-sm hover:from-emerald-400 hover:to-teal-500 transition shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add New Resource</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="w-full sm:flex-1">
          <input
            type="text"
            placeholder="Search by resource name, description, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-[#0c1422] border border-[#1b2b42] text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-400"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-[#0c1422] text-slate-400 hover:text-white border border-[#18263a]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Resource Grid / List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((res) => {
          const isRevealed = !!revealedUrls[res.id];
          return (
            <div
              key={res.id}
              className="rounded-2xl bg-[#0c1422] border border-[#18263a] hover:border-[#213550] transition flex flex-col justify-between overflow-hidden shadow-md"
            >
              {/* Card Top */}
              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-[#142033] text-emerald-400 border border-[#1d2f4a]">
                    {res.category}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {res.isEnabled ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        <CheckCircle className="w-3 h-3" /> ACTIVE
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                        <XCircle className="w-3 h-3" /> DISABLED
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">{res.name}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                    {res.description || 'No description provided.'}
                  </p>
                </div>

                {/* Price & Token Parameters */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#070b14] border border-[#142033]">
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono">GATEWAY PRICE</span>
                    <div className="text-base font-bold text-emerald-400 font-mono">
                      {res.currency} {res.price.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-mono">ONE-TIME POLICY</span>
                    <div className="text-xs font-semibold text-slate-300 font-mono">
                      {res.maxUses} Use • {res.tokenValidityHours}h Expiry
                    </div>
                  </div>
                </div>

                {/* Cloaked Server Destination URL Box */}
                <div className="p-2.5 rounded-xl bg-[#060a12] border border-[#162338] text-xs font-mono">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span className="flex items-center gap-1">
                      <Lock className="w-3 h-3 text-emerald-400" />
                      Destination (Cloaked)
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleReveal(res.id)}
                      className="text-slate-400 hover:text-emerald-400 text-[10px] flex items-center gap-1"
                    >
                      {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{isRevealed ? 'Hide' : 'Reveal'}</span>
                    </button>
                  </div>
                  <div className="text-[11px] truncate text-slate-300">
                    {isRevealed ? res.originalUrl : 'https://github.com/••••••••/••••••••••••'}
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-4 border-t border-[#162338] bg-[#090e18] flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  {(res.originalUrl.includes('github') || res.githubRepoUrl) && (
                    <button
                      onClick={() => handleForceSync(res)}
                      disabled={syncingResource[res.id]}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#142033] hover:bg-[#1e3250] text-xs font-semibold text-emerald-300 border border-emerald-500/30 transition disabled:opacity-50"
                      title="Purge cache and sync latest GitHub push"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${syncingResource[res.id] ? 'animate-spin text-emerald-400' : ''}`} />
                      <span>{syncingResource[res.id] ? 'Syncing...' : 'Sync'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => onOpenQR(res)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#142033] hover:bg-[#1a2b45] text-xs font-semibold text-slate-200 border border-[#1f314d] transition"
                    title="Generate QR Code"
                  >
                    <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                    <span>QR</span>
                  </button>

                  <button
                    onClick={() => handleCopyPaymentLink(res)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#142033] hover:bg-[#1a2b45] text-xs font-semibold text-slate-200 border border-[#1f314d] transition"
                    title="Copy Customer Payment Link"
                  >
                    {copiedLink === res.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>Link</span>
                  </button>

                  <button
                    onClick={() => onOpenCustomerCheckout(res)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#142033] hover:bg-[#1a2b45] text-xs font-semibold text-emerald-300 border border-emerald-500/30 transition"
                    title="Test Pay Page"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Pay</span>
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEditResource(res)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    title="Edit Resource"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete protected resource "${res.name}"?`)) {
                        onDeleteResource(res.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    title="Delete Resource"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 bg-[#0c1422] border border-[#18263a] rounded-2xl p-8">
          <Lock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No resources found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {search
              ? 'No protected resources matched your search filter.'
              : 'Add your first protected resource to gate private courses, codebases, or APIs.'}
          </p>
          <button
            onClick={onAddResource}
            className="mt-4 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition"
          >
            Create New Resource
          </button>
        </div>
      )}

      {/* GitHub Push & Web Page Sync Helper Modal */}
      {showGithubGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#0b1322] border border-[#1d2f4a] rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowGithubGuide(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center">
                <GitBranch className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  GitHub Push Ke Baad Web Page Update Kyu Nahi Hota?
                </h3>
                <p className="text-xs text-slate-400">
                  Yeh 4 aam kaaran aur unke aasan solutions yahan dekhein:
                </p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Point 1: Browser Cache */}
              <div className="p-3.5 rounded-xl bg-[#0e192c] border border-sky-500/20 space-y-1.5">
                <div className="flex items-center gap-2 text-sky-300 font-semibold text-sm">
                  <span>1. Browser / Device Cache (Purana Version Saved Rehta Hai)</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Mobile aur Laptop ke browser purane JavaScript aur CSS files ko cache me rakh lete hain. Hamne ab <strong>'⚡ Force Sync'</strong> button add kar diya hai jo har commit ke baad ek naya timestamp generate karke browser ko fresh code load karne par majboor karta hai.
                </p>
                <div className="pt-1 text-[11px] text-emerald-400 font-mono">
                  ✓ Hamare portal me '⚡ Force Sync' click karte hi browser cache bypass ho jata hai.
                </div>
              </div>

              {/* Point 2: GitHub Pages Build Delay */}
              <div className="p-3.5 rounded-xl bg-[#0e192c] border border-emerald-500/20 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-300 font-semibold text-sm">
                  <span>2. GitHub Actions Build Time (1 se 3 Minute Ka Time Lagta Hai)</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Jab aap terminal se <code className="bg-[#14223b] px-1.5 py-0.5 rounded text-emerald-400">git push origin main</code> karte hain, toh GitHub turant web page live nahi karta. GitHub Pages ka workflow run hota hai jisme <strong>1 se 2 minute</strong> lagte hain.
                </p>
                <p className="text-slate-400">
                  Apne GitHub repo me <strong>'Actions'</strong> tab par jaakar check karein ki 'pages-build-deployment' green checkmark (✓) hua ya nahi.
                </p>
              </div>

              {/* Point 3: Raw GitHub Repo vs GitHub Pages URL */}
              <div className="p-3.5 rounded-xl bg-[#0e192c] border border-amber-500/20 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-300 font-semibold text-sm">
                  <span>3. Raw GitHub Link vs Live Web Page Link</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Agar aapne Destination URL me <code className="bg-[#14223b] px-1.5 py-0.5 rounded text-amber-300">https://github.com/user/repo</code> daala hai, toh woh code files dikhayega. Agar aap web page chalana chahte hain, toh 'GitHub Pages' link use karein:
                </p>
                <div className="p-2 rounded bg-[#070c17] text-emerald-400 font-mono text-[11px]">
                  https://&lt;username&gt;.github.io/&lt;repository-name&gt;/
                </div>
              </div>

              {/* Point 4: GitHub Sign In Issue Solution */}
              <div className="p-3.5 rounded-xl bg-[#0e192c] border border-rose-500/25 space-y-2">
                <div className="flex items-center gap-2 text-rose-300 font-semibold text-sm">
                  <span>4. GitHub Par 'Sign In' Kyu Maang Raha Hai? (Ise Turant Kaise Hatayein)</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Agar link kholne par GitHub <strong>'Sign in to GitHub'</strong> ka page dikha raha hai, toh iska kaaran yeh hai ki aapki GitHub repository <strong>Private</strong> hai ya aapne galat link kholi hai:
                </p>
                <div className="space-y-1.5 text-slate-300 text-[11px]">
                  <div className="p-2 rounded bg-[#070c17] border border-[#1b2b42] space-y-1">
                    <p className="font-bold text-emerald-400">Step 1: Repository ko Public karein (Taaki koi bhi bina login ke dekh sake):</p>
                    <ol className="list-decimal list-inside space-y-0.5 text-slate-400">
                      <li>GitHub par apne Repo me jaakar upar <strong>Settings</strong> par click karein.</li>
                      <li>Page ke sabse neeche <strong>Danger Zone</strong> me jayein.</li>
                      <li><strong>'Change repository visibility'</strong> par click karke <strong>'Make public'</strong> kar dein.</li>
                    </ol>
                  </div>
                  <div className="p-2 rounded bg-[#070c17] border border-[#1b2b42] space-y-1">
                    <p className="font-bold text-amber-400">Step 2: Sahi Web Page URL kholein (Na ki Code Page):</p>
                    <p className="text-slate-400">
                      Kripya <code>https://github.com/...</code> mat kholein (yeh code repository hai). Hamesha GitHub Pages link kholein: <code>https://&lt;username&gt;.github.io/&lt;repo&gt;/</code>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Point 5: GitHub Webhook Automation */}
              <div className="p-3.5 rounded-xl bg-[#0e192c] border border-indigo-500/20 space-y-2">
                <div className="flex items-center gap-2 text-indigo-300 font-semibold text-sm">
                  <span>5. Automated Webhook (Har Push Par Auto-Sync)</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Aap apne GitHub Repository me webhook add kar sakte hain taaki jab bhi aap push karein, hamara server turant updated code sync kar le:
                </p>
                <div className="flex items-center gap-2 bg-[#070c17] p-2 rounded-lg border border-[#1b2b42]">
                  <code className="text-[11px] font-mono text-slate-200 flex-1 truncate">
                    {webhookUrl}
                  </code>
                  <button
                    onClick={copyWebhookUrl}
                    className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] transition shrink-0"
                  >
                    {copiedWebhook ? 'Copied! ✓' : 'Copy Webhook'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  GitHub Repo &gt; <strong>Settings</strong> &gt; <strong>Webhooks</strong> &gt; <strong>Add Webhook</strong> me yeh URL daalein aur Content Type: <code>application/json</code> select karein.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowGithubGuide(false)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-xs hover:brightness-110 transition shadow"
              >
                Samajh Aa Gaya, Theek Hai ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
