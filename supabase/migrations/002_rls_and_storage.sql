-- ============================================================================
-- Row Level Security (RLS), Role Helpers & Storage Policies
-- ============================================================================

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$;

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jamboree_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crv_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_issuances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liquidations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liquidation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Prevent self-escalation of roles
CREATE POLICY "Users can view own profile or Admin views all"
  ON public.user_profiles FOR SELECT
  USING (id = auth.uid() OR public.current_user_role() = 'System Administrator');

CREATE POLICY "Only System Admin manages user roles"
  ON public.user_profiles FOR UPDATE
  USING (public.current_user_role() = 'System Administrator')
  WITH CHECK (public.current_user_role() = 'System Administrator');

-- Jamboree Settings & Fee Rates
CREATE POLICY "Authenticated users read settings"
  ON public.jamboree_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only System Admin updates settings"
  ON public.jamboree_settings FOR ALL
  USING (public.current_user_role() = 'System Administrator');

CREATE POLICY "Authenticated users read rates"
  ON public.fee_rates FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only System Admin updates rates"
  ON public.fee_rates FOR ALL
  USING (public.current_user_role() = 'System Administrator');

-- Registration Policies
CREATE POLICY "Authenticated read registrations"
  ON public.participants FOR SELECT TO authenticated USING (true);

CREATE POLICY "Registration Personnel and Admin insert participants"
  ON public.participants FOR INSERT
  WITH CHECK (public.current_user_role() IN ('System Administrator', 'Registration Personnel'));

-- Payments & CRV Policies
CREATE POLICY "Authenticated read payments"
  ON public.payments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Collection Personnel and Admin record payments"
  ON public.payments FOR INSERT
  WITH CHECK (public.current_user_role() IN ('System Administrator', 'Collection Personnel'));

CREATE POLICY "Authenticated read CRVs"
  ON public.crv_vouchers FOR SELECT TO authenticated USING (true);

-- Cash Advance Policies (Enforcing No Self-Approval)
CREATE POLICY "Authenticated read cash advances"
  ON public.cash_advances FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authorized staff submit cash advances"
  ON public.cash_advances FOR INSERT
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Finance Admin approves non-self cash advances"
  ON public.cash_advances FOR UPDATE
  USING (
    public.current_user_role() IN ('Finance Admin', 'Cash Custodian', 'System Administrator')
  )
  WITH CHECK (
    reviewed_by IS NULL OR reviewed_by <> requester_id
  );

-- Audit Log Append-Only
CREATE POLICY "Authenticated insert audit logs"
  ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admin and Finance read audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.current_user_role() IN ('System Administrator', 'Finance Admin'));

-- Storage Bucket for Receipts & Supporting Documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('jamboree-receipts', 'jamboree-receipts', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated upload receipts"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'jamboree-receipts');

CREATE POLICY "Authenticated view receipts"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'jamboree-receipts');
