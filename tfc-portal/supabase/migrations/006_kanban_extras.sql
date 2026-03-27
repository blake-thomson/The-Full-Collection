-- Add evergreen flag and last_seen tracking
ALTER TABLE kanban_cards ADD COLUMN IF NOT EXISTS is_evergreen boolean DEFAULT false;

-- Track last_seen for client health dashboard
ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

-- Index for client health queries
CREATE INDEX IF NOT EXISTS idx_clients_last_seen ON clients(last_seen_at);
CREATE INDEX IF NOT EXISTS idx_kanban_evergreen ON kanban_cards(is_evergreen) WHERE is_evergreen = true;
