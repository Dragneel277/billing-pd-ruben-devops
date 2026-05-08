CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expenses (
  id          SERIAL PRIMARY KEY,
  user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  entity      VARCHAR(150),
  category    VARCHAR(50) NOT NULL DEFAULT 'other',
  amount      NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  status      VARCHAR(20) NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  due_date    DATE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS category VARCHAR(50) NOT NULL DEFAULT 'other';

ALTER TABLE expenses
DROP CONSTRAINT IF EXISTS expenses_status_check;

ALTER TABLE expenses
ALTER COLUMN status TYPE VARCHAR(20);

ALTER TABLE expenses
ADD CONSTRAINT expenses_status_check
CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled'));

CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(user_id, status);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(user_id, category);
CREATE INDEX IF NOT EXISTS idx_expenses_due_date ON expenses(user_id, due_date);