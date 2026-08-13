-- ================================================================
-- ANYAI STORE — ADD PRODUCT SORT ORDER (RUN IN SUPABASE SQL EDITOR)
-- Run this in Supabase Dashboard -> SQL Editor -> New Query -> Run
-- Only needed if your products table was created before sort_order.
-- ================================================================

-- 1. Add the sort_order column (safe: does nothing if it already exists)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;

-- 2. Seed default order: ChatGPT first, Claude second, then the rest.
--    You can reorder anytime from the Admin Panel (Edit Product or the
--    up/down arrows in the Products table).
UPDATE public.products SET sort_order = CASE id
  WHEN 'chatgpt-plus'   THEN 1
  WHEN 'claude-pro'     THEN 2
  WHEN 'gemini-pro'     THEN 3
  WHEN 'perplexity-pro' THEN 4
  WHEN 'canva-pro'      THEN 5
  WHEN 'capcut-pro'     THEN 6
  WHEN 'copilot-pro'    THEN 7
  WHEN 'youtube-premium' THEN 8
  WHEN 'midjourney-v6'  THEN 9
  WHEN 'notion-ai'      THEN 10
  ELSE sort_order
END
WHERE id IN ('chatgpt-plus','claude-pro','gemini-pro','perplexity-pro','canva-pro','capcut-pro','copilot-pro','youtube-premium','midjourney-v6','notion-ai');