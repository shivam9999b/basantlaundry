-- =====================================================
-- BASANTA DRY CLEANLINESS
-- COMPLETE DATABASE SETUP
-- =====================================================


-- =====================================================
-- 1. PAGE VIEWS TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS page_views (
  id BIGSERIAL PRIMARY KEY,
  page_slug TEXT UNIQUE NOT NULL,
  page_title TEXT,
  views INTEGER DEFAULT 0,
  unique_views INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default pages insert karein
INSERT INTO page_views (page_slug, page_title, views)
VALUES 
  ('homepage', 'Home Page', 0),
  ('track', 'Track Order', 0),
  ('articles', 'Articles', 0),
  ('contact', 'Contact', 0)
ON CONFLICT (page_slug) DO NOTHING;

-- RLS enable
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read page views" ON page_views;
DROP POLICY IF EXISTS "Public update page views" ON page_views;

CREATE POLICY "Public read page views"
ON page_views FOR SELECT TO public
USING (true);

CREATE POLICY "Public update page views"
ON page_views FOR UPDATE TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Public insert page views"
ON page_views FOR INSERT TO public
WITH CHECK (true);


-- =====================================================
-- 2. INCREMENT VIEW FUNCTION (RPC)
-- =====================================================

CREATE OR REPLACE FUNCTION increment_page_view(page_name TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO page_views (page_slug, views, last_viewed_at)
  VALUES (page_name, 1, NOW())
  ON CONFLICT (page_slug)
  DO UPDATE SET
    views = page_views.views + 1,
    last_viewed_at = NOW();
END;
$$;


-- =====================================================
-- 3. ORDERS TABLE — ENSURE ALL COLUMNS EXIST
-- =====================================================

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS cloth_image TEXT;

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS cloth_images JSONB DEFAULT '[]'::jsonb;

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS cloth_description TEXT;

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS cloth_details TEXT;

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS whatsapp_sent BOOLEAN DEFAULT FALSE;

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN DEFAULT FALSE;

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();


-- =====================================================
-- 4. NOTIFICATIONS LOG TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications_log (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
  type TEXT NOT NULL,              -- 'whatsapp', 'sms', 'push'
  recipient TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending',   -- 'pending', 'sent', 'failed'
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public all notifications" ON notifications_log;

CREATE POLICY "Public all notifications"
ON notifications_log FOR ALL TO public
USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_notifications_order
ON notifications_log(order_id);


-- =====================================================
-- 5. WHATSAPP SETTINGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS app_settings (
  id BIGSERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO app_settings (key, value)
VALUES 
  ('whatsapp_business_number', '919XXXXXXXXX'),
  ('whatsapp_enabled', 'false'),
  ('notifications_enabled', 'false'),
  ('onesignal_app_id', ''),
  ('google_reviews_link', 'https://g.page/r/YOUR_ID/review')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public all settings" ON app_settings;

CREATE POLICY "Public all settings"
ON app_settings FOR ALL TO public
USING (true) WITH CHECK (true);


-- =====================================================
-- 6. HOMEPAGE CONTENT
-- =====================================================

CREATE TABLE IF NOT EXISTS homepage_content (
  id BIGSERIAL PRIMARY KEY,
  title TEXT,
  subtitle TEXT,
  description TEXT,
  badge TEXT,
  button_text TEXT,
  button_link TEXT,
  image_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE homepage_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public all homepage" ON homepage_content;
CREATE POLICY "Public all homepage"
ON homepage_content FOR ALL TO public
USING (true) WITH CHECK (true);


-- =====================================================
-- 7. HOMEPAGE STATS
-- =====================================================

CREATE TABLE IF NOT EXISTS homepage_stats (
  id BIGSERIAL PRIMARY KEY,
  stat_orders TEXT,
  stat_rating TEXT,
  stat_time TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE homepage_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public all stats" ON homepage_stats;
CREATE POLICY "Public all stats"
ON homepage_stats FOR ALL TO public
USING (true) WITH CHECK (true);


-- =====================================================
-- 8. SERVICES
-- =====================================================

CREATE TABLE IF NOT EXISTS services (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC DEFAULT 0,
  icon TEXT,
  image_url TEXT,
  sort_order INT DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public all services" ON services;
CREATE POLICY "Public all services"
ON services FOR ALL TO public
USING (true) WITH CHECK (true);


-- =====================================================
-- 9. ARTICLES
-- =====================================================

CREATE TABLE IF NOT EXISTS articles (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT,
  category TEXT,
  description TEXT,
  content TEXT,
  image_url TEXT,
  author TEXT DEFAULT 'Basanta',
  published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public all articles" ON articles;
CREATE POLICY "Public all articles"
ON articles FOR ALL TO public
USING (true) WITH CHECK (true);


-- =====================================================
-- 10. PRICING
-- =====================================================

CREATE TABLE IF NOT EXISTS pricing (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC DEFAULT 0,
  icon TEXT,
  sort_order INT DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pricing ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public all pricing" ON pricing;
CREATE POLICY "Public all pricing"
ON pricing FOR ALL TO public
USING (true) WITH CHECK (true);


-- =====================================================
-- 11. STEPS (How It Works)
-- =====================================================

CREATE TABLE IF NOT EXISTS steps (
  id BIGSERIAL PRIMARY KEY,
  step_number TEXT,
  icon TEXT,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE steps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public all steps" ON steps;
CREATE POLICY "Public all steps"
ON steps FOR ALL TO public
USING (true) WITH CHECK (true);


-- =====================================================
-- 12. CONTACT INFORMATION
-- =====================================================

CREATE TABLE IF NOT EXISTS contact_information (
  id BIGSERIAL PRIMARY KEY,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  address TEXT,
  instagram TEXT,
  facebook TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE contact_information ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public all contact" ON contact_information;
CREATE POLICY "Public all contact"
ON contact_information FOR ALL TO public
USING (true) WITH CHECK (true);


-- =====================================================
-- 13. FOOTER LINKS
-- =====================================================

CREATE TABLE IF NOT EXISTS footer_links (
  id BIGSERIAL PRIMARY KEY,
  section TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE footer_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public all footer" ON footer_links;
CREATE POLICY "Public all footer"
ON footer_links FOR ALL TO public
USING (true) WITH CHECK (true);


-- =====================================================
-- 14. REVIEWS
-- =====================================================

CREATE TABLE IF NOT EXISTS reviews (
  id BIGSERIAL PRIMARY KEY,
  customer_name TEXT,
  rating INT DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public all reviews" ON reviews;
CREATE POLICY "Public all reviews"
ON reviews FOR ALL TO public
USING (true) WITH CHECK (true);


-- =====================================================
-- 15. STORAGE BUCKETS
-- =====================================================

-- Cloth images bucket (customer uploads)
INSERT INTO storage.buckets (id, name, public)
VALUES ('cloth-images', 'cloth-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Content images bucket (admin uploads)
INSERT INTO storage.buckets (id, name, public)
VALUES ('website-image', 'website-image', true)
ON CONFLICT (id) DO UPDATE SET public = true;


-- =====================================================
-- 16. STORAGE POLICIES
-- =====================================================

-- Cloth images policies
DROP POLICY IF EXISTS "Public view cloth images" ON storage.objects;
DROP POLICY IF EXISTS "Public upload cloth images" ON storage.objects;

CREATE POLICY "Public view cloth images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'cloth-images');

CREATE POLICY "Public upload cloth images"
ON storage.objects FOR INSERT TO public
WITH CHECK (bucket_id = 'cloth-images');

-- Website image policies
DROP POLICY IF EXISTS "Public view website images" ON storage.objects;
DROP POLICY IF EXISTS "Public upload website images" ON storage.objects;

CREATE POLICY "Public view website images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'website-image');

CREATE POLICY "Public upload website images"
ON storage.objects FOR INSERT TO public
WITH CHECK (bucket_id = 'website-image');


-- =====================================================
-- 17. ORDERS RLS POLICIES
-- =====================================================

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public insert orders" ON orders;
DROP POLICY IF EXISTS "Public read orders" ON orders;
DROP POLICY IF EXISTS "Public update orders" ON orders;

CREATE POLICY "Public insert orders"
ON orders FOR INSERT TO public
WITH CHECK (true);

CREATE POLICY "Public read orders"
ON orders FOR SELECT TO public
USING (true);

CREATE POLICY "Public update orders"
ON orders FOR UPDATE TO public
USING (true)
WITH CHECK (true);


-- =====================================================
-- 18. TRIGGER — ORDER CREATED NOTIFICATION LOG
-- =====================================================

CREATE OR REPLACE FUNCTION log_order_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO notifications_log (
    order_id,
    type,
    recipient,
    message,
    status
  ) VALUES (
    NEW.id,
    'whatsapp',
    NEW.phone,
    'Order ' || COALESCE(NEW.order_number, NEW.id::text) || ' created',
    'pending'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS after_order_insert ON orders;

CREATE TRIGGER after_order_insert
AFTER INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION log_order_notification();


-- =====================================================
-- 19. VIEW — ORDER STATS (Dashboard)
-- =====================================================

CREATE OR REPLACE VIEW order_stats AS
SELECT
  COUNT(*) AS total_orders,
  COUNT(*) FILTER (WHERE status = 'pending') AS pending,
  COUNT(*) FILTER (WHERE status = 'picked_up') AS picked_up,
  COUNT(*) FILTER (WHERE status = 'delivered') AS delivered,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS last_7_days,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS last_30_days
FROM orders;


-- =====================================================
-- 20. VERIFY
-- =====================================================

-- Check tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check page views
SELECT * FROM page_views;

-- Check settings
SELECT * FROM app_settings;