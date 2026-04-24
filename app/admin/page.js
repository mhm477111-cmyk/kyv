'use client';
import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebaseConfig';
import { collection, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({ name: '', phone: '', email: '', password: '', planName: '' });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    const querySnapshot = await getDocs(collection(db, "users"));
    setUsers(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleCreateUser = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, newUser.email, newUser.password);
      await setDoc(doc(db, "users", userCredential.user.uid), {
        ...newUser,
        active: true,
        isPaid: false,
        price: 0,
        debt: 0,
        durationMonths: 0
      });
      alert("تم إنشاء العميل بنجاح!");
      fetchUsers();
    } catch (err) { alert("خطأ في الإنشاء: " + err.message); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const userRef = doc(db, "users", editingUser.id);
    await updateDoc(userRef, {
      ...editingUser,
      price: Number(editingUser.price),
      debt: Number(editingUser.debt),
      durationMonths: Number(editingUser.durationMonths)
    });
    alert("تم تحديث البيانات بنجاح!");
    setEditingUser(null);
    fetchUsers();
  };

  const toggleUserStatus = async (user) => {
    await updateDoc(doc(db, "users", user.id), { active: !user.active });
    fetchUsers();
  };

  return (
    <div className="p-8 bg-black min-h-screen text-white font-sans">
      <h1 className="text-3xl font-bold mb-8 text-yellow-500">لوحة تحكم الأدمن - MO CONTROL</h1>

      {/* قسم إضافة عميل */}
      <div className="bg-gray-900 p-6 rounded-2xl mb-8 border border-gray-700">
        <h2 className="text-xl mb-4 text-yellow-500 font-bold">إضافة عميل جديد</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input placeholder="الاسم" className="p-3 rounded-lg bg-black border border-gray-700" onChange={e => setNewUser({...newUser, name: e.target.value})} />
          <input placeholder="الهاتف" className="p-3 rounded-lg bg-black border border-gray-700" onChange={e => setNewUser({...newUser, phone: e.target.value})} />
          <input placeholder="الإيميل" className="p-3 rounded-lg bg-black border border-gray-700" onChange={e => setNewUser({...newUser, email: e.target.value})} />
          <input type="password" placeholder="كلمة المرور" className="p-3 rounded-lg bg-black border border-gray-700" onChange={e => setNewUser({...newUser, password: e.target.value})} />
          <input placeholder="الباقة" className="p-3 rounded-lg bg-black border border-gray-700" onChange={e => setNewUser({...newUser, planName: e.target.value})} />
          <button onClick={handleCreateUser} className="bg-yellow-600 text-black font-bold p-3 rounded-lg hover:bg-yellow-500">إنشاء العميل</button>
        </div>
      </div>

      {/* قائمة العملاء */}
      <div className="grid gap-4">
        {users.map(user => (
          <div key={user.id} className={`p-5 rounded-2xl border flex justify-between items-center ${user.active ? 'border-gray-800' : 'border-red-900 bg-red-900/10'}`}>
            <p className="font-bold">{user.name} {!user.active && <span className="text-red-500 text-xs">(معطل)</span>}</p>
            <div className="flex gap-2">
              <button onClick={() => toggleUserStatus(user)} className="bg-gray-700 px-4 py-2 rounded-xl">{user.active ? "تعطيل" : "استرجاع"}</button>
              <button onClick={() => setEditingUser(user)} className="bg-yellow-600 px-4 py-2 rounded-xl text-black font-bold">تعديل كامل</button>
            </div>
          </div>
        ))}
      </div>

      {/* مودال التعديل الشامل */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <form onSubmit={handleUpdate} className="bg-gray-900 p-8 rounded-3xl w-full max-w-lg border border-yellow-600">
            <h2 className="text-2xl mb-4 text-yellow-500 font-bold">تعديل: {editingUser.name}</h2>
            <div className="grid grid-cols-2 gap-3">
              <input className="p-3 bg-black rounded-xl border" placeholder="الاسم" value={editingUser.name || ''} onChange={e => setEditingUser({...editingUser, name: e.target.value})} />
              <input className="p-3 bg-black rounded-xl border" placeholder="الهاتف" value={editingUser.phone || ''} onChange={e => setEditingUser({...editingUser, phone: e.target.value})} />
              <input className="p-3 bg-black rounded-xl border" placeholder="الباقة" value={editingUser.planName || ''} onChange={e => setEditingUser({...editingUser, planName: e.target.value})} />
              <input className="p-3 bg-black rounded-xl border" type="number" placeholder="السعر" value={editingUser.price || ''} onChange={e => setEditingUser({...editingUser, price: e.target.value})} />
              <input className="p-3 bg-black rounded-xl border" type="number" placeholder="الديون" value={editingUser.debt || ''} onChange={e => setEditingUser({...editingUser, debt: e.target.value})} />
              <input className="p-3 bg-black rounded-xl border" type="number" placeholder="عدد الشهور" value={editingUser.durationMonths || ''} onChange={e => setEditingUser({...editingUser, durationMonths: e.target.value})} />
              <input className="p-3 bg-black rounded-xl border" type="date" value={editingUser.startDate || ''} onChange={e => setEditingUser({...editingUser, startDate: e.target.value})} />
              <input className="p-3 bg-black rounded-xl border" type="date" value={editingUser.endDate || ''} onChange={e => setEditingUser({...editingUser, endDate: e.target.value})} />
            </div>
            
            <input 
              placeholder="تغيير كلمة المرور (أدخل الجديدة)" 
              className="w-full mt-4 p-3 bg-black rounded-xl border border-blue-600"
              onChange={e => setEditingUser({...editingUser, newPassword: e.target.value})}
            />
            
            <div className="flex gap-3 mt-6">
              <button type="submit" className="flex-1 bg-yellow-600 py-3 rounded-xl text-black font-bold">حفظ كل البيانات</button>
              <button type="button" onClick={() => setEditingUser(null)} className="flex-1 bg-gray-700 py-3 rounded-xl">إغلاق</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
