/*
  # Create Dashboard Schema for Good Homestory Admin Panel

  1. New Tables
    - `projects`
      - Core project management table
      - Tracks all interior design projects
      - Includes client info, stage, budget, timeline
    
    - `leads`
      - Lead and CRM management
      - Tracks potential customers through sales funnel
      - Includes lead scoring and source tracking
    
    - `meetings`
      - Meeting records with transcription capability
      - Stores meeting details, participants, transcripts
      - Links to AI-generated tasks and summaries
    
    - `tasks`
      - Task management for projects
      - Can be auto-generated from meetings or manual
      - Assignable to team members with due dates
    
    - `team_members`
      - Staff and team management
      - Includes roles and contact information
    
    - `customer_updates`
      - Communication log with customers
      - Tracks all automated and manual messages
      - Multi-channel delivery tracking
    
    - `voice_calls`
      - Voice agent call logs
      - Stores call recordings, transcripts, outcomes
      - Links to leads when applicable
    
    - `project_files`
      - File storage metadata for projects
      - Images, documents, designs
    
    - `notes`
      - Notes for leads, projects, meetings
      - Timestamped and author-tracked

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated admin users
*/

-- Team Members table
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  role text NOT NULL DEFAULT 'team_member',
  avatar_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  client_name text NOT NULL,
  client_phone text,
  client_email text,
  project_type text NOT NULL,
  bhk text,
  location text,
  area_sqft integer,
  budget_min integer,
  budget_max integer,
  style_preference text,
  stage text NOT NULL DEFAULT 'requirements',
  status text NOT NULL DEFAULT 'on_track',
  progress integer DEFAULT 0,
  owner_id uuid REFERENCES team_members(id),
  start_date date,
  design_date date,
  execution_date date,
  handover_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  property_type text,
  bhk text,
  location text,
  budget_min integer,
  budget_max integer,
  timeline text,
  style_preference text,
  source text NOT NULL DEFAULT 'website',
  stage text NOT NULL DEFAULT 'new',
  score integer DEFAULT 0,
  assigned_to uuid REFERENCES team_members(id),
  last_contact timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Meetings table
CREATE TABLE IF NOT EXISTS meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  client_name text NOT NULL,
  client_phone text,
  meeting_type text NOT NULL DEFAULT 'consultation',
  status text NOT NULL DEFAULT 'scheduled',
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer,
  transcript text,
  audio_url text,
  ai_summary text,
  requirements jsonb,
  decisions jsonb,
  follow_ups jsonb,
  project_id uuid REFERENCES projects(id),
  lead_id uuid REFERENCES leads(id),
  created_by uuid REFERENCES team_members(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  assignee_id uuid REFERENCES team_members(id),
  due_date date,
  priority text DEFAULT 'medium',
  status text NOT NULL DEFAULT 'pending',
  project_id uuid REFERENCES projects(id),
  meeting_id uuid REFERENCES meetings(id),
  created_by uuid REFERENCES team_members(id),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Customer Updates table
CREATE TABLE IF NOT EXISTS customer_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) NOT NULL,
  update_type text NOT NULL DEFAULT 'custom',
  message text NOT NULL,
  channels text[] DEFAULT ARRAY['whatsapp'],
  status text NOT NULL DEFAULT 'scheduled',
  scheduled_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  attachments jsonb,
  sent_by uuid REFERENCES team_members(id),
  created_at timestamptz DEFAULT now()
);

-- Voice Calls table
CREATE TABLE IF NOT EXISTS voice_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL,
  duration_seconds integer,
  transcript text,
  audio_url text,
  summary text,
  outcomes text[],
  lead_id uuid REFERENCES leads(id),
  created_at timestamptz DEFAULT now()
);

-- Project Files table
CREATE TABLE IF NOT EXISTS project_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  file_size integer,
  category text DEFAULT 'other',
  uploaded_by uuid REFERENCES team_members(id),
  created_at timestamptz DEFAULT now()
);

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  project_id uuid REFERENCES projects(id),
  lead_id uuid REFERENCES leads(id),
  meeting_id uuid REFERENCES meetings(id),
  author_id uuid REFERENCES team_members(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for authenticated users (admin dashboard access)
CREATE POLICY "Authenticated users can view all team members"
  ON team_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage projects"
  ON projects FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage leads"
  ON leads FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage meetings"
  ON meetings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage tasks"
  ON tasks FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view updates"
  ON customer_updates FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view calls"
  ON voice_calls FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage files"
  ON project_files FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage notes"
  ON notes FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_stage ON projects(stage);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
CREATE INDEX IF NOT EXISTS idx_meetings_scheduled ON meetings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);