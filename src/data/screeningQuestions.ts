export interface ScreeningQuestionDef {
  id: string;
  service: string;
  questionEnglish: string;
  type: 'text' | 'textarea' | 'select' | 'radio';
  optionsEnglish?: string[];
  placeholderEnglish?: string;
  category: 'technical' | 'experience' | 'portfolio' | 'workflow';
}

export const INITIAL_CANDIDATE_SCREENING_QUESTIONS: ScreeningQuestionDef[] = [
  {
    id: 'exp_years',
    service: 'General',
    questionEnglish: 'How many years of professional experience do you have in this field?',
    type: 'select',
    optionsEnglish: ['Less than 1 year', '1–2 years', '3–5 years', '5+ years'],
    placeholderEnglish: 'Select years of experience...',
    category: 'experience'
  },
  {
    id: 'worked_prof',
    service: 'General',
    questionEnglish: 'Have you worked professionally with clients or an agency before?',
    type: 'select',
    optionsEnglish: ['Yes', 'No'],
    category: 'experience'
  },
  {
    id: 'worked_intl',
    service: 'General',
    questionEnglish: 'Have you worked with international clients or global agencies?',
    type: 'select',
    optionsEnglish: ['Yes', 'No'],
    category: 'experience'
  },
  {
    id: 'worked_remote',
    service: 'General',
    questionEnglish: 'Do you have experience working remotely in a structured team environment?',
    type: 'select',
    optionsEnglish: ['Yes', 'No'],
    category: 'workflow'
  }
];

