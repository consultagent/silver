-- Create reservations table for Silver Butterfly Brooch preorder form

CREATE TABLE IF NOT EXISTS public.reservations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  city text,
  discount_code text NOT NULL UNIQUE,
  expiry_date date NOT NULL,
  source text DEFAULT 'silver',
  ip_address text,
  email_sent_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add unique constraint on email
ALTER TABLE public.reservations ADD CONSTRAINT unique_email UNIQUE (email);

-- Enable RLS
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Allow public insert for form submissions
CREATE POLICY "Allow public insert" ON public.reservations
  FOR INSERT WITH CHECK (true);

-- Allow public select
CREATE POLICY "Allow public select" ON public.reservations
  FOR SELECT USING (true);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_reservations_email ON public.reservations(email);
CREATE INDEX IF NOT EXISTS idx_reservations_discount_code ON public.reservations(discount_code);
CREATE INDEX IF NOT EXISTS idx_reservations_created_at ON public.reservations(created_at DESC);

-- Verify table was created
SELECT 'Reservations table created successfully!' as status;
