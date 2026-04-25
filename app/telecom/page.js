'use client';
import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

export default function TelecomSystem() {
  const [activeTab, setActiveTab] = useState('Etisalat');
  const [activeCycle, setActiveCycle] = useState('1');
  const [expandedLine, setExpandedLine] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [masterLines, setMasterLines] = useState([]);
  const [filterMode, setFilterMode] = useState('all');

  const priceTable = {
    'Etisalat': { 20: 260, 25: 300, 30: 340, 40: 420, 50: 500, 60: 640 },
    'Vodafone': { 20: 300, 25: 340, 30: 380, 40: 460, 50: 520, 60: 580 },
    'WE': { 20: 250, 25: 280, 30: 310, 40: 360, 50: 410, 60: 520 }
  };

  useEffect(() => {
    const cachedData = localStorage.getItem('mo_control_data');
    if (cachedData) setMasterLines(JSON.parse(cachedData));
  }, []);

  const updateLocalState = (newData) => {
    setMasterLines(newData);
    localStorage.setItem('mo_control_data', JSON.stringify(newData));
  };

  const exportToExcel = () => {
    const dataToExport = masterLines.map(line => ({
      "ID": line.id, "صاحب الخط": line.ownerName, "الرقم": line.masterPhone,
      "الشبكة": line.network, "السايكل": line.cycle, "تاريخ التفعيل": line.activationDate,
      "التكلفة": line.baseCost, "الجيجا": line.totalGB, "الدقائق": line.totalMins,
      "بيانات المشتركين (JSON)": JSON.stringify(line.subscribers)
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "FullBackup");
    XLSX.writeFile(wb, "MO_CONTROL_Full_Backup.xlsx");
  };

  const importFromExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const wb = XLSX.read(data, { type: 'array' });
      const jsonData = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      const imported = jsonData.map(item => ({
        id: item["ID"] || Date.now().toString(),
        ownerName: item["صاحب الخط"], masterPhone: item["الرقم"],
        network: item["الشبكة"], cycle: String(item["السايكل"]),
        activationDate: item["تاريخ التفعيل"], baseCost: Number(item["التكلفة"]),
        totalGB: Number(item["الجيجا"]), totalMins: Number(item["الدقائق"]),
        subscribers: item["بيانات المشتركين (JSON)"] ? JSON.parse(item["بيانات المشتركين (JSON)"]) : Array(7).fill({name: '', paidAmount: 0, price: 0})
      }));
      updateLocalState(imported);
    };
    reader.readAsArrayBuffer(file);
  };

  const getStats = (line) => {
    const subs = line.subscribers || [];
    let actualCollected = 0, totalPrices = 0, usedGB = 0, usedMins = 0;
    subs.forEach(s => {
      actualCollected += Number(s.paidAmount || 0);
      totalPrices += Number(s.price || 0);
      usedGB += Number(s.gb || 0);
      usedMins += Number(s.mins || 0);
    });
    return { profit: actualCollected - (line.baseCost || 0), debts: totalPrices - actualCollected, actualCollected, remainingGB: (line.totalGB || 0) - usedGB, remainingMins: (line.totalMins || 0) - usedMins };
  };

  const addNewLine = () => {
    const newLine = { id: Date.now().toString(), network: activeTab, cycle: activeCycle, ownerName: 'خط جديد', subscribers: Array(7).fill({name: '', phone: '', gb: 0, sentMB: 4096, mins: 1500, price: 0, paidAmount: 0}) };
    updateLocalState([...masterLines, newLine]);
  };

  const updateMasterLine = (id, field, val) => updateLocalState(masterLines.map(l => l.id === id ? {...l, [field]: val} : l));
  
  const updateSub = (lineId, subIndex, field, value, subs) => {
    let newSubs = [...subs];
    const val = (['gb', 'sentMB', 'mins', 'price', 'paidAmount'].includes(field)) ? Number(value) : value;
    newSubs[subIndex] = { ...newSubs[subIndex], [field]: val };
    if (field === 'gb') {
      const line = masterLines.find(l => l.id === lineId);
      newSubs[subIndex].price = priceTable[line.network]?.[val] || 0;
    }
    updateLocalState(masterLines.map(l => l.id === lineId ? {...l, subscribers: newSubs} : l));
  };

  const totalProfit = masterLines.reduce((acc, line) => acc + getStats(line).profit, 0);
  const etisalatCount = masterLines.filter(l => l.network === 'Etisalat').length;
  const vodafoneCount = masterLines.filter(l => l.network === 'Vodafone').length;
  const weCount = masterLines.filter(l => l.network === 'WE').length;

  const filteredLines = masterLines.filter(line => {
    const stats = getStats(line);
    const searchMatch = (line.ownerName?.includes(searchTerm) || line.masterPhone?.includes(searchTerm));
    if (filterMode === 'debts') return stats.debts > 0 && stats.actualCollected > 0 && searchMatch;
    if (filterMode === 'notPaid') return stats.actualCollected === 0 && searchMatch;
    return (line.network === activeTab) && (line.cycle === activeCycle) && searchMatch;
  });

  return (
    <div className="p-8 bg-[#050505] min-h-screen text-gray-200" dir="rtl">
      <header className="mb-8 text-center"><h1 className="text-4xl font-black text-[#ca8a04]">MO CONTROL</h1></header>

      <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-3 mb-8">
        <input type="text" placeholder="🔍 بحث عن عميل..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-1 bg-[#111] border border-gray-800 rounded-2xl py-3 px-6 outline-none focus:border-[#ca8a04]"/>
        <div className="flex gap-2">
            <button onClick={() => setFilterMode('debts')} className="bg-red-900/20 border border-red-900/50 text-red-500 px-4 py-2 rounded-xl text-xs font-bold">عليهم فلوس</button>
            <button onClick={() => setFilterMode('notPaid')} className="bg-orange-900/20 border border-orange-900/50 text-orange-500 px-4 py-2 rounded-xl text-xs font-bold">لم يدفعوا</button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        {[ {t: "صافي الربح", v: `${totalProfit} ج`, c: "text-green-500"}, {t: "اتصالات", v: etisalatCount}, {t: "فودافون", v: vodafoneCount}, {t: "وي", v: weCount} ].map((item, i) => (
            <div key={i} className="bg-[#111] border border-gray-800 p-4 rounded-2xl text-center shadow-lg"><p className="text-[9px] text-gray-500">{item.t}</p><p className={`font-black text-lg ${item.c || 'text-white'}`}>{item.v}</p></div>
        ))}
        <button onClick={() => {setFilterMode('all'); setSearchTerm('');}} className="bg-[#ca8a04] text-black font-black rounded-2xl">RESET</button>
      </div>

      <div className="flex justify-center gap-3 mb-6">
        {['Etisalat', 'Vodafone', 'WE'].map(net => (
          <button key={net} onClick={() => {setFilterMode('all'); setActiveTab(net);}} className={`px-8 py-2 rounded-xl font-bold border ${activeTab === net && filterMode === 'all' ? 'border-[#ca8a04] bg-[#ca8a04] text-black' : 'border-gray-800 text-gray-500'}`}>
            {net === 'Etisalat' ? 'اتصالات' : net === 'Vodafone' ? 'فودافون' : 'وي'}
          </button>
        ))}
      </div>

      <div className="max-w-7xl mx-auto space-y-4">
        {filteredLines.map(line => (
          <div key={line.id} className="bg-[#111] border border-gray-800 rounded-3xl overflow-hidden">
            <div onClick={() => setExpandedLine(expandedLine === line.id ? null : line.id)} className="p-4 cursor-pointer flex justify-between items-center">
                <div><p className="font-bold">{line.ownerName}</p><p className="text-xs text-gray-500">{line.masterPhone}</p></div>
                <div className="flex gap-4 text-center"><div><p className="text-[8px] text-gray-500">الربح</p><p className="text-sm text-green-500">{getStats(line).profit} ج</p></div></div>
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-8 left-8 flex gap-3">
        <button onClick={exportToExcel} className="bg-green-600 p-4 rounded-full">📥</button>
        <button onClick={addNewLine} className="bg-[#ca8a04] text-black w-14 h-14 rounded-full font-black text-2xl">+</button>
      </div>
    </div>
  );
}
