export interface LeadActivityStatus {
  contacted?: boolean;
  callStatus?: 'Pending' | 'Completed';
  whatsappStatus?: 'Pending' | 'Sent';
  emailStatus?: 'Pending' | 'Sent';
  followUpStatus?: 'Pending' | 'Scheduled' | 'Completed';
  meetingStatus?: 'Pending' | 'Scheduled' | 'Completed';
  proposalStatus?: 'Pending' | 'Sent';
  firstContactAt?: string;
  lastContactAt?: string;
  totalCalls?: number;
  totalWhatsapp?: number;
  totalEmails?: number;
  followUpDate?: string;
  lastActivityAt?: string;
  communicationNotes?: string;
}

export interface Lead {
  id: string;
  masterClientId?: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: 'New' | 'Contacted' | 'Follow Up' | 'Qualified' | 'Converted' | 'Lost' | 'Proposal' | 'Closed';
  value: number;
  source: string;
  category?: string;
  notes: string;
  country?: string;
  createdAt: string;
  updatedAt: string;
  assignedTeamMember?: string;
  role?: string;
  priority?: 'High' | 'Medium' | 'Low';
  leadScore?: number;
  industry?: string;
  city?: string;
  // New social/contact fields
  instagramLink?: string;
  facebookLink?: string;
  linkedinLink?: string;
  websiteUrl?: string;
  otherLink?: string;
  // Social Media Management fields (available only when service is SMM)
  smmPlatformName?: string;
  smmPlannedPosts?: number;
  smmPostingFrequency?: string;
  smmContentNotes?: string;
  smmCampaignRequirements?: string;
  // Lead Activity
  leadActivity?: LeadActivityStatus;
  // Dynamic custom fields imported from CSV or custom defined
  customFields?: Record<string, any>;
  [key: string]: any;
}

export interface DynamicCustomColumn {
  id: string;
  label: string;
  type?: 'string' | 'number' | 'date' | 'boolean';
}

export interface CallLog {
  id: string;
  leadId: string;
  leadName: string;
  duration: number; // in seconds
  status: 'No Answer' | 'Connected' | 'Busy' | 'Voicemail';
  notes: string;
  timestamp: string;
}

export interface Client {
  id: string;
  masterClientId?: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  activeProjects: number;
  totalValue: number;
  status: 'Active' | 'Inactive' | 'No Active Project' | 'Project Completed' | string;
  projectProgress: number; // 0 to 100
  serviceType?: string;
  notes: string;
  country?: string;
  assignedTeamMember?: string;
  role?: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
  // New social/contact fields
  instagramLink?: string;
  facebookLink?: string;
  linkedinLink?: string;
  websiteUrl?: string;
  otherLink?: string;
  customLinks?: string; // Serialized custom links JSON
  trustScore?: number; // 0 to 100
  // Social Media Management fields (available only when service is SMM)
  smmPlatformName?: string;
  smmPlannedPosts?: number;
  smmPostingFrequency?: string;
  smmContentNotes?: string;
  smmCampaignRequirements?: string;
}

export interface EmailDiscussion {
  id: string;
  clientName: string;
  subject: string;
  date: string;
  direction: 'Sent' | 'Received';
  content: string;
  notes: string;
  followUpStatus: 'Needs Follow-up' | 'Pending Client' | 'Closed' | 'None';
  attachments: string; // Comma-separated file names
  clientService?: string;
  clientId?: string;
  leadId?: string;
  projectId?: string;
  assignedTeamMember?: string;
  followUpRequired?: boolean;
  followUpDate?: string;
}

export interface CallDiscussion {
  id: string;
  clientName: string;
  callDate: string;
  duration: string; // e.g., "15m 30s"
  summary: string;
  requirements: string;
  followUpActions: string;
  notes: string;
  status: 'Connected' | 'No Answer' | 'Busy' | 'Voicemail';
  clientService?: string;
  clientId?: string;
  leadId?: string;
  projectId?: string;
  assignedTeamMember?: string;
  followUpRequired?: boolean;
  followUpDate?: string;
}

