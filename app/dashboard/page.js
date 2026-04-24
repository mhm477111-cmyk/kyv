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
    <div className="min-h-screen bg-gray-950 text-white p-6 md:p-12">
      <header className="mb-10">
        <h1 className="text-3xl font-bold">مرحباً، {userData?.name || "عميلنا العزيز"} 👋</h1>
        <p className="text-gray-400">لوحة تحكم MO CONTROL</p>
      </header>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* كارت حالة الباقة */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
          <h2 className="text-gray-400 text-sm">الباقة الحالية</h2>
          <p className="text-xl font-bold mt-2">{userData?.planName || "غير محددة"}</p>
          <span className={`inline-block mt-3 px-3 py-1 rounded-full text-xs ${userData?.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {userData?.active ? "مُفعلة" : "غير مُفعلة"}
          </span>
        </div>

        {/* كارت حالة الدفع */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
          <h2 className="text-gray-400 text-sm">حالة الدفع</h2>
          <p className="text-xl font-bold mt-2">{userData?.paid ? "تم الدفع ✅" : "لم يتم الدفع ❌"}</p>
        </div>

        {/* كارت تاريخ التجديد */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
          <h2 className="text-gray-400 text-sm">تاريخ التجديد القادم</h2>
          <p className="text-xl font-bold mt-2">{userData?.nextRenewal || "---"}</p>
        </div>

      </div>

      <button 
        onClick={() => auth.signOut()}
        className="mt-10 bg-red-500/10 text-red-400 border border-red-500/20 px-6 py-2 rounded-lg hover:bg-red-500/20 transition-all"
      >
        تسجيل الخروج
      </button>
    </div>
  );
}
