import React, { useState } from 'react';
import { Globe, ArrowUpRight, ClipboardList, FileSpreadsheet, Copy, Check } from 'lucide-react';

interface WebsiteViewProps {
  previewUrl: string;
  portalUrl: string; // Google Forms Redirect Url
  redirectUrl: string; // Google Sheets Redirect Url
}

export default function WebsiteView({ previewUrl, portalUrl, redirectUrl }: WebsiteViewProps) {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const formatUrl = (url: string) => {
    if (!url) return '#';
    if (/^https?:\/\//i.test(url)) {
      return url;
    }
    return `https://${url}`;
  };

  const handleOpenLink = (url: string) => {
    const formatted = formatUrl(url);
    if (formatted !== '#') {
      window.open(formatted, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCopy = (url: string, key: string) => {
    const formatted = formatUrl(url);
    if (formatted !== '#') {
      navigator.clipboard.writeText(formatted);
      setCopiedUrl(key);
      setTimeout(() => setCopiedUrl(null), 2000);
    }
  };

  const activeSiteUrl = previewUrl || 'https://zyqrodigital.com';

  return (
    <div id="website-view" className="space-y-6 text-[var(--crm-text)] select-none pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[30px] sm:text-[32px] font-bold tracking-tight !text-white text-white font-structure leading-[1.2] section-main-heading">Website Management</h1>
          <p className="!text-white text-white text-sm font-normal italic mt-1 section-sub-heading">
            Access public marketing platforms, Google Forms portals, and data sync ledgers.
          </p>
        </div>
      </div>

      {/* 2. Dashboard Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {/* Marketing Site */}
        <div className="bg-[var(--crm-card)] rounded-[24px] p-6 sm:p-8 border border-[var(--crm-card-border)] shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
          <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-[var(--crm-card-border)] flex items-center justify-center shrink-0 shadow-sm">
            <Globe size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px]  text-[var(--crm-text-muted)]   leading-none mb-1.5">
              Marketing Platform
            </p>
            <p className="text-sm  text-[var(--crm-text)] leading-tight truncate">
              zyqrodigital.com
            </p>
          </div>
        </div>

        {/* Google Forms Portal */}
        <div className="bg-[var(--crm-card)] rounded-[24px] p-6 sm:p-8 border border-[var(--crm-card-border)] shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
          <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-[var(--crm-card-border)] flex items-center justify-center shrink-0 shadow-sm">
            <ClipboardList size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px]  text-[var(--crm-text-muted)]   leading-none mb-1.5">
              Intake Portal
            </p>
            <p className="text-sm  text-[var(--crm-text)] leading-tight">
              Google Forms Connected
            </p>
          </div>
        </div>

        {/* Google Sheets Sync */}
        <div className="bg-[var(--crm-card)] rounded-[24px] p-6 sm:p-8 border border-[var(--crm-card-border)] shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
          <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-[var(--crm-card-border)] flex items-center justify-center shrink-0 shadow-sm">
            <FileSpreadsheet size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px]  text-[var(--crm-text-muted)]   leading-none mb-1.5">
              Lead Sync Ledger
            </p>
            <p className="text-sm  text-[var(--crm-text)] leading-tight">
              Google Sheets Connected
            </p>
          </div>
        </div>
      </div>

      {/* 3. Main Content Hub */}
      <div className="bg-[var(--crm-bg)] rounded-[24px] border-none shadow-sm overflow-hidden p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 4k:grid-cols-7 5k:grid-cols-10 gap-6">
          {/* Live Marketing Site Card */}
          <div className="lg:col-span-2 bg-[var(--crm-sidebar)] rounded-2xl p-6 border border-[var(--crm-card-border)] shadow-xs flex flex-col justify-between space-y-6 hover:shadow-md transition-all">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center border border-indigo-500/20 shadow-xs">
                    <Globe size={24} />
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-[var(--crm-text)]">Live Marketing Platform</h3>
                    <p className="text-xs text-[var(--crm-text-muted)] ">Public Client-Facing Website</p>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-full text-xs font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Active & Live
                </span>
              </div>

              {/* URL Display Bar */}
              <div className="flex items-center justify-between p-3.5 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl text-xs font-mono text-[var(--crm-text)]">
                <span className="truncate mr-2 font-medium">{formatUrl(activeSiteUrl)}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleCopy(activeSiteUrl, 'site')}
                    className="px-3 py-1.5 text-xs font-sans font-medium bg-[var(--crm-card)] hover:bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    {copiedUrl === 'site' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    <span>{copiedUrl === 'site' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--crm-card-border)] flex items-center justify-between">
              <span className="text-xs text-[var(--crm-text-muted)] ">Redirect status verified</span>
              <button
                onClick={() => handleOpenLink(activeSiteUrl)}
                className="px-5 py-2.5 bg-[var(--crm-card)] hover:bg-[var(--crm-sidebar)] text-[var(--crm-text)] border border-[var(--crm-card-border)] font-medium rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-xs hover:shadow-md active:scale-98"
              >
                <span>Visit Live Website</span>
                <ArrowUpRight size={14} />
              </button>
            </div>
          </div>

          {/* Website Redirects Column */}
          <div className="space-y-4">
            <div className="bg-[var(--crm-sidebar)] rounded-2xl p-6 border border-[var(--crm-card-border)] shadow-xs space-y-4 hover:shadow-md transition-all">
              <h3 className="text-[10px] font-medium text-[var(--crm-text-muted)]  ">Workspace Integrations</h3>

              {/* Google Forms Card */}
              <div
                onClick={() => handleOpenLink(portalUrl || 'https://docs.google.com/forms')}
                className="p-4 bg-[var(--crm-card)] hover:bg-[var(--crm-sidebar-active-bg)]/80 rounded-xl border border-[var(--crm-card-border)] hover:border-indigo-500/50 transition-all cursor-pointer group space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-500/10 text-indigo-600 rounded-xl border border-indigo-500/20 shadow-xs">
                      <ClipboardList size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-[var(--crm-text)] group-hover:text-indigo-600 transition-colors">Google Forms</h4>
                      <p className="text-[10px] text-[var(--crm-text-muted)] ">Inbound Intake Portal</p>
                    </div>
                  </div>
                  <ArrowUpRight size={16} className="text-[var(--crm-text-muted)] group-hover:text-indigo-600 transition-colors" />
                </div>
              </div>

              {/* Google Sheets Card */}
              <div
                onClick={() => handleOpenLink(redirectUrl || 'https://docs.google.com/spreadsheets')}
                className="p-4 bg-[var(--crm-card)] hover:bg-[var(--crm-sidebar-active-bg)]/80 rounded-xl border border-[var(--crm-card-border)] hover:border-emerald-500/50 transition-all cursor-pointer group space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl border border-emerald-500/20 shadow-xs">
                      <FileSpreadsheet size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-[var(--crm-text)] group-hover:text-emerald-600 transition-colors">Google Sheets</h4>
                      <p className="text-[10px] text-[var(--crm-text-muted)] ">Lead Data Sync Ledger</p>
                    </div>
                  </div>
                  <ArrowUpRight size={16} className="text-[var(--crm-text-muted)] group-hover:text-emerald-600 transition-colors" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
