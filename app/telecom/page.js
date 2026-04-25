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
  const networkCounts = {
    Etisalat: masterLines.filter(l => l.network === 'Etisalat').length,
    Vodafone: masterLines.filter(l => l.network === 'Vodafone').length,
    WE: masterLines.filter(l => l.network === 'WE').length
  };

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
          ownerName: item["صاحب الخط"] || '', masterPhone: item["الرقم"] || '', network: item["الشبكة"] || '', cycle: String(item["السايكل"] || ''), activationDate: item["تاريخ التفعيل"] || '', baseCost: Number(item["التكلفة"]) || 0, totalGB: Number(item["الجيجا"]) || 0, totalMins: Number(item["الدقائق"]) || 0, subscribers: item["بيانات المشتركين (JSON)"] ? JSON.parse(item["بيانات المشتركين (JSON)"]) : Array(7).fill({ name: '', phone: '', gb: 0, sentMB: 4096, mins: 1500, price: 0, paidAmount: 0 })
        });
      }
      alert("تم استعادة البيانات بنجاح!");
    };
    reader.readAsArrayBuffer(file);
  };

  const addNewLine = async () => {
    try {
      await addDoc(collection(db, "lines"), { network: activeTab, cycle: activeCycle, masterPhone: '', ownerName: 'خط جديد', activationDate: '', baseCost: 0, totalGB: 0, totalMins: 0, subscribers: Array(7).fill({ name: '', phone: '', gb: 0, sentMB: 4096, mins: 1500, price: 0, paidAmount: 0 }) });
    } catch (err) { alert("خطأ في الاتصال بقاعدة البيانات"); }
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
    let newSubs = currentSubscribers ? [...currentSubscribers] : Array(7).fill({ name: '', phone: '', gb: 0, sentMB: 4096, mins: 1500, price: 0, paidAmount: 0 });
    const updatedValue = (field === 'gb' || field === 'sentMB' || field === 'mins' || field === 'price' || field === 'paidAmount') ? Number(value) : value;
    newSubs[subIndex] = { ...newSubs[subIndex], [field]: updatedValue };
    if (field === 'gb') {
      const line = masterLines.find(l => l.id === lineId);
      newSubs[subIndex].price = priceTable[line?.network]?.[updatedValue] || 0;
    }
    await updateDoc(doc(db, "lines", lineId), { subscribers: newSubs });
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
      
      <div className="max-w-3xl mx-auto mb-6">
        <button onClick={() => setShowStats(!showStats)} className="w-full bg-[#111] border border-[#ca8a04] text-[#ca8a04] py-3 rounded-2xl font-bold hover:bg-[#ca8a04] hover:text-black transition-all">
          {showStats ? 'إخفاء التفاصيل' : 'عرض تفاصيل الأرباح وعدد الخطوط'}
        </button>
      </div>

      {showStats && (
        <div className="max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <div className="bg-[#111] p-3 rounded-xl border border-gray-800 text-center">
            <p className="text-[9px] text-gray-500 uppercase">صافي الربح</p>
            <p className="text-sm font-black text-green-500">{totalProfit} ج</p>
          </div>
          {Object.entries(networkCounts).map(([net, count]) => (
            <div key={net} className="bg-[#111] p-3 rounded-xl border border-gray-800 text-center">
              <p className="text-[9px] text-gray-500 uppercase">{net === 'Etisalat' ? 'اتصالات' : net === 'Vodafone' ? 'فودافون' : 'وي'}</p>
              <p className="text-sm font-black">{count}</p>
            </div>
          ))}
        </div>
      )}

      <div className="max-w-xl mx-auto mb-8">
        <input type="text" placeholder="البحث باسم العميل أو الرقم..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#111] border border-gray-800 rounded-2xl py-4 px-6 text-sm outline-none focus:border-[#ca8a04]"/>
      </div>

      <div className="flex justify-center gap-3 mb-4">
        {['Etisalat', 'Vodafone', 'WE'].map(net => (
          <button key={net} onClick={() => {setActiveTab(net); setExpandedLine(null);}} className={`px-8 py-3 rounded-2xl font-bold border-2 ${activeTab === net ? 'border-[#ca8a04] bg-[#ca8a04] text-black' : 'border-gray-800 text-gray-500'}`}>
            {net === 'Etisalat' ? 'اتصالات' : net === 'Vodafone' ? 'فودافون' : 'وي'}
          </button>
        ))}
      </div>

      <div className="flex justify-center gap-3 mb-10">
        {['1', '15'].map(cyc => (
          <button key={cyc} onClick={() => {setActiveCycle(cyc); setExpandedLine(null);}} className={`px-8 py-2 rounded-xl font-bold ${activeCycle === cyc ? 'bg-blue-600 text-white' : 'bg-[#111] text-gray-500 border border-gray-800'}`}>
            سايكل {cyc}
          </button>
        ))}
      </div>

      <div className="max-w-7xl mx-auto space-y-4">
        {filteredLines.map(line => {
          const stats = getStats(line);
          const isMainOpen = expandedLine === line.id;
          return (
            <div key={line.id} className="bg-[#111] border border-gray-800 rounded-3xl overflow-hidden shadow-xl">
              <div onClick={() => setExpandedLine(isMainOpen ? null : line.id)} className="p-4 cursor-pointer hover:bg-[#161616] flex flex-col md:flex-row items-center justify-between gap-4 transition-colors">
                <div className="bg-black p-3 rounded-xl border border-gray-800 w-full md:w-60 text-center md:text-right">
                  <p className="text-[9px] text-gray-500 uppercase mb-1">صاحب الخط / الرقم / التفعيل</p>
                  <p className="font-bold text-white text-sm truncate">{line.ownerName || 'بدون اسم'} - {line.masterPhone || '0000'}</p>
                  <p className="text-[10px] text-[#ca8a04] font-bold mt-1">تفعيل: {line.activationDate || 'غير محدد'}</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full md:w-auto text-center">
                    <div className="bg-black/30 p-2 rounded-lg border border-gray-800 min-w-[80px]"><p className="text-[8px] text-gray-500">الربح</p><p className={`font-bold text-xs ${stats.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>{stats.profit} ج</p></div>
                    <div className="bg-black/30 p-2 rounded-lg border border-gray-800 min-w-[80px]"><p className="text-[8px] text-gray-500">ديون</p><p className="font-bold text-xs text-orange-500">{stats.debts} ج</p></div>
                    <div className="bg-black/30 p-2 rounded-lg border border-gray-800 min-w-[80px]"><p className="text-[8px] text-gray-500">جيجا متبقية</p><p className="font-bold text-xs text-blue-400">{stats.remainingGB} GB</p></div>
                    <div className="bg-black/30 p-2 rounded-lg border border-gray-800 min-w-[80px]"><p className="text-[8px] text-gray-500">دقائق متبقية</p><p className="font-bold text-xs text-green-400">{stats.remainingMins} د</p></div>
                </div>
                <button onClick={(e) => deleteLine(e, line.id)} className="text-gray-600 hover:text-red-500 transition-colors">🗑️</button>
              </div>
              {isMainOpen && (
                <div className="p-6 border-t border-gray-800 bg-[#0d0d0d]">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8 bg-[#161616] p-4 rounded-2xl border border-gray-800">
                        {[ {l: "الاسم", k: "ownerName", t: "text"}, {l: "الرقم", k: "masterPhone", t: "text"}, {l: "تاريخ التفعيل", k: "activationDate", t: "text"}, {l: "إجمالي الجيجا", k: "totalGB", t: "number"}, {l: "إجمالي الدقائق", k: "totalMins", t: "number"}, {l: "التكلفة", k: "baseCost", t: "number"} ].map((item, i) => (
                          <div key={i} className="flex flex-col gap-2">
                            <label className="text-[11px] font-bold text-gray-500 px-1">{item.l}</label>
                            <input type={item.t} placeholder={item.l === "تاريخ التفعيل" ? "مثال: 1/4" : ""} value={line[item.k] || ""} onChange={(e) => updateMasterLine(line.id, item.k, e.target.value)} className="bg-black border border-gray-800 rounded-lg p-3 text-sm text-white outline-none focus:border-[#ca8a04]"/>
                          </div>
                        ))}
                    </div>
                    <div className="space-y-3 overflow-x-auto">
                        {[...Array(7)].map((_, index) => {
                            const sub = (line.subscribers || [])[index] || { name: '', phone: '', gb: 0, sentMB: 4096, mins: 1500, price: 0, paidAmount: 0 };
                            const totalMB = (sub.gb || 0) * 1024;
                            const remainingMB = totalMB - (sub.sentMB || 0);
                            const debt = (sub.price || 0) - (sub.paidAmount || 0);
                            return (
                                <div key={index} className="grid grid-cols-2 md:grid-cols-10 gap-2 items-center bg-[#111] p-3 rounded-2xl border border-gray-800 text-center hover:border-gray-700 transition-all min-w-[900px]">
                                    <div className="flex flex-col gap-1"><label className="text-[9px] text-gray-500">الاسم</label><input value={sub.name} onChange={(e) => updateSub(line.id, index, 'name', e.target.value, line.subscribers)} className="bg-black border border-gray-800 rounded-lg p-2 text-[12px] text-white outline-none"/></div>
                                    <div className="flex flex-col gap-1"><label className="text-[9px] text-gray-500">الرقم</label><input value={sub.phone} onChange={(e) => updateSub(line.id, index, 'phone', e.target.value, line.subscribers)} className="bg-black border border-gray-800 rounded-lg p-2 text-[12px] text-white outline-none"/></div>
                                    <div className="flex flex-col gap-1"><label className="text-[9px] text-gray-500">باقة GB</label><select value={sub.gb} onChange={(e) => updateSub(line.id, index, 'gb', e.target.value, line.subscribers)} className="bg-black border border-gray-800 rounded-lg p-2 text-[12px] text-blue-400 outline-none"><option value="0">0</option>{Object.keys(priceTable[line.network] || {}).map(g => <option key={g} value={g}>{g}</option>)}</select></div>
                                    <div className="flex flex-col gap-1"><label className="text-[9px] text-gray-500">الدقائق</label><input type="number" value={sub.mins} onChange={(e) => updateSub(line.id, index, 'mins', e.target.value, line.subscribers)} className="bg-black border border-gray-800 rounded-lg p-2 text-[12px] text-white outline-none"/></div>
                                    <div className="hidden md:flex flex-col gap-1"><label className="text-[9px] text-gray-500">إجمالي MB</label><span className="text-[12px] font-bold p-2 text-gray-500">{totalMB}</span></div>
                                    <div className="flex flex-col gap-1"><label className="text-[9px] text-gray-500">مُرسل MB</label><input type="number" value={sub.sentMB} onChange={(e) => updateSub(line.id, index, 'sentMB', e.target.value, line.subscribers)} className="bg-black border border-gray-800 rounded-lg p-2 text-[12px] text-white outline-none"/></div>
                                    <div className="hidden md:flex flex-col gap-1"><label className="text-[9px] text-gray-500">متبقي MB</label><span className={`text-[12px] font-bold p-2 ${remainingMB < 0 ? 'text-red-500' : 'text-green-500'}`}>{remainingMB}</span></div>
                                    <div className="flex flex-col gap-1"><label className="text-[9px] text-gray-500">السعر</label><input type="number" value={sub.price} onChange={(e) => updateSub(line.id, index, 'price', e.target.value, line.subscribers)} className="bg-black border border-gray-800 rounded-lg p-2 text-[12px] text-white outline-none"/></div>
                                    <div className="flex flex-col gap-1"><label className="text-[9px] text-gray-500">المدفوع</label><input type="number" value={sub.paidAmount} onChange={(e) => updateSub(line.id, index, 'paidAmount', e.target.value, line.subscribers)} className="bg-black border border-gray-800 rounded-lg p-2 text-[12px] text-white outline-none"/></div>
                                    <button onClick={() => updateSub(line.id, index, 'paidAmount', sub.price, line.subscribers)} className={`text-[10px] font-bold mt-4 h-8 rounded-lg transition-all ${debt > 0 ? 'text-red-500 bg-red-500/10' : 'text-green-500 bg-green-500/10'}`}>{debt > 0 ? `باقي ${debt}` : 'خالص ✓'}</button>
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

      <div className="fixed bottom-8 left-8 flex gap-3 z-[999]">
        <button onClick={exportToExcel} title="تصدير" className="bg-green-600 text-white w-12 h-12 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all">📥</button>
        <input type="file" id="importFile" className="hidden" onChange={importFromExcel} accept=".xlsx" />
        <label htmlFor="importFile" title="استعادة" className="bg-blue-600 text-white w-12 h-12 rounded-full shadow-2xl flex items-center justify-center cursor-pointer hover:scale-110 transition-all">📤</label>
        <button onClick={addNewLine} title="إضافة" className="bg-[#ca8a04] text-black w-14 h-14 rounded-full shadow-2xl text-3xl font-bold hover:scale-110 transition-all flex items-center justify-center">+</button>
      </div>
    </div>
  );
}
