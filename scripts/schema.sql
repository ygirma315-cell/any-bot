-- ================================================================
-- ANYAI STORE — COMPLETE CLEAN SUPABASE RESET & MIGRATION SCRIPT
-- RUN THIS IN SUPABASE DASHBOARD -> SQL EDITOR -> NEW QUERY -> RUN
-- ================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop Old Tables (Clean Slate to prevent schema/constraint clashes)
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.telegram_users CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.payment_methods CASCADE;
DROP TABLE IF EXISTS public.admin_settings CASCADE;

-- 3. Create Telegram Users Table (Visitors & Customers)
CREATE TABLE public.telegram_users (
    telegram_id BIGINT PRIMARY KEY,
    username TEXT,
    first_name TEXT NOT NULL DEFAULT 'Customer',
    last_name TEXT,
    has_ordered BOOLEAN DEFAULT FALSE,
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Categories Table
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Products Table
CREATE TABLE public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    short_description TEXT,
    full_description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT '$',
    warranty TEXT,
    warranty_days INT DEFAULT 0,
    is_warranty BOOLEAN DEFAULT TRUE,
    available BOOLEAN DEFAULT TRUE,
    stock INT DEFAULT 0,
    category TEXT NOT NULL,
    logo_path TEXT,
    accent_color TEXT,
    features JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create Payment Methods Table
CREATE TABLE public.payment_methods (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    subtitle TEXT,
    badge TEXT,
    logo_path TEXT,
    color TEXT,
    account_id TEXT NOT NULL,
    account_name TEXT NOT NULL,
    network TEXT,
    instructions JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create Orders Table (Clean Sequential Order IDs)
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number BIGINT GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1),
    order_id TEXT UNIQUE NOT NULL,
    telegram_user_id BIGINT REFERENCES public.telegram_users(telegram_id) ON DELETE SET NULL,
    delivery_email TEXT,
    subtotal NUMERIC(10, 2) NOT NULL,
    total NUMERIC(10, 2) NOT NULL,
    payment_method JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Create Order Items Table
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    warranty TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Create Admin Settings Table
CREATE TABLE public.admin_settings (
    id INT PRIMARY KEY DEFAULT 1,
    admin_username TEXT NOT NULL DEFAULT 'admin',
    admin_password_hash TEXT NOT NULL DEFAULT 'admin123',
    telegram_admin_chat_id TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT single_row CHECK (id = 1)
);

-- Insert Default Admin Credentials Row (Username: admin | Password: admin123)
INSERT INTO public.admin_settings (id, admin_username, admin_password_hash)
VALUES (1, 'admin', 'admin123')
ON CONFLICT (id) DO NOTHING;

-- 10. Enable Row Level Security (RLS) & grant minimum public catalogue access
-- Orders, visitor records, and admin settings are deliberately private. Access
-- them only from Next.js server routes using SUPABASE_SERVICE_ROLE_KEY.
ALTER TABLE public.telegram_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.telegram_users FROM anon, authenticated;
REVOKE ALL ON TABLE public.categories FROM anon, authenticated;
REVOKE ALL ON TABLE public.products FROM anon, authenticated;
REVOKE ALL ON TABLE public.payment_methods FROM anon, authenticated;
REVOKE ALL ON TABLE public.orders FROM anon, authenticated;
REVOKE ALL ON TABLE public.order_items FROM anon, authenticated;
REVOKE ALL ON TABLE public.admin_settings FROM anon, authenticated;

GRANT SELECT ON TABLE public.categories TO anon, authenticated;
GRANT SELECT ON TABLE public.products TO anon, authenticated;
GRANT SELECT ON TABLE public.payment_methods TO anon, authenticated;

CREATE POLICY "Public can read categories" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public can read available products" ON public.products FOR SELECT TO anon, authenticated USING (available = true);
CREATE POLICY "Public can read active payment methods" ON public.payment_methods FOR SELECT TO anon, authenticated USING (is_active = true);

-- 11. Seed Initial Categories
INSERT INTO public.categories (name, sort_order) VALUES
('AI Assistants', 1),
('AI Search & Knowledge', 2),
('AI Design & Video', 3),
('Media & Streaming', 4)
ON CONFLICT (name) DO NOTHING;

-- 12. Seed Initial Payment Methods
INSERT INTO public.payment_methods (id, name, subtitle, badge, logo_path, color, account_id, account_name, network, instructions, sort_order) VALUES
('binance', 'Binance Pay', 'Cryptocurrency (Binance Pay ID)', 'Instant & Global', '/assets/payments/binance.png', 'rgba(240, 185, 11, 0.25)', '891029481', 'AI Store Merchant', 'Binance Pay', '["Open your Binance App.", "Go to Binance Pay and enter Pay ID listed below.", "Enter the exact order total in USDT.", "Tap \"I''ve Paid\" below once transferred."]'::jsonb, 1),
('usdt-crypto', 'USDT (BEP20 / TRC20)', 'USDT Crypto Wallet Transfer', 'BEP20 / TRC20', '/assets/payments/usdt.png', 'rgba(38, 161, 123, 0.25)', '0x71C76543219876543210BEP20', 'AI Store Crypto Wallet', 'USDT (BEP20 / TRC20)', '["Open your Trust Wallet, Metamask, or Crypto Exchange.", "Send exact USDT total to the BEP20 address below.", "Double check network selection before sending.", "Tap \"I''ve Paid\" below after broadcasting transaction."]'::jsonb, 2),
('telebirr', 'Telebirr', 'Mobile payment service', 'Popular', '/assets/payments/telebirr.jpg', 'rgba(0, 168, 232, 0.25)', '0911223344', 'AI Store Telebirr Business', NULL, '["Open Telebirr Mobile App or dial *127#.", "Select Transfer Money or Pay Merchant.", "Enter the Telebirr phone number listed below.", "Enter the exact amount and confirm transaction.", "Press \"I''ve Paid\" below once transferred."]'::jsonb, 3)
ON CONFLICT (id) DO NOTHING;

-- 13. Seed Initial Store Products
INSERT INTO public.products (id, name, short_description, full_description, price, currency, warranty, warranty_days, is_warranty, available, stock, category, logo_path, accent_color, features) VALUES
('chatgpt-plus', 'ChatGPT Plus', 'GPT-4o, DALL·E 3, Canvas & Voice Mode', 'Full access to ChatGPT Plus subscription including GPT-4o model, DALL·E 3 image generation, code interpreter, and custom GPTs.', 5.00, '$', '20 Days Warranty', 20, true, true, 14, 'AI Assistants', '/assets/products/chatgpt.png', 'rgba(16, 163, 127, 0.4)', '["Account/service delivery after payment", "Full replacement during 20-day warranty", "GPT-4o & Web browsing access", "Follow instructions provided in delivery"]'::jsonb),
('gemini-pro', 'Gemini AI Pro', 'Gemini 1.5 Pro, 1M Context & Advanced AI', 'Access to Google Gemini Advanced powered by Gemini 1.5 Pro with 1 Million token context window and Deep Research tools.', 5.00, '$', '15 Days Warranty', 15, true, true, 9, 'AI Assistants', '/assets/products/gemini.jpg', 'rgba(74, 144, 226, 0.4)', '["Instant invite/login credentials", "15-day complete warranty coverage", "Integrates with Google Workspace", "Code execution & multimodal reasoning"]'::jsonb),
('claude-pro', 'Claude 3.5 Sonnet', 'Claude Pro with Artifacts & Sonnet 3.5', 'Claude Pro subscription featuring Claude 3.5 Sonnet model, high usage limits, Projects workspace, and interactive Artifacts.', 5.00, '$', '20 Days Warranty', 20, true, true, 11, 'AI Assistants', '/assets/products/claude.png', 'rgba(217, 119, 6, 0.4)', '["Premium private/shared account option", "20-day direct replacement guarantee", "Artifacts canvas for code & previews", "5x higher usage limits than free version"]'::jsonb),
('perplexity-pro', 'Perplexity Pro', 'Pro Search, GPT-4o & Claude 3.5', 'Perplexity Pro AI Search engine with unlimited Pro Queries, model switching (GPT-4o, Claude 3.5, Sonar), and file uploads.', 5.00, '$', '30 Days Warranty', 30, true, true, 18, 'AI Search & Knowledge', '/assets/products/perplexity.svg', 'rgba(20, 184, 166, 0.4)', '["Full 30-day subscription warranty", "Unlimited Pro Searches with citations", "Upload PDFs, code, and raw data", "Instant access link post-payment"]'::jsonb),
('canva-pro', 'Canva Pro', 'Magic Studio, Brand Kit & Premium Templates', 'Canva Pro upgrade with full access to Magic Studio AI tools, background remover, premium templates, and stock media catalog.', 4.00, '$', '30 Days Warranty', 30, true, true, 22, 'AI Design & Video', '/assets/products/canva.svg', 'rgba(124, 58, 237, 0.4)', '["Upgrades your existing Canva email", "30-day team/pro plan replacement warranty", "Access to 100M+ premium assets", "AI Magic Eraser & Expansion"]'::jsonb),
('capcut-pro', 'CapCut Pro', 'AI Video Effects, 4K Export & Auto Captions', 'CapCut Pro PC/Mobile subscription with AI video generation, smart cutout, auto captions in 30+ languages, and 4K 60fps export.', 4.00, '$', '30 Days Warranty', 30, true, true, 15, 'AI Design & Video', '/assets/products/capcut.svg', 'rgba(236, 72, 153, 0.4)', '["30-day guarantee period", "Works on Desktop, Web, and Mobile", "Unlock all Pro transitions & AI filters", "Fast delivery after proof submission"]'::jsonb),
('copilot-pro', 'Copilot Pro', 'Microsoft 365 Copilot & GPT-4 Turbo', 'Copilot Pro subscription integrated into Office apps (Word, Excel, PowerPoint) powered by GPT-4 Turbo and Designer AI.', 5.00, '$', '20 Days Warranty', 20, true, true, 7, 'AI Assistants', '/assets/products/copilot.svg', 'rgba(37, 99, 235, 0.4)', '["20-day replacement warranty", "Faster AI response time during peak hours", "Office 365 AI assistant integration", "Includes 100 daily Designer boosts"]'::jsonb),
('youtube-premium', 'YouTube Premium', 'Ad-Free Video, Background Play & YT Music', 'YouTube Premium subscription including ad-free streaming, offline downloads, background playback, and full access to YouTube Music Pro.', 4.00, '$', '30 Days Warranty', 30, true, true, 25, 'Media & Streaming', '/assets/products/youtube.svg', 'rgba(239, 68, 68, 0.4)', '["Upgrades existing Google account via invite", "30-day full duration warranty", "Ad-free videos & YouTube Music", "Background video playback"]'::jsonb),
('midjourney-v6', 'Midjourney v6', 'v6 Photorealistic AI Art & Fast Hours', 'Midjourney Standard/Pro tier access for ultra-high quality AI artwork generation via Discord/Web with commercial usage rights.', 6.00, '$', '15 Days Warranty', 15, true, true, 6, 'AI Design & Video', '/assets/products/midjourney.svg', 'rgba(168, 85, 247, 0.4)', '["15-day guarantee period", "v6 & Niji model generation access", "Fast GPU generation hours", "Full commercial license"]'::jsonb),
('notion-ai', 'Notion AI', 'Q&A, Writing Assistant & Unlimited AI', 'Notion AI add-on subscription for unlimited writing assistance, document summarization, database automation, and AI Q&A search.', 4.00, '$', '30 Days Warranty', 30, true, true, 16, 'AI Search & Knowledge', '/assets/products/notion.svg', 'rgba(30, 41, 59, 0.4)', '["30-day workspace warranty", "Unlimited Notion AI queries", "Auto-fill databases with AI summaries", "Instant invite upon order review"]'::jsonb)
ON CONFLICT (id) DO NOTHING;
