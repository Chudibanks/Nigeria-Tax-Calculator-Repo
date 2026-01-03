// FRONTEND + API LOGIC (Production Ready, Mobile-Friendly, Dark Mode, Multi-Language EN/PG) with Net Pay, PDF/CSV Export, History Tracking, State-Level Deductions & Real-Time Validation
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';

const stateAllowances = {
  lagos: 200000,
  abuja: 150000,
  kano: 100000,
  default: 0
};

const translations = {
  en: {
    title: '🇳🇬 Nigeria Tax Calculator',
    selectState: 'Select State',
    taxpayerType: 'Taxpayer Type',
    income: 'Annual income / profit (₦)',
    vat: 'VAT taxable amount (₦)',
    wht: 'Withholding Tax Type',
    calculate: 'Calculate',
    exportCSV: 'Export CSV',
    exportPDF: 'Export PDF',
    netPay: 'Net Pay',
    annualTax: 'Annual Income Tax',
    monthlyPay: 'Monthly PAYE Estimate',
    vatAmount: 'VAT (7.5%)',
    whtAmount: 'Withholding Tax',
    cgtAmount: 'Capital Gains Tax',
    history: 'Calculation History',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    errorInvalidInput: 'Please enter a valid positive number'
  },
  pg: {
    title: '🇳🇬 Naija Tax Calculator',
    selectState: 'Choose State',
    taxpayerType: 'Wetin You dey Pay Tax For',
    income: 'How Much You Dey Earn (₦)',
    vat: 'VAT Amount (₦)',
    wht: 'Wetin Tax Cover',
    calculate: 'Calculate',
    exportCSV: 'Download CSV',
    exportPDF: 'Download PDF',
    netPay: 'Wetin You Go Take Home',
    annualTax: 'Total Tax for Year',
    monthlyPay: 'Monthly Tax',
    vatAmount: 'VAT (7.5%)',
    whtAmount: 'Withholding Tax',
    cgtAmount: 'Capital Gains Tax',
    history: 'Past Calculation',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    errorInvalidInput: 'Abeg enter correct positive number'
  }
};

