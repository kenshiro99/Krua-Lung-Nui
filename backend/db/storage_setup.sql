-- ============================================================================
-- Supabase Storage Bucket Setup for ครัวลุงหนุ่ย (Krua Lung Nui)
-- Bucket Name: krua-lung-nui-assets (Public)
-- Project: myajcbynabcwfmlvqpwv
-- ============================================================================

-- 1. Create the Storage Bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'krua-lung-nui-assets',
  'krua-lung-nui-assets',
  TRUE,
  10485760, -- 10MB per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE 
SET public = TRUE,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 2. Drop existing policies if any to prevent conflicts
DROP POLICY IF EXISTS "Public can view krua assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow upload to krua assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow manage krua assets" ON storage.objects;

-- 3. Policy for Public Read Access (ทุกคนดูภาพได้โดยไม่ต้อง Login)
CREATE POLICY "Public can view krua assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'krua-lung-nui-assets');

-- 4. Policy for Upload Access (อนุญาตให้อัปโหลดภาพขึ้น Bucket)
CREATE POLICY "Allow upload to krua assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'krua-lung-nui-assets');

-- 5. Policy for Full Management (Admin/Service Role จัดการแก้ไข/ลบภาพได้)
CREATE POLICY "Allow manage krua assets"
ON storage.objects FOR ALL
USING (bucket_id = 'krua-lung-nui-assets');
