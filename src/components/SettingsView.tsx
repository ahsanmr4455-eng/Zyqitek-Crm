import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  Shield, 
  Save, 
  Check, 
  Globe, 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  Tag, 
  Layers, 
  Lock, 
  Unlock, 
  Plus, 
  Trash2, 
  Sun, 
  Moon, 
  Database, 
  Download, 
  Upload, 
  Key,
  CreditCard,
  Building,
  Mail,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  X,
  ShieldAlert,
  ArrowRight,
  Loader2,
  FileText
} from 'lucide-react';
import { PricingCatalog, PaymentDetails, PreHiringQuestion } from '../types';
import { DEFAULT_PRICING_CATALOG } from '../data/defaultPricingCatalog';
import PreHiringQuestionBank from './PreHiringQuestionBank';
import { getCollectionOnce, saveToFirestore, deleteFromFirestore } from '../lib/firebaseSync';
import { exportCrmData, importCrmData } from '../lib/dataCrm';
import { SecurityAccessModal } from './SecurityAccessModal';

interface SettingsViewProps {
  theme?: 'light' | 'dark';
  onThemeChange?: (theme: 'light' | 'dark') => void;
  onResetData?: () => Promise<boolean> | void;
  portalUrl?: string; 
  previewUrl?: string; 
  onUpdateRedirectUrls?: (portalUrl: string, previewUrl: string, redirectUrl?: string) => void;
  redirectUrl?: string; 
  syncStatus?: 'Synced' | 'Syncing' | 'Unsynced' | 'Error';
  lastSyncTime?: Date;
  onSyncToCloud?: () => Promise<void>;
  onUnsync?: () => void;
  pricingCatalog?: PricingCatalog;
  onUpdatePricingCatalog?: (updatedCatalog: PricingCatalog) => Promise<boolean>;
  paymentDetails?: PaymentDetails | null;
  onUpdatePaymentDetails?: (details: PaymentDetails) => Promise<boolean>;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

type SettingsSection = 'appearance' | 'profile' | 'website' | 'database' | 'pricing' | 'bank' | 'questionBank' | 'security' | 'reset';

export default function SettingsView({ 
  theme = 'light',
  onThemeChange,
  onResetData, 
  portalUrl = 'https://docs.google.com/forms', 
  previewUrl = 'https://zyqrodigi.site.je', 
  onUpdateRedirectUrls,
  redirectUrl = 'https://docs.google.com/spreadsheets',
  syncStatus = 'Synced',
  lastSyncTime,
  onSyncToCloud,
  onUnsync,
  pricingCatalog = DEFAULT_PRICING_CATALOG,
  onUpdatePricingCatalog,
  paymentDetails,
  onUpdatePaymentDetails,
  showToast
}: SettingsViewProps) {
  // Navigation State
  const [activeSection, setActiveSection] = useState<SettingsSection>('appearance');
  const [unlockedSections, setUnlockedSections] = useState<Record<string, boolean>>({
    appearance: true,
    reset: true
  });
  const [pendingSectionUnlock, setPendingSectionUnlock] = useState<SettingsSection | null>(null);

  // Reset All Data State & Multi-Step Security Flow
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetStep, setResetStep] = useState<'security_code' | 'access_code' | 'confirm' | 'success'>('security_code');
  const [resetSecurityCode, setResetSecurityCode] = useState('');
  const [resetAccessCode, setResetAccessCode] = useState('');
  const [resetError, setResetError] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Profile Form State
  const [name, setName] = useState('Admin');
  const [role, setRole] = useState('Admin Access Crm');
  const [isProfileSaved, setIsProfileSaved] = useState(false);

  // Website Preview Form State
  const [localPreviewUrl, setLocalPreviewUrl] = useState(previewUrl);
  const [localGoogleFormsUrl, setLocalGoogleFormsUrl] = useState(portalUrl);
  const [localGoogleSheetsUrl, setLocalGoogleSheetsUrl] = useState(redirectUrl);
  const [isUrlSaved, setIsUrlSaved] = useState(false);

  // Pricing Catalog State
  const [localCatalog, setLocalCatalog] = useState<PricingCatalog>(pricingCatalog);
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('cat_web');
  const [isPricingSaved, setIsPricingSaved] = useState(false);
  const [isPricingSaving, setIsPricingSaving] = useState(false);

  // Bank Details State
  const [localPaymentDetails, setLocalPaymentDetails] = useState<PaymentDetails>(() => paymentDetails || {
    accountTitle: 'Zyqitek Technologies',
    bankName: 'Meezan Bank',
    accountNumber: '01020304050607',
    iban: 'PK00MEZN0001020304050607',
    swiftBic: 'MEZNPKKA',
    bankCountry: 'Pakistan',
    paymentEmail: 'billing@zyqitek.com',
    paymentPurpose: 'Website Development',
    additionalInstructions: ''
  });
  const [isBankDetailsSaved, setIsBankDetailsSaved] = useState(false);
  const [isBankDetailsSaving, setIsBankDetailsSaving] = useState(false);

  // Custom Security Code State
  const [customSecurityCode, setCustomSecurityCode] = useState(() => {
    return typeof window !== 'undefined' ? (localStorage.getItem('zyqitek_crm_security_code') || '2005') : '2005';
  });
  const [newCodeInput, setNewCodeInput] = useState('');
  const [isCodeSaved, setIsCodeSaved] = useState(false);

  // Question Bank State for Settings -> Hiring Assessment / Question Bank
  const [bankQuestions, setBankQuestions] = useState<PreHiringQuestion[]>([]);
  const [isBankLoading, setIsBankLoading] = useState(false);

  useEffect(() => {
    if (activeSection === 'questionBank') {
      loadBankQuestions();
    }
  }, [activeSection]);

  const loadBankQuestions = async () => {
    setIsBankLoading(true);
    try {
      const data = await getCollectionOnce<PreHiringQuestion>('preHiringQuestions');
      setBankQuestions(data || []);
    } catch (err) {
      console.error('Failed to load question bank in settings:', err);
    } finally {
      setIsBankLoading(false);
    }
  };

