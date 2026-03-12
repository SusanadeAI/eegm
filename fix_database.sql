-- ==========================================
-- EEMG MASTER DATABASE SETUP & FIX
-- RUN THIS IN YOUR SUPABASE SQL EDITOR
-- ==========================================

-- 0. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. SITE CONTENT TABLE
CREATE TABLE IF NOT EXISTS site_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_key TEXT UNIQUE NOT NULL,
  content_text TEXT,
  content_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. CONFERENCE REGISTRATIONS TABLE
CREATE TABLE IF NOT EXISTS conference_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  gender TEXT,
  age_range TEXT,
  phone TEXT,
  email TEXT,
  city TEXT,
  state_country TEXT,
  campus TEXT,
  attend_church BOOLEAN,
  church_location TEXT,
  church_role TEXT,
  hear_about TEXT,
  attending_with_others BOOLEAN,
  others_count INTEGER DEFAULT 0,
  bus_location TEXT,
  pickup_available BOOLEAN,
  require_accommodation BOOLEAN,
  accommodation_details TEXT,
  receive_updates BOOLEAN,
  update_preference JSONB DEFAULT '[]',
  prayer_request TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. ADMIN PROFILES TABLE
CREATE TABLE IF NOT EXISTS admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. GALLERY IMAGES TABLE
CREATE TABLE IF NOT EXISTS gallery_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT NOT NULL,
  caption TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==========================================
-- SECURITY (RLS POLICIES)
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE conference_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;

-- Delete old policies to avoid duplicates
DROP POLICY IF EXISTS "Public Read Access" ON site_content;
DROP POLICY IF EXISTS "Admins Update Content" ON site_content;
DROP POLICY IF EXISTS "Public Can Register" ON conference_registrations;
DROP POLICY IF EXISTS "Admins View Registrations" ON conference_registrations;
DROP POLICY IF EXISTS "Public View Gallery" ON gallery_images;
DROP POLICY IF EXISTS "Admins Manage Gallery" ON gallery_images;
DROP POLICY IF EXISTS "Admin Profile View" ON admin_profiles;

-- 1. Site Content Policies
CREATE POLICY "Public Read Access" ON site_content FOR SELECT USING (true);
CREATE POLICY "Admins Update Content" ON site_content FOR ALL 
USING (auth.uid() IN (SELECT id FROM admin_profiles));

-- 2. Registration Policies
CREATE POLICY "Public Can Register" ON conference_registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins View Registrations" ON conference_registrations FOR SELECT 
USING (auth.uid() IN (SELECT id FROM admin_profiles));

-- 3. Gallery Policies
CREATE POLICY "Public View Gallery" ON gallery_images FOR SELECT USING (true);
CREATE POLICY "Admins Manage Gallery" ON gallery_images FOR ALL 
USING (auth.uid() IN (SELECT id FROM admin_profiles));

-- 4. Admin Profile Policies
CREATE POLICY "Admin Profile View" ON admin_profiles FOR SELECT USING (true);

-- ==========================================
-- SEED INITIAL DATA (Only if it doesn't exist)
-- ==========================================
INSERT INTO site_content (section_key, content_text) 
VALUES ('hero_h1', 'Igniting the Echoes <br> of <span class="accent glass-text">Eternity</span> in Every Heart.')
ON CONFLICT (section_key) DO NOTHING;
