import React, { useState, useMemo, useRef } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';
import {
  ShieldCheck, ThumbsUp, OctagonAlert, Sparkles, ArrowRight,
  IndianRupee, Smartphone, Bike, Laptop, ShoppingBag,
  PlusCircle, MinusCircle, MessageSquareText, Wallet, Upload, FileCheck2
} from 'lucide-react';
import { INITIAL_TRANSACTIONS, parseIndianBankSms, parseStatementText } from './dataEngine';

function randomNormal(mean, stdDev) {
  const u1 = Math.max(1e-7, Math.random());
  const u2 = Math.random();
  return mean + Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2) * stdDev;
}

function runMonteCarloSimulation(currentBalance, purchaseAmount, purchaseDay, runs = 500, days = 60) {
  const allPaths = Array.from({ length: runs }, () => new Array(days));
  for (let r = 0; r < runs; r++) {
    let bal = currentBalance;
    const inc1 = 15 + Math.round(randomNormal(0, 2));
    const inc2 = 45 + Math.round(randomNormal(0, 2));
    for (let d = 1; d <= days; d++) {
      const dom = ((d - 1) % 30) + 1;
      bal -= Math.max(80, randomNormal(520, 280));
      if (dom === 5) bal -= 16000;
      if (dom === 10) bal -= 6500;
      if (dom === 12) bal -= 2600;
      if (dom === 18) bal -= 1250;
      if (d === inc1) bal += 42000;
      if (d === inc2) bal += 38000;
      if (d === purchaseDay && purchaseAmount > 0) bal -= purchaseAmount;
      allPaths[r][d - 1] = bal;
    }
  }
  const timeline = [];
  let dangerDays = 0;
  for (let d = 0; d < days; d++) {
    const sorted = allPaths.map(p => p[d]).sort((a, b) => a - b);
    const p10 = Math.round(sorted[Math.floor(runs * 0.10)]);
    const p50 = Math.round(sorted[Math.floor(runs * 0.50)]);
    if (p10 < 10000) dangerDays++;
    timeline.push({ day: `Day ${d + 1}`, worstCase: p10, normalBalance: p50 });
  }
  return { timeline, shortageRisk: Math.min(99, Math.round((dangerDays / days) * 100)) };
}

