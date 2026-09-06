import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  Shield, 
  ArrowRight, 
  Clock, 
  Quote, 
  Star,
  ChevronLeft,
  ChevronRight,
  Rocket,
  Briefcase,
  ShieldCheck,
  Sparkles,
  Code,
  Palette,
  TrendingUp,
  CheckCircle2,
  Cpu,
  X,
  Bot,
  Layers,
  Globe,
  Zap,
  Award,
  Users,
  Check,
  Terminal,
  Activity,
  Loader2
} from 'lucide-react';
import zyqitekLogoImg from '../assets/images/zyqitek_logo_1784722857265.jpg';
import { EnterpriseBackgroundAnimation } from './EnterpriseBackgroundAnimation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../lib/firebaseClient';

interface LoginProps {
  onLogin: (token?: string, csrfToken?: string, role?: string, skipBrandedLoading?: boolean, firebaseToken?: string) => void;
}

interface EnterpriseLockoutCardProps {
  remainingSeconds: number;
}

const EnterpriseLockoutCard: React.FC<EnterpriseLockoutCardProps> = ({ remainingSeconds }) => {
  const getInitialTier = (secs: number) => {
    if (secs <= 2700) return 2700;    // 45 min
    if (secs <= 3600) return 3600;    // 1 hr
    if (secs <= 7200) return 7200;    // 2 hrs
    if (secs <= 14400) return 14400;  // 4 hrs
    if (secs <= 28800) return 28800;  // 8 hrs
    return 86400;                     // 24 hrs
  };

  const initialTier = getInitialTier(remainingSeconds);
  const progressPercent = Math.min(100, Math.max(0, (remainingSeconds / initialTier) * 100));

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * progressPercent) / 100;

  const formatCountdown = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;

    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="mb-6 relative overflow-hidden rounded-2xl bg-[#13151A] text-white border border-[#2A2D33] p-5 sm:p-6 shadow-2xl transform-gpu"
    >
      <div className="relative z-10 flex flex-col items-center text-center space-y-3.5">
        {/* Circular Progress Ring with Centered Lock Icon */}
        <div className="relative flex items-center justify-center my-1">
          <svg className="w-22 h-22 transform -rotate-90">
            {/* Background Circle Track */}
            <circle
              cx="44"
              cy="44"
              r={radius}
              className="stroke-zinc-800"
              strokeWidth="4.5"
              fill="transparent"
            />
            {/* Animated Progress Ring */}
            <circle
              cx="44"
              cy="44"
              r={radius}
              className="stroke-zinc-400 transition-all duration-500 ease-out"
              strokeWidth="4.5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          
          {/* Lock Icon inside circle */}
          <div className="absolute flex items-center justify-center p-3 bg-[#1F2228] rounded-full border border-[#2A2D33] text-white shadow-xs">
            <Lock className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Digital Countdown Display */}
        <div className="space-y-1">
          <div className="flex items-baseline justify-center gap-1 font-mono font-bold text-3xl sm:text-4xl text-white">
            <span>{formatCountdown(remainingSeconds)}</span>
          </div>
          <p className="text-[11px] text-white italic font-normal">
            Remaining Lockout Time
          </p>
        </div>

        {/* Title */}
        <div className="pt-2 border-t border-[#2A2D33] w-full">
          <h4 className="text-sm font-bold text-white tracking-tight">
            Workspace Temporarily Locked
          </h4>
        </div>
      </div>
    </motion.div>
  );
};

// Enterprise Service Cards Data
const ENTERPRISE_SERVICES = [
  {
    title: 'Enterprise CRM Development',
    subtitle: 'Scalable Sales Pipelines',
    desc: 'Custom CRM platforms engineered with automated lead routing, real-time client ledgers, predictive sales analytics, and multi-tenant security.',
    icon: Rocket,
    badge: 'Core Platform',
    accent: '#7BAE2F'
  },
  {
    title: 'AI Automation Solutions',
    subtitle: 'Intelligent Business Workflows',
    desc: 'Autonomous AI agents, intelligent process automation, LLM integration, and neural data processing designed to optimize enterprise operations.',
    icon: Bot,
    badge: 'Next-Gen AI',
    accent: '#34d399'
  },
  {
    title: 'Custom Web & SaaS Development',
    subtitle: 'High-Performance Cloud Software',
    desc: 'Full-stack enterprise applications built on microservices architecture, real-time cloud data pipelines, and lightning-fast user interfaces.',
    icon: Layers,
    badge: 'Cloud Native',
    accent: '#10B981'
  }
];

