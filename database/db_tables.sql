-- ################################################################################
-- DATABASE TABLES STRUCTURE BACKUP (Respaldo Literal Supabase Q3 2026)
-- Project: IHASIA ERP
-- Organization: public (API)
-- Extraído literalmente vía PostgreSQL information_schema & pg_policies
-- ################################################################################

-- ================================================================================
-- 1. activities
-- ================================================================================
CREATE TABLE public.activities (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    name text NOT NULL UNIQUE,
    price_thb numeric DEFAULT 0,
    price_eur numeric DEFAULT 0,
    tanks_weight numeric DEFAULT 0,
    category text,
    created_at timestamp with time zone DEFAULT now(),
    color text,
    ssi_cost_thb numeric DEFAULT 0,
    acronym text,
    duration_days numeric DEFAULT 0.5,
    tshirt_included boolean DEFAULT false,
    is_supplier_billable boolean DEFAULT false,
    is_commissionable boolean,
    is_ssi_active boolean DEFAULT false,
    widget_column integer,
    widget_order integer DEFAULT 0,
    payout_group text,
    ssi_order integer DEFAULT 0,
    ssi_parent_id uuid REFERENCES public.activities(id)
);
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON public.activities FOR ALL TO authenticated USING (auth.role() = 'authenticated'::text) WITH CHECK (auth.role() = 'authenticated'::text);

-- ================================================================================
-- 2. activity_categories
-- ================================================================================
CREATE TABLE public.activity_categories (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    name text NOT NULL UNIQUE,
    color text,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    is_commissionable boolean DEFAULT false,
    requires_staff boolean DEFAULT true
);
ALTER TABLE public.activity_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON public.activity_categories FOR ALL TO authenticated USING (auth.role() = 'authenticated'::text) WITH CHECK (auth.role() = 'authenticated'::text);

