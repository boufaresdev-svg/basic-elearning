-- Create formations table in Supabase
-- Go to: https://supabase.com/dashboard/project/qggjjzrfquvxxfshhujb/editor
-- Click "SQL Editor" → "New query" → Paste this code → Run

CREATE TABLE IF NOT EXISTS formations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('thermo', 'automatisme', 'process')),
    description TEXT,
    objectives TEXT,
    level TEXT,
    image TEXT,
    contents JSONB DEFAULT '[]'::jsonb,
    access_key TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    total_duration INTEGER
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_formations_category ON formations(category);
CREATE INDEX IF NOT EXISTS idx_formations_created_at ON formations(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE formations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (for development)
-- ⚠️ FOR PRODUCTION: Create proper authentication policies!
CREATE POLICY "Enable all operations for formations" ON formations
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create storage bucket for formation files
-- This should be done via the Supabase Dashboard instead:
-- 1. Go to Storage
-- 2. Create new bucket named "formations"
-- 3. Make it public
-- 4. Set file size limits: 500MB for videos, 50MB for PDFs, 5MB for images