// Trust Statistics Data
const TRUST_STATS = [
  { value: '150+', label: 'Projects Delivered', desc: 'Enterprise apps & software systems' },
  { value: '50+', label: 'Business Clients', desc: 'Global agencies & tech companies' },
  { value: '98%', label: 'Client Satisfaction', desc: 'Proactive long-term engineering' },
  { value: '24/7', label: 'Technical Support', desc: 'Dedicated enterprise SLA response' }
];

// Trust Feature Highlights
const TRUST_HIGHLIGHTS = [
  { label: 'Enterprise Security', icon: ShieldCheck },
  { label: 'AI Powered Solutions', icon: Cpu },
  { label: 'Cloud Microservices', icon: Globe },
  { label: '99.99% Uptime SLA', icon: Zap }
];

// Floating Ambient Particles Configuration
const FLOATING_PARTICLES = [
  { top: '12%', left: '8%', duration: 18, delay: 0 },
  { top: '22%', left: '88%', duration: 24, delay: 2 },
  { top: '55%', left: '15%', duration: 20, delay: 1 },
  { top: '72%', left: '80%', duration: 26, delay: 3 },
  { top: '38%', left: '92%', duration: 19, delay: 0.5 },
  { top: '82%', left: '35%', duration: 22, delay: 2.5 },
  { top: '60%', left: '50%', duration: 25, delay: 1.5 },
  { top: '18%', left: '45%', duration: 21, delay: 3.5 },
];

