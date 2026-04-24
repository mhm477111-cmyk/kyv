'use client';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [userData, setUserData] = useState(null);
  const router = useRouter();

  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
      } else {
        // توجيه غير المسجلين لصفحة الـ Auth الموحدة
        router.push('/auth');
      }
    });
  }, [router]);

  // منطق النظام الأوتوماتيكي: السيستم شغال فقط لو (أنت مفعله إدارياً + العميل دافع)
  const isSystemLive = userData?.active && userData?.paid;

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 font-sans">
      {/* Header */}
      <header className="mb-10 border-b border-yellow-600/30 pb-6">
        <h1 className="text-4xl font-bold text-yellow-500">MO CONTROL</h1>
        <p className="text-gray-400 mt-2">لوحة تحكم العميل</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* كارت حالة الخدمة */}
        <div className="bg-gray-900 border-2 border-yellow-600/50 p-6 rounded-3xl shadow-[0_0_15px_rgba(202,138,4,0.2)]">
          <h2 className="text-yellow-600 font-bold text-sm mb-4">حالة الخدمة</h2>
          <p className="text-2xl font-bold mb-4">{userData?.planName || "---"}</p>
          
          {isSystemLive ? (
            <span className="inline-flex items-center gap-2 px-4 py-1 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/30">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              SYSTEM LIVE ✅
            </span>
          ) : (
            <span className="inline-block px-4 py-1 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-500/30">
              ● SYSTEM OFFLINE ❌
            </span>
          )}
        </div>

        {/* كارت حالة الدفع */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-3xl">
          <h2 className="text-gray-400 text-sm mb-2">حالة الدفع</h2>
          <p className="text-xl font-bold text-white">{userData?.paid ? "تم الدفع 💰" : "بانتظار الدفع"}</p>
        </div>

        {/* كارت تاريخ التجديد */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-3xl">
          <h2 className="text-gray-400 text-sm mb-2">تاريخ التجديد</h2>
          <p className="text-xl font-bold">{userData?.nextRenewal || "---"}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-10 flex flex-col gap-4 max-w-md">
        <button 
          onClick={() => router.push('/renewal')} 
          className="w-full bg-yellow-600 hover:bg-yellow-500 text-black py-4 rounded-2xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(202,138,4,0.4)]"
        >
          تفعيل باقة الآن 🚀
        </button>

        <button 
          onClick={() => {
            signOut(auth);
            router.push('/auth');
          }}
          className="w-full bg-transparent border border-gray-700 text-gray-400 py-3 rounded-2xl hover:border-red-900 hover:text-red-500 transition-all"
        >
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
}