export interface ChatAttachment {
  name: string;
  size: string;
  fileType: string;
  fileUrl: string;
  storagePath?: string;
}

export interface ConversationDiscussion {
  id: string;
  leadName: string;
  clientName?: string;
  company?: string;
  email?: string;
  phone?: string;
  date: string;
  time: string;
  platform?: string; // e.g., 'whatsapp' | 'messenger' | 'instagram' | 'telegram' | 'sms' | 'website_chat' | 'other'
  discussionTitle: string;
  conversationSummary: string;
  clientResponse: string;
  nextAction: string;
  followUpRequired?: boolean;
  followUpDate?: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'New' | 'Open' | 'Pending' | 'Closed' | 'In Progress' | 'Pending Response' | string;
  notes: string;
  leadId?: string;
  clientId?: string;
  service?: string;
  assignedTeamMember?: string;
  attachments?: ChatAttachment[];
}

export interface CallScript {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  status: 'Active' | 'Archived';
}

export interface EmailScript {
  id: string;
  templateName: string;
  subject: string;
  body: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  status: 'Active' | 'Archived';
}

export interface GoogleFormConfig {
  webhookUrl: string;
  isConnected: boolean;
  totalSubmissions: number;
  lastSyncTime?: string;
  mappedFields: {
    nameField: string;
    emailField: string;
    phoneField: string;
    companyField: string;
    notesField: string;
  };
}

export type ProjectStatus = 'Not Started' | 'In Progress' | 'Review' | 'Revision' | 'Completed' | 'Delivered';

export interface Review {
  id: string;
  title: string; // Used as summary or can just be project name
  date: string;
  rating: number;
  comments: string;
  service?: string;
  projectStatus?: string;
  internalNotes?: string;
  clientId?: string;
  projectId?: string;
}

export type QuestionDifficulty = 'Beginner' | 'Advanced' | 'Expert' | 'Basic' | 'Intermediate' | 'Pro' | 'Professional';
export type QuestionType = 'Multiple Choice' | 'Multiple Select' | 'True / False' | 'Short Answer' | 'Scenario' | 'Practical' | 'Technical' | 'Problem Solving' | 'Long Answer';
export type CandidateExperience = 'Beginner' | 'Intermediate' | 'Experienced' | 'Professional' | 'Expert';
export type TestStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Under Review' | 'Passed' | 'Failed';
export type HiringDecision = 'Hire' | 'Reject' | 'Needs Further Interview' | 'Keep in Review';

