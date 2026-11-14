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