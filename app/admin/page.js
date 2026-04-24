'use client';
import { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebaseConfig';
import { collection, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({ name: '', phone: '', email: '', password: '', planName: '' });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    const querySnapshot = await getDocs(collection(db, "users"));
    setUsers(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  // إنشاء مستخدم جديد
  const handleCreateUser = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, newUser.email, newUser.password);
      await setDoc(doc(db, "users", userCredential.user.uid), {
        name: newUser.name,
        phone: newUser.phone,
        planName: newUser.planName,
        active: true,
        isPaid: false
      });
      alert("تم إنشاء الحساب بنجاح!");
      setNewUser({ name: '', phone: '', email: '', password: '', planName: '' });
      fetchUsers();
    } catch (err) { alert("خطأ: " + err.message); }
  };

  // تعطيل/تفعيل الحساب (بدل الحذف)
  const toggleUserStatus = async (user) => {
    try {
      await updateDoc(doc(db, "users", user.id), { active: !user.active });
      fetchUsers();
    } catch (err) { alert("خطأ: " + err.message); }
  };

  // تحديث بيانات المستخدم
  const handleUpdate = async (e) => {
    e.preventDefault();
    const userRef = doc(db, "users", editingUser.id);
    await updateDoc(userRef, editingUser);
    alert("تم التحديث!");
    setEditingUser(null);
    fetchUsers();
  };

  return (
    <div className="p-8 bg-black min-h-screen text-white font-sans">
      <h1 className="text-3xl font-bold mb-8 text-yellow-500">لوحة تحكم الأدمن - MO CONTROL</h1>

      {/* قسم إنشاء مستخدم جديد */}
      <div className="bg-gray-900 p-6 rounded-2xl mb-8 border border-gray-700">
        <h2 className="text-xl mb-4 text-yellow-500 font-bold">إنشاء عميل جديد</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input placeholder="الاسم" className="p-3 rounded-lg bg-black border border-gray-700" onChange={e => setNewUser({...newUser, name: e.target.value})} />
          <input placeholder="الهاتف" className="p-3 rounded-lg bg-black border border-gray-700" onChange={e => setNewUser({...newUser, phone: e.target.value})} />
          <input placeholder="البريد الإلكتروني" className="p-3 rounded-lg bg-black border border-gray-700" onChange={e => setNewUser({...newUser, email: e.target.value})} />
          <input type="password" placeholder="كلمة المرور" className="p-3 rounded-lg bg-black border border-gray-700" onChange={e => setNewUser({...newUser, password: e.target.value})} />
          <input placeholder="الباقة" className="p-3 rounded-lg bg-black border border-gray-700" onChange={e => setNewUser({...newUser, planName: e.target.value})} />
          <button onClick={handleCreateUser} className="bg-yellow-600 text-black font-bold p-3 rounded-lg hover:bg-yellow-500">إنشاء العميل</button>
        </div>
      </div>

      {/* قائمة المستخدمين */}
      <div className="grid gap-4">
        {users.map(user => (
          <div key={user.id} className={`p-5 rounded-2xl border flex justify-between items-center ${user.active ? 'border-gray-800' : 'border-red-900 bg-red-900/10'}`}>
            <div>
              <p className="font-bold text-lg">{user.name} {!user.active && <span className="text-red-500 text-sm">(محذوف/معطل)</span>}</p>
              <p className="text-yellow-600 text-sm">{user.phone}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => toggleUserStatus(user)} className={`px-4 py-2 rounded-xl ${user.active ? 'bg-red-600/20 text-red-500' : 'bg-green-600 text-white'}`}>
                {user.active ? "تعطيل الحساب" : "استرجاع الحساب"}
              </button>
              <button onClick={() => setEditingUser(user)} className="bg-yellow-600 px-4 py-2 rounded-xl text-black font-bold">تعديل</button>
            </div>
          </div>
        ))}
      </div>

      {/* نافذة التعديل */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleUpdate} className="bg-gray-900 p-8 rounded-3xl w-full max-w-lg border border-yellow-600">
            <h2 className="text-2xl mb-4 text-yellow-500">تعديل بيانات {editingUser.name}</h2>
            <input className="w-full p-3 mb-3 bg-black rounded-xl border" value={editingUser.name || ''} onChange={e => setEditingUser({...editingUser, name: e.target.value})} />
            <input className="w-full p-3 mb-3 bg-black rounded-xl border" value={editingUser.phone || ''} onChange={e => setEditingUser({...editingUser, phone: e.target.value})} />
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