export interface PreHiringQuestion {
  id: string;
  service: string;
  skillCategory?: string; // For custom "Other" service category
  difficulty: QuestionDifficulty;
  type: QuestionType;
  question: string; // English question text
  questionRomanUrdu?: string; // Natural Roman Urdu translation
  options?: string[]; // Array of possible answers for multiple choice in English
  optionsRomanUrdu?: string[]; // Possible answers in Roman Urdu
  correctAnswer?: string; // Correct answer option text or index
  expectedAnswer?: string; // Expected answer / rubric / key concepts for reviewer
  evaluationNotes?: string; // Guidelines for scoring
  instructions?: string; // Instructions for practical/technical tasks
  points: number; // Default: Beginner = 1, Advanced = 2, Expert = 3
  explanation?: string; // English explanation
  explanationRomanUrdu?: string; // Roman Urdu explanation
  language?: 'English' | 'Roman Urdu' | 'Both';
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CandidateAssessment {
  id: string;
  candidateName: string;
  age?: string;
  email: string;
  phone: string;
  whatsapp: string;
  cityCountry?: string;
  appliedService: string;
  customServiceName?: string;
  skillCategory?: string;
  requiredExperience?: string;
  experienceLevel: CandidateExperience;
  difficultyLevel?: 'Beginner' | 'Advanced' | 'Expert' | 'All Levels';
  languagePreference?: 'English' | 'Roman Urdu' | 'Bilingual';
  timeLimitMinutes?: number; // e.g. 30 mins
  timeRemainingSeconds?: number;
  passingScorePercentage?: number; // e.g. 70%
  testLengthChoice?: '10 Questions' | '15 Questions' | '20 Questions' | 'Full Assessment';
  selectedLevels?: string[]; // e.g. ['Beginner', 'Advanced', 'Expert']
  yearsOfExperience: string;

  // Screening Experience
  hasWorkedProfessionally?: 'Yes' | 'No';
  workedWithInternationalClients?: 'Yes' | 'No';
  workedRemotely?: 'Yes' | 'No';
  currentlyEmployed?: 'Yes' | 'No';
  regularTools?: string;
  strongestSkill?: string;
  comfortWithRevisions?: string;
  experienceDetails?: string;

  // Agency Experience
  hasAgencyExperience?: 'Yes' | 'No';
  agencyName?: string;
  agencyDuration?: string;
  agencyRole?: string;

  // Service-Specific Screening Responses
  screeningAnswers?: Record<string, string>;

  // Links & Media
  portfolioLink: string;
  googleDriveLink?: string;
  behanceLink?: string;
  githubWebsiteLink?: string;
  cvResumeLink: string;
  additionalLinks: string;

  // Availability & Compensation
  availability?: 'Full-time' | 'Part-time' | 'Freelance' | 'Contract' | string;
  startTimeline?: string;
  expectedRate?: string;
  paymentPreference?: 'Monthly' | 'Per Project' | 'Hourly' | 'Other' | string;
  additionalInfo?: string;

  notes: string;
  
  testStatus: TestStatus;
  reviewerStatus?: 'Pending Admin Review' | 'Reviewed' | 'Approved' | 'Rejected';
  startedAt?: string;
  completedAt?: string;
  
  // Stored questions to ensure they don't change if the bank changes
  assignedQuestions: PreHiringQuestion[];
  answers: Record<string, string>; // question id -> candidate answer
  scores: Record<string, number>; // question id -> points awarded
  feedback?: Record<string, string>; // question id -> reviewer feedback
  
  totalScore: number;
  maxScore: number;
  percentage: number;
  
  levelBreakdown?: {
    basic?: { earned: number; max: number };
    intermediate?: { earned: number; max: number };
    advanced?: { earned: number; max: number };
    pro?: { earned: number; max: number };
  };
  skillBreakdown?: Record<string, number>;
  
  practicalTaskEnabled: boolean;
  practicalSubmissionLink?: string;
  practicalSubmissionNotes?: string;
  
  adminNotes?: string;
  hiringDecision?: HiringDecision;
  convertedToTeamMember?: boolean;
  convertedAt?: string;
  convertedTeamMemberId?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  teamMemberId?: string;
  fullName: string;
  role: string;
  whatsapp: string;
  email: string;
  phone?: string;
  cnicNumber?: string; // Admin-only access
  country?: string;
  city?: string;

  // Professional Information
  service?: string; // Department / Service Category
  primarySkill?: string;
  secondarySkills?: string;
  experienceYears?: string | number;
  experienceLevel?: 'Junior' | 'Mid-Level' | 'Senior' | 'Expert';
  experience?: string;
  bio?: string;
  softwareKnowledge?: string;

  // Links & Portfolio
  portfolioLink: string;
  linkedinLink?: string;
  githubLink?: string;
  behanceLink?: string;
  dribbbleLink?: string;
  websiteLink?: string;
  facebookLink?: string;
  instagramLink?: string;
  customLinks?: string; // Serialized custom links JSON

  // Remote Work Information
  employmentType?: 'Full-Time' | 'Part-Time' | 'Freelance' | 'Contract' | 'Intern';
  workMode?: 'Remote' | 'Hybrid' | 'On-Site';
  availability?: 'Available' | 'Partially Available' | 'Unavailable';
  timezone?: string;
  workingHours?: string;

  // Hiring Information
  joiningDate?: string;
  hiringType?: string;
  experienceAtJoining?: string;
  recruiterSource?: string;
  resumeLink?: string;
  interviewNotes?: string;

  // Payment Configuration
  paymentType?: 'Monthly' | 'Project Based' | 'Hourly' | 'Monthly Salary';
  salaryRate?: number | string;
  currency?: string;
  paymentPlatform?: string;
  accountHolderName?: string;
  accountIdentifier?: string;
  paymentNotes?: string;
  monthlySalary?: number;

  // Portal Access
  portalStatus?: 'Active' | 'Disabled' | 'Pending';
  portalId?: string;
  portalCreatedDate?: string;
  username?: string;
  password?: string;

  // Documents
  cvDocumentUrl?: string;
  portfolioDocumentUrl?: string;
  contractDocumentUrl?: string;
  otherDocumentUrl?: string;

  // Internal & Notes
  internalNotes?: string;
  notes?: string;
  receiptUrl?: string;
  receivedBy?: string;

  // System & Status
  avatar?: string;
  createdAt: string;
  updatedAt?: string;
  status?: 'Active' | 'Inactive' | 'Archived';
  workloadStatus?: 'Available' | 'At Capacity' | 'Overloaded';
  capacityNotes?: string;
  reviews?: string; // Serialized Review[] JSON

  // Team Member Rating System
  currentRating?: number;
  ratingCategories?: {
    workQuality?: number;
    communication?: number;
    reliability?: number;
    technicalSkills?: number;
    deadlineManagement?: number;
    clientHandling?: number;
    teamwork?: number;
  };
  ratingNotes?: string;
  ratingUpdatedAt?: string;
  ratingHistory?: Array<{
    id: string;
    date: string;
    overallRating: number;
    categoryRatings: {
      workQuality?: number;
      communication?: number;
      reliability?: number;
      technicalSkills?: number;
      deadlineManagement?: number;
      clientHandling?: number;
      teamwork?: number;
    };
    reviewer?: string;
    notes?: string;
  }>;

  // Project Assignment (Legacy/Reference only - removed from Add/Edit form)
  assignedProjectName?: string;
  clientName?: string;
  projectStatus?: ProjectStatus;
  projectDeadline?: string;
  projectProgress?: number;
}

export interface Goal {
  id: string;
  title: string;
  category: string;
  current: number;
  target: number;
  unit: string;
  deadline: string;
  description?: string;
  startDate?: string;
  priority?: 'Low' | 'Medium' | 'High';
  status?: string;
  notes?: string;
  currency?: string;
  receiptUrl?: string;
  receivedBy?: string;
}

export interface ProjectTask {
  id: string;
  title: string;
  status: 'Pending' | 'Completed' | 'In Progress';
  completed: boolean;
  priority?: 'Low' | 'Medium' | 'High';
  dueDate?: string;
  assignedTo?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  clientId: string;
  masterClientId?: string;
  clientName?: string;
  budget: number;
  assignedTeamMember?: string;
  assignedTeamMemberId?: string;
  deadline?: string;
  status: 'Active' | 'Not Started' | 'In Progress' | 'Review' | 'Revision' | 'Completed' | 'Delivered' | 'On Hold' | 'Cancelled';
  projectProgress: number; // 0 to 100
  progress?: number;
  tasks?: ProjectTask[];
  priority?: 'Low' | 'Medium' | 'High';
  notes?: string;
  currency?: string;
  receiptUrl?: string;
  receivedBy?: string;
  createdAt?: string;
  totalProjectValue?: number;
  advancePayment?: number;
  remainingBalance?: number;
  paymentStatus?: 'Pending' | 'Partial' | 'Paid';
  paymentPlatform?: 'SadaPay' | 'Payoneer' | 'Elevate Pay' | 'Wise' | 'Bank Transfer' | 'Other';
  paymentNotes?: string;

