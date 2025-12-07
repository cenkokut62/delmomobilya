-- Giderler (Masraflar) Tablosu
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE, -- Proje bazlı giderler için
  category text NOT NULL, -- Malzeme, İşçilik, Nakliye, Yemek vb.
  amount numeric(12, 2) NOT NULL,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  description text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Indexler
CREATE INDEX IF NOT EXISTS idx_expenses_project ON expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);

-- RLS (Güvenlik) Politikaları
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view expenses"
  ON expenses FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert expenses"
  ON expenses FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update expenses"
  ON expenses FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete expenses"
  ON expenses FOR DELETE TO authenticated USING (true);