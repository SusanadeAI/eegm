-- =========================================================
-- EVANGELIST ELISHA OLORUNDA - MINISTERIAL BOOKINGS TABLE
-- RUN THIS IN YOUR SUPABASE SQL EDITOR AFTER REINSTATING SUPABASE
-- =========================================================

-- Ensure UUID extension is active
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create table for speaking & ministration bookings
CREATE TABLE IF NOT EXISTS minister_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_name TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    gathering_type TEXT NOT NULL,
    other_gathering_type TEXT,
    event_theme TEXT,
    event_date TEXT NOT NULL,
    ministration_time TEXT NOT NULL,
    venue_location TEXT NOT NULL,
    expected_attendees TEXT,
    event_description TEXT,
    logistics_transportation TEXT NOT NULL,
    logistics_other_details TEXT,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
ALTER TABLE minister_bookings ENABLE ROW LEVEL SECURITY;

-- Drop any existing conflicting policies on minister_bookings
DROP POLICY IF EXISTS "Public Insert Booking" ON minister_bookings;
DROP POLICY IF EXISTS "Admin View Bookings" ON minister_bookings;
DROP POLICY IF EXISTS "Admin Update Bookings" ON minister_bookings;

-- 1. Anyone on the website can submit a booking request
CREATE POLICY "Public Insert Booking" 
ON minister_bookings 
FOR INSERT 
WITH CHECK (true);

-- 2. Authenticated admins can view all booking requests
CREATE POLICY "Admin View Bookings" 
ON minister_bookings 
FOR SELECT 
USING (
    EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
);

-- 3. Authenticated admins can update booking status (e.g., approved, confirmed, archived)
CREATE POLICY "Admin Update Bookings" 
ON minister_bookings 
FOR UPDATE 
USING (
    EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
);

-- Force PostgREST to reload schema cache immediately
NOTIFY pgrst, 'reload schema';
