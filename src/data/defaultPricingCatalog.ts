import { PricingCatalog } from '../types';

export const DEFAULT_PRICING_CATALOG: PricingCatalog = {
  id: 'default_catalog',
  updatedAt: new Date().toISOString(),
  currencies: [
    { code: 'USD', symbol: '$', rate: 1.0, name: 'US Dollar' },
    { code: 'EUR', symbol: '€', rate: 0.92, name: 'Euro' },
    { code: 'GBP', symbol: '£', rate: 0.79, name: 'British Pound' },
    { code: 'CAD', symbol: 'CA$', rate: 1.36, name: 'Canadian Dollar' },
    { code: 'AED', symbol: 'AED ', rate: 3.67, name: 'UAE Dirham' },
    { code: 'PKR', symbol: 'Rs ', rate: 278.5, name: 'Pakistani Rupee' },
    { code: 'SAR', symbol: 'SAR ', rate: 3.75, name: 'Saudi Riyal' }
  ],
  categories: [
    {
      id: 'cat_web',
      name: 'Website Development',
      description: 'Landing pages, business portals, web apps, and custom web platforms.',
      options: [
        { id: 'opt_web_landing', name: 'Landing Page Website', basePrice: 300, description: '1-5 Sections, Responsive Design, Contact Form, Basic SEO' },
        { id: 'opt_web_business', name: 'Business Website', basePrice: 800, description: '5-15 Pages, Custom UI, CMS, Forms, SEO & Analytics Setup' },
        { id: 'opt_web_portfolio', name: 'Portfolio Website', basePrice: 400, description: 'Showcase work, interactive galleries, responsive design' },
        { id: 'opt_web_blog', name: 'Blog Website', basePrice: 500, description: 'Article CMS, categories, author profiles, SEO optimized' },
        { id: 'opt_web_ecom', name: 'E-commerce Website', basePrice: 1500, description: 'Products, Cart, Checkout, Order Management, Customer Accounts' },
        { id: 'opt_web_custom', name: 'Custom Web Application', basePrice: 3000, description: 'SaaS portal, custom database, complex workflow automation' }
      ],
      addons: [
        { id: 'add_web_domain', name: 'Custom Domain', price: 15, isRecurring: true, description: '/year' },
        { id: 'add_web_hosting', name: 'Premium Hosting', price: 100, isRecurring: true, description: '/year' },
        { id: 'add_web_ssl', name: 'SSL Certificate', price: 30, isRecurring: true, description: '/year' },
        { id: 'add_web_email', name: 'Business Email Setup', price: 50 },
        { id: 'add_web_form', name: 'Contact Form', price: 30 },
        { id: 'add_web_blog', name: 'Blog System', price: 150 },
        { id: 'add_web_admin', name: 'Admin Dashboard', price: 500 },
        { id: 'add_web_login', name: 'User Login System', price: 300 },
        { id: 'add_web_gateway', name: 'Payment Gateway', price: 250 },
        { id: 'add_web_lang', name: 'Multi-language Support', price: 300 },
        { id: 'add_web_speed', name: 'Speed Optimization', price: 150 },
        { id: 'add_web_seo', name: 'SEO Setup', price: 200 },
        { id: 'add_web_analytics', name: 'Google Analytics', price: 50 },
        { id: 'add_web_chat', name: 'Live Chat', price: 100 },
        { id: 'add_web_wa', name: 'WhatsApp Integration', price: 100 },
        { id: 'add_web_maint', name: 'Maintenance Plan', price: 50, isRecurring: true, description: '/month' }
      ]
    },
    {
      id: 'cat_software',
      name: 'Software Development',
      description: 'Enterprise ERPs, CRMs, POS, and custom software systems.',
      options: [
        { id: 'opt_sw_crm', name: 'CRM System', basePrice: 3000 },
        { id: 'opt_sw_erp', name: 'ERP System', basePrice: 5000 },
        { id: 'opt_sw_pos', name: 'POS System', basePrice: 3000 },
        { id: 'opt_sw_inv', name: 'Inventory Management', basePrice: 3000 },
        { id: 'opt_sw_school', name: 'School Management', basePrice: 5000 },
        { id: 'opt_sw_hosp', name: 'Hospital Management', basePrice: 10000 },
        { id: 'opt_sw_hr', name: 'HR Management System', basePrice: 5000 },
        { id: 'opt_sw_booking', name: 'Booking System', basePrice: 3000 },
        { id: 'opt_sw_rest', name: 'Restaurant System', basePrice: 3000 },
        { id: 'opt_sw_gym', name: 'Gym Management', basePrice: 3000 },
        { id: 'opt_sw_realtor', name: 'Real Estate CRM', basePrice: 5000 },
        { id: 'opt_sw_custom', name: 'Custom Enterprise Software', basePrice: 5000 }
      ],
      techStack: [
        { name: 'React', price: 0 },
        { name: 'Next.js', price: 500 },
        { name: 'Vue.js', price: 500 },
        { name: 'Flutter App', price: 2000 },
        { name: 'React Native', price: 2500 },
        { name: 'Node.js', price: 0 },
        { name: 'Express', price: 0 },
        { name: 'Laravel', price: 0 },
        { name: 'Django', price: 500 },
        { name: 'Firebase', price: 300 },
        { name: 'PostgreSQL', price: 500 },
        { name: 'MySQL', price: 0 },
        { name: 'MongoDB', price: 500 }
      ],
      addons: [
        { id: 'add_sw_auth', name: 'Authentication System', price: 500 },
        { id: 'add_sw_admin', name: 'Admin Panel', price: 1000 },
        { id: 'add_sw_emp', name: 'Employee Panel', price: 700 },
        { id: 'add_sw_portal', name: 'Client Portal', price: 1000 },
        { id: 'add_sw_dash', name: 'Dashboard & Analytics', price: 800 },
        { id: 'add_sw_reports', name: 'Custom Reports', price: 500 },
        { id: 'add_sw_api', name: 'API Integration', price: 500 },
        { id: 'add_sw_ai', name: 'AI Integration', price: 1000 },
        { id: 'add_sw_chat', name: 'Internal Chat System', price: 1500 },
        { id: 'add_sw_notif', name: 'Notification System', price: 500 },
        { id: 'add_sw_email', name: 'Email Automation System', price: 300 },
        { id: 'add_sw_sms', name: 'SMS Integration', price: 400 },
        { id: 'add_sw_pay', name: 'Payment System', price: 1000 },
        { id: 'add_sw_cloud', name: 'Cloud Deployment', price: 500 },
        { id: 'add_sw_app', name: 'Mobile App Companion', price: 3000 },
        { id: 'add_sw_maint', name: 'Monthly Software SLA Maintenance', price: 200, isRecurring: true, description: '/month' }
      ]
    },
    {
      id: 'cat_uiux',
      name: 'UI / UX Design',
      description: 'Figma wireframing, high-fidelity prototypes, and complete design systems.',
      options: [
        { id: 'opt_ui_landing', name: 'Landing Page Design', basePrice: 150 },
        { id: 'opt_ui_web', name: 'Website UI Design', basePrice: 500 },
        { id: 'opt_ui_mobile', name: 'Mobile App UI Design', basePrice: 1000 },
        { id: 'opt_ui_dash', name: 'Dashboard UI Design', basePrice: 1500 },
        { id: 'opt_ui_saas', name: 'SaaS Product UI Design', basePrice: 3000 },
        { id: 'opt_ui_wire', name: 'UX Wireframe Suite', basePrice: 200 },
        { id: 'opt_ui_proto', name: 'Interactive Prototype', basePrice: 500 },
        { id: 'opt_ui_ds', name: 'Design System Creation', basePrice: 1000 }
      ],
      addons: [
        { id: 'add_ui_extra', name: 'Extra Page / Screen', price: 50 },
        { id: 'add_ui_dark', name: 'Dark Mode Variant', price: 300 },
        { id: 'add_ui_resp', name: 'Responsive Layouts', price: 200 },
        { id: 'add_ui_proto', name: 'Clickable Interactive Prototype', price: 500 },
        { id: 'add_ui_src', name: 'Figma Design Source Files', price: 100 }
      ]
    },
    {
      id: 'cat_video',
      name: 'Video Editing',
      description: 'Reels, TikToks, YouTube, documentaries, and corporate promo videos.',
      options: [
        { id: 'opt_vid_short', name: 'Short Form Video (Reels/TikTok)', basePrice: 50 },
        { id: 'opt_vid_yt', name: 'YouTube Long Form Video', basePrice: 150 },
        { id: 'opt_vid_doc', name: 'Documentary Editing', basePrice: 500 },
        { id: 'opt_vid_podcast', name: 'Podcast Editing', basePrice: 100 },
        { id: 'opt_vid_corp', name: 'Corporate Promo Video', basePrice: 500 }
      ],
      addons: [
        { id: 'add_vid_motion', name: 'Motion Graphics', price: 100 },
        { id: 'add_vid_subs', name: 'Subtitles & Captions', price: 20 },
        { id: 'add_vid_color', name: 'Color Grading', price: 100 },
        { id: 'add_vid_sound', name: 'Sound Design & FX', price: 50 },
        { id: 'add_vid_thumb', name: 'Custom Thumbnail', price: 30 },
        { id: 'add_vid_script', name: 'Script Writing Assistance', price: 100 },
        { id: 'add_vid_aivoice', name: 'AI Voiceover Generation', price: 50 },
        { id: 'add_vid_stock', name: 'Premium Stock Footage', price: 100 }
      ]
    },
    {
      id: 'cat_anim',
      name: 'Animation',
      description: '2D/3D animation, logo motion, explainer videos, and character work.',
      options: [
        { id: 'opt_anim_logo', name: 'Logo Animation', basePrice: 150 },
        { id: 'opt_anim_2d', name: '2D Motion Animation', basePrice: 500 },
        { id: 'opt_anim_3d', name: '3D Product / Scene Animation', basePrice: 2000 },
        { id: 'opt_anim_explainer', name: 'Explainer Video', basePrice: 1000 },
        { id: 'opt_anim_char', name: 'Character Animation', basePrice: 800 }
      ],
      addons: [
        { id: 'add_anim_char', name: 'Custom Character Design', price: 500 },
        { id: 'add_anim_voice', name: 'Professional Voiceover', price: 200 },
        { id: 'add_anim_script', name: 'Animation Scriptwriting', price: 150 },
        { id: 'add_anim_bgm', name: 'Licensed Background Music', price: 50 },
        { id: 'add_anim_extra', name: 'Extra Duration (+1 min)', price: 100 },
        { id: 'add_anim_rev', name: 'Additional Revisions', price: 50 }
      ]
    },
    {
      id: 'cat_graphic',
      name: 'Graphic Design',
      description: 'Social posts, banners, flyers, packaging, brochures, and print assets.',
      options: [
        { id: 'opt_gd_post', name: 'Social Media Posts Pack', basePrice: 50 },
        { id: 'opt_gd_banner', name: 'Ad Banner / Web Header', basePrice: 50 },
        { id: 'opt_gd_flyer', name: 'Flyer / Poster Design', basePrice: 80 },
        { id: 'opt_gd_brochure', name: 'Corporate Brochure', basePrice: 200 },
        { id: 'opt_gd_card', name: 'Business Card Design', basePrice: 50 },
        { id: 'opt_gd_pack', name: 'Packaging & Label Design', basePrice: 300 },
        { id: 'opt_gd_pres', name: 'Pitch Deck & Presentation', basePrice: 200 },
        { id: 'opt_gd_menu', name: 'Restaurant Menu Design', basePrice: 150 }
      ],
      addons: [
        { id: 'add_gd_src', name: 'Editable Source Files (PSD/AI)', price: 50 },
        { id: 'add_gd_print', name: 'Print-Ready Files (PDF/CMYK)', price: 50 },
        { id: 'add_gd_concepts', name: 'Extra Design Concepts', price: 100 },
        { id: 'add_gd_rev', name: 'Additional Revisions', price: 30 }
      ]
    },
    {
      id: 'cat_brand',
      name: 'Logo & Brand Identity',
      description: 'Logo mark design, brand guidelines, stationery, and social kits.',
      options: [
        { id: 'opt_brand_logo', name: 'Logo Design Package', basePrice: 150 },
        { id: 'opt_brand_guide', name: 'Complete Brand Guidelines', basePrice: 500 },
        { id: 'opt_brand_card', name: 'Business Card & Stationery', basePrice: 100 },
        { id: 'opt_brand_social', name: 'Social Media Branding Kit', basePrice: 150 },
        { id: 'opt_brand_strat', name: 'Brand Strategy & Positioning', basePrice: 800 }
      ],
      addons: [
        { id: 'add_brand_src', name: 'Master Source Files', price: 50 },
        { id: 'add_brand_vec', name: 'Vector SVG/EPS Formats', price: 50 },
        { id: 'add_brand_favi', name: 'App Favicon & App Icons', price: 20 },
        { id: 'add_brand_kit', name: 'Social Media Banner Kit', price: 100 },
        { id: 'add_brand_stat', name: 'Stationery & Letterhead Suite', price: 150 }
      ]
    },
    {
      id: 'cat_seo',
      name: 'SEO & Search Optimization',
      description: 'On-page, technical SEO, backlinks, local SEO, and monthly management.',
      options: [
        { id: 'opt_seo_basic', name: 'Basic SEO Package', basePrice: 300, isRecurring: true, description: '/month' },
        { id: 'opt_seo_std', name: 'Standard SEO Package', basePrice: 800, isRecurring: true, description: '/month' },
        { id: 'opt_seo_ent', name: 'Enterprise SEO Package', basePrice: 2000, isRecurring: true, description: '/month' },
        { id: 'opt_seo_onpage', name: 'On-Page SEO Optimization', basePrice: 300 },
        { id: 'opt_seo_tech', name: 'Technical SEO Audit & Fix', basePrice: 500 },
        { id: 'opt_seo_local', name: 'Local SEO & Google Business', basePrice: 300, isRecurring: true, description: '/month' }
      ],
      addons: [
        { id: 'add_seo_kw', name: 'Keyword Research & Clustering', price: 100 },
        { id: 'add_seo_comp', name: 'Competitor Analysis Report', price: 150 },
        { id: 'add_seo_reports', name: 'Monthly Executive SEO Reporting', price: 50 },
        { id: 'add_seo_backlink', name: 'High-DA Backlink Package', price: 250 },
        { id: 'add_seo_speed', name: 'Core Web Vitals Speed Boost', price: 150 }
      ]
    },
    {
      id: 'cat_marketing',
      name: 'Digital Marketing & Ads',
      description: 'Facebook, Instagram, Google, TikTok, LinkedIn Ads, and Email funnels.',
      options: [
        { id: 'opt_mkt_fb', name: 'Facebook & Instagram Ads', basePrice: 500, isRecurring: true, description: '/month' },
        { id: 'opt_mkt_google', name: 'Google Search & Display Ads', basePrice: 600, isRecurring: true, description: '/month' },
        { id: 'opt_mkt_tiktok', name: 'TikTok Ads Campaign', basePrice: 500, isRecurring: true, description: '/month' },
        { id: 'opt_mkt_linkedin', name: 'LinkedIn B2B Lead Ads', basePrice: 800, isRecurring: true, description: '/month' },
        { id: 'opt_mkt_email', name: 'Email Marketing & Automation', basePrice: 300, isRecurring: true, description: '/month' }
      ],
      addons: [
        { id: 'add_mkt_creative', name: 'High-Converting Ad Creatives', price: 100 },
        { id: 'add_mkt_landing', name: 'Dedicated Lead Capture Page', price: 500 },
        { id: 'add_mkt_pixel', name: 'Meta Pixel & Conversion API Setup', price: 150 },
        { id: 'add_mkt_track', name: 'GA4 & Conversion Tracking', price: 200 },
        { id: 'add_mkt_report', name: 'Weekly Performance Reports', price: 100 }
      ]
    },
    {
      id: 'cat_smm',
      name: 'Social Media Management',
      description: 'Facebook, Instagram, TikTok, LinkedIn, Twitter/X, YouTube organic management.',
      options: [
        { id: 'opt_smm_starter', name: 'Starter Package (12 Posts/mo)', basePrice: 300, isRecurring: true, description: '/month' },
        { id: 'opt_smm_pro', name: 'Professional Package (24 Posts/mo)', basePrice: 800, isRecurring: true, description: '/month' },
        { id: 'opt_smm_enterprise', name: 'Enterprise Package (Daily Posts + Reels)', basePrice: 2000, isRecurring: true, description: '/month' }
      ],
      addons: [
        { id: 'add_smm_cal', name: 'Monthly Content Calendar', price: 100 },
        { id: 'add_smm_caption', name: 'Copywriting & Captions', price: 100 },
        { id: 'add_smm_hash', name: 'Hashtag Strategy', price: 50 },
        { id: 'add_smm_comm', name: 'Community Management & DM Replies', price: 200 },
        { id: 'add_smm_analytics', name: 'Monthly Analytics Audit', price: 100 },
        { id: 'add_smm_ads', name: 'Paid Ad Boosting Management', price: 300 }
      ]
    },
    {
      id: 'cat_ecom',
      name: 'E-commerce Solutions',
      description: 'Shopify, WooCommerce, and Custom Store setups.',
      options: [
        { id: 'opt_ecom_shopify', name: 'Shopify Store Setup', basePrice: 1000 },
        { id: 'opt_ecom_woo', name: 'WooCommerce Store Setup', basePrice: 1500 },
        { id: 'opt_ecom_custom', name: 'Custom Headless E-commerce Store', basePrice: 5000 }
      ],
      addons: [
        { id: 'add_ecom_prod', name: 'Product Listing & Upload ($5/product)', price: 5 },
        { id: 'add_ecom_gateway', name: 'Stripe / PayPal Gateway Setup', price: 300 },
        { id: 'add_ecom_ship', name: 'Shipping Rules & Tax Setup', price: 300 },
        { id: 'add_ecom_inv', name: 'Inventory Management Integration', price: 400 },
        { id: 'add_ecom_email', name: 'Klaviyo Email Automation', price: 250 },
        { id: 'add_ecom_cart', name: 'Abandoned Cart Recovery Flow', price: 200 }
      ]
    },
    {
      id: 'cat_ugc',
      name: 'UGC Ads (User Generated Content)',
      description: 'Creator product videos, unboxings, testimonials, and viral social ads.',
      options: [
        { id: 'opt_ugc_prod', name: 'Product UGC Video', basePrice: 150 },
        { id: 'opt_ugc_testi', name: 'Customer Testimonial Video', basePrice: 120 },
        { id: 'opt_ugc_life', name: 'Lifestyle UGC Video', basePrice: 180 },
        { id: 'opt_ugc_unbox', name: 'Unboxing Video', basePrice: 150 },
        { id: 'opt_ugc_app', name: 'App / Software Promotion UGC', basePrice: 200 }
      ],
      addons: [
        { id: 'add_ugc_script', name: 'Hook & Scriptwriting', price: 80 },
        { id: 'add_ugc_voice', name: 'Professional Voiceover', price: 100 },
        { id: 'add_ugc_creators', name: 'Multiple Creators Collaboration', price: 250 },
        { id: 'add_ugc_rev', name: 'Extra Revisions', price: 40 },
        { id: 'add_ugc_aspects', name: 'Both Vertical (9:16) & Horizontal (16:9)', price: 50 }
      ]
    },
    {
      id: 'cat_ai',
      name: 'AI Automation & Chatbots',
      description: 'AI customer support bots, WhatsApp automations, Gemini/OpenAI agents, and CRM bots.',
      options: [
        { id: 'opt_ai_web', name: 'Website AI Chatbot', basePrice: 500 },
        { id: 'opt_ai_wa', name: 'WhatsApp Business AI Bot', basePrice: 1000 },
        { id: 'opt_ai_fb', name: 'Facebook Messenger AI Bot', basePrice: 600 },
        { id: 'opt_ai_insta', name: 'Instagram DM Automation Bot', basePrice: 600 },
        { id: 'opt_ai_crm', name: 'CRM AI Assistant Integration', basePrice: 3000 },
        { id: 'opt_ai_support', name: '24/7 Customer Support Agent', basePrice: 1500 },
        { id: 'opt_ai_lead', name: 'Lead Qualification AI Bot', basePrice: 1200 }
      ],
      addons: [
        { id: 'add_ai_openai', name: 'OpenAI GPT-4o Integration', price: 500 },
        { id: 'add_ai_gemini', name: 'Google Gemini 1.5 Flash / Pro Integration', price: 500 },
        { id: 'add_ai_kb', name: 'Custom Vector Knowledge Base RAG', price: 1000 },
        { id: 'add_ai_api', name: 'Custom Backend API Integration', price: 500 },
        { id: 'add_ai_flow', name: 'Multi-step Workflow Automation', price: 500 },
        { id: 'add_ai_lang', name: 'Multi-language Translation Support', price: 400 },
        { id: 'add_ai_crmsync', name: 'Bi-directional CRM Synchronization', price: 600 }
      ]
    },
    {
      id: 'cat_custom',
      name: 'Other & Custom Services',
      description: 'Add custom tailored items, bespoke consulting, and unique agency deliverables.',
      options: [
        { id: 'opt_custom_bespoke', name: 'Custom Scope Deliverable', basePrice: 500 }
      ],
      addons: [
        { id: 'add_custom_generic', name: 'Custom Add-on Item', price: 100 }
      ],
      customAllowed: true
    }
  ]
};