  // Project Tracking fields
  currentStage?: string;
  progressPercentage?: number;
  pendingRequirements?: string;
  completedTasks?: string;
  remainingTasks?: string;
  internalNotes?: string;
  filesReceived?: string;
  filesPending?: string;
  estimatedCost?: number;
  actualCost?: number;
  remainingBudget?: number;
  expectedDeliveryDate?: string;
  startDate?: string;
  expectedCompletionDate?: string;
  estimatedDuration?: string;
  actualDuration?: string;
  newRequirements?: string;
  service?: string;
  currentStatus?: string;
  progressUpdates?: any[];
  reviews?: Review[];

  // Team Payment fields
  teamSalary?: number;
  teamBonus?: number;
  teamDeductions?: number;
  teamPaymentStatus?: 'Paid' | 'Unpaid' | 'Pending';
  teamPaymentDate?: string;
  teamPaymentPlatform?: string;
  teamPaymentNotes?: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string; // TKT-1001
  clientId: string;
  clientName: string;
  projectId: string;
  projectName: string;
  issueTitle: string;
  description: string;
  source: 'WhatsApp' | 'Email' | 'Direct Call';
  priority: 'Low' | 'Medium' | 'High';
  assignedTo: string; // TeamMember ID
  assignedMemberName?: string;
  status: 'New Request' | 'In Progress' | 'Pending Client Approval' | 'Resolved';
  attachments: string[]; // URLs
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
}

export interface InformationRecordField {
  label: string;
  value: string;
  isSecret?: boolean;
}

export interface InformationRecord {
  id: string;
  title: string;
  folderId?: string | null;
  fields: InformationRecordField[];
  notes?: string;
  currency?: string;
  receiptUrl?: string;
  receivedBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Meeting {
  id: string;
  clientId?: string;
  leadId?: string;
  clientName: string;
  platform: 'Zoom' | 'Google Meet' | 'Microsoft Teams' | 'Other';
  url: string;
  date: string;
  time: string;
  status: 'Booked' | 'Completed' | 'Cancelled';
  title?: string;
  notes?: string;
  currency?: string;
  receiptUrl?: string;
  receivedBy?: string;
  duration?: string;
  assignedTeamMember?: string;
  followUpRequired?: boolean;
  followUpDate?: string;
}

export interface ClientPortalAccount {
  id: string; // Document ID / portalId
  portalId: string;
  secureToken?: string;
  clientId: string;
  masterClientId?: string;
  clientName: string;
  clientCompany?: string;
  avatar?: string;
  clientEmail: string;
  username: string;
  password?: string;
  status: 'Active' | 'Inactive' | 'Live' | 'Draft' | string;
  portalName?: string;
  enabledSections?: string[];
  customFolders?: string[];
  clientService?: string;
  clientUploadEnabled?: boolean;
  clientDownloadEnabled?: boolean;
  downloadEnabled?: boolean;
  hasDraftChanges?: boolean;
  draftPortalName?: string;
  draftStatus?: 'Active' | 'Inactive';
  draftClientUploadEnabled?: boolean;
  draftDownloadEnabled?: boolean;
  draftFolders?: Array<{
    id: string;
    name: string;
    description?: string;
    parentId: string | null;
    createdAt: string;
  }>;
  draftProjectFiles?: Array<{
    id: string;
    name: string;
    fileType: string;
    size: string;
    uploadedAt: string;
    fileUrl: string;
    category?: string;
    folderId?: string | null;
  }>;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  folders?: Array<{
    id: string;
    name: string;
    description?: string;
    parentId: string | null;
    createdAt: string;
  }> | string[] | any[];
  infoRecords?: InformationRecord[];

