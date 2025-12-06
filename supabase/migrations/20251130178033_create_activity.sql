-- 1. Aktivite Tablosunu Oluştur
CREATE TABLE IF NOT EXISTS public.project_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  activity_type text NOT NULL, -- 'create', 'delete', 'update', 'payment', 'file', 'comment'
  title text NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb, -- Tutar, dosya adı vb. detaylar
  created_at timestamptz DEFAULT now()
);

-- RLS Ayarları
ALTER TABLE public.project_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view activities" ON public.project_activities FOR SELECT USING (true);
CREATE POLICY "Users can insert activities" ON public.project_activities FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. ESKİ VERİLERİ MİGRE ET (BACKFILL)
-- Projeler
INSERT INTO project_activities (project_id, user_id, activity_type, title, description, created_at)
SELECT id, created_by, 'create', 'Proje Oluşturuldu', 'Proje sisteme kaydedildi.', created_at FROM projects;

-- Yorumlar
INSERT INTO project_activities (project_id, user_id, activity_type, title, description, created_at)
SELECT d.project_id, c.user_id, 'comment', 'Yorum Yapıldı', c.content, c.created_at 
FROM sub_stage_comments c
JOIN sub_stage_details d ON c.detail_id = d.id;

-- Dosyalar
INSERT INTO project_activities (project_id, user_id, activity_type, title, description, created_at)
SELECT d.project_id, f.user_id, 'file', 'Dosya Yüklendi', f.file_name, f.created_at 
FROM sub_stage_files f
JOIN sub_stage_details d ON f.detail_id = d.id;

-- Ödemeler
INSERT INTO project_activities (project_id, activity_type, title, description, metadata, created_at)
SELECT project_id, 'payment', 'Ödeme Alındı', payment_type || ' ile ödeme girişi yapıldı.', jsonb_build_object('amount', amount), created_at 
FROM payments;

-- Aşama Geçmişi
INSERT INTO project_activities (project_id, activity_type, title, description, created_at)
SELECT h.project_id, 'stage', 'Aşama Geçişi', s.name || ' aşamasına geçildi.', h.entered_at 
FROM project_stage_history h
JOIN stages s ON h.stage_id = s.id;