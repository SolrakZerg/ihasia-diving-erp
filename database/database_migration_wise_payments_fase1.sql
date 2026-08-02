-- Migration script to create the 'wise_payments' table in Supabase (Fase 1)
-- Project: Diving ERP

CREATE TABLE IF NOT EXISTS public.wise_payments (
  id text NOT NULL, -- ID de transferencia de Wise (ej: #2260152076)
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  sender_name text NOT NULL,
  amount_raw numeric NOT NULL,
  currency text NOT NULL, -- Divisa original (THB, EUR, GBP, USD, etc.)
  amount_eur numeric NOT NULL, -- Equivalente aproximado en EUR para balances
  num_people integer NOT NULL DEFAULT 1, -- Estimación de pax basada en el importe y divisa
  reference text,
  is_processed boolean NOT NULL DEFAULT false, -- Control interno del ERP
  notes text,
  CONSTRAINT wise_payments_pkey PRIMARY KEY (id)
);

-- Enable Row Level Security
ALTER TABLE public.wise_payments ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon and authenticated roles (following ERP pattern)
CREATE POLICY "Allow all operations for anon and authenticated users on wise_payments"
ON public.wise_payments
FOR ALL
USING (true)
WITH CHECK (true);