  // 17 Portal Data Sections
  profileInfo?: {
    company?: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    country?: string;
    websiteUrl?: string;
    serviceType?: string;
    status?: string;
  };
  projectDetails?: Array<{
    id: string;
    name: string;
    progress: number;
    stage: string;
    budget: number;
    deadline?: string;
    status: string;
    assignedLead?: string;
  }>;
  domainInfo?: {
    domainName?: string;
    registrar?: string;
    purchaseDate?: string;
    expiryDate?: string;
    dnsNotes?: string;
    status?: string;
    nameservers?: string[];
    sslStatus?: string;
    deploymentStatus?: string;
  };
  dnsRecords?: Array<{
    type: string;
    name: string;
    value: string;
    ttl: string;
  }>;
  hostingInfo?: {
    provider?: string;
    serverIp?: string;
    plan?: string;
    renewalDate?: string;
    sshDetails?: string;
    status?: string;
  };
  cpanelCreds?: {
    cpanelUrl?: string;
    username?: string;
    password?: string;
    serverIp?: string;
  };
  emailCreds?: {
    webmailUrl?: string;
    emailAddress?: string;
    password?: string;
    incomingServer?: string;
    outgoingServer?: string;
  };
  ftpCreds?: {
    host?: string;
    port?: string;
    username?: string;
    password?: string;
    protocol?: 'FTP' | 'SFTP' | 'FTPS';
  };
  apiKeys?: Array<{
    id: string;
    serviceName: string;
    apiKey: string;
    apiSecret?: string;
    status: 'Active' | 'Revoked' | 'Testing';
    notes?: string;
  currency?: string;
  receiptUrl?: string;
  receivedBy?: string;
  }>;
  websiteLoginDetails?: {
    adminUrl?: string;
    username?: string;
    password?: string;
    role?: string;
    cmsType?: string;
  };
  projectFiles?: Array<{
    id: string;
    name: string;
    fileType: string;
    size: string;
    uploadedAt: string;
    fileUrl: string;
    category?: string;
  }>;
  documents?: Array<{
    id: string;
    title: string;
    docType: string;
    fileUrl?: string;
    status: string;
    uploadedAt: string;
    notes?: string;
  currency?: string;
  receiptUrl?: string;
  receivedBy?: string;
  }>;
  contracts?: Array<{
    id: string;
    title: string;
    contractValue: number;
    startDate: string;
    endDate: string;
    fileUrl?: string;
    status: 'Signed' | 'Pending' | 'Expired';
  }>;
  invoices?: Array<{
    id: string;
    invoiceNumber: string;
    amount: number;
    dueDate: string;
    status: 'Paid' | 'Pending' | 'Overdue';
    pdfUrl?: string;
    notes?: string;
  currency?: string;
  receiptUrl?: string;
  receivedBy?: string;
  }>;
  progressUpdates?: Array<{
    id: string;
    title: string;
    stage: string;
    description: string;
    date: string;
    completionPercentage: number;
  }>;
  supportTickets?: Array<{
    id: string;
    ticketId: string;
    subject: string;
    priority: 'Low' | 'Medium' | 'High' | 'Urgent';
    status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
    createdAt: string;
    updatedAt: string;
    messages: Array<{
      id: string;
      sender: 'Client' | 'Admin' | 'Support';
      senderName: string;
      message: string;
      timestamp: string;
      attachmentUrl?: string;
    }>;
  }>;
  notes?: Array<{
    id: string;
    title: string;
    content: string;
    createdAt: string;
    author: string;
  }>;
  downloads?: Array<{
    id: string;
    title: string;
    fileType: string;
    size: string;
    downloadUrl: string;
    description?: string;
  }>;
}

export interface TeamPortalAccount {
  id: string;
  portalId?: string;
  avatar?: string;
  secureToken?: string;
  teamMemberId: string;
  fullName: string;
  username: string;
  password?: string;
  role: 'Admin' | 'Manager' | 'Developer' | 'Designer' | 'Sales' | 'Support';
  email: string;
  whatsapp?: string;
  status: 'Active' | 'Inactive' | 'Live' | 'Draft' | string;
  createdAt: string;
  updatedAt: string;
  permissions: {
    canAccessFiles: boolean;
    canUploadFiles: boolean;
    canCreateFolders: boolean;
  };
  assignedProjectIds: string[];
  assignedClientIds: string[];
  projects?: Project[];
  folders?: Array<{
    id: string;
    name: string;
    parentId: string | null;
    createdAt: string;
  }>;
  projectFiles?: Array<{
    id: string;
    name: string;
    fileType: string;
    size: string;
    uploadedAt: string;
    fileUrl: string;
    category?: string;
    folderId?: string | null;
  }>;
}

export interface TeamInternalFile {
  id: string;
  fileName: string;
  fileType: string;
  size: string;
  fileUrl: string;
  storagePath?: string;
  uploadedBy: string;
  uploadedAt: string;
  targetMemberId: string; // 'ALL' or specific teamMemberId
  category?: string;
  notes?: string;
  currency?: string;
  receiptUrl?: string;
  receivedBy?: string;
}

// Proposal & Pricing Calculator Engine Types
export interface PricingAddon {
  id: string;
  name: string;
  price: number;
  isRecurring?: boolean;
  description?: string;
}

export interface PricingOption {
  id: string;
  name: string;
  basePrice: number;
  isRecurring?: boolean;
  description?: string;
  featuresIncluded?: string[];
  addons?: PricingAddon[];
}

export interface PricingCategory {
  id: string;
  name: string;
  description?: string;
  options: PricingOption[];
  addons: PricingAddon[];
  techStack?: { name: string; price: number }[];
  softwareTypes?: { name: string; minPrice: number; maxPrice: number }[];
  customAllowed?: boolean;
}

export interface PricingCatalog {
  id?: string;
  updatedAt?: string;
  categories: PricingCategory[];
  currencies: { code: string; symbol: string; rate: number; name: string }[];
}

export interface ProposalItemAddon {
  id?: string;
  name: string;
  price: number;
  isRecurring?: boolean;
}

export interface ProposalItem {
  id: string;
  categoryId: string;
  categoryName: string;
  optionId?: string;
  optionName?: string;
  name?: string;
  description?: string;
  unitPrice?: number;
  basePrice: number;
  quantity: number;
  hours?: number;
  isRecurring?: boolean;
  selectedAddons: ProposalItemAddon[];
  selectedTechStack?: { name: string; price: number }[];
  customNotes?: string;
  itemTotal: number;
}

export type PaymentStructureType = 'full' | 'split_50_50' | 'custom';

export interface PaymentScheduleStage {
  id: string;
  name: string;
  percentage: number;
  amount: number;
}

export interface ProposalQuotation {
  id: string;
  proposalNumber: string;
  title: string;
  clientName: string;
  clientId?: string;
  clientEmail?: string;
  clientCompany?: string;
  serviceCategory?: string;
  projectType?: string;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Declined' | 'Converted';
  currency: string;
  currencySymbol: string;
  items: ProposalItem[];
  subtotal: number;
  oneTimeTotal: number;
  monthlyRecurringTotal: number;
  discountType: 'Percentage' | 'Fixed';
  discountValue: number;
  discountAmount: number;
  taxPercentage: number;
  taxAmount: number;
  estimatedTeamCost: number;
  targetProfitMarginPercent: number;
  calculatedProfitMarginAmount: number;
  grandTotal: number;
  paymentStructure?: PaymentStructureType;
  paymentSchedule?: PaymentScheduleStage[];
  paymentTermsText?: string;
  validUntilDate: string;
  notes?: string;
  receiptUrl?: string;
  receivedBy?: string;
  termsAndConditions?: string;
  createdAt: string;
  updatedAt: string;
  convertedProjectId?: string;
}

export interface PaymentDetails {
  id?: string;
  accountTitle: string;
  bankName: string;
  accountNumber: string;
  iban?: string;
  swiftBic?: string;
  bankCountry: string;
  bankAddress?: string;
  paymentEmail: string;
  paymentContactName?: string;
  paymentPurpose: string;
  additionalInstructions?: string;
  customPurposes?: string[];
  updatedAt?: string;
  companyName?: string;
  companyAddress?: string;
  companyEmail?: string;
  companyPhone?: string;
  taxNumber?: string;
}

export const DEFAULT_PAYMENT_PURPOSES = [
  'Website Development',
  'Software Development',
  'UI/UX Design',
  'Video Editing',
  'Animation',
  'Graphic Design',
  'Logo & Branding',
  'SEO',
  'Digital Marketing',
  'Social Media Management',
  'E-commerce Solutions',
  'UGC Ads',
  'AI Automation',
  'Maintenance',
  'Other'
];

export interface BankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  iban?: string;
  swiftBic?: string;
  additionalInstructions?: string;
}

export interface ClientPaymentRecord {
  id: string;
  clientId: string;
  masterClientId?: string;
  clientName: string;
  company?: string;
  projectId: string;
  projectName: string;
  service?: string;
  totalAmount: number;
  advance: number;
  paymentType?: 'Advance' | 'Milestone' | 'Final Payment' | 'Other' | string;
  transactionId?: string;
  additionalPayments?: { id: string; amount: number; date: string; notes?: string;
  currency?: string;
  receiptUrl?: string;
  receivedBy?: string; platform?: string }[];
  totalPaid: number;
  balance: number;
  status: 'Paid' | 'Partially Paid' | 'Pending' | 'Overdue' | 'Completed' | 'Failed' | 'Cancelled' | 'Refunded';
  paymentPlatform: string;
  paymentDates?: string[];
  notes?: string;
  currency?: string;
  receiptUrl?: string;
  receivedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamPaymentRecord {
  id: string;
  type: 'Monthly' | 'Project';
  teamMemberId: string;
  teamMemberName: string;
  clientId?: string;
  clientName?: string;
  projectId?: string;
  projectName?: string;
  service?: string;
  monthlySalary?: number;
  month?: string;
  projectTotal?: number;
  teamPaymentAmount?: number;
  advance?: number;
  totalPaid: number;
  balance: number;
  status: 'Paid' | 'Partially Paid' | 'Pending' | 'Overdue' | 'Completed' | 'Failed' | 'Cancelled' | 'Refunded';
  paymentPlatform: string;
  paymentDate?: string;
  dueDate?: string;
  transactionId?: string;
  notes?: string;
  currency?: string;
  receiptUrl?: string;
  receivedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PortalMessage {
  id: string;
  conversationId: string;
  portalId: string;
  portalType: 'client' | 'team';
  senderId: string;
  senderName: string;
  senderRole: 'Admin' | 'Client' | 'Team Member';
  receiverId: string;
  message: string;
  timestamp: string;
  sentAt?: string;
  deliveredAt?: string | null;
  readAt?: string | null;
  readStatus: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  type?: 'text' | 'voice' | 'file';
  voiceUrl?: string;
  voiceDuration?: number;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  deletedRole?: string;
  deletedFor?: string[];
  isPinned?: boolean;
  replyToMessageId?: string;
  attachment?: {
    id: string;
    fileName: string;
    fileType: string;
    fileSize: string;
    fileUrl: string;
    downloadUrl?: string;
    storagePath?: string;
  };
}

export interface PortalPresence {
  id: string;
  portalId: string;
  portalType: 'admin' | 'client' | 'team';
  name: string;
  lastActive: string;
  isOnline: boolean;
  isTyping?: boolean;
  activeConv?: string;
}

