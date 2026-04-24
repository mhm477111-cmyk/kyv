'use client';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebaseConfig';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const querySnapshot = await getDocs(collection(db, "users"));
      setUsers(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchUsers();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    const userRef = doc(db, "users", editingUser.id);
    await updateDoc(userRef, editingUser);
    alert("تم التحديث بنجاح!");
    setEditingUser(null);
    // تحديث القائمة بعد التعديل
    window.location.reload(); 
  };

  return (
    <div className="p-8 bg-gray-950 min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-6">لوحة تحكم الإدارة - MO CONTROL</h1>

      {/* جدول العملاء */}
      <div className="grid gap-4">
        {users.map(user => (
          <div key={user.id} className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex justify-between items-center">
            <div>
              <p className="font-bold text-lg">{user.name}</p>
              <p className="text-gray-400 text-sm">الباقة: {user.planName} | {user.paid ? "تم الدفع" : "لم يتم الدفع"}</p>
            </div>
            <button onClick={() => setEditingUser(user)} className="bg-blue-600 px-4 py-2 rounded-lg">تعديل</button>
          </div>
        ))}
      </div>

      {/* فورم التعديل */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4">
          <form onSubmit={handleUpdate} className="bg-gray-900 p-6 rounded-2xl w-full max-w-md border border-gray-700">
            <h2 className="text-xl mb-4 font-bold">تعديل بيانات {editingUser.name}</h2>
            
            <input className="w-full bg-gray-800 p-2 mb-2 rounded" placeholder="الاسم" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} />
            <input className="w-full bg-gray-800 p-2 mb-2 rounded" placeholder="اسم الباقة" value={editingUser.planName} onChange={e => setEditingUser({...editingUser, planName: e.target.value})} />
            <input className="w-full bg-gray-800 p-2 mb-2 rounded" type="date" value={editingUser.nextRenewal} onChange={e => setEditingUser({...editingUser, nextRenewal: e.target.value})} />
            
            <label className="flex items-center gap-2 mb-4">
              <input type="checkbox" checked={editingUser.paid} onChange={e => setEditingUser({...editingUser, paid: e.target.checked})} />
              تم الدفع
            </label>

            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-green-600 p-2 rounded">حفظ</button>
              <button type="button" onClick={() => setEditingUser(null)} className="flex-1 bg-gray-600 p-2 rounded">إلغاء</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