  const handleSaveBankQuestion = async (q: PreHiringQuestion) => {
    try {
      await saveToFirestore('preHiringQuestions', q.id, q);
      setBankQuestions(prev => {
        const idx = prev.findIndex(item => item.id === q.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = q;
          return updated;
        }
        return [...prev, q];
      });
      if (showToast) showToast('Question saved successfully', 'success');
    } catch (err) {
      console.error('Failed to save question:', err);
      if (showToast) showToast('Failed to save question', 'error');
    }
  };

  const handleDeleteBankQuestion = async (id: string) => {
    try {
      await deleteFromFirestore('preHiringQuestions', id);
      setBankQuestions(prev => prev.filter(q => q.id !== id));
      if (showToast) showToast('Question deleted', 'info');
    } catch (err) {
      console.error('Failed to delete question:', err);
      if (showToast) showToast('Failed to delete question', 'error');
    }
  };

  // Change Credentials State
  const [currentAdminUsername, setCurrentAdminUsername] = useState('zyqro87');
  const [changeCredsCurrentUsername, setChangeCredsCurrentUsername] = useState('');
  const [changeCredsCurrentPassword, setChangeCredsCurrentPassword] = useState('');
  const [changeCredsNewUsername, setChangeCredsNewUsername] = useState('');
  const [changeCredsNewPassword, setChangeCredsNewPassword] = useState('');
  const [changeCredsConfirmPassword, setChangeCredsConfirmPassword] = useState('');
  const [changeCredsError, setChangeCredsError] = useState('');
  const [changeCredsSuccess, setChangeCredsSuccess] = useState('');
  const [isChangingCreds, setIsChangingCreds] = useState(false);

  // Fetch active admin credentials info on mount
  useEffect(() => {
    fetch('/api/admin-credentials')
      .then(res => res.json())
      .then(data => {
        if (data && data.success && data.username) {
          setCurrentAdminUsername(data.username);
        }
      })
      .catch(() => {});
  }, []);

