// Force update v2
'use client';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebaseConfig';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      setUsers(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error("خطأ في جلب البيانات:", err);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    
    const userRef = doc(db, "users", editingUser.id);
    try {
      await updateDoc(userRef, {
        name: editingUser.name || "",
        phone: editingUser.phone || "",
        planName: editingUser.planName || "",
        price: Number(editingUser.price) || 0,
        debt: Number(editingUser.debt) || 0,
        startDate: editingUser.startDate || "",
        endDate: editingUser.endDate || "",
        durationMonths: Number(editingUser.durationMonths) || 0,
        isPaid: !!editingUser.isPaid,
        active: !!editingUser.isPaid
      });

      alert("تم تحديث البيانات بنجاح!");
      setEditingUser(null);
      fetchUsers(); // تحديث القائمة بعد الحفظ
    } catch (error) {
      console.error("خطأ أثناء التحديث:", error);
      alert("فشل التحديث: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("هل أنت متأكد من حذف هذا العميل؟ لا يمكن التراجع عن هذا الإجراء!")) {
      try {
        await deleteDoc(doc(db, "users", id));
        fetchUsers();
      } catch (err) {
        alert("خطأ أثناء الحذف: " + err.message);
      }
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.phone?.includes(searchTerm)
  );

  return (
    <div className="p-8 bg-black min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-8 text-yellow-500">لوحة تحكم الأدمن - MO CONTROL</h1>

      {/* شريط البحث */}
      <input 
        placeholder="🔍 ابحث بالاسم أو رقم الموبايل..." 
        className="w-full p-4 mb-8 bg-gray-900 rounded-2xl border border-gray-700 outline-none focus:border-yellow-600 transition-all"
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="grid gap-4">
        {filteredUsers.map(user => (
          <div key={user.id} className="bg-gray-900 p-5 rounded-2xl border border-gray-800 flex justify-between items-center hover:border-yellow-600/30 transition-all">
            <div>
              <p className="font-bold text-lg">{user.name}</p>
              <p className="text-yellow-600 font-mono text-sm">{user.phone}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditingUser(user)} className="bg-yellow-600 px-4 py-2 rounded-xl text-black font-bold hover:bg-yellow-500 transition-all">تعديل</button>
              <button onClick={() => handleDelete(user.id)} className="bg-red-600/20 text-red-500 px-4 py-2 rounded-xl hover:bg-red-600 hover:text-white transition-all">حذف</button>
            </div>
          </div>
        ))}
      </div>

      {/* نافذة التعديل */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <form onSubmit={handleUpdate} className="bg-gray-900 p-8 rounded-3xl w-full max-w-lg border border-yellow-600/50">
            <h2 className="text-2xl mb-6 font-bold text-yellow-500">تعديل: {editingUser.name}</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <input className="bg-black p-3 rounded-xl border border-gray-700" placeholder="الاسم" value={editingUser.name || ''} onChange={e => setEditingUser({...editingUser, name: e.target.value})} />
              <input className="bg-black p-3 rounded-xl border border-gray-700" placeholder="رقم الهاتف" value={editingUser.phone || ''} onChange={e => setEditingUser({...editingUser, phone: e.target.value})} />
              <input className="bg-black p-3 rounded-xl border border-gray-700" placeholder="اسم الباقة" value={editingUser.planName || ''} onChange={e => setEditingUser({...editingUser, planName: e.target.value})} />
              <input type="number" className="bg-black p-3 rounded-xl border border-gray-700" placeholder="السعر" value={editingUser.price || ''} onChange={e => setEditingUser({...editingUser, price: e.target.value})} />
              <input type="number" className="bg-black p-3 rounded-xl border border-gray-700" placeholder="المبلغ المتبقي" value={editingUser.debt || ''} onChange={e => setEditingUser({...editingUser, debt: e.target.value})} />
              <input type="number" className="bg-black p-3 rounded-xl border border-gray-700" placeholder="عدد الشهور" value={editingUser.durationMonths || ''} onChange={e => setEditingUser({...editingUser, durationMonths: e.target.value})} />
              <input type="date" className="bg-black p-3 rounded-xl border border-gray-700" value={editingUser.startDate || ''} onChange={e => setEditingUser({...editingUser, startDate: e.target.value})} />
              <input type="date" className="bg-black p-3 rounded-xl border border-gray-700" value={editingUser.endDate || ''} onChange={e => setEditingUser({...editingUser, endDate: e.target.value})} />
            </div>

            <label className="flex items-center gap-3 my-6 cursor-pointer">
              <input type="checkbox" className="w-5 h-5" checked={!!editingUser.isPaid} onChange={e => setEditingUser({...editingUser, isPaid: e.target.checked})} />
              تم دفع رسوم الباقة
            </label>

            <div className="flex gap-3">
              <button type="submit" className="flex-1 bg-yellow-600 py-3 rounded-xl text-black font-bold hover:bg-yellow-500">حفظ التعديلات</button>
              <button type="button" onClick={() => setEditingUser(null)} className="flex-1 bg-gray-700 py-3 rounded-xl hover:bg-gray-600">إلغاء</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
