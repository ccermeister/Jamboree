BEGIN;

CREATE SEQUENCE IF NOT EXISTS public.registration_group_ref_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.cash_advance_ref_seq START 1;
GRANT USAGE, SELECT ON SEQUENCE public.registration_group_ref_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.cash_advance_ref_seq TO authenticated;

ALTER TABLE public.registration_groups
  ADD COLUMN IF NOT EXISTS bank_reference TEXT NOT NULL DEFAULT '';

ALTER TABLE public.participants
  ADD COLUMN IF NOT EXISTS age INTEGER;

UPDATE public.participants
SET age = DATE_PART('year', AGE(CURRENT_DATE, date_of_birth))::INTEGER
WHERE age IS NULL;

ALTER TABLE public.participants
  ALTER COLUMN age SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'participants_age_range_check'
      AND conrelid = 'public.participants'::regclass
  ) THEN
    ALTER TABLE public.participants
      ADD CONSTRAINT participants_age_range_check CHECK (age BETWEEN 0 AND 120);
  END IF;
END;
$$;

ALTER TABLE public.payments
  ALTER COLUMN crv_serial DROP NOT NULL;

ALTER TABLE public.cash_advances
  ADD COLUMN IF NOT EXISTS request_no TEXT,
  ADD COLUMN IF NOT EXISTS cash_returned NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS liquidated_on DATE;

UPDATE public.cash_advances
SET request_no = 'CA-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' ||
  LPAD(NEXTVAL('public.cash_advance_ref_seq')::TEXT, 3, '0')
WHERE request_no IS NULL;

ALTER TABLE public.cash_advances
  ALTER COLUMN request_no SET DEFAULT (
    'CA-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' ||
    LPAD(NEXTVAL('public.cash_advance_ref_seq')::TEXT, 3, '0')
  ),
  ALTER COLUMN request_no SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS cash_advances_request_no_key
  ON public.cash_advances (request_no);

SELECT SETVAL(
  'public.registration_group_ref_seq',
  COALESCE(MAX(SUBSTRING(group_ref_no FROM '^AGU-([0-9]+)$')::BIGINT), 0) + 1,
  FALSE
)
FROM public.registration_groups;

INSERT INTO public.jamboree_settings (
  id, jamboree_name, description, venue, start_date, end_date, status
)
VALUES (
  1,
  '2026 Agusan Council Joint Scouting Jamboree',
  'Scouts: Building Resilient & Green Communities',
  'Camp Doña Rosario, Bancasi, Butuan City',
  DATE '2026-11-20',
  DATE '2026-11-24',
  'Active'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.fee_rates (category, amount)
VALUES
  ('Kid Scouts', 450),
  ('Kab Scouts', 500),
  ('Boy Scouts', 600),
  ('Senior Scouts', 650),
  ('Rover Scouts', 700),
  ('Unit Leader', 550)
ON CONFLICT (category) DO NOTHING;

INSERT INTO public.cash_accounts (account_name, account_type, current_balance)
SELECT 'Council Petty Cash Vault', 'Cash on Hand', 0
WHERE NOT EXISTS (
  SELECT 1 FROM public.cash_accounts WHERE account_name = 'Council Petty Cash Vault'
);

INSERT INTO public.cash_accounts (account_name, account_type, current_balance)
SELECT 'LandBank Butuan – BSP Council Trust', 'Bank Account', 0
WHERE NOT EXISTS (
  SELECT 1 FROM public.cash_accounts WHERE account_name = 'LandBank Butuan – BSP Council Trust'
);

INSERT INTO public.cash_accounts (account_name, account_type, current_balance)
SELECT 'BSP Agusan Official GCash Merchant', 'E-Wallet', 0
WHERE NOT EXISTS (
  SELECT 1 FROM public.cash_accounts WHERE account_name = 'BSP Agusan Official GCash Merchant'
);

DROP POLICY IF EXISTS "Authenticated read registration groups" ON public.registration_groups;
CREATE POLICY "Authenticated read registration groups"
  ON public.registration_groups FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authorized staff submit cash advances" ON public.cash_advances;
CREATE POLICY "Authorized staff submit cash advances"
  ON public.cash_advances FOR INSERT TO authenticated
  WITH CHECK (
    requester_id = auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM public.jamboree_settings WHERE id = 1 AND status = 'Archived'
    )
  );

DROP POLICY IF EXISTS "Registration staff create registration groups" ON public.registration_groups;
CREATE POLICY "Registration staff create registration groups"
  ON public.registration_groups FOR INSERT TO authenticated
  WITH CHECK (
    registered_by = auth.uid()
    AND public.current_user_role() IN ('System Administrator', 'Registration Personnel')
  );

