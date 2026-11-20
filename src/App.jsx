import React, { useState, useMemo, useRef } from 'react';
import {
  LayoutDashboard, Users, Receipt, HeartHandshake, Award,
  Banknote, FileCheck2, Landmark, FileBarChart2, Settings, ShieldAlert,
  Search, Plus, Printer, CheckCircle2, XCircle, AlertTriangle,
  Upload, Download, Menu, ChevronRight, Lock, Unlock, RefreshCw, Eye, FileText
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import { formatPHP, numberToWordsPHP } from './lib/utils';

const ROLES = [
  'System Administrator',
  'Registration Personnel',
  'Collection Personnel',
  'Cash Custodian',
  'Finance Admin',
];

const INITIAL_SETTINGS = {
  jamboreeName: '2026 Agusan Council Joint Scouting Jamboree',
  theme: 'Scouts: Building Resilient & Green Communities',
  venue: 'Camp Doña Rosario, Bancasi, Butuan City',
  startDate: '2026-11-20',
  endDate: '2026-11-24',
  status: 'Active', // Draft | Active | Closed | Archived
};

const INITIAL_RATES = {
  'Kid Scouts': 450,
  'Kab Scouts': 500,
  'Boy Scouts': 600,
  'Senior Scouts': 650,
  'Rover Scouts': 700,
  'Unit Leader': 550,
};
const REGISTRATION_TEMPLATE_HEADERS = ['Full Name', 'Age', 'Gender', 'Section'];
const REGISTRATION_SECTIONS = Object.keys(INITIAL_RATES);

const INITIAL_GROUPS = [
  { id: 'GRP-001', refNo: 'AGU-BTN-001', division: 'Butuan City', district: 'North Butuan District', school: 'Butuan Central Elementary School', regDate: '2026-10-12', personnel: 'Maria Santos' },
  { id: 'GRP-002', refNo: 'AGU-ADN-002', division: 'Agusan del Norte', district: 'Cabadbaran District', school: 'Cabadbaran City National High School', regDate: '2026-10-15', personnel: 'Maria Santos' },
  { id: 'GRP-003', refNo: 'AGU-ADS-003', division: 'Agusan del Sur', district: 'Bayugan East District', school: 'Bayugan National Comprehensive High School', regDate: '2026-10-19', personnel: 'Jose Reyes' },
];

const INITIAL_PARTICIPANTS = [
  { id: 'BSP-AG-0001', groupId: 'GRP-001', fullName: 'Juan Carlos Dela Cruz', sex: 'Male', dob: '2015-04-12', category: 'Kab Scouts', division: 'Butuan City', district: 'North Butuan District', school: 'Butuan Central Elementary School', regDate: '2026-10-12', feeSnapshot: 500, paidAmount: 500 },
  { id: 'BSP-AG-0002', groupId: 'GRP-001', fullName: 'Angela Mae Villanueva', sex: 'Female', dob: '2015-08-23', category: 'Kab Scouts', division: 'Butuan City', district: 'North Butuan District', school: 'Butuan Central Elementary School', regDate: '2026-10-12', feeSnapshot: 500, paidAmount: 500 },
  { id: 'BSP-AG-0003', groupId: 'GRP-001', fullName: 'Scouter Roberto Lim', sex: 'Male', dob: '1986-02-14', category: 'Unit Leader', division: 'Butuan City', district: 'North Butuan District', school: 'Butuan Central Elementary School', regDate: '2026-10-12', feeSnapshot: 550, paidAmount: 550 },
  { id: 'BSP-AG-0004', groupId: 'GRP-002', fullName: 'Mark Anthony Mendoza', sex: 'Male', dob: '2012-11-03', category: 'Boy Scouts', division: 'Agusan del Norte', district: 'Cabadbaran District', school: 'Cabadbaran City National High School', regDate: '2026-10-15', feeSnapshot: 600, paidAmount: 600 },
  { id: 'BSP-AG-0005', groupId: 'GRP-002', fullName: 'Katrina Joy Bautista', sex: 'Female', dob: '2009-06-18', category: 'Senior Scouts', division: 'Agusan del Norte', district: 'Cabadbaran District', school: 'Cabadbaran City National High School', regDate: '2026-10-15', feeSnapshot: 650, paidAmount: 650 },
  { id: 'BSP-AG-0006', groupId: 'GRP-003', fullName: 'Rafael Miguel Torres', sex: 'Male', dob: '2007-01-29', category: 'Rover Scouts', division: 'Agusan del Sur', district: 'Bayugan East District', school: 'Bayugan National Comprehensive High School', regDate: '2026-10-19', feeSnapshot: 700, paidAmount: 700 },
];

const INITIAL_CRVS = [
  { crvNo: 'CRV-0001', type: 'Cash Advance Release', date: '2026-10-22', party: 'Engr. Dante Navarro (Camp Logistics)', amount: 15000, method: 'Cash', refNo: 'CA-2026-001', description: 'Cash Advance Release – Site Clearing & Bamboo', issuedBy: 'Carlos Magno', status: 'Active' },
];

const INITIAL_DONATIONS = [
  { id: 'DON-001', donor: 'Agusan Fil-Chinese Chamber of Commerce', date: '2026-10-20', amount: 25000, method: 'Check', refNo: 'CHK-009182', purpose: 'Medical Tent & Drinking Water', recordedBy: 'Elena Cruz' },
  { id: 'DON-002', donor: 'Hon. Vicente Pimentel Foundation', date: '2026-10-28', amount: 15000, method: 'Bank Transfer', refNo: 'DBP-771290', purpose: 'Scout Trail & Obstacle Materials', recordedBy: 'Elena Cruz' },
];

const INITIAL_TOKENS = [
  { id: 'TKN-CAT-1', name: 'Jamboree Neckerchief & Slide', description: 'Eligible: Kid Scouts, Kab Scouts, Boy Scouts, Senior Scouts, Rover Scouts, Unit Leader', totalStock: 500, issued: 4 },
  { id: 'TKN-CAT-2', name: '2026 Agusan Jamboree Cloth Patch', description: 'Eligible: Kid Scouts, Kab Scouts, Boy Scouts, Senior Scouts, Rover Scouts, Unit Leader', totalStock: 600, issued: 4 },
  { id: 'TKN-CAT-3', name: 'Unit Leader Souvenir Lanyard & ID', description: 'Eligible: Unit Leader', totalStock: 120, issued: 1 },
];

const INITIAL_ACCOUNTS = [
  { id: 'ACC-01', name: 'Council Petty Cash Vault', type: 'Cash on Hand', balance: 33850 },
  { id: 'ACC-02', name: 'LandBank Butuan – BSP Council Trust', type: 'Bank Account', balance: 185600 },
  { id: 'ACC-03', name: 'BSP Agusan Official GCash Merchant', type: 'E-Wallet', balance: 28650 },
];

const INITIAL_ADVANCES = [
  { id: 'CA-2026-001', requester: 'Engr. Dante Navarro', category: 'Camp Logistics', purpose: 'Bamboo poles, rope, and sub-camp gateway materials', amount: 15000, dateNeeded: '2026-10-24', status: 'Partially Liquidated', cashReturned: 0, crvNo: 'CRV-0001', accountId: 'ACC-01' },
  { id: 'CA-2026-002', requester: 'Dr. Liza Almonte', category: 'Health & First Aid', purpose: 'Emergency medical kit replenishment & hydration', amount: 8500, dateNeeded: '2026-11-15', status: 'Approved', cashReturned: 0, crvNo: null, accountId: 'ACC-01' },
  { id: 'CA-2026-003', requester: 'Finance Admin', category: 'Program & Awards', purpose: 'Printing of merit certificates & activity passports', amount: 6200, dateNeeded: '2026-11-18', status: 'Pending', cashReturned: 0, crvNo: null, accountId: null },
];

const INITIAL_LIQUIDATIONS = [
  {
    id: 'LIQ-2026-001',
    advanceId: 'CA-2026-001',
    crvNo: 'CRV-0001',
    requester: 'Engr. Dante Navarro',
    advanceAmount: 15000,
    dateSubmitted: '2026-11-02',
    status: 'Under Review',
    cashReturned: 0,
    items: [
      { id: 'EXP-1', date: '2026-10-25', category: 'Materials', description: '120 pcs Mature Bamboo Poles (OR #4412)', amount: 9600, status: 'Accepted', remarks: 'Verified OR' },
      { id: 'EXP-2', date: '2026-10-26', category: 'Hardware', description: 'Abaca rope & tie wire (OR #4489)', amount: 3200, status: 'Accepted', remarks: 'Verified OR' },
      { id: 'EXP-3', date: '2026-10-27', category: 'Meals', description: 'Unreceipted snacks for haulers', amount: 950, status: 'Pending', remarks: 'Awaiting acknowledgement receipt' },
    ],
  },
];

export default function App() {
  const [activeRole, setActiveRole] = useState('System Administrator');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [toast, setToast] = useState(null);

  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [rates, setRates] = useState(INITIAL_RATES);
  const [rateForm, setRateForm] = useState(INITIAL_RATES);
  const [groups, setGroups] = useState(INITIAL_GROUPS);
  const [participants, setParticipants] = useState(INITIAL_PARTICIPANTS);
  const [crvs, setCrvs] = useState(INITIAL_CRVS);
  const [donations, setDonations] = useState(INITIAL_DONATIONS);
  const [tokens, setTokens] = useState(INITIAL_TOKENS);
  const [editingTokenId, setEditingTokenId] = useState(null);
  const [tokenDraft, setTokenDraft] = useState(null);
  const [accounts, setAccounts] = useState(INITIAL_ACCOUNTS);
  const [advances, setAdvances] = useState(INITIAL_ADVANCES);
  const [liquidations, setLiquidations] = useState(INITIAL_LIQUIDATIONS);
  const [auditLogs, setAuditLogs] = useState([
    { id: 1, timestamp: '2026-11-14 08:30:12', actor: 'System Administrator', action: 'SYSTEM_INIT', details: 'Initialized 2026 Agusan Council Joint Scouting Jamboree workspace' },
  ]);

  // Modals & Interactive States
  const [selectedCrv, setSelectedCrv] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Registration Form
  const [regForm, setRegForm] = useState({
    division: '',
    district: '',
    school: '',
    bankReference: '',
    roster: [{ rowId: 1, fullName: '', age: '', sex: 'Male', category: 'Boy Scouts' }],
  });
  const [registrationConfirmation, setRegistrationConfirmation] = useState(null);
  const [expandedGroupId, setExpandedGroupId] = useState(null);
  const [importNotice, setImportNotice] = useState('');
  const rosterFileInput = useRef(null);

  // Cash Advance Form
  const [caForm, setCaForm] = useState({
    requester: activeRole, category: 'Camp Logistics', purpose: '', amount: '', dateNeeded: '2026-11-19'
  });

  const isLocked = settings.status === 'Archived';

  const notify = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const logAudit = (action, details) => {
    setAuditLogs((prev) => [
      { id: Date.now(), timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19), actor: activeRole, action, details },
      ...prev,
    ]);
  };

  // Atomic Global CRV Generator
  const issueNextCrv = ({ type, party, amount, method, refNo, description }) => {
    const nextNum = crvs.length + 1;
    const crvNo = `CRV-${String(nextNum).padStart(4, '0')}`;
    const newCrv = {
      crvNo,
      type,
      date: new Date().toISOString().slice(0, 10),
      party,
      amount: Number(amount),
      method,
      refNo: refNo || '-',
      description,
      issuedBy: activeRole,
      status: 'Active',
    };
    setCrvs((prev) => [newCrv, ...prev]);
    logAudit('ISSUE_CRV', `Generated ${crvNo} (${type}) for ${formatPHP(amount)}`);
    return newCrv;
  };

  // KPIs
  const metrics = useMemo(() => {
    const totalExpected = participants.reduce((s, p) => s + p.feeSnapshot, 0);
    const totalCollected = participants.reduce((s, p) => s + p.paidAmount, 0);
    const totalDonations = donations.reduce((s, d) => s + d.amount, 0);
    const totalCash = accounts.reduce((s, a) => s + a.balance, 0);
    const releasedAdvances = advances
      .filter((a) => ['Approved', 'Released', 'Partially Liquidated', 'Fully Liquidated'].includes(a.status))
      .reduce((s, a) => s + a.amount, 0);
    const totalScouts = participants.filter((participant) => participant.category !== 'Unit Leader').length;
    const totalLeaders = participants.length - totalScouts;
    return {
      totalParticipants: participants.length,
      totalScouts,
      totalLeaders,
      totalExpected,
      totalCollected,
      outstanding: totalExpected - totalCollected,
      totalDonations,
      totalCash,
      releasedAdvances,
    };
  }, [participants, donations, accounts, advances]);

  // Register a contingent and its roster together.
  const handleRegisterContingent = (event) => {
    event?.preventDefault();
    if (isLocked) return notify('Jamboree is Archived. Transactions are locked.', 'error');
    if (!['System Administrator', 'Registration Personnel'].includes(activeRole)) {
      return notify('Access Denied: Only Registration Personnel or System Admin can register.', 'error');
    }
    if (!regForm.division.trim() || !regForm.district.trim() || !regForm.school.trim()) {
      return notify('Division, district, and school or unit are required.', 'error');
    }
    if (regForm.roster.length === 0 || regForm.roster.some((member) =>
      !member.fullName.trim() || String(member.age).trim() === '' ||
      !Number.isInteger(Number(member.age)) || Number(member.age) < 0 || Number(member.age) > 120
    )) {
      return notify('Add at least one participant and provide each name and a valid age (0–120).', 'error');
    }
    if (!regForm.bankReference.trim()) {
      return notify('Enter the contingent bank transfer/deposit reference number.', 'error');
    }

    const regDate = new Date().toISOString().slice(0, 10);
    const groupNumber = groups.length + 1;
    const group = {
      id: `GRP-${String(groupNumber).padStart(3, '0')}`,
      refNo: `AGU-${String(groupNumber).padStart(3, '0')}`,
      division: regForm.division.trim(),
      district: regForm.district.trim(),
      school: regForm.school.trim(),
      bankReference: regForm.bankReference.trim(),
      regDate,
      personnel: activeRole,
    };
    const newParticipants = regForm.roster.map((member, index) => ({
      id: `BSP-AG-${String(participants.length + index + 1).padStart(4, '0')}`,
      groupId: group.id,
      fullName: member.fullName.trim(),
      sex: member.sex,
      age: Number(member.age),
      dob: null,
      category: member.category,
      division: group.division,
      district: group.district,
      school: group.school,
      regDate,
      feeSnapshot: rates[member.category] ?? 500,
      paidAmount: 0,
    }));

    const duplicateMatches = participants.filter((participant) =>
      newParticipants.some((member) =>
        participant.fullName.toLowerCase().trim() === member.fullName.toLowerCase().trim()
      )
    );
    setRegistrationConfirmation({
      group,
      participants: newParticipants,
      duplicateMatches,
    });
  };

  const confirmContingentRegistration = () => {
    if (!registrationConfirmation) return;
    if (isLocked) {
      setRegistrationConfirmation(null);
      return notify('Jamboree is Archived. Transactions are locked.', 'error');
    }

    const { group, participants: newParticipants } = registrationConfirmation;
    if (!group.bankReference?.trim()) {
      return notify('Enter the contingent bank reference number before confirming.', 'error');
    }
    const paidParticipants = newParticipants.map((participant) => ({
      ...participant,
      paidAmount: participant.feeSnapshot,
    }));

    setGroups((prev) => [group, ...prev]);
    setParticipants((prev) => [...paidParticipants, ...prev]);
    setRegistrationConfirmation(null);
    setRegForm({
      division: '',
      district: '',
      school: '',
      bankReference: '',
      roster: [{ rowId: 1, fullName: '', age: '', sex: 'Male', category: 'Boy Scouts' }],
    });
    setImportNotice('');
    const totalPaid = newParticipants.reduce((sum, participant) => sum + participant.feeSnapshot, 0);
    logAudit('REGISTER_CONTINGENT', `Registered ${group.refNo} (${group.school}) with ${newParticipants.length} participants`);
    logAudit('REGISTRATION_PAYMENT', `Recorded ${formatPHP(totalPaid)} as paid by Bank Transfer; reference ${group.bankReference}`);
    notify(`Registered and marked ${newParticipants.length} participant${newParticipants.length === 1 ? '' : 's'} fully paid. No CRV is issued for registration.`);
  };

  const downloadRegistrationTemplate = async (format) => {
    try {
      const XLSX = await import('xlsx');
      const worksheet = XLSX.utils.aoa_to_sheet([REGISTRATION_TEMPLATE_HEADERS]);
      if (format === 'xlsx') {
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Participants');
        XLSX.writeFile(workbook, 'jamboree-registration-template.xlsx');
        return;
      }

      const csv = XLSX.utils.sheet_to_csv(worksheet);
      const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'jamboree-registration-template.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (error) {
      console.error('Unable to generate registration template:', error);
      notify('Unable to generate the registration template. Please try again.', 'error');
    }
  };

  const handleRosterFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImportNotice('');

    if (isLocked || !['System Administrator', 'Registration Personnel'].includes(activeRole)) {
      notify(isLocked ? 'Jamboree is Archived. Transactions are locked.' : 'Access Denied: Only Registration Personnel or System Admin can register.', 'error');
      event.target.value = '';
      return;
    }

    try {
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        setImportNotice('The selected file does not contain a worksheet.');
        return;
      }

      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], {
        header: 1,
        defval: '',
        raw: false,
        blankrows: false,
      });
      if (rows.length < 2) {
        setImportNotice('The file has no participant rows. Add rows below the header before uploading.');
        return;
      }

      const normalizeHeader = (value) => String(value).trim().toLowerCase().replace(/\s+/g, ' ');
      const headers = rows[0].map(normalizeHeader);
      const columnIndexes = REGISTRATION_TEMPLATE_HEADERS.map((header) => headers.indexOf(normalizeHeader(header)));
      const missingHeaders = REGISTRATION_TEMPLATE_HEADERS.filter((_, index) => columnIndexes[index] === -1);
      if (missingHeaders.length > 0) {
        setImportNotice(`Missing required column${missingHeaders.length > 1 ? 's' : ''}: ${missingHeaders.join(', ')}. Use the downloadable template.`);
        return;
      }

      const sectionsByName = new Map(REGISTRATION_SECTIONS.map((section) => [section.toLowerCase(), section]));
      const importedRoster = [];
      const rowErrors = [];
      rows.slice(1).forEach((row, index) => {
        const [fullNameValue, ageValue, genderValue, sectionValue] = columnIndexes.map((columnIndex) => row[columnIndex]);
        const fullName = String(fullNameValue ?? '').trim();
        const ageText = String(ageValue ?? '').trim();
        const age = Number(ageText);
        const gender = String(genderValue ?? '').trim().toLowerCase();
        const section = sectionsByName.get(String(sectionValue ?? '').trim().toLowerCase());
        const rowNumber = index + 2;
        const errors = [];

        if (!fullName) errors.push('Full Name is required');
        if (!ageText || !Number.isInteger(age) || age < 0 || age > 120) errors.push('Age must be a whole number from 0 to 120');
        if (!['male', 'female'].includes(gender)) errors.push('Gender must be Male or Female');
        if (!section) errors.push(`Section must be one of: ${REGISTRATION_SECTIONS.join(', ')}`);

        if (errors.length > 0) {
          rowErrors.push(`Row ${rowNumber}: ${errors.join('; ')}`);
          return;
        }

        importedRoster.push({
          rowId: Date.now() + rowNumber,
          fullName,
          age: String(age),
          sex: gender === 'male' ? 'Male' : 'Female',
          category: section,
        });
      });

      if (rowErrors.length > 0) {
        setImportNotice(`No participants were added. Correct these rows and upload again:\n${rowErrors.join('\n')}`);
        return;
      }
      if (importedRoster.length === 0) {
        setImportNotice('No participant rows found in the selected file.');
        return;
      }

      setRegForm((form) => ({ ...form, roster: [...form.roster, ...importedRoster] }));
      setImportNotice(`Validated and added ${importedRoster.length} participant${importedRoster.length === 1 ? '' : 's'} to the contingent roster.`);
    } catch (error) {
      console.error('Unable to read registration file:', error);
      setImportNotice('Unable to read this file. Please upload a valid Excel (.xlsx, .xls) or CSV file.');
    } finally {
      event.target.value = '';
    }
  };

  const handleSaveRegistrationRates = (event) => {
    event.preventDefault();
    if (activeRole !== 'System Administrator') {
      return notify('Only System Administrator can update registration prices.', 'error');
    }

    const updatedRates = {};
    for (const section of REGISTRATION_SECTIONS) {
      const amount = Number(rateForm[section]);
      if (!Number.isFinite(amount) || amount < 0) {
        return notify(`Enter a valid non-negative registration price for ${section}.`, 'error');
      }
      updatedRates[section] = amount;
    }

    setRates(updatedRates);
    setRateForm(updatedRates);
    logAudit('REGISTRATION_RATES_UPDATE', 'Updated Jamboree registration prices by section');
    notify('Jamboree registration prices updated.');
  };

  const handleSubmitCashAdvance = (event) => {
    event.preventDefault();
    if (isLocked) return notify('Jamboree is Archived. Transactions are locked.', 'error');

    const requester = caForm.requester.trim();
    const purpose = caForm.purpose.trim();
    const amount = Number(caForm.amount);
    if (!requester || !purpose || !caForm.category || !caForm.dateNeeded) {
      return notify('Complete the requester, category, description, amount, and date needed.', 'error');
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return notify('Enter a valid cash advance amount greater than zero.', 'error');
    }

    const nextNumber = advances.reduce((maxNumber, advance) => {
      const match = advance.id.match(/^CA-\d{4}-(\d+)$/);
      return match ? Math.max(maxNumber, Number(match[1])) : maxNumber;
    }, 0) + 1;
    const request = {
      id: `CA-${new Date().getFullYear()}-${String(nextNumber).padStart(3, '0')}`,
      requester,
      category: caForm.category,
      purpose,
      amount,
      dateNeeded: caForm.dateNeeded,
      status: 'Pending',
      crvNo: null,
      accountId: null,
    };

    setAdvances((prev) => [request, ...prev]);
    logAudit('CASH_ADVANCE_REQUEST', `Submitted ${request.id} for ${formatPHP(amount)}: ${purpose}`);
    setCaForm({ requester: activeRole, category: 'Camp Logistics', purpose: '', amount: '', dateNeeded: '2026-11-19' });
    notify(`Cash advance request ${request.id} submitted for approval.`);
  };

  // Cash Advance Approval & Release
  const handleApproveAdvance = (ca, decision) => {
    if (activeRole !== 'Finance Admin' && activeRole !== 'System Administrator') {
      return notify('Only Finance Admin can approve or reject cash advances.', 'error');
    }
    if (ca.requester === activeRole) {
      return notify('Security Control: A requester cannot approve their own cash advance.', 'error');
    }
    if (ca.status !== 'Pending') return notify('Only pending cash advances can be reviewed.', 'error');

    let accountId = null;
    if (decision === 'Approved') {
      const cashAccount = accounts.find((account) => account.id === 'ACC-01' && account.balance >= ca.amount);
      const fundingAccount = cashAccount || accounts.find((account) => account.balance >= ca.amount);
      if (!fundingAccount) {
        return notify(`Insufficient funds to approve ${ca.id} for ${formatPHP(ca.amount)}.`, 'error');
      }
      accountId = fundingAccount.id;
      setAccounts((prev) => prev.map((account) =>
        account.id === accountId ? { ...account, balance: account.balance - ca.amount } : account
      ));
    }

    setAdvances((prev) => prev.map((item) => (item.id === ca.id ? {
      ...item,
      status: decision,
      accountId: decision === 'Approved' ? accountId : item.accountId,
      cashReturned: item.cashReturned ?? 0,
    } : item)));
    if (decision === 'Approved') {
      logAudit('CASH_ADVANCE_FUNDS_RESERVED', `Reserved ${formatPHP(ca.amount)} from ${accounts.find((account) => account.id === accountId)?.name} for ${ca.id}`);
    }
    logAudit('CASH_ADVANCE_REVIEW', `${decision} ${ca.id} (${formatPHP(ca.amount)})`);
    notify(`Cash advance ${ca.id} marked as ${decision}.`);
  };

  const handleReleaseAdvance = (ca) => {
    if (activeRole !== 'Cash Custodian' && activeRole !== 'System Administrator') {
      return notify('Only Cash Custodian can release approved cash advances.', 'error');
    }
    if (ca.status !== 'Approved') {
      return notify('Only an approved cash advance can be released.', 'error');
    }
    if (ca.crvNo) {
      return notify(`A Cash Release Voucher has already been issued for ${ca.id}.`, 'error');
    }
    const fundingAccount = accounts.find((account) => account.id === ca.accountId);
    if (!fundingAccount) return notify(`Reserved funds for ${ca.id} could not be found. Cannot release this advance.`, 'error');
    const crv = issueNextCrv({
      type: 'Cash Advance Release',
      party: `${ca.requester} (${ca.category})`,
      amount: ca.amount,
      method: fundingAccount.type,
      refNo: ca.id,
      description: `Cash Advance Release: ${ca.purpose}`,
    });
    setAdvances((prev) =>
      prev.map((item) => (item.id === ca.id ? { ...item, status: 'Released', cashReturned: item.cashReturned ?? 0, crvNo: crv.crvNo } : item))
    );
    setSelectedCrv(crv);
    notify(`Cash released for ${ca.id} with ${crv.crvNo}.`);
  };

  const handleUpdateCashReturned = (advanceId, value) => {
    setAdvances((prev) => prev.map((item) =>
      item.id === advanceId ? { ...item, cashReturned: value } : item
    ));
  };

  const handleLiquidateAdvance = (ca) => {
    if (activeRole !== 'Finance Admin' && activeRole !== 'System Administrator') {
      return notify('Only Finance Admin can confirm a cash advance liquidation.', 'error');
    }
    if (!['Released', 'Partially Liquidated'].includes(ca.status)) {
      return notify('Only released cash advances can be liquidated.', 'error');
    }

    const cashReturned = Number(ca.cashReturned);
    if (String(ca.cashReturned ?? '').trim() === '' || !Number.isFinite(cashReturned) || cashReturned < 0 || cashReturned > ca.amount) {
      return notify(`Enter a cash return from ₱0.00 to ${formatPHP(ca.amount)}.`, 'error');
    }
    const fundingAccount = accounts.find((account) => account.id === ca.accountId);
    if (!fundingAccount) return notify(`The funding account for ${ca.id} could not be found.`, 'error');

    setAccounts((prev) => prev.map((account) =>
      account.id === fundingAccount.id ? { ...account, balance: account.balance + cashReturned } : account
    ));
    setAdvances((prev) => prev.map((item) => item.id === ca.id
      ? { ...item, status: 'Fully Liquidated', cashReturned, liquidatedAt: new Date().toISOString().slice(0, 10) }
      : item
    ));
    setLiquidations((prev) => prev.map((liquidation) => liquidation.advanceId === ca.id
      ? { ...liquidation, cashReturned, status: 'Liquidated', dateSubmitted: new Date().toISOString().slice(0, 10) }
      : liquidation
    ));
    logAudit('CASH_ADVANCE_LIQUIDATION', `Liquidated ${ca.id}; returned ${formatPHP(cashReturned)} to ${fundingAccount.name}`);
    notify(`${ca.id} marked liquidated. ${formatPHP(cashReturned)} returned to funds.`);
  };

  const handleJamboreeStatusChange = (status) => {
    if (activeRole !== 'System Administrator') {
      return notify('Only System Administrator can change Jamboree status.', 'error');
    }
    if (!['Draft', 'Active', 'Closed', 'Archived'].includes(status)) {
      return notify('Select a valid Jamboree status.', 'error');
    }
    setSettings((current) => ({ ...current, status }));
    logAudit('STATUS_CHANGE', `Changed Jamboree status to ${status}`);
    notify(`Jamboree status updated to ${status}`);
  };

  const startTokenEdit = (token) => {
    if (activeRole !== 'System Administrator') {
      return notify('Only System Administrator can edit token inventory.', 'error');
    }
    setEditingTokenId(token.id);
    setTokenDraft({
      name: token.name,
      description: token.description,
      available: String(token.totalStock - token.issued),
      totalStock: String(token.totalStock),
    });
  };

  const handleTokenDraftChange = (field, value) => {
    if (activeRole !== 'System Administrator') {
      return notify('Only System Administrator can edit token inventory.', 'error');
    }
    setTokenDraft((current) => ({ ...current, [field]: value }));
  };

  const saveTokenEdit = (tokenId) => {
    if (activeRole !== 'System Administrator') {
      return notify('Only System Administrator can edit token inventory.', 'error');
    }
    const available = Number(tokenDraft?.available);
    const totalStock = Number(tokenDraft?.totalStock);
    if (!tokenDraft?.name.trim() || !tokenDraft.description.trim()) {
      return notify('Enter a title and description for the inventory card.', 'error');
    }
    if (
      tokenDraft.available.trim() === '' ||
      tokenDraft.totalStock.trim() === '' ||
      !Number.isInteger(available) ||
      !Number.isInteger(totalStock) ||
      available < 0 ||
      totalStock < 0 ||
      available > totalStock
    ) {
      return notify('Enter valid whole-number stock values. Available stock cannot exceed total stock.', 'error');
    }

    const original = tokens.find((token) => token.id === tokenId);
    setTokens((current) => current.map((token) => token.id === tokenId ? {
      ...token,
      name: tokenDraft.name.trim(),
      description: tokenDraft.description.trim(),
      totalStock,
      issued: totalStock - available,
    } : token));
    logAudit('TOKEN_INVENTORY_UPDATE', `Saved inventory card "${original?.name ?? tokenId}"`);
    setEditingTokenId(null);
    setTokenDraft(null);
    notify('Inventory card changes saved.');
  };

  const cancelTokenEdit = () => {
    setEditingTokenId(null);
    setTokenDraft(null);
  };

  const navItems = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    { id: 'registration', label: 'Registrations & Contingents', icon: Users },
    { id: 'pricing', label: 'Registration Pricing', icon: Banknote },
    { id: 'crv', label: 'CRV Release Register', icon: Receipt },
    { id: 'donations', label: 'Donations & Sponsorships', icon: HeartHandshake },
    { id: 'tokens', label: 'Tokens & Kits Inventory', icon: Award },
    { id: 'advances', label: 'Cash Advances', icon: Banknote },
    { id: 'liquidations', label: 'Liquidations & Returns', icon: FileCheck2 },
    { id: 'accounts', label: 'Cash Accounts & Ledger', icon: Landmark },
    { id: 'reports', label: 'Financial Statements', icon: FileBarChart2 },
    { id: 'settings', label: 'Jamboree & Audit Setup', icon: Settings },
  ];

  const filteredGroups = groups.filter((group) => {
    const groupParticipants = participants.filter((participant) => participant.groupId === group.id);
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      group.refNo.toLowerCase().includes(query) ||
      group.school.toLowerCase().includes(query) ||
      group.district.toLowerCase().includes(query) ||
      groupParticipants.some((participant) =>
        participant.fullName.toLowerCase().includes(query) || participant.id.toLowerCase().includes(query)
      );
    const matchesCat = categoryFilter === 'All' || groupParticipants.some((p) => p.category === categoryFilter);
    return matchesSearch && matchesCat;
  });

  const registrationBreakdown = REGISTRATION_SECTIONS
    .map((section) => {
      const sectionParticipants = participants.filter((participant) => participant.category === section);
      return {
        section,
        count: sectionParticipants.length,
        totalAmount: sectionParticipants.reduce((sum, participant) => sum + participant.feeSnapshot, 0),
      };
    })
    .filter((section) => section.count > 0);
  const divisionBreakdown = groups.reduce((divisions, group) => {
    const divisionName = group.division.trim() || 'Unspecified Division';
    const division = divisions.find((item) => item.name === divisionName);
    const count = participants.filter((participant) => participant.groupId === group.id).length;
    if (division) division.value += count;
    else divisions.push({ name: divisionName, value: count });
    return divisions;
  }, []).filter((division) => division.value > 0);
  const districtBreakdown = groups.reduce((districts, group) => {
    const divisionName = group.division.trim() || 'Unspecified Division';
    const districtName = group.district.trim() || 'Unspecified District';
    const name = `${districtName} (${divisionName})`;
    const district = districts.find((item) => item.name === name);
    const count = participants.filter((participant) => participant.groupId === group.id).length;
    if (district) district.value += count;
    else districts.push({ name, value: count, division: divisionName });
    return districts;
  }, []).filter((district) => district.value > 0);
  const chartColors = ['#115E34', '#0F766E', '#D97706', '#2563EB', '#7C3AED', '#DB2777', '#64748B'];

  return (
    <div className="min-h-screen flex bg-slate-100 text-slate-800">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-[#0A361E] text-white flex flex-col transition-all duration-200 shrink-0`}>
        <div className="p-4 border-b border-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-lg bg-amber-500 text-[#0A361E] font-black flex items-center justify-center shrink-0">
              BSP
            </div>
            {sidebarOpen && (
              <div className="truncate">
                <div className="font-bold text-sm tracking-wide">AGUSAN COUNCIL</div>
                <div className="text-[11px] text-emerald-300">Jamboree Finance & Reg</div>
              </div>
            )}
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded hover:bg-emerald-900">
            <Menu className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 py-3 space-y-1 px-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  active ? 'bg-emerald-700 text-white shadow-sm' : 'text-emerald-100/80 hover:bg-emerald-900/70 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {sidebarOpen && (
          <div className="p-4 border-t border-emerald-900 text-xs text-emerald-300/80">
            <div>Global CRV Sequence</div>
            <div className="font-mono text-white font-semibold mt-0.5">
              Next: CRV-{String(crvs.length + 1).padStart(4, '0')}
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-bold text-slate-900 text-base md:text-lg">{settings.jamboreeName}</h1>
              <select
                aria-label="Jamboree status"
                value={settings.status}
                onChange={(event) => handleJamboreeStatusChange(event.target.value)}
                disabled={activeRole !== 'System Administrator'}
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border-0 cursor-pointer disabled:cursor-not-allowed ${
                settings.status === 'Active' ? 'bg-emerald-100 text-emerald-800' :
                settings.status === 'Closed' ? 'bg-amber-100 text-amber-800' :
                settings.status === 'Archived' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'
              }`}>
                {['Draft', 'Active', 'Closed', 'Archived'].map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
            <p className="text-xs text-slate-500">{settings.venue} • {settings.startDate} to {settings.endDate}</p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-slate-500 uppercase">Active Role:</label>
            <select
              value={activeRole}
              onChange={(e) => setActiveRole(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-medium bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </header>

        {toast && (
          <div className={`mx-6 mt-4 px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-between shadow-sm ${
            toast.type === 'error' ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
          }`}>
            <span>{toast.msg}</span>
            <button onClick={() => setToast(null)} className="text-xs underline">Dismiss</button>
          </div>
        )}

        <main className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* REGISTRATION PRICING */}
          {activeTab === 'pricing' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Jamboree Registration Pricing</h2>
                <p className="text-sm text-slate-500 mt-1">Set the registration price for each Scout section. Prices are snapshotted for participants when their contingent is registered.</p>
              </div>
              <form onSubmit={handleSaveRegistrationRates} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200">
                  <h3 className="font-bold text-slate-800">Price by Section</h3>
                  <p className="text-xs text-slate-500 mt-1">Prices are entered in Philippine pesos (PHP).</p>
                </div>
                <div className="divide-y divide-slate-100">
                  {REGISTRATION_SECTIONS.map((section) => (
                    <label key={section} className="grid grid-cols-1 sm:grid-cols-2 items-center gap-3 px-4 py-3">
                      <span className="text-sm font-medium text-slate-700">{section}</span>
                      <div className="relative sm:max-w-xs">
                        <span className="absolute left-3 top-2 text-sm text-slate-500">₱</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          aria-label={`${section} registration price`}
                          value={rateForm[section]}
                          onChange={(e) => setRateForm((form) => ({ ...form, [section]: e.target.value }))}
                          disabled={activeRole !== 'System Administrator'}
                          className="w-full border border-slate-300 rounded-lg pl-8 pr-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500"
                        />
                      </div>
                    </label>
                  ))}
                </div>
                <div className="flex items-center justify-between gap-3 p-4 bg-slate-50 border-t border-slate-200">
                  <p className="text-xs text-slate-500">
                    {activeRole === 'System Administrator' ? 'Only new registrations use updated prices.' : 'System Administrator access is required to change prices.'}
                  </p>
                  <button
                    type="submit"
                    disabled={activeRole !== 'System Administrator'}
                    className="bg-[#115E34] hover:bg-[#0A361E] disabled:bg-slate-400 text-white font-semibold rounded-lg px-4 py-2 text-sm"
                  >
                    Save Prices
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                 <div className="text-xs font-semibold text-slate-500 uppercase">Registered Scouts</div>
                 <div className="text-2xl font-bold text-slate-900 mt-1">{metrics.totalScouts} Scouts</div>
                 <div className="text-xs text-emerald-700 mt-1">
                   {metrics.totalLeaders} Unit Leaders · {groups.length} Registered Contingents
                 </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                 <div className="text-xs font-semibold text-slate-500 uppercase">Total Registration Amount</div>
                 <div className="text-2xl font-bold text-emerald-800 mt-1">{formatPHP(metrics.totalExpected)}</div>
                 <div className="text-xs text-slate-500 mt-1">
                   {metrics.outstanding === 0
                     ? `Fully paid · Collected: ${formatPHP(metrics.totalCollected)}`
                     : `Collected: ${formatPHP(metrics.totalCollected)} · Receivable: ${formatPHP(metrics.outstanding)}`}
                 </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Monetary Donations</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">{formatPHP(metrics.totalDonations)}</div>
                  <div className="text-xs text-slate-500 mt-1">Segregated Sponsorship Fund</div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Total Cash & Bank Balance</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">{formatPHP(metrics.totalCash)}</div>
                  <div className="text-xs text-slate-500 mt-1">Across {accounts.length} Council Accounts</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <h2 className="font-bold text-slate-800 mb-4">Actual Registrations by Section</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                        <tr>
                          <th className="py-2 pr-4">Section</th>
                          <th className="py-2 px-4 text-right">Number Registered</th>
                          <th className="py-2 pl-4 text-right">Total Registration Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {registrationBreakdown.map((row) => (
                          <tr key={row.section}>
                            <td className="py-3 pr-4 font-medium">{row.section}</td>
                            <td className="py-3 px-4 text-right font-mono">{row.count}</td>
                            <td className="py-3 pl-4 text-right font-mono font-semibold">{formatPHP(row.totalAmount)}</td>
                          </tr>
                        ))}
                        <tr className="border-t-2 border-slate-200 font-bold">
                          <td className="py-3 pr-4">Total</td>
                          <td className="py-3 px-4 text-right font-mono">{metrics.totalParticipants}</td>
                          <td className="py-3 pl-4 text-right font-mono">{formatPHP(metrics.totalExpected)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <h2 className="font-bold text-slate-800 mb-4">Registered Scouts by Division</h2>
                  {divisionBreakdown.length ? (
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={divisionBreakdown} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={85} label={({ name, value }) => `${name}: ${value}`}>
                            {divisionBreakdown.map((division, index) => (
                              <Cell key={division.name} fill={chartColors[index % chartColors.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value} participants`, 'Registered']} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : <p className="text-sm text-slate-500">No participants registered by division yet.</p>}
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <h2 className="font-bold text-slate-800 mb-4">Registered Scouts by District (within Division)</h2>
                  {districtBreakdown.length ? (
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={districtBreakdown} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={85} label={({ name, value }) => `${name}: ${value}`}>
                            {districtBreakdown.map((district, index) => (
                              <Cell key={district.name} fill={chartColors[index % chartColors.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value} participants`, 'Registered']} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : <p className="text-sm text-slate-500">No participants registered by district yet.</p>}
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <h2 className="font-bold text-slate-800 mb-3">Recent CRV Issuances</h2>
                  <div className="space-y-3">
                    {crvs.slice(0, 5).map((c) => (
                      <div key={c.crvNo} className="flex items-center justify-between text-sm border-b border-slate-100 pb-2">
                        <div>
                          <div className="font-mono font-bold text-emerald-800">{c.crvNo}</div>
                          <div className="text-xs text-slate-500 truncate max-w-[180px]">{c.party}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{formatPHP(c.amount)}</div>
                          <button onClick={() => setSelectedCrv(c)} className="text-xs text-emerald-700 hover:underline">
                            View Voucher
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* REGISTRATION */}
          {activeTab === 'registration' && (
            <div className="space-y-6">
              <form onSubmit={(event) => handleRegisterContingent(event)} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
                <div>
                  <h2 className="font-bold text-slate-800">Register Contingent</h2>
                  <p className="text-xs text-slate-500 mt-1">Enter the contingent details and add its complete participant roster before registering.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                  <input
                    type="text"
                    placeholder="Division"
                    aria-label="Division"
                    value={regForm.division}
                    onChange={(e) => setRegForm({ ...regForm, division: e.target.value })}
                    className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    required
                  />
                  <input
                    type="text"
                    placeholder="District"
                    aria-label="District"
                    value={regForm.district}
                    onChange={(e) => setRegForm({ ...regForm, district: e.target.value })}
                    className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    required
                  />
                  <input
                    type="text"
                    placeholder="School or Unit"
                    aria-label="School or Unit"
                    value={regForm.school}
                    onChange={(e) => setRegForm({ ...regForm, school: e.target.value })}
                    className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Bank Transfer / Deposit Reference No."
                    aria-label="Bank Transfer / Deposit Reference Number"
                    value={regForm.bankReference}
                    onChange={(e) => setRegForm({ ...regForm, bankReference: e.target.value })}
                    className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    required
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 border-y border-slate-100 py-4">
                  <input
                    ref={rosterFileInput}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleRosterFile}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => rosterFileInput.current?.click()}
                    className="border border-emerald-700 text-emerald-800 hover:bg-emerald-50 font-semibold rounded-lg px-3 py-2 text-sm flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" /> Upload Excel / CSV
                  </button>
                  <span className="text-xs text-slate-500">Required columns: Full Name, Age, Gender, Section</span>
                  <div className="ml-auto flex gap-2">
                    <button
                      type="button"
                      onClick={() => downloadRegistrationTemplate('xlsx')}
                      className="text-xs font-semibold text-slate-600 hover:text-emerald-800 flex items-center gap-1"
                    >
                      <Download className="w-4 h-4" /> Excel Format
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadRegistrationTemplate('csv')}
                      className="text-xs font-semibold text-slate-600 hover:text-emerald-800 flex items-center gap-1"
                    >
                      <Download className="w-4 h-4" /> CSV Format
                    </button>
                  </div>
                </div>
                {importNotice && (
                  <div
                    role="status"
                    className={`whitespace-pre-wrap rounded-lg px-3 py-2 text-xs ${
                      importNotice.startsWith('Validated')
                        ? 'bg-emerald-50 text-emerald-800'
                        : 'bg-amber-50 text-amber-900'
                    }`}
                  >
                    {importNotice}
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-slate-700">Contingent Roster ({regForm.roster.length})</h3>
                    <button
                      type="button"
                      onClick={() => setRegForm((form) => ({
                        ...form,
                        roster: [...form.roster, {
                          rowId: Math.max(0, ...form.roster.map((member) => member.rowId)) + 1,
                          fullName: '',
                          age: '',
                          sex: 'Male',
                          category: 'Boy Scouts',
                        }],
                      }))}
                      className="text-sm font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" /> Add participant
                    </button>
                  </div>
                  {regForm.roster.map((member, index) => (
                    <div key={member.rowId} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center rounded-lg border border-slate-200 p-3">
                      <div className="md:col-span-1 text-xs font-semibold text-slate-500">#{index + 1}</div>
                      <input
                        type="text"
                        placeholder="Full name"
                        aria-label={`Participant ${index + 1} full name`}
                        value={member.fullName}
                        onChange={(e) => setRegForm((form) => ({
                          ...form,
                          roster: form.roster.map((row) => row.rowId === member.rowId ? { ...row, fullName: e.target.value } : row),
                        }))}
                        className="md:col-span-4 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                        required
                      />
                      <select
                        aria-label={`Participant ${index + 1} category`}
                        value={member.category}
                        onChange={(e) => setRegForm((form) => ({
                          ...form,
                          roster: form.roster.map((row) => row.rowId === member.rowId ? { ...row, category: e.target.value } : row),
                        }))}
                        className="md:col-span-3 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                      >
                        {Object.keys(rates).map((category) => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="0"
                        max="120"
                        step="1"
                        placeholder="Age"
                        aria-label={`Participant ${index + 1} age`}
                        value={member.age}
                        onChange={(e) => setRegForm((form) => ({
                          ...form,
                          roster: form.roster.map((row) => row.rowId === member.rowId ? { ...row, age: e.target.value } : row),
                        }))}
                        className="md:col-span-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                        required
                      />
                      <select
                        aria-label={`Participant ${index + 1} gender`}
                        value={member.sex}
                        onChange={(e) => setRegForm((form) => ({
                          ...form,
                          roster: form.roster.map((row) => row.rowId === member.rowId ? { ...row, sex: e.target.value } : row),
                        }))}
                        className="md:col-span-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                      >
                        <option>Male</option>
                        <option>Female</option>
                      </select>
                      <button
                        type="button"
                        aria-label={`Remove participant ${index + 1}`}
                        disabled={regForm.roster.length === 1}
                        onClick={() => setRegForm((form) => ({
                          ...form,
                          roster: form.roster.filter((row) => row.rowId !== member.rowId),
                        }))}
                        className="md:col-span-1 p-2 text-slate-400 hover:text-rose-700 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-[#115E34] hover:bg-[#0A361E] text-white font-semibold rounded-lg px-4 py-2.5 text-sm flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Register Contingent
                  </button>
                </div>
              </form>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="relative w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search contingent, participant, or school..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
                  >
                    <option value="All">All Categories</option>
                    {Object.keys(rates).map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Contingent</th>
                        <th className="px-4 py-3">School / Unit</th>
                        <th className="px-4 py-3">Division / District</th>
                        <th className="px-4 py-3 text-right">Participants</th>
                        <th className="px-4 py-3 text-right">Total Fees</th>
                        <th className="px-4 py-3 text-right">Paid</th>
                        <th className="px-4 py-3 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredGroups.map((group) => {
                        const groupParticipants = participants.filter((participant) => participant.groupId === group.id);
                        const totalFees = groupParticipants.reduce((sum, participant) => sum + participant.feeSnapshot, 0);
                        const totalPaid = groupParticipants.reduce((sum, participant) => sum + participant.paidAmount, 0);
                        const isExpanded = expandedGroupId === group.id;
                        return (
                          <React.Fragment key={group.id}>
                            <tr className="hover:bg-slate-50">
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => setExpandedGroupId(isExpanded ? null : group.id)}
                                  className="flex items-center gap-2 font-mono font-semibold text-emerald-800"
                                  aria-expanded={isExpanded}
                                >
                                  <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                  {group.refNo}
                                </button>
                              </td>
                              <td className="px-4 py-3 font-medium text-slate-900">{group.school}</td>
                              <td className="px-4 py-3 text-xs text-slate-600">{group.division}<br />{group.district}</td>
                              <td className="px-4 py-3 text-right">{groupParticipants.length}</td>
                              <td className="px-4 py-3 text-right font-mono">{formatPHP(totalFees)}</td>
                              <td className="px-4 py-3 text-right font-mono">{formatPHP(totalPaid)}</td>
                              <td className="px-4 py-3 text-right font-mono">{formatPHP(totalFees - totalPaid)}</td>
                            </tr>
                            {isExpanded && (
                              <tr>
                                <td colSpan="7" className="bg-slate-50 px-8 py-3">
                                  <div className="text-xs font-semibold uppercase text-slate-500 mb-2">
                                    Contingent Roster — {groupParticipants.length} participants
                                  </div>
                                  <div className="space-y-2">
                                    {groupParticipants.map((participant) => {
                                      const status = participant.paidAmount === 0 ? 'Unpaid' : participant.paidAmount < participant.feeSnapshot ? 'Partially Paid' : 'Fully Paid';
                                      return (
                                        <div key={participant.id} className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                                          <span className="font-mono font-semibold text-emerald-800">{participant.id}</span>
                                          <span className="font-medium text-slate-900">{participant.fullName}</span>
                                          <span>{participant.category}</span>
                                          <span className="font-mono">{formatPHP(participant.feeSnapshot)} fee · {formatPHP(participant.paidAmount)} paid</span>
                                          <span className={`font-semibold ${
                                            status === 'Fully Paid' ? 'text-emerald-700' :
                                            status === 'Partially Paid' ? 'text-amber-700' : 'text-rose-700'
                                          }`}>{status}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                      {filteredGroups.length === 0 && (
                        <tr>
                          <td colSpan="7" className="px-4 py-8 text-center text-sm text-slate-500">No contingents match your search.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* CRV REGISTER */}
          {activeTab === 'crv' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-slate-800">Cash Release Voucher (CRV) Register</h2>
                  <p className="text-xs text-slate-500">CRVs are issued when approved cash advances or purchase requests are released. Registration payments do not receive a CRV.</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3">CRV Serial</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Received From / Payee</th>
                      <th className="px-4 py-3">Method</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {crvs.map((c) => (
                      <tr key={c.crvNo} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono font-bold text-emerald-800">{c.crvNo}</td>
                        <td className="px-4 py-3">{c.date}</td>
                        <td className="px-4 py-3">{c.type}</td>
                        <td className="px-4 py-3">{c.party}</td>
                        <td className="px-4 py-3">{c.method} ({c.refNo})</td>
                        <td className="px-4 py-3 text-right font-mono font-semibold">{formatPHP(c.amount)}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => setSelectedCrv(c)} className="text-emerald-700 font-semibold text-xs hover:underline flex items-center gap-1">
                            <Printer className="w-3.5 h-3.5" /> Print CRV
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* DONATIONS */}
          {activeTab === 'donations' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200">
                <h2 className="font-bold text-slate-800">Segregated Monetary Donations Ledger</h2>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Donor / Organization</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Purpose</th>
                    <th className="px-4 py-3">Payment Reference</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {donations.map((d) => (
                    <tr key={d.id}>
                      <td className="px-4 py-3 font-medium">{d.donor}</td>
                      <td className="px-4 py-3">{d.date}</td>
                      <td className="px-4 py-3">{d.purpose}</td>
                      <td className="px-4 py-3 font-mono text-emerald-800">{d.refNo}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold">{formatPHP(d.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TOKENS */}
          {activeTab === 'tokens' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {tokens.map((t) => (
                <div key={t.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  {editingTokenId === t.id ? (
                    <>
                      <input
                        aria-label={`${t.name} title`}
                        type="text"
                        value={tokenDraft.name}
                        onChange={(event) => handleTokenDraftChange('name', event.target.value)}
                        className="w-full font-bold text-slate-800 border border-slate-300 rounded px-2 py-1"
                      />
                      <textarea
                        aria-label={`${t.name} description`}
                        value={tokenDraft.description}
                        onChange={(event) => handleTokenDraftChange('description', event.target.value)}
                        rows="2"
                        className="w-full text-xs text-slate-500 mt-1 border border-slate-300 rounded px-2 py-1 resize-y"
                      />
                    </>
                  ) : (
                    <>
                      <div className="font-bold text-slate-800">{t.name}</div>
                      <div className="text-xs text-slate-500 mt-1">{t.description}</div>
                    </>
                  )}
                  <div className="mt-4 flex justify-between text-sm">
                    <label className="text-slate-600" htmlFor={`${t.id}-available`}>Available Stock:</label>
                    <div className="flex items-center gap-2 font-mono font-bold text-emerald-800">
                      <input
                        id={`${t.id}-available`}
                        aria-label={`${t.name} available stock`}
                        type="number"
                        min="0"
                        max={editingTokenId === t.id ? tokenDraft.totalStock : t.totalStock}
                        step="1"
                        value={editingTokenId === t.id ? tokenDraft.available : t.totalStock - t.issued}
                        onChange={(event) => handleTokenDraftChange('available', event.target.value)}
                        disabled={editingTokenId !== t.id || activeRole !== 'System Administrator'}
                        className="w-20 rounded border border-slate-300 px-2 py-1 text-right text-sm disabled:bg-slate-50 disabled:border-transparent"
                      />
                      <span>/</span>
                      <input
                        aria-label={`${t.name} total stock`}
                        type="number"
                        min="0"
                        step="1"
                        value={editingTokenId === t.id ? tokenDraft.totalStock : t.totalStock}
                        onChange={(event) => handleTokenDraftChange('totalStock', event.target.value)}
                        disabled={editingTokenId !== t.id || activeRole !== 'System Administrator'}
                        className="w-20 rounded border border-slate-300 px-2 py-1 text-right text-sm disabled:bg-slate-50 disabled:border-transparent"
                      />
                    </div>
                  </div>
                  {activeRole === 'System Administrator' && (
                    <div className="mt-4 flex justify-end gap-2">
                      {editingTokenId === t.id ? (
                        <>
                          <button
                            type="button"
                            onClick={cancelTokenEdit}
                            className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => saveTokenEdit(t.id)}
                            className="px-3 py-1.5 bg-[#115E34] text-white rounded-lg text-sm font-semibold"
                          >
                            Save Changes
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startTokenEdit(t)}
                          disabled={editingTokenId !== null}
                          className="px-3 py-1.5 border border-[#115E34] text-[#115E34] rounded-lg text-sm font-semibold disabled:opacity-50"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* CASH ADVANCES */}
          {activeTab === 'advances' && (
            <div className="space-y-4">
              <form onSubmit={handleSubmitCashAdvance} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div>
                  <h2 className="font-bold text-slate-800">New Cash Advance / Purchase Request</h2>
                  <p className="text-xs text-slate-500 mt-1">Approval reserves the amount from available funds. After release, record the returned cash when liquidating to add it back to the funding account.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Requester</label>
                    <input
                      type="text"
                      aria-label="Cash advance requester"
                      value={caForm.requester}
                      onChange={(event) => setCaForm({ ...caForm, requester: event.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Request Category</label>
                    <select
                      aria-label="Cash advance category"
                      value={caForm.category}
                      onChange={(event) => setCaForm({ ...caForm, category: event.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option>Camp Logistics</option>
                      <option>Health & First Aid</option>
                      <option>Program & Awards</option>
                      <option>Food & Supplies</option>
                      <option>Transportation</option>
                      <option>Other Purchase</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Amount (PHP)</label>
                    <input
                      type="number"
                      aria-label="Cash advance amount"
                      min="0.01"
                      step="0.01"
                      value={caForm.amount}
                      onChange={(event) => setCaForm({ ...caForm, amount: event.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Date Needed</label>
                    <input
                      type="date"
                      aria-label="Cash advance date needed"
                      value={caForm.dateNeeded}
                      onChange={(event) => setCaForm({ ...caForm, dateNeeded: event.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div className="xl:row-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Description / Purpose</label>
                    <textarea
                      aria-label="Cash advance description"
                      value={caForm.purpose}
                      onChange={(event) => setCaForm({ ...caForm, purpose: event.target.value })}
                      placeholder="What will the cash advance or purchase be used for?"
                      className="w-full min-h-24 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button type="submit" className="bg-[#115E34] hover:bg-[#0A361E] text-white font-semibold px-4 py-2.5 rounded-lg text-sm">
                    Submit Request for Approval
                  </button>
                </div>
              </form>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200">
                  <h2 className="font-bold text-slate-800">Cash Advance Requests & Disbursement Controls</h2>
                  <p className="text-xs text-slate-500">Approval reserves funds. Release issues a Cash Release Voucher; Finance Admin records liquidation and returned cash.</p>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Ref ID</th>
                    <th className="px-4 py-3">Requester</th>
                    <th className="px-4 py-3">Purpose</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Cash Returned</th>
                    <th className="px-4 py-3">Workflow Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {advances.map((ca) => (
                    <tr key={ca.id}>
                      <td className="px-4 py-3 font-mono font-semibold">{ca.id}</td>
                      <td className="px-4 py-3">{ca.requester}</td>
                      <td className="px-4 py-3">{ca.purpose}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold">{formatPHP(ca.amount)}</td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
                          {ca.status} {ca.crvNo ? `(${ca.crvNo})` : ''}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {['Released', 'Partially Liquidated'].includes(ca.status) && (
                          <input
                            type="number"
                            aria-label={`${ca.id} cash returned`}
                            min="0"
                            max={ca.amount}
                            step="0.01"
                            value={ca.cashReturned ?? 0}
                            onChange={(event) => handleUpdateCashReturned(ca.id, event.target.value)}
                            disabled={!['Finance Admin', 'System Administrator'].includes(activeRole)}
                            className="w-32 border border-slate-300 rounded-lg px-2 py-1.5 text-sm disabled:bg-slate-50"
                          />
                        )}
                        {ca.status === 'Fully Liquidated' && (
                          <span className="text-sm font-mono text-emerald-800">{formatPHP(ca.cashReturned ?? 0)}</span>
                        )}
                        {['Pending', 'Approved', 'Rejected'].includes(ca.status) && <span className="text-xs text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3 space-x-2">
                        {ca.status === 'Pending' && (
                          <>
                            <button onClick={() => handleApproveAdvance(ca, 'Approved')} className="px-2.5 py-1 bg-emerald-700 text-white text-xs rounded font-semibold">
                              Approve
                            </button>
                            <button onClick={() => handleApproveAdvance(ca, 'Rejected')} className="px-2.5 py-1 bg-rose-600 text-white text-xs rounded font-semibold">
                              Reject
                            </button>
                          </>
                        )}
                        {ca.status === 'Approved' && (
                          <button onClick={() => handleReleaseAdvance(ca)} className="px-2.5 py-1 bg-amber-600 text-white text-xs rounded font-semibold">
                            Release Cash & Print CRV
                          </button>
                        )}
                        {['Released', 'Partially Liquidated'].includes(ca.status) && (
                          <button
                            onClick={() => handleLiquidateAdvance(ca)}
                            disabled={!['Finance Admin', 'System Administrator'].includes(activeRole)}
                            className="px-2.5 py-1 bg-emerald-700 text-white text-xs rounded font-semibold disabled:bg-slate-400"
                          >
                            Mark Liquidated
                          </button>
                        )}
                        {ca.status === 'Fully Liquidated' && (
                          <span className="text-xs font-semibold text-emerald-800">Liquidated</span>
                        )}
                        {ca.crvNo && (
                          <button
                            onClick={() => {
                              const voucher = crvs.find((item) => item.crvNo === ca.crvNo);
                              if (!voucher) return notify(`Voucher ${ca.crvNo} could not be found.`, 'error');
                              setSelectedCrv(voucher);
                            }}
                            className="px-2.5 py-1 border border-emerald-700 text-emerald-800 text-xs rounded font-semibold"
                          >
                            Print CRV
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}

          {/* LIQUIDATIONS */}
          {activeTab === 'liquidations' && (
            <div className="space-y-4">
              {liquidations.map((liq) => {
                const acceptedTotal = liq.items.filter((i) => i.status === 'Accepted').reduce((s, i) => s + i.amount, 0);
                const unusedReturn = liq.advanceAmount - acceptedTotal;
                return (
                  <div key={liq.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex flex-wrap justify-between items-center border-b border-slate-200 pb-3 mb-3">
                      <div>
                        <div className="font-bold text-slate-800">{liq.id} — Linked to {liq.advanceId} ({liq.crvNo})</div>
                        <div className="text-xs text-slate-500">Requester: {liq.requester} • Advance: {formatPHP(liq.advanceAmount)}</div>
                      </div>
                      <div className="text-right text-sm">
                        <div>Liquidation Status: <span className="font-semibold">{liq.status}</span></div>
                        <div>Accepted Expenses: <span className="font-mono font-bold text-emerald-800">{formatPHP(acceptedTotal)}</span></div>
                        <div>Unused Cash Return Due (based on accepted expenses): <span className="font-mono font-bold text-amber-700">{formatPHP(unusedReturn)}</span></div>
                        <div>Cash Returned to Fund: <span className="font-mono font-bold text-emerald-800">{formatPHP(liq.cashReturned ?? 0)}</span></div>
                      </div>
                    </div>
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                        <tr>
                          <th className="px-3 py-2">Date</th>
                          <th className="px-3 py-2">Category</th>
                          <th className="px-3 py-2">Description & OR</th>
                          <th className="px-3 py-2 text-right">Amount</th>
                          <th className="px-3 py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {liq.items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-3 py-2">{item.date}</td>
                            <td className="px-3 py-2">{item.category}</td>
                            <td className="px-3 py-2">{item.description}</td>
                            <td className="px-3 py-2 text-right font-mono">{formatPHP(item.amount)}</td>
                            <td className="px-3 py-2">{item.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          )}

          {/* CASH ACCOUNTS */}
          {activeTab === 'accounts' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {accounts.map((acc) => (
                <div key={acc.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="text-xs font-semibold text-slate-500 uppercase">{acc.type}</div>
                  <div className="font-bold text-slate-900 text-base mt-1">{acc.name}</div>
                  <div className="text-2xl font-mono font-bold text-emerald-800 mt-3">{formatPHP(acc.balance)}</div>
                </div>
              ))}
            </div>
          )}

          {/* REPORTS */}
          {activeTab === 'reports' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="font-bold text-slate-800 text-base">Jamboree Statement of Cash Receipts & Disbursements</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <div className="font-bold text-emerald-900">CASH INFLOWS</div>
                  <div className="flex justify-between"><span>Registration Fee Collections:</span><span className="font-mono">{formatPHP(metrics.totalCollected)}</span></div>
                  <div className="flex justify-between"><span>Segregated Monetary Donations:</span><span className="font-mono">{formatPHP(metrics.totalDonations)}</span></div>
                  <div className="flex justify-between font-bold border-t pt-2"><span>Total Inflows:</span><span className="font-mono">{formatPHP(metrics.totalCollected + metrics.totalDonations)}</span></div>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <div className="font-bold text-rose-900">OUTFLOWS & ADVANCES</div>
                  <div className="flex justify-between"><span>Approved / Released Cash Advances:</span><span className="font-mono">{formatPHP(metrics.releasedAdvances)}</span></div>
                  <div className="flex justify-between font-bold border-t pt-2"><span>Net Ending Cash Position:</span><span className="font-mono">{formatPHP(metrics.totalCash)}</span></div>
                </div>
              </div>
            </div>
          )}

          {/* SETTINGS & AUDIT LOGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h2 className="font-bold text-slate-800">Jamboree Lifecycle Status & Governance</h2>
                <div className="flex flex-wrap gap-2">
                  {['Draft', 'Active', 'Closed', 'Archived'].map((st) => (
                    <button
                      key={st}
                      onClick={() => handleJamboreeStatusChange(st)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
                        settings.status === st ? 'bg-[#115E34] text-white border-[#115E34]' : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500">
                  Note: Closing an event still allows late registrations, collections, liquidations, and adjustments. Only <strong>Archived</strong> locks ordinary transactions.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 font-bold text-slate-800">Immutable Security & Financial Audit Trail</div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-2.5">Timestamp</th>
                      <th className="px-4 py-2.5">Actor Role</th>
                      <th className="px-4 py-2.5">Action</th>
                      <th className="px-4 py-2.5">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="px-4 py-2 font-mono">{log.timestamp}</td>
                        <td className="px-4 py-2 font-semibold">{log.actor}</td>
                        <td className="px-4 py-2 font-mono text-emerald-800">{log.action}</td>
                        <td className="px-4 py-2">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {registrationConfirmation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setRegistrationConfirmation(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="registration-confirm-title"
            className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
          >
            <header className="border-b border-slate-200 p-5">
              <h2 id="registration-confirm-title" className="text-lg font-bold text-slate-900">Confirm Registration</h2>
              <p className="mt-1 text-sm text-slate-500">Review the contingent roster and fee breakdown. The shared bank reference is saved with the registration payment; CRVs are reserved for cash advance or purchase releases.</p>
            </header>

            <div className="space-y-5 overflow-y-auto p-5">
              <div className="grid grid-cols-1 gap-3 rounded-lg bg-slate-50 p-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
                <div><span className="block text-xs font-semibold uppercase text-slate-500">School / Unit</span><span className="font-medium text-slate-900">{registrationConfirmation.group.school}</span></div>
                <div><span className="block text-xs font-semibold uppercase text-slate-500">Division</span><span className="font-medium text-slate-900">{registrationConfirmation.group.division}</span></div>
                <div><span className="block text-xs font-semibold uppercase text-slate-500">District</span><span className="font-medium text-slate-900">{registrationConfirmation.group.district}</span></div>
                <div><span className="block text-xs font-semibold uppercase text-slate-500">Bank Transfer / Deposit Reference No.</span><span className="font-medium text-slate-900">{registrationConfirmation.group.bankReference}</span></div>
              </div>

              {registrationConfirmation.duplicateMatches.length > 0 && (
                <div className="flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
                  <div>
                    <div className="font-bold">Possible duplicate participants found</div>
                    <p className="mt-1 text-xs">
                      {registrationConfirmation.duplicateMatches.map((participant) => `${participant.fullName} (${participant.id}, ${participant.school})`).join('; ')}
                    </p>
                    <p className="mt-1 text-xs">Confirm only if these are separate participants.</p>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Participant</th>
                      <th className="px-4 py-3">Age</th>
                      <th className="px-4 py-3">Gender</th>
                      <th className="px-4 py-3">Section</th>
                      <th className="px-4 py-3 text-right">Registration Fee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {registrationConfirmation.participants.map((participant) => (
                      <tr key={participant.id}>
                        <td className="px-4 py-3 font-medium text-slate-900">{participant.fullName}</td>
                        <td className="px-4 py-3">{participant.age}</td>
                        <td className="px-4 py-3">{participant.sex}</td>
                        <td className="px-4 py-3">{participant.category}</td>
                        <td className="px-4 py-3 text-right font-mono">{formatPHP(participant.feeSnapshot)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="rounded-lg border border-slate-200">
                <div className="border-b border-slate-200 px-4 py-3 text-sm font-bold text-slate-800">Fee Breakdown by Section</div>
                <div className="divide-y divide-slate-100">
                  {REGISTRATION_SECTIONS.filter((section) =>
                    registrationConfirmation.participants.some((participant) => participant.category === section)
                  ).map((section) => {
                    const sectionParticipants = registrationConfirmation.participants.filter((participant) => participant.category === section);
                    const subtotal = sectionParticipants.reduce((sum, participant) => sum + participant.feeSnapshot, 0);
                    return (
                      <div key={section} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                        <span className="text-slate-700">{section} <span className="text-xs text-slate-500">({sectionParticipants.length} × {formatPHP(rates[section])})</span></span>
                        <span className="font-mono font-semibold text-slate-900">{formatPHP(subtotal)}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 bg-emerald-50 px-4 py-4">
                  <div>
                    <div className="font-bold text-emerald-950">Total Paid by Bank Transfer</div>
                    <div className="text-xs text-emerald-800">{registrationConfirmation.participants.length} participants · no CRV issued for registration</div>
                  </div>
                  <div className="text-lg font-bold font-mono text-emerald-950">
                    {formatPHP(registrationConfirmation.participants.reduce((sum, participant) => sum + participant.feeSnapshot, 0))}
                  </div>
                </div>
              </div>
            </div>

            <footer className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 p-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setRegistrationConfirmation(null)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Review / Cancel
              </button>
              <button
                type="button"
                onClick={confirmContingentRegistration}
                className="flex items-center justify-center gap-2 rounded-lg bg-[#115E34] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0A361E]"
              >
                <CheckCircle2 className="h-4 w-4" /> Confirm & Mark Paid
              </button>
            </footer>
          </section>
        </div>
      )}

      {/* Printable CRV Modal */}
      {selectedCrv && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-xl space-y-4">
            <div id="printable-crv-voucher" className="border-2 border-slate-800 p-6 space-y-4">
              <div className="text-center border-b-2 border-slate-800 pb-3">
                <div className="text-xs font-bold tracking-widest uppercase">Boy Scouts of the Philippines</div>
                <div className="text-lg font-black text-[#0A361E]">AGUSAN COUNCIL</div>
                <div className="text-xs text-slate-600">{settings.jamboreeName} • {settings.venue}</div>
                <div className="mt-2 inline-block px-3 py-1 bg-slate-900 text-white font-bold text-xs tracking-wider uppercase">
                  Cash Release Voucher ({selectedCrv.type})
                </div>
              </div>

              <div className="flex justify-between text-sm">
                <div><span className="font-semibold">Serial No.:</span> <span className="font-mono font-bold text-rose-700">{selectedCrv.crvNo}</span></div>
                <div><span className="font-semibold">Date Issued:</span> {selectedCrv.date}</div>
              </div>

              <div className="space-y-2 text-sm border-y border-slate-300 py-3">
                <div><span className="font-semibold">Received From / Payee:</span> {selectedCrv.party}</div>
                <div><span className="font-semibold">Amount in Figures:</span> <span className="font-mono font-bold text-base">{formatPHP(selectedCrv.amount)}</span></div>
                <div><span className="font-semibold">Amount in Words:</span> <span className="italic">{numberToWordsPHP(selectedCrv.amount)}</span></div>
                <div><span className="font-semibold">Particulars:</span> {selectedCrv.description}</div>
                <div><span className="font-semibold">Payment Method:</span> {selectedCrv.method} (Ref: {selectedCrv.refNo})</div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-6 text-xs text-center">
                <div>
                  <div className="border-b border-slate-800 pb-1 font-semibold">{selectedCrv.issuedBy}</div>
                  <div className="text-slate-500 mt-1">Issued By / Authorized Signature</div>
                </div>
                <div>
                  <div className="border-b border-slate-800 pb-1 font-semibold">&nbsp;</div>
                  <div className="text-slate-500 mt-1">Received / Acknowledged By</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setSelectedCrv(null)} className="px-4 py-2 text-sm border border-slate-300 rounded-lg">
                Close
              </button>
              <button onClick={() => window.print()} className="px-4 py-2 text-sm bg-[#115E34] text-white font-semibold rounded-lg flex items-center gap-2">
                <Printer className="w-4 h-4" /> Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
