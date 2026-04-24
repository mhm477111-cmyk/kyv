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
    if (newUser.phone.length !== 11) return alert("خطأ: رقم الهاتف يجب أن يكون 11 رقماً!");
    
    try {
      // إنشاء العميل مباشرة في Firestore (بدون Firebase Auth المعقد)
      const userRef = doc(collection(db, "users"));
      await setDoc(userRef, {
        ...newUser,
        active: true,
        isPaid: false,
        debt: 0
      });
      alert("✅ تم إضافة العميل بنجاح");
      fetchUsers();
    } catch (err) { alert("❌ خطأ: " + err.message); }
  };

  const handleDelete = async (id) => {
    if (confirm("هل أنت متأكد من حذف العميل نهائياً؟")) {
      await deleteDoc(doc(db, "users", id));
      alert("🗑️ تم حذف العميل نهائياً");
      fetchUsers();
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const userRef = doc(db, "users", editingUser.id);
    await updateDoc(userRef, editingUser);
    alert("💾 تم تحديث البيانات بنجاح");
    setEditingUser(null);
    fetchUsers();
  };

  return (
    <div className="p-8 bg-black min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-8 text-yellow-500">لوحة التحكم (تحكم كامل)</h1>

      {/* إنشاء عميل */}
      <div className="bg-gray-900 p-6 rounded-2xl mb-8 border border-gray-700">
        <input className="p-3 bg-black rounded-lg w-full mb-2" placeholder="الاسم" onChange={e => setNewUser({...newUser, name: e.target.value})} />
        <input className="p-3 bg-black rounded-lg w-full mb-2" type="number" placeholder="رقم الهاتف (11 رقم)" onChange={e => setNewUser({...newUser, phone: e.target.value})} />
        <input className="p-3 bg-black rounded-lg w-full mb-2" placeholder="الباسورد" onChange={e => setNewUser({...newUser, password: e.target.value})} />
        <button onClick={handleCreateUser} className="bg-yellow-600 w-full py-3 rounded-lg font-bold text-black">إضافة العميل</button>
      </div>

      {/* قائمة العملاء */}
      <div className="grid gap-4">
        {users.map(user => (
          <div key={user.id} className="bg-gray-900 p-4 rounded-xl flex justify-between items-center">
            <span>{user.name} - {user.phone}</span>
            <div className="flex gap-2">
              <button onClick={() => setEditingUser(user)} className="bg-blue-600 px-3 py-1 rounded">تعديل</button>
              <button onClick={() => handleDelete(user.id)} className="bg-red-600 px-3 py-1 rounded">حذف</button>
            </div>
          </div>
        ))}
      </div>

      {/* مودال التعديل */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/90 p-4 flex items-center justify-center">
          <form onSubmit={handleUpdate} className="bg-gray-900 p-6 rounded-2xl w-full max-w-sm">
            <input className="w-full p-2 bg-black mb-2" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} />
            <input className="w-full p-2 bg-black mb-2" value={editingUser.password} placeholder="تغيير الباسورد" onChange={e => setEditingUser({...editingUser, password: e.target.value})} />
            <div className="flex gap-2">
              <button type="submit" className="bg-green-600 p-2 flex-1">حفظ</button>
              <button type="button" onClick={() => setEditingUser(null)} className="bg-gray-600 p-2 flex-1">إلغاء</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
