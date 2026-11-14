export const INITIAL_TRANSACTIONS = [
  { id: 'T1', date: '2026-11-01', merchant: 'Razorpay Freelance Payout', amount: 45000, type: 'CREDIT', category: 'Income', isRecurring: false, zScore: 0.4, isAnomaly: false },
  { id: 'T2', date: '2026-11-03', merchant: 'Airtel Fiber Postpaid', amount: 1178, type: 'DEBIT', category: 'Utilities', isRecurring: true, zScore: 0.1, isAnomaly: false },
  { id: 'T3', date: '2026-11-05', merchant: 'NoBroker House Rent UPI', amount: 16000, type: 'DEBIT', category: 'Housing', isRecurring: true, zScore: 0.0, isAnomaly: false },
  { id: 'T4', date: '2026-11-07', merchant: 'Swiggy Instamart Bulk Order', amount: 4850, type: 'DEBIT', category: 'Food & Dining', isRecurring: false, zScore: 3.45, isAnomaly: true },
  { id: 'T5', date: '2026-11-10', merchant: 'HDFC Education Loan Auto-Debit', amount: 6500, type: 'DEBIT', category: 'EMI & Debt', isRecurring: true, zScore: 0.0, isAnomaly: false },
  { id: 'T6', date: '2026-11-12', merchant: 'BESCOM Electricity Bill', amount: 1420, type: 'DEBIT', category: 'Utilities', isRecurring: true, zScore: 0.3, isAnomaly: false },
  { id: 'T7', date: '2026-11-14', merchant: 'Upwork Client Milestone', amount: 28000, type: 'CREDIT', category: 'Income', isRecurring: false, zScore: 0.2, isAnomaly: false },
  { id: 'T8', date: '2026-11-18', merchant: 'Netflix & Spotify Bundle', amount: 848, type: 'DEBIT', category: 'Subscriptions', isRecurring: true, zScore: 0.0, isAnomaly: false }
];

export const RECURRING_COMMITMENTS = [
  { id: 'R1', name: 'House Rent (UPI AutoPay)', amount: 16000, dayOfMonth: 5, category: 'Housing' },
  { id: 'R2', name: 'HDFC Education Loan EMI', amount: 6500, dayOfMonth: 10, category: 'EMI & Debt' },
  { id: 'R3', name: 'Airtel Fiber & BESCOM Utilities', amount: 2600, dayOfMonth: 12, category: 'Utilities' },
  { id: 'R4', name: 'Cloud & OTT Subscriptions', amount: 1250, dayOfMonth: 18, category: 'Subscriptions' }
];

export function parseIndianBankSms(smsText) {
  const amountMatch = smsText.match(/(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)/i);
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 1200;
  const isCredit = /credited|received|deposited/i.test(smsText);

  let merchant = 'UPI Merchant Transfer';
  const toMatch = smsText.match(/(?:to|at|from|info:)\s+([A-Za-z0-9\s.&_-]{3,25})/i);
  if (toMatch) merchant = toMatch[1].trim();

  const lower = smsText.toLowerCase();
  let category = 'General Expense';
  if (isCredit) category = 'Income';
  else if (lower.includes('swiggy') || lower.includes('zomato') || lower.includes('darshan')) category = 'Food & Dining';
  else if (lower.includes('uber') || lower.includes('ola') || lower.includes('irctc')) category = 'Transport';
  else if (lower.includes('rent') || lower.includes('nobroker')) category = 'Housing';
  else if (lower.includes('emi') || lower.includes('loan') || lower.includes('hdfc')) category = 'EMI & Debt';

  const baselineMean = category === 'Food & Dining' ? 450 : 1200;
  const baselineStd = category === 'Food & Dining' ? 380 : 600;
  const zScore = !isCredit ? Number(((amount - baselineMean) / baselineStd).toFixed(2)) : 0.2;

  return {
    id: 'T' + Date.now(),
    date: new Date().toISOString().split('T')[0],
    merchant,
    amount,
    type: isCredit ? 'CREDIT' : 'DEBIT',
    category,
    isRecurring: /emi|autopay|subscription|rent/i.test(smsText),
    zScore: Math.max(0, zScore),
    isAnomaly: !isCredit && zScore > 2.5
  };
}