-- ================================================================================
-- 3. activity_logs
-- ================================================================================
CREATE TABLE public.activity_logs (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    date date DEFAULT CURRENT_DATE NOT NULL,
    staff_id uuid,
    customer_id uuid REFERENCES public.customers(id),
    activity_id uuid REFERENCES public.activities(id),
    tanks_used numeric DEFAULT 0,
    is_ssi_certified boolean DEFAULT false,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON public.activity_logs FOR ALL TO authenticated USING (auth.role() = 'authenticated'::text) WITH CHECK (auth.role() = 'authenticated'::text);

-- ================================================================================
-- 4. attendance
-- ================================================================================
CREATE TABLE public.attendance (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    date date DEFAULT CURRENT_DATE NOT NULL,
    staff_id uuid,
    shift text,
    type text,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON public.attendance FOR ALL TO authenticated USING (auth.role() = 'authenticated'::text) WITH CHECK (auth.role() = 'authenticated'::text);

-- ================================================================================
-- 5. bizums
-- ================================================================================
CREATE TABLE public.bizums (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    booking_date date NOT NULL,
    customer_name text NOT NULL,
    num_people integer DEFAULT 1 NOT NULL,
    activity text,
    bizum_phone text,
    whatsapp_phone text,
    is_paid boolean DEFAULT false NOT NULL,
    is_returned boolean DEFAULT false NOT NULL,
    notes text,
    is_retained boolean DEFAULT false,
    returned_people integer,
    is_settled boolean DEFAULT false,
    has_retention boolean DEFAULT false
);
ALTER TABLE public.bizums ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for anon and authenticated users on bizums" ON public.bizums FOR ALL TO public USING (true) WITH CHECK (true);

-- ================================================================================
-- 6. bote_expenses
-- ================================================================================
CREATE TABLE public.bote_expenses (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    date date NOT NULL,
    amount numeric NOT NULL,
    concept text NOT NULL,
    category text,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.bote_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON public.bote_expenses FOR ALL TO authenticated USING (auth.role() = 'authenticated'::text) WITH CHECK (auth.role() = 'authenticated'::text);

-- ================================================================================
-- 7. bote_monthly
-- ================================================================================
CREATE TABLE public.bote_monthly (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    year integer NOT NULL,
    month integer NOT NULL,
    initial_balance numeric DEFAULT 0,
    final_balance numeric DEFAULT 0,
    apartar_amount numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    pending_amount numeric DEFAULT 0,
    expenses_total numeric DEFAULT 0,
    apartar_real numeric,
    CONSTRAINT bote_monthly_year_month_key UNIQUE (year, month)
);
ALTER TABLE public.bote_monthly ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON public.bote_monthly FOR ALL TO authenticated USING (auth.role() = 'authenticated'::text) WITH CHECK (auth.role() = 'authenticated'::text);

-- ================================================================================
-- 8. business_entities
-- ================================================================================
CREATE TABLE public.business_entities (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    legal_name text,
    brand_name text,
    tax_id text,
    address_line1 text,
    address_line2 text,
    city text,
    province text,
    zip_code text,
    country text DEFAULT 'Thailand'::text,
    email text,
    phone text,
    website text,
    is_own_company boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    logo_url text,
    secondary_image_url text
);
ALTER TABLE public.business_entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON public.business_entities FOR ALL TO authenticated USING (auth.role() = 'authenticated'::text) WITH CHECK (auth.role() = 'authenticated'::text);

-- ================================================================================
-- 9. cash_control_monthly
-- ================================================================================
CREATE TABLE public.cash_control_monthly (
    year integer NOT NULL,
    month integer NOT NULL,
    b_50000 integer DEFAULT 0,
    b_1000 integer DEFAULT 0,
    b_500 integer DEFAULT 0,
    b_100 integer DEFAULT 0,
    b_50 integer DEFAULT 0,
    b_20 integer DEFAULT 0,
    PRIMARY KEY (year, month)
);
ALTER TABLE public.cash_control_monthly ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON public.cash_control_monthly FOR ALL TO authenticated USING (auth.role() = 'authenticated'::text) WITH CHECK (auth.role() = 'authenticated'::text);

-- ================================================================================
-- 10. customers
-- ================================================================================
CREATE TABLE public.customers (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    first_name text NOT NULL,
    email text,
    phone text,
    certification_level text,
    birth_date date,
    insurance_expiry date,
    created_at timestamp with time zone DEFAULT now(),
    last_name text,
    gender text,
    passport_number text,
    emergency_contact text,
    address text,
    lead_source text,
    total_dives text DEFAULT '0'::text,
    last_dive_date text,
    form_origin text,
    booked_activity text,
    booking_date date
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON public.customers FOR ALL TO authenticated USING (auth.role() = 'authenticated'::text) WITH CHECK (auth.role() = 'authenticated'::text);

-- ================================================================================
-- 11. daily_expenses
-- ================================================================================
CREATE TABLE public.daily_expenses (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    date date DEFAULT CURRENT_DATE,
    description text NOT NULL,
    amount numeric DEFAULT 0 NOT NULL,
    category text,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.daily_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON public.daily_expenses FOR ALL TO authenticated USING (auth.role() = 'authenticated'::text) WITH CHECK (auth.role() = 'authenticated'::text);

-- ================================================================================
-- 12. exchange_rates
-- ================================================================================
CREATE TABLE public.exchange_rates (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    from_currency text DEFAULT 'EUR'::text NOT NULL,
    to_currency text DEFAULT 'THB'::text NOT NULL,
    rate numeric NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON public.exchange_rates FOR ALL TO authenticated USING (auth.role() = 'authenticated'::text) WITH CHECK (auth.role() = 'authenticated'::text);

-- ================================================================================
-- 13. expense_categories
-- ================================================================================
CREATE TABLE public.expense_categories (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    name text NOT NULL UNIQUE,
    color text,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON public.expense_categories FOR ALL TO authenticated USING (auth.role() = 'authenticated'::text) WITH CHECK (auth.role() = 'authenticated'::text);

-- ================================================================================
-- 14. external_promoters
-- ================================================================================
CREATE TABLE public.external_promoters (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    phone text,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.external_promoters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON public.external_promoters FOR ALL TO authenticated USING (auth.role() = 'authenticated'::text) WITH CHECK (auth.role() = 'authenticated'::text);

-- ================================================================================
-- 15. fixed_expenses
-- ================================================================================
CREATE TABLE public.fixed_expenses (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    amount numeric DEFAULT 0,
    icon text,
    color text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.fixed_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON public.fixed_expenses FOR ALL TO authenticated USING (auth.role() = 'authenticated'::text) WITH CHECK (auth.role() = 'authenticated'::text);

-- ================================================================================
-- 16. instructor_payouts
-- ================================================================================
CREATE TABLE public.instructor_payouts (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    activity_id uuid REFERENCES public.activities(id) UNIQUE,
    concept_name text,
    amount_thb numeric DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.instructor_payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON public.instructor_payouts FOR ALL TO authenticated USING (auth.role() = 'authenticated'::text) WITH CHECK (auth.role() = 'authenticated'::text);

-- ================================================================================
-- 17. insurance_batch_items
-- ================================================================================
CREATE TABLE public.insurance_batch_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    batch_id uuid REFERENCES public.insurance_batches(id),
    customer_id uuid REFERENCES public.customers(id),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.insurance_batch_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON public.insurance_batch_items FOR ALL TO authenticated USING (auth.role() = 'authenticated'::text) WITH CHECK (auth.role() = 'authenticated'::text);

-- ================================================================================
-- 18. insurance_batches
-- ================================================================================
CREATE TABLE public.insurance_batches (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    total_pax integer NOT NULL,
    pdf_url text,
    recipients text NOT NULL,
    customer_list jsonb
);
ALTER TABLE public.insurance_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON public.insurance_batches FOR ALL TO authenticated USING (auth.role() = 'authenticated'::text) WITH CHECK (auth.role() = 'authenticated'::text);

-- ================================================================================
-- 19. insurance_config
-- ================================================================================
CREATE TABLE public.insurance_config (
    id integer NOT NULL PRIMARY KEY,
    pax_balance integer DEFAULT 0,
    target_emails text,
    duration_days integer DEFAULT 30,
    contract_title text DEFAULT 'EFF. 18/10/2024-2025 ( 200 Pax )'::text,
    updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.insurance_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON public.insurance_config FOR ALL TO authenticated USING (auth.role() = 'authenticated'::text) WITH CHECK (auth.role() = 'authenticated'::text);

-- ================================================================================
-- 20. invoice_items
-- ================================================================================
CREATE TABLE public.invoice_items (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    invoice_id uuid REFERENCES public.invoices(id),
    customer_id uuid REFERENCES public.customers(id),
    activity_id uuid REFERENCES public.activities(id),
    instructor_id uuid REFERENCES public.staff(id),
    date date DEFAULT CURRENT_DATE,
    quantity integer,
    unit_price_thb numeric DEFAULT 0,
    total_thb numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    status text DEFAULT 'Pending'::text,
    payment_method text,
    notes text,
    bizum_deposit_eur numeric DEFAULT 0,
    temporary_name text,
    is_comm boolean DEFAULT false,
    comm_recipient_id uuid,
    is_comm_paid boolean DEFAULT false,
    is_prov_paid boolean DEFAULT false,
    is_ssi_paid boolean DEFAULT false,
    comm_amount_thb numeric
);
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all actions for authenticated users" ON public.invoice_items FOR ALL TO public USING (auth.role() = 'authenticated'::text) WITH CHECK (auth.role() = 'authenticated'::text);

-- ================================================================================
-- 21. invoices
-- ================================================================================
CREATE TABLE public.invoices (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    customer_id uuid REFERENCES public.customers(id),
    total_thb numeric DEFAULT 0,
    total_eur numeric DEFAULT 0,
    exchange_rate numeric,
    payment_method text,
    status text DEFAULT 'Paid'::text,
    created_at timestamp with time zone DEFAULT now(),
    bizum_deposit_eur numeric DEFAULT 0,
    notes text
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON public.invoices FOR ALL TO authenticated USING (auth.role() = 'authenticated'::text) WITH CHECK (auth.role() = 'authenticated'::text);

-- ================================================================================
-- 22. monthly_activity_logs
-- ================================================================================
CREATE TABLE public.monthly_activity_logs (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    year integer NOT NULL,
    month integer NOT NULL,
    activity_id uuid REFERENCES public.activities(id),
    count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT monthly_activity_logs_year_month_activity_id_key UNIQUE (year, month, activity_id)
);
ALTER TABLE public.monthly_activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON public.monthly_activity_logs FOR ALL TO authenticated USING (auth.role() = 'authenticated'::text) WITH CHECK (auth.role() = 'authenticated'::text);

-- ================================================================================
-- 23. monthly_activity_summary (VIEW)
-- ================================================================================
CREATE OR REPLACE VIEW public.monthly_activity_summary AS
SELECT 
    l.year,
    l.month,
    COALESCE(sum(CASE WHEN (a.widget_column = 1) THEN l.count ELSE 0 END), (0)::numeric) AS total_courses,
    COALESCE(sum(CASE WHEN (a.widget_column = 2) THEN ((l.count)::numeric * COALESCE(a.tanks_weight, (0)::numeric)) ELSE (0)::numeric END), (0)::numeric) AS total_tanks,
    COALESCE(sum(CASE WHEN (a.widget_column = 3) THEN l.count ELSE 0 END), (0)::numeric) AS total_spec,
    max(l.updated_at) AS last_updated
FROM (public.monthly_activity_logs l
  JOIN public.activities a ON ((l.activity_id = a.id)))
GROUP BY l.year, l.month;

-- ================================================================================
-- 24. monthly_expenses
-- ================================================================================
CREATE TABLE public.monthly_expenses (
    year integer NOT NULL,
    month integer NOT NULL,
    total_expenses numeric DEFAULT 0,
    comm_paid numeric DEFAULT 0,
    comm_pending numeric DEFAULT 0,
    snorkel_paid numeric DEFAULT 0,
    snorkel_pending numeric DEFAULT 0,
    grand_total_expenses numeric DEFAULT 0,
    grand_total_pending numeric DEFAULT 0,
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (year, month)
);
ALTER TABLE public.monthly_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON public.monthly_expenses FOR ALL TO authenticated USING (auth.role() = 'authenticated'::text) WITH CHECK (auth.role() = 'authenticated'::text);

-- ================================================================================
-- 25. monthly_reports
-- ================================================================================
CREATE TABLE public.monthly_reports (
    year integer NOT NULL,
    month integer NOT NULL,
    facturado numeric DEFAULT 0,
    pendiente numeric DEFAULT 0,
    cobrado numeric DEFAULT 0,
    updated_at timestamp with time zone DEFAULT now(),
    total_courses integer DEFAULT 0,
    total_gastos numeric DEFAULT 0,
    sueldos_total numeric DEFAULT 0,
    sueldos_pendiente numeric DEFAULT 0,
    total_xpagar numeric DEFAULT 0,
    office_xpagar numeric,
    infinity_xpagar numeric,
    pae_xpagar numeric,
    polimigra_xpagar numeric,
    bote_xpagar numeric,
    PRIMARY KEY (year, month)
);
ALTER TABLE public.monthly_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON public.monthly_reports FOR ALL TO authenticated USING (auth.role() = 'authenticated'::text) WITH CHECK (auth.role() = 'authenticated'::text);

-- ================================================================================
-- 26. partner_adjustments
-- ================================================================================
CREATE TABLE public.partner_adjustments (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    year integer NOT NULL,
    month integer NOT NULL,
    day integer NOT NULL,
    partner_id text NOT NULL,
    concept text NOT NULL,
    amount numeric DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT partner_adjustments_year_month_day_partner_id_key UNIQUE (year, month, day, partner_id)
);
ALTER TABLE public.partner_adjustments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON public.partner_adjustments FOR ALL TO authenticated USING (auth.role() = 'authenticated'::text) WITH CHECK (auth.role() = 'authenticated'::text);

-- ================================================================================
-- 27. partner_advances
-- ================================================================================
CREATE TABLE public.partner_advances (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    year integer NOT NULL,
    month integer NOT NULL,
    partner_id text NOT NULL,
    concept text NOT NULL,
    amount numeric DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.partner_advances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON public.partner_advances FOR ALL TO authenticated USING (auth.role() = 'authenticated'::text) WITH CHECK (auth.role() = 'authenticated'::text);

-- ================================================================================
-- 28. partner_cash_payments
-- ================================================================================
CREATE TABLE public.partner_cash_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    year integer NOT NULL,
    month integer NOT NULL,
    partner_id text NOT NULL,
    amount numeric DEFAULT 0 NOT NULL,
    concept text,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.partner_cash_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON public.partner_cash_payments FOR ALL TO authenticated USING (auth.role() = 'authenticated'::text) WITH CHECK (auth.role() = 'authenticated'::text);

-- ================================================================================
-- 29. partner_daily_activity
-- ================================================================================
CREATE TABLE public.partner_daily_activity (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    year integer NOT NULL,
    month integer NOT NULL,
    day integer NOT NULL,
    partner_id text NOT NULL,
    OWE numeric DEFAULT 0,
    AA numeric DEFAULT 0,
    DSD numeric DEFAULT 0,
    FUN numeric DEFAULT 0,
    ASSISTS numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT partner_daily_activity_year_month_day_partner_id_key UNIQUE (year, month, day, partner_id)
);
ALTER TABLE public.partner_daily_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON public.partner_daily_activity FOR ALL TO authenticated USING (auth.role() = 'authenticated'::text) WITH CHECK (auth.role() = 'authenticated'::text);

-- ================================================================================
-- 30. partner_daily_log
-- ================================================================================
CREATE TABLE public.partner_daily_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    date date NOT NULL UNIQUE,
    partner_id text NOT NULL,
    OWE numeric DEFAULT 0,
    AA numeric DEFAULT 0,
    DSD numeric DEFAULT 0,
    FUN numeric DEFAULT 0,
    assists numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.partner_daily_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON public.partner_daily_log FOR ALL TO authenticated USING (auth.role() = 'authenticated'::text) WITH CHECK (auth.role() = 'authenticated'::text);

-- ================================================================================
-- 31. partner_settlements
-- ================================================================================
CREATE TABLE public.partner_settlements (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    year integer NOT NULL,
    month integer NOT NULL,
    partner_id text REFERENCES public.staff(initials) NOT NULL,
    owe_count numeric DEFAULT 0,
    aa_count numeric DEFAULT 0,
    dsd_count numeric DEFAULT 0,
    fun_count numeric DEFAULT 0,
    total_courses_count numeric DEFAULT 0,
    assists_count numeric DEFAULT 0,
    assists_amount numeric DEFAULT 0,
    adjustments_amount numeric DEFAULT 0,
    total_earned numeric DEFAULT 0,
    advances_amount numeric DEFAULT 0,
    cash_paid numeric DEFAULT 0,
    final_balance numeric DEFAULT 0,
    status text DEFAULT 'PENDING'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT partner_settlements_year_month_partner_id_key UNIQUE (year, month, partner_id)
);
ALTER TABLE public.partner_settlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON public.partner_settlements FOR ALL TO authenticated USING (auth.role() = 'authenticated'::text) WITH CHECK (auth.role() = 'authenticated'::text);

-- ================================================================================
-- 32. ssi_monthly_breakdown
-- ================================================================================
CREATE TABLE public.ssi_monthly_breakdown (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    year integer NOT NULL,
    month integer NOT NULL,
    activity_id uuid REFERENCES public.activities(id) NOT NULL,
    system_quantity integer DEFAULT 0 NOT NULL,
    manual_quantity integer DEFAULT 0 NOT NULL,
    total_quantity integer DEFAULT 0 NOT NULL,
    unit_cost numeric DEFAULT 0 NOT NULL,
    total_fila numeric DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT ssi_monthly_breakdown_year_month_activity_id_key UNIQUE (year, month, activity_id)
);
ALTER TABLE public.ssi_monthly_breakdown ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo a usuarios autenticados" ON public.ssi_monthly_breakdown FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ================================================================================
-- 33. staff
-- ================================================================================
CREATE TABLE public.staff (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    first_name text NOT NULL,
    last_name text NOT NULL,
    role text NOT NULL,
    color text,
    initials text UNIQUE,
    created_at timestamp with time zone DEFAULT now(),
    status text DEFAULT 'Active'::text,
    email text
);
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON public.staff FOR ALL TO authenticated USING (auth.role() = 'authenticated'::text) WITH CHECK (auth.role() = 'authenticated'::text);

-- ================================================================================
-- 34. staff_adjustments
-- ================================================================================
CREATE TABLE public.staff_adjustments (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    year integer NOT NULL,
    month integer NOT NULL,
    day integer NOT NULL,
    staff_id uuid NOT NULL,
    concept text NOT NULL,
    amount numeric DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT staff_adjustments_year_month_day_staff_id_key UNIQUE (year, month, day, staff_id)
);
ALTER TABLE public.staff_adjustments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON public.staff_adjustments FOR ALL TO authenticated USING (auth.role() = 'authenticated'::text) WITH CHECK (auth.role() = 'authenticated'::text);

-- ================================================================================
-- 35. staff_advances
-- ================================================================================
CREATE TABLE public.staff_advances (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    year integer NOT NULL,
    month integer NOT NULL,
    staff_id uuid NOT NULL,
    concept text NOT NULL,
    amount numeric DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.staff_advances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON public.staff_advances FOR ALL TO authenticated USING (auth.role() = 'authenticated'::text) WITH CHECK (auth.role() = 'authenticated'::text);

-- ================================================================================
-- 36. staff_daily_activity
-- ================================================================================
CREATE TABLE public.staff_daily_activity (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    year integer NOT NULL,
    month integer NOT NULL,
    day integer NOT NULL,
    staff_id uuid NOT NULL,
    assists integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT staff_daily_activity_year_month_day_staff_id_key UNIQUE (year, month, day, staff_id)
);
ALTER TABLE public.staff_daily_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON public.staff_daily_activity FOR ALL TO authenticated USING (auth.role() = 'authenticated'::text) WITH CHECK (auth.role() = 'authenticated'::text);

-- ================================================================================
-- 37. staff_settlements
-- ================================================================================
CREATE TABLE public.staff_settlements (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    staff_id uuid REFERENCES public.staff(id) NOT NULL,
    year integer NOT NULL,
    month integer NOT NULL,
    total_commissions numeric DEFAULT 0 NOT NULL,
    total_advances numeric DEFAULT 0 NOT NULL,
    total_bonus numeric DEFAULT 0 NOT NULL,
    total_payout numeric DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    assists_count integer DEFAULT 0,
    CONSTRAINT staff_settlements_year_month_staff_id_key UNIQUE (year, month, staff_id)
);
ALTER TABLE public.staff_settlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON public.staff_settlements FOR ALL TO authenticated USING (auth.role() = 'authenticated'::text) WITH CHECK (auth.role() = 'authenticated'::text);

-- ================================================================================
-- 38. supplier_settlements
-- ================================================================================
CREATE TABLE public.supplier_settlements (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    supplier_name text NOT NULL,
    year integer NOT NULL,
    month integer NOT NULL,
    total_amount numeric DEFAULT 0 NOT NULL,
    paid_amount numeric DEFAULT 0 NOT NULL,
    pending_amount numeric DEFAULT 0 NOT NULL,
    mes_anterior numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT supplier_settlements_supplier_name_month_year_key UNIQUE (supplier_name, month, year)
);
ALTER TABLE public.supplier_settlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON public.supplier_settlements FOR ALL TO authenticated USING (auth.role() = 'authenticated'::text) WITH CHECK (auth.role() = 'authenticated'::text);

-- ================================================================================
-- 39. ui_config
-- ================================================================================
CREATE TABLE public.ui_config (
    id text DEFAULT 'global'::text NOT NULL PRIMARY KEY,
    active_partner_ids jsonb DEFAULT '["ALL"]'::jsonb,
    updated_at timestamp with time zone DEFAULT now(),
    active_staff_ids jsonb DEFAULT '["ALL"]'::jsonb
);
ALTER TABLE public.ui_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir lectura pública de ui_config" ON public.ui_config FOR SELECT TO public USING (true);
CREATE POLICY "Permitir actualización a usuarios autenticados" ON public.ui_config FOR UPDATE TO public USING (auth.role() = 'authenticated'::text);

-- ================================================================================
-- 40. wise_payments
-- ================================================================================
CREATE TABLE public.wise_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    transfer_id text NOT NULL UNIQUE,
    payment_date date NOT NULL,
    amount_thb numeric NOT NULL,
    sender_name text NOT NULL,
    reference text,
    matched_customer_id uuid REFERENCES public.customers(id),
    matched_invoice_item_id uuid REFERENCES public.invoice_items(id),
    created_at timestamp with time zone DEFAULT now(),
    is_settled boolean DEFAULT false
);
ALTER TABLE public.wise_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for anon and authenticated users on wise_p" ON public.wise_payments FOR ALL TO public USING (true) WITH CHECK (true);
