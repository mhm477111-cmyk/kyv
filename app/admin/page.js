'use client';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebaseConfig';
import { collection, getDocs, doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

// حماية الكود من خطأ الـ JSON أثناء عملية الـ Build
const firebaseConfigRaw = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_FIREBASE_CONFIG : null;
const firebaseConfig = firebaseConfigRaw ? JSON.parse(firebaseConfigRaw) : {};

const secondaryApp = getApps().length > 1 ? getApp("Secondary") : initializeApp(firebaseConfig, "Secondary");
const secondaryAuth = getAuth(secondaryApp);

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({ name: '', phone: '', password: '', planName: '' });
  const [newPasswordValue, setNewPasswordValue] = useState("");

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    const querySnapshot = await getDocs(collection(db, "users"));
    setUsers(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const email = `${newUser.phone}@mocontrol.com`;
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, newUser.password);
      await setDoc(doc(db, "users", userCredential.user.uid), {
        ...newUser, email, active: true, isPaid: false, price: 0, debt: 0, durationMonths: 0, startDate: "", endDate: ""
      });
      await secondaryAuth.signOut();
      alert("✅ تم إضافة العميل");
      setIsAddModalOpen(false);
      setNewUser({ name: '', phone: '', password: '', planName: '' });
      fetchUsers();
    } catch (err) { alert("❌ خطأ: " + err.message); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const updatedData = {
        name: editingUser.name || "",
        phone: editingUser.phone || "",
        password: newPasswordValue.length >= 6 ? newPasswordValue : (editingUser.password || ""),
        planName: editingUser.planName || "",
        price: Number(editingUser.price || 0),
        debt: Number(editingUser.debt || 0),
        durationMonths: Number(editingUser.durationMonths || 0),
        startDate: editingUser.startDate || "",
        endDate: editingUser.endDate || "",
        isPaid: !!editingUser.isPaid
      };
      await updateDoc(doc(db, "users", editingUser.id), updatedData);
      alert("💾 تم حفظ التعديلات!");
      setEditingUser(null);
      setNewPasswordValue("");
      fetchUsers();
    } catch (err) { alert("❌ خطأ: " + err.message); }
  };

  return (
    <div className="p-6 md:p-10 bg-black min-h-screen text-white font-sans">
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 border-b border-gray-800 pb-6 gap-4">
        <h1 className="text-3xl font-bold text-yellow-500">لوحة الإدارة - MO CONTROL</h1>
        <input type="text" placeholder="🔍 بحث..." className="w-full md:w-80 p-3 bg-gray-900 border border-gray-700 rounded-xl" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        <button onClick={() => setIsAddModalOpen(true)} className="bg-yellow-600 text-black font-bold py-3 px-6 rounded-2xl">+ إضافة عميل</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.filter(u => u.name?.toLowerCase().includes(searchQuery.toLowerCase())).map(user => (
          <div key={user.id} className="p-6 rounded-3xl bg-gray-900 border border-gray-800">
            <h3 className="font-bold text-xl">{user.name}</h3>
            <p className="text-yellow-600 font-mono mb-4">{user.phone}</p>
            <div className="flex gap-2">
              <button onClick={() => setEditingUser(user)} className="flex-1 bg-blue-600/20 text-blue-400 py-2 rounded-xl">تعديل</button>
              <button onClick={() => updateDoc(doc(db, "users", user.id), {active: !user.active}).then(fetchUsers)} className={`flex-1 py-2 rounded-xl ${user.active ? 'bg-orange-600/20' : 'bg-green-600/20'}`}>
                {user.active ? '🚫 تعطيل' : '✅ تفعيل'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateUser} className="bg-gray-900 p-8 rounded-[2rem] w-full max-w-md border border-gray-800">
            <h2 className="text-2xl font-bold mb-4 text-yellow-500">إضافة عميل</h2>
            <input className="w-full p-3 mb-3 bg-black rounded-xl border" placeholder="الاسم" onChange={e => setNewUser({...newUser, name: e.target.value})} />
            <input className="w-full p-3 mb-3 bg-black rounded-xl border" placeholder="الموبايل" onChange={e => setNewUser({...newUser, phone: e.target.value})} />
            <input className="w-full p-3 mb-3 bg-black rounded-xl border" placeholder="الباسورد" onChange={e => setNewUser({...newUser, password: e.target.value})} />
            <input className="w-full p-3 mb-3 bg-black rounded-xl border" placeholder="الباقة" onChange={e => setNewUser({...newUser, planName: e.target.value})} />
            <div className="flex gap-3 mt-4">
              <button className="flex-1 bg-yellow-600 py-3 rounded-xl font-bold">إضافة</button>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 bg-gray-700 py-3 rounded-xl">إلغاء</button>
            </div>
          </form>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <form onSubmit={handleUpdate} className="bg-gray-900 p-8 rounded-[2rem] w-full max-w-2xl border border-gray-800">
            <h2 className="text-2xl font-bold mb-6 text-yellow-500">تعديل: {editingUser.name}</h2>
            <div className="grid grid-cols-2 gap-4">
              <input className="p-3 bg-black rounded-xl" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} placeholder="الاسم" />
              <input className="p-3 bg-black rounded-xl" value={editingUser.phone} onChange={e => setEditingUser({...editingUser, phone: e.target.value})} placeholder="الموبايل" />
              <input className="p-3 bg-black rounded-xl" value={editingUser.planName || ''} onChange={e => setEditingUser({...editingUser, planName: e.target.value})} placeholder="الباقة" />
              <input type="number" className="p-3 bg-black rounded-xl" value={editingUser.price || ''} onChange={e => setEditingUser({...editingUser, price: e.target.value})} placeholder="السعر" />
              <input type="number" className="p-3 bg-black rounded-xl" value={editingUser.debt || ''} onChange={e => setEditingUser({...editingUser, debt: e.target.value})} placeholder="الديون" />
              <input type="number" className="p-3 bg-black rounded-xl" value={editingUser.durationMonths || ''} onChange={e => setEditingUser({...editingUser, durationMonths: e.target.value})} placeholder="الشهور" />
              <div className="relative"><label className="text-xs text-gray-500">البدء 📅</label><input type="date" className="w-full p-3 bg-black rounded-xl" value={editingUser.startDate || ''} onChange={e => setEditingUser({...editingUser, startDate: e.target.value})} /></div>
              <div className="relative"><label className="text-xs text-gray-500">الانتهاء 📅</label><input type="date" className="w-full p-3 bg-black rounded-xl" value={editingUser.endDate || ''} onChange={e => setEditingUser({...editingUser, endDate: e.target.value})} /></div>
            </div>
            <label className="flex items-center gap-2 mt-4"><input type="checkbox" checked={!!editingUser.isPaid} onChange={e => setEditingUser({...editingUser, isPaid: e.target.checked})} /> تم دفع الرسوم ✅</label>
            <input className="w-full p-3 mt-4 bg-black rounded-xl border border-red-900" placeholder="باسورد جديد (اختياري)" onChange={e => setNewPasswordValue(e.target.value)} />
            <div className="flex gap-3 mt-6">
              <button className="flex-1 bg-green-600 py-3 rounded-xl font-bold">حفظ</button>
              <button type="button" onClick={() => {setEditingUser(null); setNewPasswordValue("");}} className="flex-1 bg-gray-700 py-3 rounded-xl">إلغاء</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
