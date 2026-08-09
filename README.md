# ⚡ Premium Telegram Mini App AI Store

A production-ready **Telegram Mini App + Telegram Bot digital AI-services store** built with Next.js 14, TypeScript, and a high-end **Dynamic White + Atmospheric RGB Ambient Lighting System**.

![AI Store Preview](https://raw.githubusercontent.com/ygirma315-cell/any-bot/main/public/assets/products/chatgpt.svg)

---

## 🌟 Key Features

- **Dynamic White + Atmospheric RGB System**: Base UI remains clean **WHITE** (`#FAFAFC`), with continuous flowing translucent RGB ambient light sources moving softly in the background behind frosted white cards.
- **Product Catalog (10 AI Products)**: Configurable products including ChatGPT Plus, Gemini AI Pro, Claude 3.5 Sonnet, Perplexity Pro, Canva Pro, CapCut Pro, Copilot Pro, YouTube Premium, Midjourney v6, and Notion AI.
- **Interactive 3D Product Card Flip**: Tap **INFO** on any card to flip it smoothly in 3D to reveal detailed warranty terms, replacement rules, and delivery instructions.
- **Full Order & Cart Management**: Live cart badge, quantity controls, subtotal/total calculations, and empty-state vector illustrations.
- **Multi-Method Payment Screen**: Binance USDT (TRC20 / Binance Pay ID), Telebirr, CBE Bank, and International Bank Transfer with one-click account copying and "I've Paid" order submission.
- **Telegram Bot Admin Alerts**: Dispatches structured order notifications directly to your Telegram Admin Chat ID with customer handles, itemized breakdown, and status updates.
- **Seamless Localhost & Browser Fallback**: Runs out-of-the-box on `http://localhost:3000` with mock Telegram user fallback (`@demo_customer`) for standard web browsers.
- **Vercel & Production Ready**: Modular Next.js App Router architecture ready for instant Vercel deployment.

---

## 🛠️ Project Structure

```text
any-bot/
├── app/
│   ├── layout.tsx          # Root layout with Telegram WebApp SDK script
│   ├── page.tsx            # Main tabbed view manager & state handler
│   ├── globals.css         # RGB Ambient Orbs, design tokens, & 3D keyframe animations
│   ├── api/
│   │   ├── orders/route.ts   # Order processing & Telegram alert dispatch API
│   │   └── telegram/route.ts # Telegram Bot Webhook handler (/start command)
├── components/
│   ├── Header.tsx          # Store header with user greeting & live connection badge
│   ├── Navbar.tsx          # Mobile bottom navigation bar with animated tab pill & cart badge
│   ├── RgbAtmosphere.tsx   # Continuous floating translucent RGB ambient lighting system
│   ├── ProductCard.tsx     # 2-column card with 3D flip transform & soft RGB border reflection
│   ├── ProductGrid.tsx     # Mobile storefront grid with search & category filters
│   ├── OrderScreen.tsx     # Shopping cart management with empty-state illustration
│   └── PaymentScreen.tsx   # Expandable payment methods, account copy, & "I've Paid" submission
├── config/
│   ├── products.ts         # Centralized product catalog (10 AI services)
│   └── payments.ts         # Centralized payment methods & merchant account details
├── lib/
│   ├── telegram.ts         # Telegram WebApp SDK wrapper + Browser Dev Fallback mode
│   └── bot.ts              # Telegram Bot API notification helper
├── public/
│   └── assets/
│       └── products/       # Vector SVG logo assets for all 10 products
├── scripts/
│   └── bot-runner.ts       # Standalone local Telegram Bot polling runner
├── .env.example            # Environment variable template
├── .gitignore              # Excludes secrets, node_modules, and build outputs
├── package.json
└── README.md
```

---

## 🚀 Quick Start & Localhost Setup

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/ygirma315-cell/any-bot.git
cd any-bot
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Telegram credentials:

```env
# Telegram Bot Token (from @BotFather)
TELEGRAM_BOT_TOKEN=123456789:ABCdefGhIJklmnOPQRstUVwxYZ_example

# Telegram Admin Chat ID (Your personal Telegram ID)
TELEGRAM_ADMIN_CHAT_ID=123456789

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Note:** If `TELEGRAM_BOT_TOKEN` is not configured, the store will run in **local simulation mode** without throwing errors.

### 3. Launch Development Server

```bash
npm run dev
```

Open `http://localhost:3000` in your web browser.

---

## 🤖 Running the Telegram Bot Locally

To test your bot responding to `/start` in Telegram while running on `localhost`:

```bash
npm run bot
```

When users send `/start` to your bot, it will send a welcoming message with an **"Open AI Store"** button launching the Mini App.

---

## ⚙️ Customization Guide

### How to Modify Products

All 10 products are defined in `config/products.ts`. You can easily add, edit, or remove products:

```typescript
{
  id: 'chatgpt-plus',
  name: 'ChatGPT Plus',
  shortDescription: 'GPT-4o, DALL·E 3, Canvas & Voice Mode',
  price: 5.0,
  currency: '$',
  warranty: '20 Days Warranty',
  warrantyDays: 20,
  available: true,
  category: 'AI Chatbot',
  logoPath: '/assets/products/chatgpt.svg',
  accentColor: 'rgba(16, 163, 127, 0.4)',
  features: [...]
}
```

### How to Modify Payment Methods

Edit `config/payments.ts` to update your Binance Pay ID, Telebirr phone number, CBE Bank account, or IBAN:

```typescript
{
  id: 'binance',
  name: 'Binance Pay / USDT',
  accountId: 'YOUR_BINANCE_PAY_ID',
  accountName: 'AI Store Merchant',
  instructions: [...]
}
```

---

## ☁️ Deploying to Vercel & Connecting to Telegram

1. Push your repository to GitHub: `https://github.com/ygirma315-cell/any-bot.git`.
2. Connect your repository to [Vercel](https://vercel.com).
3. Set the Environment Variables in Vercel settings (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_CHAT_ID`, `NEXT_PUBLIC_APP_URL`).
4. Set up Bot Webhook with your production URL:
   ```text
   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://your-vercel-domain.vercel.app/api/telegram
   ```
5. Configure Menu Button in [@BotFather](https://t.me/BotFather):
   - Command: `/setmenubutton`
   - Select your bot.
   - Enter your Vercel deployment URL.

---

## 🛡️ Security

- No secrets or bot tokens are exposed to client-side frontend code.
- `.env` files and sensitive credentials are listed in `.gitignore`.
