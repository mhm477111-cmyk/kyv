'use client';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebaseConfigV2';
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, setDoc } from 'firebase/firestore';
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

  const fetchLines = async () => {
    const snapshot = await getDocs(collection(db, "lines"));
    setMasterLines(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => { fetchLines(); }, []);

  const exportToExcel = () => {
    const dataToExport = masterLines.map(line => ({
      "ID": line.id, "صاحب الخط": line.ownerName, "الرقم": line.masterPhone, "الشبكة": line.network,
      "السايكل": line.cycle, "تاريخ التفعيل": line.activationDate, "التكلفة": line.baseCost,
      "الجيجا": line.totalGB, "الدقائق": line.totalMins, "بيانات المشتركين (JSON)": JSON.stringify(line.subscribers)
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "FullBackup");
    XLSX.writeFile(workbook, "MO_CONTROL_Full_Backup.xlsx");
  };

  const importFromExcel = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
      for (const item of jsonData) {
        await setDoc(doc(db, "lines", item["ID"]), {
          ownerName: item["صاحب الخط"], masterPhone: item["الرقم"], network: item["الشبكة"],
          cycle: item["السايكل"], activationDate: item["تاريخ التفعيل"], baseCost: item["التكلفة"],
          totalGB: item["الجيجا"], totalMins: item["الدقائق"], subscribers: JSON.parse(item["بيانات المشتركين (JSON)"])
        });
      }
      alert("تم استعادة البيانات بنجاح!");
      fetchLines();
    };
    reader.readAsArrayBuffer(file);
  };

  const addNewLine = async () => {
    await addDoc(collection(db, "lines"), {
      network: activeTab, cycle: activeCycle, masterPhone: '', ownerName: 'خط جديد',
      activationDate: '', baseCost: 0, totalGB: 0, totalMins: 0,
      subscribers: Array(7).fill({ name: '', phone: '', gb: 0, sentMB: 4096, mins: 1500, price: 0, paidAmount: 0 })
    });
    fetchLines();
  };

  const deleteLine = async (e, id) => {
    e.stopPropagation();
    if(window.confirm("هل تريد حذف هذا الخط نهائياً؟")) { await deleteDoc(doc(db, "lines", id)); fetchLines(); }
  };

  const updateMasterLine = async (lineId, field, value) => {
    const val = (['totalGB', 'totalMins', 'baseCost'].includes(field)) ? Number(value) : value;
    await updateDoc(doc(db, "lines", lineId), { [field]: val });
    setMasterLines(prev => prev.map(l => l.id === lineId ? { ...l, [field]: val } : l));
  };

  const updateSub = async (lineId, subIndex, field, value, currentSubscribers) => {
    let newSubs = [...currentSubscribers];
    const updatedValue = (['gb', 'sentMB', 'mins', 'price', 'paidAmount'].includes(field)) ? Number(value) : value;
    newSubs[subIndex] = { ...newSubs[subIndex], [field]: updatedValue };
    if (field === 'gb') {
      const line = masterLines.find(l => l.id === lineId);
      newSubs[subIndex].price = priceTable[line?.network]?.[updatedValue] || 0;
    }
    await updateDoc(doc(db, "lines", lineId), { subscribers: newSubs });
    setMasterLines(prev => prev.map(l => l.id === lineId ? { ...l, subscribers: newSubs } : l));
  };

  const getStats = (line) => {
    const subs = line.subscribers || [];
    let actualCollected = 0, totalPrices = 0, usedGB = 0, usedMins = 0;
    subs.forEach(s => { actualCollected += Number(s.paidAmount || 0); totalPrices += Number(s.price || 0); usedGB += Number(s.gb || 0); usedMins += Number(s.mins || 0); });
    return { profit: actualCollected - (line.baseCost || 0), debts: totalPrices - actualCollected, remainingGB: (line.totalGB || 0) - usedGB, remainingMins: (line.totalMins || 0) - usedMins };
  };

  const filteredLines = masterLines.filter(line => (line.network === activeTab) && (line.cycle === activeCycle));

  return (
    <div className="p-4 md:p-8 bg-[#0a0a0a] min-h-screen text-gray-200" dir="rtl">
      <header className="mb-6 text-center"><h1 className="text-4xl font-black text-[#ca8a04]">MO CONTROL</h1></header>
      <div className="max-w-xl mx-auto mb-8"><input type="text" placeholder="البحث..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#111] border border-gray-800 rounded-2xl py-4 px-6 text-sm outline-none focus:border-[#ca8a04]"/></div>
      <div className="flex justify-center gap-3 mb-4">{['Etisalat', 'Vodafone', 'WE'].map(net => <button key={net} onClick={() => setActiveTab(net)} className={`px-8 py-3 rounded-2xl font-bold border-2 ${activeTab === net ? 'border-[#ca8a04] bg-[#ca8a04] text-black' : 'border-gray-800'}`}>{net}</button>)}</div>
      <div className="max-w-7xl mx-auto space-y-4">
        {filteredLines.map(line => {
          const stats = getStats(line);
          const isMainOpen = expandedLine === line.id;
          return (
            <div key={line.id} className="bg-[#111] border border-gray-800 rounded-3xl p-4 cursor-pointer" onClick={() => setExpandedLine(isMainOpen ? null : line.id)}>
              <div className="flex justify-between items-center">
                <div><p className="font-bold">{line.ownerName}</p><p className="text-xs text-gray-500">{line.masterPhone}</p></div>
                <button onClick={(e) => deleteLine(e, line.id)}>🗑️</button>
              </div>
              {isMainOpen && (
                <div className="mt-4 pt-4 border-t border-gray-800 space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {[{l:"الاسم", k:"ownerName"}, {l:"الرقم", k:"masterPhone"}, {l:"التكلفة", k:"baseCost"}].map(f => <input key={f.k} value={line[f.k]} onChange={(e) => updateMasterLine(line.id, f.k, e.target.value)} className="bg-black p-2 rounded text-xs"/>)}
                  </div>
                  {line.subscribers.map((sub, i) => (
                    <div key={i} className="grid grid-cols-4 gap-2 items-center bg-black p-2 rounded">
                      <input value={sub.name} onChange={(e) => updateSub(line.id, i, 'name', e.target.value, line.subscribers)} className="bg-transparent text-xs" placeholder="اسم"/>
                      <input value={sub.paidAmount} onChange={(e) => updateSub(line.id, i, 'paidAmount', e.target.value, line.subscribers)} className="bg-transparent text-xs" placeholder="دفع"/>
                      <button onClick={() => updateSub(line.id, i, 'paidAmount', sub.price, line.subscribers)} className="text-[10px] bg-green-900 rounded">خالص</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="fixed bottom-8 left-8 flex gap-2">
        <button onClick={exportToExcel} className="bg-green-600 p-4 rounded-full text-white">📥</button>
        <input type="file" id="importFile" className="hidden" onChange={importFromExcel} accept=".xlsx" />
        <label htmlFor="importFile" className="bg-blue-600 p-4 rounded-full text-white cursor-pointer">📤</label>
        <button onClick={addNewLine} className="bg-[#ca8a04] p-4 rounded-full text-black font-bold">+</button>
      </div>
    </div>
  );
}
