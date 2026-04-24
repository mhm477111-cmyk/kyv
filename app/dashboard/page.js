'use client';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

export default function Dashboard() {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
      }
    };
    fetchData();
  }, []);

  if (!userData) return <p>جاري تحميل بياناتك...</p>;

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>مرحباً بك في لوحة تحكم MO CONTROL</h1>
      <div style={{ border: '1px solid #ccc', padding: '20px', maxWidth: '300px', margin: 'auto' }}>
        <p><strong>رقم الموبايل:</strong> {userData.phone}</p>
        <p><strong>نوع الباقة:</strong> {userData.planDetails?.name}</p>
        <p><strong>تاريخ الانتهاء:</strong> {userData.planDetails?.expiryDate}</p>
      </div>
    </div>
  );
}
