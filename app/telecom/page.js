'use client';
import { useState } from 'react';

export default function TelecomSystem() {
  const [activeTab, setActiveTab] = useState('Etisalat');
  const [expandedLine, setExpandedLine] = useState(null);

  // إعدادات الباقات الافتراضية
  const planConfigs = {
    20: { price: 260 },
    25: { price: 300 },
    30: { price: 340 },
    35: { price: 350 },
    40: { price: 420 },
  };

  const [masterLines, setMasterLines] = useState([
    {
      id: Date.now(),
      network: 'Etisalat',
      masterPhone: '1101902909',
      ownerName: 'محمد حسين', // جديد: اسم صاحب الخط
      activationDate: '2026-04-01', // جديد: تاريخ التفعيل
      baseCost: 1860,
      totalGB: 195,
      subscribers: []
    }
  ]);

  // --- الوظائف ---

  const addNewLine = () => {
    const newLine = {
      id: Date.now(),
      network: activeTab,
      masterPhone: '',
      ownerName: '',
      activationDate: new Date().toISOString().split('T')[0],
      baseCost: 0,
      totalGB: 0,
      subscribers: []
    };
    setMasterLines([...masterLines, newLine]);
    setExpandedLine(newLine.id);
  };

  const deleteLine = (id) => {
    if(confirm("هل أنت متأكد من حذف هذا الخط بالكامل؟")) {
      setMasterLines(masterLines.filter(l => l.id !== id));
    }
  };

  const updateMasterLine = (lineId, field, value) => {
    setMasterLines(prev => prev.map(line => 
      line.id === lineId ? { ...line, [field]: value } : line
    ));
  };

  const updateSub = (lineId, subIndex, field, value) => {
    setMasterLines(prev => prev.map(line => {
      if (line.id === lineId) {
        const newSubs = [...line.subscribers];
        if (!newSubs[subIndex]) {
           newSubs[subIndex] = { id: Date.now() + subIndex, name: '', phone: '', gb: 0, price: 0, paidAmount: 0 };
        }
        
        // إذا تم تغيير الجيجات، نحدث السعر أوتوماتيك لكن نتركه قابلاً للتعديل
        if (field === 'gb') {
          newSubs[subIndex].price = planConfigs[value]?.price || 0;
        }
        
        newSubs[subIndex] = { ...newSubs[subIndex], [field]: value };
        return { ...line, subscribers: newSubs };
      }
      return line;
    }));
  };

  // --- العمليات الحسابية ---
  const getStats = (line) => {
    let actualCollected = 0; // اللي اندفع فعلياً
    let totalDebts = 0; // مديونيات العملاء
    let usedGB = 0;

    line.subscribers.forEach(sub => {
      actualCollected += Number(sub.paidAmount || 0);
      totalDebts += (Number(sub.price || 0) - Number(sub.paidAmount || 0));
      usedGB += Number(sub.gb || 0);
    });

    return {
      actualCollected,
      totalDebts,
      profit: actualCollected - line.baseCost, // الربح = اللي في جيبي - التكلفة
      remainingGB: line.totalGB - usedGB
    };
  };

  return (
    <div className="p-4 md:p-8 bg-[#0a0a0a] min-h-screen text-gray-200" dir="rtl">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-black text-[#ca8a04] mb-2">MO CONTROL</h1>
        <p className="text-gray-500">نظام الإدارة المالية والشبكات</p>
      </header>

      {/* Tabs */}
      <div className="flex justify-center gap-2 mb-10 overflow-x-auto pb-2">
        {['Etisalat', 'Vodafone', 'WE'].map(net => (
          <button key={net} onClick={() => {setActiveTab(net); setExpandedLine(null);}}
            className={`px-6 py-3 rounded-2xl font-bold transition-all border-2 ${
              activeTab === net ? 'border-[#ca8a04] bg-[#ca8a04] text-black shadow-[0_0_15px_rgba(202,138,4,0.3)]' : 'border-gray-800 text-gray-500'
            }`}>
            {net === 'Etisalat' ? 'اتصالات Emerald' : net === 'Vodafone' ? 'فودافون Red' : 'وي Gold'}
          </button>
        ))}
      </div>

      {/* Lines List */}
      <div className="max-w-6xl mx-auto space-y-6">
        {masterLines.filter(l => l.network === activeTab).map(line => {
          const stats = getStats(line);
          const isMainOpen = expandedLine === line.id;

          return (
            <div key={line.id} className="bg-[#111] border border-gray-800 rounded-3xl overflow-hidden shadow-2xl transition-all">
              {/* Header */}
              <div onClick={() => setExpandedLine(isMainOpen ? null : line.id)}
                className="p-6 cursor-pointer hover:bg-[#161616] flex flex-wrap items-center justify-between gap-4">
                
                <div className="flex gap-6 items-center">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">صاحب الخط</p>
                    <p className="font-bold text-white">{line.ownerName || '---'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">رقم الخط</p>
                    <p className="font-bold text-[#ca8a04]">{line.masterPhone || '---'}</p>
                  </div>
                </div>

                <div className="flex gap-6 items-center">
                  <div className="text-center px-4 border-l border-gray-800">
                    <p className="text-[10px] text-gray-500">صافي الربح</p>
                    <p className={`font-bold ${stats.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>{stats.profit} ج</p>
                  </div>
                  <div className="text-center px-4 border-l border-gray-800">
                    <p className="text-[10px] text-gray-500">مديونيات خارجية</p>
                    <p className="font-bold text-orange-500">{stats.totalDebts} ج</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); deleteLine(line.id); }} className="text-gray-700 hover:text-red-500 transition-colors px-2 text-xl">🗑</button>
                </div>
              </div>

              {/* Details */}
              {isMainOpen && (
                <div className="p-6 border-t border-gray-800 bg-[#0d0d0d] space-y-8 animate-fadeIn">
                  
                  {/* Master Data Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#161616] p-5 rounded-2xl border border-gray-800">
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500">اسم صاحب الخط</label>
                      <input type="text" value={line.ownerName} onChange={(e) => updateMasterLine(line.id, 'ownerName', e.target.value)}
                             className="w-full bg-black border border-gray-800 rounded-xl p-2 text-white outline-none focus:border-yellow-600"/>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500">الرقم الأساسي</label>
                      <input type="text" value={line.masterPhone} onChange={(e) => updateMasterLine(line.id, 'masterPhone', e.target.value)}
                             className="w-full bg-black border border-gray-800 rounded-xl p-2 text-[#ca8a04] outline-none"/>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500">تكلفة الباقة (1860)</label>
                      <input type="number" value={line.baseCost} onChange={(e) => updateMasterLine(line.id, 'baseCost', Number(e.target.value))}
                             className="w-full bg-black border border-gray-800 rounded-xl p-2 text-red-400 outline-none"/>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500">تاريخ التفعيل</label>
                      <input type="date" value={line.activationDate} onChange={(e) => updateMasterLine(line.id, 'activationDate', e.target.value)}
                             className="w-full bg-black border border-gray-800 rounded-xl p-2 text-blue-400 outline-none"/>
                    </div>
                  </div>

                  {/* Subscribers List */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center px-2">
                       <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest">توزيع المشتركين</h4>
                       <p className="text-xs text-blue-400">المتبقي: {stats.remainingGB} GB</p>
                    </div>

                    {[...Array(7)].map((_, index) => {
                      const sub = line.subscribers[index] || { name: '', phone: '', gb: 0, price: 0, paidAmount: 0 };
                      const debt = Number(sub.price || 0) - Number(sub.paidAmount || 0);

                      return (
                        <div key={index} className="grid grid-cols-2 md:grid-cols-7 gap-2 items-center bg-[#111] p-3 rounded-2xl border border-gray-800 hover:border-gray-700 transition-all">
                          <input placeholder="الاسم" value={sub.name} onChange={(e) => updateSub(line.id, index, 'name', e.target.value)}
                                 className="bg-black border border-gray-800 rounded-lg p-2 text-sm outline-none focus:border-[#ca8a04]"/>
                          
                          <select value={sub.gb} onChange={(e) => updateSub(line.id, index, 'gb', Number(e.target.value))}
                                  className="bg-black border border-gray-800 rounded-lg p-2 text-sm text-blue-400 outline-none">
                            <option value="0">الباقة</option>
                            {[20, 25, 30, 35, 40].map(g => <option key={g} value={g}>{g} GB</option>)}
                          </select>

                          <div className="flex flex-col">
                            <label className="text-[9px] text-gray-600 mr-1">السعر المتفق عليه</label>
                            <input type="number" value={sub.price} onChange={(e) => updateSub(line.id, index, 'price', Number(e.target.value))}
                                   className="bg-black border border-gray-800 rounded-lg p-2 text-sm text-yellow-500 outline-none"/>
                          </div>

                          <div className="flex flex-col">
                            <label className="text-[9px] text-gray-600 mr-1">المبلغ المدفوع</label>
                            <input type="number" value={sub.paidAmount} onChange={(e) => updateSub(line.id, index, 'paidAmount', Number(e.target.value))}
                                   className="bg-black border border-gray-800 rounded-lg p-2 text-sm text-green-500 outline-none"/>
                          </div>

                          <div className="text-center">
                             <p className="text-[9px] text-gray-600 uppercase">باقي عليه</p>
                             <p className={`text-sm font-bold ${debt > 0 ? 'text-red-500' : 'text-gray-700'}`}>{debt} ج</p>
                          </div>

                          <div className="text-center md:block hidden">
                             <p className="text-[9px] text-gray-600">للتحويل</p>
                             <p className="text-gray-500 font-mono text-[10px]">{sub.gb * 1024} MB</p>
                          </div>

                          <button onClick={() => updateSub(line.id, index, 'paidAmount', sub.price)}
                            className="bg-green-600/10 text-green-500 py-2 rounded-xl text-[10px] font-bold border border-green-600/20 hover:bg-green-600 hover:text-black transition-all">
                            تم الدفع كلياً
                          </button>
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

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-in-out; }
      `}</style>
    </div>
  );
}