export default function NigeriaTaxCalculator() {
  const [income, setIncome] = useState("");
  const [type, setType] = useState("individual");
  const [state, setState] = useState("default");
  const [vatAmount, setVatAmount] = useState("");
  const [whtType, setWhtType] = useState("dividend");
  const [history, setHistory] = useState([]);
  const [result, setResult] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [lang, setLang] = useState('en');
  const [error, setError] = useState('');

  const t = translations[lang];

  const validateInput = (value) => {
    return value !== '' && !isNaN(value) && Number(value) >= 0;
  };

  const calculatePersonalTax = (annualIncome, stateAllowance) => {
    const taxableIncome = Math.max(annualIncome - stateAllowance, 0);
    const bands = [
      { limit: 800000, rate: 0 },
      { limit: 3000000, rate: 0.15 },
      { limit: 12000000, rate: 0.18 },
      { limit: 25000000, rate: 0.21 },
      { limit: 50000000, rate: 0.23 },
      { limit: Infinity, rate: 0.25 },
    ];
    let tax = 0, prev = 0;
    for (const band of bands) {
      if (taxableIncome > prev) {
        const taxable = Math.min(band.limit - prev, taxableIncome - prev);
        tax += taxable * band.rate;
        prev = band.limit;
      }
    }
    return tax;
  };

  const calculateTax = () => {
    if (!validateInput(income) || (vatAmount && !validateInput(vatAmount))) {
      setError(t.errorInvalidInput);
      return;
    }
    setError('');

    const annualIncome = Number(income);
    const allowance = stateAllowances[state] || 0;

    let annualTax = 0, monthlyTax = 0, vat = 0, wht = 0, cgt = 0, netPay = 0;

    if (type === "individual" || type === "freelancer") {
      annualTax = calculatePersonalTax(annualIncome, allowance);
      monthlyTax = annualTax / 12;
    }

    if (type === "small_company") annualTax = 0;
    if (type === "large_company") {
      annualTax = annualIncome * 0.34;
      monthlyTax = annualTax / 12;
    }

    if (vatAmount) vat = Number(vatAmount) * 0.075;

    const whtRates = { dividend: 0.1, interest: 0.1, rent: 0.1, service: 0.05 };
    wht = annualIncome * (whtRates[whtType] || 0);

    cgt = type === "large_company" ? annualIncome * 0.3 : calculatePersonalTax(annualIncome, allowance);

    if (type === "individual" || type === "freelancer") netPay = annualIncome - annualTax - vat - wht;

    const record = { income: annualIncome, type, state, annualTax, monthlyTax, vat, wht, cgt, netPay, date: new Date().toLocaleString() };
    setHistory([record, ...history]);
    setResult(record);
  };

  const exportCSV = () => {
    const csvHeader = `Date,State,Type,Income,Annual Tax,Monthly Tax,VAT,WHT,CGT,Net Pay\n`;
    const csvRows = history.map(h => `${h.date},${h.state},${h.type},${h.income},${h.annualTax},${h.monthlyTax},${h.vat},${h.wht},${h.cgt},${h.netPay}`).join('\n');
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'tax_history.csv');
  };

  const exportPDF = () => {
    if (!result) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Nigeria Tax Calculation Summary', 20, 20);
    doc.setFontSize(12);
    doc.text(`Date: ${result.date}`, 20, 30);
    doc.text(`Taxpayer Type: ${result.type}`, 20, 40);
    doc.text(`State: ${result.state}`, 20, 50);
    doc.text(`Annual Income: ₦${result.income.toLocaleString()}`, 20, 60);
    doc.text(`State Allowance: ₦${stateAllowances[result.state] || 0}`, 20, 70);
    doc.text(`${t.annualTax}: ₦${result.annualTax.toLocaleString()}`, 20, 80);
    doc.text(`${t.monthlyPay}: ₦${result.monthlyTax.toLocaleString()}`, 20, 90);
    doc.text(`${t.vatAmount}: ₦${result.vat.toLocaleString()}`, 20, 100);
    doc.text(`${t.whtAmount}: ₦${result.wht.toLocaleString()}`, 20, 110);
    doc.text(`${t.cgtAmount}: ₦${result.cgt.toLocaleString()}`, 20, 120);
    if (result.netPay !== null) doc.text(`${t.netPay}: ₦${result.netPay.toLocaleString()}`, 20, 130);
    doc.save('Tax_Summary.pdf');
  };

  const containerClass = darkMode ? 'min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4 sm:p-6 text-white' : 'min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 sm:p-6 text-black';

  return (
    <div className={containerClass}>
      <div className="absolute top-4 right-4 flex gap-2">
        <Button onClick={() => setDarkMode(!darkMode)}>{darkMode ? t.lightMode : t.darkMode}</Button>
        <Button onClick={() => setLang(lang === 'en' ? 'pg' : 'en')}>{lang.toUpperCase()}</Button>
      </div>

      {error && <div className="mb-2 text-red-500 text-sm">{error}</div>}

      <Card className={`w-full max-w-md shadow-lg rounded-2xl mb-5 ${darkMode ? 'bg-gray-800 text-white' : ''}`}>
        <CardContent className="space-y-4">
          <h1 className="text-xl sm:text-2xl font-semibold text-center">{t.title}</h1>

          <select value={state} onChange={(e) => setState(e.target.value)} className="w-full border p-2 sm:p-3 rounded-xl text-sm sm:text-base">
            <option value="default">{t.selectState}</option>
            <option value="lagos">Lagos</option>
            <option value="abuja">Abuja</option>
            <option value="kano">Kano</option>
          </select>

          <select value={type} onChange={(e) => setType(e.target.value)} className="w-full border p-2 sm:p-3 rounded-xl text-sm sm:text-base">
            <option value="individual">PAYE Employee</option>
            <option value="freelancer">Freelancer</option>
            <option value="small_company">Small Company</option>
            <option value="large_company">Medium / Large Company</option>
          </select>

          <input type="number" placeholder={t.income} value={income} onChange={(e) => setIncome(e.target.value)} className="w-full border p-2 sm:p-3 rounded-xl text-sm sm:text-base" />

          <input type="number" placeholder={t.vat} value={vatAmount} onChange={(e) => setVatAmount(e.target.value)} className="w-full border p-2 sm:p-3 rounded-xl text-sm sm:text-base" />

          <select value={whtType} onChange={(e) => setWhtType(e.target.value)} className="w-full border p-2 sm:p-3 rounded-xl text-sm sm:text-base">
            <option value="dividend">Dividend (10%)</option>
            <option value="interest">Interest (10%)</option>
            <option value="rent">Rent (10%)</option>
            <option value="service">Professional Service (5%)</option>
          </select>

          <Button onClick={calculateTax} className="w-full mt-2">{t.calculate}</Button>
          <div className="flex flex-col sm:flex-row gap-2 mt-2">
            <Button onClick={exportCSV} className="flex-1">{t.exportCSV}</Button>
            <Button onClick={exportPDF} className="flex-1">{t.exportPDF}</Button>
          </div>

          {result && (
            <div className={`bg-green-50 ${darkMode ? 'bg-gray-700 text-white' : ''} p-3 sm:p-4 rounded-xl space-y-1 sm:space-y-2 text-xs sm:text-sm`}>
              <p>{t.annualTax}: ₦{result.annualTax.toLocaleString()}</p>
              <p>{t.monthlyPay}: ₦{result.monthlyTax.toLocaleString()}</p>
              <p>{t.vatAmount}: ₦{result.vat.toLocaleString()}</p>
              <p>{t.whtAmount}: ₦{result.wht.toLocaleString()}</p>
              <p>{t.cgtAmount}: ₦{result.cgt.toLocaleString()}</p>
              {(type === "individual" || type === "freelancer") && <p>{t.netPay}: ₦{result.netPay.toLocaleString()}</p>}
              <p className="text-gray-500 text-xs">Calculated at: {result.date}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card className={`w-full max-w-md shadow-lg rounded-2xl ${darkMode ? 'bg-gray-800 text-white' : ''}`}>
          <CardContent className="space-y-2">
            <h2 className="text-base sm:text-lg font-semibold">{t.history}</h2>
            {history.map((h, i) => (
              <div key={i} className="text-xs sm:text-sm border-b py-1">
                {h.date}: {h.state} - {h.type} - {t.netPay}: ₦{h.netPay?.toLocaleString() || 'N/A'}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
