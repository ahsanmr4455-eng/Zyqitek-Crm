import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, 
  Plus, 
  Trash2, 
  Check, 
  FileText, 
  Search, 
  DollarSign, 
  ChevronRight, 
  X, 
  User, 
  Briefcase,
  History,
  Download,
  Folder,
  Building,
  Mail,
  Phone,
  FileCheck,
  Send,
  AlertCircle,
  Calendar,
  Layers,
  CheckSquare,
  Square,
  ArrowRight,
  ShieldCheck,
  Eye,
  RefreshCw,
  Image as ImageIcon,
  CreditCard,
  Printer,
  Globe,
  CheckCircle2
} from 'lucide-react';
import { Client, Project, ProposalItem, ProposalQuotation, ClientPortalAccount, PaymentDetails, DEFAULT_PAYMENT_PURPOSES, PaymentStructureType, PaymentScheduleStage } from '../types';
import { saveToFirestore, deleteFromFirestore, getCollectionOnce } from '../lib/firebaseSync';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { safeHtml2Canvas } from '../lib/html2canvasSanitizer';
import { uploadPortalFile } from '../lib/fileStorage';
import { generatePdfFromProposal, generateImageFromProposal, buildProposalExportHtml, buildProposalImageExportHtml, buildInvoiceExportHtml, formatFilename, formatCurrency } from '../lib/exportEngine';

// Complete & comprehensive service catalog covering all client service lines
export interface FeatureOption {
  name: string;
  price: number;
  description?: string;
}

export const SERVICE_CATALOGS: Record<string, {
  types: { name: string; price: number; description?: string }[];
  features: FeatureOption[];
}> = {
  "Website Development": {
    types: [
      { name: "Landing Page", price: 800, description: "Single high-converting page with clear CTA" },
      { name: "Business Website", price: 1800, description: "Multi-page corporate website with CMS" },
      { name: "E-commerce Website", price: 3200, description: "Full online store with shopping cart & payment gateways" },
      { name: "Custom Web Application", price: 4800, description: "Tailored portal, database dashboard & custom workflow" }
    ],
    features: [
      { name: "Responsive Mobile Optimization", price: 200, description: "Flawless layout across smartphones, tablets & laptops" },
      { name: "On-Page SEO Setup", price: 100, description: "Meta tags, schema markup & search engine indexing" },
      { name: "Google Analytics 4 & Event Tracking", price: 75, description: "Traffic analytics property setup & conversion goals" },
      { name: "Contact & Lead Form Integration", price: 50, description: "Custom contact form with automated email & CRM routing" },
      { name: "WhatsApp Chat Widget", price: 50, description: "Direct click-to-chat WhatsApp button on site" },
      { name: "CMS Admin Panel", price: 300, description: "Easy self-service content management dashboard" },
      { name: "Extra Custom Page", price: 150, description: "Design & development for an additional inner page" },
      { name: "Speed & Performance Optimization", price: 120, description: "Asset minification, image compression & caching setup" },
      { name: "Basic Security Hardening", price: 100, description: "Firewall rules, anti-spam & security headers" },
      { name: "Monthly Website Maintenance", price: 150, description: "Routine updates, backups & uptime monitoring" },
      { name: "Priority Fast-Track Delivery", price: 250, description: "Accelerated project delivery SLA" }
    ]
  },
  "UI/UX Design": {
    types: [
      { name: "Landing Page Wireframe & UI Kit", price: 500, description: "Responsive desktop & mobile UI wireframes" },
      { name: "Multi-page Website Blueprint", price: 1400, description: "Full UX journey & high-fidelity UI layout" },
      { name: "Mobile App Figma Prototype", price: 2200, description: "Interactive click-through iOS/Android mockup" },
      { name: "SaaS Dashboard UI/UX System", price: 1900, description: "Complex web app layout, components & user flows" }
    ],
    features: [
      { name: "Wireframes & UX User Journey", price: 200, description: "Low-fidelity wireframes and user journey mapping" },
      { name: "Interactive Prototype", price: 250, description: "Clickable Figma prototype for user testing and review" },
      { name: "Figma Component Design System", price: 400, description: "Reusable component library, typography scale & color variables" },
      { name: "Mobile & Desktop Breakpoints", price: 150, description: "Responsive auto-layout specs for all screen sizes" },
      { name: "Developer Handoff & Asset Export", price: 100, description: "Redline specs, CSS variables & SVG asset export" }
    ]
  },
  "Video Editing": {
    types: [
      { name: "Shorts / Reels / TikTok Package (5 Videos)", price: 250, description: "Vertical high-retention content clips" },
      { name: "YouTube Long-Form Video", price: 350, description: "In-depth edited vlog, tutorial, or commentary" },
      { name: "High-Conversion Promotional Ad", price: 600, description: "Hook-driven marketing & commercial ad edit" },
      { name: "Corporate Brand Video", price: 1200, description: "High-end company overview or testimonial video" }
    ],
    features: [
      { name: "Additional Revision", price: 50, description: "One extra full iteration and refinement round" },
      { name: "Advanced Motion Graphics", price: 150, description: "Custom 2D motion elements, lower thirds & title cards" },
      { name: "Subtitles / Captions", price: 75, description: "Synced, eye-catching animated captions" },
      { name: "Sound Design & Audio Mixing", price: 100, description: "Pro audio leveling, SFX placement & background music mix" },
      { name: "Color Grading & Cinematic Look", price: 100, description: "Cinematic look, tone matching & color correction" },
      { name: "High-CTR Thumbnail Design", price: 45, description: "Custom YouTube/social video thumbnail asset" },
      { name: "24/48 Hour Priority Delivery", price: 150, description: "Urgent turnaround delivery SLA" },
      { name: "Extra Video Length Footage", price: 100, description: "Editing for additional raw footage minutes" },
      { name: "Multiple Aspect Ratio Exports", price: 50, description: "Exports in 16:9 widescreen, 9:16 story & 1:1 square" }
    ]
  },
  "Graphic Design": {
    types: [
      { name: "Social Media Post Kit (10 Posts)", price: 220, description: "Cohesive branded post & story templates" },
      { name: "Marketing Banner & Thumbnail Set", price: 140, description: "Ad banners, headers & cover graphics" },
      { name: "Print Brochure & Flyerset", price: 280, description: "Print-ready marketing collateral" },
      { name: "Complete Brand Identity Guide", price: 650, description: "Logo design, color palette, typography & brand book" }
    ],
    features: [
      { name: "Additional Concepts", price: 100, description: "Extra initial design directions to choose from" },
      { name: "Additional Revisions", price: 40, description: "Extra iteration round on chosen concept" },
      { name: "Master Source Files", price: 60, description: "Editable AI, PSD, and vector SVG master files" },
      { name: "Social Media Format Variations", price: 80, description: "Resized assets tailored for IG, FB, LinkedIn & X" },
      { name: "Print-Ready Vector Files", price: 50, description: "High-resolution CMYK PDF files with crop marks & bleed" },
      { name: "Brand Usage Guidelines PDF", price: 200, description: "Comprehensive style guide & usage rules" },
      { name: "Priority Delivery SLA", price: 120, description: "Fast-turnaround express asset delivery" }
    ]
  },
  "SEO": {
    types: [
      { name: "Technical SEO Audit & Fixes", price: 450, description: "Comprehensive site health crawl & error resolution" },
      { name: "Monthly Organic SEO Growth Plan", price: 900, description: "On-page, technical & keyword ranking campaign" },
      { name: "High-Authority National SEO Campaign", price: 1700, description: "Aggressive keyword ranking & authority link building" }
    ],
    features: [
      { name: "Target Keyword Research & Mapping", price: 200, description: "In-depth keyword search volume & intent mapping" },
      { name: "Competitor Backlink Analysis", price: 250, description: "Rival SEO profile & link opportunity discovery" },
      { name: "On-Page Content Optimization", price: 350, description: "Optimizing headings, copy & meta data across key pages" },
      { name: "High Domain Authority Link Package", price: 450, description: "Manual outreach for high DA contextual backlinks" },
      { name: "Monthly Rank Tracking & KPI Report", price: 100, description: "Detailed keyword ranking movement & traffic reports" }
    ]
  },
  "Digital Marketing": {
    types: [
      { name: "PPC Ad Campaign Starter", price: 550, description: "Single-channel campaign setup & optimization" },
      { name: "Multi-Channel Growth Engine", price: 1100, description: "Omni-channel PPC and retargeting setup" },
      { name: "Full Performance Marketing Suite", price: 2400, description: "End-to-end campaign management, copy & creative" }
    ],
    features: [
      { name: "Additional Platform Expansion", price: 150, description: "Expand campaign setup to an extra advertising network" },
      { name: "Monthly KPI Performance Report", price: 100, description: "Detailed dashboard & conversion analysis report" },
      { name: "Campaign Content Calendar", price: 120, description: "Strategic monthly ad copy & campaign posting schedule" },
      { name: "Ad Creative Graphic Package", price: 200, description: "Set of high-performing visual and video ad creatives" },
      { name: "Competitor Ad Research", price: 150, description: "Rival ad strategy, positioning & keyword gap analysis" },
      { name: "Target Audience Persona Research", price: 120, description: "Custom buyer persona mapping & interest targeting" },
      { name: "Retargeting Campaign Setup", price: 250, description: "Setup of custom retargeting or lead nurture campaign" },
      { name: "Priority Support & Advisory Sync", price: 100, description: "Direct priority communication & weekly advisory sync" }
    ]
  },
  "Social Media Management": {
    types: [
      { name: "Standard Organic SMM Package", price: 750, description: "12 curated posts/month on 1 primary platform" },
      { name: "Multi-Platform SMM Growth Plan", price: 1400, description: "20 posts/month across 3 social platforms" },
      { name: "Enterprise Viral SMM Campaign", price: 2800, description: "Daily posts, reels, community engagement & strategy" }
    ],
    features: [
      { name: "Additional Social Channel", price: 150, description: "Manage and publish to an extra social network" },
      { name: "Additional Post Batch (5 Posts)", price: 100, description: "Package of 5 extra scheduled posts" },
      { name: "Reels / Shorts Video Package", price: 250, description: "Monthly batch of short-form video reels" },
      { name: "Advance Content Calendar Grid", price: 120, description: "Monthly visual content calendar for advance approval" },
      { name: "Monthly Analytics & Growth Report", price: 90, description: "Engagement, reach & follower growth report" },
      { name: "Community Management & DM Responses", price: 200, description: "Daily comment responses and inbox direct message management" },
      { name: "Extra Revision Round", price: 40, description: "Additional content approval revision round" },
      { name: "Express Content Turnaround", price: 120, description: "Priority posting & urgent content turnaround" }
    ]
  },
  "Mobile App Development": {
    types: [
      { name: "Native iOS App", price: 3500, description: "Swift/SwiftUI native iOS mobile application" },
      { name: "Native Android App", price: 3500, description: "Kotlin native Android mobile application" },
      { name: "Cross-Platform Mobile App", price: 4500, description: "React Native or Flutter app for both iOS & Android" },
      { name: "Enterprise Mobile Solution", price: 7000, description: "Full-scale mobile platform with backend API" }
    ],
    features: [
      { name: "Push Notifications Engine", price: 200, description: "Firebase / OneSignal automated push alerts" },
      { name: "In-App Purchases & Subscriptions", price: 500, description: "StoreKit & RevenueCat subscription setup" },
      { name: "Payment Gateway Integration", price: 400, description: "Stripe & digital wallet mobile integration" },
      { name: "App Store & Play Store Publishing SLA", price: 300, description: "Store compliance review & publishing assistance" }
    ]
  },
  "Software Development": {
    types: [
      { name: "Custom CRM Portal", price: 3800, description: "Tailored customer relationship management system" },
      { name: "Enterprise ERP System", price: 7500, description: "Resource planning, inventory & operations suite" },
      { name: "POS & Billing Solution", price: 2900, description: "Point of sale software with automated invoicing" },
      { name: "Custom Booking System", price: 2400, description: "Online scheduling, calendar sync & booking engine" }
    ],
    features: [
      { name: "User Roles & Permissions Engine", price: 300, description: "RBAC with Admin, Manager & User access levels" },
      { name: "Real-time Analytics Dashboard", price: 350, description: "Live charts, KPIs & data visualization" },
      { name: "Custom REST API Integration", price: 450, description: "Connect with third-party webhooks & software APIs" },
      { name: "Cloud Infrastructure & Staging Setup", price: 500, description: "Containerized deployment, staging & production servers" }
    ]
  },
  "Automation / N8N": {
    types: [
      { name: "Single Workflow Automation", price: 350, description: "Automate 1 recurring business process" },
      { name: "Multi-Step CRM & Email Automation", price: 900, description: "Interconnected multi-app workflow engine" },
      { name: "Enterprise n8n / Zapier Hub", price: 2100, description: "Full automated operational stack & webhook server" }
    ],
    features: [
      { name: "Webhook & REST API Connectors", price: 250, description: "Custom HTTP request and response handling" },
      { name: "CRM Data Synchronization", price: 350, description: "Bi-directional database sync and error logging" },
      { name: "Automated Email Sequences", price: 400, description: "Drip campaigns triggered by user actions" }
    ]
  },
  "WordPress": {
    types: [
      { name: "WordPress Starter Site", price: 600, description: "Professional blog or company profile site" },
      { name: "Custom Elementor / Gutenberg Theme", price: 1200, description: "Tailored visual design with custom theme builder" },
      { name: "WooCommerce Store Engine", price: 2100, description: "Full WordPress e-commerce store" }
    ],
    features: [
      { name: "Responsive Mobile Optimization", price: 200, description: "Seamless mobile & tablet responsive layout" },
      { name: "Yoast / RankMath SEO Setup", price: 100, description: "SEO plugin configuration & XML sitemap generation" },
      { name: "Custom Commercial Plugin Config", price: 200, description: "Installation & setup of essential commercial plugins" },
      { name: "Speed & Caching Optimization", price: 180, description: "Page caching, minification & CDN connection" },
      { name: "Security Hardening & Daily Backups", price: 150, description: "Security plugin setup & automated offsite backup routine" }
    ]
  },
  "E-commerce": {
    types: [
      { name: "Shopify Store Setup", price: 1200, description: "Turnkey Shopify e-commerce launch" },
      { name: "Custom WooCommerce Build", price: 2200, description: "Custom WordPress WooCommerce online store" },
      { name: "Headless Commerce Platform", price: 4500, description: "High-performance Next.js / React storefront" }
    ],
    features: [
      { name: "Product Catalog Upload (Up to 50 items)", price: 300, description: "Importing, tagging & formatting product pages" },
      { name: "Multi-Currency & Tax Config", price: 250, description: "Automatic localized currency switcher & tax rules" },
      { name: "Payment Gateway Sync (Stripe/PayPal)", price: 350, description: "Secure checkout gateway setup & testing" }
    ]
  },
  "Hosting & Domain": {
    types: [
      { name: "Shared Business Hosting (1 Year)", price: 150, description: "High-speed shared SSD hosting setup" },
      { name: "Managed VPS Server Config", price: 400, description: "Dedicated virtual private server setup" },
      { name: "Domain Sourcing & DNS Config", price: 50, description: "Domain registration, A records & CNAME setup" }
    ],
    features: [
      { name: "Professional Business Email Setup", price: 100, description: "Google Workspace or Microsoft 365 MX records setup" },
      { name: "SSL Certificate & HTTPS Redirection", price: 80, description: "Automated SSL renewal & HTTPS security headers" },
      { name: "Staging Testing Environment", price: 120, description: "Isolated staging server instance for client approvals" }
    ]
  },
  "Custom Services": {
    types: [
      { name: "Custom Hourly Consulting", price: 100, description: "Dedicated hourly technical or strategic advisory" },
      { name: "Fixed Project Deliverable Scope", price: 1000, description: "Custom milestone-based deliverable package" }
    ],
    features: [
      { name: "Dedicated Project Manager", price: 300, description: "Single point of contact for status updates and delivery" },
      { name: "Express 48-Hour Delivery SLA", price: 400, description: "Accelerated rush project execution" }
    ]
  }
};

