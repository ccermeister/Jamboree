-- ============================================================================
-- BSP Agusan Council – Jamboree Management System (Single Jamboree Schema)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Roles & User Profiles
CREATE TYPE public.user_role AS ENUM (
  'System Administrator',
  'Registration Personnel',
  'Collection Personnel',
  'Cash Custodian',
  'Finance Admin'
);

CREATE TYPE public.jamboree_status AS ENUM ('Draft', 'Active', 'Closed', 'Archived');
CREATE TYPE public.scout_category AS ENUM ('Kid Scouts', 'Kab Scouts', 'Boy Scouts', 'Senior Scouts', 'Rover Scouts', 'Unit Leader');
CREATE TYPE public.ca_status AS ENUM ('Draft', 'Pending', 'Approved', 'Rejected', 'Released', 'Partially Liquidated', 'Fully Liquidated', 'Overdue', 'Canceled');

CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role public.user_role NOT NULL DEFAULT 'Registration Personnel',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Single Jamboree Configuration
CREATE TABLE public.jamboree_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  jamboree_name TEXT NOT NULL,
  description TEXT,
  venue TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status public.jamboree_status NOT NULL DEFAULT 'Active',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Configurable Registration Fee Rates
CREATE TABLE public.fee_rates (
  category public.scout_category PRIMARY KEY,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Registration Groups & Participants (with Fee Snapshot)
CREATE TABLE public.registration_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_ref_no TEXT UNIQUE NOT NULL,
  division TEXT NOT NULL,
  district TEXT NOT NULL,
  school TEXT NOT NULL,
  registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
  registered_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE SEQUENCE public.participant_id_seq START 1;

CREATE TABLE public.participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_code TEXT UNIQUE NOT NULL DEFAULT ('BSP-AG-' || LPAD(nextval('public.participant_id_seq')::TEXT, 4, '0')),
  group_id UUID NOT NULL REFERENCES public.registration_groups(id) ON DELETE RESTRICT,
  full_name TEXT NOT NULL,
  sex TEXT NOT NULL CHECK (sex IN ('Male', 'Female')),
  date_of_birth DATE NOT NULL,
  category public.scout_category NOT NULL,
  fee_snapshot NUMERIC(12,2) NOT NULL CHECK (fee_snapshot >= 0),
  registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_participants_name_dob ON public.participants (LOWER(full_name), date_of_birth);
CREATE INDEX idx_participants_group ON public.participants (group_id);

-- 5. Global Atomic Cash Receipt Voucher (CRV) Sequence & Register
CREATE SEQUENCE public.global_crv_seq START 1 INCREMENT 1 NO CYCLE;

CREATE TABLE public.crv_vouchers (
  crv_serial TEXT PRIMARY KEY,
  transaction_type TEXT NOT NULL,
  issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
  received_from_or_payee TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL,
  reference_number TEXT,
  description TEXT NOT NULL,
  issued_by UUID REFERENCES public.user_profiles(id),
  is_voided BOOLEAN NOT NULL DEFAULT FALSE,
  void_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.generate_crv_voucher(
  p_type TEXT,
  p_party TEXT,
  p_amount NUMERIC,
  p_method TEXT,
  p_ref TEXT,
  p_desc TEXT
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_seq BIGINT;
  v_serial TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM public.jamboree_settings WHERE id = 1 AND status = 'Archived') THEN
    RAISE EXCEPTION 'Jamboree is Archived; new financial vouchers are locked.';
  END IF;

  v_seq := nextval('public.global_crv_seq');
  v_serial := 'CRV-' || LPAD(v_seq::TEXT, 4, '0');

  INSERT INTO public.crv_vouchers (
    crv_serial, transaction_type, received_from_or_payee, amount,
    payment_method, reference_number, description, issued_by
  ) VALUES (
    v_serial, p_type, p_party, p_amount,
    p_method, p_ref, p_desc, auth.uid()
  );

  RETURN v_serial;
END;
$$;

-- 6. Registration Payments
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE RESTRICT,
  crv_serial TEXT UNIQUE NOT NULL REFERENCES public.crv_vouchers(crv_serial),
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL,
  reference_number TEXT,
  proof_url TEXT,
  remarks TEXT,
  recorded_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Donations
CREATE TABLE public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_name TEXT NOT NULL,
  donation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL,
  reference_number TEXT,
  purpose TEXT NOT NULL,
  crv_serial TEXT UNIQUE REFERENCES public.crv_vouchers(crv_serial),
  proof_url TEXT,
  remarks TEXT,
  recorded_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Tokens & Issuance
CREATE TABLE public.token_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  total_quantity INTEGER NOT NULL CHECK (total_quantity >= 0),
  eligible_categories public.scout_category[] NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.token_issuances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_category_id UUID NOT NULL REFERENCES public.token_categories(id),
  participant_id UUID NOT NULL REFERENCES public.participants(id),
  quantity_issued INTEGER NOT NULL DEFAULT 1 CHECK (quantity_issued > 0),
  issuance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  issued_by UUID REFERENCES public.user_profiles(id),
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Cash Accounts, Cash Advances & Liquidations
CREATE TABLE public.cash_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL,
  current_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.cash_advances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.user_profiles(id),
  requested_amount NUMERIC(12,2) NOT NULL CHECK (requested_amount > 0),
  purpose TEXT NOT NULL,
  date_needed DATE NOT NULL,
  expense_category TEXT NOT NULL,
  status public.ca_status NOT NULL DEFAULT 'Pending',
  reviewed_by UUID REFERENCES public.user_profiles(id),
  released_by UUID REFERENCES public.user_profiles(id),
  crv_serial TEXT UNIQUE REFERENCES public.crv_vouchers(crv_serial),
  cash_account_id UUID REFERENCES public.cash_accounts(id),
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT no_self_approval CHECK (reviewed_by IS NULL OR reviewed_by <> requester_id)
);

CREATE TABLE public.liquidations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cash_advance_id UUID NOT NULL REFERENCES public.cash_advances(id),
  crv_serial TEXT NOT NULL REFERENCES public.crv_vouchers(crv_serial),
  liquidation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'Submitted',
  cash_returned NUMERIC(12,2) NOT NULL DEFAULT 0,
  return_crv_serial TEXT REFERENCES public.crv_vouchers(crv_serial),
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.liquidation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liquidation_id UUID NOT NULL REFERENCES public.liquidations(id) ON DELETE CASCADE,
  expense_date DATE NOT NULL,
  expense_category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  receipt_url TEXT,
  review_status TEXT NOT NULL DEFAULT 'Pending' CHECK (review_status IN ('Pending', 'Accepted', 'Rejected')),
  review_remarks TEXT,
  reviewed_by UUID REFERENCES public.user_profiles(id)
);

-- 10. Immutable Audit Log
CREATE TABLE public.audit_logs (
  id BIGSERIAL PRIMARY KEY,
  actor_id UUID REFERENCES public.user_profiles(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