export const SERVICE_SCREENING_QUESTIONS: Record<string, ScreeningQuestionDef[]> = {
  'Video Editing': [
    {
      id: 've_software',
      service: 'Video Editing',
      questionEnglish: 'Which video editing software do you mainly use?',
      type: 'select',
      optionsEnglish: ['Adobe Premiere Pro', 'DaVinci Resolve', 'Final Cut Pro', 'CapCut / After Effects', 'Other'],
      category: 'technical'
    },
    {
      id: 've_duration',
      service: 'Video Editing',
      questionEnglish: 'How long have you been editing videos professionally?',
      type: 'select',
      optionsEnglish: ['Less than 1 year', '1–2 years', '3–5 years', '5+ years'],
      category: 'experience'
    },
    {
      id: 've_types',
      service: 'Video Editing',
      questionEnglish: 'What types of video content have you edited most frequently?',
      type: 'select',
      optionsEnglish: ['YouTube Shorts / Reels / TikTok', 'Long-form YouTube / Podcasts', 'Corporate & Sales Ads', 'Documentaries / Films', 'All of the above'],
      category: 'experience'
    },
    {
      id: 've_revisions',
      service: 'Video Editing',
      questionEnglish: 'Have you managed client revisions, feedback rounds, and deadline constraints before?',
      type: 'select',
      optionsEnglish: ['Yes, extensively', 'Yes, occasionally', 'No, not yet'],
      category: 'workflow'
    },
    {
      id: 've_samples',
      service: 'Video Editing',
      questionEnglish: 'Please provide links or details regarding your best video editing projects and sample drives:',
      type: 'textarea',
      placeholderEnglish: 'e.g., Google Drive link, Frame.io, YouTube playlist, or Behance...',
      category: 'portfolio'
    }
  ],
  'Graphic Design': [
    {
      id: 'gd_software',
      service: 'Graphic Design',
      questionEnglish: 'Which design software do you mainly use for graphic design work?',
      type: 'select',
      optionsEnglish: ['Adobe Photoshop & Illustrator', 'Figma', 'Canva Pro', 'CorelDRAW', 'Other'],
      category: 'technical'
    },
    {
      id: 'gd_duration',
      service: 'Graphic Design',
      questionEnglish: 'How long have you worked professionally in graphic design?',
      type: 'select',
      optionsEnglish: ['Less than 1 year', '1–2 years', '3–5 years', '5+ years'],
      category: 'experience'
    },
    {
      id: 'gd_types',
      service: 'Graphic Design',
      questionEnglish: 'What types of graphic design projects do you excel at?',
      type: 'select',
      optionsEnglish: ['Social Media Creatives & Ads', 'Brand Identity & Print Design', 'UI / Banner Visuals', 'Packaging & Merch', 'All of the above'],
      category: 'experience'
    },
    {
      id: 'gd_branding',
      service: 'Graphic Design',
      questionEnglish: 'Do you have experience maintaining brand guidelines and design consistency across campaigns?',
      type: 'select',
      optionsEnglish: ['Yes, extensive experience', 'Basic experience', 'No'],
      category: 'workflow'
    },
    {
      id: 'gd_samples',
      service: 'Graphic Design',
      questionEnglish: 'Please share your Behance, Dribbble, Figma, or Google Drive portfolio link:',
      type: 'textarea',
      placeholderEnglish: 'https://behance.net/yourprofile or Google Drive folder...',
      category: 'portfolio'
    }
  ],
  'Logo & Brand Identity Design': [
    {
      id: 'lb_software',
      service: 'Logo & Brand Identity Design',
      questionEnglish: 'Which vector and layout tools do you use for logo & brand identity design?',
      type: 'select',
      optionsEnglish: ['Adobe Illustrator', 'Figma', 'Affinity Designer', 'Other'],
      category: 'technical'
    },
    {
      id: 'lb_duration',
      service: 'Logo & Brand Identity Design',
      questionEnglish: 'How long have you worked in brand identity design?',
      type: 'select',
      optionsEnglish: ['Less than 1 year', '1–2 years', '3–5 years', '5+ years'],
      category: 'experience'
    },
    {
      id: 'lb_process',
      service: 'Logo & Brand Identity Design',
      questionEnglish: 'How do you develop complete brand identity packages (brand guidelines, typography, color palettes)?',
      type: 'textarea',
      placeholderEnglish: 'Briefly explain your design process from discovery to final brand kit delivery...',
      category: 'workflow'
    },
    {
      id: 'lb_rebranding',
      service: 'Logo & Brand Identity Design',
      questionEnglish: 'Have you worked with corporate clients or agency rebranding projects before?',
      type: 'select',
      optionsEnglish: ['Yes', 'No'],
      category: 'experience'
    },
    {
      id: 'lb_samples',
      service: 'Logo & Brand Identity Design',
      questionEnglish: 'Please share links to your brand identity showcase or logo portfolio:',
      type: 'textarea',
      placeholderEnglish: 'https://behance.net/gallery/... or Google Drive portfolio',
      category: 'portfolio'
    }
  ],
  'Website Development': [
    {
      id: 'wd_tech',
      service: 'Website Development',
      questionEnglish: 'Which website development stacks and platforms do you specialize in?',
      type: 'select',
      optionsEnglish: ['React / Next.js / TypeScript', 'WordPress / Elementor', 'Webflow / Framer', 'HTML/CSS/JS + PHP', 'Shopify Liquid', 'Other'],
      category: 'technical'
    },
    {
      id: 'wd_duration',
      service: 'Website Development',
      questionEnglish: 'How long have you been developing websites professionally?',
      type: 'select',
      optionsEnglish: ['Less than 1 year', '1–2 years', '3–5 years', '5+ years'],
      category: 'experience'
    },
    {
      id: 'wd_types',
      service: 'Website Development',
      questionEnglish: 'What types of web development projects have you built?',
      type: 'select',
      optionsEnglish: ['Landing Pages & Corporate Sites', 'Custom Web Applications', 'E-Commerce Stores', 'Full-Stack Web Systems', 'All of the above'],
      category: 'experience'
    },
    {
      id: 'wd_apis',
      service: 'Website Development',
      questionEnglish: 'Have you worked with REST APIs, database integrations, and custom backend logic?',
      type: 'select',
      optionsEnglish: ['Yes, regularly', 'Basic API knowledge', 'Frontend design only'],
      category: 'technical'
    },
    {
      id: 'wd_samples',
      service: 'Website Development',
      questionEnglish: 'Please share your live website project links or GitHub / portfolio profile:',
      type: 'textarea',
      placeholderEnglish: 'https://github.com/yourprofile or live client URLs...',
      category: 'portfolio'
    }
  ],
  'Software Development': [
    {
      id: 'sd_stack',
      service: 'Software Development',
      questionEnglish: 'Which core programming languages, frameworks, and databases do you use regularly?',
      type: 'textarea',
      placeholderEnglish: 'e.g. Node.js, Python, PostgreSQL, React, Docker, GCP...',
      category: 'technical'
    },
    {
      id: 'sd_duration',
      service: 'Software Development',
      questionEnglish: 'How long have you worked professionally in software engineering?',
      type: 'select',
      optionsEnglish: ['Less than 1 year', '1–2 years', '3–5 years', '5+ years'],
      category: 'experience'
    },
    {
      id: 'sd_apps',
      service: 'Software Development',
      questionEnglish: 'What types of software applications or backend systems have you architected?',
      type: 'textarea',
      placeholderEnglish: 'Describe SaaS platforms, custom tools, or enterprise systems you built...',
      category: 'experience'
    },
    {
      id: 'sd_teams',
      service: 'Software Development',
      questionEnglish: 'Have you collaborated in agile engineering teams with Git, CI/CD, and code reviews?',
      type: 'select',
      optionsEnglish: ['Yes, daily workflow', 'Some experience', 'No'],
      category: 'workflow'
    },
    {
      id: 'sd_samples',
      service: 'Software Development',
      questionEnglish: 'Please provide your GitHub URL and links to live software projects:',
      type: 'textarea',
      placeholderEnglish: 'https://github.com/username or project links...',
      category: 'portfolio'
    }
  ],
  'SEO': [
    {
      id: 'seo_duration',
      service: 'SEO',
      questionEnglish: 'How long have you worked in Search Engine Optimization (SEO)?',
      type: 'select',
      optionsEnglish: ['Less than 1 year', '1–2 years', '3–5 years', '5+ years'],
      category: 'experience'
    },
    {
      id: 'seo_types',
      service: 'SEO',
      questionEnglish: 'Which areas of SEO are your strongest suit?',
      type: 'select',
      optionsEnglish: ['On-Page & Content SEO', 'Technical SEO & Audits', 'Off-Page & Link Building', 'Local SEO & Google Business', 'Full-Spectrum Technical SEO'],
      category: 'technical'
    },
    {
      id: 'seo_tools',
      service: 'SEO',
      questionEnglish: 'Which SEO platforms and audit tools do you use daily?',
      type: 'select',
      optionsEnglish: ['Ahrefs & Semrush', 'Google Search Console & Analytics', 'Screaming Frog', 'All of the above', 'Other'],
      category: 'technical'
    },
    {
      id: 'seo_results',
      service: 'SEO',
      questionEnglish: 'Have you delivered measurable organic growth, keyword rankings, or traffic increases for real client sites?',
      type: 'select',
      optionsEnglish: ['Yes, with documented proof', 'Yes, moderate results', 'Still building case studies'],
      category: 'workflow'
    },
    {
      id: 'seo_samples',
      service: 'SEO',
      questionEnglish: 'Please share SEO case studies, ranking reports, or Google Search Console proof drive link:',
      type: 'textarea',
      placeholderEnglish: 'Link to drive folder with ranking proof, audits, or client reports...',
      category: 'portfolio'
    }
  ],
  'Digital Marketing': [
    {
      id: 'dm_duration',
      service: 'Digital Marketing',
      questionEnglish: 'How long have you worked in digital marketing & paid media advertising?',
      type: 'select',
      optionsEnglish: ['Less than 1 year', '1–2 years', '3–5 years', '5+ years'],
      category: 'experience'
    },
    {
      id: 'dm_platforms',
      service: 'Digital Marketing',
      questionEnglish: 'Which advertising networks do you manage campaigns on?',
      type: 'select',
      optionsEnglish: ['Meta Ads (Facebook & Instagram)', 'Google Ads & PPC', 'TikTok & Pinterest Ads', 'Omni-Channel Media Buying'],
      category: 'technical'
    },
    {
      id: 'dm_campaigns',
      service: 'Digital Marketing',
      questionEnglish: 'What types of campaign objectives have you run successfully?',
      type: 'select',
      optionsEnglish: ['E-Commerce Sales & ROAS', 'B2B Lead Generation', 'Brand Awareness & Traffic', 'App Installs / Funnels', 'All of the above'],
      category: 'experience'
    },
    {
      id: 'dm_budgets',
      service: 'Digital Marketing',
      questionEnglish: 'Have you directly managed ad accounts and monthly budgets for client campaigns?',
      type: 'select',
      optionsEnglish: ['Yes, over $5,000/month', 'Yes, under $5,000/month', 'No, worked as assistant/creative'],
      category: 'workflow'
    },
    {
      id: 'dm_samples',
      service: 'Digital Marketing',
      questionEnglish: 'Please share links to campaign case studies, ROAS screenshots, or portfolio drive:',
      type: 'textarea',
      placeholderEnglish: 'Google Drive folder link with campaign performance reports...',
      category: 'portfolio'
    }
  ],
  'Social Media Management': [
    {
      id: 'smm_platforms',
      service: 'Social Media Management',
      questionEnglish: 'Which social media channels have you managed for clients or brands?',
      type: 'select',
      optionsEnglish: ['Instagram & Facebook', 'LinkedIn & Twitter (X)', 'TikTok & YouTube Shorts', 'All major platforms'],
      category: 'technical'
    },
    {
      id: 'smm_duration',
      service: 'Social Media Management',
      questionEnglish: 'How long have you worked in social media management?',
      type: 'select',
      optionsEnglish: ['Less than 1 year', '1–2 years', '3–5 years', '5+ years'],
      category: 'experience'
    },
    {
      id: 'smm_niches',
      service: 'Social Media Management',
      questionEnglish: 'What business niches or brand types have you managed social accounts for?',
      type: 'textarea',
      placeholderEnglish: 'e.g. E-Commerce brands, SaaS, Real Estate, Local Businesses...',
      category: 'experience'
    },
    {
      id: 'smm_calendars',
      service: 'Social Media Management',
      questionEnglish: 'Do you create content calendars, copywriting captions, and post scheduling plans yourself?',
      type: 'select',
      optionsEnglish: ['Yes, end-to-end management', 'Copywriting & calendar only', 'Posting & scheduling only'],
      category: 'workflow'
    },
    {
      id: 'smm_samples',
      service: 'Social Media Management',
      questionEnglish: 'Please share links to social media profiles you currently or previously managed:',
      type: 'textarea',
      placeholderEnglish: 'Instagram handles, LinkedIn pages, or content calendar drive links...',
      category: 'portfolio'
    }
  ],
  'E-Commerce Solutions': [
    {
      id: 'ecom_platforms',
      service: 'E-Commerce Solutions',
      questionEnglish: 'Which e-commerce platforms do you specialize in?',
      type: 'select',
      optionsEnglish: ['Shopify & Shopify Plus', 'WooCommerce / WordPress', 'Amazon / Walmart Seller', 'Custom Headless E-Com'],
      category: 'technical'
    },
    {
      id: 'ecom_duration',
      service: 'E-Commerce Solutions',
      questionEnglish: 'How long have you worked with e-commerce store development or management?',
      type: 'select',
      optionsEnglish: ['Less than 1 year', '1–2 years', '3–5 years', '5+ years'],
      category: 'experience'
    },
    {
      id: 'ecom_tasks',
      service: 'E-Commerce Solutions',
      questionEnglish: 'Which store development and management aspects are your strongest?',
      type: 'select',
      optionsEnglish: ['Store Design & Theme Customization', 'Product Uploads & Inventory Setup', 'Payment Gateway & Checkout Optimization', 'App Integrations & Automations', 'All of the above'],
      category: 'technical'
    },
    {
      id: 'ecom_management',
      service: 'E-Commerce Solutions',
      questionEnglish: 'Have you handled order management, customer support systems, or inventory syncing?',
      type: 'select',
      optionsEnglish: ['Yes', 'No'],
      category: 'workflow'
    },
    {
      id: 'ecom_samples',
      service: 'E-Commerce Solutions',
      questionEnglish: 'Please share links to live e-commerce stores you have built or managed:',
      type: 'textarea',
      placeholderEnglish: 'https://store-url.com or Google Drive showcase link...',
      category: 'portfolio'
    }
  ],
  'UGC Ads': [
    {
      id: 'ugc_duration',
      service: 'UGC Ads',
      questionEnglish: 'How long have you created or edited UGC (User Generated Content) video ads?',
      type: 'select',
      optionsEnglish: ['Less than 1 year', '1–2 years', '3–5 years', '5+ years'],
      category: 'experience'
    },
    {
      id: 'ugc_hooks',
      service: 'UGC Ads',
      questionEnglish: 'What types of UGC ad hooks, scripts, and editing formats have you produced?',
      type: 'textarea',
      placeholderEnglish: 'Describe your UGC script writing, filming, or hook editing experience...',
      category: 'technical'
    },
    {
      id: 'ugc_paid',
      service: 'UGC Ads',
      questionEnglish: 'Have your UGC videos been used in direct-response paid ad campaigns (Meta / TikTok / YouTube)?',
      type: 'select',
      optionsEnglish: ['Yes, high-performing ads', 'Yes, organic only', 'No'],
      category: 'workflow'
    },
    {
      id: 'ugc_revisions',
      service: 'UGC Ads',
      questionEnglish: 'Can you deliver quick turnaround edits and client feedback adjustments on UGC videos?',
      type: 'select',
      optionsEnglish: ['Yes', 'No'],
      category: 'workflow'
    },
    {
      id: 'ugc_samples',
      service: 'UGC Ads',
      questionEnglish: 'Please share links to your UGC ad portfolio, drive folder, or TikTok showcase:',
      type: 'textarea',
      placeholderEnglish: 'Google Drive folder or Vimeo / TikTok video links...',
      category: 'portfolio'
    }
  ],
  'AI Automation': [
    {
      id: 'ai_tools',
      service: 'AI Automation',
      questionEnglish: 'Which AI platforms and automation tools do you use regularly?',
      type: 'select',
      optionsEnglish: ['Make.com / Zapier / n8n', 'OpenAI API / Gemini API', 'Voiceflow / Botpress AI Chatbots', 'Python AI Scripts / LangChain', 'All of the above'],
      category: 'technical'
    },
    {
      id: 'ai_duration',
      service: 'AI Automation',
      questionEnglish: 'How long have you worked with AI workflows and business automations?',
      type: 'select',
      optionsEnglish: ['Less than 1 year', '1–2 years', '3–5 years', '5+ years'],
      category: 'experience'
    },
    {
      id: 'ai_workflows',
      service: 'AI Automation',
      questionEnglish: 'What types of automated workflows or AI agents have you designed?',
      type: 'textarea',
      placeholderEnglish: 'e.g. Lead scraping automations, CRM auto-responders, AI customer support bots...',
      category: 'experience'
    },
    {
      id: 'ai_integrations',
      service: 'AI Automation',
      questionEnglish: 'Are you experienced with REST APIs, Webhooks, JSON payloads, and error handling in automations?',
      type: 'select',
      optionsEnglish: ['Yes, advanced proficiency', 'Basic experience', 'No'],
      category: 'technical'
    },
    {
      id: 'ai_samples',
      service: 'AI Automation',
      questionEnglish: 'Please share demo links, architecture diagrams, or videos of your automation workflows:',
      type: 'textarea',
      placeholderEnglish: 'Google Drive folder with video walkthroughs, Make/n8n blueprints, or GitHub links...',
      category: 'portfolio'
    }
  ],
  'Other': [
    {
      id: 'oth_tools',
      service: 'Other',
      questionEnglish: 'What software, tools, or technologies do you mainly use for this service?',
      type: 'textarea',
      placeholderEnglish: 'List software and tools...',
      category: 'technical'
    },
    {
      id: 'oth_duration',
      service: 'Other',
      questionEnglish: 'How long have you worked in this field?',
      type: 'select',
      optionsEnglish: ['Less than 1 year', '1–2 years', '3–5 years', '5+ years'],
      category: 'experience'
    },
    {
      id: 'oth_projects',
      service: 'Other',
      questionEnglish: 'Describe the main types of projects you have executed in this domain:',
      type: 'textarea',
      placeholderEnglish: 'Describe your key projects...',
      category: 'experience'
    },
    {
      id: 'oth_client_exp',
      service: 'Other',
      questionEnglish: 'Have you worked professionally with clients or an agency in this service before?',
      type: 'select',
      optionsEnglish: ['Yes', 'No'],
      category: 'workflow'
    },
    {
      id: 'oth_samples',
      service: 'Other',
      questionEnglish: 'Please share your work samples, drive folder, or portfolio links:',
      type: 'textarea',
      placeholderEnglish: 'Share portfolio drive or live links...',
      category: 'portfolio'
    }
  ]
};
