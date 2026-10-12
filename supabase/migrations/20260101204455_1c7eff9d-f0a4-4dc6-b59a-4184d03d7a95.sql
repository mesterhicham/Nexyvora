-- Insert SEO-related platform settings
INSERT INTO public.platform_settings (key, value, type, category) VALUES
  ('site_title', 'My Platform', 'text', 'seo'),
  ('site_description', 'Welcome to our platform', 'text', 'seo'),
  ('og_title', '', 'text', 'seo'),
  ('og_description', '', 'text', 'seo'),
  ('og_image', '', 'url', 'seo'),
  ('favicon_url', '', 'url', 'seo'),
  ('twitter_card', 'summary_large_image', 'text', 'seo'),
  ('twitter_site', '', 'text', 'seo')
ON CONFLICT (key) DO NOTHING;