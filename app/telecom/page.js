'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '@/lib/firebaseConfigV2';
import {
  collection, onSnapshot, doc, updateDoc, addDoc,
  deleteDoc, query, where, writeBatch
} from 'firebase/firestore';
import * as XLSX from 'xlsx';

// ─────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────
const PRICE_TABLE = {
  Etisalat: { 20: 260, 25: 300, 30: 340, 40: 420, 50: 500, 60: 640 },
  Vodafone: { 20: 300, 25: 340, 30: 380, 40: 460, 50: 520, 60: 580 },
  WE:       { 20: 250, 25: 280, 30: 310, 40: 360, 50: 410, 60: 520 },
};

const NETWORKS = [
  { key: 'Etisalat', label: 'اتصالات' },
  { key: 'Vodafone', label: 'فودافون' },
  { key: 'WE',       label: 'وي' },
  { key: 'Home4G',   label: '🏠 Home 4G' },
];

const CYCLES = ['1', '15'];

// ─────────────────────────────────────────────────────────────────
// Factory Functions
// ─────────────────────────────────────────────────────────────────
const makeHome4G = () => ({
  ownerName: '', linePhone: '', discountPhone: '',
  subscriberName: '', contactPhone: '', package: '',
  paymentStatus: 'غير مدفوع', paidAmount: 0, baseCost: 0,
});

const makeSub = () => ({
  name: '', phone: '', gb: 0, sentMB: 4096,
  mins: 1500, price: 0, paidAmount: 0,
});

const makeSubsArray = () => Array(7).fill(null).map(makeSub);