interface ProposalCalculatorProps {
  clients: Client[];
  projects?: Project[];
  pricingCatalog?: any;
  onSaveProposal?: (proposal: ProposalQuotation) => void;
  onDeleteProposal?: (id: string) => void;
  onConvertProposalToProject?: (proposal: ProposalQuotation) => void;
  savedProposals?: ProposalQuotation[];
  onUpdatePricingCatalog?: (catalog: any) => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
  paymentDetails?: PaymentDetails | null;
}

export const ProposalCalculator: React.FC<ProposalCalculatorProps> = ({
  clients = [],
  projects = [],
  onSaveProposal,
  onDeleteProposal,
  onConvertProposalToProject,
  savedProposals = [],
  showToast,
  paymentDetails
}) => {
  // Payment Details & Purpose States
  const [currentPaymentDetails, setCurrentPaymentDetails] = useState<PaymentDetails | null>(paymentDetails || null);
  const [selectedPaymentPurpose, setSelectedPaymentPurpose] = useState<string>('');

  useEffect(() => {
    if (paymentDetails) {
      setCurrentPaymentDetails(paymentDetails);
      if (!selectedPaymentPurpose) {
        setSelectedPaymentPurpose(paymentDetails.paymentPurpose || 'Software Development');
      }
    }
  }, [paymentDetails]);

  // Navigation tab: 'form' vs 'history'
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');

  // FORM STATES (Strict fields requested)
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  
  // Custom Category Add-on Options State
  const [customCategoryOptions, setCustomCategoryOptions] = useState<Record<string, FeatureOption[]>>({});
  const [showAddCustomModal, setShowAddCustomModal] = useState<boolean>(false);
  const [newCustomOptionName, setNewCustomOptionName] = useState<string>('');
  const [newCustomOptionDesc, setNewCustomOptionDesc] = useState<string>('');
  const [newCustomOptionPrice, setNewCustomOptionPrice] = useState<number | ''>('');

  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [unitBasePrice, setUnitBasePrice] = useState<number | ''>('');
  const [customExtraCost, setCustomExtraCost] = useState<number | ''>('');
  const [discountType, setDiscountType] = useState<'Percentage' | 'Fixed'>('Percentage');
  const [discountValue, setDiscountValue] = useState<number | ''>(0);
  const [taxPercentage, setTaxPercentage] = useState<number | ''>(0);

  const [projectNotes, setProjectNotes] = useState<string>('');
  const [deliveryDate, setDeliveryDate] = useState<string>('');

  // Payment Structure & Terms States
  const [paymentStructure, setPaymentStructure] = useState<PaymentStructureType>('split_50_50');
  const [customStages, setCustomStages] = useState<PaymentScheduleStage[]>([
    { id: '1', name: 'Project Start / Kickoff', percentage: 30, amount: 0 },
    { id: '2', name: 'Design & Development Milestone', percentage: 40, amount: 0 },
    { id: '3', name: 'Final Delivery & Handover', percentage: 30, amount: 0 },
  ]);

  const customStagesTotalPercentage = useMemo(() => {
    return customStages.reduce((sum, s) => sum + (Number(s.percentage) || 0), 0);
  }, [customStages]);

  // Dropdown & Modal States
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('All');

  // Generate Proposal Modal & Workflow States
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [modalMode, setModalMode] = useState<'options' | 'payment_details' | 'preview_proposal' | 'preview_invoice' | 'preview_image' | 'portal_workflow' | 'send_to_portal_select' | 'no_portal_prompt' | 'create_portal'>('options');
  const [newPortalForm, setNewPortalForm] = useState({ portalName: "", username: "", password: "", status: "Active" as const });
  const [isCreatingPortal, setIsCreatingPortal] = useState(false);
  const [generatedProposalObj, setGeneratedProposalObj] = useState<ProposalQuotation | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingToPortal, setIsUploadingToPortal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Payment Details Modal Form States
  const [payAccountTitle, setPayAccountTitle] = useState('');
  const [payBankName, setPayBankName] = useState('');
  const [payAccountNumber, setPayAccountNumber] = useState('');
  const [payIban, setPayIban] = useState('');
  const [payEmail, setPayEmail] = useState('');
  const [payCountry, setPayCountry] = useState('United States');
  const [payPurpose, setPayPurpose] = useState('Website Development');
  const [payCustomPurpose, setPayCustomPurpose] = useState('');
  const [payError, setPayError] = useState<string | null>(null);
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  const handleOpenInvoicePaymentModal = () => {
    if (currentPaymentDetails) {
      setPayAccountTitle(currentPaymentDetails.accountTitle || '');
      setPayBankName(currentPaymentDetails.bankName || '');
      setPayAccountNumber(currentPaymentDetails.accountNumber || '');
      setPayIban(currentPaymentDetails.iban || '');
      setPayEmail(currentPaymentDetails.paymentEmail || '');
      setPayCountry(currentPaymentDetails.bankCountry || 'United States');

      const purp = currentPaymentDetails.paymentPurpose || 'Website Development';
      const isStandard = DEFAULT_PAYMENT_PURPOSES.includes(purp);
      if (isStandard && purp !== 'Other') {
        setPayPurpose(purp);
        setPayCustomPurpose('');
      } else {
        setPayPurpose('Other');
        setPayCustomPurpose(purp === 'Other' ? '' : purp);
      }
    } else {
      setPayAccountTitle('');
      setPayBankName('');
      setPayAccountNumber('');
      setPayIban('');
      setPayEmail('');
      setPayCountry('United States');
      setPayPurpose('Website Development');
      setPayCustomPurpose('');
    }
    setPayError(null);
    setModalMode('payment_details');
  };

  const handleGenerateInvoiceWithPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payAccountTitle.trim() || !payBankName.trim() || !payAccountNumber.trim() || !payEmail.trim()) {
      setPayError('Please fill in required fields: Account Title, Bank Name, Account Number, and Payment Email.');
      return;
    }

    const finalPurpose = payPurpose === 'Other'
      ? (payCustomPurpose.trim() || 'Other')
      : payPurpose;

    const newPaymentDetails: PaymentDetails = {
      accountTitle: payAccountTitle.trim(),
      bankName: payBankName.trim(),
      accountNumber: payAccountNumber.trim(),
      iban: payIban.trim(),
      paymentEmail: payEmail.trim(),
      bankCountry: payCountry.trim() || 'United States',
      paymentPurpose: finalPurpose,
      updatedAt: new Date().toISOString()
    };

    setIsSavingPayment(true);
    setCurrentPaymentDetails(newPaymentDetails);
    setSelectedPaymentPurpose(finalPurpose);
    setIsSavingPayment(false);
    setModalMode('preview_invoice');
  };



  // Portal Workflow States (Step 1 -> Step 4)
  const [portalAccounts, setPortalAccounts] = useState<ClientPortalAccount[]>([]);
  const [selectedPortalId, setSelectedPortalId] = useState<string>('');
  const [portalDocType, setPortalDocType] = useState<'Proposal PDF' | 'Invoice PDF' | 'Proposal Image'>('Proposal PDF');
  const [isPublishingToPortal, setIsPublishingToPortal] = useState(false);

  // Print & Canvas Refs
  const proposalDocRef = useRef<HTMLDivElement>(null);
  const invoiceDocRef = useRef<HTMLDivElement>(null);
  const imageDocRef = useRef<HTMLDivElement>(null);

  // Selected Client
  const selectedClient = useMemo(() => {
    return clients.find(c => c.id === selectedClientId) || null;
  }, [clients, selectedClientId]);

  // Current Service Catalog with custom add-ons merge
  const currentCatalog = useMemo(() => {
    if (!selectedCategory) return { types: [], features: [] };
    const cat = SERVICE_CATALOGS[selectedCategory] || { types: [], features: [] };
    const customList = customCategoryOptions[selectedCategory] || [];
    return {
      types: cat.types,
      features: [...cat.features, ...customList]
    };
  }, [selectedCategory, customCategoryOptions]);

  // Toggle selection for an option feature card
  const toggleFeature = (featureName: string) => {
    setSelectedFeatures(prev => 
      prev.includes(featureName)
        ? prev.filter(f => f !== featureName)
        : [...prev, featureName]
    );
  };

  // Add custom add-on option handler
  const handleAddCustomOption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomOptionName.trim() || !selectedCategory) return;
    const priceNum = Math.max(0, Number(newCustomOptionPrice) || 0);
    const created: FeatureOption = {
      name: newCustomOptionName.trim(),
      description: newCustomOptionDesc.trim() || 'Custom Optional Add-on',
      price: priceNum
    };

    setCustomCategoryOptions(prev => ({
      ...prev,
      [selectedCategory]: [...(prev[selectedCategory] || []), created]
    }));

    setSelectedFeatures(prev => [...prev, created.name]);
    setNewCustomOptionName('');
    setNewCustomOptionDesc('');
    setNewCustomOptionPrice('');
    setShowAddCustomModal(false);
    showToast?.(`Custom option "${created.name}" added`, 'success');
  };

  // When Category changes -> reset type and features
  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setSelectedType(null);
    setSelectedFeatures([]);
    setUnitBasePrice('');
  };

  // When Package Type changes -> update base price & keep features available
  const handleTypeSelect = (typeName: string, price: number) => {
    setSelectedType(typeName);
    setUnitBasePrice(price);
  };

  // Calculations
  const basePriceNum = Number(unitBasePrice || 0);

  const addonsTotal = useMemo(() => {
    let sum = 0;
    selectedFeatures.forEach(fName => {
      const found = currentCatalog.features.find(f => f.name === fName);
      if (found) sum += found.price;
    });
    return sum;
  }, [selectedFeatures, currentCatalog]);

  const unitTotal = basePriceNum + addonsTotal + Number(customExtraCost || 0);
  const subtotal = unitTotal * Math.max(1, Number(itemQuantity || 1));

  const discountAmount = useMemo(() => {
    const val = Number(discountValue || 0);
    if (discountType === 'Percentage') {
      return (subtotal * val) / 100;
    }
    return Math.min(subtotal, val);
  }, [subtotal, discountType, discountValue]);

  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
  
  const taxAmount = useMemo(() => {
    const rate = Number(taxPercentage || 0);
    return (subtotalAfterDiscount * rate) / 100;
  }, [subtotalAfterDiscount, taxPercentage]);

  const grandTotal = subtotalAfterDiscount + taxAmount;

  // Search filtered clients (Search ONLY, no free text typing)
  const filteredClients = useMemo(() => {
    if (!clientSearchQuery.trim()) return clients;
    const q = clientSearchQuery.toLowerCase();
    return clients.filter(c => 
      c.name.toLowerCase().includes(q) || 
      (c.company && c.company.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  }, [clients, clientSearchQuery]);

  // Reset form
  const handleResetForm = () => {
    setSelectedClientId('');
    setSelectedCategory('');
    setSelectedType(null);
    setSelectedFeatures([]);
    setItemQuantity(1);
    setUnitBasePrice('');
    setCustomExtraCost('');
    setDiscountType('Percentage');
    setDiscountValue(0);
    setTaxPercentage(0);
    setProjectNotes('');
    setDeliveryDate('');
  };

  // Build current quotation object
  const buildQuotationObject = (status: 'Draft' | 'Sent' = 'Draft'): ProposalQuotation => {
    const quoteNo = `QUO-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowStr = new Date().toISOString();
    
    const validDate = new Date();
    validDate.setDate(validDate.getDate() + 30);
    const validUntilStr = validDate.toISOString().split('T')[0];

    const itemAddons = selectedFeatures.map(fName => {
      const found = currentCatalog.features.find(f => f.name === fName);
      return {
        name: fName,
        price: found ? found.price : 0
      };
    });

    const currentItem: ProposalItem = {
      id: `item-${Date.now()}`,
      categoryId: selectedCategory || 'general',
      categoryName: selectedCategory || 'General Service',
      optionName: selectedType || 'Standard Package',
      basePrice: basePriceNum,
      quantity: Math.max(1, Number(itemQuantity || 1)),
      selectedAddons: itemAddons,
      customNotes: projectNotes,
      itemTotal: subtotal
    };

    const calculatedStages: PaymentScheduleStage[] = paymentStructure === 'custom'
      ? customStages.map(s => ({
          id: s.id || `stage-${Date.now()}-${Math.random()}`,
          name: s.name.trim() || 'Payment Milestone',
          percentage: Number(s.percentage) || 0,
          amount: (grandTotal * (Number(s.percentage) || 0)) / 100
        }))
      : paymentStructure === 'full'
      ? [{ id: '1', name: 'Full Payment Upon Approval', percentage: 100, amount: grandTotal }]
      : [
          { id: '1', name: '50% Advance Upon Approval', percentage: 50, amount: grandTotal * 0.5 },
          { id: '2', name: '50% Upon Project Completion', percentage: 50, amount: grandTotal * 0.5 }
        ];

    let termsText = '';
    if (paymentStructure === 'full') {
      termsText = `Full payment of ${formatCurrency(grandTotal, '$')} is required upon approval.`;
    } else if (paymentStructure === 'split_50_50') {
      termsText = `50% Advance Upon Approval (${formatCurrency(grandTotal * 0.5, '$')}), 50% Upon Project Completion (${formatCurrency(grandTotal * 0.5, '$')}).`;
    } else {
      termsText = calculatedStages.map(s => `${s.name} (${s.percentage}%): ${formatCurrency(s.amount, '$')}`).join(' | ');
    }

    return {
      id: `prop-${Date.now()}`,
      proposalNumber: quoteNo,
      title: `${selectedCategory || 'Service'} - ${selectedType || 'Package'}`,
      clientId: selectedClientId,
      clientName: selectedClient ? selectedClient.name : 'Unassigned Client',
      clientEmail: selectedClient?.email || '',
      clientCompany: selectedClient?.company || '',
      status,
      currency: 'USD',
      currencySymbol: '$',
      items: [currentItem],
      subtotal,
      oneTimeTotal: grandTotal,
      monthlyRecurringTotal: 0,
      discountType,
      discountValue: Number(discountValue || 0),
      discountAmount,
      taxPercentage: Number(taxPercentage || 0),
      taxAmount,
      estimatedTeamCost: Math.round(subtotal * 0.4),
      targetProfitMarginPercent: 60,
      calculatedProfitMarginAmount: Math.round(subtotal * 0.6),
      grandTotal: grandTotal,
      paymentStructure,
      paymentSchedule: calculatedStages,
      paymentTermsText: termsText,
      validUntilDate: validUntilStr,
      notes: projectNotes,
      termsAndConditions: `1. Proposal valid for 30 days from issuance date.\n2. Delivery Date: ${deliveryDate || 'To be scheduled'}.\n3. Scope adjustments or additional deliverables subject to mutually agreed revision.\n4. Final deliverables and assets released upon milestone completion.`,
      createdAt: nowStr,
      updatedAt: nowStr
    };
  };

  // Click "Generate Proposal" -> Open Modal
  const handleOpenGenerateModal = () => {
    if (!selectedClientId) {
      showToast?.('Please select an existing client first', 'error');
      return;
    }
    if (!selectedCategory || !selectedType) {
      showToast?.('Please select a Service Category and Package Type', 'error');
      return;
    }
    if (paymentStructure === 'custom' && customStagesTotalPercentage !== 100) {
      showToast?.(`Custom payment schedule must total 100% (currently ${customStagesTotalPercentage}%).`, 'error');
      return;
    }

    const proposalObj = buildQuotationObject('Sent');
    setGeneratedProposalObj(proposalObj);
    setModalMode('options');
    setShowGenerateModal(true);
  };

  // Save Draft
  const handleSaveDraft = async () => {
    if (!selectedClientId) {
      showToast?.('Please select a client before saving draft', 'error');
      return;
    }
    setIsSaving(true);
    try {
      const proposalObj = buildQuotationObject('Draft');
      if (onSaveProposal) {
        onSaveProposal(proposalObj);
      } else {
        await saveToFirestore('proposals', proposalObj.id, proposalObj);
      }
      showToast?.('Quotation draft saved successfully to CRM!', 'success');
      setActiveTab('history');
    } catch (err: any) {
      showToast?.(`Error saving draft: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper: Sanitize Filenames
  const formatFilename = (prefix: string, clientName: string, extension: string) => {
    const sanitizedClient = (clientName || 'Client')
      .replace(/[^a-zA-Z0-9\s_-]/g, '')
      .trim()
      .replace(/\s+/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    return `${prefix}-${sanitizedClient}-${dateStr}.${extension}`;
  };

  // Helper: Trigger browser download via Blob URL
  const triggerDownload = (url: string, filename: string) => {
    console.log('[Proposal Generator] Download started for:', filename);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      console.log('[Proposal Generator] Download completed for:', filename);
    }, 1000);
  };

  // Helper: Convert DataURL to Blob and trigger download
  const downloadDataUrl = (dataUrl: string, filename: string) => {
    try {
      const parts = dataUrl.split(',');
      const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      triggerDownload(blobUrl, filename);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } catch (err) {
      console.warn('[Proposal Generator] Fallback dataUrl download:', err);
      triggerDownload(dataUrl, filename);
    }
  };

  // Download PDF helper
  const handleDownloadPdfRef = async (ref: React.RefObject<HTMLDivElement | null>, defaultPrefix: string) => {
    if (!generatedProposalObj) {
      showToast?.('No quotation selected for download', 'error');
      return;
    }

    const exportType = defaultPrefix.toLowerCase().includes('invoice') ? 'invoice' : 'proposal';
    console.log(`[Proposal Generator] ${exportType.toUpperCase()} PDF generation started...`);

    try {
      showToast?.(`Generating ${exportType === 'invoice' ? 'Invoice' : 'Proposal'} PDF...`, 'success');
      
      const filename = await generatePdfFromProposal(
        generatedProposalObj,
        exportType,
        currentPaymentDetails,
        selectedPaymentPurpose,
        ref?.current
      );

      console.log(`[Proposal Generator] ${exportType.toUpperCase()} PDF generated successfully`);
      showToast?.(`PDF downloaded successfully: ${filename}`, 'success');
    } catch (err: any) {
      console.error('[Proposal Generator] PDF export error:', err);
      showToast?.(`PDF generation failed: ${err?.message || 'Unknown error'}`, 'error');
    }
  };

  // Download Proposal Image helper
  const handleDownloadImageRef = async (ref: React.RefObject<HTMLDivElement | null>, defaultPrefix: string) => {
    if (!generatedProposalObj) {
      showToast?.('No quotation selected for download', 'error');
      return;
    }

    console.log('[Proposal Generator] Image generation started...');

    try {
      showToast?.('Generating image asset...', 'success');

      const filename = await generateImageFromProposal(
        generatedProposalObj,
        ref?.current
      );

      console.log('[Proposal Generator] Image generated successfully');
      showToast?.(`Image downloaded successfully: ${filename}`, 'success');
    } catch (err: any) {
      console.error('[Proposal Generator] Image export error:', err);
      showToast?.(`Image generation failed: ${err?.message || 'Unknown error'}`, 'error');
    }
  };

  // Initialize Portal Workflow
  const handleStartPortalWorkflow = async () => {
    if (!selectedClientId) return;
    setIsPublishingToPortal(true);
    try {
      const records = await getCollectionOnce<ClientPortalAccount>('clientPortals');
      setPortalAccounts(records);
      
      // Filter portals belonging ONLY to this client
      const matchingPortals = records.filter(p => p.clientId === selectedClientId);
      if (matchingPortals.length > 0) {
        setSelectedPortalId(matchingPortals[0].id || matchingPortals[0].portalId);
      } else {
        setSelectedPortalId('');
      }
      setModalMode('portal_workflow');
    } catch (err: any) {
      console.error(err);
      showToast?.('Failed to fetch client portals', 'error');
    } finally {
      setIsPublishingToPortal(false);
    }
  };

  // Create Portal Account for client if none exists
  const handleCreatePortalForClient = async () => {
    if (!selectedClient) return;
    setIsPublishingToPortal(true);
    try {
      const nowStr = new Date().toISOString();
      const newPortalId = `portal-${Date.now()}`;
      const brandNewPortal: ClientPortalAccount = {
        id: newPortalId,
        portalId: newPortalId,
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        clientEmail: selectedClient.email || '',
        clientCompany: selectedClient.company || '',
        username: selectedClient.email || selectedClient.name.toLowerCase().replace(/\s+/g, ''),
        status: 'Active',
        createdAt: nowStr,
        updatedAt: nowStr,
        folders: [
          {
            id: `folder-payment-${Date.now()}`,
            name: 'Payment',
            description: 'Quotations, Invoices & Payment Receipts',
            parentId: null,
            createdAt: nowStr
          }
        ],
        documents: []
      };

      await saveToFirestore('clientPortals', brandNewPortal.id, brandNewPortal);
      setPortalAccounts([brandNewPortal, ...portalAccounts]);
      setSelectedPortalId(brandNewPortal.id);
      showToast?.(`Created new Client Portal for ${selectedClient.name}!`, 'success');
    } catch (err: any) {
      showToast?.(`Error creating portal: ${err.message}`, 'error');
    } finally {
      setIsPublishingToPortal(false);
    }
  };

  // Confirm Upload to Portal (Step 4 Execution)
  const handleConfirmPortalUpload = async () => {
    if (!generatedProposalObj || !selectedClient) return;
    setIsPublishingToPortal(true);
    try {
      let portalObj = portalAccounts.find(p => p.id === selectedPortalId || p.portalId === selectedPortalId);
      const nowStr = new Date().toISOString();

      if (!portalObj) {
        // Auto-create portal if none selected
        const newPortalId = `portal-${Date.now()}`;
        portalObj = {
          id: newPortalId,
          portalId: newPortalId,
          clientId: selectedClient.id,
          clientName: selectedClient.name,
          clientEmail: selectedClient.email || '',
          clientCompany: selectedClient.company || '',
          username: selectedClient.email || selectedClient.name.toLowerCase().replace(/\s+/g, ''),
          status: 'Active',
          createdAt: nowStr,
          updatedAt: nowStr,
          folders: [],
          documents: []
        };
      }

      // Step 2: Check or create "Payment" folder
      const existingFolders = portalObj.folders || [];
      let paymentFolder = existingFolders.find(f => f.name.toLowerCase() === 'payment' || f.name.toLowerCase() === 'payments');
      let updatedFolders = [...existingFolders];

      if (!paymentFolder) {
        paymentFolder = {
          id: `folder-payment-${Date.now()}`,
          name: 'Payment',
          description: 'Quotations, Invoices & Payment Records',
          parentId: null,
          createdAt: nowStr
        };
        updatedFolders.push(paymentFolder);
      }

      // Step 3 & 4: Construct document entry
      const docId = `doc-${Date.now()}`;
      const docTitle = `${portalDocType}: ${generatedProposalObj.proposalNumber} - ${generatedProposalObj.title}`;
      
      const newPortalDoc = {
        id: docId,
        title: docTitle,
        docType: portalDocType === 'Invoice PDF' ? 'INVOICE' : portalDocType === 'Proposal Image' ? 'IMAGE' : 'PDF',
        status: 'Active',
        uploadedAt: nowStr,
        notes: `Total Amount: $${generatedProposalObj.grandTotal.toLocaleString()} | Service: ${selectedCategory}`,
        category: 'Payment',
        folderId: paymentFolder.id,
        fileUrl: '#'
      };

      const updatedDocs = [newPortalDoc, ...(portalObj.documents || [])];

      const updatedPortal = {
        ...portalObj,
        folders: updatedFolders,
        documents: updatedDocs,
        updatedAt: nowStr
      };

      // Save to Firestore clientPortals
      await saveToFirestore('clientPortals', updatedPortal.id, updatedPortal);

      // Save to Firestore proposals
      if (onSaveProposal) {
        onSaveProposal(generatedProposalObj);
      } else {
        await saveToFirestore('proposals', generatedProposalObj.id, generatedProposalObj);
      }

      showToast?.(`Document "${portalDocType}" uploaded to ${selectedClient.name}'s portal in Payment folder!`, 'success');
      setShowGenerateModal(false);
    } catch (err: any) {
      console.error(err);
      showToast?.(`Failed to upload to portal: ${err.message}`, 'error');
    } finally {
      setIsPublishingToPortal(false);
    }
  };

  // Handle direct send to portal with format choice and real upload progress
  const handleInitiateSendToPortal = async () => {
    if (!generatedProposalObj) return;
    const records = await getCollectionOnce<ClientPortalAccount>('clientPortals');
    const existingPortal = records.find(p => 
      (generatedProposalObj.clientId && p.clientId === generatedProposalObj.clientId) || 
      p.clientName.toLowerCase() === generatedProposalObj.clientName.toLowerCase()
    );
    
    if (!existingPortal) {
      setNewPortalForm({
        portalName: generatedProposalObj.clientName,
        username: generatedProposalObj.clientName.toLowerCase().replace(/[^a-z0-9]/g, '') + 'client',
        password: Math.random().toString(36).slice(-8),
        status: 'Active'
      });
      setModalMode('no_portal_prompt');
    } else {
      setModalMode('send_to_portal_select');
    }
  };

  const handleCreatePortalInline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPortalForm.portalName || !newPortalForm.username || !newPortalForm.password) {
      showToast?.('Please fill all required fields.', 'error');
      return;
    }
    
    setIsCreatingPortal(true);
    try {
      const newId = `portal-${Date.now()}`;
      const secureToken = crypto.randomUUID ? crypto.randomUUID() : 'sec-' + Date.now();
      
      const portalData: ClientPortalAccount = {
        id: newId,
        portalId: newId,
        secureToken,
        clientId: generatedProposalObj?.clientId || newId,
        clientName: newPortalForm.portalName,
        clientEmail: generatedProposalObj?.clientEmail || '',
        username: newPortalForm.username,
        password: newPortalForm.password,
        status: newPortalForm.status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        permissions: { canAccessFiles: true, canUploadFiles: true, canCreateFolders: true },
        assignedProjectIds: [],
        assignedClientIds: generatedProposalObj?.clientId ? [generatedProposalObj.clientId] : []
      } as any;
      
      await saveToFirestore('clientPortals', portalData.id, portalData);
      showToast?.(`Created Client Portal for ${newPortalForm.portalName}`, 'success');
      
      // Successfully created, move to the send-to-portal select mode
      setModalMode('send_to_portal_select');
    } catch (err) {
      showToast?.('Failed to create portal', 'error');
    } finally {
      setIsCreatingPortal(false);
    }
  };
  const handleSendToPortalFormat = async (format: 'pdf' | 'image' | 'invoice') => {
    if (!generatedProposalObj) return;
    setIsUploadingToPortal(true);
    setUploadProgress(15);

    try {
      let file: File;
      let fileName = '';
      let docType = 'PDF';

      if (format === 'pdf') {
        const htmlStr = buildProposalExportHtml(generatedProposalObj, currentPaymentDetails);
        const container = document.createElement('div');
        container.innerHTML = htmlStr;
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        document.body.appendChild(container);
        const canvas = await safeHtml2Canvas(container.firstElementChild as HTMLElement || container, { scale: 2 });
        document.body.removeChild(container);
        
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        const pdfBlob = pdf.output('blob');
        fileName = formatFilename('Proposal', generatedProposalObj.clientName, 'pdf');
        file = new File([pdfBlob], fileName, { type: 'application/pdf' });
        docType = 'PDF';
      } else if (format === 'image') {
        const htmlStr = buildProposalImageExportHtml(generatedProposalObj, currentPaymentDetails);
        const container = document.createElement('div');
        container.innerHTML = htmlStr;
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        document.body.appendChild(container);
        const canvas = await safeHtml2Canvas(container.firstElementChild as HTMLElement || container, { scale: 2 });
        document.body.removeChild(container);
        
        const dataUrl = canvas.toDataURL('image/png', 0.95);
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        fileName = formatFilename('Proposal', generatedProposalObj.clientName, 'png');
        file = new File([blob], fileName, { type: 'image/png' });
        docType = 'IMAGE';
      } else {
        const htmlStr = buildInvoiceExportHtml(generatedProposalObj, currentPaymentDetails, selectedPaymentPurpose);
        const container = document.createElement('div');
        container.innerHTML = htmlStr;
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        document.body.appendChild(container);
        const canvas = await safeHtml2Canvas(container.firstElementChild as HTMLElement || container, { scale: 2 });
        document.body.removeChild(container);
        
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        const pdfBlob = pdf.output('blob');
        fileName = formatFilename('Invoice', generatedProposalObj.clientName, 'pdf');
        file = new File([pdfBlob], fileName, { type: 'application/pdf' });
        docType = 'INVOICE';
      }

      setUploadProgress(40);

      let uploadRes;
      try {
        uploadRes = await uploadPortalFile(file, `clients/${generatedProposalObj.clientId || 'default'}/documents`, (pct) => {
          setUploadProgress(40 + Math.round(pct * 0.5));
        });
      } catch (uploadErr) {
        console.warn('Backend storage upload fallback:', uploadErr);
        const reader = new FileReader();
        const dataUrlPromise = new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        const dataUrl = await dataUrlPromise;
        uploadRes = { fileUrl: dataUrl, size: `${(file.size / 1024).toFixed(1)} KB`, fileName };
      }

      setUploadProgress(90);

      const records = await getCollectionOnce<ClientPortalAccount>('clientPortals');
      let clientPortal = records.find(p => p.clientId === generatedProposalObj.clientId || p.clientName.toLowerCase() === generatedProposalObj.clientName.toLowerCase());
      
      const nowStr = new Date().toISOString();
      if (!clientPortal) {
        showToast?.('Error: Client Portal does not exist.', 'error');
        setIsUploadingToPortal(false);
        return;
      }

      // Continue handleSendToPortalFormat
      const newDoc = {
        id: `doc-${Date.now()}`,
        title: `${docType}: ${generatedProposalObj.proposalNumber} - ${generatedProposalObj.title}`,
        type: docType === 'IMAGE' ? 'image/png' : 'application/pdf',
        size: uploadRes.size,
        url: uploadRes.fileUrl,
        uploadedBy: 'Zyqro Admin',
        uploadedAt: nowStr
      };
      
      const updatedPortal = { ...clientPortal, documents: [...(clientPortal.documents || []), newDoc], updatedAt: nowStr };
      await saveToFirestore('clientPortals', updatedPortal.id, updatedPortal);
      
      setUploadProgress(100);
      showToast?.(`Successfully sent ${docType} to ${clientPortal.clientName}'s Portal.`, 'success');
      setTimeout(() => {
        setIsUploadingToPortal(false);
        setModalMode('options');
      }, 1000);
    } catch (err) {
      console.error(err);
      showToast?.('Failed to send to portal.', 'error');
      setIsUploadingToPortal(false);
    }
  };


  return (
    <div className="bg-white dark:bg-[var(--crm-card)] rounded-2xl shadow-sm border border-slate-200 dark:border-[var(--crm-card-border)] p-4 sm:p-5 flex flex-col space-y-4 text-slate-800 dark:text-[var(--crm-text)]">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-[var(--crm-card-border)] pb-4 mb-2">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-[var(--crm-text)] font-structure tracking-tight">Proposal & Quotation Engine</h2>
        <div className="flex bg-slate-50 dark:bg-[var(--crm-sidebar)] p-1 rounded-lg border border-slate-200 dark:border-transparent">
          <button onClick={() => setActiveTab('form')} className={`px-4 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-all ${activeTab === 'form' ? 'bg-white dark:bg-[var(--crm-card)] shadow-xs text-slate-900 dark:text-[var(--crm-text)] border border-slate-200 dark:border-transparent' : 'text-slate-500 hover:text-slate-800 dark:text-[var(--crm-text-secondary)] dark:hover:text-[var(--crm-text)]'}`}>New Proposal</button>
          <button onClick={() => setActiveTab('history')} className={`px-4 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-all ${activeTab === 'history' ? 'bg-white dark:bg-[var(--crm-card)] shadow-xs text-slate-900 dark:text-[var(--crm-text)] border border-slate-200 dark:border-transparent' : 'text-slate-500 hover:text-slate-800 dark:text-[var(--crm-text-secondary)] dark:hover:text-[var(--crm-text)]'}`}>History</button>
        </div>
      </div>

      {activeTab === 'history' && (
        <div className="space-y-3">
          {savedProposals && savedProposals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 4k:grid-cols-7 5k:grid-cols-10 gap-3">
              {savedProposals.map(prop => (
                <div key={prop.id} className="border border-slate-200 dark:border-[var(--crm-card-border)] rounded-xl p-4 flex flex-col bg-white dark:bg-[var(--crm-card)] shadow-xs hover:shadow-md transition-shadow">
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-[var(--crm-text-muted)] mb-1 tracking-wide">{prop.proposalNumber}</div>
                  <div className="font-semibold text-slate-900 dark:text-[var(--crm-text)] text-sm mb-1 line-clamp-1">{prop.title}</div>
                  <div className="text-xs text-slate-600 dark:text-[var(--crm-text-secondary)] mb-4">{prop.clientName}</div>
                  <div className="mt-auto pt-3 border-t border-slate-100 dark:border-[var(--crm-card-border)] flex justify-between items-center">
                    <span className="font-semibold text-slate-900 dark:text-[var(--crm-text)] text-sm font-mono tracking-tight">{formatCurrency(prop.grandTotal || prop.oneTimeTotal || 0, prop.currencySymbol || '$')}</span>
                    <button onClick={() => { setGeneratedProposalObj(prop); setModalMode('options'); setShowGenerateModal(true); }} className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg shadow-sm hover:bg-slate-800 font-medium transition-all cursor-pointer">Options</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[var(--crm-text-secondary)] text-xs sm:text-sm py-4 text-center">No saved proposals found.</div>
          )}
        </div>
      )}

      {activeTab === 'form' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 4k:grid-cols-7 5k:grid-cols-10 gap-4 lg:gap-5">
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-[var(--crm-card)] rounded-2xl shadow-sm border border-slate-200 dark:border-[var(--crm-card-border)]/60 p-5 sm:p-6">
              <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-[var(--crm-card-border)] pb-3">
                <h3 className="font-bold text-slate-800 dark:text-[var(--crm-text)] text-base sm:text-lg flex items-center gap-2">
                  <FileText size={18} className="text-slate-700 dark:text-[var(--crm-text)]" />
                  Quotation Details
                </h3>
                <button 
                  onClick={() => {
                    setSelectedClientId('');
                    setSelectedCategory('');
                    setSelectedType(null);
                    setSelectedFeatures([]);
                    setDiscountValue(0);
                    setCustomExtraCost(0);
                  }} 
                  className="text-xs font-semibold text-slate-600 dark:text-[var(--crm-text-secondary)] hover:text-slate-900 dark:hover:text-[var(--crm-text)] transition-colors bg-slate-50 dark:bg-[var(--crm-sidebar)] hover:bg-slate-100 dark:hover:bg-[var(--crm-sidebar-active-bg)] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[var(--crm-card-border)]/60 cursor-pointer"
                >
                  Reset Form
                </button>
              </div>

              <div className="space-y-6">
                {/* STEP 1 & STEP 2 SIDE-BY-SIDE */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {/* STEP 1 */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-[var(--crm-text-secondary)] uppercase tracking-wider">Step 1 — Select Client</h4>
                    <div>
                      <select value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)} className="w-full text-xs sm:text-sm rounded-xl border-slate-200 dark:border-[var(--crm-card-border)] bg-slate-50 dark:bg-[var(--crm-card)] shadow-xs focus:bg-white focus:dark:bg-[var(--crm-card)] focus:border-slate-400 focus:ring-2 focus:ring-slate-400/20 transition-all h-10 px-3 text-slate-800 dark:text-[var(--crm-text)] font-semibold">
                        <option value="">-- Choose Client --</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.company})</option>)}
                      </select>
                    </div>
                  </div>

                  {/* STEP 2 */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-[var(--crm-text-secondary)] uppercase tracking-wider">Step 2 — Select Service Category</h4>
                    <div>
                      <select value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); setSelectedType(null); setSelectedFeatures([]); }} className="w-full text-xs sm:text-sm rounded-xl border-slate-200 dark:border-[var(--crm-card-border)] bg-slate-50 dark:bg-[var(--crm-card)] shadow-xs focus:bg-white focus:dark:bg-[var(--crm-card)] focus:border-slate-400 focus:ring-2 focus:ring-slate-400/20 transition-all h-10 px-3 text-slate-800 dark:text-[var(--crm-text)] font-semibold">
                        <option value="">-- Choose Category --</option>
                        {Object.keys(SERVICE_CATALOGS || {}).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {selectedCategory && (
                  <>
                    <div className="border-t border-slate-100 dark:border-[var(--crm-card-border)] my-2"></div>

                    {/* STEP 3 */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-700 dark:text-[var(--crm-text-secondary)] uppercase tracking-wider">Step 3 — Select Package Type</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(currentCatalog?.types || []).map((t: any) => {
                          const isSelected = selectedType === t.name;
                          return (
                            <div
                              key={t.name}
                              onClick={() => handleTypeSelect(t.name, t.price)}
                              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 select-none ${
                                isSelected
                                  ? 'bg-indigo-50/50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/50 ring-1 ring-indigo-500/30 shadow-sm'
                                  : 'bg-white dark:bg-[var(--crm-card)] shadow-xs border-slate-200 dark:border-[var(--crm-card-border)] hover:border-slate-300 dark:hover:border-[var(--crm-text-muted)]'
                              }`}
                            >
                              <div className="flex justify-between items-start gap-2">
                                <span className={`text-sm font-semibold leading-snug ${isSelected ? 'text-indigo-900 dark:text-indigo-400' : 'text-slate-800 dark:text-[var(--crm-text)]'}`}>{t.name}</span>
                                <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md shrink-0 ${isSelected ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300' : 'bg-slate-100 dark:bg-[var(--crm-sidebar)] text-slate-700 dark:text-[var(--crm-text)]'}`}>
                                  {formatCurrency(t.price, '$')}
                                </span>
                              </div>
                              {t.description && (
                                <p className={`text-xs leading-snug line-clamp-2 ${isSelected ? 'text-indigo-800/80 dark:text-indigo-300/80' : 'text-slate-500 dark:text-[var(--crm-subtitle)]'}`}>{t.description}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-[var(--crm-card-border)] my-2"></div>

                    {/* STEP 4 */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h4 className="text-xs font-bold text-slate-700 dark:text-[var(--crm-text-secondary)] uppercase tracking-wider">
                          Step 4 — Smart Optional Add-ons ({selectedCategory || 'Service'})
                        </h4>
                        <button
                          type="button"
                          onClick={() => setShowAddCustomModal(true)}
                          className="text-xs font-semibold text-slate-700 dark:text-[var(--crm-text)] hover:text-slate-900 bg-slate-50 dark:bg-[var(--crm-sidebar)] hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[var(--crm-card-border)] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Plus size={14} />
                          <span>Add Custom Option</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {(currentCatalog?.features || []).map((f: any) => {
                          const isSelected = selectedFeatures.includes(f.name);
                          return (
                            <div
                              key={f.name}
                              onClick={() => toggleFeature(f.name)}
                              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                                isSelected
                                  ? 'bg-indigo-50/40 dark:bg-indigo-500/5 border-indigo-200 dark:border-indigo-500/40 shadow-sm'
                                  : 'bg-white dark:bg-[var(--crm-card)] shadow-xs border-slate-200 dark:border-[var(--crm-card-border)] hover:border-slate-300 dark:hover:border-[var(--crm-text-muted)]'
                              }`}
                            >
                              <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                isSelected ? 'bg-indigo-600 border-indigo-600 text-white dark:bg-indigo-500 dark:border-indigo-500' : 'border-slate-300 dark:border-[var(--crm-text-muted)] bg-white dark:bg-[var(--crm-card)]'
                              }`}>
                                {isSelected && <Check size={12} strokeWidth={3} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline gap-2">
                                  <span className={`text-xs sm:text-sm font-semibold truncate ${isSelected ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-800 dark:text-[var(--crm-text)]'}`}>{f.name}</span>
                                  <span className={`text-xs font-bold font-mono shrink-0 ${isSelected ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-600 dark:text-[var(--crm-text-secondary)]'}`}>+{formatCurrency(f.price, '$')}</span>
                                </div>
                                {f.description && (
                                  <p className={`text-xs mt-1 leading-snug line-clamp-1 ${isSelected ? 'text-indigo-800/70 dark:text-indigo-300/70' : 'text-slate-500 dark:text-[var(--crm-subtitle)]'}`}>{f.description}</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                <div className="border-t border-slate-100 dark:border-[var(--crm-card-border)] my-2"></div>

                {/* PRICING & SCOPE SETTINGS */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-[var(--crm-text-secondary)] uppercase tracking-wider">Pricing & Scope Settings</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-8 4k:grid-cols-12 5k:grid-cols-16 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-[var(--crm-text-secondary)] mb-1.5">Quantity</label>
                      <input type="number" min="1" value={itemQuantity} onChange={e => setItemQuantity(Number(e.target.value) || 1)} className="w-full text-xs sm:text-sm rounded-xl border-slate-200 dark:border-[var(--crm-card-border)] bg-slate-50 dark:bg-[var(--crm-card)] shadow-xs focus:bg-white focus:dark:bg-[var(--crm-card)] focus:border-slate-400 focus:ring-2 focus:ring-slate-400/20 transition-all h-9 px-3 text-slate-800 dark:text-[var(--crm-text)] font-semibold" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-[var(--crm-text-secondary)] mb-1.5">Extra ($)</label>
                      <input type="number" min="0" value={customExtraCost} onChange={e => setCustomExtraCost(Number(e.target.value) || '')} className="w-full text-xs sm:text-sm rounded-xl border-slate-200 dark:border-[var(--crm-card-border)] bg-slate-50 dark:bg-[var(--crm-card)] shadow-xs focus:bg-white focus:dark:bg-[var(--crm-card)] focus:border-slate-400 focus:ring-2 focus:ring-slate-400/20 transition-all h-9 px-3 text-slate-800 dark:text-[var(--crm-text)] font-semibold" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-[var(--crm-text-secondary)] mb-1.5">Discount</label>
                      <select value={discountType} onChange={e => setDiscountType(e.target.value as any)} className="w-full text-xs sm:text-sm rounded-xl border-slate-200 dark:border-[var(--crm-card-border)] bg-slate-50 dark:bg-[var(--crm-card)] shadow-xs focus:bg-white focus:dark:bg-[var(--crm-card)] focus:border-slate-400 focus:ring-2 focus:ring-slate-400/20 transition-all h-9 px-2 text-slate-800 dark:text-[var(--crm-text)] font-semibold">
                        <option value="Percentage">% Percent</option>
                        <option value="Fixed">$ Fixed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-[var(--crm-text-secondary)] mb-1.5">Disc. Val</label>
                      <input type="number" min="0" value={discountValue} onChange={e => setDiscountValue(Number(e.target.value) || '')} className="w-full text-xs sm:text-sm rounded-xl border-slate-200 dark:border-[var(--crm-card-border)] bg-slate-50 dark:bg-[var(--crm-card)] shadow-xs focus:bg-white focus:dark:bg-[var(--crm-card)] focus:border-slate-400 focus:ring-2 focus:ring-slate-400/20 transition-all h-9 px-3 text-slate-800 dark:text-[var(--crm-text)] font-semibold" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-[var(--crm-text-secondary)] mb-1.5">Tax (%)</label>
                      <input type="number" min="0" value={taxPercentage} onChange={e => setTaxPercentage(Number(e.target.value) || '')} className="w-full text-xs sm:text-sm rounded-xl border-slate-200 dark:border-[var(--crm-card-border)] bg-slate-50 dark:bg-[var(--crm-card)] shadow-xs focus:bg-white focus:dark:bg-[var(--crm-card)] focus:border-slate-400 focus:ring-2 focus:ring-slate-400/20 transition-all h-9 px-3 text-slate-800 dark:text-[var(--crm-text)] font-semibold" />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-[var(--crm-card-border)] my-2"></div>

                {/* STEP 5 — PAYMENT STRUCTURE & TERMS */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-[var(--crm-text-secondary)] uppercase tracking-wider flex items-center gap-2">
                      <CreditCard size={15} className="text-slate-500 dark:text-[var(--crm-text-secondary)]" />
                      Step 5 — Payment Structure & Terms *
                    </h4>
                    {paymentStructure === 'custom' && (
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md border ${
                        customStagesTotalPercentage === 100 
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 border-emerald-200' 
                          : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 border-rose-200'
                      }`}>
                        Total: {customStagesTotalPercentage}% {customStagesTotalPercentage === 100 ? '✓' : '(Must equal 100%)'}
                      </span>
                    )}
                  </div>

                  {/* 3 Payment Structure Toggle Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentStructure('full')}
                      className={`p-4 rounded-xl border text-left transition-all select-none cursor-pointer flex flex-col justify-between ${
                        paymentStructure === 'full'
                          ? 'bg-indigo-50/60 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/50 shadow-sm ring-1 ring-indigo-500/30'
                          : 'bg-white dark:bg-[var(--crm-card)] border-slate-200 dark:border-[var(--crm-card-border)] hover:border-slate-300 dark:hover:border-[var(--crm-text-muted)] shadow-xs hover:shadow-sm'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-sm font-bold ${paymentStructure === 'full' ? 'text-indigo-900 dark:text-indigo-400' : 'text-slate-800 dark:text-[var(--crm-text)]'}`}>Full Payment</span>
                          {paymentStructure === 'full' && <Check size={16} className="text-indigo-600 dark:text-indigo-400" />}
                        </div>
                        <p className={`text-xs font-medium leading-snug ${paymentStructure === 'full' ? 'text-indigo-800/80 dark:text-indigo-300/80' : 'text-slate-500 dark:text-[var(--crm-subtitle)]'}`}>
                          100% upon approval
                        </p>
                      </div>
                      <div className={`mt-3 pt-3 border-t font-mono font-bold text-sm ${paymentStructure === 'full' ? 'border-indigo-200/60 text-indigo-800 dark:border-indigo-500/30 dark:text-indigo-300' : 'border-slate-100 dark:border-[var(--crm-card-border)]/60 text-slate-800 dark:text-[var(--crm-text)]'}`}>
                        {formatCurrency(grandTotal, '$')}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentStructure('split_50_50')}
                      className={`p-4 rounded-xl border text-left transition-all select-none cursor-pointer flex flex-col justify-between ${
                        paymentStructure === 'split_50_50'
                          ? 'bg-indigo-50/60 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/50 shadow-sm ring-1 ring-indigo-500/30'
                          : 'bg-white dark:bg-[var(--crm-card)] border-slate-200 dark:border-[var(--crm-card-border)] hover:border-slate-300 dark:hover:border-[var(--crm-text-muted)] shadow-xs hover:shadow-sm'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-sm font-bold ${paymentStructure === 'split_50_50' ? 'text-indigo-900 dark:text-indigo-400' : 'text-slate-800 dark:text-[var(--crm-text)]'}`}>50/50 Split</span>
                          {paymentStructure === 'split_50_50' && <Check size={16} className="text-indigo-600 dark:text-indigo-400" />}
                        </div>
                        <p className={`text-xs font-medium leading-snug ${paymentStructure === 'split_50_50' ? 'text-indigo-800/80 dark:text-indigo-300/80' : 'text-slate-500 dark:text-[var(--crm-subtitle)]'}`}>
                          50% Advance + 50% Completion
                        </p>
                      </div>
                      <div className={`mt-3 pt-3 border-t font-mono font-bold text-sm ${paymentStructure === 'split_50_50' ? 'border-indigo-200/60 text-indigo-800 dark:border-indigo-500/30 dark:text-indigo-300' : 'border-slate-100 dark:border-[var(--crm-card-border)]/60 text-slate-800 dark:text-[var(--crm-text)]'}`}>
                        2x {formatCurrency(grandTotal * 0.5, '$')}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentStructure('custom')}
                      className={`p-4 rounded-xl border text-left transition-all select-none cursor-pointer flex flex-col justify-between ${
                        paymentStructure === 'custom'
                          ? 'bg-indigo-50/60 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/50 shadow-sm ring-1 ring-indigo-500/30'
                          : 'bg-white dark:bg-[var(--crm-card)] border-slate-200 dark:border-[var(--crm-card-border)] hover:border-slate-300 dark:hover:border-[var(--crm-text-muted)] shadow-xs hover:shadow-sm'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-sm font-bold ${paymentStructure === 'custom' ? 'text-indigo-900 dark:text-indigo-400' : 'text-slate-800 dark:text-[var(--crm-text)]'}`}>Custom Schedule</span>
                          {paymentStructure === 'custom' && <Check size={16} className="text-indigo-600 dark:text-indigo-400" />}
                        </div>
                        <p className={`text-xs font-medium leading-snug ${paymentStructure === 'custom' ? 'text-indigo-800/80 dark:text-indigo-300/80' : 'text-slate-500 dark:text-[var(--crm-subtitle)]'}`}>
                          Multi-stage milestones
                        </p>
                      </div>
                      <div className={`mt-3 pt-3 border-t font-mono font-bold text-sm ${paymentStructure === 'custom' ? 'border-indigo-200/60 text-indigo-800 dark:border-indigo-500/30 dark:text-indigo-300' : 'border-slate-100 dark:border-[var(--crm-card-border)]/60 text-slate-800 dark:text-[var(--crm-text)]'}`}>
                        {customStages.length} Milestones
                      </div>
                    </button>
                  </div>

                  {/* CUSTOM PAYMENT SCHEDULE BUILDER */}
                  {paymentStructure === 'custom' && (
                    <div className="bg-slate-50 dark:bg-[var(--crm-sidebar)] border border-slate-200 dark:border-[var(--crm-card-border)]/80 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-800 dark:text-[var(--crm-text)]">Milestone Payment Stages</span>
                        <button
                          type="button"
                          onClick={() => {
                            setCustomStages(prev => [
                              ...prev,
                              { id: `stage-${Date.now()}`, name: `Milestone Stage ${prev.length + 1}`, percentage: 0, amount: 0 }
                            ]);
                          }}
                          className="text-xs font-semibold text-slate-700 dark:text-[var(--crm-text)] hover:text-slate-900 bg-white dark:bg-[var(--crm-card)] hover:bg-slate-100 dark:hover:bg-[var(--crm-sidebar-active-bg)] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[var(--crm-card-border)] flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                        >
                          <Plus size={14} />
                          <span>Add Stage</span>
                        </button>
                      </div>

                      <div className="space-y-3">
                        {customStages.map((stage, idx) => {
                          const stageAmount = (grandTotal * (Number(stage.percentage) || 0)) / 100;
                          return (
                            <div key={stage.id || idx} className="bg-white dark:bg-[var(--crm-card)] border border-slate-200 dark:border-[var(--crm-card-border)] rounded-xl p-3 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center shadow-xs">
                              <div className="sm:col-span-6">
                                <input
                                  type="text"
                                  value={stage.name}
                                  onChange={(e) => {
                                    const newName = e.target.value;
                                    setCustomStages(prev => prev.map((s, i) => i === idx ? { ...s, name: newName } : s));
                                  }}
                                  placeholder="Milestone title (e.g. Design Approval)"
                                  className="w-full text-sm font-semibold rounded-lg border-slate-200 dark:border-[var(--crm-card-border)] bg-slate-50 dark:bg-[var(--crm-sidebar)] focus:bg-white focus:dark:bg-[var(--crm-card)] focus:border-slate-400 focus:ring-1 focus:ring-slate-400/20 h-9 px-3 text-slate-800 dark:text-[var(--crm-text)]"
                                />
                              </div>
                              <div className="sm:col-span-3 flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min="1"
                                  max="100"
                                  value={stage.percentage || ''}
                                  onChange={(e) => {
                                    const val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                                    setCustomStages(prev => prev.map((s, i) => i === idx ? { ...s, percentage: val } : s));
                                  }}
                                  placeholder="%"
                                  className="w-full text-sm font-mono font-bold text-right rounded-lg border-slate-200 dark:border-[var(--crm-card-border)] bg-slate-50 dark:bg-[var(--crm-sidebar)] focus:bg-white focus:dark:bg-[var(--crm-card)] focus:border-slate-400 focus:ring-1 focus:ring-slate-400/20 h-9 px-3 text-slate-800 dark:text-[var(--crm-text)]"
                                />
                                <span className="text-sm font-semibold text-slate-500 dark:text-[var(--crm-text-secondary)]">%</span>
                              </div>
                              <div className="sm:col-span-2 text-right font-mono font-bold text-sm text-slate-800 dark:text-[var(--crm-text)]">
                                {formatCurrency(stageAmount, '$')}
                              </div>
                              <div className="sm:col-span-1 flex justify-end">
                                {customStages.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCustomStages(prev => prev.filter((_, i) => i !== idx));
                                    }}
                                    className="p-1.5 text-slate-400 dark:text-[var(--crm-text-muted)] hover:text-rose-600 hover:bg-rose-50 dark:bg-rose-500/10 rounded-md transition-colors cursor-pointer"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 dark:border-[var(--crm-card-border)] my-2"></div>

                {/* PROJECT NOTES & SPECIFICATIONS */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-[var(--crm-text-secondary)] uppercase tracking-wider">Project Notes & Specifications</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-1">
                      <label className="block text-xs font-semibold text-slate-600 dark:text-[var(--crm-text-secondary)] mb-1.5">Delivery Date</label>
                      <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} className="w-full text-xs sm:text-sm rounded-xl border-slate-200 dark:border-[var(--crm-card-border)] bg-slate-50 dark:bg-[var(--crm-card)] shadow-xs focus:bg-white focus:dark:bg-[var(--crm-card)] focus:border-slate-400 focus:ring-2 focus:ring-slate-400/20 transition-all h-10 px-3 text-slate-800 dark:text-[var(--crm-text)] font-semibold" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 dark:text-[var(--crm-text-secondary)] mb-1.5">Internal/Client Notes</label>
                      <textarea value={projectNotes} onChange={e => setProjectNotes(e.target.value)} rows={2} className="w-full text-xs sm:text-sm rounded-xl border-slate-200 dark:border-[var(--crm-card-border)] bg-slate-50 dark:bg-[var(--crm-card)] shadow-xs focus:bg-white focus:dark:bg-[var(--crm-card)] focus:border-slate-400 focus:ring-2 focus:ring-slate-400/20 transition-all p-3 text-slate-800 dark:text-[var(--crm-text)] font-medium resize-none placeholder-slate-400 dark:placeholder-slate-500" placeholder="Scope details, milestones or terms..." />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-[var(--crm-card)] rounded-2xl shadow-sm border border-slate-200 dark:border-[var(--crm-card-border)]/60 p-5 sm:p-6 sticky top-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-[var(--crm-card-border)] pb-4 mb-5">
                <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800 dark:text-[var(--crm-text)]">
                  <DollarSign size={18} className="text-slate-700 dark:text-[var(--crm-text)]" />
                  Quotation Summary
                </h3>
                <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 border border-emerald-200 dark:border-emerald-500/30 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                  Live Estimate
                </span>
              </div>

              {/* CLIENT / SERVICE SUMMARY */}
              <div className="bg-slate-50 dark:bg-[var(--crm-sidebar)] border border-slate-200 dark:border-[var(--crm-card-border)] rounded-xl p-4 mb-4 space-y-3">
                <div>
                  <div className="text-xs font-bold text-slate-500 dark:text-[var(--crm-text-muted)] mb-1 uppercase tracking-wider">Client</div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-[var(--crm-text)] truncate">{selectedClientId ? clients.find(c => c.id === selectedClientId)?.name || 'Unknown' : 'Not Selected'}</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs font-bold text-slate-500 dark:text-[var(--crm-text-muted)] mb-1 uppercase tracking-wider">Service</div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-[var(--crm-text)] truncate">{selectedCategory || 'Not Selected'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-500 dark:text-[var(--crm-text-muted)] mb-1 uppercase tracking-wider">Package</div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-[var(--crm-text)] truncate">{selectedType || 'Not Selected'}</div>
                  </div>
                </div>
              </div>

              {/* PAYMENT STRUCTURE SUMMARY */}
              <div className="bg-slate-50 dark:bg-[var(--crm-sidebar)] border border-slate-200 dark:border-[var(--crm-card-border)] rounded-xl p-4 mb-5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-500 dark:text-[var(--crm-text-muted)] uppercase tracking-wider">Payment Terms</div>
                  <span className="text-xs font-bold text-slate-900 dark:text-[var(--crm-text)]">
                    {paymentStructure === 'full' ? '100% Upfront' : paymentStructure === 'split_50_50' ? '50% / 50%' : 'Custom Schedule'}
                  </span>
                </div>

                {paymentStructure === 'full' && (
                  <div className="flex justify-between items-center text-sm font-semibold text-slate-800 dark:text-[var(--crm-text)] pt-2 border-t border-slate-200 dark:border-[var(--crm-card-border)]/60">
                    <span className="text-slate-600 dark:text-[var(--crm-text-secondary)]">Full on Approval:</span>
                    <span className="font-mono">{formatCurrency(grandTotal, '$')}</span>
                  </div>
                )}

                {paymentStructure === 'split_50_50' && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-[var(--crm-card-border)]/60 text-sm font-semibold">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-[var(--crm-text-secondary)]">50% Advance:</span>
                      <span className="font-mono text-slate-800 dark:text-[var(--crm-text)]">{formatCurrency(grandTotal * 0.5, '$')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-[var(--crm-text-secondary)]">50% Completion:</span>
                      <span className="font-mono text-slate-800 dark:text-[var(--crm-text)]">{formatCurrency(grandTotal * 0.5, '$')}</span>
                    </div>
                  </div>
                )}

                {paymentStructure === 'custom' && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-[var(--crm-card-border)]/60 text-sm font-semibold">
                    {customStages.map((stg, i) => (
                      <div key={i} className="flex justify-between items-center text-xs">
                        <span className="text-slate-600 dark:text-[var(--crm-text-secondary)] truncate max-w-[140px]">{stg.name || `Stage ${i+1}`} ({stg.percentage}%):</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-[var(--crm-text)]">
                          {formatCurrency((grandTotal * (Number(stg.percentage) || 0)) / 100, '$')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* PRICING */}
              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between items-center text-slate-600 dark:text-[var(--crm-text-secondary)] font-medium">
                  <span>Subtotal</span>
                  <span className="font-mono text-slate-800 dark:text-[var(--crm-text)] font-semibold">{formatCurrency(subtotal, '$')}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-slate-600 dark:text-[var(--crm-text-secondary)] font-medium">
                    <span>Discount</span>
                    <span className="font-mono text-rose-600 font-bold">-{formatCurrency(discountAmount, '$')}</span>
                  </div>
                )}
                {taxAmount > 0 && (
                  <div className="flex justify-between items-center text-slate-600 dark:text-[var(--crm-text-secondary)] font-medium">
                    <span>Tax ({taxPercentage}%)</span>
                    <span className="font-mono text-slate-800 dark:text-[var(--crm-text)] font-semibold">+{formatCurrency(taxAmount, '$')}</span>
                  </div>
                )}
                <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-[var(--crm-card-border)] flex justify-between items-center shadow-sm">
                  <span className="text-slate-800 dark:text-[var(--crm-text)] text-sm font-bold uppercase tracking-wider">Final Total</span>
                  <span className="font-mono text-slate-900 dark:text-[var(--crm-text)] text-2xl font-black tracking-tight">{formatCurrency(grandTotal, '$')}</span>
                </div>
              </div>

              {/* BUTTONS */}
              <div className="space-y-3">
                <button onClick={handleOpenGenerateModal} disabled={!selectedClientId || !selectedType} className="w-full bg-slate-900 hover:bg-slate-800 text-white shadow-md font-bold py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm cursor-pointer">
                  <FileCheck size={18} />
                  Generate Proposal
                </button>
                <button onClick={handleSaveDraft} disabled={isSaving || !selectedClientId} className="w-full bg-white dark:bg-[var(--crm-sidebar)] hover:bg-slate-50 border border-slate-200 dark:border-[var(--crm-card-border)]/80 text-slate-700 dark:text-[var(--crm-text)] py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold shadow-sm hover:shadow">
                  {isSaving ? 'Saving...' : 'Save Draft Quote'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
      {showGenerateModal && generatedProposalObj && (
        <div className="fixed inset-0 z-50 bg-[var(--crm-bg)]/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-[var(--crm-card)] dark:bg-[var(--crm-card)] rounded-2xl shadow-2xl max-w-2xl 3xl:max-w-4xl 4k:max-w-5xl 5k:max-w-7xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border-b border-slate-100 dark:border-[var(--crm-card-border)] p-4 flex justify-between items-center z-10">
              <h3 className="font-medium text-lg text-[var(--crm-text)]">Proposal Options: {generatedProposalObj.proposalNumber}</h3>
              <button onClick={() => setShowGenerateModal(false)} className="p-2 hover:bg-[var(--crm-sidebar-active-bg)] rounded-full transition-colors"><X size={20} className="text-[var(--crm-text-secondary)] " /></button>
            </div>
            <div className="p-6">
              
              {modalMode === 'options' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <button onClick={() => setModalMode('preview_proposal')} className="p-4 border border-slate-300 dark:border-[var(--crm-card-border)] rounded-xl hover:border-slate-800 hover:bg-[var(--crm-sidebar)] flex items-start gap-3 transition-colors text-left group cursor-pointer">
                      <div className="bg-[var(--crm-sidebar)] text-slate-700 dark:text-[var(--crm-text)] p-2 rounded-lg group-hover:bg-slate-800 group-hover:text-white transition-colors"><Eye size={20} /></div>
                      <div>
                        <div className="font-medium text-sm text-[var(--crm-text)]">Preview Proposal</div>
                        <div className="text-xs text-[var(--crm-text-secondary)] mt-0.5">Live on-screen view of formatted document and payment terms.</div>
                      </div>
                    </button>
                    <button onClick={async () => { if(generatedProposalObj){ onSaveProposal?.(generatedProposalObj); await saveToFirestore('proposals', generatedProposalObj.id, generatedProposalObj); showToast?.('Saved to CRM successfully', 'success'); } }} className="p-4 border border-slate-300 dark:border-[var(--crm-card-border)] rounded-xl hover:border-slate-800 hover:bg-[var(--crm-sidebar)] flex items-start gap-3 transition-colors text-left group cursor-pointer">
                      <div className="bg-[var(--crm-sidebar)] text-slate-700 dark:text-[var(--crm-text)] p-2 rounded-lg group-hover:bg-slate-800 group-hover:text-white transition-colors"><Send size={20} /></div>
                      <div>
                        <div className="font-medium text-sm text-[var(--crm-text)]">Save to CRM</div>
                        <div className="text-xs text-[var(--crm-text-secondary)] mt-0.5">Save this quotation to the database to track status and history.</div>
                      </div>
                    </button>
                    <button onClick={() => handleDownloadPdfRef({current: null}, 'proposal')} className="p-4 border border-slate-300 dark:border-[var(--crm-card-border)] rounded-xl hover:border-slate-800 hover:bg-[var(--crm-sidebar)] flex items-start gap-3 transition-colors text-left group cursor-pointer">
                      <div className="bg-[var(--crm-sidebar)] text-slate-700 dark:text-[var(--crm-text)] p-2 rounded-lg group-hover:bg-slate-800 group-hover:text-white transition-colors"><Download size={20} /></div>
                      <div>
                        <div className="font-medium text-sm text-[var(--crm-text)]">Export PDF Proposal</div>
                        <div className="text-xs text-[var(--crm-text-secondary)] mt-0.5">Download a high-resolution proposal PDF with formatted currency.</div>
                      </div>
                    </button>
                    <button onClick={() => handleDownloadPdfRef({current: null}, 'invoice')} className="p-4 border border-slate-300 dark:border-[var(--crm-card-border)] rounded-xl hover:border-slate-800 hover:bg-[var(--crm-sidebar)] flex items-start gap-3 transition-colors text-left group cursor-pointer">
                      <div className="bg-[var(--crm-sidebar)] text-slate-700 dark:text-[var(--crm-text)] p-2 rounded-lg group-hover:bg-slate-800 group-hover:text-white transition-colors"><CreditCard size={20} /></div>
                      <div>
                        <div className="font-medium text-sm text-[var(--crm-text)]">Export PDF Invoice</div>
                        <div className="text-xs text-[var(--crm-text-secondary)] mt-0.5">Generate a formal invoice with company bank details.</div>
                      </div>
                    </button>
                    <button onClick={() => handleDownloadImageRef({current: null}, 'proposal')} className="p-4 border border-slate-300 dark:border-[var(--crm-card-border)] rounded-xl hover:border-slate-800 hover:bg-[var(--crm-sidebar)] flex items-start gap-3 transition-colors text-left group cursor-pointer">
                      <div className="bg-[var(--crm-sidebar)] text-slate-700 dark:text-[var(--crm-text)] p-2 rounded-lg group-hover:bg-slate-800 group-hover:text-white transition-colors"><ImageIcon size={20} /></div>
                      <div>
                        <div className="font-medium text-sm text-[var(--crm-text)]">Export as Image</div>
                        <div className="text-xs text-[var(--crm-text-secondary)] mt-0.5">Download a clear PNG/JPG graphic for instant sharing.</div>
                      </div>
                    </button>
                    <button onClick={() => handleInitiateSendToPortal()} className="p-4 border border-slate-300 dark:border-[var(--crm-card-border)] bg-[var(--crm-sidebar)]/5 bg-[var(--crm-sidebar)]/50 rounded-xl hover:border-slate-800 hover:bg-[var(--crm-sidebar)] flex items-start gap-3 transition-colors text-left group cursor-pointer">
                      <div className="bg-[var(--crm-sidebar)] text-[var(--crm-text)] p-2 rounded-lg group-hover:bg-slate-900 group-hover:text-white transition-colors"><Globe size={20} /></div>
                      <div>
                        <div className="font-medium text-sm text-[var(--crm-text)]">Send to Client Portal</div>
                        <div className="text-xs text-[var(--crm-text-secondary)] mt-0.5">Upload document directly to the client's dashboard.</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
              {modalMode === 'preview_proposal' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-[var(--crm-card-border)] pb-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setModalMode('options')} className="p-1.5 hover:bg-[var(--crm-sidebar-active-bg)] rounded-lg text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)] transition-colors cursor-pointer">
                        <ChevronRight className="rotate-180" size={18}/>
                      </button>
                      <h4 className="font-medium text-sm sm:text-base text-[var(--crm-text)]">Proposal Document Preview</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleDownloadPdfRef({current: null}, 'proposal')} className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all cursor-pointer">
                        <Download size={13} />
                        <span>PDF</span>
                      </button>
                      <button onClick={() => handleDownloadImageRef({current: null}, 'proposal')} className="px-3 py-1.5 bg-[var(--crm-sidebar)] hover:bg-slate-200 text-slate-700 dark:text-[var(--crm-text)] rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer">
                        <ImageIcon size={13} />
                        <span>Image</span>
                      </button>
                    </div>
                  </div>

                  {/* Document Box */}
                  <div className="border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-xl p-5 bg-[var(--crm-card)] dark:bg-[var(--crm-card)] space-y-4 text-xs font-sans">
                    {/* Header */}
                    <div className="flex justify-between items-start border-b border-slate-100 dark:border-[var(--crm-card-border)] pb-4">
                      <div>
                        <div className="font-bold text-lg text-[var(--crm-text)]">Zyqitek</div>
                        <div className="text-[11px] text-[var(--crm-text-secondary)] ">{currentPaymentDetails?.companyAddress || 'Tech City, Innovation Hub'}</div>
                        <div className="text-[11px] text-[var(--crm-text-secondary)] ">{currentPaymentDetails?.companyEmail || 'support@zyqitek.com'} • {currentPaymentDetails?.companyPhone || '+1 (555) 019-2834'}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-semibold text-[var(--crm-text-muted)] ">Proposal</div>
                        <div className="font-mono font-medium text-sm text-[var(--crm-text)]">{generatedProposalObj.proposalNumber}</div>
                        <div className="text-[11px] text-[var(--crm-text-secondary)] ">Date: {generatedProposalObj.createdAt ? new Date(generatedProposalObj.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}</div>
                      </div>
                    </div>

                    {/* Client & Scope Info */}
                    <div className="grid grid-cols-2 gap-4 bg-[var(--crm-sidebar)] p-3 rounded-lg border border-slate-100 dark:border-[var(--crm-card-border)]">
                      <div>
                        <div className="text-[10px] font-semibold text-[var(--crm-text-muted)] mb-1">Prepared For</div>
                        <div className="font-medium text-[var(--crm-text)]">{generatedProposalObj.clientName}</div>
                        {generatedProposalObj.clientCompany && <div className="text-[var(--crm-text-secondary)]">{generatedProposalObj.clientCompany}</div>}
                        {generatedProposalObj.clientEmail && <div className="text-[var(--crm-text-secondary)] ">{generatedProposalObj.clientEmail}</div>}
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold text-[var(--crm-text-muted)] mb-1">Service Details</div>
                        <div className="font-medium text-[var(--crm-text)]">{generatedProposalObj.serviceCategory}</div>
                        <div className="text-[var(--crm-text-secondary)]">{generatedProposalObj.projectType}</div>
                      </div>
                    </div>

                    {/* Line Items Table */}
                    <div className="border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-lg overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[var(--crm-sidebar)] text-[var(--crm-text)]  border-b border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)]">
                          <tr>
                            <th className="p-2.5">Item & Description</th>
                            <th className="p-2.5 text-center w-16">Qty</th>
                            <th className="p-2.5 text-right w-24">Unit Price</th>
                            <th className="p-2.5 text-right w-24">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-[#30353D]">
                          {(generatedProposalObj.items || []).map((item, idx) => (
                            <tr key={idx} className="hover:bg-[var(--crm-sidebar)]/5 hover:bg-[var(--crm-sidebar-active-bg)]/50 bg-[var(--crm-sidebar)]/50">
                              <td className="p-2.5">
                                <div className="font-medium text-[var(--crm-text)]">{item.name}</div>
                                {item.description && <div className="text-[11px] text-[var(--crm-text-secondary)] ">{item.description}</div>}
                              </td>
                              <td className="p-2.5 text-center font-mono">{item.quantity || 1}</td>
                              <td className="p-2.5 text-right font-mono">{formatCurrency(item.unitPrice, '$')}</td>
                              <td className="p-2.5 text-right font-mono font-medium">{formatCurrency((item.quantity || 1) * item.unitPrice, '$')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Financial Summary */}
                    <div className="flex justify-end pt-2">
                      <div className="w-64 space-y-1.5 text-xs">
                        <div className="flex justify-between text-[var(--crm-text-secondary)]">
                          <span>Subtotal:</span>
                          <span className="font-mono font-medium text-[var(--crm-text)]">{formatCurrency(generatedProposalObj.subtotal || 0, '$')}</span>
                        </div>
                        {Number(generatedProposalObj.discountAmount) > 0 && (
                          <div className="flex justify-between text-[var(--crm-text-secondary)]">
                            <span>Discount:</span>
                            <span className="font-mono font-medium text-rose-600">-{formatCurrency(generatedProposalObj.discountAmount, '$')}</span>
                          </div>
                        )}
                        {Number(generatedProposalObj.taxAmount) > 0 && (
                          <div className="flex justify-between text-[var(--crm-text-secondary)]">
                            <span>Tax:</span>
                            <span className="font-mono font-medium text-[var(--crm-text)]">+{formatCurrency(generatedProposalObj.taxAmount, '$')}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm font-medium text-[var(--crm-text)] pt-2 border-t border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)]">
                          <span>TOTAL AMOUNT:</span>
                          <span className="font-mono text-base">{formatCurrency(generatedProposalObj.grandTotal || generatedProposalObj.oneTimeTotal || 0, '$')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Terms & Schedule */}
                    <div className="bg-[var(--crm-sidebar)] p-3 rounded-lg border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] space-y-2">
                      <div className="text-[10px] font-medium text-[var(--crm-text-secondary)] flex items-center gap-1.5">
                        <CreditCard size={12} className="text-[var(--crm-text)]" />
                        <span>Payment Terms & Structure</span>
                      </div>
                      <p className="text-[11px] text-[var(--crm-text)] ">
                        {generatedProposalObj.paymentTermsText || '50% advance deposit to begin work, 50% upon final delivery.'}
                      </p>
                      {generatedProposalObj.paymentSchedule && generatedProposalObj.paymentSchedule.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                          {generatedProposalObj.paymentSchedule.map((stg, i) => (
                            <div key={i} className="flex justify-between items-center bg-[var(--crm-card)] dark:bg-[var(--crm-card)] p-2 rounded border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] text-[11px]">
                              <span className="font-medium text-slate-700 dark:text-[var(--crm-text)]">{stg.name} ({stg.percentage}%)</span>
                              <span className="font-mono font-semibold text-[var(--crm-text)]">{formatCurrency(stg.amount, '$')}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Terms & Support */}
                    <div className="text-[10px] text-[var(--crm-text-secondary)] border-t border-slate-100 dark:border-[var(--crm-card-border)] pt-3 space-y-1">
                      <div className="font-medium text-[var(--crm-text)]">Terms & Conditions:</div>
                      <p>Quotation is valid for 30 days. Work begins following receipt of agreed deposit.</p>
                      <p>Customer Support: {currentPaymentDetails?.companyEmail || 'support@zyqitek.com'} • {currentPaymentDetails?.companyPhone || '+1 (555) 019-2834'}</p>
                    </div>
                  </div>
                </div>
              )}
              {modalMode === 'send_to_portal_select' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => setModalMode('options')} className="text-[var(--crm-text-secondary)] hover:text-slate-700 dark:text-[var(--crm-text)]"><ChevronRight className="rotate-180" size={20}/></button>
                    <h4 className="font-medium text-[var(--crm-text)]">Select Format to Send</h4>
                  </div>
                  {isUploadingToPortal ? (
                    <div className="py-12 flex flex-col items-center">
                      <div className="w-12 h-12 border-4 border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] border-t-slate-800 rounded-full animate-spin mb-4"></div>
                      <div className="font-medium text-slate-700 dark:text-[var(--crm-text)]">Uploading to Secure Portal...</div>
                      <div className="w-64 h-2 bg-[var(--crm-sidebar)] rounded-full mt-4 overflow-hidden">
                        <div className="h-full bg-[var(--crm-sidebar)] transition-all duration-300" style={{ width: `${uploadProgress}%`}}></div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button onClick={() => handleSendToPortalFormat('pdf')} className="p-4 border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-xl hover:border-slate-800 text-center flex flex-col items-center gap-2">
                        <div className="bg-[var(--crm-sidebar)] p-3 rounded-full text-[var(--crm-text-secondary)]"><FileText size={24}/></div>
                        <div className="font-medium text-sm">Proposal PDF</div>
                      </button>
                      <button onClick={() => handleSendToPortalFormat('image')} className="p-4 border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-xl hover:border-slate-800 text-center flex flex-col items-center gap-2">
                        <div className="bg-[var(--crm-sidebar)] p-3 rounded-full text-[var(--crm-text-secondary)]"><ImageIcon size={24}/></div>
                        <div className="font-medium text-sm">Proposal Image</div>
                      </button>
                      <button onClick={() => handleSendToPortalFormat('invoice')} className="p-4 border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-xl hover:border-slate-800 text-center flex flex-col items-center gap-2">
                        <div className="bg-[var(--crm-sidebar)] p-3 rounded-full text-[var(--crm-text-secondary)]"><FileCheck size={24}/></div>
                        <div className="font-medium text-sm">Invoice PDF</div>
                      </button>
                    </div>
                  )}
                </div>
              )}
              {modalMode === 'no_portal_prompt' && (
                <div className="py-8 text-center space-y-4">
                  <div className="mx-auto w-16 h-16 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mb-4">
                    <Globe size={32} />
                  </div>
                  <h4 className="font-medium text-xl text-[var(--crm-text)]">No Client Portal Exists</h4>
                  <p className="text-sm text-[var(--crm-subtitle)] max-w-sm mx-auto">
                    The client <strong>{generatedProposalObj.clientName}</strong> does not have an active secure portal. You must create one first.
                  </p>
                  <div className="pt-6 flex justify-center gap-3">
                    <button onClick={() => setModalMode('options')} className="px-6 py-2 border border-slate-300 dark:border-[var(--crm-card-border)] rounded-xl font-medium text-[var(--crm-text)] hover:bg-[var(--crm-sidebar)] transition-all">Cancel</button>
                    <button onClick={() => setModalMode('create_portal')} className="px-6 py-2 bg-slate-900 text-white rounded-xl shadow-md hover:shadow-lg transition-all font-medium hover:bg-slate-800">Create Portal</button>
                  </div>
                </div>
              )}
              {modalMode === 'create_portal' && (
                <form onSubmit={handleCreatePortalInline} className="space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <button type="button" onClick={() => setModalMode('no_portal_prompt')} className="text-[var(--crm-text-secondary)] hover:text-slate-700 dark:text-[var(--crm-text)]"><ChevronRight className="rotate-180" size={20}/></button>
                    <h4 className="font-medium text-[var(--crm-text)]">Create Secure Portal</h4>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-[var(--crm-text)] mb-1">Portal Name</label>
                    <input required type="text" value={newPortalForm.portalName} onChange={e => setNewPortalForm({...newPortalForm, portalName: e.target.value})} className="w-full text-sm rounded-xl border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] bg-[var(--crm-card)] dark:bg-[var(--crm-card)] shadow-xs focus:bg-[var(--crm-card)] focus:dark:bg-[var(--crm-card)] focus:border-slate-800 focus:ring-4 focus:ring-slate-800/10 transition-all h-11 px-3" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[var(--crm-text)] mb-1">Access Username</label>
                      <input required type="text" value={newPortalForm.username} onChange={e => setNewPortalForm({...newPortalForm, username: e.target.value})} className="w-full text-sm rounded-xl border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] bg-[var(--crm-card)] dark:bg-[var(--crm-card)] shadow-xs focus:bg-[var(--crm-card)] focus:dark:bg-[var(--crm-card)] focus:border-slate-800 focus:ring-4 focus:ring-slate-800/10 transition-all h-11 px-3" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--crm-text)] mb-1">Initial Password</label>
                      <input required type="text" value={newPortalForm.password} onChange={e => setNewPortalForm({...newPortalForm, password: e.target.value})} className="w-full text-sm rounded-xl border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] bg-[var(--crm-card)] dark:bg-[var(--crm-card)] shadow-xs focus:bg-[var(--crm-card)] focus:dark:bg-[var(--crm-card)] focus:border-slate-800 focus:ring-4 focus:ring-slate-800/10 transition-all h-11 px-3" />
                    </div>
                  </div>
                  
                  <div className="pt-4 flex justify-end">
                    <button disabled={isCreatingPortal} type="submit" className="px-6 py-2 bg-slate-900 text-white rounded-xl shadow-md hover:shadow-lg transition-all font-medium hover:bg-slate-800 disabled:opacity-50">
                      {isCreatingPortal ? 'Creating...' : 'Create & Continue'}
                    </button>
                  </div>
                </form>
              )}
              {modalMode === 'payment_details' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <button onClick={() => setModalMode('options')} className="text-[var(--crm-text-secondary)] hover:text-slate-700 dark:text-[var(--crm-text)]"><ChevronRight className="rotate-180" size={20}/></button>
                    <h4 className="font-medium text-[var(--crm-text)]">Payment Information</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[var(--crm-text)] mb-1">Bank Name</label>
                      <input type="text" value={payBankName} onChange={e => setPayBankName(e.target.value)} className="w-full text-sm rounded-xl border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] bg-[var(--crm-card)] dark:bg-[var(--crm-card)] shadow-xs focus:bg-[var(--crm-card)] focus:dark:bg-[var(--crm-card)] focus:border-slate-800 focus:ring-4 focus:ring-slate-800/10 transition-all h-11 px-3" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--crm-text)] mb-1">Account Title</label>
                      <input type="text" value={payAccountTitle} onChange={e => setPayAccountTitle(e.target.value)} className="w-full text-sm rounded-xl border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] bg-[var(--crm-card)] dark:bg-[var(--crm-card)] shadow-xs focus:bg-[var(--crm-card)] focus:dark:bg-[var(--crm-card)] focus:border-slate-800 focus:ring-4 focus:ring-slate-800/10 transition-all h-11 px-3" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--crm-text)] mb-1">Account Number</label>
                      <input type="text" value={payAccountNumber} onChange={e => setPayAccountNumber(e.target.value)} className="w-full text-sm rounded-xl border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] bg-[var(--crm-card)] dark:bg-[var(--crm-card)] shadow-xs focus:bg-[var(--crm-card)] focus:dark:bg-[var(--crm-card)] focus:border-slate-800 focus:ring-4 focus:ring-slate-800/10 transition-all h-11 px-3" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--crm-text)] mb-1">IBAN (Optional)</label>
                      <input type="text" value={payIban} onChange={e => setPayIban(e.target.value)} className="w-full text-sm rounded-xl border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] bg-[var(--crm-card)] dark:bg-[var(--crm-card)] shadow-xs focus:bg-[var(--crm-card)] focus:dark:bg-[var(--crm-card)] focus:border-slate-800 focus:ring-4 focus:ring-slate-800/10 transition-all h-11 px-3" />
                    </div>
                  </div>
                  <div className="pt-4 flex justify-end gap-3">
                    <button onClick={() => handleGenerateInvoiceWithPayment(new Event('submit') as any)} className="px-6 py-2 bg-slate-900 text-white rounded-xl shadow-md hover:shadow-lg transition-all font-medium hover:bg-slate-800">
                      Save & Continue to Export
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* ADD CUSTOM OPTION MODAL */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-50 bg-[var(--crm-bg)]/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-[var(--crm-card)] dark:bg-[var(--crm-card)] rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-[var(--crm-card-border)] pb-3">
              <h4 className="font-semibold text-base text-[var(--crm-text)] flex items-center gap-2">
                <Plus size={18} className="text-slate-700 dark:text-[var(--crm-text)]" />
                Add Custom Optional Add-on
              </h4>
              <button
                type="button"
                onClick={() => setShowAddCustomModal(false)}
                className="p-1.5 hover:bg-[var(--crm-sidebar-active-bg)] rounded-full transition-colors text-[var(--crm-text-muted)] hover:text-[var(--crm-text-secondary)]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddCustomOption} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--crm-text)] mb-1">Option Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g., Express 24-Hour Delivery SLA"
                  value={newCustomOptionName}
                  onChange={(e) => setNewCustomOptionName(e.target.value)}
                  className="w-full text-sm rounded-xl border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] bg-[var(--crm-sidebar)] focus:bg-[var(--crm-card)] focus:dark:bg-[var(--crm-card)] focus:border-slate-800 focus:ring-4 focus:ring-slate-800/10 transition-all h-11 px-3"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--crm-text)] mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., Fast-track delivery within agreed timeline"
                  value={newCustomOptionDesc}
                  onChange={(e) => setNewCustomOptionDesc(e.target.value)}
                  className="w-full text-sm rounded-xl border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] bg-[var(--crm-sidebar)] focus:bg-[var(--crm-card)] focus:dark:bg-[var(--crm-card)] focus:border-slate-800 focus:ring-4 focus:ring-slate-800/10 transition-all h-11 px-3"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--crm-text)] mb-1">Price ($) *</label>
                <input
                  required
                  type="number"
                  min="0"
                  placeholder="e.g., 150"
                  value={newCustomOptionPrice}
                  onChange={(e) => setNewCustomOptionPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full text-sm rounded-xl border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] bg-[var(--crm-sidebar)] focus:bg-[var(--crm-card)] focus:dark:bg-[var(--crm-card)] focus:border-slate-800 focus:ring-4 focus:ring-slate-800/10 transition-all h-11 px-3 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[var(--crm-card-border)]">
                <button
                  type="button"
                  onClick={() => setShowAddCustomModal(false)}
                  className="px-4 py-2 text-xs font-medium text-[var(--crm-text-secondary)] bg-[var(--crm-sidebar)] hover:bg-slate-200 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                  Add & Select Option
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default ProposalCalculator;
