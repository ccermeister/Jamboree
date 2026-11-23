import { supabase } from './supabase';
import { computeAge } from './utils';

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  return supabase;
}

function unwrap(result) {
  if (result.error) throw result.error;
  return result.data;
}

export async function loadJamboreeData(profile) {
  const client = requireSupabase();
  const [
    settingsResult,
    ratesResult,
    groupsResult,
    participantsResult,
    paymentsResult,
    crvsResult,
    donationsResult,
    tokensResult,
    issuancesResult,
    accountsResult,
    advancesResult,
    liquidationsResult,
    liquidationItemsResult,
    auditLogsResult,
  ] = await Promise.all([
    client.from('jamboree_settings').select('*').eq('id', 1).single(),
    client.from('fee_rates').select('category, amount'),
    client.from('registration_groups').select('*').order('created_at', { ascending: false }),
    client.from('participants').select('*').order('created_at', { ascending: false }),
    client.from('payments').select('participant_id, amount'),
    client.from('crv_vouchers').select('*').order('created_at', { ascending: false }),
    client.from('donations').select('*').order('created_at', { ascending: false }),
    client.from('token_categories').select('*').order('created_at', { ascending: true }),
    client.from('token_issuances').select('token_category_id, quantity_issued'),
    client.from('cash_accounts').select('*').order('account_name', { ascending: true }),
    client.from('cash_advances').select('*').order('created_at', { ascending: false }),
    client.from('liquidations').select('*').order('created_at', { ascending: false }),
    client.from('liquidation_items').select('*'),
    client.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200),
  ]);

  const settings = unwrap(settingsResult);
  const ratesRows = unwrap(ratesResult);
  const groupsRows = unwrap(groupsResult);
  const participantsRows = unwrap(participantsResult);
  const paymentsRows = unwrap(paymentsResult);
  const crvsRows = unwrap(crvsResult);
  const donationsRows = unwrap(donationsResult);
  const tokensRows = unwrap(tokensResult);
  const issuancesRows = unwrap(issuancesResult);
  const accountsRows = unwrap(accountsResult);
  const advancesRows = unwrap(advancesResult);
  const liquidationsRows = unwrap(liquidationsResult);
  const liquidationItemsRows = unwrap(liquidationItemsResult);
  const auditLogsRows = unwrap(auditLogsResult);

  const paymentTotals = paymentsRows.reduce((totals, payment) => {
    totals.set(payment.participant_id, (totals.get(payment.participant_id) || 0) + Number(payment.amount));
    return totals;
  }, new Map());
  const profileNames = new Map([[profile.id, profile.full_name]]);
  const groupMap = new Map(groupsRows.map((group) => [group.id, group]));
  const advancesMap = new Map(advancesRows.map((advance) => [advance.id, advance]));
  const issuedTotals = issuancesRows.reduce((totals, issuance) => {
    totals.set(
      issuance.token_category_id,
      (totals.get(issuance.token_category_id) || 0) + Number(issuance.quantity_issued),
    );
    return totals;
  }, new Map());

  return {
    settings: {
      jamboreeName: settings.jamboree_name,
      theme: settings.description || '',
      venue: settings.venue,
      startDate: settings.start_date,
      endDate: settings.end_date,
      status: settings.status,
    },
    rates: Object.fromEntries(ratesRows.map((rate) => [rate.category, Number(rate.amount)])),
    groups: groupsRows.map((group) => ({
      id: group.id,
      refNo: group.group_ref_no,
      division: group.division,
      district: group.district,
      school: group.school,
      bankReference: group.bank_reference,
      regDate: group.registration_date,
      personnel: group.registered_by ? (profileNames.get(group.registered_by) || 'Staff member') : 'Staff member',
    })),
    participants: participantsRows.map((participant) => ({
      id: participant.participant_code,
      dbId: participant.id,
      groupId: participant.group_id,
      fullName: participant.full_name,
      sex: participant.sex,
      age: participant.age ?? computeAge(participant.date_of_birth),
      dob: participant.date_of_birth,
      category: participant.category,
      feeSnapshot: Number(participant.fee_snapshot),
      division: groupMap.get(participant.group_id)?.division || '',
      district: groupMap.get(participant.group_id)?.district || '',
      school: groupMap.get(participant.group_id)?.school || '',
      regDate: participant.registration_date,
      paidAmount: paymentTotals.get(participant.id) || 0,
    })),
    crvs: crvsRows.map((voucher) => ({
      crvNo: voucher.crv_serial,
      type: voucher.transaction_type,
      date: voucher.issued_date,
      party: voucher.received_from_or_payee,
      amount: Number(voucher.amount),
      method: voucher.payment_method,
      refNo: voucher.reference_number || '-',
      description: voucher.description,
      issuedBy: voucher.issued_by === profile.id ? profile.full_name : 'Authorized Staff',
      status: voucher.is_voided ? 'Voided' : 'Active',
    })),
    donations: donationsRows.map((donation) => ({
      id: donation.id,
      donor: donation.donor_name,
      date: donation.donation_date,
      purpose: donation.purpose,
      refNo: donation.reference_number || '-',
      amount: Number(donation.amount),
    })),
    tokens: tokensRows.map((token) => ({
      id: token.id,
      name: token.name,
      description: token.description || '',
      totalStock: Number(token.total_quantity),
      issued: issuedTotals.get(token.id) || 0,
    })),
    accounts: accountsRows.map((account) => ({
      id: account.id,
      name: account.account_name,
      type: account.account_type,
      balance: Number(account.current_balance),
    })),
    advances: advancesRows.map((advance) => ({
      id: advance.request_no,
      dbId: advance.id,
      requesterId: advance.requester_id,
      requester: profileNames.get(advance.requester_id) || `Staff (${advance.requester_id.slice(0, 8)})`,
      category: advance.expense_category,
      purpose: advance.purpose,
      amount: Number(advance.requested_amount),
      dateNeeded: advance.date_needed,
      status: advance.status,
      crvNo: advance.crv_serial,
      accountId: advance.cash_account_id,
      cashReturned: Number(advance.cash_returned || 0),
      liquidatedAt: advance.liquidated_on,
    })),
    liquidations: liquidationsRows.map((liquidation) => {
      const advance = advancesMap.get(liquidation.cash_advance_id);
      return {
        id: liquidation.id,
        advanceId: advance?.request_no || liquidation.cash_advance_id,
        crvNo: liquidation.crv_serial,
        requester: advance
          ? (profileNames.get(advance.requester_id) || `Staff (${advance.requester_id.slice(0, 8)})`)
          : 'Staff member',
        advanceAmount: Number(advance?.requested_amount || 0),
        status: liquidation.status,
        cashReturned: Number(liquidation.cash_returned || 0),
        dateSubmitted: liquidation.liquidation_date,
        items: liquidationItemsRows
          .filter((item) => item.liquidation_id === liquidation.id)
          .map((item) => ({
            id: item.id,
            date: item.expense_date,
            category: item.expense_category,
            description: item.description,
            amount: Number(item.amount),
            status: item.review_status,
          })),
      };
    }),
    auditLogs: auditLogsRows.map((log) => ({
      id: log.id,
      timestamp: log.created_at.replace('T', ' ').slice(0, 19),
      actor: log.actor_id === profile.id ? profile.full_name : (log.actor_id || 'System'),
      action: log.action,
      details: typeof log.details === 'string' ? log.details : JSON.stringify(log.details || ''),
    })),
  };
}

