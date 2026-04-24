'use client';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebaseConfig';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut, createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { useRouter } from 'next/navigation';

// تهيئة Firebase ثانوي لإضافة مستخدمين جدد بدون تسجيل خروجك
let secondaryAuth;
try {
    const config = process.env.NEXT_PUBLIC_FIREBASE_CONFIG ? JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG) : null;
    if (config) {
        const secApp = getApps().length > 1 ? getApp("Secondary") : initializeApp(config, "Secondary");
        secondaryAuth = getAuth(secApp);
    }
} catch (e) { console.error(e); }

export default function Dashboard() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', phone: '', password: '', planName: '', startDate: '', endDate: '' });
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData({ id: user.uid, ...docSnap.data() });
        }
        setLoading(false);
      } else {
        router.push('/auth');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/');
  };

  // وظيفة تفعيل/تعطيل الحساب
  const toggleAccountStatus = async () => {
    const newStatus = !userData.active;
    await updateDoc(doc(db, "users", userData.id), { active: newStatus });
    setUserData({ ...userData, active: newStatus });
    alert(newStatus ? "تم تفعيل الحساب بنجاح ✅" : "تم تعطيل الحساب 🚫");
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
      alert("✅ تم إضافة العميل الجديد بنجاح");
      setIsAddModalOpen(false);
    } catch (err) { alert("خطأ: " + err.message); }
  };

  if (loading) return <div className="min-h-screen bg-black text-yellow-500 flex items-center justify-center">جاري تحميل بيانات MO CONTROL...</div>;

  const InfoBox = ({ label, value, color = "text-white" }) => (
    <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl">
      <h2 className="text-gray-400 text-xs uppercase mb-1">{label}</h2>
      <p className={`text-lg font-bold ${color}`}>{value || "---"}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 font-sans">
      <header className="mb-10 border-b border-yellow-600/30 pb-6 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-yellow-500">MO CONTROL</h1>
          <p className="text-gray-400 mt-2">مرحباً بك، {userData?.name || "عميلنا العزيز"}</p>
        </div>
        {/* زر إضافة عميل - طلب رقم 1 */}
        <button onClick={() => setIsAddModalOpen(true)} className="bg-yellow-600 text-black px-5 py-2 rounded-xl font-bold text-sm">
          + إضافة عميل
        </button>
      </header>

      {/* شبكة البيانات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        <InfoBox label="الاسم الكامل" value={userData?.name} />
        <InfoBox label="رقم الموبايل" value={userData?.phone} />
        <InfoBox label="نوع الباقة" value={userData?.planName} />
        <InfoBox label="السعر" value={userData?.price ? `${userData.price} ج.م` : "---"} />
        <InfoBox label="حالة الدفع" value={userData?.isPaid ? "تم الدفع ✅" : "غير مدفوع ❌"} color={userData?.isPaid ? "text-green-400" : "text-red-400"} />
        <InfoBox label="المبلغ المتبقي (ديون)" value={userData?.debt ? `${userData.debt} ج.م` : "0 ج.م"} color="text-red-500" />
        <InfoBox label="تاريخ التفعيل" value={userData?.startDate} />
        <InfoBox label="تاريخ الانتهاء" value={userData?.endDate} />
        <InfoBox label="مدة الاشتراك (شهر)" value={userData?.durationMonths} />
      </div>

      {/* منطقة الأزرار */}
      <div className="flex flex-col gap-4 max-w-md">
        {/* زر تفعيل/إلغاء تفعيل - طلب رقم 3 */}
        <button onClick={toggleAccountStatus} className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${userData?.active ? 'bg-orange-600 hover:bg-orange-500 text-white' : 'bg-green-600 hover:bg-green-500 text-white'}`}>
          {userData?.active ? 'تعطيل الحساب 🚫' : 'تفعيل الحساب ✅'}
        </button>

        <button onClick={() => router.push('/renewal')} className="w-full bg-yellow-600 hover:bg-yellow-500 text-black py-4 rounded-2xl font-bold text-lg transition-all">
          تفعيل باقة الآن 🚀
        </button>
        
        <button onClick={() => router.push('/')} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-bold text-lg transition-all">
          العودة للموقع الرئيسي
        </button>

        <button onClick={handleSignOut} className="w-full bg-transparent border border-gray-700 text-gray-400 py-3 rounded-2xl hover:border-red-900 hover:text-red-500 transition-all">
          تسجيل الخروج
        </button>
      </div>

      {/* مودال إضافة العميل مع تفريق التواريخ - طلب رقم 2 */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <form onSubmit={handleAddClient} className="bg-gray-900 p-8 rounded-3xl w-full max-w-md border border-gray-800">
            <h2 className="text-xl font-bold mb-6 text-yellow-500">إضافة عميل جديد</h2>
            <div className="space-y-4">
              <input required className="w-full p-3 bg-black rounded-xl border border-gray-800" placeholder="الاسم" onChange={e => setNewUser({...newUser, name: e.target.value})} />
              <input required className="w-full p-3 bg-black rounded-xl border border-gray-800" placeholder="الموبايل" onChange={e => setNewUser({...newUser, phone: e.target.value})} />
              <input required className="w-full p-3 bg-black rounded-xl border border-gray-800" placeholder="الباسورد" type="password" onChange={e => setNewUser({...newUser, password: e.target.value})} />
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">تاريخ التفعيل 📅</label>
                  <input type="date" className="w-full p-2 bg-black rounded-xl border border-gray-800" onChange={e => setNewUser({...newUser, startDate: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">تاريخ الانتهاء 📅</label>
                  <input type="date" className="w-full p-2 bg-black rounded-xl border border-gray-800" onChange={e => setNewUser({...newUser, endDate: e.target.value})} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button className="flex-1 bg-yellow-600 text-black py-3 rounded-xl font-bold">تأكيد الإضافة</button>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 bg-gray-800 py-3 rounded-xl font-bold">إلغاء</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
