'use client';
import { useState } from 'react';

export default function TelecomDashboard() {
  // 1. التحكم في الأقسام (الشبكات)
  const [activeTab, setActiveTab] = useState('Etisalat');

  // 2. إعدادات الباقات (عشان السيستم يسعر أوتوماتيك)
  const planConfigs = {
    20: { price: 260, mins: 1500 },
    25: { price: 300, mins: 1500 },
    30: { price: 340, mins: 1500 },
    35: { price: 350, mins: 1500 },
    40: { price: 420, mins: 1500 },
  };

  // 3. حالة مبدئية لخط رئيسي (كمثال للتجربة)
  const [masterLines, setMasterLines] = useState([
    {
      id: 1,
      network: 'Etisalat',
      masterPhone: '1101902909',
      baseCost: 1860,
      totalGB: 195, // إجمالي باقة الإنترنت للخط
      totalMins: 10500, // إجمالي الدقائق
      subscribers: [
        { id: 's1', name: 'اسلام لبان', phone: '01140379721', gb: 25, isPaid: true },
        { id: 's2', name: 'علي سميح', phone: '01150606087', gb: 30, isPaid: true },
        { id: 's3', name: 'الحضري', phone: '01156177494', gb: 20, isPaid: false }, // لم يدفع
      ]
    }
  ]);

  // دالة لحساب تفاصيل الخط الرئيسي
  const calculateLineStats = (line) => {
    let collectedMoney = 0;
    let usedGB = 0;
    let usedMins = 0;

    line.subscribers.forEach(sub => {
      const config = planConfigs[sub.gb] || { price: 0, mins: 0 };
      collectedMoney += config.price;
      usedGB += Number(sub.gb);
      usedMins += config.mins;
    });

    const profit = collectedMoney - line.baseCost;
    const remainingGB = line.totalGB - usedGB;
    
    return { collectedMoney, profit, remainingGB, usedGB };
  };

  return (
    <div className="p-8 bg-black min-h-screen text-white" dir="rtl">
      <h1 className="text-3xl font-bold text-yellow-500 mb-8">إدارة باقات العائلات</h1>

      {/* أزرار التنقل بين الشبكات */}
      <div className="flex gap-4 mb-8">
        <button 
          onClick={() => setActiveTab('Etisalat')}
          className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'Etisalat' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
          اتصالات (Emerald)
        </button>
        <button 
          onClick={() => setActiveTab('Vodafone')}
          className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'Vodafone' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
          فودافون (Red)
        </button>
        <button 
          onClick={() => setActiveTab('WE')}
          className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'WE' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
          وي (Gold)
        </button>
      </div>

      {/* عرض الخطوط الخاصة بالشبكة المحددة */}
      <div className="grid gap-8">
        {masterLines.filter(line => line.network === activeTab).map(line => {
          const stats = calculateLineStats(line);
          
          return (
            <div key={line.id} className="bg-gray-900 border border-gray-700 rounded-3xl p-6">
              {/* هيدر الكارت (إحصائيات الخط الرئيسي) */}
              <div className="flex justify-between items-center border-b border-gray-700 pb-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-yellow-500">رقم الخط: {line.masterPhone}</h2>
                  <p className="text-sm text-gray-400 mt-1">تكلفة الخط: {line.baseCost} ج.م</p>
                </div>
                <div className="flex gap-6 text-center">
                  <div className="bg-black p-3 rounded-xl border border-gray-800">
                    <p className="text-[10px] text-gray-500">إجمالي الملموم</p>
                    <p className="font-bold text-lg">{stats.collectedMoney} ج.م</p>
                  </div>
                  <div className={`p-3 rounded-xl border ${stats.profit >= 0 ? 'bg-green-900/20 border-green-700 text-green-500' : 'bg-red-900/20 border-red-700 text-red-500'}`}>
                    <p className="text-[10px]">الربح / الخسارة</p>
                    <p className="font-bold text-lg" dir="ltr">{stats.profit} ج.م</p>
                  </div>
                  <div className="bg-black p-3 rounded-xl border border-gray-800">
                    <p className="text-[10px] text-gray-500">المتبقي من الجيجات</p>
                    <p className="font-bold text-lg text-blue-400">{stats.remainingGB} GB</p>
                  </div>
                </div>
              </div>

              {/* جدول المشتركين الـ 7 */}
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="bg-gray-800 text-gray-400">
                    <tr>
                      <th className="p-3 rounded-tr-xl">العميل</th>
                      <th className="p-3">رقم الموبايل</th>
                      <th className="p-3">الباقة (GB)</th>
                      <th className="p-3">السعر التلقائي</th>
                      <th className="p-3">الميجابايت (للتحويل)</th>
                      <th className="p-3 rounded-tl-xl">حالة الدفع</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* عرض المشتركين الحاليين */}
                    {line.subscribers.map((sub, index) => (
                      <tr key={sub.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-all">
                        <td className="p-3 font-bold">{sub.name}</td>
                        <td className="p-3 font-mono text-yellow-500">{sub.phone}</td>
                        <td className="p-3">{sub.gb} GB</td>
                        <td className="p-3 font-bold">{planConfigs[sub.gb]?.price || 0} ج.م</td>
                        {/* هنا المعادلة اللي بتضرب في 1024 */}
                        <td className="p-3 font-mono text-blue-400">{sub.gb * 1024} MB</td>
                        <td className="p-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${sub.isPaid ? 'bg-green-600/20 text-green-500' : 'bg-red-600/20 text-red-500'}`}>
                            {sub.isPaid ? 'تم الدفع' : 'عليه فلوس'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    
                    {/* إضافة خانات فارغة لتكملة الـ 7 أماكن */}
                    {[...Array(7 - line.subscribers.length)].map((_, i) => (
                      <tr key={`empty-${i}`} className="border-b border-gray-800 opacity-50">
                        <td className="p-3 text-gray-600">مكان فارغ...</td>
                        <td className="p-3">-</td>
                        <td className="p-3">-</td>
                        <td className="p-3">-</td>
                        <td className="p-3">-</td>
                        <td className="p-3">-</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <button className="mt-4 w-full bg-gray-800 hover:bg-gray-700 text-yellow-500 py-3 rounded-xl font-bold transition-all border border-gray-700 border-dashed">
                + إضافة عميل جديد
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}