export async function registerContingent({ division, district, school, bankReference, participants }) {
  const client = requireSupabase();
  const result = await client.rpc('register_contingent', {
    p_division: division,
    p_district: district,
    p_school: school,
    p_bank_reference: bankReference,
    p_participants: participants.map(({ fullName, sex, age, category }) => ({
      fullName,
      sex,
      age: Number(age),
      category,
    })),
  });
  return unwrap(result);
}

export async function saveRegistrationRates(rates) {
  const client = requireSupabase();
  return unwrap(await client.from('fee_rates').upsert(
    Object.entries(rates).map(([category, amount]) => ({ category, amount })),
    { onConflict: 'category' },
  ));
}

export async function saveJamboreeStatus(status) {
  const client = requireSupabase();
  return unwrap(await client.from('jamboree_settings').update({ status }).eq('id', 1).select().single());
}

export async function saveTokenCategory(tokenId, { name, description, totalQuantity }) {
  const client = requireSupabase();
  return unwrap(await client.from('token_categories')
    .update({ name, description, total_quantity: totalQuantity })
    .eq('id', tokenId)
    .select()
    .single());
}

export async function createCashAdvance({ purpose, amount, dateNeeded, category }) {
  const client = requireSupabase();
  const { data: { user }, error } = await client.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error('You must be signed in to submit a cash advance.');
  return unwrap(await client.from('cash_advances').insert({
    requester_id: user.id,
    requested_amount: amount,
    purpose,
    date_needed: dateNeeded,
    expense_category: category,
  }).select().single());
}

export async function reviewCashAdvance(advanceId, decision) {
  const client = requireSupabase();
  return unwrap(await client.rpc('review_cash_advance', {
    p_advance_id: advanceId,
    p_decision: decision,
  }));
}

export async function releaseCashAdvance(advanceId) {
  const client = requireSupabase();
  return unwrap(await client.rpc('release_cash_advance', { p_advance_id: advanceId }));
}

export async function liquidateCashAdvance(advanceId, cashReturned) {
  const client = requireSupabase();
  return unwrap(await client.rpc('liquidate_cash_advance', {
    p_advance_id: advanceId,
    p_cash_returned: cashReturned,
  }));
}

export async function resetJamboreeRecords() {
  const client = requireSupabase();
  return unwrap(await client.rpc('reset_jamboree_records'));
}

export async function writeAuditLog({ actorId, action, details }) {
  const client = requireSupabase();
  return unwrap(await client.from('audit_logs').insert({
    actor_id: actorId,
    action,
    table_name: 'application',
    details: { message: details },
  }));
}