export default function Login({ onLogin }: LoginProps) {
  // Modal Reveal State for Login Overlay
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(true);

  // Authentication Step: 'login' (Step 1) | 'admin_verify' (Step 2)
  const [authStep, setAuthStep] = useState<'login' | 'admin_verify'>('login');

  // Step 1: Credentials states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [securityCode, setSecurityCode] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Input refs for auto-focus
  const userInputRef = useRef<HTMLInputElement>(null);
  const adminInputRef = useRef<HTMLInputElement>(null);

  // Focus states
  const [focusUser, setFocusUser] = useState(false);
  const [focusPass, setFocusPass] = useState(false);
  const [focusCode, setFocusCode] = useState(false);

  // Auto focus on mount and on authStep changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (authStep === 'login') {
        userInputRef.current?.focus();
      } else if (authStep === 'admin_verify') {
        adminInputRef.current?.focus();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [authStep]);

  // Step 1 Error & Lockout states
  const [error, setError] = useState<string | null>(null);
  const [lockoutTime, setLockoutTime] = useState<number>(0);
  const [shakeUser, setShakeUser] = useState(false);
  const [shakePass, setShakePass] = useState(false);
  const [glowCode, setGlowCode] = useState(false);

  // Step 2: Administrator Code states
  const [tempToken, setTempToken] = useState<string>('');
  const [adminCode, setAdminCode] = useState('');
  const [focusAdminCode, setFocusAdminCode] = useState(false);
  const [shakeAdminCode, setShakeAdminCode] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminLockoutTime, setAdminLockoutTime] = useState<number>(0);

  // General UI states
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [loadingStatusText, setLoadingStatusText] = useState('Initializing Workspace...');
  const [loginResultData, setLoginResultData] = useState<{ token?: string; csrfToken?: string; role?: string; firebaseToken?: string }>({});

  // Close login modal on ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isLoginModalOpen) {
        setIsLoginModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLoginModalOpen]);

  // Loading Screen Text Sequence Controller
  useEffect(() => {
    if (!loginSuccess) return;

    setLoadingStatusText("Initializing Workspace...");

    const t1 = setTimeout(() => {
      setLoadingStatusText("Verifying Enterprise Credentials...");
    }, 900);

    const t2 = setTimeout(() => {
      setLoadingStatusText("Loading Dashboard...");
    }, 1800);

    const t3 = setTimeout(() => {
      onLogin(loginResultData.token, loginResultData.csrfToken, loginResultData.role, true, loginResultData.firebaseToken);
    }, 2700);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [loginSuccess, loginResultData, onLogin]);

  // Sync lockout details from server on mount
  useEffect(() => {
    let active = true;
    const checkLockouts = async (attemptCount = 1) => {
      try {
        let res1: Response | null = null;
        try {
          res1 = await fetch('/api/login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ checkOnly: true })
          });
        } catch (_e) {
          res1 = null;
        }

        if (!res1 || res1.status === 404 || res1.status === 405) {
          try {
            res1 = await fetch('/api/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ checkOnly: true })
            });
          } catch (_e) {}
        }

        let data1: any = null;
        if (res1 && res1.headers.get('content-type')?.includes('application/json')) {
          try { data1 = await res1.json(); } catch (_j) {}
        }
        if (!active) return;

        if (res1 && (res1.status === 429 || data1?.status === 'locked' || data1?.locked)) {
          const remaining1 = data1?.lock_remaining_seconds || data1?.remaining || 1800;
          if (remaining1 > 0) {
            setLockoutTime(remaining1);
            setUsername('');
            setPassword('');
            setSecurityCode('');
            setError("Too many failed login attempts. Your workspace has been temporarily locked for security reasons. Please try again later.");
          }
        }

        let res2: Response | null = null;
        try {
          res2 = await fetch('/api/verify_admin_code.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ checkOnly: true })
          });
        } catch (_e) {
          res2 = null;
        }

        if (!res2 || res2.status === 404 || res2.status === 405) {
          try {
            res2 = await fetch('/api/verify_admin_code', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ checkOnly: true })
            });
          } catch (_e) {}
        }

        let data2: any = null;
        if (res2 && res2.headers.get('content-type')?.includes('application/json')) {
          try { data2 = await res2.json(); } catch (_j) {}
        }
        if (!active) return;

        if (res2 && (res2.status === 429 || data2?.status === 'admin_locked' || data2?.locked)) {
          const remaining2 = data2?.lock_remaining_seconds || data2?.remaining || 1800;
          if (remaining2 > 0) {
            setAdminLockoutTime(remaining2);
            setAdminCode('');
            setAdminError("Too many failed login attempts. Your workspace has been temporarily locked for security reasons. Please try again later.");
          }
        }
      } catch (e: any) {
        if (!active) return;
        if (attemptCount < 5) {
          console.warn(`Lockout sync check failed (attempt ${attemptCount}/5). Retrying in 1.5s...`, e.message || e);
          setTimeout(() => {
            if (active) checkLockouts(attemptCount + 1);
          }, 1500);
        } else {
          console.warn("Lockout sync check failed after 5 attempts. Continuing with local lockout state fallback.", e.message || e);
        }
      }
    };
    checkLockouts();
    return () => {
      active = false;
    };
  }, []);

  // Step 1 lockout countdown loop
  useEffect(() => {
    if (lockoutTime <= 0) return;
    const interval = setInterval(() => {
      setLockoutTime((prev) => {
        if (prev <= 1) {
          setError(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTime]);

  // Step 2 admin verification lockout countdown loop
  useEffect(() => {
    if (adminLockoutTime <= 0) return;
    const interval = setInterval(() => {
      setAdminLockoutTime((prev) => {
        if (prev <= 1) {
          setAdminError(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [adminLockoutTime]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Step 1 Submit Handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTime > 0) return;

    setError(null);

    const cleanUser = username.trim();
    const cleanPass = password.trim();
    const cleanCode = securityCode.trim();

    setIsLoading(true);

    // 1. If username is an email address and Firebase is configured, attempt Firebase Authentication
    if (cleanUser.includes('@') && isFirebaseConfigured) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, cleanUser, cleanPass);
        const token = await userCredential.user.getIdToken();
        setIsLoading(false);
        setLoginResultData({
          token: token,
          csrfToken: token.slice(0, 32),
          role: 'Admin',
          firebaseToken: token
        });
        setLoginSuccess(true);
        return;
      } catch (fbErr: any) {
        console.error('[FIREBASE AUTH ERROR]', fbErr);
        setIsLoading(false);
        const errorCode = fbErr?.code || 'auth/unknown';
        const errorMsg = fbErr?.message || 'Firebase Authentication failed.';
        // Logically expose the exact Firebase auth error as requested
        setError(`Firebase Authentication error (${errorCode}): ${errorMsg}`);
        return;
      }
    }

    // 2. Primary verification via CRM credentials endpoint (/api/login.php with fallback to /api/login)
    try {
      let response: Response | null = null;
      try {
        response = await fetch('/api/login.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: cleanUser,
            password: cleanPass,
            securityCode: cleanCode,
            security_code: cleanCode
          })
        });
      } catch (_e) {
        response = null;
      }

      if (!response || response.status === 404 || response.status === 405) {
        try {
          response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: cleanUser,
              password: cleanPass,
              securityCode: cleanCode,
              security_code: cleanCode
            })
          });
        } catch (_err) {}
      }

      if (!response) {
        setIsLoading(false);
        setError("Network connection failure. Please check your network connection and try again.");
        return;
      }

      let data: any = null;
      try {
        data = await response.json();
      } catch (_jsonErr) {
        data = null;
      }
      setIsLoading(false);

      if (response.status === 429 || data?.status === 'locked' || data?.locked) {
        const serverRemaining = data?.lock_remaining_seconds || data?.remaining || 1800;
        setLockoutTime(serverRemaining);
        setUsername('');
        setPassword('');
        setSecurityCode('');
        setError(data?.error || "Too many failed login attempts. Your workspace has been temporarily locked for security reasons. Please try again later.");
        return;
      }

      if ((data?.status === 'admin_verification_required' || data?.status === 'step1_success') && (data?.tempToken || data?.temp_token)) {
        setTempToken(data.tempToken || data.temp_token);
        setAuthStep('admin_verify');
        setAdminError(null);
        return;
      }

      if (data?.success && data?.token) {
        setLoginResultData({
          token: data.token,
          csrfToken: data.csrf_token,
          role: data.role,
          firebaseToken: data.firebaseToken
        });
        setLoginSuccess(true);
        return;
      }

      // Display the actual server error or fall back to descriptive message
      const serverErrMsg = data?.error || data?.message || "Invalid login credentials. Please check your username, password, and security code.";
      setError(serverErrMsg);
    } catch (err: any) {
      setIsLoading(false);
      console.error("[LOGIN ERROR]", err);
      setError(err?.message || "Invalid login credentials. Please try again.");
    }
  };

  // Step 2 Submit Handler (Administrator Code)
  const handleAdminVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminLockoutTime > 0) return;

    setAdminError(null);

    const cleanAdminCode = adminCode.trim();

    setIsLoading(true);

    try {
      let response: Response | null = null;
      try {
        response = await fetch('/api/verify_admin_code.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            temp_token: tempToken,
            admin_code: cleanAdminCode,
            code: cleanAdminCode
          })
        });
      } catch (_e) {
        response = null;
      }

      if (!response || response.status === 404 || response.status === 405) {
        try {
          response = await fetch('/api/verify_admin_code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              temp_token: tempToken,
              admin_code: cleanAdminCode,
              code: cleanAdminCode
            })
          });
        } catch (_err) {}
      }

      if (!response) {
        setIsLoading(false);
        setAdminError("Network connection failure. Please try again.");
        return;
      }

      let data: any = null;
      try {
        data = await response.json();
      } catch (_jsonErr) {
        data = null;
      }
      setIsLoading(false);

      if (response.ok && data?.success) {
        setLoginResultData({
          token: data.token,
          csrfToken: data.csrfToken || data.csrf_token,
          role: data.role,
          firebaseToken: data.firebaseToken
        });
        setLoginSuccess(true);
      } else {
        if (response.status === 429 || data?.status === 'admin_locked' || data?.locked) {
          const serverRemaining = data?.lock_remaining_seconds || data?.remaining || 1800;
          setAdminLockoutTime(serverRemaining);
          setAdminCode('');
          setAdminError(data?.error || "Too many failed login attempts. Your workspace has been temporarily locked for security reasons. Please try again later.");
        } else {
          setAdminError(data?.error || "Invalid Administrator Verification Code. Please try again.");
        }
      }
    } catch (err: any) {
      setIsLoading(false);
      console.error("[ADMIN VERIFY ERROR]", err);
      setAdminError(err?.message || "Administrator verification failed. Please try again.");
    }
  };

  // Headline word-by-word reveal sequence
  const headlineWords = [
    { text: "Enterprise", highlight: false },
    { text: "Software", highlight: true },
    { text: "&", highlight: true },
    { text: "AI", highlight: true },
    { text: "Solutions", highlight: true }
  ];

  return (
    <div className="auth-page min-h-screen w-full bg-[#000000] text-white font-sans select-none overflow-x-hidden relative flex items-center justify-center p-4 sm:p-6">
      
      {/* ========================================================= */}
      {/* ENTERPRISE DARK MINIMAL ANIMATED BACKGROUND CANVAS LAYER  */}
      {/* ========================================================= */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#000000]">
        {/* Subtle Floating Ambient Orbs */}
        <div className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] rounded-full bg-indigo-600/12 blur-[140px] animate-ambient-1 pointer-events-none" />
        <div className="absolute top-[30%] -right-[15%] w-[55vw] h-[55vw] max-w-[750px] max-h-[750px] rounded-full bg-blue-600/10 blur-[150px] animate-ambient-2 pointer-events-none" />
        <div className="absolute -bottom-[20%] left-[25%] w-[50vw] h-[50vw] max-w-[700px] max-h-[700px] rounded-full bg-violet-600/10 blur-[160px] animate-ambient-3 pointer-events-none" />

        {/* Interactive Access Code & Digital Matrix Rain Canvas Animation */}
        <EnterpriseBackgroundAnimation intensity="high" interactive={true} showCodeStreams={true} />

        {/* Minimal Subtle Dotted Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:28px_28px] opacity-40 animate-grid-subtle" />

        {/* Soft Radial Ambient Vignette */}
        <div className="absolute inset-0 bg-radial from-transparent via-black/40 to-black/90 pointer-events-none" />
      </div>

      {/* ========================================================= */}
      {/* CENTERED LOGIN CARD ON ANIMATED BACKGROUND                */}
      {/* ========================================================= */}
      <div className="relative z-10 w-full max-w-[430px] my-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="w-full bg-[#14171D]/95 backdrop-blur-xl border border-[#252932] rounded-[32px] p-8 sm:p-10 shadow-[0_32px_64px_rgba(0,0,0,0.85)] relative overflow-hidden text-white"
        >
          {/* Card Accent */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

          {/* TOP AREA: LOGO & BRANDING */}
          <div className="flex flex-col items-center text-center mb-8 relative z-20">
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
              className="h-16 w-16 rounded-2xl bg-[#1A1D24] border border-[#2D323E] flex items-center justify-center mb-5 p-1 shadow-inner overflow-hidden"
            >
              <img 
                src={zyqitekLogoImg} 
                alt="Zyqitek" 
                className="w-full h-full object-cover object-center rounded-xl" 
                referrerPolicy="no-referrer"
              />
            </motion.div>
            

          </div>

          {/* Enterprise Loading Overlay on Login Success */}
          <AnimatePresence>
            {loginSuccess && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-[#14171D]/98 backdrop-blur-3xl rounded-[32px] flex flex-col items-center justify-center p-8 z-30 border border-[#252932] shadow-2xl overflow-hidden"
              >
                <div className="relative flex flex-col items-center">
                  <div className="h-16 w-16 rounded-2xl bg-[#1A1D24] border border-[#2D323E] shadow-xl flex items-center justify-center p-1 z-10 animate-pulse overflow-hidden">
                    <img 
                      src={zyqitekLogoImg} 
                      alt="Zyqitek Logo" 
                      className="w-full h-full object-cover object-center rounded-xl"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  
                  <div className="mt-8 text-center space-y-4">
                    <AnimatePresence mode="wait">
                      <motion.h3
                        key={loadingStatusText}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.2 }}
                        className="text-sm font-bold text-white tracking-tight"
                      >
                        {loadingStatusText}
                      </motion.h3>
                    </AnimatePresence>

                    <div className="w-32 h-[3px] bg-[#1F2228] rounded-full overflow-hidden mx-auto">
                      <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                        className="w-full h-full bg-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form Content */}
          <AnimatePresence mode="wait">
            {authStep === 'login' ? (
              lockoutTime > 0 ? (
                <motion.div
                  key="step1-lockout"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="py-2"
                >
                  <EnterpriseLockoutCard remainingSeconds={lockoutTime} />
                </motion.div>
              ) : (
                <motion.div
                  key="step1-form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="relative z-20"
                >
                  {/* Error Banner */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                      className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-[12px] text-rose-300 flex items-start gap-3 font-bold"
                    >
                      <Shield size={16} className="shrink-0 mt-0.5 text-rose-400" />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  <form onSubmit={handleLoginSubmit} className="space-y-5">
                    <div className="space-y-4">
                      {/* Username */}
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold !text-white uppercase tracking-wider ml-1" style={{ color: '#FFFFFF' }}>
                          Username
                        </label>
                        <div className="relative group">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white group-focus-within:text-indigo-400 transition-colors">
                            <User size={18} />
                          </span>
                          <input
                            ref={userInputRef}
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={isLoading}
                            autoFocus
                            className="w-full bg-[#1A1D24] border border-[#2D323E] focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 text-white text-sm rounded-2xl pl-12 pr-4 h-12 transition-all outline-none placeholder:text-zinc-300 placeholder:italic disabled:opacity-50"
                            placeholder="Enter username"
                            required
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold !text-white uppercase tracking-wider ml-1" style={{ color: '#FFFFFF' }}>
                          Password
                        </label>
                        <div className="relative group">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white group-focus-within:text-indigo-400 transition-colors">
                            <Lock size={18} />
                          </span>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                            className="w-full bg-[#1A1D24] border border-[#2D323E] focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 text-white text-sm rounded-2xl pl-12 pr-12 h-12 transition-all outline-none placeholder:text-zinc-300 placeholder:italic disabled:opacity-50 tracking-wider"
                            placeholder="Enter password"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-indigo-300 transition-colors p-1 cursor-pointer"
                            tabIndex={-1}
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Security Code */}
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold !text-white uppercase tracking-wider ml-1" style={{ color: '#FFFFFF' }}>
                          Security Code
                        </label>
                        <div className="relative group">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white group-focus-within:text-indigo-400 transition-colors">
                            <ShieldCheck size={18} />
                          </span>
                          <input
                            type="password"
                            value={securityCode}
                            onChange={(e) => setSecurityCode(e.target.value)}
                            disabled={isLoading}
                            className="w-full bg-[#1A1D24] border border-[#2D323E] focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 text-white text-sm rounded-2xl pl-12 pr-4 h-12 transition-all outline-none placeholder:text-zinc-300 placeholder:italic disabled:opacity-50 tracking-wider"
                            placeholder="Enter security code"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-3">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-white hover:bg-zinc-100 disabled:bg-zinc-200 text-[#0E1015] font-bold h-12 rounded-2xl text-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-black/20 group active:scale-[0.98]"
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <Loader2 size={18} className="animate-spin text-zinc-600" />
                            <span className="font-bold text-[#0E1015]">Signing in...</span>
                          </div>
                        ) : (
                          <>
                            <span className="font-bold tracking-wide">SIGN IN</span>
                            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )
            ) : (
              adminLockoutTime > 0 ? (
                <motion.div
                  key="step2-lockout"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="py-2"
                >
                  <EnterpriseLockoutCard remainingSeconds={adminLockoutTime} />
                </motion.div>
              ) : (
                <motion.div
                  key="step2-form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="relative z-20"
                >
                  {/* Step 2 Error Banner */}
                  {adminError && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                      className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-[12px] text-rose-300 flex items-start gap-3 font-bold"
                    >
                      <Shield size={16} className="shrink-0 mt-0.5 text-rose-400" />
                      <span>{adminError}</span>
                    </motion.div>
                  )}

                  <form onSubmit={handleAdminVerifySubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-[11px] font-bold !text-white uppercase tracking-wider ml-1" style={{ color: '#FFFFFF' }}>
                        Administrator Authorization Code
                      </label>
                      <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white group-focus-within:text-indigo-400 transition-colors">
                          <ShieldCheck size={18} />
                        </span>
                        <input
                          ref={adminInputRef}
                          type="password"
                          value={adminCode}
                          onChange={(e) => setAdminCode(e.target.value)}
                          disabled={isLoading}
                          autoFocus
                          className="w-full bg-[#1A1D24] border border-[#2D323E] focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 text-white text-sm rounded-2xl pl-12 pr-4 h-12 transition-all outline-none placeholder:text-zinc-300 placeholder:italic disabled:opacity-50 tracking-wider"
                          placeholder="Enter authorization code"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-white hover:bg-zinc-100 disabled:bg-zinc-200 text-[#0E1015] font-bold h-12 rounded-2xl text-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-black/20 group active:scale-[0.98]"
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <Loader2 size={18} className="animate-spin text-zinc-600" />
                            <span className="font-bold text-[#0E1015]">Verifying...</span>
                          </div>
                        ) : (
                          <>
                            <span className="font-bold tracking-wide">VERIFY & LAUNCH WORKSPACE</span>
                            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAuthStep('login');
                          setAdminError(null);
                        }}
                        disabled={isLoading}
                        className="w-full text-xs font-normal italic text-white hover:text-indigo-200 transition-colors py-2 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <ChevronLeft size={14} />
                        <span>Return to login</span>
                      </button>
                    </div>
                  </form>
                </motion.div>
              )
            )}
          </AnimatePresence>

          {/* Footer info */}
          <div className="mt-8 text-center">
            <p className="text-[11px] text-white italic font-medium tracking-[0.1em]">
              Zyqitek — Customer Relationship Management
            </p>
          </div>

        </motion.div>
      </div>

    </div>
  );
}

