'use client';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebaseConfig';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        setUsers(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("خطأ في جلب البيانات:", err);
      }
    };
    fetchUsers();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    
    const userRef = doc(db, "users", editingUser.id);
    
    try {
      await updateDoc(userRef, {
        name: editingUser.name || "",
        phone: editingUser.phone || "",
        planName: editingUser.planName || "غير مشترك",
        nextRenewal: editingUser.nextRenewal || "", // يتم حفظه كما يختاره المتصفح (YYYY-MM-DD)
        paid: !!editingUser.paid,
        active: !!editingUser.paid 
      });

      alert("تم تحديث البيانات وتفعيل الخدمة بنجاح!");
      setEditingUser(null);
      window.location.reload(); 
    } catch (error) {
      console.error("خطأ أثناء التحديث:", error);
      alert("فشل التحديث: " + error.message);
    }
  };

  return (
    <div className="p-8 bg-black min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-8 text-yellow-500">لوحة تحكم MO CONTROL</h1>

      <div className="grid gap-4">
        {users.map(user => (
          <div key={user.id} className="bg-gray-900 p-5 rounded-2xl border border-yellow-600/30 flex justify-between items-center">
            <div>
              <p className="font-bold text-lg">{user.name}</p>
              <p className="text-yellow-600 font-mono text-sm">{user.phone}</p>
              <p className="text-gray-400 text-xs mt-1">الباقة: {user.planName || '---'}</p>
            </div>
            <button 
              onClick={() => setEditingUser(user)} 
              className="bg-yellow-600 px-6 py-2 rounded-xl text-black font-bold hover:bg-yellow-500 transition-all"
            >
              تعديل
            </button>
          </div>
        ))}
      </div>

      {editingUser && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleUpdate} className="bg-gray-900 p-8 rounded-3xl w-full max-w-md border border-yellow-600/50">
            <h2 className="text-2xl mb-6 font-bold text-yellow-500">تعديل: {editingUser.name}</h2>
            
            <label className="text-gray-400 text-xs">الاسم</label>
            <input className="w-full bg-black p-3 mb-4 rounded-xl border border-gray-700" value={editingUser.name || ''} onChange={e => setEditingUser({...editingUser, name: e.target.value})} />
            
            <label className="text-gray-400 text-xs">رقم الموبايل</label>
            <input className="w-full bg-black p-3 mb-4 rounded-xl border border-gray-700" value={editingUser.phone || ''} onChange={e => setEditingUser({...editingUser, phone: e.target.value})} />
            
            <label className="text-gray-400 text-xs">اسم الباقة</label>
            <input className="w-full bg-black p-3 mb-4 rounded-xl border border-gray-700" value={editingUser.planName || ''} onChange={e => setEditingUser({...editingUser, planName: e.target.value})} />
            
            <label className="text-gray-400 text-xs">تاريخ التجديد</label>
            <input 
              type="date" 
              className="w-full bg-black p-3 mb-4 rounded-xl border border-gray-700 text-white" 
              // التعديل هنا: استخدام split('T')[0] يضمن أخذ جزء التاريخ فقط
              value={editingUser.nextRenewal ? editingUser.nextRenewal.split('T')[0] : ''} 
              onChange={e => setEditingUser({...editingUser, nextRenewal: e.target.value})} 
            />
            
            <label className="flex items-center gap-3 mb-8 cursor-pointer text-lg font-bold">
              <input 
                type="checkbox" 
                className="w-5 h-5" 
                checked={!!editingUser.paid} 
                onChange={e => setEditingUser({...editingUser, paid: e.target.checked})} 
              />
              تم دفع رسوم الباقة
            </label>

            <div className="flex gap-3">
              <button type="submit" className="flex-1 bg-yellow-600 py-3 rounded-xl text-black font-bold hover:bg-yellow-500">حفظ</button>
              <button type="button" onClick={() => setEditingUser(null)} className="flex-1 bg-gray-700 py-3 rounded-xl hover:bg-gray-600">إلغاء</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