export default function App() {
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [currentBalance, setCurrentBalance] = useState(54200);
  const [purchaseAmount, setPurchaseAmount] = useState(15000);
  const [purchaseDay, setPurchaseDay] = useState(3);
  const [smsInput, setSmsInput] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');
  const fileInputRef = useRef(null);

  const fixedBills = 26350;
  const safetySavings = 10000;
  const safeToSpend = Math.max(0, currentBalance - fixedBills - safetySavings);

  const { timeline, shortageRisk } = useMemo(
    () => runMonteCarloSimulation(currentBalance, purchaseAmount, purchaseDay, 500, 60),
    [currentBalance, purchaseAmount, purchaseDay]
  );

  const optimalSafeDay = useMemo(() => {
    if (purchaseAmount === 0) return 1;
    for (let d = 1; d <= 45; d++) {
      if (runMonteCarloSimulation(currentBalance, purchaseAmount, d, 150, 60).shortageRisk <= 5) return d;
    }
    return 17;
  }, [currentBalance, purchaseAmount]);

  const isDanger = shortageRisk > 15;

  const bucketData = [
    { name: 'Total in Bank', amount: currentBalance, color: '#2563eb' },
    { name: 'Must-Pay Bills', amount: fixedBills, color: '#f59e0b' },
    { name: 'Emergency Savings', amount: safetySavings, color: '#6366f1' },
    { name: 'Free to Spend', amount: safeToSpend, color: '#16a34a' }
  ];

  const applyEntries = (items, label) => {
    if (!items.length) return setUploadStatus('No valid amounts found in file.');
    setTransactions(prev => [...items, ...prev]);
    const net = items.reduce((s, x) => (x.type === 'CREDIT' ? s + x.amount : s - x.amount), 0);
    setCurrentBalance(prev => Math.max(0, prev + net));
    setUploadStatus(`Added ${items.length} entries from ${label}!`);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => applyEntries(parseStatementText(String(ev.target?.result || '')), file.name);
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSampleCsv = () => {
    const csv = 'Date,Description,Amount,Type\n2026-11-14,Client Payment,18000,CREDIT\n2026-11-14,Grocery & Ration,2400,DEBIT\n2026-11-14,Festival Shopping,5200,DEBIT';
    applyEntries(parseStatementText(csv), 'Sample Statement');
  };

  const handleQuickAdd = (type, amount, merchant) => {
    setTransactions(prev => [{
      id: 'T' + Date.now(), date: new Date().toISOString().split('T')[0], merchant, amount, type,
      category: type === 'CREDIT' ? 'Money Received' : 'Daily Expense', isAnomaly: type === 'DEBIT' && amount > 4000
    }, ...prev]);
    setCurrentBalance(prev => (type === 'CREDIT' ? prev + amount : Math.max(0, prev - amount)));
  };

  const handleSms = (e) => {
    e.preventDefault();
    if (!smsInput.trim()) return;
    const p = parseIndianBankSms(smsInput);
    setTransactions(prev => [p, ...prev]);
    setCurrentBalance(prev => (p.type === 'CREDIT' ? prev + p.amount : Math.max(0, prev - p.amount)));
    setSmsInput('');
  };

  return (
    <div className="min-h-screen bg-[#f4f8ff] text-slate-900 font-sans pb-16">
      <header className="bg-white border-b-2 border-blue-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-5 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-200">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-blue-950">Rupee Sentinel</h1>
              <p className="text-xs font-medium text-blue-600">Your Simple Money Guard</p>
            </div>
          </div>
          <div>
            <input ref={fileInputRef} type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition">
              <Upload className="w-4 h-4" /> Upload Bank Statement
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 pt-7 space-y-7">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-3xl p-6 shadow-lg shadow-blue-200">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase text-blue-100">1. Total Money in Bank</span>
              <Wallet className="w-5 h-5 text-blue-200" />
            </div>
            <div className="text-4xl font-black mt-3 flex items-center"><IndianRupee className="w-7 h-7 mr-0.5 text-blue-200" />{currentBalance.toLocaleString('en-IN')}</div>
            <p className="text-xs text-blue-100 mt-2">All the money you have right now.</p>
          </div>

          <div className="bg-white border-2 border-blue-100 rounded-3xl p-6 shadow-sm">
            <span className="text-xs font-bold uppercase text-amber-600">2. Keep Aside for Bills & Safety</span>
            <div className="text-4xl font-black text-slate-900 mt-3 flex items-center"><IndianRupee className="w-7 h-7 mr-0.5 text-amber-500" />{(fixedBills + safetySavings).toLocaleString('en-IN')}</div>
            <p className="text-xs text-slate-500 mt-2">₹26,350 for Rent/EMI + ₹10,000 Emergency Savings.</p>
          </div>

          <div className="bg-white border-2 border-emerald-200 rounded-3xl p-6 shadow-sm">
            <span className="text-xs font-bold uppercase text-emerald-600">3. Free Money You Can Spend</span>
            <div className="text-4xl font-black text-emerald-600 mt-3 flex items-center"><IndianRupee className="w-7 h-7 mr-0.5 text-emerald-500" />{safeToSpend.toLocaleString('en-IN')}</div>
            <p className="text-xs text-slate-500 mt-2">Safe to use without missing any bill!</p>
          </div>
        </div>

        <div className="bg-white border-2 border-blue-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-blue-950">Should I Buy Something Big?</h2>
            <p className="text-sm text-slate-500">Tap an item below to see if your bill money stays safe.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Nothing (₹0)', amount: 0, icon: ShoppingBag },
              { label: 'Bike / Shop (₹5,000)', amount: 5000, icon: Bike },
              { label: 'New Phone (₹15,000)', amount: 15000, icon: Smartphone },
              { label: 'Laptop (₹35,000)', amount: 35000, icon: Laptop }
            ].map(item => {
              const Icon = item.icon;
              const active = purchaseAmount === item.amount;
              return (
                <button key={item.amount} onClick={() => setPurchaseAmount(item.amount)} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition ${active ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-blue-50/50 border-blue-100 text-blue-950 hover:bg-blue-50'}`}>
                  <Icon className={`w-6 h-6 ${active ? 'text-white' : 'text-blue-600'}`} />
                  <span className="text-xs font-bold">{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100 space-y-2">
              <div className="flex justify-between text-sm font-bold"><span className="text-blue-950">Item Price:</span><span className="text-blue-600">₹{purchaseAmount.toLocaleString('en-IN')}</span></div>
              <input type="range" min="0" max="50000" step="1000" value={purchaseAmount} onChange={e => setPurchaseAmount(Number(e.target.value))} className="w-full accent-blue-600 cursor-pointer h-2" />
            </div>
            <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100 space-y-2">
              <div className="flex justify-between text-sm font-bold"><span className="text-blue-950">Buy After How Many Days?</span><span className="text-blue-600">In {purchaseDay} Days</span></div>
              <input type="range" min="1" max="45" step="1" value={purchaseDay} onChange={e => setPurchaseDay(Number(e.target.value))} className="w-full accent-blue-600 cursor-pointer h-2" />
            </div>
          </div>

          <div className={`p-5 rounded-2xl border-2 flex flex-wrap items-center justify-between gap-4 ${isDanger ? 'bg-red-50 border-red-300 text-red-950' : 'bg-emerald-50 border-emerald-300 text-emerald-950'}`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${isDanger ? 'bg-red-600' : 'bg-emerald-600'}`}>
                {isDanger ? <OctagonAlert className="w-7 h-7" /> : <ThumbsUp className="w-7 h-7" />}
              </div>
              <div>
                <h3 className={`text-lg font-extrabold ${isDanger ? 'text-red-700' : 'text-emerald-700'}`}>
                  {isDanger ? `STOP! Buying on Day ${purchaseDay} will hurt your Rent & EMI!` : `YES! Safe to buy ₹${purchaseAmount.toLocaleString('en-IN')} on Day ${purchaseDay}.`}
                </h3>
                <p className="text-xs font-medium opacity-85 mt-0.5">
                  {isDanger ? 'You will run short of money for your ₹16,000 Rent and ₹6,500 Loan EMI.' : 'All your bills and ₹10,000 emergency savings stay 100% safe.'}
                </p>
              </div>
            </div>
            {isDanger && purchaseDay !== optimalSafeDay && (
              <button onClick={() => setPurchaseDay(optimalSafeDay)} className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md">
                <Sparkles className="w-4 h-4" /> Buy on Day {optimalSafeDay} Instead (Safe!) <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white border-2 border-blue-100 rounded-3xl p-6 shadow-sm space-y-3">
            <h2 className="text-base font-extrabold text-blue-950">1. Your Money Over the Next 60 Days</h2>
            <p className="text-xs text-slate-500">Keep the <strong className="text-blue-600">Blue Line</strong> above the <strong className="text-red-600">Red Danger Line</strong>!</p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeline} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 11 }} interval={9} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={v => `₹${Math.round(v / 1000)}k`} />
                  <Tooltip formatter={(val, name) => [`₹${Number(val).toLocaleString('en-IN')}`, name === 'normalBalance' ? 'Expected Money' : 'If Income Delays']} />
                  <ReferenceLine y={10000} stroke="#dc2626" strokeWidth={2} strokeDasharray="5 5" label={{ value: 'RED DANGER LINE (₹10k)', fill: '#dc2626', fontSize: 11, fontWeight: 'bold', position: 'insideBottomRight' }} />
                  <Area type="monotone" dataKey="normalBalance" stroke="#2563eb" fill="#bfdbfe" strokeWidth={3} />
                  <Area type="monotone" dataKey="worstCase" stroke="#f59e0b" fill="none" strokeDasharray="4 4" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white border-2 border-blue-100 rounded-3xl p-6 shadow-sm space-y-3">
            <h2 className="text-base font-extrabold text-blue-950">2. Where Your Money Goes</h2>
            <p className="text-xs text-slate-500">See how your bank balance is divided today.</p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bucketData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={v => `₹${Math.round(v / 1000)}k`} />
                  <YAxis type="category" dataKey="name" width={105} stroke="#334155" tick={{ fontSize: 11, fontWeight: 600 }} />
                  <Tooltip formatter={val => [`₹${Number(val).toLocaleString('en-IN')}`, 'Amount']} />
                  <Bar dataKey="amount" radius={[0, 10, 10, 0]} barSize={26}>
                    {bucketData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border-2 border-blue-100 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquareText className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-extrabold text-blue-950">Upload Statement or Add Entry</h2>
            </div>

            <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-blue-300 hover:border-blue-600 bg-blue-50/50 rounded-2xl p-4 text-center cursor-pointer transition space-y-1">
              <Upload className="w-6 h-6 text-blue-600 mx-auto" />
              <p className="text-xs font-extrabold text-blue-950">Click here to upload Bank Statement (.CSV or .TXT)</p>
              <p className="text-[11px] text-slate-500">Automatically reads all income and expenses from your file</p>
            </div>

            <div className="flex items-center justify-between">
              <button type="button" onClick={handleSampleCsv} className="text-xs font-bold text-blue-600 underline">Or load a sample bank statement</button>
              {uploadStatus && <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1"><FileCheck2 className="w-3.5 h-3.5" /> {uploadStatus}</span>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => handleQuickAdd('CREDIT', 10000, 'Work / Shop Earnings')} className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs flex items-center justify-center gap-2">
                <PlusCircle className="w-4 h-4 text-emerald-600" /> + ₹10,000 Earned
              </button>
              <button onClick={() => handleQuickAdd('DEBIT', 4800, 'Big Market / Food Spend')} className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-800 font-bold text-xs flex items-center justify-center gap-2">
                <MinusCircle className="w-4 h-4 text-red-600" /> - ₹4,800 Big Spend
              </button>
            </div>

            <form onSubmit={handleSms} className="flex gap-2">
              <input type="text" value={smsInput} onChange={e => setSmsInput(e.target.value)} placeholder="Or paste bank SMS here..." className="flex-1 rounded-xl bg-blue-50/50 border border-blue-200 px-3 py-2 text-xs" />
              <button type="submit" className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs">Read SMS</button>
            </form>
          </div>

          <div className="bg-white border-2 border-blue-100 rounded-3xl p-6 shadow-sm space-y-3">
            <h2 className="text-base font-extrabold text-blue-950">Your Simple Passbook</h2>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {transactions.slice(0, 6).map(tx => (
                <div key={tx.id} className={`flex items-center justify-between p-3 rounded-2xl border text-xs ${tx.isAnomaly ? 'bg-red-50 border-red-200' : 'bg-blue-50/40 border-blue-100'}`}>
                  <div>
                    <p className="font-bold text-slate-900">{tx.merchant}</p>
                    <p className="text-[11px] text-slate-500">{tx.category}{tx.isAnomaly && <span className="ml-2 text-red-600 font-bold">• Extra High Spend!</span>}</p>
                  </div>
                  <span className={`font-extrabold ${tx.type === 'CREDIT' ? 'text-emerald-600' : 'text-slate-900'}`}>{tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}