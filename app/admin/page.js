'use client';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebaseConfig';
import { collection, getDocs, doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const secondaryApp = getApps().length > 1 ? getApp("Secondary") : initializeApp(JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG), "Secondary");
const secondaryAuth = getAuth(secondaryApp);

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

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, "users", editingUser.id), {
        name: editingUser.name || "",
        phone: editingUser.phone || "",
        planName: editingUser.planName || "",
        price: Number(editingUser.price || 0),
        debt: Number(editingUser.debt || 0),
        durationMonths: Number(editingUser.durationMonths || 0),
        startDate: editingUser.startDate || "",
        endDate: editingUser.endDate || "",
        isPaid: !!editingUser.isPaid
      });
      alert("💾 تم حفظ التعديلات!");
      setEditingUser(null);
      fetchUsers();
    } catch (err) { alert("❌ خطأ: " + err.message); }
  };

  return (
    <div className="p-6 bg-black min-h-screen text-white font-sans">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 border-b border-gray-800 pb-4 gap-4">
        <h1 className="text-2xl font-bold text-yellow-500">MO CONTROL</h1>
        <input placeholder="🔍 بحث..." className="w-full md:w-60 p-2 bg-gray-900 border border-gray-700 rounded-lg" onChange={(e) => setSearchQuery(e.target.value)} />
        <button onClick={() => setIsAddModalOpen(true)} className="bg-yellow-600 text-black px-4 py-2 rounded-lg font-bold">+ إضافة عميل</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.filter(u => u.name?.includes(searchQuery)).map(user => (
          <div key={user.id} className="p-4 rounded-2xl bg-gray-900 border border-gray-800">
            <h3 className="font-bold">{user.name}</h3>
            <p className="text-yellow-600 text-sm mb-4">{user.phone}</p>
            <div className="flex gap-2">
              <button onClick={() => setEditingUser(user)} className="flex-1 bg-blue-600/20 text-blue-400 py-1.5 rounded-lg text-sm">تعديل</button>
              <button onClick={() => updateDoc(doc(db, "users", user.id), {active: !user.active}).then(fetchUsers)} className="flex-1 bg-orange-600/20 text-orange-400 py-1.5 rounded-lg text-sm">
                {user.active ? '🚫 تعطيل' : '✅ تفعيل'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* مودال التعديل الصغير والمظبوط */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleUpdate} className="bg-gray-900 p-6 rounded-3xl w-full max-w-md border border-gray-800 shadow-2xl">
            <h2 className="text-lg font-bold mb-4 text-yellow-500">تعديل: {editingUser.name}</h2>
            <div className="grid grid-cols-1 gap-3">
              <input className="p-2 bg-black rounded-lg border border-gray-700" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} placeholder="الاسم" />
              <input className="p-2 bg-black rounded-lg border border-gray-700" value={editingUser.phone} onChange={e => setEditingUser({...editingUser, phone: e.target.value})} placeholder="الموبايل" />
              <input className="p-2 bg-black rounded-lg border border-gray-700" value={editingUser.planName || ''} onChange={e => setEditingUser({...editingUser, planName: e.target.value})} placeholder="اسم الباقة" />
              <input type="number" className="p-2 bg-black rounded-lg border border-gray-700" value={editingUser.price || ''} onChange={e => setEditingUser({...editingUser, price: e.target.value})} placeholder="السعر" />
              <input type="number" className="p-2 bg-black rounded-lg border border-gray-700" value={editingUser.debt || ''} onChange={e => setEditingUser({...editingUser, debt: e.target.value})} placeholder="الديون" />
              
              <div className="relative">
                <label className="text-[10px] text-gray-500 mr-2">تاريخ البدء 📅</label>
                <input type="date" className="w-full p-2 bg-black rounded-lg border border-gray-700" value={editingUser.startDate || ''} onChange={e => setEditingUser({...editingUser, startDate: e.target.value})} />
              </div>
              <div className="relative">
                <label className="text-[10px] text-gray-500 mr-2">تاريخ الانتهاء 📅</label>
                <input type="date" className="w-full p-2 bg-black rounded-lg border border-gray-700" value={editingUser.endDate || ''} onChange={e => setEditingUser({...editingUser, endDate: e.target.value})} />
              </div>
            </div>
            <label className="flex items-center gap-2 mt-4"><input type="checkbox" checked={!!editingUser.isPaid} onChange={e => setEditingUser({...editingUser, isPaid: e.target.checked})} /> دفع الرسوم ✅</label>
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
