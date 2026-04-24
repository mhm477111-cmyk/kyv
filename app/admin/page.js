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
    window.location.reload(); 
  };

  return (
    <div className="p-8 bg-gray-950 min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-6">لوحة تحكم الإدارة - MO CONTROL</h1>

      <div className="grid gap-4">
        {users.map(user => (
          <div key={user.id} className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex justify-between items-center">
            <div>
              <p className="font-bold text-lg">{user.name}</p>
              {/* هنا ضفنا رقم الموبايل يظهر في القائمة */}
              <p className="text-blue-400 font-mono text-sm">{user.phone}</p>
              <p className="text-gray-400 text-xs">الباقة: {user.planName}</p>
            </div>
            <button 
              onClick={() => setEditingUser(user)} 
              className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition-all"
            >
              تعديل
            </button>
          </div>
        ))}
      </div>

      {editingUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleUpdate} className="bg-gray-900 p-6 rounded-2xl w-full max-w-md border border-gray-700">
            <h2 className="text-xl mb-4 font-bold">تعديل: {editingUser.name}</h2>
            
            <label className="text-gray-400 text-xs">الاسم</label>
            <input className="w-full bg-gray-800 p-2 mb-3 rounded" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} />
            
            <label className="text-gray-400 text-xs">رقم الموبايل</label>
            <input className="w-full bg-gray-800 p-2 mb-3 rounded" value={editingUser.phone} onChange={e => setEditingUser({...editingUser, phone: e.target.value})} />
            
            <label className="text-gray-400 text-xs">اسم الباقة</label>
            <input className="w-full bg-gray-800 p-2 mb-3 rounded" value={editingUser.planName} onChange={e => setEditingUser({...editingUser, planName: e.target.value})} />
            
            <label className="text-gray-400 text-xs">تاريخ التجديد القادم</label>
            <input type="date" className="w-full bg-gray-800 p-2 mb-3 rounded" value={editingUser.nextRenewal || ''} onChange={e => setEditingUser({...editingUser, nextRenewal: e.target.value})} />
            
            <label className="flex items-center gap-2 mb-6 cursor-pointer">
              <input type="checkbox" checked={editingUser.paid} onChange={e => setEditingUser({...editingUser, paid: e.target.checked})} />
              تم دفع رسوم الباقة
            </label>

            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-green-600 py-2 rounded-lg hover:bg-green-700">حفظ التغييرات</button>
              <button type="button" onClick={() => setEditingUser(null)} className="flex-1 bg-gray-600 py-2 rounded-lg hover:bg-gray-700">إلغاء</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
