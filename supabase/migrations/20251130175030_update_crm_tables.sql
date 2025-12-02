/*
  # 2. Aşama: Detaylı Proje Yönetimi Tabloları
  Bu kısım, alt aşamalar için yorum, dosya ve tamamlanma durumu gibi profesyonel detayları takip etmek için eklenmiştir.
*/

-- 6. sub_stage_details (Her alt aşama için proje bazlı detay ve durum takibi)
CREATE TABLE IF NOT EXISTS sub_stage_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  stage_id uuid NOT NULL REFERENCES stages(id),
  sub_stage_id uuid REFERENCES sub_stages(id),
  is_completed boolean NOT NULL DEFAULT FALSE,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (project_id, stage_id, sub_stage_id) -- Bir projede aynı alt aşama sadece bir kez detaylandırılır
);

ALTER TABLE sub_stage_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view sub_stage_details"
  ON sub_stage_details FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage sub_stage_details"
  ON sub_stage_details FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- 7. sub_stage_comments (Alt aşama detayları için yorumlar)
CREATE TABLE IF NOT EXISTS sub_stage_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  detail_id uuid NOT NULL REFERENCES sub_stage_details(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sub_stage_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view comments"
  ON sub_stage_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert comments"
  ON sub_stage_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete own comments"
  ON sub_stage_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- 8. sub_stage_files (Alt aşama detayları için dosya yüklemeleri)
CREATE TABLE IF NOT EXISTS sub_stage_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  detail_id uuid NOT NULL REFERENCES sub_stage_details(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  file_url text NOT NULL, -- Supabase Storage yolu
  file_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sub_stage_files_detail ON sub_stage_files(detail_id);

ALTER TABLE sub_stage_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view files"
  ON sub_stage_files FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert files"
  ON sub_stage_files FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete own files"
  ON sub_stage_files FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);