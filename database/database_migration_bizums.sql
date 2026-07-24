-- Migration script to create the 'bizums' table in Supabase
-- Project: Diving ERP

CREATE TABLE IF NOT EXISTS public.bizums (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  booking_date date NOT NULL,
  customer_name text NOT NULL,
  num_people integer NOT NULL DEFAULT 1,
  activity text,
  bizum_phone text,
  whatsapp_phone text,
  is_paid boolean NOT NULL DEFAULT false,
  is_returned boolean NOT NULL DEFAULT false,
  notes text,
  CONSTRAINT bizums_pkey PRIMARY KEY (id)
);

-- Enable RLS (Row Level Security) if needed or grant access to authenticated & anon roles
ALTER TABLE public.bizums ENABLE ROW LEVEL SECURITY;

-- Allow read/write access for anon/authenticated roles (matching existing erp pattern)
CREATE POLICY "Allow all operations for anon and authenticated users on bizums"
ON public.bizums
FOR ALL
USING (true)
WITH CHECK (true);
