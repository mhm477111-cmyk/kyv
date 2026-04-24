'use client';
import { useState, useEffect } from 'react';
import { app, db } from '@/lib/firebaseConfig'; // تأكد إنك عامل export للـ app
import { collection, getDocs, doc, updateDoc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updatePassword } from 'firebase/auth';

// إنشاء نسخة ثانوية من فايربيز في الخلفية عشان الأدمن ميخرجش من حسابه
const secondaryApp = getApps().length > 1 ? getApp("Secondary") : initializeApp(app.options, "Secondary");
const secondaryAuth = getAuth(secondaryApp);

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  const [newUser, setNewUser] = useState({ name: '', phone: '', password: '', planName: '' });
  const [newPasswordValue, setNewPasswordValue] = useState(""); // لتغيير الباسورد من التعديل

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    const querySnapshot = await getDocs(collection(db, "users"));
    setUsers(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  // --- 1. إضافة عميل (متوصل بـ Auth + Firestore) ---
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (newUser.phone.length !== 11) return alert("❌ رقم الهاتف يجب أن يكون 11 رقماً");
    if (newUser.password.length < 6) return alert("❌ الباسورد يجب أن يكون 6 أحرف/أرقام على الأقل");

    const email = `${newUser.phone}@mocontrol.com`; // إيميل وهمي للـ Auth بناءً على الرقم

    try {
      // إنشاء الحساب في Auth الخلفي
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, newUser.password);
      
      // حفظ كل البيانات في Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        name: newUser.name,
        phone: newUser.phone,
        email: email,
        password: newUser.password, // بنحفظه عشان لو الأدمن حابب يعرفه
        planName: newUser.planName,
        active: true,
        isPaid: false,
        price: 0,
        debt: 0,
        durationMonths: 0,
        startDate: "",
        endDate: ""
      });

      // تسجيل الخروج من الحساب الثانوي عشان ميأثرش على الأدمن
      await secondaryAuth.signOut();
      
      alert("✅ تم إنشاء حساب العميل بنجاح في سيستم فايربيز!");
      setIsAddModalOpen(false);
      setNewUser({ name: '', phone: '', password: '', planName: '' });
      fetchUsers();
    } catch (err) { 
      alert("❌ خطأ في الإضافة: " + err.message); 
    }
  };

  // --- 2. تعطيل / تفعيل ---
  const toggleStatus = async (user) => {
    await updateDoc(doc(db, "users", user.id), { active: !user.active });
    fetchUsers();
  };

  // --- 3. حذف نهائي ---
  const handleDelete = async (id, name) => {
    if (confirm(`هل أنت متأكد من حذف بيانات العميل (${name}) نهائياً؟`)) {
      await deleteDoc(doc(db, "users", id));
      alert("🗑️ تم الحذف النهائي");
      fetchUsers();
    }
  };

  // --- 4. تحديث البيانات (شامل تغيير الباسورد في Auth) ---
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      // إذا قام الأدمن بكتابة باسورد جديد
      if (newPasswordValue.length >= 6) {
        // تسجيل الدخول بالحساب الثانوي لتغيير الباسورد
        await signInWithEmailAndPassword(secondaryAuth, editingUser.email, editingUser.password);
        await updatePassword(secondaryAuth.currentUser, newPasswordValue);
        await secondaryAuth.signOut();
        editingUser.password = newPasswordValue; // تحديث الباسورد الجديد في Firestore
        alert("🔐 تم تغيير كلمة المرور في سيستم فايربيز بنجاح!");
      }

      // تحديث باقي البيانات في Firestore
      await updateDoc(doc(db, "users", editingUser.id), {
        name: editingUser.name,
        phone: editingUser.phone,
        password: editingUser.password, // تحديث الباسورد لو اتغير
        planName: editingUser.planName,
        price: Number(editingUser.price),
        debt: Number(editingUser.debt),
        durationMonths: Number(editingUser.durationMonths),
        startDate: editingUser.startDate,
        endDate: editingUser.endDate,
        isPaid: !!editingUser.isPaid
      });

      alert("💾 تم حفظ جميع التعديلات بنجاح!");
      setEditingUser(null);
      setNewPasswordValue("");
      fetchUsers();
    } catch (err) {
      alert("❌ حدث خطأ أثناء التحديث: " + err.message);
    }
  };

  return (
    <div className="p-6 md:p-10 bg-black min-h-screen text-white font-sans">
      <div className="flex justify-between items-center mb-10 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-yellow-500">لوحة الإدارة - MO CONTROL</h1>
          <p className="text-gray-400 mt-2">إدارة العملاء، الاشتراكات، والحسابات</p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-3 px-6 rounded-2xl transition-all shadow-[0_0_15px_rgba(202,138,4,0.3)]">
          + إضافة عميل جديد
        </button>
      </div>

      {/* قائمة العملاء */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(user => (
          <div key={user.id} className={`p-6 rounded-3xl border transition-all ${user.active ? 'bg-gray-900 border-gray-800 hover:border-yellow-600/50' : 'bg-red-950/20 border-red-900/50 opacity-80'}`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-xl">{user.name}</h3>
                <p className="text-yellow-600 font-mono mt-1">{user.phone}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {user.active ? 'نشط' : 'معطل'}
              </span>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button onClick={() => setEditingUser(user)} className="flex-1 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white py-2 rounded-xl transition-all font-bold text-sm">
                ✏️ تعديل
              </button>
              <button onClick={() => toggleStatus(user)} className={`flex-1 py-2 rounded-xl transition-all font-bold text-sm ${user.active ? 'bg-orange-600/20 text-orange-400 hover:bg-orange-600 hover:text-white' : 'bg-green-600/20 text-green-400 hover:bg-green-600 hover:text-white'}`}>
                {user.active ? '🚫 تعطيل' : '✅ تفعيل'}
              </button>
              <button onClick={() => handleDelete(user.id, user.name)} className="flex-1 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white py-2 rounded-xl transition-all font-bold text-sm">
                🗑️ حذف
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ----------------- مودال إضافة عميل ----------------- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateUser} className="bg-gray-900 p-8 rounded-[2rem] w-full max-w-md border border-gray-800 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-yellow-500">إضافة عميل جديد</h2>
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-gray-400 text-sm ml-1">الاسم الكامل</label>
                <input required className="p-3 bg-black rounded-xl border border-gray-800 focus:border-yellow-600 outline-none" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-gray-400 text-sm ml-1">رقم الموبايل (11 رقم)</label>
                <input required type="number" className="p-3 bg-black rounded-xl border border-gray-800 focus:border-yellow-600 outline-none" value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-gray-400 text-sm ml-1">كلمة المرور (لتسجيل الدخول)</label>
                <input required className="p-3 bg-black rounded-xl border border-gray-800 focus:border-yellow-600 outline-none" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-gray-400 text-sm ml-1">اسم الباقة</label>
                <input required className="p-3 bg-black rounded-xl border border-gray-800 focus:border-yellow-600 outline-none" value={newUser.planName} onChange={e => setNewUser({...newUser, planName: e.target.value})} />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button type="submit" className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-black py-3 rounded-xl font-bold transition-all">إضافة وتفعيل</button>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 py-3 rounded-xl font-bold transition-all">إلغاء</button>
            </div>
          </form>
        </div>
      )}

      {/* ----------------- مودال تعديل حساب العميل ----------------- */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto pt-20">
          <form onSubmit={handleUpdate} className="bg-gray-900 p-8 rounded-[2rem] w-full max-w-2xl border border-gray-800 shadow-2xl my-auto">
            <h2 className="text-2xl font-bold mb-6 text-yellow-500 border-b border-gray-800 pb-4">تعديل بيانات: {editingUser.name}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-gray-400 text-sm ml-1">الاسم الكامل</label>
                <input className="p-3 bg-black rounded-xl border border-gray-800" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-gray-400 text-sm ml-1">رقم الموبايل</label>
                <input className="p-3 bg-black rounded-xl border border-gray-800" value={editingUser.phone} onChange={e => setEditingUser({...editingUser, phone: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-gray-400 text-sm ml-1">اسم الباقة</label>
                <input className="p-3 bg-black rounded-xl border border-gray-800" value={editingUser.planName || ''} onChange={e => setEditingUser({...editingUser, planName: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-gray-400 text-sm ml-1">السعر (ج.م)</label>
                <input type="number" className="p-3 bg-black rounded-xl border border-gray-800" value={editingUser.price || ''} onChange={e => setEditingUser({...editingUser, price: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-gray-400 text-sm ml-1">الديون المتبقية (ج.م)</label>
                <input type="number" className="p-3 bg-black rounded-xl border border-gray-800" value={editingUser.debt || ''} onChange={e => setEditingUser({...editingUser, debt: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-gray-400 text-sm ml-1">عدد الشهور (مدة الاشتراك)</label>
                <input type="number" className="p-3 bg-black rounded-xl border border-gray-800" value={editingUser.durationMonths || ''} onChange={e => setEditingUser({...editingUser, durationMonths: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-gray-400 text-sm ml-1">تاريخ البدء</label>
                <input type="date" className="p-3 bg-black rounded-xl border border-gray-800 text-white" value={editingUser.startDate || ''} onChange={e => setEditingUser({...editingUser, startDate: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-gray-400 text-sm ml-1">تاريخ الانتهاء</label>
                <input type="date" className="p-3 bg-black rounded-xl border border-gray-800 text-white" value={editingUser.endDate || ''} onChange={e => setEditingUser({...editingUser, endDate: e.target.value})} />
              </div>
            </div>

            {/* قسم تعديل حالة الدفع والباسورد */}
            <div className="mt-6 p-4 bg-black rounded-xl border border-gray-800">
              <label className="flex items-center gap-3 cursor-pointer mb-4">
                <input type="checkbox" className="w-5 h-5 accent-yellow-600" checked={!!editingUser.isPaid} onChange={e => setEditingUser({...editingUser, isPaid: e.target.checked})} />
                <span className="font-bold">العميل دفع الرسوم ✅</span>
              </label>

              <div className="flex flex-col gap-1 border-t border-gray-800 pt-4">
                <label className="text-red-400 text-sm ml-1 font-bold">تغيير كلمة المرور (اختياري)</label>
                <input type="text" placeholder="اكتب الباسورد الجديد هنا لتغييره..." className="p-3 bg-gray-900 rounded-xl border border-red-900 focus:border-red-500 outline-none" value={newPasswordValue} onChange={e => setNewPasswordValue(e.target.value)} />
                <p className="text-xs text-gray-500 mt-1">اتركها فارغة إذا كنت لا تريد تغيير الباسورد الحالي. الباسورد الحالي: <span className="text-gray-300">{editingUser.password}</span></p>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button type="submit" className="flex-1 bg-green-600 hover:bg-green-500 text-white py-4 rounded-xl font-bold transition-all text-lg">💾 حفظ كل التعديلات</button>
              <button type="button" onClick={() => { setEditingUser(null); setNewPasswordValue(""); }} className="flex-1 bg-gray-800 hover:bg-gray-700 py-4 rounded-xl font-bold transition-all">إلغاء وإغلاق</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
