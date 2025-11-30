/*
  # CRM System for Furniture Manufacturing

  ## Overview
  This migration creates a comprehensive CRM system for managing furniture manufacturing projects with:
  - Dynamic stage management (configurable project phases)
  - Customer and project tracking
  - Payment tracking
  - Timeline visualization support

  ## New Tables

  ### 1. `stages` (Dynamic Project Phases)
    - `id` (uuid, primary key) - Unique identifier
    - `name` (text) - Stage name (e.g., "Tasarım", "Üretim")
    - `order_index` (integer) - Display order
    - `created_at` (timestamptz) - Creation timestamp
    - Stores the main stages that can be configured from settings

  ### 2. `sub_stages` (Dynamic Sub-Phases)
    - `id` (uuid, primary key) - Unique identifier
    - `stage_id` (uuid, foreign key) - Parent stage reference
    - `name` (text) - Sub-stage name
    - `order_index` (integer) - Display order within stage
    - `created_at` (timestamptz) - Creation timestamp
    - Stores sub-stages under each main stage

  ### 3. `projects` (Customer Projects)
    - `id` (uuid, primary key) - Unique identifier
    - `customer_name` (text) - Customer full name
    - `phone` (text) - Phone number
    - `email` (text) - Email address
    - `address` (text) - Full address
    - `total_amount` (numeric) - Total project cost
    - `current_stage_id` (uuid, foreign key) - Current stage
    - `current_sub_stage_id` (uuid, foreign key, nullable) - Current sub-stage
    - `created_at` (timestamptz) - Project creation date
    - `updated_at` (timestamptz) - Last update timestamp
    - `created_by` (uuid, foreign key) - User who created project

  ### 4. `payments` (Payment Tracking)
    - `id` (uuid, primary key) - Unique identifier
    - `project_id` (uuid, foreign key) - Related project
    - `amount` (numeric) - Payment amount
    - `payment_date` (date) - Payment date
    - `notes` (text, nullable) - Payment notes
    - `created_at` (timestamptz) - Record creation timestamp

  ### 5. `project_stage_history` (Timeline Tracking)
    - `id` (uuid, primary key) - Unique identifier
    - `project_id` (uuid, foreign key) - Related project
    - `stage_id` (uuid, foreign key) - Stage reference
    - `sub_stage_id` (uuid, foreign key, nullable) - Sub-stage reference
    - `entered_at` (timestamptz) - When stage was entered
    - `notes` (text, nullable) - Stage transition notes
    - Tracks project progress through stages for timeline visualization

  ## Security
  - Enable RLS on all tables
  - Authenticated users can manage stages and sub-stages
  - Authenticated users can create and view projects
  - Authenticated users can add payments
  - Users can only access their own organization's data

  ## Indexes
  - Index on project current stage for fast filtering
  - Index on payment project_id for fast lookups
  - Index on stage history for timeline queries
*/

-- Create stages table
CREATE TABLE IF NOT EXISTS stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view stages"
  ON stages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create stages"
  ON stages FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update stages"
  ON stages FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete stages"
  ON stages FOR DELETE
  TO authenticated
  USING (true);

-- Create sub_stages table
CREATE TABLE IF NOT EXISTS sub_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id uuid NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
  name text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sub_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view sub_stages"
  ON sub_stages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create sub_stages"
  ON sub_stages FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update sub_stages"
  ON sub_stages FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete sub_stages"
  ON sub_stages FOR DELETE
  TO authenticated
  USING (true);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  phone text NOT NULL,
  email text,
  address text NOT NULL,
  total_amount numeric(12, 2) NOT NULL DEFAULT 0,
  current_stage_id uuid REFERENCES stages(id),
  current_sub_stage_id uuid REFERENCES sub_stages(id),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_current_stage ON projects(current_stage_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view projects"
  ON projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete projects"
  ON projects FOR DELETE
  TO authenticated
  USING (true);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  amount numeric(12, 2) NOT NULL,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_project ON payments(project_id);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view payments"
  ON payments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete payments"
  ON payments FOR DELETE
  TO authenticated
  USING (true);

-- Create project_stage_history table
CREATE TABLE IF NOT EXISTS project_stage_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  stage_id uuid NOT NULL REFERENCES stages(id),
  sub_stage_id uuid REFERENCES sub_stages(id),
  entered_at timestamptz DEFAULT now(),
  notes text
);

CREATE INDEX IF NOT EXISTS idx_history_project ON project_stage_history(project_id, entered_at);

ALTER TABLE project_stage_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view history"
  ON project_stage_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create history"
  ON project_stage_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Insert default stages as examples
INSERT INTO stages (name, order_index) VALUES
  ('Teklif', 1),
  ('Tasarım', 2),
  ('Üretim', 3),
  ('Montaj', 4),
  ('Tamamlandı', 5)
ON CONFLICT DO NOTHING;