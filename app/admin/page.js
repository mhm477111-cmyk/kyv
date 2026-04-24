'use client';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebaseConfig';
import { collection, getDocs, doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({ name: '', phone: '', password: '', planName: '' });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    const querySnapshot = await getDocs(collection(db, "users"));
    setUsers(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleCreateUser = async () => {
    if (newUser.phone.length !== 11) return alert("خطأ: الهاتف يجب أن يكون 11 رقماً!");
    try {
      const userRef = doc(collection(db, "users"));
      await setDoc(userRef, { ...newUser, active: true, isPaid: false, debt: 0, price: 0, durationMonths: 0 });
      alert("✅ تم إضافة العميل");
      fetchUsers();
    } catch (err) { alert("❌ خطأ: " + err.message); }
  };

  const toggleStatus = async (user) => {
    await updateDoc(doc(db, "users", user.id), { active: !user.active });
    fetchUsers();
  };

  const handleDelete = async (id) => {
    if (confirm("هل تريد الحذف النهائي؟")) {
      await deleteDoc(doc(db, "users", id));
      fetchUsers();
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    await updateDoc(doc(db, "users", editingUser.id), editingUser);
    alert("💾 تم الحفظ");
    setEditingUser(null);
    fetchUsers();
  };

  return (
    <div className="p-8 bg-black min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-6 text-yellow-500">لوحة الإدارة</h1>
      
      {/* إنشاء عميل */}
      <div className="bg-gray-900 p-4 rounded-xl mb-6 grid gap-2">
        <input placeholder="الاسم" className="p-2 bg-black rounded" onChange={e => setNewUser({...newUser, name: e.target.value})} />
        <input placeholder="رقم الهاتف (11 رقم)" className="p-2 bg-black rounded" onChange={e => setNewUser({...newUser, phone: e.target.value})} />
        <input placeholder="الباسورد" className="p-2 bg-black rounded" onChange={e => setNewUser({...newUser, password: e.target.value})} />
        <button onClick={handleCreateUser} className="bg-yellow-600 p-2 rounded">إضافة</button>
      </div>

      {/* قائمة العملاء */}
      <div className="grid gap-2">
        {users.map(user => (
          <div key={user.id} className="bg-gray-800 p-4 rounded flex justify-between items-center">
            <span>{user.name}</span>
            <div className="flex gap-2">
              <button onClick={() => toggleStatus(user)} className={user.active ? "bg-orange-600 px-2 rounded" : "bg-green-600 px-2 rounded"}>
                {user.active ? "تعطيل" : "تفعيل"}
              </button>
              <button onClick={() => setEditingUser(user)} className="bg-blue-600 px-2 rounded">تعديل</button>
              <button onClick={() => handleDelete(user.id)} className="bg-red-600 px-2 rounded">حذف</button>
            </div>
          </div>
        ))}
      </div>

      {/* مودال التعديل الشامل */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/90 p-4 overflow-y-auto">
          <form onSubmit={handleUpdate} className="bg-gray-900 p-6 rounded-2xl max-w-lg mx-auto">
            <h2 className="mb-4 text-yellow-500">تعديل كامل بيانات {editingUser.name}</h2>
            <div className="grid grid-cols-2 gap-2">
              <input className="bg-black p-2 rounded" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} />
              <input className="bg-black p-2 rounded" value={editingUser.phone} onChange={e => setEditingUser({...editingUser, phone: e.target.value})} />
              <input className="bg-black p-2 rounded" value={editingUser.planName || ''} onChange={e => setEditingUser({...editingUser, planName: e.target.value})} />
              <input className="bg-black p-2 rounded" value={editingUser.price || ''} onChange={e => setEditingUser({...editingUser, price: e.target.value})} />
              <input className="bg-black p-2 rounded" value={editingUser.debt || ''} onChange={e => setEditingUser({...editingUser, debt: e.target.value})} />
              <input className="bg-black p-2 rounded" value={editingUser.startDate || ''} onChange={e => setEditingUser({...editingUser, startDate: e.target.value})} />
              <input className="bg-black p-2 rounded" value={editingUser.endDate || ''} onChange={e => setEditingUser({...editingUser, endDate: e.target.value})} />
              <input className="bg-black p-2 rounded" value={editingUser.durationMonths || ''} onChange={e => setEditingUser({...editingUser, durationMonths: e.target.value})} />
            </div>
            <div className="flex gap-2 mt-4">
              <button type="submit" className="bg-green-600 p-2 flex-1">حفظ</button>
              <button type="button" onClick={() => setEditingUser(null)} className="bg-gray-600 p-2 flex-1">إلغاء</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
