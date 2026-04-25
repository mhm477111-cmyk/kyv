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

  const priceTable = {
    'Etisalat': { 20: 260, 25: 300, 30: 340, 40: 420, 50: 500, 60: 640 },
    'Vodafone': { 20: 300, 25: 340, 30: 380, 40: 460, 50: 520, 60: 580 },
    'WE': { 20: 250, 25: 280, 30: 310, 40: 360, 50: 410, 60: 520 },
    'Home4G': { 225: 225 }
  };

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "lines"), (snapshot) => {
      setMasterLines(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

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

  const totalProfit = masterLines.reduce((acc, line) => acc + getStats(line).profit, 0);
  const networkCounts = { Etisalat: 0, Vodafone: 0, WE: 0, Home4G: 0 };
  masterLines.forEach(l => networkCounts[l.network] = (networkCounts[l.network] || 0) + 1);

  const exportToExcel = () => {
    const dataToExport = masterLines.map(line => ({
      "ID": line.id, "صاحب الخط": line.ownerName || '', "الرقم": line.masterPhone || '', "الشبكة": line.network || '', "السايكل": line.cycle || '', "تاريخ التفعيل": line.activationDate || '', "التكلفة": line.baseCost || 0, "الجيجا": line.totalGB || 0, "الدقائق": line.totalMins || 0, "بيانات المشتركين (JSON)": JSON.stringify(line.subscribers || [])
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "FullBackup");
    XLSX.writeFile(workbook, "MO_CONTROL_Full_Backup.xlsx");
  };

  const addNewLine = async () => {
    await addDoc(collection(db, "lines"), { network: activeTab, cycle: activeCycle, masterPhone: '', ownerName: 'خط جديد', activationDate: '', baseCost: 0, totalGB: 0, totalMins: 0, subscribers: Array(15).fill(defaultSub) });
  };

  const deleteLine = async (e, id) => {
    e.stopPropagation();
    if(window.confirm("هل تريد حذف هذا الخط نهائياً؟")) await deleteDoc(doc(db, "lines", id));
  };

  const updateMasterLine = async (lineId, field, value) => {
    const val = (field === 'totalGB' || field === 'totalMins' || field === 'baseCost') ? Number(value) : value;
    await updateDoc(doc(db, "lines", lineId), { [field]: val });
  };

  const updateSub = async (lineId, subIndex, field, value, currentSubscribers) => {
    let newSubs = [...currentSubscribers];
    const updatedValue = ['paidAmount', 'packageVal', 'price', 'gb', 'mins'].includes(field) ? Number(value) : value;
    newSubs[subIndex] = { ...newSubs[subIndex], [field]: updatedValue };
    await updateDoc(doc(db, "lines", lineId), { subscribers: newSubs });
  };

  const filteredLines = masterLines.filter(line => line.network === activeTab && line.cycle === activeCycle);

  return (
    <div className="p-4 bg-[#0a0a0a] min-h-screen text-gray-200" dir="rtl">
      <header className="mb-6 text-center"><h1 className="text-4xl font-black text-[#ca8a04]">MO CONTROL</h1></header>
      
      <div className="flex justify-center gap-3 mb-6 flex-wrap">
        {['Etisalat', 'Vodafone', 'WE', 'Home4G'].map(net => (
          <button key={net} onClick={() => setActiveTab(net)} className={`px-6 py-3 rounded-2xl font-bold border-2 ${activeTab === net ? 'border-[#ca8a04] bg-[#ca8a04] text-black' : 'border-gray-800 text-gray-500'}`}>
            {net === 'Home4G' ? 'Home 4G' : net}
          </button>
        ))}
      </div>

      <div className="max-w-7xl mx-auto space-y-4">
        {filteredLines.map(line => {
          const stats = getStats(line);
          const isOpen = expandedLine === line.id;
          return (
            <div key={line.id} className="bg-[#111] border border-gray-800 rounded-3xl p-4">
              <div onClick={() => setExpandedLine(isOpen ? null : line.id)} className="flex justify-between items-center cursor-pointer">
                <h2 className="text-xl font-bold">{line.ownerName} | ربح: {stats.profit} ج</h2>
                <button onClick={(e) => deleteLine(e, line.id)} className="text-red-500">🗑️</button>
              </div>
              
              {isOpen && (
                <div className="mt-4 overflow-x-auto">
                    {activeTab === 'Home4G' ? (
                        <>
                            <div className="grid grid-cols-8 gap-2 text-[10px] text-gray-500 text-center min-w-[900px] mb-2 font-bold">
                                <div>صاحب البرينت</div><div>خط الهوم</div><div>رقم الخصم</div><div>المشترك</div><div>رقم التواصل</div><div>الباقة</div><div>الحالة</div><div>المبلغ المدفوع</div>
                            </div>
                            {line.subscribers.map((sub, i) => (
                                <div key={i} className="grid grid-cols-8 gap-2 bg-black p-2 rounded min-w-[900px] mb-1">
                                    <input value={sub.parentOwner} onChange={(e) => updateSub(line.id, i, 'parentOwner', e.target.value, line.subscribers)} className="bg-transparent text-center text-xs" />
                                    <input value={sub.home4g} onChange={(e) => updateSub(line.id, i, 'home4g', e.target.value, line.subscribers)} className="bg-transparent text-center text-xs" />
                                    <input value={sub.discountNum} onChange={(e) => updateSub(line.id, i, 'discountNum', e.target.value, line.subscribers)} className="bg-transparent text-center text-xs" />
                                    <input value={sub.name} onChange={(e) => updateSub(line.id, i, 'name', e.target.value, line.subscribers)} className="bg-transparent text-center text-xs" />
                                    <input value={sub.contactNum} onChange={(e) => updateSub(line.id, i, 'contactNum', e.target.value, line.subscribers)} className="bg-transparent text-center text-xs" />
                                    <input type="number" value={sub.packageVal} onChange={(e) => updateSub(line.id, i, 'packageVal', e.target.value, line.subscribers)} className="bg-transparent text-center text-xs" />
                                    <button onClick={() => updateSub(line.id, i, 'isPaid', !sub.isPaid, line.subscribers)} className={`text-[10px] ${sub.isPaid ? 'text-green-500' : 'text-red-500'}`}>
                                        {sub.isPaid ? 'تم' : 'لم يتم'}
                                    </button>
                                    <input type="number" value={sub.paidAmount} onChange={(e) => updateSub(line.id, i, 'paidAmount', e.target.value, line.subscribers)} className="bg-transparent text-center text-xs border-b border-gray-700" />
                                </div>
                            ))}
                        </>
                    ) : (
                        <div className="text-gray-400 p-4">نظام الشبكات العادية (استمر في استخدام الواجهة المعتادة)</div>
                    )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-8 left-8 flex gap-2">
        <button onClick={exportToExcel} className="bg-green-600 text-white w-12 h-12 rounded-full font-bold">📥</button>
        <button onClick={addNewLine} className="bg-[#ca8a04] text-black w-14 h-14 rounded-full text-3xl font-bold">+</button>
      </div>
    </div>
  );
}
