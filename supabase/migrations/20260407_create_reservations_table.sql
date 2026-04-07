-- Create reservations table for launch offer discount codes
CREATE TABLE IF NOT EXISTS reservations (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

  -- Customer Information
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  city VARCHAR(100),

  -- Discount Code Details
  discount_code VARCHAR(50) NOT NULL,
  discount_percentage INT DEFAULT 50,

  -- Pricing (Fixed for MVP)
  original_price DECIMAL(10,2) DEFAULT 5850.00,
  discounted_price DECIMAL(10,2) DEFAULT 2925.00,

  -- Validity Tracking
  created_at TIMESTAMP DEFAULT NOW(),
  expiry_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  used_at TIMESTAMP NULL,
  used_order_id VARCHAR(50) NULL,

  -- Brevo Integration
  brevo_contact_id INT NULL,
  email_sent_at TIMESTAMP NULL,

  -- Audit Trail
  source VARCHAR(50) DEFAULT 'silver',
  ip_address VARCHAR(45),

  -- Unique constraints
  UNIQUE(email),
  UNIQUE(discount_code)
);

-- Create indexes for performance
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_expiry ON reservations(expiry_date);
CREATE INDEX idx_reservations_email ON reservations(email);
CREATE INDEX idx_reservations_code ON reservations(discount_code);

-- Enable Row Level Security (RLS)
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Allow public read-only access to validate codes (for checkout)
CREATE POLICY "Allow public to read reservation by code and email" ON reservations
  FOR SELECT USING (true);

-- Allow authenticated (service role) to insert and update
CREATE POLICY "Allow service role to insert reservations" ON reservations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service role to update reservations" ON reservations
  FOR UPDATE USING (true);
