'use client';
import { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebaseConfig';
import { collection, getDocs, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, setPersistence, browserLocalPersistence, createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { useRouter } from 'next/navigation';

// تهيئة Firebase ثانوي لإضافة مستخدمين جدد بدون ما يخرجك من حسابك الأساسي
let secondaryAuth;
try {
  const config = process.env.NEXT_PUBLIC_FIREBASE_CONFIG ? JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG) : null;
  if (config) {
    const secApp = getApps().length > 1 ? getApp("Secondary") : initializeApp(config, "Secondary");
    secondaryAuth = getAuth(secApp);
  }
} catch (e) { console.error(e); }

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', phone: '', password: '', planName: '', startDate: '', endDate: '' });
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // حل مشكلة التحويل التلقائي: نثبت الجلسة في المتصفح
    setPersistence(auth, browserLocalPersistence).then(() => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          fetchUsers();
          setLoading(false);
        } else {
          router.push('/auth');
        }
      });
      return () => unsubscribe();
    });
  }, [router]);

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      setUsers(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error("خطأ في جلب البيانات:", err);
    }
  };

  // وظيفة إضافة عميل جديد
  const handleAddClient = async (e) => {
    e.preventDefault();
    try {
      const email = `${newUser.phone}@mocontrol.com`;
      const res = await createUserWithEmailAndPassword(secondaryAuth, email, newUser.password);
      await setDoc(doc(db, "users", res.user.uid), {
        ...newUser, email, active: true, isPaid: false, price: 0, debt: 0, durationMonths: 1
      });
      alert("✅ تم إضافة العميل بنجاح");
      setIsAddModalOpen(false);
      fetchUsers();
    } catch (err) { alert("❌ خطأ: " + err.message); }
  };

  // وظيفة تفعيل/إلغاء تفعيل الحساب (الزر الثالث)
  const toggleStatus = async (user) => {
    try {
      await updateDoc(doc(db, "users", user.id), { active: !user.active });
      fetchUsers();
    } catch (err) { alert("خطأ في تغيير الحالة"); }
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
        isPaid: !!editingUser.isPaid
      });
      alert("تم تحديث البيانات بنجاح!");
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      alert("فشل التحديث: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("هل أنت متأكد من حذف هذا العميل؟")) {
      try {
        await deleteDoc(doc(db, "users", id));
        fetchUsers();
      } catch (err) { alert("خطأ أثناء الحذف"); }
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.phone?.includes(searchTerm)
  );

  if (loading) return <div className="min-h-screen bg-black text-yellow-500 flex items-center justify-center">جاري التحقق من الصلاحيات...</div>;

  return (
    <div className="p-8 bg-black min-h-screen text-white">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-yellow-500">لوحة تحكم الأدمن - MO CONTROL</h1>
        <button onClick={() => setIsAddModalOpen(true)} className="bg-green-600 px-6 py-2 rounded-xl font-bold hover:bg-green-500">+ إضافة عميل</button>
      </div>

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
              <button onClick={() => toggleStatus(user)} className={`${user.active ? 'bg-orange-600/20 text-orange-500' : 'bg-green-600/20 text-green-500'} px-4 py-2 rounded-xl font-bold`}>
                {user.active ? 'تعطيل الحساب' : 'تفعيل الحساب'}
              </button>
              <button onClick={() => setEditingUser(user)} className="bg-yellow-600 px-4 py-2 rounded-xl text-black font-bold">تعديل</button>
              <button onClick={() => handleDelete(user.id)} className="bg-red-600/20 text-red-500 px-4 py-2 rounded-xl">حذف</button>
            </div>
          </div>
        ))}
      </div>

      {/* نافذة إضافة عميل */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAddClient} className="bg-gray-900 p-8 rounded-3xl w-full max-w-md border border-yellow-600/50">
            <h2 className="text-2xl mb-6 font-bold text-yellow-500">إضافة عميل جديد</h2>
            <div className="grid grid-cols-2 gap-4">
              <input required className="bg-black p-3 rounded-xl border border-gray-700 col-span-2" placeholder="الاسم" onChange={e => setNewUser({...newUser, name: e.target.value})} />
              <input required className="bg-black p-3 rounded-xl border border-gray-700 col-span-2" placeholder="رقم الهاتف" onChange={e => setNewUser({...newUser, phone: e.target.value})} />
              <input required className="bg-black p-3 rounded-xl border border-gray-700 col-span-2" placeholder="كلمة المرور" type="password" onChange={e => setNewUser({...newUser, password: e.target.value})} />
              <div className="col-span-1"><label className="text-[10px] text-gray-500 block">تاريخ التفعيل</label><input type="date" className="w-full bg-black p-3 rounded-xl border border-gray-700" onChange={e => setNewUser({...newUser, startDate: e.target.value})} /></div>
              <div className="col-span-1"><label className="text-[10px] text-gray-500 block">تاريخ الانتهاء</label><input type="date" className="w-full bg-black p-3 rounded-xl border border-gray-700" onChange={e => setNewUser({...newUser, endDate: e.target.value})} /></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button className="flex-1 bg-yellow-600 py-3 rounded-xl text-black font-bold">تأكيد</button>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 bg-gray-700 py-3 rounded-xl">إلغاء</button>
            </div>
          </form>
        </div>
      )}

      {/* نافذة التعديل */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <form onSubmit={handleUpdate} className="bg-gray-900 p-8 rounded-3xl w-full max-w-lg border border-yellow-600/50">
            <h2 className="text-2xl mb-6 font-bold text-yellow-500">تعديل: {editingUser.name}</h2>
            <div className="grid grid-cols-2 gap-4">
              <input className="bg-black p-3 rounded-xl border border-gray-700" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} />
              <input className="bg-black p-3 rounded-xl border border-gray-700" value={editingUser.phone} onChange={e => setEditingUser({...editingUser, phone: e.target.value})} />
              <input className="bg-black p-3 rounded-xl border border-gray-700" value={editingUser.planName} onChange={e => setEditingUser({...editingUser, planName: e.target.value})} />
              <input type="number" className="bg-black p-3 rounded-xl border border-gray-700" value={editingUser.price} onChange={e => setEditingUser({...editingUser, price: e.target.value})} />
              
              <div className="col-span-1">
                <label className="text-[10px] text-yellow-500 block">تاريخ التفعيل (البدء) 📅</label>
                <input type="date" className="w-full bg-black p-3 rounded-xl border border-gray-700" value={editingUser.startDate || ''} onChange={e => setEditingUser({...editingUser, startDate: e.target.value})} />
              </div>
              <div className="col-span-1">
                <label className="text-[10px] text-red-500 block">تاريخ الانتهاء 📅</label>
                <input type="date" className="w-full bg-black p-3 rounded-xl border border-gray-700" value={editingUser.endDate || ''} onChange={e => setEditingUser({...editingUser, endDate: e.target.value})} />
              </div>
            </div>
            <label className="flex items-center gap-3 my-6 cursor-pointer">
              <input type="checkbox" className="w-5 h-5" checked={!!editingUser.isPaid} onChange={e => setEditingUser({...editingUser, isPaid: e.target.checked})} />
              تم دفع رسوم الباقة
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
