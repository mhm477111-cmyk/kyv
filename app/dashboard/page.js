'use client';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // مراقبة حالة التسجيل
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // لو العميل مسجل، هات بياناته
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
        setLoading(false);
      } else {
        // لو مش مسجل، رجعه لصفحة الدخول
        router.push('/login');
      }
    });

    return () => unsubscribe(); // تنظيف المراقب عند الخروج من الصفحة
  }, [router]);

  if (loading) return <p>جاري التحقق من هويتك...</p>;

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>لوحة تحكم MO CONTROL</h1>
      <div style={{ border: '1px solid #ccc', padding: '20px', maxWidth: '300px', margin: 'auto' }}>
        <p><strong>رقم الموبايل:</strong> {userData?.phone}</p>
        <p><strong>نوع الباقة:</strong> {userData?.planDetails?.name}</p>
        <p><strong>تاريخ الانتهاء:</strong> {userData?.planDetails?.expiryDate}</p>
      </div>
      <br />
      <button onClick={() => auth.signOut()}>تسجيل خروج</button>
    </div>
  );
}
