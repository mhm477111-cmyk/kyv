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
            // هنا التعديل: إذا العميل محذوف، يتم تحويله للواتساب فوراً
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
    // العودة للصفحة الرئيسية عند تسجيل الخروج الطبيعي
    router.push('/'); 
  };

  if (loading) return <div className="min-h-screen bg-black text-yellow-500 flex items-center justify-center font-bold">جاري التحقق من صلاحية الدخول...</div>;

  // ... (باقي كود الـ return كما هو في ملفك الأصلي)
  return (
      // ... التصميم الخاص بك
  );
}
