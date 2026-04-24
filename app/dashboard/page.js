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
      {/* Header */}
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          MO CONTROL
        </h1>
        <p className="text-gray-400">أهلاً بك في لوحة تحكمك الخاصة</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
          <h2 className="text-gray-400 text-sm mb-2">رقم الموبايل</h2>
          <p className="text-2xl font-mono">{userData?.phone || "Loading..."}</p>
        </div>
        
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-2xl shadow-xl">
          <h2 className="text-blue-100 text-sm mb-2">حالة الباقة</h2>
          <p className="text-2xl font-bold">{userData?.planDetails?.name || "باقة أساسية"}</p>
        </div>
      </div>

      {/* Action Area */}
      <div className="mt-8 bg-gray-900 border border-gray-800 p-6 rounded-2xl">
        <h3 className="text-lg font-semibold mb-4">إدارة الحساب</h3>
        <button 
          onClick={() => auth.signOut()}
          className="bg-red-500 hover:bg-red-600 px-6 py-2 rounded-lg transition-all"
        >
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
}
