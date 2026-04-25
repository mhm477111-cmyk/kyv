'use client';
import { useState } from 'react';

export default function TelecomSystem() {
  const [activeTab, setActiveTab] = useState('Etisalat');
  const [expandedLine, setExpandedLine] = useState(null);
  const [searchTerm, setSearchTerm] = useState(''); // حالة البحث

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
      masterPhone: '1101902909',
      ownerName: 'محمد حسين',
      activationDate: '2026-04-01',
      baseCost: 1860,
      totalGB: 195,
      totalMins: 10500, // إجمالي دقائق الخط
      subscribers: []
    }
  ]);

  // --- العمليات ---
  const addNewLine = () => {
    const newLine = {
      id: Date.now(),
      network: activeTab,
      masterPhone: '',
      ownerName: '',
      activationDate: new Date().toISOString().split('T')[0],
      baseCost: 0,
      totalGB: 0,
      totalMins: 0,
      subscribers: []
    };
    setMasterLines([...masterLines, newLine]);
    setExpandedLine(newLine.id);
  };

  const updateSub = (lineId, subIndex, field, value) => {
    setMasterLines(prev => prev.map(line => {
      if (line.id === lineId) {
        const newSubs = [...line.subscribers];
        if (!newSubs[subIndex]) {
           newSubs[subIndex] = { id: Date.now() + subIndex, name: '', phone: '', gb: 0, mins: 1500, price: 0, paidAmount: 0 };
        }
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

  // --- منطق البحث ---
  const filteredLines = masterLines.filter(line => {
    const matchesMaster = line.ownerName.includes(searchTerm) || line.masterPhone.includes(searchTerm);
    const matchesSub = line.subscribers.some(sub => 
      sub.name.includes(searchTerm) || sub.phone.includes(searchTerm)
    );
    return (line.network === activeTab) && (matchesMaster || matchesSub || searchTerm === '');
  });

  const getStats = (line) => {
    let actualCollected = 0;
    let totalDebts = 0;
    let usedGB = 0;
    let usedMins = 0;

    line.subscribers.forEach(sub => {
      actualCollected += Number(sub.paidAmount || 0);
      totalDebts += (Number(sub.price || 0) - Number(sub.paidAmount || 0));
      usedGB += Number(sub.gb || 0);
      usedMins += Number(sub.mins || 0);
    });

    return {
      actualCollected,
      totalDebts,
      profit: actualCollected - line.baseCost,
      remainingGB: line.totalGB - usedGB,
      remainingMins: line.totalMins - usedMins
    };
  };

  return (
    <div className="p-4 md:p-8 bg-[#0a0a0a] min-h-screen text-gray-200" dir="rtl">
      <header className="mb-6 text-center">
        <h1 className="text-4xl font-black text-[#ca8a04]">MO CONTROL</h1>
        <p className="text-gray-500 text-sm">نظام إدارة الباقات المتطور</p>
      </header>

      {/* شريط البحث الجديد */}
      <div className="max-w-xl mx-auto mb-8 relative">
        <input 
          type="text" 
          placeholder="ابحث باسم العميل، رقم العميل، أو صاحب الخط..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#111] border border-gray-800 rounded-2xl py-4 px-6 pr-12 text-sm outline-none focus:border-[#ca8a04] transition-all shadow-lg"
        />
        <span className="absolute left-4 top-4 text-gray-600">🔍</span>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-2 mb-10 overflow-x-auto">
        {['Etisalat', 'Vodafone', 'WE'].map(net => (
          <button key={net} onClick={() => {setActiveTab(net); setExpandedLine(null);}}
            className={`px-6 py-3 rounded-2xl font-bold transition-all border-2 ${
              activeTab === net ? 'border-[#ca8a04] bg-[#ca8a04] text-black' : 'border-gray-800 text-gray-500'
            }`}>
            {net === 'Etisalat' ? 'اتصالات' : net === 'Vodafone' ? 'فودافون' : 'وي'}
          </button>
        ))}
      </div>

      {/* Lines List */}
      <div className="max-w-6xl mx-auto space-y-6">
        {filteredLines.map(line => {
          const stats = getStats(line);
          const isMainOpen = expandedLine === line.id;

          return (
            <div key={line.id} className="bg-[#111] border border-gray-800 rounded-3xl overflow-hidden shadow-2xl transition-all">
              <div onClick={() => setExpandedLine(isMainOpen ? null : line.id)}
                className="p-6 cursor-pointer hover:bg-[#161616] flex flex-wrap items-center justify-between gap-4">
                
                <div className="flex gap-8 items-center">
                  <div>
                    <p className="text-[9px] text-gray-500 uppercase">صاحب الخط</p>
                    <p className="font-bold text-white">{line.ownerName || '---'}</p>
                  </div>
                  <div className="text-center px-4 border-r border-gray-800">
                    <p className="text-[9px] text-gray-500 uppercase">الربح</p>
                    <p className={`font-bold ${stats.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>{stats.profit} ج</p>
                  </div>
                  <div className="text-center px-4 border-r border-gray-800">
                    <p className="text-[9px] text-gray-500 uppercase">المتبقي</p>
                    <p className="font-bold text-blue-400 text-xs">{stats.remainingGB}GB / {stats.remainingMins} Min</p>
                  </div>
                </div>
                <span className={`transform transition-transform ${isMainOpen ? 'rotate-180 text-[#ca8a04]' : 'text-gray-700'}`}>▼</span>
              </div>

              {isMainOpen && (
                <div className="p-6 border-t border-gray-800 bg-[#0d0d0d] space-y-8">
                  
                  {/* Master Data Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-[#161616] p-5 rounded-2xl border border-gray-800">
                    <div className="space-y-1 md:col-span-1">
                      <label className="text-[10px] text-gray-500">صاحب الخط</label>
                      <input type="text" value={line.ownerName} onChange={(e) => setMasterLines(prev => prev.map(l => l.id === line.id ? {...l, ownerName: e.target.value} : l))} className="w-full bg-black border border-gray-800 rounded-xl p-2 text-sm text-white outline-none"/>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500">الرقم</label>
                      <input type="text" value={line.masterPhone} onChange={(e) => setMasterLines(prev => prev.map(l => l.id === line.id ? {...l, masterPhone: e.target.value} : l))} className="w-full bg-black border border-gray-800 rounded-xl p-2 text-sm text-[#ca8a04] outline-none"/>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500">إجمالي الجيجات</label>
                      <input type="number" value={line.totalGB} onChange={(e) => setMasterLines(prev => prev.map(l => l.id === line.id ? {...l, totalGB: Number(e.target.value)} : l))} className="w-full bg-black border border-gray-800 rounded-xl p-2 text-sm text-blue-400 outline-none"/>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500">إجمالي الدقائق</label>
                      <input type="number" value={line.totalMins} onChange={(e) => setMasterLines(prev => prev.map(l => l.id === line.id ? {...l, totalMins: Number(e.target.value)} : l))} className="w-full bg-black border border-gray-800 rounded-xl p-2 text-sm text-green-400 outline-none"/>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500">تكلفة الباقة</label>
                      <input type="number" value={line.baseCost} onChange={(e) => setMasterLines(prev => prev.map(l => l.id === line.id ? {...l, baseCost: Number(e.target.value)} : l))} className="w-full bg-black border border-gray-800 rounded-xl p-2 text-sm text-red-400 outline-none"/>
                    </div>
                  </div>

                  {/* Subscribers List */}
                  <div className="space-y-3">
                    {[...Array(7)].map((_, index) => {
                      const sub = line.subscribers[index] || { name: '', phone: '', gb: 0, mins: 0, price: 0, paidAmount: 0 };
                      const debt = Number(sub.price || 0) - Number(sub.paidAmount || 0);

                      return (
                        <div key={index} className="grid grid-cols-2 md:grid-cols-7 gap-3 items-center bg-[#111] p-3 rounded-2xl border border-gray-800">
                          <input placeholder="الاسم" value={sub.name} onChange={(e) => updateSub(line.id, index, 'name', e.target.value)}
                                 className="bg-black border border-gray-800 rounded-lg p-2 text-xs outline-none focus:border-[#ca8a04]"/>
                          
                          <input placeholder="الرقم" value={sub.phone} onChange={(e) => updateSub(line.id, index, 'phone', e.target.value)}
                                 className="bg-black border border-gray-800 rounded-lg p-2 text-xs outline-none"/>

                          <select value={sub.gb} onChange={(e) => updateSub(line.id, index, 'gb', Number(e.target.value))}
                                  className="bg-black border border-gray-800 rounded-lg p-2 text-xs text-blue-400 outline-none">
                            <option value="0">الباقة</option>
                            {[20, 25, 30, 35, 40].map(g => <option key={g} value={g}>{g} GB</option>)}
                          </select>

                          <div className="flex flex-col">
                            <label className="text-[8px] text-gray-600 mr-1">الدقائق</label>
                            <input type="number" value={sub.mins} onChange={(e) => updateSub(line.id, index, 'mins', Number(e.target.value))}
                                   className="bg-black border border-gray-800 rounded-lg p-2 text-xs text-green-500 outline-none"/>
                          </div>

                          <div className="flex flex-col">
                            <label className="text-[8px] text-gray-600 mr-1">السعر</label>
                            <input type="number" value={sub.price} onChange={(e) => updateSub(line.id, index, 'price', Number(e.target.value))}
                                   className="bg-black border border-gray-800 rounded-lg p-2 text-xs text-yellow-500 outline-none"/>
                          </div>

                          <div className="flex flex-col">
                            <label className="text-[8px] text-gray-600 mr-1">المدفوع</label>
                            <input type="number" value={sub.paidAmount} onChange={(e) => updateSub(line.id, index, 'paidAmount', Number(e.target.value))}
                                   className="bg-black border border-gray-800 rounded-lg p-2 text-xs text-green-500 outline-none"/>
                          </div>

                          <div className={`text-center font-bold text-xs ${debt > 0 ? 'text-red-500' : 'text-gray-500'}`}>
                             {debt > 0 ? `باقي ${debt} ج` : 'خالص ✓'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button onClick={addNewLine} className="fixed bottom-8 left-8 bg-[#ca8a04] text-black w-14 h-14 rounded-full shadow-2xl text-3xl font-bold hover:scale-110 active:scale-95 transition-all flex items-center justify-center">+</button>
    </div>
  );
}
