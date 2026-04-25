'use client';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebaseConfigV2';
import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc, setDoc } from 'firebase/firestore';
import * as XLSX from 'xlsx';

export default function TelecomSystem() {
  const [activeTab, setActiveTab] = useState('Etisalat');
  const [activeCycle, setActiveCycle] = useState('1');
  const [expandedLine, setExpandedLine] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [masterLines, setMasterLines] = useState([]);
  const [showStats, setShowStats] = useState(false);

  const defaultSub = { 
    name: '', phone: '', home4g: '', gb: 0, sentMB: 4096, mins: 1500, price: 0, paidAmount: 0, 
    discountNum: '', contactNum: '', packageVal: 225, isPaid: true, parentOwner: '' 
  };

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "lines"), (snapshot) => {
      setMasterLines(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const addNewLine = async () => {
    const isHome4G = activeTab === 'Home4G';
    await addDoc(collection(db, "lines"), { 
      network: activeTab, cycle: activeCycle, ownerName: isHome4G ? 'عميل جديد' : 'خط جديد',
      baseCost: 0, totalGB: 0, totalMins: 0, activationDate: '', masterPhone: '',
      subscribers: isHome4G ? [defaultSub] : Array(15).fill(defaultSub)
    });
  };

  const updateSub = async (lineId, subIndex, field, value, currentSubscribers) => {
    let newSubs = [...currentSubscribers];
    newSubs[subIndex] = { ...newSubs[subIndex], [field]: value };
    await updateDoc(doc(db, "lines", lineId), { subscribers: newSubs });
  };

  const updateMasterLine = async (lineId, field, value) => {
    await updateDoc(doc(db, "lines", lineId), { [field]: value });
  };

  return (
    <div className="p-4 md:p-8 bg-[#0a0a0a] min-h-screen text-gray-200" dir="rtl">
      <header className="mb-6 text-center"><h1 className="text-4xl font-black text-[#ca8a04]">MO CONTROL</h1></header>

      <div className="flex justify-center gap-3 mb-6 flex-wrap">
        {['Etisalat', 'Vodafone', 'WE', 'Home4G'].map(net => (
          <button key={net} onClick={() => setActiveTab(net)} className={`px-6 py-3 rounded-2xl font-bold border-2 ${activeTab === net ? 'border-[#ca8a04] bg-[#ca8a04] text-black' : 'border-gray-800 text-gray-500'}`}>
            {net === 'Home4G' ? 'Home 4G' : net}
          </button>
        ))}
      </div>

      {activeTab === 'Home4G' ? (
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-7 gap-2 mb-2 px-2 text-[10px] font-bold text-gray-500 text-center">
            <div>صاحب البيرنت</div><div>Home 4G</div><div>رقم الخصم</div><div>المشترك</div><div>رقم التواصل</div><div>الباقة</div><div>الحالة</div>
          </div>
          {masterLines.filter(l => l.network === 'Home4G' && l.cycle === activeCycle).map(line => {
            const sub = line.subscribers[0];
            return (
              <div key={line.id} className="grid grid-cols-7 gap-2 items-center bg-[#111] p-3 mb-2 rounded-lg border border-gray-800 text-center">
                <input value={sub.parentOwner || ''} onChange={(e) => updateSub(line.id, 0, 'parentOwner', e.target.value, line.subscribers)} className="bg-black border p-1 rounded text-[11px]"/>
                <input value={sub.home4g || ''} onChange={(e) => updateSub(line.id, 0, 'home4g', e.target.value, line.subscribers)} className="bg-black border p-1 rounded text-[11px]"/>
                <input value={sub.discountNum || ''} onChange={(e) => updateSub(line.id, 0, 'discountNum', e.target.value, line.subscribers)} className="bg-black border p-1 rounded text-[11px]"/>
                <input value={sub.name || ''} onChange={(e) => updateSub(line.id, 0, 'name', e.target.value, line.subscribers)} className="bg-black border p-1 rounded text-[11px]"/>
                <input value={sub.contactNum || ''} onChange={(e) => updateSub(line.id, 0, 'contactNum', e.target.value, line.subscribers)} className="bg-black border p-1 rounded text-[11px]"/>
                <input type="number" value={sub.packageVal || 225} onChange={(e) => updateSub(line.id, 0, 'packageVal', e.target.value, line.subscribers)} className="bg-black border p-1 rounded text-[11px]"/>
                <button onClick={() => updateSub(line.id, 0, 'isPaid', !sub.isPaid, line.subscribers)} className={`p-1 rounded text-[10px] ${sub.isPaid ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
                  {sub.isPaid ? 'تم الدفع' : 'لم يدفع'}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="max-w-7xl mx-auto space-y-4">
          {masterLines.filter(l => l.network === activeTab && l.cycle === activeCycle).map(line => (
             <div key={line.id} className="bg-[#111] border border-gray-800 rounded-3xl p-4">
                <input value={line.ownerName} onChange={(e) => updateMasterLine(line.id, 'ownerName', e.target.value)} className="text-xl font-bold mb-4 bg-transparent w-full outline-none"/>
                <div className="space-y-2 overflow-x-auto">
                    {line.subscribers.map((sub, i) => (
                        <div key={i} className="grid grid-cols-2 gap-2 bg-black p-2 rounded">
                            <input value={sub.name} onChange={(e) => updateSub(line.id, i, 'name', e.target.value, line.subscribers)} className="bg-transparent text-white" placeholder="الاسم"/>
                            <input value={sub.phone} onChange={(e) => updateSub(line.id, i, 'phone', e.target.value, line.subscribers)} className="bg-transparent text-white" placeholder="الرقم"/>
                        </div>
                    ))}
                </div>
             </div>
          ))}
        </div>
      )}

      <div className="fixed bottom-8 left-8">
        <button onClick={addNewLine} className="bg-[#ca8a04] text-black w-14 h-14 rounded-full shadow-2xl text-3xl font-bold hover:scale-110 transition-all">+</button>
      </div>
    </div>
  );
}
