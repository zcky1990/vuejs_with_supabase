-- Landing page navbar logo
-- Shows custom logo in landing page navigation bar alongside restaurant name

ALTER TABLE public.shop_config
  ADD COLUMN IF NOT EXISTS landing_nav_logo_url text;
