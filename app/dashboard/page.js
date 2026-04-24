'use client';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // إصلاح مشكلة الخروج التلقائي بتثبيت الجلسة في المتصفح
    const initAuth = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (user) {
            try {
              const docRef = doc(db, "users", user.uid);
              const docSnap = await getDoc(docRef);
              
              if (docSnap.exists()) {
                const data = docSnap.data();
                
                if (data.active === false) {
                  await signOut(auth);
                  router.push('/?status=deleted');
                } else {
                  setUserData(data);
                  setLoading(false);
                }
              } else {
                await signOut(auth);
                router.push('/?status=deleted');
              }
            } catch (error) {
              console.error("خطأ في جلب البيانات:", error);
              setLoading(false);
            }
          } else {
            // لا يحول لصفحة التسجيل إلا إذا تأكدنا أن المستخدم غير موجود فعلاً
            router.push('/auth');
          }
        });
        return unsubscribe;
      } catch (error) {
        console.error("Persistence error:", error);
      }
    };

    const unsubscribePromise = initAuth();
    return () => {
      unsubscribePromise.then(unsubscribe => unsubscribe && unsubscribe());
    };
  }, [router]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/');
  };

  if (loading) return <div className="min-h-screen bg-black text-yellow-500 flex items-center justify-center font-bold text-xl">جاري تحميل بيانات MO CONTROL...</div>;

  const InfoBox = ({ label, value, color = "text-white" }) => (
    <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl">
      <h2 className="text-gray-400 text-xs uppercase mb-1">{label}</h2>
      <p className={`text-lg font-bold ${color}`}>{value || "---"}</p>
    </div>
  );

import { useRouter } from 'next/navigation';

// داخل الـ Component بتاع الداشبورد
const router = useRouter();

useEffect(() => {
  // ده بيخلي الداشبورد تتأكد من حالة الدخول حتى لو المتصفح جابها من الـ Cache
  const handleRouteChange = () => {
    // ممكن تعمل هنا تحديث بسيط لو محتاج
  };

  // لو بتستخدم Next.js App Router، الـ useEffect بيشتغل تلقائياً عند الرجوع
  // لكن لو عايز تتأكد 100%، أضف السطر ده:
  router.refresh(); 
}, [router]);


  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 font-sans">
      <header className="mb-10 border-b border-yellow-600/30 pb-6">
        <h1 className="text-4xl font-bold text-yellow-500">MO CONTROL</h1>
        <p className="text-gray-400 mt-2">مرحباً بك، {userData?.name || "عميلنا العزيز"}</p>
      </header>

      {/* شبكة البيانات كاملة */}
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
        
        <button onClick={() => router.push('/')} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-bold text-lg transition-all">
          العودة للموقع الرئيسي
        </button>

        <button onClick={handleSignOut} className="w-full bg-transparent border border-gray-700 text-gray-400 py-3 rounded-2xl hover:border-red-900 hover:text-red-500 transition-all">
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
}
