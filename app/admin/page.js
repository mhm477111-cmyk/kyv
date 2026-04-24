'use client';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebaseConfig';
import { collection, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

// تهيئة Firebase الثانوي (مع حماية لضمان عمل البناء)
let secondaryAuth;
try {
  const configRaw = process.env.NEXT_PUBLIC_FIREBASE_CONFIG;
  if (configRaw) {
    const firebaseConfig = JSON.parse(configRaw);
    const secondaryApp = getApps().length > 1 ? getApp("Secondary") : initializeApp(firebaseConfig, "Secondary");
    secondaryAuth = getAuth(secondaryApp);
  }
} catch (e) { console.error("Error initializing secondary app:", e); }

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({ name: '', phone: '', password: '', planName: '' });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    const querySnapshot = await getDocs(collection(db, "users"));
    setUsers(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!secondaryAuth) { alert("خطأ في الاتصال"); return; }
    try {
      const email = `${newUser.phone}@mocontrol.com`;
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, newUser.password);
      await setDoc(doc(db, "users", userCredential.user.uid), {
        ...newUser, email, active: true, isPaid: false, price: 0, debt: 0, durationMonths: 0, startDate: "", endDate: ""
      });
      alert("✅ تم إضافة العميل");
      setIsAddModalOpen(false);
      setNewUser({ name: '', phone: '', password: '', planName: '' });
      fetchUsers();
    } catch (err) { alert("❌ خطأ: " + err.message); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    await updateDoc(doc(db, "users", editingUser.id), {
      name: editingUser.name, phone: editingUser.phone, planName: editingUser.planName,
      price: Number(editingUser.price), debt: Number(editingUser.debt),
      durationMonths: Number(editingUser.durationMonths),
      startDate: editingUser.startDate, endDate: editingUser.endDate,
      isPaid: !!editingUser.isPaid
    });
    alert("💾 تم الحفظ!");
    setEditingUser(null);
    fetchUsers();
  };

  return (
    <div className="p-6 bg-black min-h-screen text-white font-sans">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-yellow-500">لوحة الإدارة</h1>
        <button onClick={() => setIsAddModalOpen(true)} className="bg-yellow-600 px-4 py-2 rounded-lg font-bold">+ عميل جديد</button>
      </div>

      {/* عرض العملاء */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {users.filter(u => u.name?.includes(searchQuery)).map(user => (
          <div key={user.id} className="p-4 bg-gray-900 rounded-2xl border border-gray-800">
            <h3 className="font-bold">{user.name}</h3>
            <p className="text-yellow-600 text-sm mb-4">{user.phone}</p>
            <button onClick={() => setEditingUser(user)} className="w-full bg-blue-600/20 text-blue-400 py-2 rounded-lg">تعديل البيانات</button>
          </div>
        ))}
      </div>

      {/* مودال إضافة عميل */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateUser} className="bg-gray-900 p-6 rounded-3xl w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4 text-yellow-500">إضافة عميل جديد</h2>
            <input className="w-full p-2 mb-2 bg-black rounded-lg border" placeholder="الاسم" onChange={e => setNewUser({...newUser, name: e.target.value})} />
            <input className="w-full p-2 mb-2 bg-black rounded-lg border" placeholder="الموبايل" onChange={e => setNewUser({...newUser, phone: e.target.value})} />
            <input className="w-full p-2 mb-2 bg-black rounded-lg border" placeholder="كلمة المرور" onChange={e => setNewUser({...newUser, password: e.target.value})} />
            <input className="w-full p-2 mb-2 bg-black rounded-lg border" placeholder="اسم الباقة" onChange={e => setNewUser({...newUser, planName: e.target.value})} />
            <button className="w-full bg-yellow-600 py-2 mt-2 rounded-lg font-bold">إضافة</button>
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="w-full bg-gray-700 py-2 mt-2 rounded-lg">إلغاء</button>
          </form>
        </div>
      )}

      {/* مودال التعديل مع توضيح التواريخ */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <form onSubmit={handleUpdate} className="bg-gray-900 p-6 rounded-3xl w-full max-w-md border border-gray-800">
            <h2 className="text-lg font-bold mb-4 text-yellow-500">تعديل: {editingUser.name}</h2>
            <div className="space-y-3">
              <input className="w-full p-2 bg-black rounded-lg border" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} placeholder="الاسم" />
              <input className="w-full p-2 bg-black rounded-lg border" value={editingUser.phone} onChange={e => setEditingUser({...editingUser, phone: e.target.value})} placeholder="الموبايل" />
              
              {/* توضيح التواريخ */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-400 block">تاريخ التفعيل (البدء) 📅</label>
                  <input type="date" className="w-full p-2 bg-black rounded-lg border" value={editingUser.startDate || ''} onChange={e => setEditingUser({...editingUser, startDate: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block">تاريخ الانتهاء 📅</label>
                  <input type="date" className="w-full p-2 bg-black rounded-lg border" value={editingUser.endDate || ''} onChange={e => setEditingUser({...editingUser, endDate: e.target.value})} />
                </div>
              </div>
            </div>
            <label className="flex items-center gap-2 mt-4"><input type="checkbox" checked={!!editingUser.isPaid} onChange={e => setEditingUser({...editingUser, isPaid: e.target.checked})} /> تم دفع الرسوم ✅</label>
            <div className="flex gap-3 mt-6">
              <button className="flex-1 bg-green-600 py-2 rounded-lg font-bold">حفظ</button>
              <button type="button" onClick={() => setEditingUser(null)} className="flex-1 bg-gray-700 py-2 rounded-lg">إلغاء</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
