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
    const querySnapshot = await getDocs(collection(db, "users"));
    setUsers(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
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
      alert("تم التحديث!");
      setEditingUser(null);
      fetchUsers();
    } catch (err) { alert("خطأ: " + err.message); }
  };

  const handleDelete = async (id) => {
    if (confirm("هل أنت متأكد من حذف هذا العميل؟ لا يمكن التراجع!")) {
      await deleteDoc(doc(db, "users", id));
      fetchUsers();
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.phone?.includes(searchTerm)
  );

  return (
    <div className="p-8 bg-black min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-6 text-yellow-500">لوحة تحكم الأدمن</h1>
      
      <input 
        placeholder="بحث بالاسم أو الرقم..." 
        className="w-full p-4 mb-6 bg-gray-900 rounded-2xl border border-yellow-600"
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="grid gap-4">
        {filteredUsers.map(user => (
          <div key={user.id} className="bg-gray-900 p-5 rounded-2xl border border-gray-800 flex justify-between items-center">
            <div>
              <p className="font-bold">{user.name}</p>
              <p className="text-yellow-600 text-sm">{user.phone}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditingUser(user)} className="bg-yellow-600 px-4 py-2 rounded-lg text-black font-bold">تعديل</button>
              <button onClick={() => handleDelete(user.id)} className="bg-red-600 px-4 py-2 rounded-lg text-white">حذف</button>
            </div>
          </div>
        ))}
      </div>

      {editingUser && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleUpdate} className="bg-gray-900 p-8 rounded-3xl w-full max-w-lg border border-yellow-600">
            <h2 className="text-xl mb-4 text-yellow-500 font-bold">تعديل بيانات: {editingUser.name}</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <input className="bg-black p-3 rounded-xl border border-gray-700" placeholder="الاسم" value={editingUser.name || ''} onChange={e => setEditingUser({...editingUser, name: e.target.value})} />
              <input className="bg-black p-3 rounded-xl border border-gray-700" placeholder="الهاتف" value={editingUser.phone || ''} onChange={e => setEditingUser({...editingUser, phone: e.target.value})} />
              <input className="bg-black p-3 rounded-xl border border-gray-700" placeholder="الباقة" value={editingUser.planName || ''} onChange={e => setEditingUser({...editingUser, planName: e.target.value})} />
              <input type="number" className="bg-black p-3 rounded-xl border border-gray-700" placeholder="السعر" value={editingUser.price || ''} onChange={e => setEditingUser({...editingUser, price: e.target.value})} />
              <input type="number" className="bg-black p-3 rounded-xl border border-gray-700" placeholder="الدين" value={editingUser.debt || ''} onChange={e => setEditingUser({...editingUser, debt: e.target.value})} />
              <input type="number" className="bg-black p-3 rounded-xl border border-gray-700" placeholder="عدد الشهور" value={editingUser.durationMonths || ''} onChange={e => setEditingUser({...editingUser, durationMonths: e.target.value})} />
              <input type="date" className="bg-black p-3 rounded-xl border border-gray-700" value={editingUser.startDate || ''} onChange={e => setEditingUser({...editingUser, startDate: e.target.value})} />
              <input type="date" className="bg-black p-3 rounded-xl border border-gray-700" value={editingUser.endDate || ''} onChange={e => setEditingUser({...editingUser, endDate: e.target.value})} />
            </div>

            <label className="flex items-center gap-3 my-6">
              <input type="checkbox" checked={!!editingUser.isPaid} onChange={e => setEditingUser({...editingUser, isPaid: e.target.checked})} />
              تم الدفع
            </label>

            <div className="flex gap-3">
              <button type="submit" className="flex-1 bg-yellow-600 py-3 rounded-xl text-black font-bold">حفظ</button>
              <button type="button" onClick={() => setEditingUser(null)} className="flex-1 bg-gray-700 py-3 rounded-xl">إلغاء</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
