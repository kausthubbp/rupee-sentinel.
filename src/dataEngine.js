export const INITIAL_TRANSACTIONS = [
  { id: 'T1', date: '2026-11-12', merchant: 'Freelance Web Project', amount: 42000, type: 'CREDIT', category: 'Work Income', isAnomaly: false },
  { id: 'T2', date: '2026-11-10', merchant: 'Home Rent Transfer', amount: 16000, type: 'DEBIT', category: 'Monthly Rent', isAnomaly: false },
  { id: 'T3', date: '2026-11-08', merchant: 'Emergency Appliance Repair', amount: 6800, type: 'DEBIT', category: 'Home Repair', isAnomaly: true },
  { id: 'T4', date: '2026-11-05', merchant: 'Fresh Kirana & Vegetables', amount: 1450, type: 'DEBIT', category: 'Daily Groceries', isAnomaly: false }
];

export function parseIndianBankSms(smsText) {
  const amtMatch = smsText.match(/(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)/i);
  const amount = amtMatch ? parseFloat(amtMatch[1].replace(/,/g, '')) : 500;
  const isCredit = /credited|received|deposited/i.test(smsText);
  const merchantMatch = smsText.match(/(?:to|at|from)\s+([A-Za-z0-9\s&.-]+?)(?:\s+on|\s+via|\s+UPI|\.|$)/i);
  const merchant = merchantMatch ? merchantMatch[1].trim() : 'UPI Bank Alert';

  return {
    id: 'SMS-' + Date.now(),
    date: new Date().toISOString().split('T')[0],
    merchant,
    amount,
    type: isCredit ? 'CREDIT' : 'DEBIT',
    category: isCredit ? 'Money Received' : 'UPI Spend',
    isAnomaly: !isCredit && amount > 4000
  };
}

export function parseStatementText(rawText) {
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const parsedList = [];

  lines.forEach((line, idx) => {
    if (idx === 0 && /date|narration|particulars|amount|debit|credit/i.test(line)) return;
    const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
    let merchant = parts.length >= 3 ? (parts[1] || parts[0]) : line.slice(0, 28);
    let amount = 0;
    const type = /cr|credit|deposit|salary|freelance|received/i.test(line) ? 'CREDIT' : 'DEBIT';

    if (parts.length >= 3) {
      const nums = parts.slice(2).map(v => parseFloat(v.replace(/[₹,Rs\s]/gi, ''))).filter(n => !isNaN(n) && n > 0);
      if (nums.length > 0) amount = nums[0];
    } else {
      const m = line.match(/(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i);
      if (m) amount = parseFloat(m[1].replace(/,/g, ''));
    }

    if (amount > 0) {
      parsedList.push({
        id: 'ST-' + Date.now() + '-' + idx,
        date: new Date().toISOString().split('T')[0],
        merchant,
        amount,
        type,
        category: type === 'CREDIT' ? 'Statement Income' : 'Statement Spend',
        isAnomaly: type === 'DEBIT' && amount > 4000
      });
    }
  });
  return parsedList;
}