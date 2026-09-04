import { PreHiringQuestion } from '../types';

export const PRE_HIRING_SERVICES = [
  'Video Editing',
  'Graphic Design',
  'Logo & Brand Identity Design',
  'Website Development',
  'Software Development',
  'SEO',
  'Digital Marketing',
  'Social Media Management',
  'E-Commerce Solutions',
  'UGC Ads',
  'AI Automation',
  'Motion Graphics',
  'UI/UX Design',
  'Content Creation',
  'Paid Advertising',
  'Web Maintenance',
  'Other'
];

export const INITIAL_QUESTION_BANK: Partial<PreHiringQuestion>[] = [
  // ==================================================
  // VIDEO EDITING
  // ==================================================
  {
    service: 'Video Editing',
    difficulty: 'Beginner',
    type: 'Multiple Choice',
    question: 'What is the primary purpose of color grading in video editing?',
    questionRomanUrdu: 'Video editing mein color grading ka asli maqsad kya hota hai?',
    options: [
      'To trim unwanted clip sections',
      'To establish a visual tone, mood and stylistic color consistency',
      'To increase audio frequency volume',
      'To render proxy files faster'
    ],
    optionsRomanUrdu: [
      'Unwanted clips ko katna',
      'Video ka visual mood, tone aur color consistency set karna',
      'Audio frequency ko baraana',
      'Proxy files ko fast render karna'
    ],
    correctAnswer: 'To establish a visual tone, mood and stylistic color consistency',
    explanation: 'Color grading enhances the artistic look and emotional tone of footage.',
    explanationRomanUrdu: 'Color grading video ke visual look aur emotional tone ko improve karti hai.',
    points: 1,
    isActive: true
  },
  {
    service: 'Video Editing',
    difficulty: 'Beginner',
    type: 'Multiple Choice',
    question: 'In timeline video editing, what is the main function of a keyframe?',
    questionRomanUrdu: 'Timeline editing mein keyframe ka main use kis liye hota hai?',
    options: [
      'To mark the end of the video project',
      'To animate properties like position, scale or opacity over time',
      'To split an audio file into two separate tracks',
      'To compress the final export file size'
    ],
    optionsRomanUrdu: [
      'Project ka end mark karne ke liye',
      'Position, scale ya opacity jaise values ko time ke sath animate karne ke liye',
      'Audio track ko alag karne ke liye',
      'File size ko chota karne ke liye'
    ],
    correctAnswer: 'To animate properties like position, scale or opacity over time',
    explanation: 'Keyframes specify the start and end points of smooth parameter changes over time.',
    explanationRomanUrdu: 'Keyframes kisi bhi property ki movement ya change ko animate karne ke liye istemal hote hain.',
    points: 1,
    isActive: true
  },
  {
    service: 'Video Editing',
    difficulty: 'Beginner',
    type: 'Short Answer',
    question: 'What is the standard frame rate typically used for cinematic storytelling in video editing?',
    questionRomanUrdu: 'Cinematic video editing mein standard frame rate (FPS) kitna rakha jata hai?',
    expectedAnswer: '24 FPS (or 23.976 FPS)',
    points: 1,
    isActive: true
  },
  {
    service: 'Video Editing',
    difficulty: 'Advanced',
    type: 'Scenario',
    question: 'A client provides 30 minutes of raw interview footage and requests a high-retention 60-second social reel. Describe your complete editing workflow.',
    questionRomanUrdu: 'Client aapko 30-minute ki raw interview recording deta hai aur 60-second ki viral reel maangta hai. Aapka step-by-step editing workflow kya hoga?',
    expectedAnswer: 'Select best hooks, trim filler words, add jump cuts/B-roll, equalize dialogue audio, apply captions and sound effects, export in 9:16 vertical format.',
    points: 2,
    isActive: true
  },
  {
    service: 'Video Editing',
    difficulty: 'Advanced',
    type: 'Multiple Choice',
    question: 'What is the main advantage of using J-cuts and L-cuts in video storytelling?',
    questionRomanUrdu: 'J-cut aur L-cut editing technique ka sab se bara faida kya hai?',
    options: [
      'It speeds up video rendering time',
      'It creates smooth audio-visual transitions between scene cuts',
      'It removes grain from low-light camera footage',
      'It automatically generates subtitles'
    ],
    optionsRomanUrdu: [
      'Is se rendering speed tez ho jati hai',
      'Is se scene cuts ke darmiyan audio-visual transition natural lagti hai',
      'Is se low-light video ka noise khatam hota hai',
      'Is se auto subtitles generate ho jate hain'
    ],
    correctAnswer: 'It creates smooth audio-visual transitions between scene cuts',
    points: 2,
    isActive: true
  },
  {
    service: 'Video Editing',
    difficulty: 'Expert',
    type: 'Scenario',
    question: 'A high-budget commercial shot with 3 different cameras shows inconsistent color temperatures, mixed frame rates (24fps and 60fps), and noisy audio. Explain your technical recovery strategy.',
    questionRomanUrdu: 'Ek commercial shoot mein 3 alag cameras ki footage hai jinka color temperature alag hai, frame rate mixed hai (24fps aur 60fps), aur audio noisy hai. Aapka complete technical correction plan kya hoga?',
    expectedAnswer: 'Conform timeline to 24fps base, convert high-fps B-roll for slow-mo, noise-print audio dialogue, match skin tone vectorscopes, apply color space transform (CST) LUTs.',
    points: 3,
    isActive: true
  },

  // ==================================================
  // GRAPHIC DESIGN
  // ==================================================
  {
    service: 'Graphic Design',
    difficulty: 'Beginner',
    type: 'Multiple Choice',
    question: 'Which color space should be used when designing graphics exclusively for digital screens?',
    questionRomanUrdu: 'Digital screens ke liye graphics design karte waqt kaunsa color mode use hona chahiye?',
    options: ['CMYK', 'RGB', 'Pantone Spot Color', 'Grayscale'],
    optionsRomanUrdu: ['CMYK', 'RGB', 'Pantone Spot Color', 'Grayscale'],
    correctAnswer: 'RGB',
    explanation: 'RGB (Red, Green, Blue) is designed for light-emitting displays like phones and monitors.',
    explanationRomanUrdu: 'RGB color mode digital screens aur displays ke liye use hota hai.',
    points: 1,
    isActive: true
  },
  {
    service: 'Graphic Design',
    difficulty: 'Beginner',
    type: 'Short Answer',
    question: 'What is the main difference between raster images (e.g. PNG/JPG) and vector graphics (e.g. SVG/AI)?',
    questionRomanUrdu: 'Raster images (PNG/JPG) aur Vector graphics (SVG/AI) mein sab se bara farq kya hai?',
    expectedAnswer: 'Raster images are pixel-based and lose quality when scaled up, whereas vector graphics use mathematical paths and can scale infinitely without loss of resolution.',
    points: 1,
    isActive: true
  },
  {
    service: 'Graphic Design',
    difficulty: 'Advanced',
    type: 'Scenario',
    question: 'A client complains that their printed marketing banner colors look dark and dull compared to what they saw on their smartphone screen. How do you resolve this?',
    questionRomanUrdu: 'Client shikayat karta hai ke unka printed banner screen ke muqabla mein dull lag raha hai. Aap is problem ko kaise handle aur resolve karenge?',
    expectedAnswer: 'Explain RGB screen luminescence vs CMYK paper ink absorption, convert artwork to CMYK color space, adjust contrast/brightness, and run soft proofing before re-printing.',
    points: 2,
    isActive: true
  },
  {
    service: 'Graphic Design',
    difficulty: 'Expert',
    type: 'Scenario',
    question: 'You are tasked with creating a comprehensive digital design system for an enterprise app across mobile and web. Outline your tokenization and component scaling architecture.',
    questionRomanUrdu: 'Aapko ek baray enterprise application ke liye modular design system banana hai. Typography, spacing, colors aur component structure ki design strategy kya hogi?',
    expectedAnswer: 'Establish semantic color variables, responsive typography scale (1.25 ratio), grid system, 8pt spacing tokens, accessible WCAG contrast compliance, and reusable UI library components.',
    points: 3,
    isActive: true
  },

  // ==================================================
  // LOGO & BRAND IDENTITY DESIGN
  // ==================================================
  {
    service: 'Logo & Brand Identity Design',
    difficulty: 'Beginner',
    type: 'Multiple Choice',
    question: 'Why is vector format essential when exporting a master logo design?',
    questionRomanUrdu: 'Master logo export karte waqt Vector format kyun zaroori hai?',
    options: [
      'Vectors have smaller file sizes than JPEGs',
      'Vectors can scale infinitely without pixelation or quality loss',
      'Vectors automatically include 3D lighting',
      'Vectors prevent unauthorized copying'
    ],
    optionsRomanUrdu: [
      'Vector ka file size JPEG se chota hota hai',
      'Vector ko jitna bhi bara ya chota kar lein, pixel nahi phat tay aur quality kharab nahi hoti',
      'Vector mein 3D lighting khud aa jati hai',
      'Vector se copy-paste band ho jata hai'
    ],
    correctAnswer: 'Vectors can scale infinitely without pixelation or quality loss',
    points: 1,
    isActive: true
  },
  {
    service: 'Logo & Brand Identity Design',
    difficulty: 'Advanced',
    type: 'Scenario',
    question: 'How do you design a logo that functions effectively on dark backgrounds, light backgrounds, and single-color favicon spaces?',
    questionRomanUrdu: 'Aap ek aisa logo kaise design karenge jo dark theme, light theme aur chotay icon spaces (favicon) sab par sahi dikhay?',
    expectedAnswer: 'Design a primary mark with inverse dark/light variants and a simplified iconic symbol version for micro-app icons.',
    points: 2,
    isActive: true
  },
  {
    service: 'Logo & Brand Identity Design',
    difficulty: 'Expert',
    type: 'Scenario',
    question: 'A multi-brand holding company wants to unify 5 diverse sub-brands under one coherent brand system. Explain your brand architecture strategy (House of Brands vs Branded House).',
    questionRomanUrdu: 'Ek baray group ke pass 5 alag sub-brands hain. Unki complete brand identity aur design architecture kaise structure ki jaye gi?',
    expectedAnswer: 'Analyze sub-brand equity, decide between Monolithic vs Endorsed hierarchy, define primary logo grid rules, typeface pairings, brand color palette matrices, and brand guidelines manual.',
    points: 3,
    isActive: true
  },

  // ==================================================
  // WEBSITE DEVELOPMENT
  // ==================================================
  {
    service: 'Website Development',
    difficulty: 'Beginner',
    type: 'Multiple Choice',
    question: 'What is the primary role of responsive web design?',
    questionRomanUrdu: 'Responsive website design ka asli maqsad kya hota hai?',
    options: [
      'To make the website load faster on slow servers',
      'To ensure web layouts automatically adapt smoothly to desktop, tablet, and mobile screens',
      'To convert HTML elements into video formats',
      'To rank top on Google search without SEO'
    ],
    optionsRomanUrdu: [
      'Website ko slow server par tez chalana',
      'Website layout ko mobile, tablet aur desktop screens par automatisch adapt karwana',
      'HTML code ko video mein badalna',
      'Bina SEO ke Google par number 1 lana'
    ],
    correctAnswer: 'To ensure web layouts automatically adapt smoothly to desktop, tablet, and mobile screens',
    points: 1,
    isActive: true
  },
  {
    service: 'Website Development',
    difficulty: 'Advanced',
    type: 'Scenario',
    question: 'A website scores low on Core Web Vitals due to large LCP (Largest Contentful Paint) and high CLS (Cumulative Layout Shift). How do you optimize it?',
    questionRomanUrdu: 'Ek website ki loading speed slow hai aur layout hilti rehti hai (CLS & LCP issues). Aap ise kaise optimize aur fix karenge?',
    expectedAnswer: 'Compress and serve WebP images with explicit width/height attributes, defer non-essential JavaScript, preload hero assets, use CSS aspect-ratio, and optimize server response times.',
    points: 2,
    isActive: true
  },
  {
    service: 'Website Development',
    difficulty: 'Expert',
    type: 'Scenario',
    question: 'Design a high-availability client-side application architecture integrating OAuth, state management, offline local storage caching, and server-side API proxying.',
    questionRomanUrdu: 'Ek secure web app ke liye full-stack architecture design karein jisme OAuth authentication, state management, offline caching aur secure API proxying shaamil ho.',
    expectedAnswer: 'Implement React/Vite frontend with Zustand/Context state, Service Worker for PWA caching, Express backend API proxy keeping secrets server-side, and CORS/Firebase auth tokens.',
    points: 3,
    isActive: true
  },

  // ==================================================
  // SOFTWARE DEVELOPMENT
  // ==================================================
  {
    service: 'Software Development',
    difficulty: 'Beginner',
    type: 'Multiple Choice',
    question: 'Which Version Control System command is used to save changes to your local Git repository with a message?',
    questionRomanUrdu: 'Git mein local repository par changes ko message ke sath save karne ke liye konsi command use hoti hai?',
    options: ['git push', 'git commit -m "message"', 'git clone', 'git checkout'],
    optionsRomanUrdu: ['git push', 'git commit -m "message"', 'git clone', 'git checkout'],
    correctAnswer: 'git commit -m "message"',
    points: 1,
    isActive: true
  },
  {
    service: 'Software Development',
    difficulty: 'Advanced',
    type: 'Short Answer',
    question: 'What is the purpose of RESTful API status code 401 vs 403?',
    questionRomanUrdu: 'REST API status code 401 aur 403 mein kya difference hai?',
    expectedAnswer: '401 Unauthorized means authentication credentials are missing or invalid (unauthenticated). 403 Forbidden means authenticated user lacks necessary access permissions (unauthorized).',
    points: 2,
    isActive: true
  },
  {
    service: 'Software Development',
    difficulty: 'Expert',
    type: 'Scenario',
    question: 'A backend API experiences race conditions during high concurrent database updates. Explain how you prevent data inconsistency using transaction locks or optimistic locking.',
    questionRomanUrdu: 'High traffic ke waqt backend database par race conditions aa rahi hain aur data corrupt ho raha hai. Aap is race condition ko kaise prevent karenge?',
    expectedAnswer: 'Use database transactions with ROW LOCK / SELECT FOR UPDATE (pessimistic locking) or version column check (optimistic locking) to maintain atomicity and isolation.',
    points: 3,
    isActive: true
  },

  // ==================================================
  // SEO (SEARCH ENGINE OPTIMIZATION)
  // ==================================================
  {
    service: 'SEO',
    difficulty: 'Beginner',
    type: 'Multiple Choice',
    question: 'What is the recommended character length for an optimal Google Search meta title?',
    questionRomanUrdu: 'Google Search ke liye SEO meta title ki recommended character length kitni honi chahiye?',
    options: ['20-30 characters', '50-60 characters', '100-120 characters', 'Unlimited'],
    optionsRomanUrdu: ['20-30 characters', '50-60 characters', '100-120 characters', 'Unlimited'],
    correctAnswer: '50-60 characters',
    points: 1,
    isActive: true
  },
  {
    service: 'SEO',
    difficulty: 'Advanced',
    type: 'Scenario',
    question: 'A client site experiences a sudden 40% organic traffic drop following a major Google core algorithm update. How do you audit and recover traffic?',
    questionRomanUrdu: 'Google core update ke baad client website ki organic traffic 40% gir gayi hai. Aap step-by-step audit aur recovery plan kaise banayenge?',
    expectedAnswer: 'Analyze Google Search Console query drops, inspect thin/unhelpful content, review backlink toxicity, evaluate EEAT compliance, improve page speed and user engagement metrics.',
    points: 2,
    isActive: true
  },
  {
    service: 'SEO',
    difficulty: 'Expert',
    type: 'Scenario',
    question: 'Plan an international multi-regional SEO migration for a 50,000-page e-commerce store switching domains and implementing hreflang tags.',
    questionRomanUrdu: '50,000 pages wali international e-commerce website ko naye domain par migrate karna hai bina SEO ranking khoye. Strategy kya hogi?',
    expectedAnswer: 'Map 1:1 301 redirects, update XML sitemaps, implement correct hreflang ISO language/country tags, monitor Search Console indexing logs, and stage redirect testing.',
    points: 3,
    isActive: true
  },

  // ==================================================
  // DIGITAL MARKETING
  // ==================================================
  {
    service: 'Digital Marketing',
    difficulty: 'Beginner',
    type: 'Multiple Choice',
    question: 'What does CTR stand for in pay-per-click ad campaigns?',
    questionRomanUrdu: 'Digital advertising mein CTR ka kya matlab hota hai?',
    options: ['Cost To Return', 'Click-Through Rate', 'Customer Total Revenue', 'Conversion Target Ratio'],
    optionsRomanUrdu: ['Cost To Return', 'Click-Through Rate', 'Customer Total Revenue', 'Conversion Target Ratio'],
    correctAnswer: 'Click-Through Rate',
    points: 1,
    isActive: true
  },
  {
    service: 'Digital Marketing',
    difficulty: 'Advanced',
    type: 'Scenario',
    question: 'A Facebook ad campaign has high CTR (4%) but very low landing page conversion rate (0.5%). What is the root cause and how do you fix it?',
    questionRomanUrdu: 'Facebook Ad par clicks bohot aa rahe hain (high CTR) lekin conversion nahi ho rahi (low conversion). Iski waja kya hai aur ise kaise sahi karenge?',
    expectedAnswer: 'Check ad creative alignment with landing page promise, optimize landing page load speed, simplify checkout form fields, add social proof and clear call-to-action (CTA).',
    points: 2,
    isActive: true
  },
  {
    service: 'Digital Marketing',
    difficulty: 'Expert',
    type: 'Scenario',
    question: 'A client gives you $50,000 monthly ad budget across Google Ads, Meta Ads, and TikTok Ads. How do you allocate budget and structure multi-touch attribution?',
    questionRomanUrdu: '$50,000 monthly budget ko Meta, Google aur TikTok Ads mein kaise divide aur track karenge taake maximum ROI mile?',
    expectedAnswer: 'Allocate budget based on funnel stages (60% Conversion MOFU/BOFU, 30% Consideration TOFU, 10% Testing), implement Meta CAPI, Google Consent Mode, and data-driven attribution modeling.',
    points: 3,
    isActive: true
  },

  // ==================================================
  // SOCIAL MEDIA MANAGEMENT
  // ==================================================
  {
    service: 'Social Media Management',
    difficulty: 'Beginner',
    type: 'Short Answer',
    question: 'What are the 3 essential components of an engaging Instagram caption?',
    questionRomanUrdu: 'Ek zabardast Instagram post caption ke 3 sab se zaroori hissey konsay hain?',
    expectedAnswer: 'Strong opening hook, valuable story/insight body, and a clear call-to-action (CTA).',
    points: 1,
    isActive: true
  },
  {
    service: 'Social Media Management',
    difficulty: 'Advanced',
    type: 'Scenario',
    question: 'A client’s business Instagram account engagement dropped by 50% over the last month. How do you audit and revitalize organic reach?',
    questionRomanUrdu: 'Client ke Instagram account ka reach aur engagement 50% gir gya hai. Content strategy ko revitalize karne ke liye kya karenge?',
    expectedAnswer: 'Analyze Instagram Insights for high-performing formats (Reels/Carousels), pivot to trending short-form audio, increase community comment interaction, test posting time frequency.',
    points: 2,
    isActive: true
  },
  {
    service: 'Social Media Management',
    difficulty: 'Expert',
    type: 'Scenario',
    question: 'During a PR crisis, negative comments flood a client brand page. Outline your social media crisis management protocol.',
    questionRomanUrdu: 'Social media par brand ke khilaf crisis/negative comments ka toofan aa gaya hai. Crisis handling ki protocol kya hogi?',
    expectedAnswer: 'Pause scheduled promotional posts, prepare approved official statement with leadership, avoid deleting valid complaints, address genuine issues politely, and move discussions to private support channels.',
    points: 3,
    isActive: true
  },

  // ==================================================
  // E-COMMERCE SOLUTIONS
  // ==================================================
  {
    service: 'E-Commerce Solutions',
    difficulty: 'Beginner',
    type: 'Multiple Choice',
    question: 'What is the primary metric used to measure e-commerce cart abandonment rate?',
    questionRomanUrdu: 'E-commerce store mein Cart Abandonment Rate kaise calculate hota hai?',
    options: [
      'Percentage of visitors who add items to cart but exit without completing purchase',
      'Number of customers who request a product refund',
      'Total number of items added to wishlist',
      'Average time spent browsing product categories'
    ],
    optionsRomanUrdu: [
      'Wo percentage jo cart mein item daalte hain par khareede bina exit kar jaate hain',
      'Refund maangne wale customers ki taadad',
      'Wishlist mein daalay gaye products',
      'Website par guzara gaya time'
    ],
    correctAnswer: 'Percentage of visitors who add items to cart but exit without completing purchase',
    points: 1,
    isActive: true
  },
  {
    service: 'E-Commerce Solutions',
    difficulty: 'Advanced',
    type: 'Scenario',
    question: 'A Shopify store owner wants to increase Average Order Value (AOV). Name three proven strategies to implement.',
    questionRomanUrdu: 'Shopify store par Average Order Value (AOV) baraane ke liye 3 proven tareeqay batayein.',
    expectedAnswer: 'Implement post-purchase upsells, tiered volume discounts (e.g. Buy 2 Get 10% Off), bundle complementary products, and offer free shipping thresholds.',
    points: 2,
    isActive: true
  },
  {
    service: 'E-Commerce Solutions',
    difficulty: 'Expert',
    type: 'Scenario',
    question: 'Design a headless e-commerce architecture connecting Shopify Plus GraphQL API with Next.js frontend, Stripe custom checkout, and ERP inventory sync.',
    questionRomanUrdu: 'Shopify Plus, Next.js frontend, Stripe checkout aur ERP inventory sync ke sath headless e-commerce architecture kaise design hogi?',
    expectedAnswer: 'Use Storefront GraphQL API for catalog rendering, ISR caching for product pages, custom Webhooks for real-time ERP inventory sync, and Stripe Elements for compliant secure payment processing.',
    points: 3,
    isActive: true
  },

  // ==================================================
  // UGC ADS
  // ==================================================
  {
    service: 'UGC Ads',
    difficulty: 'Beginner',
    type: 'Multiple Choice',
    question: 'In User Generated Content (UGC) ad creation, what is the "Hook"?',
    questionRomanUrdu: 'UGC Video Ads mein "Hook" ka matlab kya hota hai?',
    options: [
      'The first 3 seconds of the video designed to stop user scrolling',
      'The music track used in the background',
      'The final discount coupon code displayed',
      'The video file export setting'
    ],
    optionsRomanUrdu: [
      'Video ke pehle 3 seconds jo user ka scroll rokhte hain',
      'Background music track',
      'End mein dikhaya gaya coupon code',
      'Export setting'
    ],
    correctAnswer: 'The first 3 seconds of the video designed to stop user scrolling',
    points: 1,
    isActive: true
  },
  {
    service: 'UGC Ads',
    difficulty: 'Advanced',
    type: 'Scenario',
    question: 'You are scripting a high-converting 30-second UGC ad for a skincare product. Outline the timeline structure.',
    questionRomanUrdu: 'Skincare product ke liye 30-second ki converting UGC ad ka script timeline structure banayein.',
    expectedAnswer: '0-3s: Visual problem hook. 3-10s: Agitate frustration & introduce product solution. 10-20s: Demonstration & transformation results. 20-30s: Strong Call To Action (CTA) with limited-time offer.',
    points: 2,
    isActive: true
  },
  {
    service: 'UGC Ads',
    difficulty: 'Expert',
    type: 'Scenario',
    question: 'Explain how you run a creative testing matrix with 5 creator angles, 3 hook variations, and 2 CTA endings to identify winning ad combinations efficiently.',
    questionRomanUrdu: 'Creative ad testing matrix kaise run karenge taake minimum spend mein top performing ad variations mil skein?',
    expectedAnswer: 'Modularly mix 5 creators x 3 hooks x 2 CTAs (30 variations), launch in Meta Dynamic Creative Ads (DCA) testing campaigns, track Thumb-Stop Rate and Hook Rate, then scale winners.',
    points: 3,
    isActive: true
  },

  // ==================================================
  // AI AUTOMATION
  // ==================================================
  {
    service: 'AI Automation',
    difficulty: 'Beginner',
    type: 'Multiple Choice',
    question: 'What is a webhook in automated workflows (e.g., Make.com / n8n)?',
    questionRomanUrdu: 'Workflow automation (Make/n8n/Zapier) mein Webhook kya kaam karta hai?',
    options: [
      'An automated HTTP callback trigger sent immediately when an event occurs in a web app',
      'A physical cable connecting servers',
      'A design layout template for chatbots',
      'A database backup file format'
    ],
    optionsRomanUrdu: [
      'Web app mein event hotay hi real-time data send karne wala HTTP trigger',
      'Server ko connect karne wali taar',
      'Chatbot ka visual design template',
      'Database backup format'
    ],
    correctAnswer: 'An automated HTTP callback trigger sent immediately when an event occurs in a web app',
    points: 1,
    isActive: true
  },
  {
    service: 'AI Automation',
    difficulty: 'Advanced',
    type: 'Scenario',
    question: 'A client wants an AI lead qualification system that receives incoming website form submissions, analyzes lead quality with Gemini API, and updates CRM pipeline automatically. How do you build it?',
    questionRomanUrdu: 'Client ko AI lead qualification system chahiye jo website form aate hi Gemini AI se score kare aur CRM mein save kare. Ise kaise automate karenge?',
    expectedAnswer: 'Setup Webhook receiver, pass payload to server-side Gemini API prompt for JSON scoring, evaluate criteria, and call CRM REST API endpoint to update pipeline stage.',
    points: 2,
    isActive: true
  },
  {
    service: 'AI Automation',
    difficulty: 'Expert',
    type: 'Scenario',
    question: 'Design an enterprise agentic AI customer support workflow with vector database retrieval (RAG), fallback human agent handoff, and full session conversation state persistence.',
    questionRomanUrdu: 'Enterprise level AI Support Agent design karein jisme Vector DB knowledge search, fallback human handoff aur conversation memory maintain ho.',
    expectedAnswer: 'Embed support docs in Pinecone/Firestore vector index, perform semantic search on query, pass context to Gemini API with tool calls for database lookup, detect low confidence score to trigger Zendesk/Live Agent handoff, and store session log.',
    points: 3,
    isActive: true
  }
];
