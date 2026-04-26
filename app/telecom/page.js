'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '@/lib/firebaseConfigV2';
import {
  collection, onSnapshot, doc, updateDoc, addDoc,
  deleteDoc, setDoc, query, where
} from 'firebase/firestore';
import * as XLSX from 'xlsx';


// ─────────────────────────────────────────────────────────────────
// Hook: Debounce
// ─────────────────────────────────────────────────────────────────
function useDebounceCallback(fn, delay = 1000) {
  const timer = useRef(null);
  const fnRef = useRef(fn);
  useEffect(() => { fnRef.current = fn; }, [fn]);
  return useCallback((...args) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => fnRef.current(...args), delay);
  }, [delay]);
}

// ─────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────
const PRICE_TABLE = {
  Etisalat: { 20: 260, 25: 300, 30: 340, 40: 420, 50: 500, 60: 640 },
  Vodafone: { 20: 300, 25: 340, 30: 380, 40: 460, 50: 520, 60: 580 },
  WE:       { 20: 250, 25: 280, 30: 310, 40: 360, 50: 410, 60: 520 },
};

const NETWORKS = [
  { key: 'Etisalat', label: 'اتصالات', color: 'text-green-400',  border: 'border-green-900',       bg: 'bg-green-900/10',  accent: '#4ade80' },
  { key: 'Vodafone', label: 'فودافون', color: 'text-red-400',    border: 'border-red-900',         bg: 'bg-red-900/10',    accent: '#f87171' },
  { key: 'WE',       label: 'وي',      color: 'text-blue-400',   border: 'border-blue-900',        bg: 'bg-blue-900/10',   accent: '#60a5fa' },
  { key: 'Home4G',   label: '🏠 Home 4G', color: 'text-[#ca8a04]', border: 'border-[#ca8a04]/40', bg: 'bg-yellow-900/10', accent: '#ca8a04' },
];

const CYCLES = ['1', '15'];
const ABROAD_CYCLES = ['1', '15'];
const MAX_SUBS = 7;

// ─────────────────────────────────────────────────────────────────
// Factory Functions
// ─────────────────────────────────────────────────────────────────
const makeHome4G      = () => ({ ownerName: '', linePhone: '', discountPhone: '', subscriberName: '', contactPhone: '', package: '', paymentStatus: 'غير مدفوع', paidAmount: 0, baseCost: 0 });
const makeSub         = () => ({ name: '', phone: '', gb: 0, sentMB: 4096, mins: 1500, price: 0, paidAmount: 0 });
const makeSubsArray   = () => Array(MAX_SUBS).fill(null).map(makeSub);
const makeAbroadSub   = () => ({ name: '', phone: '', gb: 0, mins: 1500, price: 0, paidAmount: 0, traderName: '' });
const makeAbroadArray = () => Array(MAX_SUBS).fill(null).map(makeAbroadSub);

// ─────────────────────────────────────────────────────────────────
// Seat Availability Helper
// ─────────────────────────────────────────────────────────────────
function getSeatsInfo(subscribers) {
  const subs = subscribers || [];
  const usedSeats = subs.filter(s => s && (s.name || s.phone || s.gb > 0)).length;
  const freeSeats = MAX_SUBS - usedSeats;
  return { usedSeats, freeSeats, total: MAX_SUBS };
}

function SeatsIndicator({ subscribers, compact = false }) {
  const { usedSeats, freeSeats, total } = getSeatsInfo(subscribers);
  const isFull = freeSeats === 0;
  const isAlmostFull = freeSeats === 1;
  const isEmpty = usedSeats === 0;

  const dotColor = (idx) => {
    if (idx < usedSeats) return 'bg-green-500';
    return 'bg-gray-700';
  };

  const badgeColor = isFull
    ? 'bg-red-900/40 border-red-700 text-red-400'
    : isAlmostFull
    ? 'bg-yellow-900/40 border-yellow-700 text-yellow-400'
    : 'bg-green-900/40 border-green-700 text-green-400';

  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-black ${badgeColor}`}>
        <span>{isFull ? '🔴' : isAlmostFull ? '🟡' : '🟢'}</span>
        <span>{freeSeats === 0 ? 'ممتلئ' : `${freeSeats}/${total} فاضي`}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* dots row */}
      <div className="flex gap-1 items-center">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all ${i < usedSeats ? 'w-3 h-3 bg-green-500 shadow-[0_0_6px_rgba(74,222,128,0.6)]' : 'w-2.5 h-2.5 bg-gray-700'}`}
          />
        ))}
      </div>
      {/* label */}
      <div className={`px-2.5 py-0.5 rounded-full border text-[10px] font-black ${badgeColor}`}>
        {isFull ? '🔴 ممتلئ' : `🟢 فاضي ${freeSeats}/${total}`}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Excel Export Helper