// ─────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────
export default function TelecomSystem() {
  const [activeTab,    setActiveTab]    = useState('Etisalat');
  const [activeCycle,  setActiveCycle]  = useState('1');
  const [expandedLine, setExpandedLine] = useState(null);
  const [searchTerm,   setSearchTerm]   = useState('');
  const [masterLines,  setMasterLines]  = useState([]);
  const [showStats,    setShowStats]    = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const unsubRef = useRef(null);
  const isHome4G = activeTab === 'Home4G';

  // ─────────────────────────────────────────────────────────────
  // 1. READS Optimization
  // ─────────────────────────────────────────────────────────────
  const subscribeToLines = useCallback(() => {
    if (unsubRef.current) unsubRef.current();

    const q = query(
      collection(db, 'lines'),
      where('network', '==', activeTab),
      where('cycle',   '==', activeCycle)
    );

    const unsub = onSnapshot(q, (snap) => {
      setMasterLines(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setIsRefreshing(false);
    });

    unsubRef.current = unsub;
    return unsub;
  }, [activeTab, activeCycle]);

  useEffect(() => {
    const unsub = subscribeToLines();
    return () => unsub();
  }, [subscribeToLines]);

  const handleManualRefresh = useCallback(() => {
    setIsRefreshing(true);
    subscribeToLines();
  }, [subscribeToLines]);

  // ─────────────────────────────────────────────────────────────
  // 2. WRITES Optimization (Direct Updates without Debounce)
  // ─────────────────────────────────────────────────────────────
  const updateMasterLine = useCallback(async (lineId, field, value) => {
    const numFields = ['totalGB', 'totalMins', 'baseCost'];
    const val = numFields.includes(field) ? Number(value) : value;
    await updateDoc(doc(db, 'lines', lineId), { [field]: val });
  }, []);

  const updateHome4G = useCallback(async (lineId, field, value, currentData) => {
    const numFields = ['paidAmount', 'baseCost'];
    const updated = {
      ...currentData,
      [field]: numFields.includes(field) ? Number(value) : value,
    };
    await updateDoc(doc(db, 'lines', lineId), { home4gData: updated });
  }, []);

  const updateSub = useCallback(async (lineId, subIndex, field, value, currentSubscribers, network) => {
    const newSubs = currentSubscribers ? [...currentSubscribers] : makeSubsArray();
    const numFields = ['gb', 'sentMB', 'mins', 'price', 'paidAmount'];
    const parsedValue = numFields.includes(field) ? Number(value) : value;

    newSubs[subIndex] = { ...newSubs[subIndex], [field]: parsedValue };

    if (field === 'gb') {
      newSubs[subIndex].price = PRICE_TABLE[network]?.[parsedValue] || 0;
    }

    await updateDoc(doc(db, 'lines', lineId), { subscribers: newSubs });
  }, []);

  // ─────────────────────────────────────────────────────────────
  // Toggles & Immediate Actions
  // ─────────────────────────────────────────────────────────────
  const toggleField = useCallback(async (e, lineId, field, currentValue) => {
    e.stopPropagation();
    await updateDoc(doc(db, 'lines', lineId), { [field]: !currentValue });
  }, []);

  // ─────────────────────────────────────────────────────────────
  // CRUD & Excel (Optimized with Batch Writes)
  // ─────────────────────────────────────────────────────────────
  const addNewLine = useCallback(async () => {
    try {
      const base = {
        network: activeTab, cycle: activeCycle,
        ownerName: 'خط جديد', masterPhone: '',
        activationDate: '', baseCost: 0,
        totalGB: 0, totalMins: 0,
        billPaid: false, voucherSent: false, todSent: false,
      };
      if (isHome4G) {
        await addDoc(collection(db, 'lines'), {
          ...base, subscribers: [], home4gData: makeHome4G(),
        });
      } else {
        await addDoc(collection(db, 'lines'), {
          ...base, subscribers: makeSubsArray(), home4gData: null,
        });
      }
    } catch {
      alert('خطأ في الاتصال بقاعدة البيانات');
    }
  }, [activeTab, activeCycle, isHome4G]);

  const deleteLine = useCallback(async (e, id) => {
    e.stopPropagation();
    if (window.confirm('هل تريد حذف هذا الخط نهائياً؟'))
      await deleteDoc(doc(db, 'lines', id));
  }, []);

  const exportToExcel = useCallback(() => {
    const rows = masterLines.map(line => ({
      ID: line.id,
      'صاحب الخط':             line.ownerName || '',
      'الرقم':                 line.masterPhone || '',
      'الشبكة':                 line.network || '',
      'السايكل':                line.cycle || '',
      'تاريخ التفعيل':          line.activationDate || '',
      'التكلفة':                line.baseCost || 0,
      'الجيجا':                 line.totalGB || 0,
      'الدقائق':                line.totalMins || 0,
      'دفعت الفاتورة':          line.billPaid ? 'نعم' : 'لا',
      'فواتشر':                 line.voucherSent ? 'نعم' : 'لا',
      'TOD':                    line.todSent ? 'نعم' : 'لا',
      'بيانات المشتركين (JSON)': JSON.stringify(line.subscribers || []),
      'بيانات Home4G (JSON)':   JSON.stringify(line.home4gData || null),
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'FullBackup');
    XLSX.writeFile(wb, 'MO_CONTROL_Full_Backup.xlsx');
  }, [masterLines]);

  const importFromExcel = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsRefreshing(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const wb   = XLSX.read(new Uint8Array(evt.target.result), { type: 'array' });
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        
        // استبدال setDoc العادي بـ writeBatch لتوفير الـ Writes
        let batch = writeBatch(db);
        let count = 0;

        for (const item of rows) {
          const docRef = doc(db, 'lines', String(item.ID));
          batch.set(docRef, {
            ownerName:      item['صاحب الخط'] || '',
            masterPhone:    item['الرقم'] || '',
            network:        item['الشبكة'] || '',
            cycle:          String(item['السايكل'] || ''),
            activationDate: item['تاريخ التفعيل'] || '',
            baseCost:       Number(item['التكلفة']) || 0,
            totalGB:        Number(item['الجيجا']) || 0,
            totalMins:      Number(item['الدقائق']) || 0,
            billPaid:       item['دفعت الفاتورة'] === 'نعم',
            voucherSent:    item['فواتشر'] === 'نعم',
            todSent:        item['TOD'] === 'نعم',
            subscribers:    item['بيانات المشتركين (JSON)']
              ? JSON.parse(item['بيانات المشتركين (JSON)'])
              : makeSubsArray(),
            home4gData:     item['بيانات Home4G (JSON)']
              ? JSON.parse(item['بيانات Home4G (JSON)'])
              : null,
          });

          count++;
          if (count === 400) { // فايربيز بيقبل 500 كحد أقصى في الدفعة الواحدة
            await batch.commit();
            batch = writeBatch(db);
            count = 0;
          }
        }
        
        if (count > 0) {
          await batch.commit();
        }
        alert('تم استعادة البيانات بنجاح!');
      } catch (err) {
        alert('حدث خطأ أثناء الاستيراد');
      } finally {
        setIsRefreshing(false);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  }, []);

  // ─────────────────────────────────────────────────────────────
  // Stats
  // ─────────────────────────────────────────────────────────────
  const getLineStats = useCallback((line) => {
    if (line.network === 'Home4G') {
      const h    = line.home4gData || {};
      const paid = Number(h.paidAmount || 0);
      const cost = Number(h.baseCost || 0);
      return { profit: paid - cost, debts: Math.max(0, cost - paid), remainingGB: 0, remainingMins: 0 };
    }
    const subs = line.subscribers || [];
    let collected = 0, prices = 0, usedGB = 0, usedMins = 0;
    subs.forEach(s => {
      collected += Number(s.paidAmount || 0);
      prices    += Number(s.price || 0);
      usedGB    += Number(s.gb || 0);
      usedMins  += Number(s.mins || 0);
    });
    return {
      profit:        collected - Number(line.baseCost || 0),
      debts:         Math.max(0, prices - collected),
      remainingGB:   Number(line.totalGB  || 0) - usedGB,
      remainingMins: Number(line.totalMins || 0) - usedMins,
    };
  }, []);

  const globalStats = (() => {
    const nets = { Etisalat: 0, Vodafone: 0, WE: 0, Home4G: 0 };
    let totalProfit = 0, totalDebt = 0;
    masterLines.forEach(line => {
      if (nets[line.network] !== undefined) nets[line.network]++;
      const s = getLineStats(line);
      totalProfit += s.profit;
      totalDebt   += s.debts;
      if (line.network !== 'Home4G' && !line.billPaid) {
        totalDebt += Number(line.baseCost || 0);
      }
    });
    return { nets, totalProfit, totalDebt };
  })();

  // ─────────────────────────────────────────────────────────────
  // Search
  // ─────────────────────────────────────────────────────────────
  const filteredLines = masterLines.filter(line => {
    if (!searchTerm) return true;
    const s   = searchTerm.toLowerCase();
    const num = searchTerm;
    if (line.ownerName?.toLowerCase().includes(s) || line.masterPhone?.includes(num)) return true;
    if (line.subscribers?.some(sub =>
      sub.name?.toLowerCase().includes(s) || sub.phone?.includes(num)
    )) return true;
    if (line.network === 'Home4G') {
      const h = line.home4gData || {};
      return (
        h.ownerName?.toLowerCase().includes(s) ||
        h.subscriberName?.toLowerCase().includes(s) ||
        h.linePhone?.includes(num)
      );
    }
    return false;
  });

  // ─────────────────────────────────────────────────────────────
  // Helper Components
  // ─────────────────────────────────────────────────────────────
  const StatBox = ({ label, value, color }) => (
    <div className="bg-black/30 p-2 rounded-lg border border-gray-800 min-w-[80px]">
      <p className="text-[8px] text-gray-500">{label}</p>
      <p className={`font-bold text-xs ${color}`}>{value}</p>
    </div>
  );

  const ToggleBtn = ({ label, active, onText, offText, onBorder, offBorder, onClick }) => (
    <div className="flex flex-col items-center">
      <p className="text-[8px] text-gray-500 mb-1">{label}</p>
      <button
        onClick={onClick}
        className={`px-3 py-1 rounded-lg text-[10px] font-bold border ${active ? onBorder : offBorder} transition-all`}
      >
        {active ? onText : offText}
      </button>
    </div>
  );

  const SubField = ({ label, children }) => (
    <div className="flex flex-col gap-1 w-full">
      <label className="text-[9px] text-gray-500">{label}</label>
      {children}
    </div>
  );

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-8 bg-[#0a0a0a] min-h-screen text-gray-200" dir="rtl">

      {/* ── Header ── */}
      <header className="mb-4 text-center">
        <h1 className="text-4xl font-black text-[#ca8a04]">MO CONTROL</h1>
      </header>

      {/* ── Top Controls ── */}
      <div className="flex justify-center gap-3 mb-6">
        <button
          onClick={() => setShowStats(v => !v)}
          className="px-6 py-2 rounded-xl font-bold border-2 border-gray-700 text-gray-400
                     hover:border-[#ca8a04] hover:text-[#ca8a04] transition-all text-sm flex items-center gap-2"
        >
          📊 {showStats ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
        </button>

        <button
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          title="تحديث البيانات يدوياً"
          className={`px-4 py-2 rounded-xl font-bold border-2 transition-all text-sm flex items-center gap-2
            ${isRefreshing
              ? 'border-gray-800 text-gray-600 cursor-not-allowed'
              : 'border-gray-700 text-gray-400 hover:border-blue-500 hover:text-blue-400'
            }`}
        >
          <span className={`inline-block transition-transform duration-700 ${isRefreshing ? 'animate-spin' : ''}`}>
            🔄
          </span>
          {isRefreshing ? 'جاري التحديث...' : 'تحديث'}
        </button>
        
        {/* أزرار الإكسيل والإضافة هنا إذا كانت موجودة في الكود الأصلي لديك */}
      </div>

      {/* ── Stats Panel ── */}
      {showStats && (
        <div className="max-w-4xl mx-auto mb-8 bg-[#111] border border-gray-800 rounded-3xl p-6">
          <h2 className="text-center text-sm font-bold text-[#ca8a04] mb-5 tracking-widest">ملخص عام</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { label: 'اتصالات', count: globalStats.nets.Etisalat, color: 'text-green-400',  border: 'border-green-900' },
              { label: 'فودافون', count: globalStats.nets.Vodafone,  color: 'text-red-400',   border: 'border-red-900' },
              { label: 'وي',      count: globalStats.nets.WE,        color: 'text-blue-400',  border: 'border-blue-900' },
              { label: 'Home 4G', count: globalStats.nets.Home4G,    color: 'text-[#ca8a04]', border: 'border-[#ca8a04]/30' },
            ].map(n => (
              <div key={n.label} className={`bg-black/40 border ${n.border} rounded-2xl p-4 text-center`}>
                <p className="text-[10px] text-gray-500 mb-1">{n.label}</p>
                <p className={`text-3xl font-black ${n.color}`}>{n.count}</p>
                <p className="text-[9px] text-gray-600 mt-1">خط</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-black/40 border border-green-900 rounded-2xl p-4 text-center">
              <p className="text-[10px] text-gray-500 mb-1">إجمالي الأرباح</p>
              <p className={`text-2xl font-black ${globalStats.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {globalStats.totalProfit} ج
              </p>
            </div>
            <div className="bg-black/40 border border-orange-900 rounded-2xl p-4 text-center">
              <p className="text-[10px] text-gray-500 mb-1">إجمالي المديونية</p>
              <p className="text-2xl font-black text-orange-400">{globalStats.totalDebt} ج</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Search ── */}
      <div className="max-w-xl mx-auto mb-8">
        <input
          type="text"
          placeholder="البحث باسم العميل أو الرقم..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)} // البحث فقط محلي ولا يؤثر على فايربيز
          className="w-full bg-[#111] border border-gray-800 rounded-2xl py-4 px-6 text-sm
                     outline-none focus:border-[#ca8a04] transition-colors"
        />
      </div>

      {/* ── Network Tabs ── */}
      <div className="flex justify-center gap-3 mb-4 flex-wrap">
        {NETWORKS.map(net => (
          <button
            key={net.key}
            onClick={() => { setActiveTab(net.key); setExpandedLine(null); }}
            className={`px-6 py-3 rounded-2xl font-bold border-2 transition-all ${
              activeTab === net.key
                ? 'border-[#ca8a04] bg-[#ca8a04] text-black'
                : 'border-gray-800 text-gray-500 hover:border-gray-600'
            }`}
          >
            {net.label}
          </button>
        ))}
      </div>

      {/* ── Cycle Tabs ── */}
      <div className="flex justify-center gap-3 mb-10">
        {CYCLES.map(cyc => (
          <button
            key={cyc}
            onClick={() => { setActiveCycle(cyc); setExpandedLine(null); }}
            className={`px-8 py-2 rounded-xl font-bold transition-all ${
              activeCycle === cyc
                ? 'bg-blue-600 text-white'
                : 'bg-[#111] text-gray-500 border border-gray-800 hover:border-gray-600'
            }`}
          >
            سايكل {cyc}
          </button>
        ))}
      </div>

      {/* ── Lines List ── */}
      <div className="max-w-7xl mx-auto space-y-4">
        {filteredLines.length === 0 && (
          <div className="text-center text-gray-600 py-20">
            {searchTerm ? 'لا توجد نتائج مطابقة للبحث' : 'لا توجد خطوط.'}
          </div>
        )}

        {filteredLines.map(line => {
          const stats  = getLineStats(line);
          const isOpen = expandedLine === line.id;
          const h      = line.home4gData || makeHome4G();
          const isH4G  = line.network === 'Home4G';

          return (
            <div key={line.id} className="bg-[#111] border border-gray-800 rounded-3xl overflow-hidden shadow-xl">
              
              {/* ── Header Row ── */}
              <div
                onClick={() => setExpandedLine(isOpen ? null : line.id)}
                className="p-4 cursor-pointer hover:bg-[#161616] flex flex-col md:flex-row items-center justify-between gap-4 transition-colors"
              >
                {/* معلومات الخط */}
                <div className="bg-black p-3 rounded-xl border border-gray-800 w-full md:w-60 text-center md:text-right">
                  <p className="text-[9px] text-gray-500 uppercase mb-1">
                    {isH4G ? 'صاحب البرينت / رقم الخط' : 'صاحب الخط / الرقم / التفعيل'}
                  </p>
                  <p className="font-bold text-white text-sm truncate">
                    {isH4G
                      ? `${h.ownerName || 'بدون اسم'} - ${h.linePhone || '0000'}`
                      : `${line.ownerName || 'بدون اسم'} - ${line.masterPhone || '0000'}`}
                  </p>
                  <p className="text-[10px] text-[#ca8a04] font-bold mt-1">
                    {isH4G
                      ? `باقة: ${h.package || 'غير محددة'}`
                      : `تفعيل: ${line.activationDate || 'غير محدد'}`}
                  </p>
                </div>

                {/* إحصائيات الخط */}
                {isH4G ? (
                  <div className="flex flex-row gap-2 w-full md:w-auto text-center">
                    <StatBox label="الربح" value={`${stats.profit} ج`} color={stats.profit >= 0 ? 'text-green-500' : 'text-red-500'} />
                    <StatBox label="ديون" value={`${stats.debts} ج`} color="text-orange-500" />
                    <div className="bg-black/30 p-2 rounded-lg border border-[#ca8a04]/30 min-w-[80px]">
                      <p className="text-[8px] text-gray-500">حالة الدفع</p>
                      <p className={`font-bold text-xs ${
                        h.paymentStatus === 'مدفوع'  ? 'text-green-500'
                        : h.paymentStatus === 'جزئي' ? 'text-yellow-400'
                        : 'text-red-400'
                      }`}>{h.paymentStatus || 'غير مدفوع'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-row flex-wrap gap-2 w-full md:w-auto text-center items-center">
                    <StatBox label="الربح"        value={`${stats.profit} ج`} color={stats.profit >= 0 ? 'text-green-500' : 'text-red-500'} />
                    <StatBox label="ديون"         value={`${stats.debts} ج`}        color="text-orange-500" />
                    <StatBox label="جيجا متبقية"  value={`${stats.remainingGB} GB`}  color="text-blue-400" />
                    <StatBox label="دقائق متبقية" value={`${stats.remainingMins} د`} color="text-green-400" />

                    <ToggleBtn label="الفاتورة" active={line.billPaid}
                      onText="مدفوعة ✓" offText="غير مدفوعة"
                      onBorder="border-green-700 bg-green-900/30 text-green-400"
                      offBorder="border-red-900 bg-red-900/20 text-red-400"
                      onClick={(e) => toggleField(e, line.id, 'billPaid', line.billPaid)}
                    />
                    <ToggleBtn label="فواتشر" active={line.voucherSent}
                      onText="اتباعت ✓" offText="لسه"
                      onBorder="border-cyan-700 bg-cyan-900/30 text-cyan-400"
                      offBorder="border-gray-700 bg-gray-900/20 text-gray-500"
                      onClick={(e) => toggleField(e, line.id, 'voucherSent', line.voucherSent)}
                    />
                    <ToggleBtn label="TOD" active={line.todSent}
                      onText="اتباعت ✓" offText="لسه"
                      onBorder="border-yellow-600 bg-yellow-900/30 text-yellow-400"
                      offBorder="border-gray-700 bg-gray-900/20 text-gray-500"
                      onClick={(e) => toggleField(e, line.id, 'todSent', line.todSent)}
                    />
                  </div>
                )}

                {/* زر الحذف */}
                <button
                  onClick={(e) => deleteLine(e, line.id)}
                  className="text-gray-600 hover:text-red-500 transition-colors flex-shrink-0"
                  title="حذف الخط"
                >🗑️</button>
              </div>

              {/* ── Expanded: Home 4G ── */}
              {isOpen && isH4G && (
                <div className="p-6 border-t border-gray-800 bg-[#0d0d0d]" onClick={(e) => e.stopPropagation()}>
                  <p className="text-xs text-[#ca8a04] font-bold mb-4 flex items-center gap-2">
                    <span>🏠</span> بيانات خط Home 4G
                  </p>
                  <div className="overflow-x-auto">
                    <div className="grid grid-cols-9 gap-2 items-end bg-[#111] p-4 rounded-2xl border border-[#ca8a04]/30 min-w-[1100px]">
                      {[
                        { label: 'صاحب البرينت', field: 'ownerName',      cls: 'text-white' },
                        { label: 'رقم خط الهوم', field: 'linePhone',       cls: 'text-white' },
                        { label: 'رقم الخصم',    field: 'discountPhone',   cls: 'text-white' },
                        { label: 'اسم المشترك',  field: 'subscriberName',  cls: 'text-white' },
                        { label: 'رقم تواصل',    field: 'contactPhone',    cls: 'text-white' },
                        { label: 'الباقة',       field: 'package',         cls: 'text-[#ca8a04]' },
                      ].map(({ label, field, cls }) => (
                        <div key={field} className="flex flex-col gap-1">
                          <label className="text-[9px] text-gray-500 text-center">{label}</label>
                          <input
                            defaultValue={h[field] || ''}
                            onBlur={(e) => {
                              if (e.target.value !== String(h[field] || '')) {
                                updateHome4G(line.id, field, e.target.value, h);
                              }
                            }}
                            className={`bg-black border border-gray-800 rounded-lg p-2 text-[12px] ${cls}
                                       outline-none focus:border-[#ca8a04] text-center`}
                          />
                        </div>
                      ))}

                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-gray-500 text-center">حالة الدفع</label>
                        <select
                          value={h.paymentStatus}
                          onChange={(e) => updateHome4G(line.id, 'paymentStatus', e.target.value, h)}
                          className={`bg-black border border-gray-800 rounded-lg p-2 text-[12px]
                                     outline-none focus:border-[#ca8a04] text-center font-bold ${
                            h.paymentStatus === 'مدفوع'  ? 'text-green-500'
                            : h.paymentStatus === 'جزئي' ? 'text-yellow-400'
                            : 'text-red-400'
                          }`}
                        >
                          <option value="غير مدفوع">غير مدفوع</option>
                          <option value="مدفوع">مدفوع</option>
                          <option value="جزئي">جزئي</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-gray-500 text-center">المبلغ المدفوع</label>
                        <input
                          type="number"
                          defaultValue={h.paidAmount}
                          onBlur={(e) => {
                             if(e.target.value !== String(h.paidAmount)) {
                                updateHome4G(line.id, 'paidAmount', e.target.value, h);
                             }
                          }}
                          className="bg-black border border-gray-800 rounded-lg p-2 text-[12px]
                                     text-green-400 outline-none focus:border-[#ca8a04] text-center"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-gray-500 text-center">التكلفة</label>
                        <input
                          type="number"
                          defaultValue={h.baseCost}
                          onBlur={(e) => {
                             if(e.target.value !== String(h.baseCost)) {
                                updateHome4G(line.id, 'baseCost', e.target.value, h);
                             }
                          }}
                          className="bg-black border border-gray-800 rounded-lg p-2 text-[12px]
                                     text-orange-400 outline-none focus:border-[#ca8a04] text-center"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Expanded: Normal Lines ── */}
              {isOpen && !isH4G && (
                <div className="p-6 border-t border-gray-800 bg-[#0d0d0d]" onClick={(e) => e.stopPropagation()}>
                  
                  {/* معلومات الخط الرئيسي */}
                  <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-8 bg-[#161616] p-4 rounded-2xl border border-gray-800">
                    {[
                      { l: 'الاسم',           k: 'ownerName',      t: 'text' },
                      { l: 'الرقم',           k: 'masterPhone',    t: 'text' },
                      { l: 'تاريخ التفعيل',  k: 'activationDate', t: 'text' },
                      { l: 'إجمالي الجيجا',  k: 'totalGB',        t: 'number' },
                      { l: 'إجمالي الدقائق', k: 'totalMins',      t: 'number' },
                      { l: 'التكلفة',         k: 'baseCost',       t: 'number' },
                    ].map(({ l, k, t }) => (
                      <div key={k} className="flex flex-col gap-2">
                        <label className="text-[11px] font-bold text-gray-500 px-1">{l}</label>
                        <input
                          type={t}
                          placeholder={k === 'activationDate' ? 'مثال: 1/4' : ''}
                          defaultValue={line[k] || ''}
                          onBlur={(e) => {
                             if(e.target.value !== String(line[k] || '')) {
                                updateMasterLine(line.id, k, e.target.value);
                             }
                          }}
                          className="bg-black border border-gray-800 rounded-lg p-3 text-sm text-white
                                     outline-none focus:border-[#ca8a04] transition-colors"
                        />
                      </div>
                    ))}
                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] font-bold text-gray-500 px-1">الفاتورة</label>
                      <button
                        onClick={(e) => toggleField(e, line.id, 'billPaid', line.billPaid)}
                        className={`rounded-lg p-3 text-sm font-bold border-2 transition-all h-full ${
                          line.billPaid
                            ? 'border-green-600 bg-green-900/40 text-green-400'
                            : 'border-red-900 bg-red-900/20 text-red-400'
                        }`}
                      >
                        {line.billPaid ? 'مدفوعة ✓' : 'غير مدفوعة ✗'}
                      </button>
                    </div>
                  </div>

                  {/* المشتركون */}
                  <div className="space-y-3 overflow-x-auto">
                    {Array.from({ length: 7 }).map((_, index) => {
                      const sub      = (line.subscribers || [])[index] || makeSub();
                      const totalMB  = Number(sub.gb || 0) * 1024;
                      const remainMB = totalMB - Number(sub.sentMB || 0);
                      const debt     = Number(sub.price || 0) - Number(sub.paidAmount || 0);
                      
                      return (
                        <div
                          key={index}
                          className="grid grid-cols-2 md:grid-cols-10 gap-2 items-center
                                     bg-[#111] p-3 rounded-2xl border border-gray-800 text-center
                                     hover:border-gray-700 transition-all min-w-[900px]"
                        >
                          <SubField label="الاسم">
                            <input
                              defaultValue={sub.name}
                              onBlur={(e) => {
                                 if(e.target.value !== String(sub.name)) {
                                   updateSub(line.id, index, 'name', e.target.value, line.subscribers, line.network);
                                 }
                              }}
                              className="bg-black border border-gray-800 rounded-lg p-2 text-[12px] text-white outline-none w-full text-center"
                            />
                          </SubField>

                          <SubField label="الرقم">
                            <input
                              defaultValue={sub.phone}
                              onBlur={(e) => {
                                 if(e.target.value !== String(sub.phone)) {
                                   updateSub(line.id, index, 'phone', e.target.value, line.subscribers, line.network);
                                 }
                              }}
                              className="bg-black border border-gray-800 rounded-lg p-2 text-[12px] text-white outline-none w-full text-center"
                            />
                          </SubField>

                          <SubField label="GB">
                            <input
                              type="number"
                              defaultValue={sub.gb}
                              onBlur={(e) => {
                                 if(e.target.value !== String(sub.gb)) {
                                   updateSub(line.id, index, 'gb', e.target.value, line.subscribers, line.network);
                                 }
                              }}
                              className="bg-black border border-gray-800 rounded-lg p-2 text-[12px] text-blue-400 outline-none w-full text-center"
                            />
                          </SubField>

                          <SubField label="MB محولة">
                            <input
                              type="number"
                              defaultValue={sub.sentMB}
                              onBlur={(e) => {
                                 if(e.target.value !== String(sub.sentMB)) {
                                   updateSub(line.id, index, 'sentMB', e.target.value, line.subscribers, line.network);
                                 }
                              }}
                              className="bg-black border border-gray-800 rounded-lg p-2 text-[12px] text-purple-400 outline-none w-full text-center"
                            />
                          </SubField>

                          <SubField label="MB باقية">
                            <div className="bg-black border border-gray-800 rounded-lg p-2 text-[12px] text-gray-400 w-full">
                              {remainMB}
                            </div>
                          </SubField>

                          <SubField label="الدقائق">
                            <input
                              type="number"
                              defaultValue={sub.mins}
                              onBlur={(e) => {
                                 if(e.target.value !== String(sub.mins)) {
                                   updateSub(line.id, index, 'mins', e.target.value, line.subscribers, line.network);
                                 }
                              }}
                              className="bg-black border border-gray-800 rounded-lg p-2 text-[12px] text-green-400 outline-none w-full text-center"
                            />
                          </SubField>

                          <SubField label="السعر">
                            <input
                              type="number"
                              defaultValue={sub.price}
                              onBlur={(e) => {
                                 if(e.target.value !== String(sub.price)) {
                                   updateSub(line.id, index, 'price', e.target.value, line.subscribers, line.network);
                                 }
                              }}
                              className="bg-black border border-gray-800 rounded-lg p-2 text-[12px] text-orange-400 outline-none w-full text-center"
                            />
                          </SubField>

                          <SubField label="المدفوع">
                            <input
                              type="number"
                              defaultValue={sub.paidAmount}
                              onBlur={(e) => {
                                 if(e.target.value !== String(sub.paidAmount)) {
                                   updateSub(line.id, index, 'paidAmount', e.target.value, line.subscribers, line.network);
                                 }
                              }}
                              className="bg-black border border-gray-800 rounded-lg p-2 text-[12px] text-green-400 outline-none w-full text-center"
                            />
                          </SubField>

                          <SubField label="المتبقي">
                             <div className={`bg-black border border-gray-800 rounded-lg p-2 text-[12px] w-full ${debt > 0 ? 'text-red-400 font-bold' : 'text-gray-500'}`}>
                                {Math.max(0, debt)}
                             </div>
                          </SubField>
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
    </div>
  );
}
