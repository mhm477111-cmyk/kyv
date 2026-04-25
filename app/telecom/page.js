'use client';
import { useState } from 'react';

export default function TelecomSystem() {
  const [activeTab, setActiveTab] = useState('Etisalat');
  const [expandedLine, setExpandedLine] = useState(null); // للتحكم في فتح وقفل الخطوط

  // إعدادات الباقات الافتراضية للتسعير التلقائي
  const planConfigs = {
    20: { price: 260, mins: 1500 },
    25: { price: 300, mins: 1500 },
    30: { price: 340, mins: 1500 },
    35: { price: 350, mins: 1500 },
    40: { price: 420, mins: 1500 },
  };

  // البيانات (يفضل مستقبلاً ربطها بـ Firebase)
  const [masterLines, setMasterLines] = useState([
    {
      id: 'L1',
      network: 'Etisalat',
      masterPhone: '1101902909',
      baseCost: 1860,
      totalGB: 195,
      totalMins: 10500,
      subscribers: [
        { id: 1, name: 'إسلام لبان', phone: '01140379721', gb: 25, isPaid: true },
        { id: 2, name: 'علي سميح', phone: '01150606087', gb: 30, isPaid: true },
      ]
    }
  ]);

  // دالة حساب الإحصائيات لكل خط
  const getStats = (line) => {
    const collected = line.subscribers.reduce((acc, sub) => acc + (planConfigs[sub.gb]?.price || 0), 0);
    const usedGB = line.subscribers.reduce((acc, sub) => acc + Number(sub.gb), 0);
    return {
      collected,
      profit: collected - line.baseCost,
      remainingGB: line.totalGB - usedGB
    };
  };

  // دالة تعديل بيانات الخط الأساسي
  const updateMasterLine = (lineId, field, value) => {
    setMasterLines(prev => prev.map(line => 
      line.id === lineId ? { ...line, [field]: Number(value) || value } : line
    ));
  };

  // دالة تعديل أو إضافة مشترك
  const updateSub = (lineId, subIndex, field, value) => {
    setMasterLines(prev => prev.map(line => {
      if (line.id === lineId) {
        const newSubs = [...line.subscribers];
        if (!newSubs[subIndex]) {
           newSubs[subIndex] = { id: Date.now(), name: '', phone: '', gb: 20, isPaid: false };
        }
        newSubs[subIndex] = { ...newSubs[subIndex], [field]: value };
        return { ...line, subscribers: newSubs };
      }
      return line;
    }));
  };

  return (
    <div className="p-4 md:p-8 bg-[#0a0a0a] min-h-screen text-gray-200" dir="rtl">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-black text-[#ca8a04] mb-2">MO CONTROL</h1>
        <p className="text-gray-500">نظام إدارة باقات العائلات والشبكات</p>
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

      {/* قائمة الخطوط الأساسية */}
      <div className="max-w-5xl mx-auto space-y-4">
        {masterLines.filter(l => l.network === activeTab).map(line => {
          const stats = getStats(line);
          const isMainOpen = expandedLine === line.id;

          return (
            <div key={line.id} className="bg-[#111] border border-gray-800 rounded-3xl overflow-hidden transition-all duration-500">
              {/* واجهة الخط (Header) */}
              <div 
                onClick={() => setExpandedLine(isMainOpen ? null : line.id)}
                className="p-6 cursor-pointer hover:bg-[#161616] flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full animate-pulse ${stats.remainingGB > 10 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <h3 className="text-xl font-bold">الرقم الأساسي: <span className="text-[#ca8a04]">{line.masterPhone}</span></h3>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="text-center px-4 border-l border-gray-800">
                    <p className="text-[10px] text-gray-500 uppercase">المتبقي</p>
                    <p className="font-bold text-blue-400">{stats.remainingGB}GB</p>
                  </div>
                  <div className="text-center px-4 border-l border-gray-800">
                    <p className="text-[10px] text-gray-500 uppercase">الربح الصافي</p>
                    <p className={`font-bold ${stats.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>{stats.profit} ج.م</p>
                  </div>
                  <span className={`transform transition-transform text-gray-600 ${isMainOpen ? 'rotate-180' : ''}`}>▼</span>
                </div>
              </div>

              {/* التفاصيل الداخلية (تظهر عند الضغط) */}
              {isMainOpen && (
                <div className="p-6 border-t border-gray-800 bg-[#0d0d0d] space-y-8 animate-fadeIn">
                  
                  {/* قسم تعديل بيانات الخط الأساسي */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#161616] p-4 rounded-2xl border border-gray-800">
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500 mr-2">تكلفة الخط الأساسي</label>
                      <input type="number" value={line.baseCost} onChange={(e) => updateMasterLine(line.id, 'baseCost', e.target.value)}
                             className="w-full bg-black border border-gray-800 rounded-xl p-2 text-yellow-500 focus:border-yellow-600 outline-none"/>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500 mr-2">إجمالي جيجات الخط</label>
                      <input type="number" value={line.totalGB} onChange={(e) => updateMasterLine(line.id, 'totalGB', e.target.value)}
                             className="w-full bg-black border border-gray-800 rounded-xl p-2 text-blue-400 outline-none"/>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500 mr-2">إجمالي الدقائق</label>
                      <input type="number" value={line.totalMins} onChange={(e) => updateMasterLine(line.id, 'totalMins', e.target.value)}
                             className="w-full bg-black border border-gray-800 rounded-xl p-2 text-gray-300 outline-none"/>
                    </div>
                    <div className="flex items-end pb-1 px-2">
                       <p className="text-[10px] text-gray-600 italic">⚠️ التعديلات تسمع فوراً في الحسابات</p>
                    </div>
                  </div>

                  {/* جدول المشتركين (7 أماكن) */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-gray-500 px-2">المشتركين (7 أماكن متاحة):</h4>
                    <div className="grid gap-3">
                      {[...Array(7)].map((_, index) => {
                        const sub = line.subscribers[index] || { name: '', phone: '', gb: 0, isPaid: false };
                        return (
                          <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center bg-[#111] p-3 rounded-2xl border border-gray-800 hover:border-gray-700 transition-all">
                            <input placeholder="اسم العميل" value={sub.name} onChange={(e) => updateSub(line.id, index, 'name', e.target.value)}
                                   className="bg-black border border-gray-800 rounded-lg p-2 text-sm outline-none focus:border-[#ca8a04]"/>
                            
                            <input placeholder="رقم الموبايل" value={sub.phone} onChange={(e) => updateSub(line.id, index, 'phone', e.target.value)}
                                   className="bg-black border border-gray-800 rounded-lg p-2 text-sm font-mono text-gray-400 outline-none"/>
                            
                            <select value={sub.gb} onChange={(e) => updateSub(line.id, index, 'gb', e.target.value)}
                                    className="bg-black border border-gray-800 rounded-lg p-2 text-sm outline-none text-yellow-500">
                              <option value="0">اختر الباقة</option>
                              {[20, 25, 30, 35, 40].map(g => <option key={g} value={g}>{g} GB</option>)}
                            </select>

                            <div className="text-center">
                               <p className="text-[10px] text-gray-600">الميجابايت</p>
                               <p className="text-blue-400 font-mono text-xs">{sub.gb * 1024} MB</p>
                            </div>

                            <div className="text-center">
                               <p className="text-[10px] text-gray-600">السعر</p>
                               <p className="text-white font-bold">{planConfigs[sub.gb]?.price || 0} ج</p>
                            </div>

                            <button 
                              onClick={() => updateSub(line.id, index, 'isPaid', !sub.isPaid)}
                              className={`py-2 rounded-xl text-[10px] font-bold transition-all ${sub.isPaid ? 'bg-green-600/10 text-green-500 border border-green-600/20' : 'bg-red-600/10 text-red-500 border border-red-600/20'}`}>
                              {sub.isPaid ? 'تم الدفع' : 'لم يدفع'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* زر إضافة خط أساسي جديد */}
      <button className="fixed bottom-8 left-8 bg-[#ca8a04] text-black w-14 h-14 rounded-full shadow-2xl text-2xl font-bold hover:scale-110 transition-transform">
        +
      </button>
    </div>
  );
}
