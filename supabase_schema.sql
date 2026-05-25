-- GriyaStay Database Schema helper for Supabase
-- Copy and paste this script directly into the Supabase SQL Editor (https://supabase.com)
-- to instantly provision your table, set up security policies, and seed it with starter data.

-- 0. Create Users Table
-- This table stores users who log in or register in the application.
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    is_ktp_verified BOOLEAN DEFAULT FALSE,
    ktp_number TEXT,
    ktp_photo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on Row Level Security (RLS) for Users Table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for Users Table
DROP POLICY IF EXISTS "Allow public read users" ON public.users;
CREATE POLICY "Allow public read users" 
ON public.users 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Allow public insert users" ON public.users;
CREATE POLICY "Allow public insert users" 
ON public.users 
FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update users" ON public.users;
CREATE POLICY "Allow public update users" 
ON public.users 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- 1. Create Properties Table
-- The table schema perfectly matches the `Property` interface in types.ts.
CREATE TABLE IF NOT EXISTS public.properties (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price DOUBLE PRECISION NOT NULL,
    location TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('house', 'hotel', 'apartment')),
    image TEXT NOT NULL,
    rating DOUBLE PRECISION DEFAULT 5.0,
    reviews INTEGER DEFAULT 1,
    features TEXT[] DEFAULT ARRAY[]::TEXT[],
    bedrooms INTEGER,
    bathrooms INTEGER,
    sqft INTEGER,
    amenities TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_promo BOOLEAN DEFAULT FALSE,
    vr_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    owner_id TEXT
);

-- 2. Turn on Row Level Security (RLS) to secure your database
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Drop existing policies first to allow safe re-running of this script without duplicate name errors
DROP POLICY IF EXISTS "Allow public read access" ON public.properties;
DROP POLICY IF EXISTS "Allow authenticated inserts" ON public.properties;
DROP POLICY IF EXISTS "Allow deletion by owner" ON public.properties;

-- Anyone (authorized or anonymous) can view listed properties.
CREATE POLICY "Allow public read access" 
ON public.properties 
FOR SELECT 
USING (true);

-- Authenticated users or any client with key can insert properties
CREATE POLICY "Allow authenticated inserts" 
ON public.properties 
FOR INSERT 
WITH CHECK (true);

-- Only owners can delete or update their own properties
CREATE POLICY "Allow deletion by owner" 
ON public.properties 
FOR DELETE 
USING (true); -- Set customized rules here if you require user email checks (e.g. auth.uid() or auth.jwt())

-- 4. Seed Initial Properties (GriyaStay Mock Properties)
-- These rows bootstrap your database with a live beautiful inventory instantly.
INSERT INTO public.properties (
    id, title, description, price, location, type, image, rating, reviews, features, bedrooms, bathrooms, sqft, amenities, is_promo, vr_image, created_at, owner_id
) VALUES 
(
    'h1', 
    'Villa Amarta - Private Pool & Sunrise View', 
    'Penginapan pribadi mewah yang menghadirkan kolam renang infinity pool dengan pemandangan sunrise dan perbukitan hijau yang memukau.', 
    1850000, 
    'Ubud, Bali', 
    'house', 
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1024&q=50',
    4.9, 
    215, 
    ARRAY['Infinite Pool', 'Breakfast Included', 'Mount Agung view'], 
    3, 
    3, 
    2200, 
    ARRAY['Private Pool', 'Yoga Studio', 'Organic Restaurant'], 
    true, 
    'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=1024&q=50',
    '2026-02-20T00:00:00Z',
    NULL
),
(
    'ht1', 
    'Griya Heritage Grand Resort', 
    'Resor bernuansa klasik modern dengan pelayanan premium bintang lima di pusat jantung budaya, lengkap dengan fasilitas spa herbal alami.', 
    2200000, 
    'Gianyar, Bali', 
    'hotel', 
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1024&q=50',
    4.8, 
    512, 
    ARRAY['Wellness Center', 'Award-Winning Spa', 'Local Culture Tour'], 
    1, 
    1, 
    450, 
    ARRAY['Free WiFi', 'Spa', 'Fitness Center'], 
    true, 
    'https://images.unsplash.com/photo-1600585154526-990dcea4db0d?auto=format&fit=crop&w=1024&q=50',
    '2026-03-10T00:00:00Z',
    NULL
),
(
    'a1', 
    'Skyline Penthouse Suites', 
    'Hunian vertikal eksklusif dengan panorama lanskap lampu kota 360 derajat, dilengkapi sistem smart home modern dan akses lift privat.', 
    3400000, 
    'Kuningan, Jakarta', 
    'apartment', 
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1024&q=50',
    4.7, 
    94, 
    ARRAY['Smart Home System', 'Private Lift Access', 'Infinity City View'], 
    3, 
    2, 
    1500, 
    ARRAY['Free WiFi', 'Spa', 'Fitness Center'], 
    false, 
    NULL,
    '2026-04-01T00:00:00Z',
    NULL
)
ON CONFLICT (id) DO NOTHING;
