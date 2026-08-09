export interface Product {
  id: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  price: number;
  currency: string;
  warranty: string;
  warrantyDays: number;
  available: boolean;
  stock: number;
  category: string;
  logoPath: string;
  accentColor: string;
  features: string[];
}

export const PRODUCTS: Product[] = [
  {
    id: 'chatgpt-plus',
    name: 'ChatGPT Plus',
    shortDescription: 'GPT-4o, DALL·E 3, Canvas & Voice Mode',
    fullDescription: 'Full access to ChatGPT Plus subscription including GPT-4o model, DALL·E 3 image generation, code interpreter, and custom GPTs.',
    price: 5.0,
    currency: '$',
    warranty: '20 Days Warranty',
    warrantyDays: 20,
    available: true,
    stock: 14,
    category: 'AI Service',
    logoPath: '/assets/products/chatgpt.svg',
    accentColor: 'rgba(16, 163, 127, 0.4)',
    features: [
      'Account/service delivery after payment',
      'Full replacement during 20-day warranty',
      'GPT-4o & Web browsing access',
      'Follow instructions provided in delivery'
    ]
  },
  {
    id: 'gemini-pro',
    name: 'Gemini AI Pro',
    shortDescription: 'Gemini 1.5 Pro, 1M Context & Advanced AI',
    fullDescription: 'Access to Google Gemini Advanced powered by Gemini 1.5 Pro with 1 Million token context window and Deep Research tools.',
    price: 5.0,
    currency: '$',
    warranty: '15 Days Warranty',
    warrantyDays: 15,
    available: true,
    stock: 9,
    category: 'AI Service',
    logoPath: '/assets/products/gemini.svg',
    accentColor: 'rgba(74, 144, 226, 0.4)',
    features: [
      'Instant invite/login credentials',
      '15-day complete warranty coverage',
      'Integrates with Google Workspace',
      'Code execution & multimodal reasoning'
    ]
  },
  {
    id: 'claude-pro',
    name: 'Claude 3.5 Sonnet',
    shortDescription: 'Claude Pro with Artifacts & Sonnet 3.5',
    fullDescription: 'Claude Pro subscription featuring Claude 3.5 Sonnet model, high usage limits, Projects workspace, and interactive Artifacts.',
    price: 5.0,
    currency: '$',
    warranty: '20 Days Warranty',
    warrantyDays: 20,
    available: true,
    stock: 11,
    category: 'AI Service',
    logoPath: '/assets/products/claude.svg',
    accentColor: 'rgba(217, 119, 6, 0.4)',
    features: [
      'Premium private/shared account option',
      '20-day direct replacement guarantee',
      'Artifacts canvas for code & previews',
      '5x higher usage limits than free version'
    ]
  },
  {
    id: 'perplexity-pro',
    name: 'Perplexity Pro',
    shortDescription: 'Pro Search, GPT-4o & Claude 3.5',
    fullDescription: 'Perplexity Pro AI Search engine with unlimited Pro Queries, model switching (GPT-4o, Claude 3.5, Sonar), and file uploads.',
    price: 5.0,
    currency: '$',
    warranty: '30 Days Warranty',
    warrantyDays: 30,
    available: true,
    stock: 18,
    category: 'AI Service',
    logoPath: '/assets/products/perplexity.svg',
    accentColor: 'rgba(20, 184, 166, 0.4)',
    features: [
      'Full 30-day subscription warranty',
      'Unlimited Pro Searches with citations',
      'Upload PDFs, code, and raw data',
      'Instant access link post-payment'
    ]
  },
  {
    id: 'canva-pro',
    name: 'Canva Pro',
    shortDescription: 'Magic Studio, Brand Kit & Premium Templates',
    fullDescription: 'Canva Pro upgrade with full access to Magic Studio AI tools, background remover, premium templates, and stock media catalog.',
    price: 4.0,
    currency: '$',
    warranty: '30 Days Warranty',
    warrantyDays: 30,
    available: true,
    stock: 22,
    category: 'AI Service',
    logoPath: '/assets/products/canva.svg',
    accentColor: 'rgba(124, 58, 237, 0.4)',
    features: [
      'Upgrades your existing Canva email',
      '30-day team/pro plan replacement warranty',
      'Access to 100M+ premium assets',
      'AI Magic Eraser & Expansion'
    ]
  },
  {
    id: 'capcut-pro',
    name: 'CapCut Pro',
    shortDescription: 'AI Video Effects, 4K Export & Auto Captions',
    fullDescription: 'CapCut Pro PC/Mobile subscription with AI video generation, smart cutout, auto captions in 30+ languages, and 4K 60fps export.',
    price: 4.0,
    currency: '$',
    warranty: '30 Days Warranty',
    warrantyDays: 30,
    available: true,
    stock: 15,
    category: 'AI Service',
    logoPath: '/assets/products/capcut.svg',
    accentColor: 'rgba(236, 72, 153, 0.4)',
    features: [
      '30-day guarantee period',
      'Works on Desktop, Web, and Mobile',
      'Unlock all Pro transitions & AI filters',
      'Fast delivery after proof submission'
    ]
  },
  {
    id: 'copilot-pro',
    name: 'Copilot Pro',
    shortDescription: 'Microsoft 365 Copilot & GPT-4 Turbo',
    fullDescription: 'Copilot Pro subscription integrated into Office apps (Word, Excel, PowerPoint) powered by GPT-4 Turbo and Designer AI.',
    price: 5.0,
    currency: '$',
    warranty: '20 Days Warranty',
    warrantyDays: 20,
    available: true,
    stock: 7,
    category: 'AI Service',
    logoPath: '/assets/products/copilot.svg',
    accentColor: 'rgba(37, 99, 235, 0.4)',
    features: [
      '20-day replacement warranty',
      'Faster AI response time during peak hours',
      'Office 365 AI assistant integration',
      'Includes 100 daily Designer boosts'
    ]
  },
  {
    id: 'youtube-premium',
    name: 'YouTube Premium',
    shortDescription: 'Ad-Free Video, Background Play & YT Music',
    fullDescription: 'YouTube Premium subscription including ad-free streaming, offline downloads, background playback, and full access to YouTube Music Pro.',
    price: 4.0,
    currency: '$',
    warranty: '30 Days Warranty',
    warrantyDays: 30,
    available: true,
    stock: 25,
    category: 'AI Service',
    logoPath: '/assets/products/youtube.svg',
    accentColor: 'rgba(239, 68, 68, 0.4)',
    features: [
      'Upgrades existing Google account via invite',
      '30-day full duration warranty',
      'Ad-free videos & YouTube Music',
      'Background video playback'
    ]
  },
  {
    id: 'midjourney-v6',
    name: 'Midjourney v6',
    shortDescription: 'v6 Photorealistic AI Art & Fast Hours',
    fullDescription: 'Midjourney Standard/Pro tier access for ultra-high quality AI artwork generation via Discord/Web with commercial usage rights.',
    price: 6.0,
    currency: '$',
    warranty: '15 Days Warranty',
    warrantyDays: 15,
    available: true,
    stock: 6,
    category: 'AI Service',
    logoPath: '/assets/products/midjourney.svg',
    accentColor: 'rgba(168, 85, 247, 0.4)',
    features: [
      '15-day guarantee period',
      'v6 & Niji model generation access',
      'Fast GPU generation hours',
      'Full commercial license'
    ]
  },
  {
    id: 'notion-ai',
    name: 'Notion AI',
    shortDescription: 'Q&A, Writing Assistant & Unlimited AI',
    fullDescription: 'Notion AI add-on subscription for unlimited writing assistance, document summarization, database automation, and AI Q&A search.',
    price: 4.0,
    currency: '$',
    warranty: '30 Days Warranty',
    warrantyDays: 30,
    available: true,
    stock: 16,
    category: 'AI Service',
    logoPath: '/assets/products/notion.svg',
    accentColor: 'rgba(30, 41, 59, 0.4)',
    features: [
      '30-day workspace warranty',
      'Unlimited Notion AI queries',
      'Auto-fill databases with AI summaries',
      'Instant invite upon order review'
    ]
  }
];
