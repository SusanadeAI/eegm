-- ==========================================
-- EEMG DATABASE FIX v2 (RECURSION PATCH)
-- RUN THIS IN YOUR SUPABASE SQL EDITOR
-- ==========================================

-- 0. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CLEANUP OLD POLICIES (Wipe everything to be sure)
-- This clears any "infinite recursion" by deleting the broken policies first
DO $$ 
BEGIN
    -- Drop all policies on the tables we manage
    EXECUTE (SELECT string_agg('DROP POLICY IF EXISTS ' || quote_ident(policyname) || ' ON ' || quote_ident(tablename) || ';', ' ')
             FROM pg_policies 
             WHERE schemaname = 'public' 
             AND tablename IN ('site_content', 'conference_registrations', 'admin_profiles', 'gallery_images'));
END $$;

-- 2. ENSURE TABLES EXIST
CREATE TABLE IF NOT EXISTS site_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_key TEXT UNIQUE NOT NULL,
  content_text TEXT,
  content_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

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

CREATE TABLE IF NOT EXISTS admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS gallery_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT NOT NULL,
  caption TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==========================================
-- NEW ROBUST SECURITY (RLS)
-- ==========================================

-- Enable RLS
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE conference_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;

-- 1. ADMIN PROFILES (Safe - no recursion)
-- Allow anyone logged in to see if a UUID exists in admin_profiles
CREATE POLICY "Public Admin Read" ON admin_profiles FOR SELECT USING (true);
-- Only the user themselves or a superadmin can update their profile (manual setup required for superadmin)
CREATE POLICY "Self Management" ON admin_profiles FOR ALL USING (auth.uid() = id);

-- 2. SITE CONTENT
CREATE POLICY "Public View Content" ON site_content FOR SELECT USING (true);
CREATE POLICY "Admin Edit Content" ON site_content FOR ALL 
  USING (EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid()));

-- 3. GALLERY
CREATE POLICY "Public View Gallery" ON gallery_images FOR SELECT USING (true);
CREATE POLICY "Admin Manage Gallery" ON gallery_images FOR ALL 
  USING (EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid()));

-- 4. REGISTRATIONS
CREATE POLICY "Public Insert Registration" ON conference_registrations FOR INSERT WITH CHECK (true);
-- This is the one that was failing - the EXISTS check against the safe "Public Admin Read" policy will now work
CREATE POLICY "Admin View Submissions" ON conference_registrations FOR SELECT 
  USING (EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid()));

-- ==========================================
-- SEED DATA
-- ==========================================
INSERT INTO site_content (section_key, content_text) 
VALUES ('hero_h1', 'Igniting the Echoes <br> of <span class="accent glass-text">Eternity</span> in Every Heart.')
ON CONFLICT (section_key) DO NOTHING;
