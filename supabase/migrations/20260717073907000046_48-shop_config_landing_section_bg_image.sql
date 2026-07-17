ALTER TABLE shop_config
  ADD COLUMN IF NOT EXISTS landing_hero_bg_color        text    NOT NULL DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS landing_hero_bg_image        text,
  ADD COLUMN IF NOT EXISTS landing_about_bg_image       text,
  ADD COLUMN IF NOT EXISTS landing_why_bg_image         text,
  ADD COLUMN IF NOT EXISTS landing_carousel_bg_image    text,
  ADD COLUMN IF NOT EXISTS landing_testimonials_bg_image text,
  ADD COLUMN IF NOT EXISTS landing_services_bg_image    text,
  ADD COLUMN IF NOT EXISTS landing_gallery_bg_image     text,
  ADD COLUMN IF NOT EXISTS landing_contact_bg_image     text,
  ADD COLUMN IF NOT EXISTS landing_book_bg_color        text,
  ADD COLUMN IF NOT EXISTS landing_book_bg_image        text;