// ─────────────────────────────────────────────────────────────────
function buildFormattedExcel(allLines) {
  const wb = XLSX.utils.book_new();

  const groups = {};
  allLines.forEach(line => {
    const key = `${line.network || 'Unknown'} سايكل ${line.cycle || '?'}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(line);
  });

  const COLORS = {
    headerBg:    'FF1565C0',
    headerFg:    'FFFFFFFF',
    colHdrBg:    'FF1976D2',
    colHdrFg:    'FFFFFFFF',
    paidBg:      'FFE8F5E9',
    paidFg:      'FF1B5E20',
    unpaidBg:    'FFFFEBEE',
    unpaidFg:    'FFB71C1C',
    partialBg:   'FFFFF8E1',
    partialFg:   'FFE65100',
    totalBg:     'FF0D47A1',
    totalFg:     'FFFFFFFF',
    lineBg:      'FFE3F2FD',
    emptyBg:     'FFF5F5F5',
    altBg:       'FFFAFAFA',
    white:       'FFFFFFFF',
    doneBg:      'FFE8F5E9',
    doneFg:      'FF1B5E20',
    notDoneBg:   'FFFFEBEE',
    notDoneFg:   'FFB71C1C',
  };

  const cellStyle = (bgColor, fgColor = 'FF000000', bold = false, sz = 11, hAlign = 'center') => ({
    fill:   { patternType: 'solid', fgColor: { rgb: bgColor } },
    font:   { bold, color: { rgb: fgColor }, sz, name: 'Cairo' },
    alignment: { horizontal: hAlign, vertical: 'center', readingOrder: 2, wrapText: false },
    border: {
      top:    { style: 'thin', color: { rgb: 'FFBDBDBD' } },
      bottom: { style: 'thin', color: { rgb: 'FFBDBDBD' } },
      left:   { style: 'thin', color: { rgb: 'FFBDBDBD' } },
      right:  { style: 'thin', color: { rgb: 'FFBDBDBD' } },
    },
  });

  const thickCellStyle = (bgColor, fgColor = 'FFFFFFFF', bold = true, sz = 11) => ({
    fill:   { patternType: 'solid', fgColor: { rgb: bgColor } },
    font:   { bold, color: { rgb: fgColor }, sz, name: 'Cairo' },
    alignment: { horizontal: 'center', vertical: 'center', readingOrder: 2 },
    border: {
      top:    { style: 'medium', color: { rgb: 'FF9E9E9E' } },
      bottom: { style: 'medium', color: { rgb: 'FF9E9E9E' } },
      left:   { style: 'medium', color: { rgb: 'FF9E9E9E' } },
      right:  { style: 'medium', color: { rgb: 'FF9E9E9E' } },
    },
  });

  const COL_WIDTHS = [8, 8, 9, 12, 20, 12, 12, 14, 14, 18, 20, 20, 14, 10];

  Object.entries(groups).forEach(([sheetName, lines]) => {
    const aoa   = [];
    const rowStyles = [];
    const merges  = [];
    const rowHeights = [];

    const pushRow = (cells, styles, height = 20) => {
      aoa.push(cells);
      rowStyles.push(styles);
      rowHeights.push(height);
    };

    lines.forEach(line => {
      const subs        = line.subscribers || [];
      const isH4G       = line.network === 'Home4G';
      const h           = line.home4gData || makeHome4G();

      const baseCost    = Number(line.baseCost || 0);
      const totalPrice  = isH4G ? Number(h.paidAmount || 0) : subs.reduce((a, s) => a + Number(s.price || 0), 0);
      const totalPaid   = isH4G ? Number(h.paidAmount || 0) : subs.reduce((a, s) => a + Number(s.paidAmount || 0), 0);
      const totalGB     = Number(line.totalGB || 0);
      const totalMins   = Number(line.totalMins || 0);
      const usedGB      = isH4G ? 0 : subs.reduce((a, s) => a + Number(s.gb || 0), 0);
      const usedMins    = isH4G ? 0 : subs.reduce((a, s) => a + Number(s.mins || 0), 0);
      const profitLoss  = totalPaid - baseCost;
      const plSign      = profitLoss >= 0 ? '+' : '';

      const startRow    = aoa.length;

      const ownerDisplay = isH4G
        ? `🏠 ${h.ownerName || 'بدون اسم'} — ${h.linePhone || ''}`
        : line.ownerName || 'بدون اسم';

      const billTxt    = line.billPaid    ? '✓ مدفوعة'  : '✗ غير مدفوعة';
      const voucherTxt = line.voucherSent ? '✓ فواتشر'  : '✗ فواتشر';
      const todTxt     = line.todSent     ? '✓ TOD'     : '✗ TOD';

      pushRow(
        [
          ownerDisplay, '', '', '', '',
          `جيجا: ${totalGB} GB`,
          `دقائق: ${totalMins}`,
          `ج.م. ${baseCost.toLocaleString('ar-EG')}`,
          `ج.م. ${plSign}${profitLoss.toLocaleString('ar-EG')}`,
          isH4G ? (h.linePhone || '') : (line.masterPhone || ''),
          billTxt, voucherTxt, todTxt,
          line.activationDate || (isH4G ? (h.package || '') : ''),
        ],
        [
          cellStyle(COLORS.headerBg, COLORS.headerFg, true, 14, 'right'),
          cellStyle(COLORS.headerBg, COLORS.headerFg, false, 10),
          cellStyle(COLORS.headerBg, COLORS.headerFg, false, 10),
          cellStyle(COLORS.headerBg, COLORS.headerFg, false, 10),
          cellStyle(COLORS.headerBg, COLORS.headerFg, false, 10),
          cellStyle(COLORS.headerBg, COLORS.headerFg, true, 10),
          cellStyle(COLORS.headerBg, COLORS.headerFg, true, 10),
          cellStyle(COLORS.headerBg, COLORS.headerFg, true, 11),
          cellStyle(COLORS.headerBg, profitLoss >= 0 ? 'FF81C784' : 'FFEF9A9A', true, 12),
          cellStyle(COLORS.headerBg, COLORS.headerFg, true, 10),
          cellStyle(line.billPaid    ? COLORS.doneBg : COLORS.notDoneBg, line.billPaid    ? COLORS.doneFg : COLORS.notDoneFg, true, 10),
          cellStyle(line.voucherSent ? COLORS.doneBg : COLORS.notDoneBg, line.voucherSent ? COLORS.doneFg : COLORS.notDoneFg, true, 10),
          cellStyle(line.todSent     ? COLORS.doneBg : COLORS.notDoneBg, line.todSent     ? COLORS.doneFg : COLORS.notDoneFg, true, 10),
          cellStyle(COLORS.headerBg, 'FFFFD54F', true, 11),
        ],
        28
      );

      merges.push({ s: { r: startRow, c: 0 }, e: { r: startRow, c: 4 } });

      pushRow(
        ['الباقة','الدقا','السعر','الدفع','العميل','Total Giga','Total Min','Total Price','P & L','رقم البيرنت','تفاصيل صاحب الخط','','تاريخ التفعيل','4G'],
        Array(14).fill(cellStyle(COLORS.colHdrBg, COLORS.colHdrFg, true, 9)),
        22
      );

      if (!isH4G) {
        subs.forEach((sub, si) => {
          const isEmpty   = !sub.name && !sub.phone && !sub.gb;
          const paid      = Number(sub.paidAmount || 0);
          const price     = Number(sub.price || 0);
          const debt      = price - paid;
          const isPaid    = debt <= 0 && price > 0;
          const isPartial = debt > 0 && paid > 0;
          const isFullDebt = debt > 0 && paid === 0 && price > 0;
          const totalMB  = Number(sub.gb || 0) * 1024;
          const sentMB   = Number(sub.sentMB || 0);
          const remainMB = totalMB - sentMB;

          const rowBg = isEmpty ? COLORS.emptyBg : si % 2 === 0 ? COLORS.white : COLORS.altBg;
          const baseStyle = (bold = false, sz = 10, hAlign = 'center') =>
            cellStyle(rowBg, 'FF212121', bold, sz, hAlign);

          let payStyle, payVal;
          if (isEmpty) {
            payStyle = cellStyle(COLORS.emptyBg, 'FFBDBDBD', false, 9);
            payVal   = '';
          } else if (isPaid) {
            payStyle = cellStyle(COLORS.paidBg, COLORS.paidFg, true, 10);
            payVal   = 'دفع ✓';
          } else if (isPartial) {
            payStyle = cellStyle(COLORS.partialBg, COLORS.partialFg, true, 10);
            payVal   = `جزئي ${paid}`;
          } else if (isFullDebt) {
            payStyle = cellStyle(COLORS.unpaidBg, COLORS.unpaidFg, true, 10);
            payVal   = 'لا ✗';
          } else {
            payStyle = baseStyle();
            payVal   = '';
          }

          pushRow(
            [
              sub.gb || '', sub.mins || '', price || '', payVal, sub.name || '',
              totalMB || '', sub.mins || '', price || '', remainMB || '',
              '', sub.phone || '', '', '', '',
            ],
            [
              baseStyle(), baseStyle(), baseStyle(), payStyle,
              baseStyle(true, 11, 'right'),
              baseStyle(false, 9), baseStyle(false, 9), baseStyle(false, 9),
              cellStyle(rowBg, remainMB < 0 ? 'FFEF5350' : 'FF43A047', false, 9),
              baseStyle(false, 9), baseStyle(false, 10, 'center'),
              baseStyle(false, 9), baseStyle(false, 9), baseStyle(false, 9),
            ],
            20
          );
        });
      } else {
        const hPaid   = Number(h.paidAmount || 0);
        const hCost   = Number(h.baseCost || 0);
        const hDebt   = hCost - hPaid;
        const hStatus = h.paymentStatus || 'غير مدفوع';
        const statusBg = hStatus === 'مدفوع' ? COLORS.paidBg : hStatus === 'جزئي' ? COLORS.partialBg : COLORS.unpaidBg;
        const statusFg = hStatus === 'مدفوع' ? COLORS.paidFg : hStatus === 'جزئي' ? COLORS.partialFg : COLORS.unpaidFg;

        pushRow(
          [
            h.package || '', '', hCost || '', hStatus,
            h.subscriberName || '', '', '', hPaid || '', hDebt > 0 ? `-${hDebt}` : '✓',
            h.linePhone || '', h.ownerName || '', h.discountPhone || '', h.contactPhone || '', '🏠',
          ],
          [
            cellStyle(COLORS.lineBg, 'FF212121', false, 10),
            cellStyle(COLORS.lineBg, 'FF212121', false, 10),
            cellStyle(COLORS.lineBg, 'FF212121', false, 10),
            cellStyle(statusBg, statusFg, true, 10),
            cellStyle(COLORS.lineBg, 'FF212121', true, 11, 'right'),
            cellStyle(COLORS.lineBg, 'FF212121', false, 10),
            cellStyle(COLORS.lineBg, 'FF212121', false, 10),
            cellStyle(COLORS.paidBg, COLORS.paidFg, true, 10),
            cellStyle(hDebt > 0 ? COLORS.unpaidBg : COLORS.paidBg, hDebt > 0 ? COLORS.unpaidFg : COLORS.paidFg, true, 10),
            cellStyle(COLORS.lineBg, 'FF212121', false, 10),
            cellStyle(COLORS.lineBg, 'FF212121', false, 10),
            cellStyle(COLORS.lineBg, 'FF212121', false, 10),
            cellStyle(COLORS.lineBg, 'FF212121', false, 10),
            cellStyle(COLORS.lineBg, 'FFCA8A04', true, 14),
          ],
          22
        );
      }

      pushRow(
        [
          'الإجمالي', '', '', '',
          `${isH4G ? 1 : subs.filter(s => s.name || s.phone).length} مشترك`,
          `${isH4G ? 0 : usedGB} GB`, isH4G ? '' : `${usedMins}`,
          `ج.م. ${totalPrice.toLocaleString('ar-EG')}`,
          `ج.م. ${plSign}${profitLoss.toLocaleString('ar-EG')}`,
          '', '', '', '', '',
        ],
        [
          thickCellStyle(COLORS.totalBg), thickCellStyle(COLORS.totalBg),
          thickCellStyle(COLORS.totalBg), thickCellStyle(COLORS.totalBg),
          thickCellStyle(COLORS.totalBg, COLORS.totalFg, true, 10),
          thickCellStyle(COLORS.totalBg, COLORS.totalFg, true, 10),
          thickCellStyle(COLORS.totalBg, COLORS.totalFg, false, 10),
          thickCellStyle(COLORS.totalBg, COLORS.totalFg, true, 11),
          thickCellStyle(COLORS.totalBg, profitLoss >= 0 ? 'FF81C784' : 'FFEF9A9A', true, 12),
          ...Array(5).fill(thickCellStyle(COLORS.totalBg)),
        ],
        24
      );

      merges.push({ s: { r: aoa.length - 1, c: 0 }, e: { r: aoa.length - 1, c: 3 } });
      pushRow(Array(14).fill(''), Array(14).fill(cellStyle('FFFFFFFF', 'FFFFFFFF')), 8);
    });

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    aoa.forEach((rowArr, ri) => {
      rowArr.forEach((_, ci) => {
        const cellRef = XLSX.utils.encode_cell({ r: ri, c: ci });
        if (!ws[cellRef]) ws[cellRef] = { v: '', t: 's' };
        ws[cellRef].s = rowStyles[ri][ci];
      });
    });
    ws['!cols'] = COL_WIDTHS.map(w => ({ wch: w }));
    ws['!rows'] = rowHeights.map(h => ({ hpt: h }));
    ws['!merges'] = merges;
    if (!ws['!sheetView']) ws['!sheetView'] = {};
    ws['!sheetViews'] = [{ rightToLeft: true }];
    XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));
  });

  const backupRows = allLines.map(line => ({
    ID: line.id,
    'صاحب الخط': line.ownerName || '',
    'الرقم': line.masterPhone || '',
    'الشبكة': line.network || '',
    'السايكل': line.cycle || '',
    'تاريخ التفعيل': line.activationDate || '',
    'التكلفة': line.baseCost || 0,
    'الجيجا': line.totalGB || 0,
    'الدقائق': line.totalMins || 0,
    'دفعت الفاتورة': line.billPaid ? 'نعم' : 'لا',
    'فواتشر': line.voucherSent ? 'نعم' : 'لا',
    'TOD': line.todSent ? 'نعم' : 'لا',
    'بيانات المشتركين (JSON)': JSON.stringify(line.subscribers || []),
    'بيانات Home4G (JSON)': JSON.stringify(line.home4gData || null),
  }));
  const wsBackup = XLSX.utils.json_to_sheet(backupRows);
  XLSX.utils.book_append_sheet(wb, wsBackup, 'Backup');

  return wb;
}

// ─────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────
export default function TelecomSystem() {
  const [activeTab,      setActiveTab]      = useState('Etisalat');
  const [activeCycle,    setActiveCycle]    = useState('1');
  const [abroadMode,     setAbroadMode]     = useState(false);
  const [abroadCycle,    setAbroadCycle]    = useState('1');
  const [expandedLine,   setExpandedLine]   = useState(null);
  const [expandedAbroad, setExpandedAbroad] = useState(null);
  const [searchTerm,     setSearchTerm]     = useState('');
  const [masterLines,    setMasterLines]    = useState([]);
  const [allLines,       setAllLines]       = useState([]);
  const [abroadClients,  setAbroadClients]  = useState([]);
  const [showStats,      setShowStats]      = useState(false);
  const [isRefreshing,   setIsRefreshing]   = useState(false);
  const [showSubsList,   setShowSubsList]   = useState(false);
  const [subsFilter,     setSubsFilter]     = useState('all');

  const unsubRef       = useRef(null);
  const unsubAllRef    = useRef(null);
  const unsubAbroadRef = useRef(null);
  const isHome4G       = activeTab === 'Home4G';
  const netMeta        = NETWORKS.find(n => n.key === activeTab);

  // ── Subscribe to main lines
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

  // ── Subscribe to abroad clients
  const subscribeToAbroad = useCallback(() => {
    if (unsubAbroadRef.current) unsubAbroadRef.current();
    if (isHome4G) return () => {};
    const q = query(
      collection(db, 'abroadClients'),
      where('network', '==', activeTab),
      where('cycle',   '==', abroadCycle)
    );
    const unsub = onSnapshot(q, (snap) => {
      setAbroadClients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    unsubAbroadRef.current = unsub;
    return unsub;
  }, [activeTab, abroadCycle, isHome4G]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'lines'), (snap) => {
      setAllLines(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    unsubAllRef.current = unsub;
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = subscribeToLines();
    return () => unsub();
  }, [subscribeToLines]);

  useEffect(() => {
    const unsub = subscribeToAbroad();
    return () => unsub();
  }, [subscribeToAbroad]);

  const handleManualRefresh = useCallback(() => {
    setIsRefreshing(true);
    subscribeToLines();
  }, [subscribeToLines]);

  // ── Debounced Writes
  const _updateMasterLine = useCallback(async (lineId, field, value) => {
    const val = ['totalGB', 'totalMins', 'baseCost'].includes(field) ? Number(value) : value;
    await updateDoc(doc(db, 'lines', lineId), { [field]: val });
  }, []);
  const updateMasterLine = useDebounceCallback(_updateMasterLine);

  const _updateHome4G = useCallback(async (lineId, field, value, currentData) => {
    const updated = { ...currentData, [field]: ['paidAmount','baseCost'].includes(field) ? Number(value) : value };
    await updateDoc(doc(db, 'lines', lineId), { home4gData: updated });
  }, []);
  const updateHome4G = useDebounceCallback(_updateHome4G);

  const _updateSub = useCallback(async (lineId, subIndex, field, value, currentSubscribers, network) => {
    const newSubs = currentSubscribers ? [...currentSubscribers] : makeSubsArray();
    const parsed  = ['gb','sentMB','mins','price','paidAmount'].includes(field) ? Number(value) : value;
    newSubs[subIndex] = { ...newSubs[subIndex], [field]: parsed };
    if (field === 'gb') {
      const knownPrice = PRICE_TABLE[network]?.[parsed];
      if (knownPrice !== undefined) newSubs[subIndex].price = knownPrice;
    }
    await updateDoc(doc(db, 'lines', lineId), { subscribers: newSubs });
  }, []);
  const updateSub = useDebounceCallback(_updateSub);

  const _updateAbroadClient = useCallback(async (clientId, field, value, currentSubs) => {
    const parsed = ['gb','mins','price','paidAmount'].includes(field) ? Number(value) : value;
    const updatedSub = { ...currentSubs, [field]: parsed };
    if (field === 'gb') {
      const knownPrice = PRICE_TABLE[activeTab]?.[parsed];
      if (knownPrice !== undefined) updatedSub.price = knownPrice;
    }
    await updateDoc(doc(db, 'abroadClients', clientId), updatedSub);
  }, [activeTab]);
  const updateAbroadClient = useDebounceCallback(_updateAbroadClient);

  // ── Instant handlers
  const toggleField = useCallback(async (e, lineId, field, current) => {
    e.stopPropagation();
    await updateDoc(doc(db, 'lines', lineId), { [field]: !current });
  }, []);

  const handleClearDebt = useCallback(async (lineId, subIndex, currentSubscribers, price) => {
    const newSubs = currentSubscribers ? [...currentSubscribers] : makeSubsArray();
    newSubs[subIndex] = { ...newSubs[subIndex], paidAmount: price };
    await updateDoc(doc(db, 'lines', lineId), { subscribers: newSubs });
  }, []);

  const handleClearAbroadDebt = useCallback(async (clientId, price) => {
    await updateDoc(doc(db, 'abroadClients', clientId), { paidAmount: price });
  }, []);

  // ── CRUD
  const addNewLine = useCallback(async () => {
    try {
      const base = { network: activeTab, cycle: activeCycle, ownerName: 'خط جديد', masterPhone: '', activationDate: '', baseCost: 0, totalGB: 0, totalMins: 0, billPaid: false, voucherSent: false, todSent: false };
      if (isHome4G) await addDoc(collection(db, 'lines'), { ...base, subscribers: [], home4gData: makeHome4G() });
      else          await addDoc(collection(db, 'lines'), { ...base, subscribers: makeSubsArray(), home4gData: null });
    } catch { alert('خطأ في الاتصال بقاعدة البيانات'); }
  }, [activeTab, activeCycle, isHome4G]);

  const addNewAbroadClient = useCallback(async () => {
    try {
      await addDoc(collection(db, 'abroadClients'), {
        network: activeTab,
        cycle: abroadCycle,
        name: 'عميل جديد',
        phone: '',
        gb: 0,
        mins: 1500,
        price: 0,
        paidAmount: 0,
        traderName: '',
        activationDate: '',
      });
    } catch { alert('خطأ في الاتصال بقاعدة البيانات'); }
  }, [activeTab, abroadCycle]);

  const deleteLine = useCallback(async (e, id) => {
    e.stopPropagation();
    if (window.confirm('هل تريد حذف هذا الخط نهائياً؟'))
      await deleteDoc(doc(db, 'lines', id));
  }, []);

  const deleteAbroadClient = useCallback(async (e, id) => {
    e.stopPropagation();
    if (window.confirm('هل تريد حذف هذا العميل نهائياً؟'))
      await deleteDoc(doc(db, 'abroadClients', id));
  }, []);

  // ── Export
  const exportToExcel = useCallback(() => {
    const wb = buildFormattedExcel(allLines);
    XLSX.writeFile(wb, 'MO_CONTROL_Export.xlsx');
  }, [allLines]);

  // ── Import
  const importFromExcel = useCallback((e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const wb   = XLSX.read(new Uint8Array(evt.target.result), { type: 'array' });
      const sheetName = wb.SheetNames.includes('Backup') ? 'Backup' : wb.SheetNames[wb.SheetNames.length - 1];
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
      for (const item of rows) {
        await setDoc(doc(db, 'lines', item.ID), {
          ownerName: item['صاحب الخط']||'', masterPhone: item['الرقم']||'', network: item['الشبكة']||'',
          cycle: String(item['السايكل']||''), activationDate: item['تاريخ التفعيل']||'',
          baseCost: Number(item['التكلفة'])||0, totalGB: Number(item['الجيجا'])||0, totalMins: Number(item['الدقائق'])||0,
          billPaid: item['دفعت الفاتورة']==='نعم', voucherSent: item['فواتشر']==='نعم', todSent: item['TOD']==='نعم',
          subscribers: item['بيانات المشتركين (JSON)'] ? JSON.parse(item['بيانات المشتركين (JSON)']) : makeSubsArray(),
          home4gData:  item['بيانات Home4G (JSON)']    ? JSON.parse(item['بيانات Home4G (JSON)'])    : null,
        });
      }
      alert('تم استعادة البيانات بنجاح!');
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  }, []);

  // ── Stats
  const getLineStats = useCallback((line) => {
    if (line.network === 'Home4G') {
      const h = line.home4gData||{}; const paid = Number(h.paidAmount||0); const cost = Number(h.baseCost||0);
      return { profit: paid-cost, debts: Math.max(0,cost-paid), remainingGB: 0, remainingMins: 0 };
    }
    const subs = line.subscribers||[]; let collected=0,prices=0,usedGB=0,usedMins=0;
    subs.forEach(s => { collected+=Number(s.paidAmount||0); prices+=Number(s.price||0); usedGB+=Number(s.gb||0); usedMins+=Number(s.mins||0); });
    return { profit: collected-Number(line.baseCost||0), debts: Math.max(0,prices-collected), remainingGB: Number(line.totalGB||0)-usedGB, remainingMins: Number(line.totalMins||0)-usedMins };
  }, []);

  const globalStats = (() => {
    const nets = { Etisalat:0, Vodafone:0, WE:0, Home4G:0 }; let totalProfit=0, totalDebt=0;
    masterLines.forEach(line => {
      if (nets[line.network]!==undefined) nets[line.network]++;
      const s = getLineStats(line);
      totalProfit += s.profit;
      if (line.network === 'Home4G') {
        totalDebt += s.debts;
      } else if (!line.billPaid) {
        totalDebt += Number(line.baseCost||0);
      }
    });
    return { nets, totalProfit, totalDebt };
  })();

  // ── قائمة المشتركين المجمّعة
  const allSubscribers = (() => {
    if (isHome4G) return [];
    const result = [];
    masterLines.forEach(line => {
      (line.subscribers || []).forEach((sub, idx) => {
        if (!sub || (!sub.name && !sub.phone)) return;
        result.push({
          lineId:      line.id,
          lineOwner:   line.ownerName || 'بدون اسم',
          masterPhone: line.masterPhone || '',
          subIndex:    idx,
          name:        sub.name || '',
          phone:       sub.phone || '',
          gb:          sub.gb || 0,
          price:       sub.price || 0,
          paidAmount:  sub.paidAmount || 0,
          debt:        Number(sub.price||0) - Number(sub.paidAmount||0),
          subscribers: line.subscribers,
        });
      });
    });
    return result;
  })();

  const countAll     = allSubscribers.filter(s => s.debt > 0).length;
  const countFull    = allSubscribers.filter(s => s.paidAmount === 0 && s.debt > 0).length;
  const countPartial = allSubscribers.filter(s => s.paidAmount > 0 && s.debt > 0).length;

  const subsStats = {
    totalDebt:  allSubscribers.filter(s => s.debt > 0).reduce((a,s) => a + Math.max(0, s.debt), 0),
    totalPaid:  allSubscribers.filter(s => s.debt > 0).reduce((a,s) => a + s.paidAmount, 0),
    totalPrice: allSubscribers.filter(s => s.debt > 0).reduce((a,s) => a + s.price, 0),
  };

  // ── Search
  const filteredLines = masterLines.filter(line => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    if (line.ownerName?.toLowerCase().includes(s) || line.masterPhone?.includes(searchTerm)) return true;
    if (line.subscribers?.some(sub => sub.name?.toLowerCase().includes(s) || sub.phone?.includes(searchTerm))) return true;
    if (line.network==='Home4G') { const h=line.home4gData||{}; return h.ownerName?.toLowerCase().includes(s)||h.subscriberName?.toLowerCase().includes(s)||h.linePhone?.includes(searchTerm); }
    return false;
  });

  const filteredSubs = allSubscribers.filter(sub => {
    const matchSearch = !searchTerm || (() => {
      const s = searchTerm.toLowerCase();
      return sub.name?.toLowerCase().includes(s) || sub.phone?.includes(searchTerm) || sub.lineOwner?.toLowerCase().includes(s);
    })();
    const isFullDebt = sub.paidAmount === 0 && sub.debt > 0;
    const isPartial  = sub.paidAmount > 0  && sub.debt > 0;
    const hasDebt    = sub.debt > 0;
    let matchFilter = false;
    if (subsFilter === 'all')     matchFilter = hasDebt;
    if (subsFilter === 'full')    matchFilter = isFullDebt;
    if (subsFilter === 'partial') matchFilter = isPartial;
    return matchSearch && matchFilter;
  });

  const filteredSubsStats = {
    totalPrice: filteredSubs.reduce((a,s) => a + s.price, 0),
    totalPaid:  filteredSubs.reduce((a,s) => a + s.paidAmount, 0),
    totalDebt:  filteredSubs.reduce((a,s) => a + Math.max(0, s.debt), 0),
  };

  // ── Abroad filtered
  const filteredAbroad = abroadClients.filter(c => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return c.name?.toLowerCase().includes(s) || c.phone?.includes(searchTerm) || c.traderName?.toLowerCase().includes(s);
  });

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="px-3 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8 bg-[#0a0a0a] min-h-screen text-gray-200" dir="rtl">

      {/* Header */}
      <header className="mb-4 text-center">
        <h1 className="text-3xl sm:text-4xl font-black text-[#ca8a04]">MO CONTROL</h1>
      </header>

      {/* أزرار التحكم */}
      <div className="flex justify-center gap-2 sm:gap-3 mb-5 flex-wrap">
        <button onClick={() => setShowStats(v=>!v)}
          className="px-4 sm:px-6 py-2 rounded-xl font-bold border-2 border-gray-700 text-gray-400 hover:border-[#ca8a04] hover:text-[#ca8a04] transition-all text-xs sm:text-sm flex items-center gap-2">
          📊 {showStats ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
        </button>
        <button onClick={handleManualRefresh} disabled={isRefreshing}
          className={`px-3 sm:px-4 py-2 rounded-xl font-bold border-2 transition-all text-xs sm:text-sm flex items-center gap-2 ${isRefreshing?'border-gray-800 text-gray-600 cursor-not-allowed':'border-gray-700 text-gray-400 hover:border-blue-500 hover:text-blue-400'}`}>
          <span className={`inline-block ${isRefreshing?'animate-spin':''}`}>🔄</span>
          <span className="hidden sm:inline">{isRefreshing ? 'جاري التحديث...' : 'تحديث'}</span>
        </button>
      </div>

      {/* لوحة الإحصائيات */}
      {showStats && (
        <div className="max-w-4xl mx-auto mb-6 sm:mb-8 bg-[#111] border border-gray-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6">
          <h2 className="text-center text-xs sm:text-sm font-bold text-[#ca8a04] mb-4 sm:mb-5 tracking-widest">ملخص عام</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-4">
            {[
              { label:'اتصالات', count:globalStats.nets.Etisalat, color:'text-green-400',  border:'border-green-900' },
              { label:'فودافون', count:globalStats.nets.Vodafone,  color:'text-red-400',    border:'border-red-900' },
              { label:'وي',      count:globalStats.nets.WE,         color:'text-blue-400',   border:'border-blue-900' },
              { label:'Home 4G', count:globalStats.nets.Home4G,    color:'text-[#ca8a04]', border:'border-[#ca8a04]/30' },
            ].map(n => (
              <div key={n.label} className={`bg-black/40 border ${n.border} rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center`}>
                <p className="text-[9px] sm:text-[10px] text-gray-500 mb-1">{n.label}</p>
                <p className={`text-2xl sm:text-3xl font-black ${n.color}`}>{n.count}</p>
                <p className="text-[8px] sm:text-[9px] text-gray-600 mt-1">خط</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="bg-black/40 border border-green-900 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center">
              <p className="text-[9px] sm:text-[10px] text-gray-500 mb-1">إجمالي الأرباح</p>
              <p className={`text-xl sm:text-2xl font-black ${globalStats.totalProfit>=0?'text-green-400':'text-red-400'}`}>{globalStats.totalProfit} ج</p>
            </div>
            <div className="bg-black/40 border border-orange-900 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center">
              <p className="text-[9px] sm:text-[10px] text-gray-500 mb-1">مديونية الفواتير</p>
              <p className="text-xl sm:text-2xl font-black text-orange-400">{globalStats.totalDebt} ج</p>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="max-w-xl mx-auto mb-5 sm:mb-8">
        <input type="text" placeholder="البحث باسم العميل أو الرقم..." value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#111] border border-gray-800 rounded-xl sm:rounded-2xl py-3 sm:py-4 px-4 sm:px-6 text-sm outline-none focus:border-[#ca8a04] transition-colors" />
      </div>

      {/* Network Tabs */}
      <div className="flex justify-center gap-2 sm:gap-3 mb-3 sm:mb-4 flex-wrap">
        {NETWORKS.map(net => (
          <button key={net.key}
            onClick={() => { setActiveTab(net.key); setExpandedLine(null); setExpandedAbroad(null); setShowSubsList(false); setSubsFilter('all'); setAbroadMode(false); }}
            className={`px-3 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-bold border-2 transition-all text-xs sm:text-sm ${activeTab===net.key?'border-[#ca8a04] bg-[#ca8a04] text-black':'border-gray-800 text-gray-500 hover:border-gray-600'}`}>
            {net.label}
          </button>
        ))}
      </div>

      {/* Cycle / Abroad Mode Tabs */}
      <div className="flex justify-center gap-2 mb-6 sm:mb-10 flex-wrap">
        <button
          onClick={() => { setAbroadMode(false); setActiveCycle('1'); setExpandedLine(null); setSubsFilter('all'); }}
          className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold transition-all text-xs sm:text-sm border-2 ${!abroadMode && activeCycle==='1' ? 'bg-blue-600 text-white border-blue-600' : 'bg-[#111] text-gray-500 border-gray-800 hover:border-gray-600'}`}>
          سايكل 1
        </button>
        <button
          onClick={() => { setAbroadMode(false); setActiveCycle('15'); setExpandedLine(null); setSubsFilter('all'); }}
          className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold transition-all text-xs sm:text-sm border-2 ${!abroadMode && activeCycle==='15' ? 'bg-blue-600 text-white border-blue-600' : 'bg-[#111] text-gray-500 border-gray-800 hover:border-gray-600'}`}>
          سايكل 15
        </button>

        {!isHome4G && <div className="w-px h-8 bg-gray-800 mx-0.5 self-center" />}

        {!isHome4G && (
          <button
            onClick={() => { setAbroadMode(true); setAbroadCycle('1'); setExpandedAbroad(null); }}
            className={`px-3 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold transition-all text-xs sm:text-sm border-2 ${abroadMode && abroadCycle==='1' ? 'bg-white text-black border-white' : 'bg-[#111] text-gray-400 border-gray-700 hover:border-gray-500 hover:text-white'}`}>
            ✈️ <span className="hidden xs:inline">عملاء </span>الخارج 1
          </button>
        )}
        {!isHome4G && (
          <button
            onClick={() => { setAbroadMode(true); setAbroadCycle('15'); setExpandedAbroad(null); }}
            className={`px-3 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold transition-all text-xs sm:text-sm border-2 ${abroadMode && abroadCycle==='15' ? 'bg-white text-black border-white' : 'bg-[#111] text-gray-400 border-gray-700 hover:border-gray-500 hover:text-white'}`}>
            ✈️ <span className="hidden xs:inline">عملاء </span>الخارج 15
          </button>
        )}
      </div>

      {/* ══════════════════════════════
          عرض عملاء الخارج
          ══════════════════════════════ */}
      {abroadMode && !isHome4G ? (
        <div className="max-w-7xl mx-auto">
          <div className="mb-4 flex items-center justify-between bg-[#111] border border-gray-800 rounded-2xl px-4 sm:px-5 py-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-lg sm:text-xl">✈️</span>
              <div>
                <p className={`font-black text-xs sm:text-sm ${netMeta?.color}`}>
                  عملاء الخارج — {netMeta?.label} سايكل {abroadCycle}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {filteredAbroad.length} عميل &nbsp;·&nbsp;
                  ديون: <span className="text-red-400 font-bold">{filteredAbroad.filter(c=>Number(c.price||0)>Number(c.paidAmount||0)).reduce((a,c)=>a+Number(c.price||0)-Number(c.paidAmount||0),0)} ج</span>
                </p>
              </div>
            </div>
          </div>

          {filteredAbroad.length === 0 && (
            <div className="text-center text-gray-600 py-16 sm:py-20 text-sm">
              {searchTerm ? 'لا توجد نتائج مطابقة للبحث' : 'لا يوجد عملاء خارج. اضغط + لإضافة عميل جديد'}
            </div>
          )}

          <div className="space-y-3">
            {filteredAbroad.map((client) => {
              const debt    = Number(client.price||0) - Number(client.paidAmount||0);
              const isPaid  = debt <= 0 && Number(client.price||0) > 0;
              const isPartialPay = Number(client.paidAmount||0) > 0 && debt > 0;
              const isOpen  = expandedAbroad === client.id;

              return (
                <div key={client.id} className="bg-[#111] border border-gray-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl">
                  <div
                    onClick={() => setExpandedAbroad(isOpen ? null : client.id)}
                    className="p-3 sm:p-4 cursor-pointer hover:bg-[#161616] transition-colors"
                  >
                    {/* Mobile layout */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white text-sm truncate">{client.name || 'بدون اسم'} — {client.phone || '0000'}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                          التاجر: <span className="text-[#ca8a04] font-bold">{client.traderName || 'غير محدد'}</span>
                          {client.activationDate ? <span className="mr-2 text-gray-500">· {client.activationDate}</span> : null}
                        </p>
                      </div>
                      <button onClick={(e) => deleteAbroadClient(e, client.id)} className="text-gray-600 hover:text-red-500 transition-colors flex-shrink-0 text-sm">🗑️</button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center">
                      <StatBox label="الباقة"  value={`${client.gb||0} GB`}        color="text-blue-400" />
                      <StatBox label="الدقائق" value={`${client.mins||0} د`}       color="text-gray-300" />
                      <StatBox label="السعر"   value={`${client.price||0} ج`}      color="text-gray-200" />
                      <StatBox label="المدفوع" value={`${client.paidAmount||0} ج`} color="text-yellow-400" />
                      <div className={`p-2 rounded-lg border min-w-[70px] text-center ${isPaid?'border-green-700 bg-green-900/20':'border-red-900 bg-red-900/20'}`}>
                        <p className="text-[8px] text-gray-500">الدين</p>
                        <p className={`font-bold text-xs ${isPaid?'text-green-400':isPartialPay?'text-yellow-400':'text-red-400'}`}>
                          {isPaid ? 'خالص ✓' : `${debt} ج`}
                        </p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleClearAbroadDebt(client.id, client.price); }}
                        className={`text-[10px] font-bold px-2.5 py-2 rounded-lg transition-all border ${isPaid?'text-green-500 bg-green-500/10 border-green-900':'text-red-400 bg-red-500/10 border-red-900 hover:bg-red-500/20'}`}>
                        {isPaid ? 'خالص ✓' : 'خلّص ✓'}
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="p-4 sm:p-6 border-t border-gray-800 bg-[#0d0d0d]">
                      <p className="text-xs text-white font-bold mb-4 flex items-center gap-2"><span>✈️</span> بيانات عميل الخارج</p>
                      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 sm:gap-3 items-end bg-[#111] p-3 sm:p-4 rounded-2xl border border-gray-800 min-w-[480px] sm:min-w-[900px]">
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-gray-500 text-center">الاسم</label>
                            <input defaultValue={client.name} onChange={(e) => updateAbroadClient(client.id, 'name', e.target.value, client)} className="bg-black border border-gray-800 rounded-lg p-2 text-[11px] text-white outline-none focus:border-[#ca8a04] text-center w-full" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-gray-500 text-center">الرقم</label>
                            <input defaultValue={client.phone} onChange={(e) => updateAbroadClient(client.id, 'phone', e.target.value, client)} className="bg-black border border-gray-800 rounded-lg p-2 text-[11px] text-white outline-none focus:border-[#ca8a04] text-center w-full" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-gray-500 text-center">اسم التاجر</label>
                            <input defaultValue={client.traderName} onChange={(e) => updateAbroadClient(client.id, 'traderName', e.target.value, client)} className="bg-black border border-gray-800 rounded-lg p-2 text-[11px] text-[#ca8a04] outline-none focus:border-[#ca8a04] text-center w-full" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-gray-500 text-center">باقة GB</label>
                            <GbInput defaultValue={client.gb || ''} network={activeTab} listId={`abroad-gb-list-${client.id}`} onChange={(e) => updateAbroadClient(client.id, 'gb', e.target.value, client)} />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-gray-500 text-center">تاريخ التفعيل</label>
                            <input defaultValue={client.activationDate || ''} onChange={(e) => updateAbroadClient(client.id, 'activationDate', e.target.value, client)} placeholder="1/4" className="bg-black border border-gray-800 rounded-lg p-2 text-[11px] text-[#ca8a04] outline-none focus:border-[#ca8a04] text-center w-full" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-gray-500 text-center">الدقائق</label>
                            <input type="number" defaultValue={client.mins} onChange={(e) => updateAbroadClient(client.id, 'mins', e.target.value, client)} className="bg-black border border-gray-800 rounded-lg p-2 text-[11px] text-white outline-none focus:border-[#ca8a04] text-center w-full" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-gray-500 text-center">السعر</label>
                            <input type="number" defaultValue={client.price} onChange={(e) => updateAbroadClient(client.id, 'price', e.target.value, client)} className="bg-black border border-gray-800 rounded-lg p-2 text-[11px] text-white outline-none focus:border-[#ca8a04] text-center w-full" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-gray-500 text-center">المدفوع</label>
                            <input type="number" defaultValue={client.paidAmount} onChange={(e) => updateAbroadClient(client.id, 'paidAmount', e.target.value, client)} className="bg-black border border-gray-800 rounded-lg p-2 text-[11px] text-green-400 outline-none focus:border-[#ca8a04] text-center w-full" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filteredAbroad.length > 0 && (
            <div className="mt-4 bg-[#111] border border-gray-800 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-start sm:items-center">
              <p className="text-[10px] sm:text-[11px] text-gray-500 font-bold">إجمالي عملاء الخارج ({filteredAbroad.length} عميل)</p>
              <div className="flex gap-3 sm:gap-4 flex-wrap text-xs sm:text-sm">
                <span className="text-gray-300 font-bold">الأسعار: <span className="text-white">{filteredAbroad.reduce((a,c)=>a+Number(c.price||0),0)} ج</span></span>
                <span className="text-yellow-400 font-bold">المدفوع: {filteredAbroad.reduce((a,c)=>a+Number(c.paidAmount||0),0)} ج</span>
                <span className="text-red-400 font-bold">الديون: {filteredAbroad.filter(c=>Number(c.price||0)>Number(c.paidAmount||0)).reduce((a,c)=>a+Number(c.price||0)-Number(c.paidAmount||0),0)} ج</span>
              </div>
            </div>
          )}
        </div>

      ) : (
        /* ══════════════════════════════
           العرض الأصلي للخطوط
           ══════════════════════════════ */
        <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4">
          {filteredLines.length===0 && (
            <div className="text-center text-gray-600 py-16 sm:py-20 text-sm">
              {searchTerm ? 'لا توجد نتائج مطابقة للبحث' : 'لا توجد خطوط. اضغط + لإضافة خط جديد'}
            </div>
          )}

          {filteredLines.map(line => {
            const stats  = getLineStats(line);
            const isOpen = expandedLine === line.id;
            const h      = line.home4gData || makeHome4G();
            const isH4G  = line.network === 'Home4G';

            return (
              <div key={line.id} className="bg-[#111] border border-gray-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl">

                {/* Header Row */}
                <div onClick={() => setExpandedLine(isOpen?null:line.id)}
                  className="p-3 sm:p-4 cursor-pointer hover:bg-[#161616] transition-colors">

                  {/* Header Row — اسم الخط + الأزرار + حذف كلهم في نفس السطر */}
                  <div className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">

                    {/* Name block */}
                    <div className="bg-black p-2.5 sm:p-3 rounded-xl border border-gray-800 w-full md:w-60 text-center md:text-right flex-shrink-0">
                      <p className="text-[8px] sm:text-[9px] text-gray-500 uppercase mb-1">{isH4G?'صاحب البرينت / رقم الخط':'صاحب الخط / الرقم / التفعيل'}</p>
                      <p className="font-bold text-white text-xs sm:text-sm truncate">
                        {isH4G?`${h.ownerName||'بدون اسم'} - ${h.linePhone||'0000'}`:`${line.ownerName||'بدون اسم'} - ${line.masterPhone||'0000'}`}
                      </p>
                      <p className="text-[9px] sm:text-[10px] text-[#ca8a04] font-bold mt-1 truncate">
                        {isH4G?`باقة: ${h.package||'غير محددة'}`:`تفعيل: ${line.activationDate||'غير محدد'}`}
                      </p>
                    </div>

                    {/* Stats + Toggles + Seats — جنب الاسم */}
                    {isH4G ? (
                      <div className="flex flex-row gap-1.5 sm:gap-2 flex-wrap items-center flex-1">
                        <StatBox label="الربح" value={`${stats.profit} ج`} color={stats.profit>=0?'text-green-500':'text-red-500'} />
                        <StatBox label="ديون"  value={`${stats.debts} ج`}  color="text-orange-500" />
                        <div className="bg-black/30 p-2 rounded-lg border border-[#ca8a04]/30 min-w-[75px]">
                          <p className="text-[8px] text-gray-500">حالة الدفع</p>
                          <p className={`font-bold text-xs ${h.paymentStatus==='مدفوع'?'text-green-500':h.paymentStatus==='جزئي'?'text-yellow-400':'text-red-400'}`}>{h.paymentStatus||'غير مدفوع'}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-row flex-wrap gap-1.5 sm:gap-2 items-center flex-1">
                        <StatBox label="الربح"        value={`${stats.profit} ج`}        color={stats.profit>=0?'text-green-500':'text-red-500'} />
                        <StatBox label="ديون"         value={`${stats.debts} ج`}         color="text-orange-500" />
                        <StatBox label="جيجا متبقية"  value={`${stats.remainingGB} GB`}  color="text-blue-400" />
                        <StatBox label="دقائق متبقية" value={`${stats.remainingMins} د`} color="text-green-400" />
                        <ToggleBtn label="الفاتورة" active={line.billPaid}    onText="مدفوعة ✓"  offText="غير مدفوعة" onBorder="border-green-700 bg-green-900/30 text-green-400"  offBorder="border-red-900 bg-red-900/20 text-red-400"       onClick={(e)=>toggleField(e,line.id,'billPaid',line.billPaid)} />
                        <ToggleBtn label="فواتشر"   active={line.voucherSent} onText="اتباعت ✓" offText="لسه"        onBorder="border-cyan-700 bg-cyan-900/30 text-cyan-400"    offBorder="border-gray-700 bg-gray-900/20 text-gray-500"    onClick={(e)=>toggleField(e,line.id,'voucherSent',line.voucherSent)} />
                        <ToggleBtn label="TOD"      active={line.todSent}     onText="اتباعت ✓" offText="لسه"        onBorder="border-yellow-600 bg-yellow-900/30 text-yellow-400" offBorder="border-gray-700 bg-gray-900/20 text-gray-500"  onClick={(e)=>toggleField(e,line.id,'todSent',line.todSent)} />
                        <SeatsIndicator subscribers={line.subscribers} compact={true} />
                      </div>
                    )}

                    <button onClick={(e)=>deleteLine(e,line.id)} className="text-gray-600 hover:text-red-500 transition-colors flex-shrink-0">🗑️</button>
                  </div>
                </div>

                {/* ── Expanded: Home4G ── */}
                {isOpen && isH4G && (
                  <div className="p-4 sm:p-6 border-t border-gray-800 bg-[#0d0d0d]">
                    <p className="text-xs text-[#ca8a04] font-bold mb-4 flex items-center gap-2"><span>🏠</span> بيانات خط Home 4G</p>
                    <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                      <div className="grid grid-cols-3 sm:grid-cols-9 gap-2 items-end bg-[#111] p-3 sm:p-4 rounded-2xl border border-[#ca8a04]/30 min-w-[500px] sm:min-w-[1100px]">
                        {[
                          { label:'صاحب البرينت', field:'ownerName',     cls:'text-white' },
                          { label:'رقم خط الهوم', field:'linePhone',      cls:'text-white' },
                          { label:'رقم الخصم',    field:'discountPhone',  cls:'text-white' },
                          { label:'اسم المشترك',  field:'subscriberName', cls:'text-white' },
                          { label:'رقم تواصل',    field:'contactPhone',   cls:'text-white' },
                          { label:'الباقة',        field:'package',        cls:'text-[#ca8a04]' },
                        ].map(({ label, field, cls }) => (
                          <div key={field} className="flex flex-col gap-1">
                            <label className="text-[9px] text-gray-500 text-center">{label}</label>
                            <input defaultValue={h[field]||''} onChange={(e)=>updateHome4G(line.id,field,e.target.value,h)}
                              className={`bg-black border border-gray-800 rounded-lg p-2 text-[11px] ${cls} outline-none focus:border-[#ca8a04] text-center w-full`} />
                          </div>
                        ))}
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-gray-500 text-center">حالة الدفع</label>
                          <select value={h.paymentStatus} onChange={(e)=>updateHome4G(line.id,'paymentStatus',e.target.value,h)}
                            className={`bg-black border border-gray-800 rounded-lg p-2 text-[11px] outline-none focus:border-[#ca8a04] text-center font-bold w-full ${h.paymentStatus==='مدفوع'?'text-green-500':h.paymentStatus==='جزئي'?'text-yellow-400':'text-red-400'}`}>
                            <option value="غير مدفوع">غير مدفوع</option>
                            <option value="مدفوع">مدفوع</option>
                            <option value="جزئي">جزئي</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-gray-500 text-center">المبلغ المدفوع</label>
                          <input type="number" defaultValue={h.paidAmount} onChange={(e)=>updateHome4G(line.id,'paidAmount',e.target.value,h)}
                            className="bg-black border border-gray-800 rounded-lg p-2 text-[11px] text-green-400 outline-none focus:border-[#ca8a04] text-center w-full" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-gray-500 text-center">التكلفة</label>
                          <input type="number" defaultValue={h.baseCost} onChange={(e)=>updateHome4G(line.id,'baseCost',e.target.value,h)}
                            className="bg-black border border-gray-800 rounded-lg p-2 text-[11px] text-orange-400 outline-none focus:border-[#ca8a04] text-center w-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Expanded: Normal Line ── */}
                {isOpen && !isH4G && (
                  <div className="p-3 sm:p-6 border-t border-gray-800 bg-[#0d0d0d]">

                    {/* Line meta fields */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 sm:gap-3 md:gap-4 mb-5 sm:mb-8 bg-[#161616] p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-800">
                      {[
                        { l:'الاسم',           k:'ownerName',      t:'text' },
                        { l:'الرقم',           k:'masterPhone',    t:'text' },
                        { l:'تاريخ التفعيل',  k:'activationDate', t:'text' },
                        { l:'إجمالي الجيجا',  k:'totalGB',        t:'number' },
                        { l:'إجمالي الدقائق', k:'totalMins',      t:'number' },
                        { l:'التكلفة',         k:'baseCost',       t:'number' },
                      ].map(({ l, k, t }) => (
                        <div key={k} className="flex flex-col gap-1 sm:gap-2">
                          <label className="text-[10px] sm:text-[11px] font-bold text-gray-500 px-1">{l}</label>
                          <input type={t} placeholder={k==='activationDate'?'مثال: 1/4':''} defaultValue={line[k]||''}
                            onChange={(e)=>updateMasterLine(line.id,k,e.target.value)}
                            className="bg-black border border-gray-800 rounded-lg p-2 sm:p-3 text-xs sm:text-sm text-white outline-none focus:border-[#ca8a04] transition-colors w-full" />
                        </div>
                      ))}
                      <div className="flex flex-col gap-1 sm:gap-2">
                        <label className="text-[10px] sm:text-[11px] font-bold text-gray-500 px-1">الفاتورة</label>
                        <button onClick={(e)=>toggleField(e,line.id,'billPaid',line.billPaid)}
                          className={`rounded-lg p-2 sm:p-3 text-xs sm:text-sm font-bold border-2 transition-all h-full min-h-[40px] ${line.billPaid?'border-green-600 bg-green-900/40 text-green-400':'border-red-900 bg-red-900/20 text-red-400'}`}>
                          {line.billPaid?'مدفوعة ✓':'غير مدفوعة ✗'}
                        </button>
                      </div>
                    </div>

                    {/* Subscribers heading with seats summary */}
                    <div className="flex items-center justify-between mb-3 px-1">
                      <p className="text-xs font-bold text-gray-400">المشتركين ({MAX_SUBS} أماكن)</p>
                      <SeatsIndicator subscribers={line.subscribers} compact={false} />
                    </div>

                    {/* Subscribers rows */}
                    <div className="space-y-2 sm:space-y-3 overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
                      {Array.from({length: MAX_SUBS}).map((_,index) => {
                        const sub      = (line.subscribers||[])[index] || makeSub();
                        const isFilled = !!(sub.name || sub.phone || sub.gb > 0);
                        const totalMB  = Number(sub.gb||0)*1024;
                        const remainMB = totalMB - Number(sub.sentMB||0);
                        const debt     = Number(sub.price||0) - Number(sub.paidAmount||0);
                        const isPaid   = debt <= 0;

                        return (
                          <div key={index}
                            className={`grid gap-1.5 sm:gap-2 items-center p-2 sm:p-3 rounded-xl sm:rounded-2xl border transition-all min-w-[700px] sm:min-w-[900px]
                              ${isFilled
                                ? 'bg-[#111] border-gray-700 hover:border-gray-600'
                                : 'bg-[#0d0d0d] border-dashed border-gray-800 opacity-60 hover:opacity-80'
                              }`}
                            style={{ gridTemplateColumns: 'auto 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr auto' }}
                          >
                            {/* Seat number badge */}
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0 ${isFilled ? 'bg-green-900/60 text-green-400 border border-green-700' : 'bg-gray-900 text-gray-600 border border-gray-800'}`}>
                              {index + 1}
                            </div>

                            <SubField label="الاسم">
                              <input defaultValue={sub.name} onChange={(e)=>updateSub(line.id,index,'name',e.target.value,line.subscribers,line.network)} className={`bg-black border border-gray-800 rounded-lg p-1.5 sm:p-2 text-[11px] sm:text-[12px] outline-none w-full ${isFilled ? 'text-white focus:border-[#ca8a04]' : 'text-gray-600 focus:border-gray-600 placeholder-gray-700'}`} placeholder="الاسم" />
                            </SubField>

                            <SubField label="الرقم">
                              <input defaultValue={sub.phone} onChange={(e)=>updateSub(line.id,index,'phone',e.target.value,line.subscribers,line.network)} className="bg-black border border-gray-800 rounded-lg p-1.5 sm:p-2 text-[11px] sm:text-[12px] text-white outline-none focus:border-[#ca8a04] w-full" placeholder="الرقم" />
                            </SubField>

                            <SubField label="باقة GB">
                              <GbInput
                                defaultValue={sub.gb || ''}
                                network={line.network}
                                listId={`gb-list-${line.id}-${index}`}
                                onChange={(e) => updateSub(line.id, index, 'gb', e.target.value, line.subscribers, line.network)}
                              />
                            </SubField>

                            <SubField label="الدقائق">
                              <input type="number" defaultValue={sub.mins} onChange={(e)=>updateSub(line.id,index,'mins',e.target.value,line.subscribers,line.network)} className="bg-black border border-gray-800 rounded-lg p-1.5 sm:p-2 text-[11px] sm:text-[12px] text-white outline-none focus:border-[#ca8a04] w-full" />
                            </SubField>

                            <SubField label="مُرسل MB">
                              <input type="number" defaultValue={sub.sentMB} onChange={(e)=>updateSub(line.id,index,'sentMB',e.target.value,line.subscribers,line.network)} className="bg-black border border-gray-800 rounded-lg p-1.5 sm:p-2 text-[11px] sm:text-[12px] text-white outline-none focus:border-[#ca8a04] w-full" />
                            </SubField>

                            <SubField label="متبقي MB">
                              <span className={`text-[11px] sm:text-[12px] font-bold p-1.5 sm:p-2 block text-center rounded-lg ${remainMB<0?'text-red-500 bg-red-900/10':'text-green-500 bg-green-900/10'}`}>{remainMB}</span>
                            </SubField>

                            <SubField label="السعر">
                              <input type="number" defaultValue={sub.price} onChange={(e)=>updateSub(line.id,index,'price',e.target.value,line.subscribers,line.network)} className="bg-black border border-gray-800 rounded-lg p-1.5 sm:p-2 text-[11px] sm:text-[12px] text-white outline-none focus:border-[#ca8a04] w-full" />
                            </SubField>

                            <SubField label="المدفوع">
                              <input type="number" defaultValue={sub.paidAmount} onChange={(e)=>updateSub(line.id,index,'paidAmount',e.target.value,line.subscribers,line.network)} className="bg-black border border-gray-800 rounded-lg p-1.5 sm:p-2 text-[11px] sm:text-[12px] text-white outline-none focus:border-[#ca8a04] w-full" />
                            </SubField>

                            <button onClick={()=>handleClearDebt(line.id,index,line.subscribers,sub.price)}
                              className={`text-[9px] sm:text-[10px] font-bold mt-3 sm:mt-4 h-7 sm:h-8 rounded-lg transition-all px-1 sm:px-1.5 whitespace-nowrap ${isFilled ? (isPaid?'text-green-500 bg-green-500/10 border border-green-900':'text-red-500 bg-red-500/10 border border-red-900 hover:bg-red-500/20') : 'text-gray-700 bg-gray-900/20 border border-gray-800 cursor-default'}`}>
                              {!isFilled ? '—' : isPaid ? 'خالص ✓' : `باقي ${debt}`}
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Seats summary footer */}
                    <div className="mt-3 sm:mt-4 flex items-center justify-between bg-black/30 rounded-xl px-3 sm:px-4 py-2 border border-gray-800">
                      {(() => {
                        const { usedSeats, freeSeats } = getSeatsInfo(line.subscribers);
                        return (
                          <>
                            <span className="text-[10px] sm:text-xs text-gray-500">
                              <span className="text-green-400 font-bold">{usedSeats}</span> مشترك &nbsp;·&nbsp;
                              <span className={`font-bold ${freeSeats === 0 ? 'text-red-400' : freeSeats === 1 ? 'text-yellow-400' : 'text-gray-400'}`}>{freeSeats}</span> مكان فاضي
                            </span>
                            <div className="flex gap-1">
                              {Array.from({ length: MAX_SUBS }).map((_, i) => {
                                const s = (line.subscribers||[])[i];
                                const filled = !!(s && (s.name || s.phone || s.gb > 0));
                                return (
                                  <div key={i} className={`rounded-full transition-all ${filled ? 'w-2.5 h-2.5 bg-green-500' : 'w-2 h-2 bg-gray-700'}`} />
                                );
                              })}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════
          قسم "العملاء اللي عليهم فلوس"
          ══════════════════════════════ */}
      {!isHome4G && !abroadMode && (
        <div className="max-w-7xl mx-auto mt-8 sm:mt-10">

          <button
            onClick={() => setShowSubsList(v => !v)}
            className={`w-full flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl border-2 transition-all ${netMeta?.border} ${netMeta?.bg} hover:opacity-90`}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-xl sm:text-2xl">💸</span>
              <div className="text-right">
                <p className={`font-black text-xs sm:text-base ${netMeta?.color}`}>
                  العملاء اللي عليهم فلوس — {netMeta?.label} سايكل {activeCycle}
                </p>
                <p className="text-[9px] sm:text-[11px] text-gray-500 mt-0.5">
                  {countAll} عميل &nbsp;·&nbsp;
                  <span className="text-red-400 font-bold">{countFull} دين كامل</span>
                  &nbsp;·&nbsp;
                  <span className="text-yellow-400 font-bold">{countPartial} جزء</span>
                  &nbsp;·&nbsp; <span className="text-red-400 font-bold">{subsStats.totalDebt} ج</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden lg:flex gap-2">
                <span className="bg-black/50 border border-gray-800 text-gray-300 text-[10px] font-bold px-2 py-1 rounded-full">💸 {countAll}</span>
                <span className="bg-red-900/30 border border-red-900 text-red-400 text-[10px] font-bold px-2 py-1 rounded-full">🔴 {countFull}</span>
                <span className="bg-yellow-900/30 border border-yellow-700 text-yellow-400 text-[10px] font-bold px-2 py-1 rounded-full">🟡 {countPartial}</span>
              </div>
              <span className={`text-base sm:text-lg transition-transform duration-300 text-gray-400 ${showSubsList?'rotate-180':''}`}>▼</span>
            </div>
          </button>

          {showSubsList && (
            <div className="mt-2">
              <div className="flex gap-1.5 sm:gap-2 px-3 sm:px-4 pt-3 sm:pt-4 pb-2 sm:pb-3 bg-[#111] rounded-t-2xl border border-b-0 border-gray-800 flex-wrap">
                {[
                  { key:'all',     label:'كل الديون', icon:'💸', count:countAll,    active:'border-[#ca8a04] bg-[#ca8a04]/15 text-[#ca8a04]',         badge:'bg-[#ca8a04] text-black' },
                  { key:'full',    label:'دين كامل',  icon:'🔴', count:countFull,   active:'border-red-600 bg-red-900/20 text-red-400',                 badge:'bg-red-600 text-white' },
                  { key:'partial', label:'دفع جزء',   icon:'🟡', count:countPartial,active:'border-yellow-600 bg-yellow-900/20 text-yellow-400',        badge:'bg-yellow-500 text-black' },
                ].map(f => (
                  <button key={f.key} onClick={() => setSubsFilter(f.key)}
                    className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-[12px] font-bold border-2 transition-all ${subsFilter===f.key?f.active:'border-gray-800 text-gray-500 hover:border-gray-600 hover:text-gray-400'}`}>
                    <span>{f.icon}</span>
                    <span>{f.label}</span>
                    <span className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full font-black ${subsFilter===f.key?f.badge:'bg-gray-800 text-gray-400'}`}>{f.count}</span>
                  </button>
                ))}
              </div>

              <div className="bg-[#111] border border-gray-800 rounded-b-2xl overflow-hidden">
                {filteredSubs.length === 0 ? (
                  <div className="text-center text-gray-600 py-12 sm:py-16 text-sm">
                    {searchTerm ? 'لا توجد نتائج للبحث'
                      : subsFilter==='full' ? 'لا يوجد عملاء عليهم دين كامل 🎉'
                      : subsFilter==='partial' ? 'لا يوجد عملاء دفعوا جزء من الدين'
                      : 'لا يوجد عملاء عليهم ديون 🎉'}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm min-w-[640px] sm:min-w-[720px]">
                      <thead>
                        <tr className="border-b border-gray-800 bg-black/50">
                          {['#','الاسم','الرقم','خط صاحبه','رقم الخط','الباقة','السعر','المدفوع','الدين',''].map((h,i) => (
                            <th key={i} className="px-2 sm:px-3 py-2 sm:py-3 text-[9px] sm:text-[10px] text-gray-500 font-bold text-center whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSubs.map((sub, i) => {
                          const isPartialPay = sub.paidAmount > 0 && sub.debt > 0;
                          return (
                            <tr key={`${sub.lineId}-${sub.subIndex}`}
                              className={`border-b border-gray-900 transition-colors ${isPartialPay?'hover:bg-yellow-900/5':'hover:bg-red-900/5'}`}>
                              <td className="px-2 sm:px-3 py-2 sm:py-2.5 text-center text-gray-600 text-[10px]">{i+1}</td>
                              <td className="px-2 sm:px-3 py-2 sm:py-2.5 text-center font-bold text-white text-[11px]">{sub.name||<span className="text-gray-700">—</span>}</td>
                              <td className="px-2 sm:px-3 py-2 sm:py-2.5 text-center text-gray-400 text-[11px]">{sub.phone||'—'}</td>
                              <td className="px-2 sm:px-3 py-2 sm:py-2.5 text-center">
                                <span className={`text-[10px] font-bold px-1.5 py-1 rounded-lg ${netMeta?.bg} ${netMeta?.color} border ${netMeta?.border}`}>{sub.lineOwner}</span>
                              </td>
                              <td className="px-2 sm:px-3 py-2 sm:py-2.5 text-center text-gray-600 text-[10px]">{sub.masterPhone||'—'}</td>
                              <td className="px-2 sm:px-3 py-2 sm:py-2.5 text-center text-blue-400 font-bold text-[11px]">{sub.gb>0?`${sub.gb} GB`:'—'}</td>
                              <td className="px-2 sm:px-3 py-2 sm:py-2.5 text-center text-gray-300 text-[11px]">{sub.price>0?`${sub.price} ج`:'—'}</td>
                              <td className="px-2 sm:px-3 py-2 sm:py-2.5 text-center text-[11px]">
                                {sub.paidAmount>0?<span className="text-yellow-400 font-bold">{sub.paidAmount} ج</span>:<span className="text-gray-700">—</span>}
                              </td>
                              <td className="px-2 sm:px-3 py-2 sm:py-2.5 text-center">
                                <span className={`font-black text-[12px] ${isPartialPay?'text-yellow-400':'text-red-400'}`}>{sub.debt} ج</span>
                              </td>
                              <td className="px-2 sm:px-3 py-2 sm:py-2.5 text-center">
                                <button onClick={()=>handleClearDebt(sub.lineId,sub.subIndex,sub.subscribers,sub.price)}
                                  className="text-[9px] sm:text-[10px] font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-all border text-red-400 bg-red-500/10 border-red-900 hover:bg-red-500/20 hover:text-red-300">
                                  خلّص ✓
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-gray-700 bg-black/30">
                          <td colSpan={6} className="px-3 sm:px-4 py-2 sm:py-3 text-right text-[10px] sm:text-[11px] text-gray-500 font-bold">الإجمالي ({filteredSubs.length} عميل)</td>
                          <td className="px-2 sm:px-3 py-2 sm:py-3 text-center text-gray-200 font-black text-[11px] sm:text-[12px]">{filteredSubsStats.totalPrice} ج</td>
                          <td className="px-2 sm:px-3 py-2 sm:py-3 text-center text-yellow-400 font-black text-[11px] sm:text-[12px]">{filteredSubsStats.totalPaid} ج</td>
                          <td className="px-2 sm:px-3 py-2 sm:py-3 text-center text-red-400 font-black text-[11px] sm:text-[12px]">{filteredSubsStats.totalDebt} ج</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom Buttons */}
      <div className="max-w-7xl mx-auto mt-8 sm:mt-10 pb-6 sm:pb-8 flex justify-end gap-2 sm:gap-3">
        <button onClick={exportToExcel} title="تصدير Excel منسّق" className="bg-green-600 text-white w-10 h-10 sm:w-12 sm:h-12 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all text-sm sm:text-base">📥</button>
        <input type="file" id="importFile" className="hidden" onChange={importFromExcel} accept=".xlsx" />
        <label htmlFor="importFile" title="استيراد Excel" className="bg-blue-600 text-white w-10 h-10 sm:w-12 sm:h-12 rounded-full shadow-2xl flex items-center justify-center cursor-pointer hover:scale-110 transition-all text-sm sm:text-base">📤</label>
        <button
          onClick={abroadMode ? addNewAbroadClient : addNewLine}
          title={abroadMode ? 'إضافة عميل خارج جديد' : 'إضافة خط جديد'}
          className="bg-[#ca8a04] text-black w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-2xl text-2xl sm:text-3xl font-bold hover:scale-110 transition-all flex items-center justify-center">
          +
        </button>
      </div>
    </div>
  );
}

// ── GbInput ──────────────────────────────────────────────────────
function GbInput({ defaultValue, network, onChange, listId }) {
  const knownGbs = Object.keys(PRICE_TABLE[network] || {});
  return (
    <div className="relative w-full">
      <input
        list={listId}
        defaultValue={defaultValue || ''}
        onChange={onChange}
        placeholder="GB"
        className="bg-black border border-gray-800 rounded-lg p-1.5 sm:p-2 text-[11px] sm:text-[12px] text-blue-400 outline-none focus:border-[#ca8a04] w-full text-center"
      />
      <datalist id={listId}>
        {knownGbs.map(g => (
          <option key={g} value={g}>{g} GB — {PRICE_TABLE[network][g]} ج</option>
        ))}
      </datalist>
    </div>
  );
}

// ── Helper Components ─────────────────────────────────────────────
function StatBox({ label, value, color }) {
  return (
    <div className="bg-black/30 p-1.5 sm:p-2 rounded-lg border border-gray-800 min-w-[65px] sm:min-w-[75px]">
      <p className="text-[7px] sm:text-[8px] text-gray-500">{label}</p>
      <p className={`font-bold text-[11px] sm:text-xs ${color}`}>{value}</p>
    </div>
  );
}

function ToggleBtn({ label, active, onText, offText, onBorder, offBorder, onClick }) {
  return (
    <button onClick={onClick} className={`p-1.5 sm:p-2 rounded-lg border min-w-[65px] sm:min-w-[75px] transition-all ${active?onBorder:offBorder}`}>
      <p className="text-[7px] sm:text-[8px] text-gray-500">{label}</p>
      <p className="font-bold text-[10px] sm:text-xs">{active?onText:offText}</p>
    </button>
  );
}

function SubField({ label, children, hidden = false }) {
  return (
    <div className={`flex flex-col gap-0.5 sm:gap-1 ${hidden?'hidden md:flex':''}`}>
      <label className="text-[8px] sm:text-[9px] text-gray-500">{label}</label>
      {children}
    </div>
  );
}