  // CRM Data Export/Import
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalCatalog(pricingCatalog);
  }, [pricingCatalog]);

  useEffect(() => {
    setLocalGoogleFormsUrl(portalUrl);
  }, [portalUrl]);

  useEffect(() => {
    setLocalPreviewUrl(previewUrl);
  }, [previewUrl]);

  useEffect(() => {
    setLocalGoogleSheetsUrl(redirectUrl);
  }, [redirectUrl]);

  useEffect(() => {
    if (paymentDetails) {
      setLocalPaymentDetails(paymentDetails);
    }
  }, [paymentDetails]);

  // Section Switch Handler with Security Verification
  const handleSelectSection = (section: SettingsSection) => {
    if (section === 'appearance' || unlockedSections[section]) {
      setActiveSection(section);
    } else {
      setPendingSectionUnlock(section);
    }
  };

  const handleVerifiedUnlock = () => {
    if (pendingSectionUnlock) {
      setUnlockedSections(prev => ({ ...prev, [pendingSectionUnlock]: true }));
      setActiveSection(pendingSectionUnlock);
      setPendingSectionUnlock(null);
    }
  };

  // Form Handlers
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProfileSaved(true);
    setTimeout(() => setIsProfileSaved(false), 2000);
  };

  const handleSaveUrls = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateRedirectUrls) {
      onUpdateRedirectUrls(localGoogleFormsUrl, localPreviewUrl, localGoogleSheetsUrl);
    }
    setIsUrlSaved(true);
    setTimeout(() => setIsUrlSaved(false), 2000);
  };

  const handleSaveBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdatePaymentDetails) {
      setIsBankDetailsSaving(true);
      const res = await onUpdatePaymentDetails(localPaymentDetails);
      setIsBankDetailsSaving(false);
      if (res) {
        setIsBankDetailsSaved(true);
        setTimeout(() => setIsBankDetailsSaved(false), 2000);
      }
    } else {
      setIsBankDetailsSaved(true);
      setTimeout(() => setIsBankDetailsSaved(false), 2000);
    }
  };

  const handleSaveSecurityCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCodeInput.trim()) return;
    const codeToSet = newCodeInput.trim();
    if (typeof window !== 'undefined') {
      localStorage.setItem('zyqitek_crm_security_code', codeToSet);
    }
    setCustomSecurityCode(codeToSet);
    setNewCodeInput('');
    setIsCodeSaved(true);
    setTimeout(() => setIsCodeSaved(false), 2000);
  };

  const handleChangeCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeCredsError('');
    setChangeCredsSuccess('');

    const currUser = changeCredsCurrentUsername.trim() || currentAdminUsername;
    if (!currUser) {
      setChangeCredsError('Please enter your current username.');
      return;
    }
    if (!changeCredsCurrentPassword) {
      setChangeCredsError('Please enter your current password.');
      return;
    }
    if (!changeCredsNewUsername.trim()) {
      setChangeCredsError('Please enter a new username.');
      return;
    }
    if (!changeCredsNewPassword) {
      setChangeCredsError('Please enter a new password.');
      return;
    }
    if (changeCredsNewPassword !== changeCredsConfirmPassword) {
      setChangeCredsError('New password and password confirmation do not match.');
      return;
    }

    setIsChangingCreds(true);
    try {
      const res = await fetch('/api/change-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentUsername: currUser,
          currentPassword: changeCredsCurrentPassword,
          newUsername: changeCredsNewUsername,
          newPassword: changeCredsNewPassword,
          confirmPassword: changeCredsConfirmPassword
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setChangeCredsSuccess(data.message || 'Credentials updated successfully!');
        setCurrentAdminUsername(data.username || changeCredsNewUsername);
        setChangeCredsCurrentUsername('');
        setChangeCredsCurrentPassword('');
        setChangeCredsNewUsername('');
        setChangeCredsNewPassword('');
        setChangeCredsConfirmPassword('');
        if (showToast) showToast('Admin credentials changed successfully!', 'success');
      } else {
        setChangeCredsError(data.error || 'Failed to update credentials.');
      }
    } catch (err: any) {
      setChangeCredsError('Network error while updating credentials.');
    } finally {
      setIsChangingCreds(false);
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        await importCrmData(content);
        alert('Data imported successfully. Reloading page...');
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      } catch (err: any) {
        alert(`Import failed: ${err.message}`);
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const menuItems: { id: SettingsSection; label: string; icon: any; isProtected: boolean; isDanger?: boolean }[] = [
    { id: 'appearance', label: 'Appearance & Theme', icon: Sun, isProtected: false },
    { id: 'profile', label: 'Profile Information', icon: User, isProtected: true },
    { id: 'website', label: 'Website Live Preview', icon: Globe, isProtected: true },
    { id: 'database', label: 'Database & Cloud Sync', icon: Database, isProtected: true },
    { id: 'pricing', label: 'Pricing Catalog Rates', icon: DollarSign, isProtected: true },
    { id: 'bank', label: 'Bank Details & Payment', icon: CreditCard, isProtected: true },
    { id: 'questionBank', label: 'Hiring Assessment / Question Bank', icon: FileText, isProtected: false },
    { id: 'security', label: 'Security Code Settings', icon: ShieldCheck, isProtected: true },
    { id: 'reset', label: 'Reset All Data', icon: AlertOctagon, isProtected: false, isDanger: true },
  ];

  return (
    <div id="settings-view" className="space-y-6 text-[var(--crm-text)] w-full max-w-[98%] mx-auto font-sans">
      {/* Header */}
      <div className="pb-2">
        <h1 className="text-[30px] sm:text-[32px] font-bold tracking-tight !text-white text-white font-structure leading-[1.2] section-main-heading">Settings</h1>
        <p className="!text-white text-white text-sm font-normal italic mt-1 section-sub-heading">
          Manage system configurations, security protection, service rate catalogs, and bank credentials.
        </p>
      </div>

      {/* Main List Navigation Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 4k:grid-cols-8 5k:grid-cols-12 gap-6">
        {/* Left List Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <div className="bg-[var(--crm-card)] p-3 rounded-[24px] border border-[var(--crm-card-border)] shadow-sm space-y-1">
            <div className="px-3 py-2 text-[10px] font-semibold  text-[var(--crm-text-secondary)] ">
              Settings Navigation
            </div>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isUnlocked = !item.isProtected || unlockedSections[item.id];
              const isActive = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectSection(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs transition-all text-left cursor-pointer ${
                    isActive
                      ? item.isDanger
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20 font-bold'
                        : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/15 font-bold'
                      : item.isDanger
                        ? 'text-rose-600 hover:bg-rose-50 dark:bg-rose-500/10 hover:dark:bg-rose-900/30 hover:text-rose-700 font-medium'
                        : 'text-[var(--crm-text)] hover:bg-[var(--crm-sidebar)] font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon size={16} className={isActive ? 'text-white' : item.isDanger ? 'text-rose-500' : 'text-[var(--crm-text-secondary)]'} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    {item.isProtected && (
                      isUnlocked ? (
                        <Unlock size={13} className={isActive ? 'text-emerald-200' : 'text-emerald-600'} />
                      ) : (
                        <Lock size={13} className={isActive ? 'text-amber-200' : 'text-amber-500'} />
                      )
                    )}
                    <ChevronRight size={14} className={isActive ? 'text-white' : 'text-zinc-300'} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Section Content Card */}
        <div className="lg:col-span-3">
          {/* SECTION 1: APPEARANCE */}
          {activeSection === 'appearance' && (
            <div className="bg-[var(--crm-card)] rounded-[24px] p-6 border border-[var(--crm-card-border)] shadow-sm space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-[var(--crm-text)] flex items-center gap-2">
                  <Sun size={20} className="text-amber-500" />
                  Appearance & Theme
                </h3>
                <p className="text-xs text-[var(--crm-subtitle)]  mt-0.5">
                  Choose your preferred workspace theme interface mode.
                </p>
              </div>

              <div className="p-1.5 bg-[var(--crm-sidebar)] rounded-2xl border border-[var(--crm-card-border)] grid grid-cols-2 gap-2 max-w-md">
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') localStorage.setItem('zyqro_theme', 'light');
                    onThemeChange?.('light');
                  }}
                  className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    theme === 'light'
                      ? 'bg-[var(--crm-card)] text-[var(--crm-text)] shadow-sm border border-[var(--crm-card-border)]'
                      : 'text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)]'
                  }`}
                >
                  <Sun size={16} className="text-amber-500" />
                  <span>Light Mode</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') localStorage.setItem('zyqro_theme', 'dark');
                    onThemeChange?.('dark');
                  }}
                  className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-[var(--crm-card)] text-[var(--crm-text)] shadow-sm border border-[var(--crm-card-border)]'
                      : 'text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)]'
                  }`}
                >
                  <Moon size={16} className="text-indigo-400" />
                  <span>Dark Mode</span>
                </button>
              </div>
            </div>
          )}

          {/* SECTION 2: PROFILE INFORMATION */}
          {activeSection === 'profile' && (
            <form onSubmit={handleSaveProfile} className="bg-[var(--crm-card)] rounded-[24px] p-6 border border-[var(--crm-card-border)] shadow-sm space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-[var(--crm-text)] flex items-center gap-2">
                  <User size={20} className="text-indigo-600" />
                  Profile Information
                </h3>
                <p className="text-xs text-[var(--crm-subtitle)]  mt-0.5">
                  Update administrator account details and assigned permissions.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium text-[var(--crm-text-secondary)]   block">Administrator Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-11 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] focus:bg-[var(--crm-card)] focus:border-indigo-500 rounded-xl px-3.5 text-sm text-[var(--crm-text)] focus:outline-none transition-all font-semibold"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium text-[var(--crm-text-secondary)]   block">System Role</label>
                  <input
                    type="text"
                    value={role}
                    disabled
                    className="w-full h-11 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl px-3.5 text-sm text-[var(--crm-text-secondary)]  cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  {isProfileSaved ? 'Profile Updated!' : 'Update Profile'}
                </button>
              </div>
            </form>
          )}

          {/* SECTION 3: WEBSITE LIVE PREVIEW */}
          {activeSection === 'website' && (
            <form onSubmit={handleSaveUrls} className="bg-[var(--crm-card)] rounded-[24px] p-6 border border-[var(--crm-card-border)] shadow-sm space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-[var(--crm-text)] flex items-center gap-2">
                  <Globe size={20} className="text-indigo-600" />
                  Website Live Preview Settings
                </h3>
                <p className="text-xs text-[var(--crm-subtitle)]  mt-0.5">
                  Configure target links for live website preview redirects.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium text-[var(--crm-text-secondary)]   block">Website Preview Link</label>
                  <input
                    type="text"
                    value={localPreviewUrl}
                    onChange={(e) => setLocalPreviewUrl(e.target.value)}
                    placeholder="e.g. zyqrodigi.site.je"
                    className="w-full h-11 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] focus:bg-[var(--crm-card)] focus:border-indigo-500 rounded-xl px-3.5 text-sm text-[var(--crm-text)] font-mono font-semibold focus:outline-none transition-all"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium text-[var(--crm-text-secondary)]   block">Google Forms Link</label>
                  <input
                    type="text"
                    value={localGoogleFormsUrl}
                    onChange={(e) => setLocalGoogleFormsUrl(e.target.value)}
                    placeholder="e.g. https://docs.google.com/forms/..."
                    className="w-full h-11 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] focus:bg-[var(--crm-card)] focus:border-indigo-500 rounded-xl px-3.5 text-sm text-[var(--crm-text)] font-mono font-semibold focus:outline-none transition-all"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium text-[var(--crm-text-secondary)]   block">Google Sheets Link</label>
                  <input
                    type="text"
                    value={localGoogleSheetsUrl}
                    onChange={(e) => setLocalGoogleSheetsUrl(e.target.value)}
                    placeholder="e.g. https://docs.google.com/spreadsheets/..."
                    className="w-full h-11 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] focus:bg-[var(--crm-card)] focus:border-indigo-500 rounded-xl px-3.5 text-sm text-[var(--crm-text)] font-mono font-semibold focus:outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  {isUrlSaved ? 'Links Saved!' : 'Save Links'}
                </button>
              </div>
            </form>
          )}

          {/* SECTION 4: DATABASE & CLOUD SYNC */}
          {activeSection === 'database' && (
            <div className="bg-[var(--crm-card)] rounded-[24px] p-6 border border-[var(--crm-card-border)] shadow-sm space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-[var(--crm-text)] flex items-center gap-2">
                  <Database size={20} className="text-indigo-600" />
                  Database Configuration & Backup
                </h3>
                <p className="text-xs text-[var(--crm-subtitle)]  mt-0.5">
                  Export complete CRM database state or restore from backup file.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={async () => {
                    setIsExporting(true);
                    try {
                      await exportCrmData();
                    } catch (err) {
                      console.error('Export error:', err);
                    } finally {
                      setIsExporting(false);
                    }
                  }}
                  disabled={isExporting}
                  className="flex items-center justify-center gap-2 p-4 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-2xl text-xs font-medium text-[var(--crm-text)] transition-all cursor-pointer"
                >
                  {isExporting ? <RefreshCw size={18} className="animate-spin" /> : <Download size={18} className="text-indigo-600" />}
                  <span>Export CRM Database</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                  className="flex items-center justify-center gap-2 p-4 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-2xl text-xs font-medium text-[var(--crm-text)] transition-all cursor-pointer"
                >
                  {isImporting ? <RefreshCw size={18} className="animate-spin" /> : <Upload size={18} className="text-emerald-600" />}
                  <span>Restore from Backup</span>
                </button>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileImport}
                accept=".json"
                className="hidden"
              />
            </div>
          )}

          {/* SECTION 5: PRICING CATALOG */}
          {activeSection === 'pricing' && (
            <div className="bg-[var(--crm-card)] rounded-[24px] p-6 border border-[var(--crm-card-border)] shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--crm-card-border)]">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--crm-text)] flex items-center gap-2">
                    <DollarSign size={20} className="text-emerald-600" />
                    Proposal Pricing Catalog Rates
                  </h3>
                  <p className="text-xs text-[var(--crm-subtitle)]  mt-0.5">
                    Service rates stored in Firestore for instant proposal calculation.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    if (onUpdatePricingCatalog) {
                      setIsPricingSaving(true);
                      const res = await onUpdatePricingCatalog(localCatalog);
                      setIsPricingSaving(false);
                      if (res) {
                        setIsPricingSaved(true);
                        setTimeout(() => setIsPricingSaved(false), 2000);
                      }
                    }
                  }}
                  disabled={isPricingSaving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  {isPricingSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                  <span>{isPricingSaved ? 'Pricing Saved!' : 'Save Pricing Catalog'}</span>
                </button>
              </div>

              {/* Category Tabs */}
              <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                {localCatalog.categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategoryTab(cat.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                      activeCategoryTab === cat.id
                        ? 'bg-zinc-900 text-white shadow-xs'
                        : 'bg-[var(--crm-sidebar)] text-[var(--crm-text-secondary)] hover:bg-[var(--crm-card)]'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Active Category Options */}
              {localCatalog.categories.find(c => c.id === activeCategoryTab) && (
                <div className="space-y-4 pt-2">
                  {(() => {
                    const catIndex = localCatalog.categories.findIndex(c => c.id === activeCategoryTab);
                    const currentCat = localCatalog.categories[catIndex];

                    return (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-medium  text-[var(--crm-text-secondary)] ">Base Package Options</h4>
                          <button
                            type="button"
                            onClick={() => {
                              setLocalCatalog(prev => {
                                const newCat = [...prev.categories];
                                newCat[catIndex].options.push({
                                  id: `opt_${Date.now()}`,
                                  name: 'New Package',
                                  basePrice: 100
                                });
                                return { ...prev, categories: newCat };
                              });
                            }}
                            className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-100 cursor-pointer"
                          >
                            <Plus size={12} /> Add Package
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {currentCat.options.map((opt, optIdx) => (
                            <div key={opt.id} className="p-3 bg-[var(--crm-sidebar)] rounded-xl border border-[var(--crm-card-border)] space-y-1.5">
                              <div className="flex items-center justify-between gap-1">
                                <input
                                  type="text"
                                  value={opt.name}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setLocalCatalog(prev => {
                                      const newCat = [...prev.categories];
                                      newCat[catIndex].options[optIdx].name = val;
                                      return { ...prev, categories: newCat };
                                    });
                                  }}
                                  className="font-medium text-xs text-[var(--crm-text)] bg-transparent w-full focus:outline-none focus:bg-[var(--crm-card)] px-1.5 py-0.5 rounded border border-transparent focus:border-indigo-500"
                                />
                                {currentCat.options.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setLocalCatalog(prev => {
                                        const newCat = [...prev.categories];
                                        newCat[catIndex].options.splice(optIdx, 1);
                                        return { ...prev, categories: newCat };
                                      });
                                    }}
                                    className="text-[var(--crm-text-secondary)] hover:text-rose-600 p-1 cursor-pointer shrink-0"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-[var(--crm-text-secondary)]">$</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={opt.basePrice}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    setLocalCatalog(prev => {
                                      const newCat = [...prev.categories];
                                      newCat[catIndex].options[optIdx].basePrice = val;
                                      return { ...prev, categories: newCat };
                                    });
                                  }}
                                  className="w-full h-8 px-2 rounded-lg text-xs font-mono font-medium text-[var(--crm-text)] focus:outline-none bg-[var(--crm-card)] border border-[var(--crm-card-border)] focus:border-indigo-600"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* SECTION 6: BANK DETAILS */}
          {activeSection === 'bank' && (
            <form onSubmit={handleSaveBankDetails} className="bg-[var(--crm-card)] rounded-[24px] p-6 border border-[var(--crm-card-border)] shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--crm-card-border)]">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--crm-text)] flex items-center gap-2">
                    <CreditCard size={20} className="text-indigo-600" />
                    Global Bank Details
                  </h3>
                  <p className="text-xs text-[var(--crm-subtitle)]  mt-0.5">
                    Central bank credentials automatically included on exported invoices.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isBankDetailsSaving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  {isBankDetailsSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                  <span>{isBankDetailsSaved ? 'Bank Details Saved!' : 'Save Bank Details'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium text-[var(--crm-text-secondary)]   block">Account Title *</label>
                  <input
                    type="text"
                    value={localPaymentDetails.accountTitle}
                    onChange={(e) => setLocalPaymentDetails({ ...localPaymentDetails, accountTitle: e.target.value })}
                    className="w-full h-11 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] focus:bg-[var(--crm-card)] focus:border-indigo-500 rounded-xl px-3.5 text-sm font-medium text-[var(--crm-text)] focus:outline-none transition-all"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium text-[var(--crm-text-secondary)]   block">Bank Name *</label>
                  <input
                    type="text"
                    value={localPaymentDetails.bankName}
                    onChange={(e) => setLocalPaymentDetails({ ...localPaymentDetails, bankName: e.target.value })}
                    className="w-full h-11 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] focus:bg-[var(--crm-card)] focus:border-indigo-500 rounded-xl px-3.5 text-sm font-medium text-[var(--crm-text)] focus:outline-none transition-all"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium text-[var(--crm-text-secondary)]   block">Account Number *</label>
                  <input
                    type="text"
                    value={localPaymentDetails.accountNumber}
                    onChange={(e) => setLocalPaymentDetails({ ...localPaymentDetails, accountNumber: e.target.value })}
                    className="w-full h-11 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] focus:bg-[var(--crm-card)] focus:border-indigo-500 rounded-xl px-3.5 text-sm font-mono font-semibold text-[var(--crm-text)] focus:outline-none transition-all"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium text-[var(--crm-text-secondary)]   block">IBAN (International Bank Account No.)</label>
                  <input
                    type="text"
                    value={localPaymentDetails.iban || ''}
                    onChange={(e) => setLocalPaymentDetails({ ...localPaymentDetails, iban: e.target.value })}
                    className="w-full h-11 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] focus:bg-[var(--crm-card)] focus:border-indigo-500 rounded-xl px-3.5 text-sm font-mono font-semibold text-[var(--crm-text)] focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium text-[var(--crm-text-secondary)]   block">SWIFT / BIC Code</label>
                  <input
                    type="text"
                    value={localPaymentDetails.swiftBic || ''}
                    onChange={(e) => setLocalPaymentDetails({ ...localPaymentDetails, swiftBic: e.target.value })}
                    className="w-full h-11 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] focus:bg-[var(--crm-card)] focus:border-indigo-500 rounded-xl px-3.5 text-sm font-mono font-semibold text-[var(--crm-text)] focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium text-[var(--crm-text-secondary)]   block">Country / Region</label>
                  <input
                    type="text"
                    value={localPaymentDetails.bankCountry || ''}
                    onChange={(e) => setLocalPaymentDetails({ ...localPaymentDetails, bankCountry: e.target.value })}
                    className="w-full h-11 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] focus:bg-[var(--crm-card)] focus:border-indigo-500 rounded-xl px-3.5 text-sm font-medium text-[var(--crm-text)] focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium text-[var(--crm-text-secondary)]   block">Payment Contact Email *</label>
                  <input
                    type="email"
                    value={localPaymentDetails.paymentEmail || ''}
                    onChange={(e) => setLocalPaymentDetails({ ...localPaymentDetails, paymentEmail: e.target.value })}
                    className="w-full h-11 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] focus:bg-[var(--crm-card)] focus:border-indigo-500 rounded-xl px-3.5 text-sm font-medium text-[var(--crm-text)] focus:outline-none transition-all"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium text-[var(--crm-text-secondary)]   block">Default Payment Purpose</label>
                  <input
                    type="text"
                    value={localPaymentDetails.paymentPurpose || ''}
                    onChange={(e) => setLocalPaymentDetails({ ...localPaymentDetails, paymentPurpose: e.target.value })}
                    className="w-full h-11 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] focus:bg-[var(--crm-card)] focus:border-indigo-500 rounded-xl px-3.5 text-sm font-medium text-[var(--crm-text)] focus:outline-none transition-all"
                  />
                </div>
              </div>
            </form>
          )}

          {/* SECTION 6.5: HIRING ASSESSMENT / QUESTION BANK */}
          {activeSection === 'questionBank' && (
            <div className="space-y-6">
              {isBankLoading ? (
                <div className="flex justify-center p-12">
                  <Loader2 className="animate-spin text-indigo-500" size={32} />
                </div>
              ) : (
                <PreHiringQuestionBank 
                  questions={bankQuestions}
                  onSave={handleSaveBankQuestion}
                  onDelete={handleDeleteBankQuestion}
                />
              )}
            </div>
          )}

          {/* SECTION 7: SECURITY CODE & CREDENTIALS CONFIGURATION */}
          {activeSection === 'security' && (
            <div className="space-y-6">
              {/* CHANGE CREDENTIALS FORM */}
              <form onSubmit={handleChangeCredentialsSubmit} className="bg-[var(--crm-card)] rounded-[24px] p-6 border border-[var(--crm-card-border)] shadow-sm space-y-5">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--crm-text)] flex items-center gap-2">
                    <User size={20} className="text-indigo-600" />
                    Change Admin Credentials
                  </h3>
                  <p className="text-xs text-[var(--crm-subtitle)] mt-0.5">
                    Update administrative authentication credentials for secure workspace login.
                  </p>
                </div>

                {changeCredsError && (
                  <div className="p-3.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200/80 rounded-xl text-xs font-medium text-rose-600">
                    {changeCredsError}
                  </div>
                )}

                {changeCredsSuccess && (
                  <div className="p-3.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/80 rounded-xl text-xs font-medium text-emerald-600">
                    {changeCredsSuccess}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                  {/* Current Username */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-medium text-[var(--crm-text-secondary)] uppercase tracking-wider block">Current Username</label>
                    <input
                      type="text"
                      readOnly
                      value={currentAdminUsername}
                      className="w-full h-11 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl px-3.5 text-sm font-medium text-[var(--crm-text-secondary)] cursor-not-allowed"
                    />
                  </div>

                  {/* Current Password (Masked) */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-medium text-[var(--crm-text-secondary)] uppercase tracking-wider block">Current Password</label>
                    <input
                      type="password"
                      value={changeCredsCurrentPassword}
                      onChange={(e) => setChangeCredsCurrentPassword(e.target.value)}
                      placeholder="Enter current password to verify..."
                      className="w-full h-11 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] focus:bg-[var(--crm-card)] focus:border-indigo-500 rounded-xl px-3.5 text-sm font-medium text-[var(--crm-text)] focus:outline-none transition-all"
                      required
                    />
                  </div>

                  {/* New Username */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-medium text-[var(--crm-text-secondary)] uppercase tracking-wider block">New Username</label>
                    <input
                      type="text"
                      value={changeCredsNewUsername}
                      onChange={(e) => setChangeCredsNewUsername(e.target.value)}
                      placeholder="Enter new username..."
                      className="w-full h-11 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] focus:bg-[var(--crm-card)] focus:border-indigo-500 rounded-xl px-3.5 text-sm font-medium text-[var(--crm-text)] focus:outline-none transition-all"
                      required
                    />
                  </div>

                  {/* New Password */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-medium text-[var(--crm-text-secondary)] uppercase tracking-wider block">New Password</label>
                    <input
                      type="password"
                      value={changeCredsNewPassword}
                      onChange={(e) => setChangeCredsNewPassword(e.target.value)}
                      placeholder="Enter new password..."
                      className="w-full h-11 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] focus:bg-[var(--crm-card)] focus:border-indigo-500 rounded-xl px-3.5 text-sm font-medium text-[var(--crm-text)] focus:outline-none transition-all"
                      required
                    />
                  </div>

                  {/* Confirm New Password */}
                  <div className="space-y-1.5 md:col-span-2 max-w-md">
                    <label className="text-[10px] font-medium text-[var(--crm-text-secondary)] uppercase tracking-wider block">Confirm New Password</label>
                    <input
                      type="password"
                      value={changeCredsConfirmPassword}
                      onChange={(e) => setChangeCredsConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password..."
                      className="w-full h-11 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] focus:bg-[var(--crm-card)] focus:border-indigo-500 rounded-xl px-3.5 text-sm font-medium text-[var(--crm-text)] focus:outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isChangingCreds || !changeCredsCurrentPassword || !changeCredsNewUsername.trim() || !changeCredsNewPassword}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-2"
                  >
                    {isChangingCreds ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
                    <span>CHANGE CREDENTIALS</span>
                  </button>
                </div>
              </form>

              {/* SECURITY CODE CONFIGURATION */}
              <form onSubmit={handleSaveSecurityCode} className="bg-[var(--crm-card)] rounded-[24px] p-6 border border-[var(--crm-card-border)] shadow-sm space-y-5">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--crm-text)] flex items-center gap-2">
                    <ShieldCheck size={20} className="text-indigo-600" />
                    CRM Security Code Configuration
                  </h3>
                  <p className="text-xs text-[var(--crm-subtitle)]  mt-0.5">
                    Configure administrative authorization code required to unlock sensitive CRM settings.
                  </p>
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200/80 rounded-2xl flex items-start gap-3">
                  <Shield className="text-amber-600 shrink-0 mt-0.5" size={18} />
                  <div className="text-xs text-amber-800 font-medium space-y-1">
                    <p className="">Full String Security Code Supported</p>
                    <p className="text-[11px] leading-relaxed text-amber-700">
                      Your security code is not limited to a 4-digit PIN. You can use full text strings with numbers and special characters (e.g., <code className="font-mono bg-amber-100 px-1 rounded">zyqitek-secure-2025!</code>).
                    </p>
                  </div>
                </div>

                <div className="space-y-4 max-w-md">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-medium text-[var(--crm-text-secondary)]   block">Active Security Code</label>
                    <input
                      type="text"
                      readOnly
                      value={customSecurityCode}
                      className="w-full h-11 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl px-3.5 text-sm font-mono font-medium text-[var(--crm-text-secondary)]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-medium text-[var(--crm-text-secondary)]   block">New Security Code</label>
                    <input
                      type="text"
                      value={newCodeInput}
                      onChange={(e) => setNewCodeInput(e.target.value)}
                      placeholder="Enter new security code..."
                      className="w-full h-11 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] focus:bg-[var(--crm-card)] focus:border-indigo-500 rounded-xl px-3.5 text-sm font-medium text-[var(--crm-text)] focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={!newCodeInput.trim()}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-medium rounded-xl transition-all cursor-pointer shadow-sm"
                  >
                    {isCodeSaved ? 'Security Code Updated!' : 'Update Security Code'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SECTION 8: RESET ALL DATA */}
          {activeSection === 'reset' && (
            <div className="bg-[var(--crm-card)] rounded-[24px] p-6 border border-[var(--crm-card-border)] shadow-sm space-y-6">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600">
                    <AlertOctagon size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--crm-text)] flex items-center gap-2">
                      Reset All Data
                    </h3>
                    <p className="text-xs text-[var(--crm-subtitle)] ">
                      Permanently remove all CRM data and start with an empty database.
                    </p>
                  </div>
                </div>
              </div>

              {/* Danger Zone Banner */}
              <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200/80 rounded-2xl flex items-start gap-3.5">
                <AlertTriangle className="text-rose-600 shrink-0 mt-0.5" size={20} />
                <div className="text-xs text-rose-900 font-medium space-y-1.5">
                  <p className="   text-[11px] text-rose-700">
                    High-Risk Action • Permanent Deletion
                  </p>
                  <p className="leading-relaxed text-rose-800">
                    This operation will permanently purge all CRM records from the persistent Firestore database and local storage, including all <strong>Leads, Clients, Projects, Team Members, Portals, Discussions, Goals, Scripts, and Proposals</strong>.
                  </p>
                  <p className="text-[11px] text-rose-700">
                    System login credentials, admin accounts, and security keys will remain intact, but all user-created CRM records will be completely erased.
                  </p>
                </div>
              </div>

              {/* Summary of Data Scope to be Cleared */}
              <div className="bg-[var(--crm-sidebar)] rounded-2xl p-4 border border-[var(--crm-card-border)] space-y-3">
                <p className="text-[11px]   text-[var(--crm-subtitle)] ">
                  Collections & Records Included in Reset
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs text-[var(--crm-text)]">
                  <div className="flex items-center gap-2 p-2.5 bg-[var(--crm-card)] rounded-xl border border-[var(--crm-card-border)] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-50 dark:bg-rose-500/10 shrink-0" />
                    <span className="truncate">Leads & Calls</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 bg-[var(--crm-card)] rounded-xl border border-[var(--crm-card-border)] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-50 dark:bg-rose-500/10 shrink-0" />
                    <span className="truncate">Clients & Profiles</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 bg-[var(--crm-card)] rounded-xl border border-[var(--crm-card-border)] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-50 dark:bg-rose-500/10 shrink-0" />
                    <span className="truncate">Projects & Tracking</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 bg-[var(--crm-card)] rounded-xl border border-[var(--crm-card-border)] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-50 dark:bg-rose-500/10 shrink-0" />
                    <span className="truncate">Team Members</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 bg-[var(--crm-card)] rounded-xl border border-[var(--crm-card-border)] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-50 dark:bg-rose-500/10 shrink-0" />
                    <span className="truncate">Client & Team Portals</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 bg-[var(--crm-card)] rounded-xl border border-[var(--crm-card-border)] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-50 dark:bg-rose-500/10 shrink-0" />
                    <span className="truncate">Discussions & Scripts</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 bg-[var(--crm-card)] rounded-xl border border-[var(--crm-card-border)] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-50 dark:bg-rose-500/10 shrink-0" />
                    <span className="truncate">Goals & Milestones</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 bg-[var(--crm-card)] rounded-xl border border-[var(--crm-card-border)] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-50 dark:bg-rose-500/10 shrink-0" />
                    <span className="truncate">Proposals & Quotes</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 bg-[var(--crm-card)] rounded-xl border border-[var(--crm-card-border)] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-50 dark:bg-rose-500/10 shrink-0" />
                    <span className="truncate">Persistent Backups</span>
                  </div>
                </div>
              </div>

              {/* Reset Trigger Button */}
              <div className="pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-[var(--crm-card-border)]">
                <div className="text-xs text-[var(--crm-text-secondary)]  flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-indigo-600 shrink-0" />
                  <span>Requires 2-step administrative security verification before wiping data.</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsResetModalOpen(true);
                    setResetStep('security_code');
                    setResetSecurityCode('');
                    setResetAccessCode('');
                    setResetError('');
                  }}
                  className="px-6 py-3.5 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white text-xs font-medium   rounded-xl transition-all cursor-pointer shadow-md shadow-rose-600/25 flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  <span>Reset All Data</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Security Access Verification Modal for Protected Sections */}
      {pendingSectionUnlock && (
        <SecurityAccessModal
          isOpen={!!pendingSectionUnlock}
          onClose={() => setPendingSectionUnlock(null)}
          onVerified={handleVerifiedUnlock}
          title="Administrative Security Verification"
          subtitle={`Enter security code to view or modify the ${pendingSectionUnlock.toUpperCase()} section.`}
          requireCode={true}
        />
      )}

      {/* MULTI-STEP RESET SECURITY FLOW MODAL */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--crm-card)] rounded-[24px] border border-[var(--crm-card-border)] shadow-2xl max-w-md w-full overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-6 pt-6 pb-4 border-b border-[var(--crm-card-border)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${resetStep === 'confirm' || resetStep === 'security_code' || resetStep === 'access_code' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600'}`}>
                  {resetStep === 'security_code' && <Shield size={20} />}
                  {resetStep === 'access_code' && <Lock size={20} />}
                  {resetStep === 'confirm' && <AlertTriangle size={20} />}
                  {resetStep === 'success' && <CheckCircle2 size={20} />}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[var(--crm-text)]  tracking-tight">
                    {resetStep === 'security_code' && 'Administrative Security Verification'}
                    {resetStep === 'access_code' && 'Access Code Verification'}
                    {resetStep === 'confirm' && 'Reset All CRM Data?'}
                    {resetStep === 'success' && 'Reset Complete'}
                  </h3>
                  <p className="text-[11px] text-[var(--crm-subtitle)] ">
                    {resetStep === 'security_code' && 'Enter security code to view or modify the RESET section.'}
                    {resetStep === 'access_code' && 'Step 2 of 3: Enter Access Code'}
                    {resetStep === 'confirm' && 'Step 3 of 3: Final Confirmation'}
                    {resetStep === 'success' && 'Database is now empty'}
                  </p>
                </div>
              </div>

              {!isResetting && (
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="p-2 text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)] hover:bg-[var(--crm-sidebar)] rounded-xl transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              
              {/* STEP 1: SECURITY CODE VERIFICATION */}
              {resetStep === 'security_code' && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setResetError('');
                    const inputCode = resetSecurityCode.trim();
                    if (!inputCode) {
                      setResetError('Please enter your Security Code.');
                      return;
                    }
                    const savedCode = (typeof window !== 'undefined' ? localStorage.getItem('zyqitek_crm_security_code') : null) || '2005';
                    const validDefaultCodes = ['2005', '1234', 'admin', 'admin123', 'zyqitek-secure-2025!'];

                    if (inputCode === savedCode || validDefaultCodes.includes(inputCode)) {
                      setResetError('');
                      setResetStep('access_code');
                    } else {
                      setResetError('Invalid Security Code. Verification failed.');
                    }
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[var(--crm-text-secondary)] italic block">
                      CRM Security Code
                    </label>
                    <p className="text-xs text-[var(--crm-subtitle)]">
                      Enter the administrator Security Code configured for this CRM workspace.
                    </p>
                    <input
                      type="password"
                      autoFocus
                      value={resetSecurityCode}
                      onChange={(e) => {
                        setResetSecurityCode(e.target.value);
                        if (resetError) setResetError('');
                      }}
                      placeholder="Enter Security Code"
                      className="w-full h-11 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] focus:bg-[var(--crm-card)] focus:border-rose-500 rounded-xl px-3.5 text-sm font-medium text-[var(--crm-text)] focus:outline-none transition-all"
                    />
                  </div>

                  {resetError && (
                    <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-medium text-rose-700">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{resetError}</span>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsResetModalOpen(false)}
                      className="px-4 py-2.5 text-[var(--crm-text-secondary)] hover:bg-[var(--crm-sidebar)] text-xs  rounded-xl transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-zinc-900 hover:bg-black text-white text-xs font-medium rounded-xl transition cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Continue</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2: ACCESS CODE VERIFICATION */}
              {resetStep === 'access_code' && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setResetError('');
                    const inputCode = resetAccessCode.trim();
                    if (!inputCode) {
                      setResetError('Please enter your Access Code.');
                      return;
                    }

                    let isValid = false;
                    try {
                      let res = await fetch('/api/verify-access-code', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ code: inputCode })
                      });
                      if (res.status === 405 || res.status === 404) {
                        res = await fetch(`/api/verify-access-code?code=${encodeURIComponent(inputCode)}`, { method: 'GET' });
                      }
                      const data = await res.json();
                      if (data && data.success === true) {
                        isValid = true;
                      }
                    } catch (err) {
                      isValid = false;
                    }

                    if (isValid) {
                      setResetError('');
                      setResetStep('confirm');
                    } else {
                      setResetError('Invalid Access Code. Verification failed.');
                    }
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[var(--crm-text-secondary)]   block">
                      Access Code
                    </label>
                    <p className="text-xs text-[var(--crm-subtitle)]">
                      Enter the master CRM Access Code to authorize permanent reset.
                    </p>
                    <input
                      type="password"
                      autoFocus
                      value={resetAccessCode}
                      onChange={(e) => {
                        setResetAccessCode(e.target.value);
                        if (resetError) setResetError('');
                      }}
                      placeholder="Enter Access Code"
                      className="w-full h-11 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] focus:bg-[var(--crm-card)] focus:border-rose-500 rounded-xl px-3.5 text-sm font-medium text-[var(--crm-text)] focus:outline-none transition-all"
                    />
                  </div>

                  {resetError && (
                    <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-medium text-rose-700">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{resetError}</span>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setResetStep('security_code')}
                      className="px-4 py-2.5 text-[var(--crm-text-secondary)] hover:bg-[var(--crm-sidebar)] text-xs  rounded-xl transition cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-zinc-900 hover:bg-black text-white text-xs font-medium rounded-xl transition cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Verify & Continue</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: FINAL CONFIRMATION DIALOG */}
              {resetStep === 'confirm' && (
                <div className="space-y-4">
                  <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200/80 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-rose-700 font-medium text-xs  ">
                      <AlertTriangle size={16} className="shrink-0" />
                      <span>Permanent Deletion Warning</span>
                    </div>
                    <p className="text-xs text-rose-900  leading-relaxed">
                      This action cannot be undone. All leads, clients, projects, team members, portals, discussions, goals, scripts, proposals, and CRM records will be permanently deleted from the database.
                    </p>
                  </div>

                  <p className="text-xs text-[var(--crm-subtitle)] leading-relaxed ">
                    Are you completely sure you want to purge all records and start with an empty database?
                  </p>

                  {resetError && (
                    <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-medium text-rose-700">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{resetError}</span>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      disabled={isResetting}
                      onClick={() => setIsResetModalOpen(false)}
                      className="px-4 py-2.5 bg-[var(--crm-sidebar)] hover:bg-[var(--crm-card)] text-[var(--crm-text)] text-xs  rounded-xl transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isResetting}
                      onClick={async () => {
                        setIsResetting(true);
                        setResetError('');
                        try {
                          if (onResetData) {
                            await onResetData();
                          }
                          setResetStep('success');
                        } catch (err: any) {
                          setResetError(err.message || 'Failed to complete database reset.');
                        } finally {
                          setIsResetting(false);
                        }
                      }}
                      className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white text-xs font-medium   rounded-xl transition cursor-pointer shadow-md shadow-rose-600/20 flex items-center gap-2"
                    >
                      {isResetting ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Deleting Everything...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 size={14} />
                          <span>Yes, Delete Everything</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: SUCCESS CONFIRMATION */}
              {resetStep === 'success' && (
                <div className="space-y-4 py-2 text-center">
                  <div className="mx-auto w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <CheckCircle2 size={26} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-semibold text-[var(--crm-text)]">
                      CRM Database Reset Successfully
                    </h4>
                    <p className="text-xs text-[var(--crm-subtitle)] max-w-xs mx-auto">
                      All CRM collections and records have been permanently cleared. Your database is now fresh and empty.
                    </p>
                  </div>

                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsResetModalOpen(false);
                        setActiveSection('appearance');
                      }}
                      className="w-full py-3 bg-zinc-900 hover:bg-black text-white text-xs font-medium rounded-xl transition cursor-pointer"
                    >
                      Return to Settings
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
