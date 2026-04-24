'use client';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [userData, setUserData] = useState(null);
  const router = useRouter();

  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setUserData(docSnap.data());
      } else {
        router.push('/login');
      }
    });
  }, [router]);

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 font-sans">
      {/* Header */}
      <header className="mb-10 border-b border-yellow-600/30 pb-6">
        <h1 className="text-4xl font-bold text-yellow-500">MO CONTROL</h1>
        <p className="text-gray-400 mt-2">لوحة تحكم العميل - النظام فعال</p>
      </header>

      {/* Stats Grid - بنفس ستايل الكروت في الصورة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* كارت حالة الباقة */}
        <div className="bg-gray-900 border-2 border-yellow-600/50 p-6 rounded-3xl shadow-[0_0_15px_rgba(202,138,4,0.2)]">
          <h2 className="text-yellow-600 font-bold text-sm">الباقة الحالية</h2>
          <p className="text-2xl font-bold mt-2">{userData?.planName || "---"}</p>
          <span className="inline-block mt-3 px-4 py-1 rounded-full text-xs bg-yellow-600/20 text-yellow-500 border border-yellow-600/30">
            {userData?.active ? "النظام فعال ✅" : "غير مفعّل"}
          </span>
        </div>

        {/* كارت حالة الدفع */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-3xl">
          <h2 className="text-gray-400 text-sm">حالة الدفع</h2>
          <p className="text-xl font-bold mt-2 text-white">{userData?.paid ? "تم الدفع 💰" : "بانتظار الدفع"}</p>
        </div>

        {/* كارت تاريخ التجديد */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-3xl">
          <h2 className="text-gray-400 text-sm">تاريخ التجديد</h2>
          <p className="text-xl font-bold mt-2">{userData?.nextRenewal || "---"}</p>
        </div>
      </div>

      {/* Action Buttons - أزرار التجديد والتحكم بنفس الألوان */}
      <div className="mt-10 flex flex-col gap-4 max-w-md">
        <button 
          onClick={() => router.push('/renewal')} 
          className="w-full bg-yellow-600 hover:bg-yellow-500 text-black py-4 rounded-2xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(202,138,4,0.4)]"
        >
          تفعيل باقة الآن 🚀
        </button>

        <button 
          onClick={() => auth.signOut()}
          className="w-full bg-transparent border border-gray-700 text-gray-400 py-3 rounded-2xl hover:border-red-900 hover:text-red-500 transition-all"
        >
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
}