DROP POLICY IF EXISTS "Registration staff record payments" ON public.payments;
DROP POLICY IF EXISTS "Collection Personnel and Admin record payments" ON public.payments;
CREATE POLICY "Registration staff record payments"
  ON public.payments FOR INSERT TO authenticated
  WITH CHECK (
    recorded_by = auth.uid()
    AND public.current_user_role() IN (
      'System Administrator', 'Registration Personnel', 'Collection Personnel'
    )
  );

DROP POLICY IF EXISTS "Authenticated read donations" ON public.donations;
CREATE POLICY "Authenticated read donations"
  ON public.donations FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authorized staff create donations" ON public.donations;
CREATE POLICY "Authorized staff create donations"
  ON public.donations FOR INSERT TO authenticated
  WITH CHECK (
    recorded_by = auth.uid()
    AND public.current_user_role() IN ('System Administrator', 'Collection Personnel')
  );

DROP POLICY IF EXISTS "Authenticated read token categories" ON public.token_categories;
CREATE POLICY "Authenticated read token categories"
  ON public.token_categories FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "System Admin manages token categories" ON public.token_categories;
CREATE POLICY "System Admin manages token categories"
  ON public.token_categories FOR ALL TO authenticated
  USING (public.current_user_role() = 'System Administrator')
  WITH CHECK (public.current_user_role() = 'System Administrator');

DROP POLICY IF EXISTS "Authenticated read token issuances" ON public.token_issuances;
CREATE POLICY "Authenticated read token issuances"
  ON public.token_issuances FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated read cash accounts" ON public.cash_accounts;
CREATE POLICY "Authenticated read cash accounts"
  ON public.cash_accounts FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated read liquidations" ON public.liquidations;
CREATE POLICY "Authenticated read liquidations"
  ON public.liquidations FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated read liquidation items" ON public.liquidation_items;
CREATE POLICY "Authenticated read liquidation items"
  ON public.liquidation_items FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Finance Admin approves non-self cash advances" ON public.cash_advances;

CREATE OR REPLACE FUNCTION public.register_contingent(
  p_division TEXT,
  p_district TEXT,
  p_school TEXT,
  p_bank_reference TEXT,
  p_participants JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_group_id UUID;
  v_group_ref_no TEXT;
  v_member JSONB;
  v_age INTEGER;
  v_sex TEXT;
  v_category public.scout_category;
  v_fee NUMERIC(12,2);
  v_participant_id UUID;
  v_total_paid NUMERIC(12,2) := 0;
  v_participant_count INTEGER := 0;
BEGIN
  IF auth.uid() IS NULL OR public.current_user_role() NOT IN (
    'System Administrator', 'Registration Personnel'
  ) THEN
    RAISE EXCEPTION 'Registration access denied.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.jamboree_settings WHERE id = 1 AND status = 'Archived'
  ) THEN
    RAISE EXCEPTION 'Jamboree is Archived; new registrations are locked.';
  END IF;
  IF NULLIF(BTRIM(p_division), '') IS NULL
     OR NULLIF(BTRIM(p_district), '') IS NULL
     OR NULLIF(BTRIM(p_school), '') IS NULL
     OR NULLIF(BTRIM(p_bank_reference), '') IS NULL THEN
    RAISE EXCEPTION 'Complete the contingent and participant details.';
  END IF;
  IF JSONB_TYPEOF(p_participants) IS DISTINCT FROM 'array'
     OR JSONB_ARRAY_LENGTH(p_participants) = 0 THEN
    RAISE EXCEPTION 'Complete the contingent and participant details.';
  END IF;

  v_group_ref_no := 'AGU-' || LPAD(NEXTVAL('public.registration_group_ref_seq')::TEXT, 3, '0');
  INSERT INTO public.registration_groups (
    group_ref_no, division, district, school, bank_reference, registered_by
  ) VALUES (
    v_group_ref_no, BTRIM(p_division), BTRIM(p_district), BTRIM(p_school),
    BTRIM(p_bank_reference), auth.uid()
  )
  RETURNING id INTO v_group_id;

  FOR v_member IN SELECT VALUE FROM JSONB_ARRAY_ELEMENTS(p_participants)
  LOOP
    v_age := (v_member->>'age')::INTEGER;
    v_sex := v_member->>'sex';
    v_category := (v_member->>'category')::public.scout_category;

    IF NULLIF(BTRIM(v_member->>'fullName'), '') IS NULL
       OR v_age IS NULL
       OR v_age NOT BETWEEN 0 AND 120
       OR v_sex IS NULL
       OR v_sex NOT IN ('Male', 'Female') THEN
      RAISE EXCEPTION 'A participant has invalid registration details.';
    END IF;

    SELECT amount INTO v_fee
    FROM public.fee_rates
    WHERE category = v_category;
    IF v_fee IS NULL THEN
      RAISE EXCEPTION 'No registration fee is configured for category %.', v_category;
    END IF;

    INSERT INTO public.participants (
      group_id, full_name, sex, age, date_of_birth, category, fee_snapshot
    ) VALUES (
      v_group_id, BTRIM(v_member->>'fullName'), v_sex, v_age,
      (CURRENT_DATE - MAKE_INTERVAL(YEARS => v_age))::DATE,
      v_category, v_fee
    )
    RETURNING id INTO v_participant_id;

    IF v_fee > 0 THEN
      INSERT INTO public.payments (
        participant_id, amount, payment_date, payment_method,
        reference_number, recorded_by
      ) VALUES (
        v_participant_id, v_fee, CURRENT_DATE, 'Bank Transfer',
        BTRIM(p_bank_reference), auth.uid()
      );
    END IF;
    v_total_paid := v_total_paid + v_fee;
    v_participant_count := v_participant_count + 1;
  END LOOP;

  RETURN JSONB_BUILD_OBJECT(
    'id', v_group_id,
    'group_ref_no', v_group_ref_no,
    'total_paid', v_total_paid,
    'participant_count', v_participant_count
  );
