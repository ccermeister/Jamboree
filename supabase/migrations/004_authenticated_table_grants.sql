BEGIN;

GRANT USAGE ON SCHEMA public TO authenticated;

GRANT SELECT ON TABLE
  public.user_profiles,
  public.jamboree_settings,
  public.fee_rates,
  public.registration_groups,
  public.participants,
  public.crv_vouchers,
  public.payments,
  public.donations,
  public.token_categories,
  public.token_issuances,
  public.cash_accounts,
  public.cash_advances,
  public.liquidations,
  public.liquidation_items,
  public.audit_logs
TO authenticated;

GRANT UPDATE ON TABLE
  public.jamboree_settings,
  public.token_categories
TO authenticated;

GRANT INSERT, UPDATE ON TABLE public.fee_rates TO authenticated;
GRANT INSERT ON TABLE
  public.registration_groups,
  public.participants,
  public.payments,
  public.cash_advances,
  public.audit_logs
TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE
  public.participant_id_seq,
  public.audit_logs_id_seq
TO authenticated;

COMMIT;
