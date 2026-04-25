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

  const exportToExcel = () => {
    const dataToExport = masterLines.map(line => ({
      "ID": line.id, "صاحب الخط": line.ownerName || '', "الرقم": line.masterPhone || '', "الشبكة": line.network || '', "السايكل": line.cycle || '', "تاريخ التفعيل": line.activationDate || '', "التكلفة": line.baseCost || 0, "الجيجا": line.totalGB || 0, "الدقائق": line.totalMins || 0, "بيانات المشتركين (JSON)": JSON.stringify(line.subscribers || [])
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "FullBackup");
    XLSX.writeFile(workbook, "MO_CONTROL_Full_Backup.xlsx");
  };

  const importFromExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
      for (const item of jsonData) {
        await setDoc(doc(db, "lines", item["ID"]), {
          ownerName: item["صاحب الخط"] || '', masterPhone: item["الرقم"] || '', network: item["الشبكة"] || '',
          cycle: String(item["السايكل"] || ''), activationDate: item["تاريخ التفعيل"] || '',
          baseCost: Number(item["التكلفة"]) || 0, totalGB: Number(item["الجيجا"]) || 0, totalMins: Number(item["الدقائق"]) || 0,
          subscribers: item["بيانات المشتركين (JSON)"] ? JSON.parse(item["بيانات المشتركين (JSON)"]) : Array(7).fill({ name: '', phone: '', gb: 0, sentMB: 4096, mins: 1500, price: 0, paidAmount: 0 })
        });
      }
      alert("تم استعادة البيانات بنجاح!");
    };
    reader.readAsArrayBuffer(file);
  };

  const addNewLine = async () => {
    try {
      const isHome4G = activeTab === 'Home4G';
      await addDoc(collection(db, "lines"), {
        network: activeTab,
        cycle: activeCycle,
        masterPhone: '',
        ownerName: 'خط جديد',
        activationDate: '',
        baseCost: 0,
        totalGB: 0,
        totalMins: 0,
        subscribers: isHome4G ? Array(1).fill({ name: '', phone: '', gb: 0, sentMB: 4096, mins: 1500, price: 0, paidAmount: 0, parentOwner: '', home4g: '', discountNum: '', contactNum: '', packageVal: 225 }) 
                              : Array(7).fill({ name: '', phone: '', gb: 0, sentMB: 4096, mins: 1500, price: 0, paidAmount: 0 })
      });
    } catch (err) { alert("خطأ في الاتصال"); }
  };

  const deleteLine = async (e, id) => {
    e.stopPropagation();
    if(window.confirm("حذف الخط نهائياً؟")) await deleteDoc(doc(db, "lines", id));
  };

  const updateMasterLine = async (lineId, field, value) => {
    const val = (field === 'totalGB' || field === 'totalMins' || field === 'baseCost') ? Number(value) : value;
    await updateDoc(doc(db, "lines", lineId), { [field]: val });
  };

  const updateSub = async (lineId, subIndex, field, value, currentSubscribers) => {
    let newSubs = currentSubscribers ? [...currentSubscribers] : Array(7).fill({});
    const updatedValue = ['gb', 'sentMB', 'mins', 'price', 'paidAmount', 'packageVal'].includes(field) ? Number(value) : value;
    newSubs[subIndex] = { ...newSubs[subIndex], [field]: updatedValue };
    if (field === 'gb') {
      const line = masterLines.find(l => l.id === lineId);
      newSubs[subIndex].price = priceTable[line?.network]?.[updatedValue] || 0;
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
    return { profit: actualCollected - (line.baseCost || 0), debts: totalPrices - actualCollected, remainingGB: (line.totalGB || 0) - usedGB, remainingMins: (line.totalMins || 0) - usedMins };
  };

  const filteredLines = masterLines.filter(line => {
    const searchLower = searchTerm.toLowerCase();
    const matchesMaster = (line.ownerName?.toLowerCase().includes(searchLower) || line.masterPhone?.includes(searchTerm));
    const matchesSub = line.subscribers?.some(sub => sub.name?.toLowerCase().includes(searchLower) || sub.phone?.includes(searchTerm));
    return (line.network === activeTab) && (line.cycle === activeCycle) && (matchesMaster || matchesSub || searchTerm === '');
  });

  return (
    <div className="p-4 md:p-8 bg-[#0a0a0a] min-h-screen text-gray-200" dir="rtl">
      <header className="mb-6 text-center"><h1 className="text-4xl font-black text-[#ca8a04]">MO CONTROL</h1></header>
      <div className="max-w-xl mx-auto mb-8"><input type="text" placeholder="البحث..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#111] border border-gray-800 rounded-2xl py-4 px-6 text-sm"/></div>
      <div className="flex justify-center gap-3 mb-10">
        {['Etisalat', 'Vodafone', 'WE', 'Home4G'].map(net => (
          <button key={net} onClick={() => {setActiveTab(net); setExpandedLine(null);}} className={`px-8 py-3 rounded-2xl font-bold border-2 ${activeTab === net ? 'border-[#ca8a04] bg-[#ca8a04] text-black' : 'border-gray-800 text-gray-500'}`}>{net}</button>
        ))}
      </div>
      <div className="max-w-7xl mx-auto space-y-4">
        {filteredLines.map(line => {
          const stats = getStats(line);
          const isMainOpen = expandedLine === line.id;
          return (
            <div key={line.id} className="bg-[#111] border border-gray-800 rounded-3xl overflow-hidden shadow-xl">
              <div onClick={() => setExpandedLine(isMainOpen ? null : line.id)} className="p-4 cursor-pointer flex justify-between items-center">
                <span className="font-bold">{line.ownerName} | ربح: {stats.profit} ج</span>
                <button onClick={(e) => deleteLine(e, line.id)} className="text-gray-600">🗑️</button>
              </div>
              {isMainOpen && (
                <div className="p-6 border-t border-gray-800 overflow-x-auto">
                  {activeTab === 'Home4G' ? (
                    <div className="min-w-[900px]">
                      {line.subscribers.map((sub, i) => (
                        <div key={i} className="grid grid-cols-7 gap-2 bg-black p-2 rounded text-center">
                          <input value={sub.parentOwner || ''} onChange={(e) => updateSub(line.id, i, 'parentOwner', e.target.value, line.subscribers)} className="bg-transparent text-xs text-center border-b border-gray-800" placeholder="صاحب البرينت"/>
                          <input value={sub.home4g || ''} onChange={(e) => updateSub(line.id, i, 'home4g', e.target.value, line.subscribers)} className="bg-transparent text-xs text-center border-b border-gray-800" placeholder="Home 4G"/>
                          <input value={sub.discountNum || ''} onChange={(e) => updateSub(line.id, i, 'discountNum', e.target.value, line.subscribers)} className="bg-transparent text-xs text-center border-b border-gray-800" placeholder="رقم الخصم"/>
                          <input value={sub.name || ''} onChange={(e) => updateSub(line.id, i, 'name', e.target.value, line.subscribers)} className="bg-transparent text-xs text-center border-b border-gray-800" placeholder="المشترك"/>
                          <input value={sub.contactNum || ''} onChange={(e) => updateSub(line.id, i, 'contactNum', e.target.value, line.subscribers)} className="bg-transparent text-xs text-center border-b border-gray-800" placeholder="رقم التواصل"/>
                          <input type="number" value={sub.packageVal || 225} onChange={(e) => updateSub(line.id, i, 'packageVal', e.target.value, line.subscribers)} className="bg-transparent text-xs text-center border-b border-gray-800" placeholder="الباقة"/>
                          <input type="number" value={sub.paidAmount || 0} onChange={(e) => updateSub(line.id, i, 'paidAmount', e.target.value, line.subscribers)} className="bg-transparent text-xs text-center border-b border-gray-800" placeholder="المدفوع"/>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">نظام الشبكات العادية...</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="fixed bottom-8 left-8 flex gap-3">
        <button onClick={exportToExcel} className="bg-green-600 text-white w-12 h-12 rounded-full">📥</button>
        <button onClick={addNewLine} className="bg-[#ca8a04] text-black w-14 h-14 rounded-full text-3xl font-bold">+</button>
      </div>
    </div>
  );
}
