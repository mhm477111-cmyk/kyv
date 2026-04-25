'use client';
import { useState } from 'react';

export default function TelecomSystem() {
  const [activeTab, setActiveTab] = useState('Etisalat');
  const [expandedLine, setExpandedLine] = useState(null);

  // إعدادات الباقات (سعر ودقائق)
  const planConfigs = {
    20: { price: 260, mins: 1500 },
    25: { price: 300, mins: 1500 },
    30: { price: 340, mins: 1500 },
    35: { price: 350, mins: 1500 },
    40: { price: 420, mins: 1500 },
  };

  const [masterLines, setMasterLines] = useState([
    {
      id: Date.now(),
      network: 'Etisalat',
      masterPhone: '1101902909',
      baseCost: 1860,
      totalGB: 195,
      totalMins: 10500,
      subscribers: []
    }
  ]);

  // --- دوال التحكم في السيستم ---

  // 1. إضافة خط أساسي جديد
  const addNewLine = () => {
    const newLine = {
      id: Date.now(),
      network: activeTab,
      masterPhone: '',
      baseCost: 0,
      totalGB: 0,
      totalMins: 0,
      subscribers: []
    };
    setMasterLines([...masterLines, newLine]);
    setExpandedLine(newLine.id); // فتح الخط الجديد فوراً لتعديله
  };

  // 2. تحديث بيانات الخط الأساسي
  const updateMasterLine = (lineId, field, value) => {
    setMasterLines(prev => prev.map(line => 
      line.id === lineId ? { ...line, [field]: value } : line
    ));
  };

  // 3. تحديث أو إضافة مشترك
  const updateSub = (lineId, subIndex, field, value) => {
    setMasterLines(prev => prev.map(line => {
      if (line.id === lineId) {
        const newSubs = [...line.subscribers];
        if (!newSubs[subIndex]) {
           newSubs[subIndex] = { id: Date.now() + subIndex, name: '', phone: '', gb: 0, isPaid: false };
        }
        newSubs[subIndex] = { ...newSubs[subIndex], [field]: value };
        return { ...line, subscribers: newSubs };
      }
      return line;
    }));
  };

  // 4. دالة الحسابات (الربط بين حالة الدفع والربح)
  const getStats = (line) => {
    let collectedPaid = 0; // الفلوس اللي اتلمت فعلياً
    let totalPotential = 0; // إجمالي الفلوس المفروض تلمها
    let usedGB = 0;

    line.subscribers.forEach(sub => {
      const price = planConfigs[sub.gb]?.price || 0;
      totalPotential += price;
      usedGB += Number(sub.gb);
      
      // الحسبة الجديدة: ضيف الفلوس للربح فقط لو حالة الدفع "تم الدفع"
      if (sub.isPaid) {
        collectedPaid += price;
      }
    });

    return {
      collectedPaid,
      totalPotential,
      profit: collectedPaid - line.baseCost, // الربح بناءً على اللي اندفع بس
      remainingGB: line.totalGB - usedGB
    };
  };

  return (
    <div className="p-4 md:p-8 bg-[#0a0a0a] min-h-screen text-gray-200" dir="rtl">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-black text-[#ca8a04] mb-2">MO CONTROL</h1>
        <p className="text-gray-500 italic">إدارة الأرباح والشبكات الذكية</p>
      </header>

      {/* التبديل بين الشبكات */}
      <div className="flex justify-center gap-2 mb-10 overflow-x-auto pb-2">
        {['Etisalat', 'Vodafone', 'WE'].map(net => (
          <button 
            key={net}
            onClick={() => {setActiveTab(net); setExpandedLine(null);}}
            className={`px-8 py-3 rounded-2xl font-bold transition-all duration-300 border-2 ${
              activeTab === net ? 'border-[#ca8a04] bg-[#ca8a04] text-black shadow-[0_0_20px_rgba(202,138,4,0.3)]' : 'border-gray-800 bg-transparent text-gray-500'
            }`}>
            {net === 'Etisalat' ? 'اتصالات Emerald' : net === 'Vodafone' ? 'فودافون Red' : 'وي Gold'}
          </button>
        ))}
      </div>

      {/* قائمة الخطوط */}
      <div className="max-w-5xl mx-auto space-y-6">
        {masterLines.filter(l => l.network === activeTab).map(line => {
          const stats = getStats(line);
          const isMainOpen = expandedLine === line.id;

          return (
            <div key={line.id} className="bg-[#111] border border-gray-800 rounded-3xl overflow-hidden shadow-xl transition-all">
              {/* واجهة الخط الأساسي */}
              <div 
                onClick={() => setExpandedLine(isMainOpen ? null : line.id)}
                className="p-6 cursor-pointer hover:bg-[#161616] flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500">الرقم الأساسي</span>
                  <input 
                    value={line.masterPhone} 
                    onClick={(e) => e.stopPropagation()} 
                    onChange={(e) => updateMasterLine(line.id, 'masterPhone', e.target.value)}
                    placeholder="أدخل الرقم"
                    className="bg-transparent text-xl font-bold text-[#ca8a04] border-none outline-none focus:ring-0 p-0 w-40"
                  />
                </div>
                
                <div className="flex gap-4 items-center">
                  <div className="text-center px-4 border-l border-gray-800">
                    <p className="text-[10px] text-gray-500">الربح (المحصّل)</p>
                    <p className={`font-bold ${stats.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {stats.profit} ج.م
                    </p>
                  </div>
                  <div className="text-center px-4 border-l border-gray-800">
                    <p className="text-[10px] text-gray-500">المتبقي</p>
                    <p className="font-bold text-blue-400">{stats.remainingGB}GB</p>
                  </div>
                  <span className={`transform transition-transform ${isMainOpen ? 'rotate-180 text-[#ca8a04]' : 'text-gray-700'}`}>▼</span>
                </div>
              </div>

              {/* التفاصيل (7 عملاء + تعديل الخط) */}
              {isMainOpen && (
                <div className="p-6 border-t border-gray-800 bg-[#0d0d0d] space-y-8 animate-slideDown">
                  
                  {/* تعديل الخط الأساسي */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#161616] p-5 rounded-2xl border border-gray-800">
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500">تكلفة الباقة الأساسية</label>
                      <input type="number" value={line.baseCost} onChange={(e) => updateMasterLine(line.id, 'baseCost', Number(e.target.value))}
                             className="w-full bg-black border border-gray-800 rounded-xl p-2 text-yellow-500 outline-none"/>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500">إجمالي الجيجات</label>
                      <input type="number" value={line.totalGB} onChange={(e) => updateMasterLine(line.id, 'totalGB', Number(e.target.value))}
                             className="w-full bg-black border border-gray-800 rounded-xl p-2 text-blue-400 outline-none"/>
                    </div>
                    <div className="space-y-1 flex flex-col justify-center items-center bg-black/40 rounded-xl">
                      <p className="text-[10px] text-gray-600">إجمالي المطلوب لمه</p>
                      <p className="font-bold text-white">{stats.totalPotential} ج.م</p>
                    </div>
                  </div>

                  {/* قائمة المشتركين الـ 7 */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-gray-500">توزيع المشتركين:</h4>
                    {[...Array(7)].map((_, index) => {
                      const sub = line.subscribers[index] || { name: '', phone: '', gb: 0, isPaid: false };
                      return (
                        <div key={index} className="grid grid-cols-2 md:grid-cols-6 gap-3 items-center bg-[#111] p-3 rounded-2xl border border-gray-800">
                          <input placeholder="اسم العميل" value={sub.name} onChange={(e) => updateSub(line.id, index, 'name', e.target.value)}
                                 className="bg-black border border-gray-800 rounded-lg p-2 text-sm outline-none focus:border-[#ca8a04]"/>
                          
                          <input placeholder="الرقم" value={sub.phone} onChange={(e) => updateSub(line.id, index, 'phone', e.target.value)}
                                 className="bg-black border border-gray-800 rounded-lg p-2 text-sm font-mono outline-none"/>
                          
                          <select value={sub.gb} onChange={(e) => updateSub(line.id, index, 'gb', Number(e.target.value))}
                                  className="bg-black border border-gray-800 rounded-lg p-2 text-sm text-yellow-500 outline-none">
                            <option value="0">الباقة</option>
                            {[20, 25, 30, 35, 40].map(g => <option key={g} value={g}>{g} GB</option>)}
                          </select>

                          <div className="text-center md:block hidden">
                             <p className="text-[9px] text-gray-600">الميجابايت</p>
                             <p className="text-blue-400 font-mono text-xs">{sub.gb * 1024}</p>
                          </div>

                          <div className="text-center font-bold text-white text-sm">
                             {planConfigs[sub.gb]?.price || 0} ج
                          </div>

                          <button 
                            onClick={() => updateSub(line.id, index, 'isPaid', !sub.isPaid)}
                            className={`py-2 px-3 rounded-xl text-[10px] font-bold transition-all shadow-inner ${
                              sub.isPaid ? 'bg-green-600 text-white shadow-green-900/50' : 'bg-red-600/20 text-red-500 border border-red-600/30'
                            }`}>
                            {sub.isPaid ? 'تم الدفع ✓' : 'لم يدفع !'}
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
      
      {/* زر إضافة خط أساسي جديد (مفعّل الآن) */}
      <button 
        onClick={addNewLine}
        className="fixed bottom-8 left-8 bg-[#ca8a04] text-black w-14 h-14 rounded-full shadow-[0_0_20px_rgba(202,138,4,0.4)] text-3xl font-bold hover:scale-110 active:scale-95 transition-all flex items-center justify-center">
        +
      </button>

      <style jsx>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown { animation: slideDown 0.4s ease-out; }
      `}</style>
    </div>
  );
}
