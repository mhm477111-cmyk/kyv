'use client';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            setUserData(docSnap.data());
            setLoading(false);
          } else {
            await signOut(auth);
            const adminWhatsApp = "201000000000"; // ضع رقمك هنا
            const message = "مرحباً، تم إيقاف حسابي وأحتاج للمساعدة بخصوص MO CONTROL.";
            window.location.href = `https://wa.me/${adminWhatsApp}?text=${encodeURIComponent(message)}`;
          }
        } catch (error) {
          console.error("خطأ:", error);
          setLoading(false);
        }
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

  if (loading) return <div className="min-h-screen bg-black text-yellow-500 flex items-center justify-center font-bold">جاري التحقق...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 font-sans">
      <header className="mb-10 border-b border-yellow-600/30 pb-6">
        <h1 className="text-4xl font-bold text-yellow-500">MO CONTROL</h1>
        <p className="text-gray-400 mt-2">مرحباً بك، {userData?.name || "عميلنا العزيز"}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl">
          <h2 className="text-gray-400 text-xs uppercase mb-1">الاسم</h2>
          <p className="text-lg font-bold">{userData?.name || "---"}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl">
          <h2 className="text-gray-400 text-xs uppercase mb-1">رقم الهاتف</h2>
          <p className="text-lg font-bold">{userData?.phone || "---"}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl">
          <h2 className="text-gray-400 text-xs uppercase mb-1">حالة الدفع</h2>
          <p className={`text-lg font-bold ${userData?.isPaid ? "text-green-400" : "text-red-400"}`}>
            {userData?.isPaid ? "تم الدفع ✅" : "غير مدفوع ❌"}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 max-w-md">
        <button onClick={handleSignOut} className="w-full bg-transparent border border-gray-700 text-gray-400 py-3 rounded-2xl hover:border-red-900 hover:text-red-500 transition-all">
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
}
