-- Tracking for catalogue distribution (website views, emailed links, manual sends)

CREATE TABLE IF NOT EXISTS public.catalogue_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  name text,
  token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  email_sent_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_catalogue_requests_email ON public.catalogue_requests(email);
CREATE INDEX IF NOT EXISTS idx_catalogue_requests_token ON public.catalogue_requests(token);

CREATE TABLE IF NOT EXISTS public.catalogue_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file text NOT NULL,
  source text NOT NULL DEFAULT 'website',
  token uuid,
  ip_address text,
  user_agent text,
  referrer text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_catalogue_events_token ON public.catalogue_events(token);
CREATE INDEX IF NOT EXISTS idx_catalogue_events_created_at ON public.catalogue_events(created_at DESC);

-- These tables hold email addresses and IP data, so unlike `reservations` they are
-- NOT opened up to the anon key. Only the service-role key (used server-side in
-- api/catalogue.js and api/send-catalogue.js) can read or write them.
ALTER TABLE public.catalogue_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalogue_events ENABLE ROW LEVEL SECURITY;

SELECT 'Catalogue tracking tables created successfully!' as status;
