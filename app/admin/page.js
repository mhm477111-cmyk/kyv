'use client';
import { useState, useEffect } from 'react';
import { app, db } from '@/lib/firebaseConfig';
import { collection, getDocs, doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const secondaryApp = getApps().length > 1 ? getApp("Secondary") : initializeApp(app.options, "Secondary");
const secondaryAuth = getAuth(secondaryApp);

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState(""); // شريط البحث
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({ name: '', phone: '', password: '', planName: '' });
  const [newPasswordValue, setNewPasswordValue] = useState("");

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    const querySnapshot = await getDocs(collection(db, "users"));
    setUsers(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  // فلترة العملاء حسب البحث
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.phone.includes(searchQuery)
  );

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
      fetchUsers();
    } catch (err) { alert("❌ خطأ: " + err.message); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const updatedData = { ...editingUser };
      if (newPasswordValue.length >= 6) updatedData.password = newPasswordValue;
      await updateDoc(doc(db, "users", editingUser.id), updatedData);
      alert("💾 تم الحفظ!");
      setEditingUser(null);
      fetchUsers();
    } catch (err) { alert("❌ خطأ: " + err.message); }
  };

  return (
    <div className="p-6 md:p-10 bg-black min-h-screen text-white font-sans">
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 border-b border-gray-800 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-yellow-500">لوحة الإدارة</h1>
          <p className="text-gray-400">MO CONTROL - إدارة العملاء</p>
        </div>
        
        {/* شريط البحث المظبوط */}
        <input 
          type="text" 
          placeholder="🔍 بحث باسم العميل أو رقم الموبايل..." 
          className="w-full md:w-80 p-3 bg-gray-900 border border-gray-700 rounded-xl outline-none focus:border-yellow-600"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <button onClick={() => setIsAddModalOpen(true)} className="bg-yellow-600 text-black font-bold py-3 px-6 rounded-2xl">
          + إضافة عميل
        </button>
      </div>

      {/* قائمة العملاء */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map(user => (
          <div key={user.id} className="p-6 rounded-3xl bg-gray-900 border border-gray-800">
            <h3 className="font-bold text-xl">{user.name}</h3>
            <p className="text-yellow-600 font-mono mb-4">{user.phone}</p>
            <div className="flex gap-2">
              <button onClick={() => setEditingUser(user)} className="flex-1 bg-blue-600/20 text-blue-400 py-2 rounded-xl">تعديل</button>
              <button onClick={() => deleteDoc(doc(db, "users", user.id)).then(fetchUsers)} className="flex-1 bg-red-600/20 text-red-400 py-2 rounded-xl">حذف</button>
            </div>
          </div>
        ))}
      </div>

      {/* مودال تعديل - مقاس مظبوط */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 p-6 rounded-3xl w-full max-w-xl max-h-[85vh] overflow-y-auto border border-gray-800">
            <h2 className="text-xl font-bold text-yellow-500 mb-4">تعديل: {editingUser.name}</h2>
            <div className="grid grid-cols-2 gap-3">
              <input className="p-2 bg-black rounded-lg border border-gray-700" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} placeholder="الاسم" />
              <input className="p-2 bg-black rounded-lg border border-gray-700" value={editingUser.phone} onChange={e => setEditingUser({...editingUser, phone: e.target.value})} placeholder="الموبايل" />
            </div>
            {/* باقي الفورم بنفس التنسيق */}
            <div className="mt-6 flex gap-3">
              <button onClick={handleUpdate} className="flex-1 bg-green-600 py-3 rounded-xl font-bold">حفظ التعديلات</button>
              <button onClick={() => setEditingUser(null)} className="flex-1 bg-gray-700 py-3 rounded-xl">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