END;
$$;

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
SET search_path = public, pg_temp
AS $$
DECLARE
  v_seq BIGINT;
  v_serial TEXT;
BEGIN
  IF auth.uid() IS NULL OR public.current_user_role() NOT IN (
    'System Administrator', 'Cash Custodian'
  ) THEN
    RAISE EXCEPTION 'Voucher issuance access denied.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.jamboree_settings WHERE id = 1 AND status = 'Archived'
  ) THEN
    RAISE EXCEPTION 'Jamboree is Archived; new financial vouchers are locked.';
  END IF;

  v_seq := NEXTVAL('public.global_crv_seq');
  v_serial := 'CRV-' || LPAD(v_seq::TEXT, 4, '0');

  INSERT INTO public.crv_vouchers (
    crv_serial, transaction_type, received_from_or_payee, amount,
    payment_method, reference_number, description, issued_by
  ) VALUES (
    v_serial, p_type, p_party, p_amount, p_method, p_ref, p_desc, auth.uid()
  );

  RETURN v_serial;
END;
$$;

CREATE OR REPLACE FUNCTION public.review_cash_advance(
  p_advance_id UUID,
  p_decision public.ca_status
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_advance public.cash_advances%ROWTYPE;
  v_account_id UUID;
BEGIN
  IF auth.uid() IS NULL OR public.current_user_role() NOT IN (
    'System Administrator', 'Finance Admin'
  ) THEN
    RAISE EXCEPTION 'Cash advance review access denied.';
  END IF;
  IF p_decision IS NULL OR p_decision NOT IN ('Approved', 'Rejected') THEN
    RAISE EXCEPTION 'Invalid cash advance decision.';
  END IF;

  SELECT * INTO v_advance
  FROM public.cash_advances
  WHERE id = p_advance_id
  FOR UPDATE;
  IF NOT FOUND OR v_advance.status <> 'Pending' THEN
    RAISE EXCEPTION 'Only pending cash advances can be reviewed.';
  END IF;
  IF v_advance.requester_id = auth.uid() THEN
    RAISE EXCEPTION 'A requester cannot approve their own cash advance.';
  END IF;

  IF p_decision = 'Approved' THEN
    SELECT id INTO v_account_id
    FROM public.cash_accounts
    WHERE current_balance >= v_advance.requested_amount
    ORDER BY CASE WHEN account_name = 'Council Petty Cash Vault' THEN 0 ELSE 1 END,
      current_balance DESC
    LIMIT 1
    FOR UPDATE;
    IF v_account_id IS NULL THEN
      RAISE EXCEPTION 'Insufficient funds to approve this cash advance.';
    END IF;
    UPDATE public.cash_accounts
    SET current_balance = current_balance - v_advance.requested_amount,
        updated_at = NOW()
    WHERE id = v_account_id;
  END IF;

  UPDATE public.cash_advances
  SET status = p_decision,
      reviewed_by = auth.uid(),
      cash_account_id = CASE WHEN p_decision = 'Approved' THEN v_account_id ELSE cash_account_id END
  WHERE id = p_advance_id;

  RETURN v_account_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_cash_advance(
  p_advance_id UUID
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_advance public.cash_advances%ROWTYPE;
  v_party TEXT;
  v_method TEXT;
  v_serial TEXT;
BEGIN
  IF auth.uid() IS NULL OR public.current_user_role() NOT IN (
    'System Administrator', 'Cash Custodian'
  ) THEN
    RAISE EXCEPTION 'Cash release access denied.';
  END IF;

  SELECT *
  INTO v_advance
  FROM public.cash_advances
  WHERE id = p_advance_id
  FOR UPDATE;
  IF NOT FOUND OR v_advance.status <> 'Approved' OR v_advance.crv_serial IS NOT NULL THEN
    RAISE EXCEPTION 'Only an approved, unreleased cash advance can be released.';
  END IF;

  SELECT up.full_name, account.account_type
  INTO v_party, v_method
  FROM public.user_profiles up
  JOIN public.cash_accounts account ON account.id = v_advance.cash_account_id
  WHERE up.id = v_advance.requester_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'The requester or funding account could not be found.';
  END IF;

  v_serial := public.generate_crv_voucher(
    'Cash Advance Release',
    v_party || ' (' || v_advance.expense_category || ')',
    v_advance.requested_amount,
    v_method,
    v_advance.request_no,
    'Cash Advance Release: ' || v_advance.purpose
  );

  UPDATE public.cash_advances
  SET status = 'Released', released_by = auth.uid(), crv_serial = v_serial
  WHERE id = p_advance_id;

  RETURN v_serial;
END;
$$;

CREATE OR REPLACE FUNCTION public.liquidate_cash_advance(
  p_advance_id UUID,
  p_cash_returned NUMERIC
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_advance public.cash_advances%ROWTYPE;
  v_liquidation_id UUID;
BEGIN
  IF auth.uid() IS NULL OR public.current_user_role() NOT IN (
    'System Administrator', 'Finance Admin'
  ) THEN
    RAISE EXCEPTION 'Cash liquidation access denied.';
  END IF;

  SELECT * INTO v_advance
  FROM public.cash_advances
  WHERE id = p_advance_id
  FOR UPDATE;
  IF NOT FOUND OR v_advance.status NOT IN ('Released', 'Partially Liquidated') THEN
    RAISE EXCEPTION 'Only released cash advances can be liquidated.';
  END IF;
  IF p_cash_returned IS NULL OR p_cash_returned < 0
     OR p_cash_returned > v_advance.requested_amount THEN
    RAISE EXCEPTION 'Cash returned must be within the advance amount.';
  END IF;

  UPDATE public.cash_accounts
  SET current_balance = current_balance + p_cash_returned, updated_at = NOW()
  WHERE id = v_advance.cash_account_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'The funding cash account could not be found.';
  END IF;

  INSERT INTO public.liquidations (
    cash_advance_id, crv_serial, liquidation_date, status, cash_returned
  ) VALUES (
    p_advance_id, v_advance.crv_serial, CURRENT_DATE, 'Fully Liquidated', p_cash_returned
  )
  RETURNING id INTO v_liquidation_id;

  UPDATE public.cash_advances
  SET status = 'Fully Liquidated',
      cash_returned = p_cash_returned,
      liquidated_on = CURRENT_DATE
  WHERE id = p_advance_id;

  RETURN v_liquidation_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reset_jamboree_records()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.current_user_role() <> 'System Administrator' THEN
    RAISE EXCEPTION 'Only System Administrator can reset jamboree records.';
  END IF;

  DELETE FROM public.liquidation_items;
  DELETE FROM public.liquidations;
  UPDATE public.cash_advances SET crv_serial = NULL;
  DELETE FROM public.cash_advances;
  UPDATE public.donations SET crv_serial = NULL;
  DELETE FROM public.donations;
  DELETE FROM public.token_issuances;
  DELETE FROM public.token_categories;
  DELETE FROM public.payments;
  DELETE FROM public.participants;
  DELETE FROM public.registration_groups;
  DELETE FROM public.crv_vouchers;
  UPDATE public.cash_accounts SET current_balance = 0, updated_at = NOW();
END;
$$;

REVOKE ALL ON FUNCTION public.register_contingent(TEXT, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.generate_crv_voucher(TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.review_cash_advance(UUID, public.ca_status) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.release_cash_advance(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.liquidate_cash_advance(UUID, NUMERIC) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reset_jamboree_records() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.register_contingent(TEXT, TEXT, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_crv_voucher(TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_cash_advance(UUID, public.ca_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_cash_advance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.liquidate_cash_advance(UUID, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_jamboree_records() TO authenticated;

COMMIT;
