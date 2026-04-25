'use client';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebaseConfigV2';
import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';

export default function TelecomSystem() {
  const [activeTab, setActiveTab] = useState('Etisalat');
  const [expandedLine, setExpandedLine] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [masterLines, setMasterLines] = useState([]);

  const priceTable = {
    'Etisalat': { 20: 260, 25: 300, 30: 340, 40: 420, 50: 500, 60: 640 },
    'Vodafone': { 20: 300, 25: 340, 30: 380, 40: 460, 50: 520, 60: 580 },
    'WE': { 20: 250, 25: 280, 30: 310, 40: 360, 50: 410, 60: 520 }
  };

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "lines"), (snapshot) => {
      setMasterLines(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const addNewLine = async () => {
    try {
      await addDoc(collection(db, "lines"), {
        network: activeTab,
        masterPhone: '',
        ownerName: 'خط جديد',
        baseCost: 0,
        totalGB: 0,
        totalMins: 0,
        subscribers: []
      });
    } catch (err) {
      console.error("Error adding:", err);
      alert("خطأ في الاتصال بقاعدة البيانات");
    }
  };

  const deleteLine = async (e, id) => {
    e.stopPropagation();
    if(window.confirm("هل تريد حذف هذا الخط نهائياً؟")) {
      await deleteDoc(doc(db, "lines", id));
    }
  };

  const updateMasterLine = async (lineId, field, value) => {
    await updateDoc(doc(db, "lines", lineId), { [field]: value });
  };

  const updateSub = async (lineId, subIndex, field, value, currentSubscribers) => {
    let newSubs = currentSubscribers ? [...currentSubscribers] : [];
    if (!newSubs[subIndex]) newSubs[subIndex] = { name: '', phone: '', gb: 0, sentMB: 0, mins: 1500, price: 0, paidAmount: 0 };
    
    newSubs[subIndex][field] = value;
    
    if (field === 'gb') {
      const line = masterLines.find(l => l.id === lineId);
      newSubs[subIndex].price = priceTable[line?.network]?.[value] || 0;
    }
    
    await updateDoc(doc(db, "lines", lineId), { subscribers: newSubs });
  };

  const getStats = (line) => {
    const subs = line.subscribers || [];
    let actualCollected = 0, totalPrices = 0, usedGB = 0, usedMins = 0;
    subs.forEach(sub => {
      actualCollected += Number(sub.paidAmount || 0);
      totalPrices += Number(sub.price || 0);
      usedGB += Number(sub.gb || 0);
      usedMins += Number(sub.mins || 0);
    });
    return {
      profit: actualCollected - (line.baseCost || 0),
      debts: totalPrices - actualCollected,
      remainingGB: (line.totalGB || 0) - usedGB,
      remainingMins: (line.totalMins || 0) - usedMins
    };
  };

  const filteredLines = masterLines.filter(line => {
    const searchLower = searchTerm.toLowerCase();
    const matchesMaster = (line.ownerName?.toLowerCase().includes(searchLower) || line.masterPhone?.includes(searchTerm));
    const matchesSub = line.subscribers?.some(sub => sub.name?.toLowerCase().includes(searchLower) || sub.phone?.includes(searchTerm));
    return (line.network === activeTab) && (matchesMaster || matchesSub || searchTerm === '');
  });

  return (
    <div className="p-4 md:p-8 bg-[#0a0a0a] min-h-screen text-gray-200" dir="rtl">
      <header className="mb-6 text-center"><h1 className="text-4xl font-black text-[#ca8a04]">MO CONTROL</h1></header>
      
      <div className="max-w-xl mx-auto mb-8">
        <input type="text" placeholder="البحث باسم العميل أو الرقم..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#111] border border-gray-800 rounded-2xl py-4 px-6 text-sm outline-none focus:border-[#ca8a04]"/>
      </div>

      <div className="flex justify-center gap-3 mb-10">
        {['Etisalat', 'Vodafone', 'WE'].map(net => (
          <button key={net} onClick={() => setActiveTab(net)} className={`px-8 py-3 rounded-2xl font-bold border-2 ${activeTab === net ? 'border-[#ca8a04] bg-[#ca8a04] text-black' : 'border-gray-800 text-gray-500'}`}>
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
              <div onClick={() => setExpandedLine(isMainOpen ? null : line.id)} className="p-4 cursor-pointer flex flex-wrap items-center justify-between gap-4">
                <div className="w-full md:w-52">
                  <p className="font-bold text-white text-sm">{line.ownerName}</p>
                  <p className="text-xs text-gray-500">{line.masterPhone}</p>
                </div>
                <div className="flex gap-2">
                    <span className="text-green-500 font-bold text-xs">الربح: {stats.profit}</span>
                    <span className="text-orange-500 font-bold text-xs">ديون: {stats.debts}</span>
                </div>
                <button onClick={(e) => deleteLine(e, line.id)} className="text-red-500">🗑️</button>
              </div>

              {isMainOpen && (
                <div className="p-6 border-t border-gray-800 bg-[#0d0d0d]">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                        {['ownerName', 'masterPhone', 'totalGB', 'totalMins', 'baseCost'].map((k, i) => (
                          <input key={i} placeholder={k} value={line[k] || ''} onChange={(e) => updateMasterLine(line.id, k, e.target.value)} className="bg-black p-2 border border-gray-800 rounded-lg text-sm"/>
                        ))}
                    </div>
                    {/* يمكنك إضافة جزء المشتركين هنا بنفس الطريقة */}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button onClick={addNewLine} className="fixed bottom-8 left-8 bg-[#ca8a04] text-black w-14 h-14 rounded-full text-3xl font-bold shadow-2xl">+</button>
    </div>
  );
}
