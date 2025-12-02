/*
  # 4. Aşama: Depolama ve Ayarlar Yapılandırması
*/

-- 1. Storage Bucket Oluşturma (Dosya Yükleme İçin)
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', true)
ON CONFLICT (id) DO NOTHING;

-- Logo için ayrı bir bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('app-assets', 'app-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Politikaları (Herkes görüntüleyebilir, giriş yapanlar yükleyebilir)
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id IN ('project-files', 'app-assets') );
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK ( auth.role() = 'authenticated' );
CREATE POLICY "Authenticated Delete" ON storage.objects FOR DELETE USING ( auth.role() = 'authenticated' );

-- 2. App Settings Tablosu (Logo ve Renkler İçin)
CREATE TABLE IF NOT EXISTS public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url text,
  light_primary_color text DEFAULT '#2563EB', -- Varsayılan Mavi
  dark_primary_color text DEFAULT '#60A5FA',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Settings viewable by everyone" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Settings editable by authenticated" ON public.app_settings FOR ALL USING (auth.role() = 'authenticated');

-- Varsayılan ayar satırını oluştur
INSERT INTO public.app_settings (logo_url) VALUES (null);