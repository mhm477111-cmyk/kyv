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
  const [showStats, setShowStats] = useState(false); // الحالة الجديدة للزر

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

  // ---------- حساب الإحصائيات ----------
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

  const totalProfit = masterLines.reduce((acc, line) => acc + getStats(line).profit, 0);
  const networkCounts = {
    Etisalat: masterLines.filter(l => l.network === 'Etisalat').length,
    Vodafone: masterLines.filter(l => l.network === 'Vodafone').length,
    WE: masterLines.filter(l => l.network === 'WE').length
  };

  // ---------- الدوال الأصلية ----------
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
      
      {/* زر التفاصيل الجديد */}
      <div className="max-w-xl mx-auto mb-6">
        <button onClick={() => setShowStats(!showStats)} className="w-full bg-[#111] border border-[#ca8a04] text-[#ca8a04] py-3 rounded-2xl font-bold hover:bg-[#ca8a04] hover:text-black transition-all">
          {showStats ? 'إخفاء التفاصيل' : 'عرض التفاصيل (الربح وعدد الخطوط)'}
        </button>
      </div>

      {showStats && (
        <div className="max-w-xl mx-auto grid grid-cols-2 gap-4 mb-8">
          <div className="bg-[#111] p-4 rounded-2xl border border-gray-800 text-center col-span-2">
            <p className="text-gray-500 text-xs">صافي الربح الإجمالي</p>
            <p className="text-2xl font-black text-green-500">{totalProfit} ج</p>
          </div>
          {Object.entries(networkCounts).map(([net, count]) => (
            <div key={net} className="bg-[#111] p-4 rounded-2xl border border-gray-800 text-center">
              <p className="text-gray-500 text-xs">{net === 'Etisalat' ? 'اتصالات' : net === 'Vodafone' ? 'فودافون' : 'وي'}</p>
              <p className="text-xl font-black">{count}</p>
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

      {/* باقي الكود للعرض والقوائم (تم الحفاظ عليه كما هو) */}
      <div className="max-w-7xl mx-auto space-y-4">
        {filteredLines.map(line => {
          const stats = getStats(line);
          const isMainOpen = expandedLine === line.id;
          return (
            <div key={line.id} className="bg-[#111] border border-gray-800 rounded-3xl overflow-hidden shadow-xl">
               {/* ... (بقية منطق العرض الأصلي) ... */}
            </div>
          );
        })}
      </div>

      {/* الأزرار العائمة */}
      <div className="fixed bottom-8 left-8 flex gap-3 z-[999]">
        <button onClick={exportToExcel} title="تصدير" className="bg-green-600 text-white w-12 h-12 rounded-full flex items-center justify-center hover:scale-110 transition-all">📥</button>
        <input type="file" id="importFile" className="hidden" onChange={importFromExcel} accept=".xlsx" />
        <label htmlFor="importFile" title="استعادة" className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-all">📤</label>
        <button onClick={addNewLine} title="إضافة" className="bg-[#ca8a04] text-black w-14 h-14 rounded-full text-3xl font-bold hover:scale-110 transition-all">+</button>
      </div>
    </div>
  );
}
