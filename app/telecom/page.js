'use client';
import { useState } from 'react';

export default function TelecomSystem() {
  const [activeTab, setActiveTab] = useState('Etisalat');
  const [expandedLine, setExpandedLine] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const planConfigs = {
    20: { price: 260, defaultMins: 1500 },
    25: { price: 300, defaultMins: 1500 },
    30: { price: 340, defaultMins: 1500 },
    35: { price: 350, defaultMins: 1500 },
    40: { price: 420, defaultMins: 1500 },
  };

  const [masterLines, setMasterLines] = useState([
    {
      id: Date.now(),
      network: 'Etisalat',
      masterPhone: '01101902909',
      ownerName: 'محمد حسين',
      activationDate: '2026-04-01',
      baseCost: 1860,
      totalGB: 195,
      totalMins: 10500,
      subscribers: []
    }
  ]);

  const addNewLine = () => {
    const newLine = {
      id: Date.now(),
      network: activeTab,
      masterPhone: '',
      ownerName: 'خط جديد',
      activationDate: new Date().toISOString().split('T')[0],
      baseCost: 0,
      totalGB: 0,
      totalMins: 0,
      subscribers: []
    };
    setMasterLines(prev => [...prev, newLine]);
    setExpandedLine(newLine.id);
  };

  const deleteLine = (e, id) => {
    e.stopPropagation();
    if(window.confirm("هل تريد حذف هذا الخط نهائياً؟")) {
      setMasterLines(prev => prev.filter(line => line.id !== id));
    }
  };

  const updateMasterLine = (lineId, field, value) => {
    setMasterLines(prev => prev.map(line => line.id === lineId ? { ...line, [field]: value } : line));
  };

  const updateSub = (lineId, subIndex, field, value) => {
    setMasterLines(prev => prev.map(line => {
      if (line.id === lineId) {
        const newSubs = [...line.subscribers];
        if (!newSubs[subIndex]) newSubs[subIndex] = { id: Date.now() + subIndex, name: '', phone: '', gb: 0, mins: 1500, price: 0, paidAmount: 0 };
        if (field === 'gb') {
          newSubs[subIndex].price = planConfigs[value]?.price || 0;
          newSubs[subIndex].mins = planConfigs[value]?.defaultMins || 1500;
        }
        newSubs[subIndex] = { ...newSubs[subIndex], [field]: value };
        return { ...line, subscribers: newSubs };
      }
      return line;
    }));
  };

  const getStats = (line) => {
    let actualCollected = 0;
    let totalPrices = 0;
    let usedGB = 0;
    let usedMins = 0;
    line.subscribers.forEach(sub => {
      actualCollected += Number(sub.paidAmount || 0);
      totalPrices += Number(sub.price || 0);
      usedGB += Number(sub.gb || 0);
      usedMins += Number(sub.mins || 0);
    });
    return {
      profit: actualCollected - line.baseCost,
      debts: totalPrices - actualCollected,
      remainingGB: line.totalGB - usedGB,
      remainingMins: line.totalMins - usedMins
    };
  };

  const filteredLines = masterLines.filter(line => {
    const isSameNetwork = line.network === activeTab;
    const searchLower = searchTerm.toLowerCase();
    const matches = line.ownerName.toLowerCase().includes(searchLower) || line.masterPhone.includes(searchTerm);
    return isSameNetwork && (matches || searchTerm === '');
  });

  return (
    <div className="p-4 md:p-8 bg-[#0a0a0a] min-h-screen text-gray-200" dir="rtl">
      <header className="mb-6 text-center"><h1 className="text-4xl font-black text-[#ca8a04]">MO CONTROL</h1></header>

      <div className="max-w-xl mx-auto mb-8">
        <input type="text" placeholder="بحث..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#111] border border-gray-800 rounded-2xl py-4 px-6 text-sm outline-none focus:border-[#ca8a04]"/>
      </div>

      <div className="flex justify-center gap-3 mb-10">
        {['Etisalat', 'Vodafone', 'WE'].map(net => (
          <button key={net} onClick={() => {setActiveTab(net); setExpandedLine(null);}} className={`px-8 py-3 rounded-2xl font-bold border-2 ${activeTab === net ? 'border-[#ca8a04] bg-[#ca8a04] text-black' : 'border-gray-800 text-gray-500'}`}>
            {net === 'Etisalat' ? 'اتصالات' : net === 'Vodafone' ? 'فودافون' : 'وي'}
          </button>
        ))}
      </div>

      <div className="max-w-6xl mx-auto space-y-4">
        {filteredLines.map(line => {
          const stats = getStats(line);
          const isMainOpen = expandedLine === line.id;
          return (
            <div key={line.id} className="bg-[#111] border border-gray-800 rounded-3xl overflow-hidden shadow-xl">
              <div onClick={() => setExpandedLine(isMainOpen ? null : line.id)} className="p-4 cursor-pointer hover:bg-[#161616] flex flex-col md:flex-row items-center justify-between gap-4">
                
                {/* الجزء الأساسي */}
                <div className="flex items-center gap-4 w-full md:w-auto">
                   <div className="bg-black p-3 rounded-xl border border-gray-800 w-full md:w-52">
                     <p className="text-[9px] text-gray-500 uppercase">صاحب الخط / الرقم</p>
                     <p className="font-bold text-white text-sm truncate">{line.ownerName} - {line.masterPhone}</p>
                   </div>
                </div>

                {/* البيانات المضافة (تظهر من بره) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full md:w-auto text-center">
                   <div className="bg-black/30 p-2 rounded-lg border border-gray-800"><p className="text-[8px] text-gray-500">الربح</p><p className={`font-bold text-xs ${stats.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>{stats.profit} ج</p></div>
                   <div className="bg-black/30 p-2 rounded-lg border border-gray-800"><p className="text-[8px] text-gray-500">فلوس برا</p><p className="font-bold text-xs text-orange-500">{stats.debts} ج</p></div>
                   <div className="bg-black/30 p-2 rounded-lg border border-gray-800"><p className="text-[8px] text-gray-500">جيجا متبقية</p><p className="font-bold text-xs text-blue-400">{stats.remainingGB} GB</p></div>
                   <div className="bg-black/30 p-2 rounded-lg border border-gray-800"><p className="text-[8px] text-gray-500">دقائق متبقية</p><p className="font-bold text-xs text-green-400">{stats.remainingMins} د</p></div>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={(e) => deleteLine(e, line.id)} className="text-gray-600 hover:text-red-500">🗑️</button>
                  <span className={`transform transition-transform ${isMainOpen ? 'rotate-180' : ''}`}>▼</span>
                </div>
              </div>

              {isMainOpen && (
                <div className="p-6 border-t border-gray-800 bg-[#0d0d0d]">
                   {/* باقي كود تعديل التفاصيل كما هو بدون تغيير */}
                   <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6 bg-[#161616] p-4 rounded-2xl border border-gray-800">
                    <input type="text" placeholder="الاسم" value={line.ownerName} onChange={(e) => updateMasterLine(line.id, 'ownerName', e.target.value)} className="bg-black border border-gray-800 rounded-xl p-2 text-sm outline-none"/>
                    <input type="text" placeholder="الرقم" value={line.masterPhone} onChange={(e) => updateMasterLine(line.id, 'masterPhone', e.target.value)} className="bg-black border border-gray-800 rounded-xl p-2 text-sm text-[#ca8a04] outline-none"/>
                    <input type="number" placeholder="جيجات" value={line.totalGB} onChange={(e) => updateMasterLine(line.id, 'totalGB', Number(e.target.value))} className="bg-black border border-gray-800 rounded-xl p-2 text-sm text-blue-400 outline-none"/>
                    <input type="number" placeholder="دقائق" value={line.totalMins} onChange={(e) => updateMasterLine(line.id, 'totalMins', Number(e.target.value))} className="bg-black border border-gray-800 rounded-xl p-2 text-sm text-green-400 outline-none"/>
                    <input type="number" placeholder="تكلفة" value={line.baseCost} onChange={(e) => updateMasterLine(line.id, 'baseCost', Number(e.target.value))} className="bg-black border border-gray-800 rounded-xl p-2 text-sm text-red-400 outline-none"/>
                   </div>
                   {/* قسم المشتركين */}
                   {[...Array(7)].map((_, index) => {
                      const sub = line.subscribers[index] || { name: '', phone: '', gb: 0, mins: 1500, price: 0, paidAmount: 0 };
                      return (
                        <div key={index} className="grid grid-cols-2 md:grid-cols-7 gap-2 items-center bg-[#111] p-3 rounded-2xl border border-gray-800 mb-2">
                          <input placeholder="الاسم" value={sub.name} onChange={(e) => updateSub(line.id, index, 'name', e.target.value)} className="bg-black border border-gray-800 rounded-lg p-2 text-xs outline-none"/>
                          <input placeholder="الرقم" value={sub.phone} onChange={(e) => updateSub(line.id, index, 'phone', e.target.value)} className="bg-black border border-gray-800 rounded-lg p-2 text-xs outline-none"/>
                          <select value={sub.gb} onChange={(e) => updateSub(line.id, index, 'gb', Number(e.target.value))} className="bg-black border border-gray-800 rounded-lg p-2 text-xs text-blue-400"><option value="0">الباقة</option>{[20, 25, 30, 35, 40].map(g => <option key={g} value={g}>{g} GB</option>)}</select>
                          <input type="number" value={sub.mins} onChange={(e) => updateSub(line.id, index, 'mins', Number(e.target.value))} className="bg-black border border-gray-800 rounded-lg p-2 text-xs text-green-500"/>
                          <input type="number" value={sub.price} onChange={(e) => updateSub(line.id, index, 'price', Number(e.target.value))} className="bg-black border border-gray-800 rounded-lg p-2 text-xs text-yellow-500"/>
                          <input type="number" value={sub.paidAmount} onChange={(e) => updateSub(line.id, index, 'paidAmount', Number(e.target.value))} className="bg-black border border-gray-800 rounded-lg p-2 text-xs text-green-500"/>
                          <button onClick={() => updateSub(line.id, index, 'paidAmount', sub.price)} className="text-[10px] font-bold text-gray-400">تحصيل</button>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button onClick={addNewLine} className="fixed bottom-8 left-8 bg-[#ca8a04] text-black w-14 h-14 rounded-full shadow-2xl text-3xl font-bold hover:scale-110 active:scale-95 transition-all z-[9999]">+</button>
    </div>
  );
}
