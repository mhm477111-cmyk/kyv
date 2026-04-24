'use client';
import { useState } from 'react';
import { auth, db } from '@/lib/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation'; // أضفنا الـ Router

export default function Register() {
  const [phone, setPhone] = useState(''); // غيرنا الاسم لـ phone
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter(); // عشان نحول العميل للـ Dashboard

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. تحويل رقم الموبايل لإيميل وهمي عشان Firebase يقبله
      const fakeEmail = `${phone}@mocontrol.com`;
      
      const userCredential = await createUserWithEmailAndPassword(auth, fakeEmail, password);
      const user = userCredential.user;

      // 2. إنشاء بيانات العميل في Firestore
      await setDoc(doc(db, "users", user.uid), {
        phone: phone, // حفظنا الرقم الحقيقي
        planDetails: { name: "باقة أساسية", expiryDate: "لم يتم التفعيل" },
        paymentStatus: { totalAmount: 0, paidAmount: 0 }
      });

      alert("تم إنشاء حسابك بنجاح!");
      router.push('/dashboard'); // تحويل أوتوماتيك
      
    } catch (error) {
      alert("خطأ: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>إنشاء حساب عميل جديد</h1>
      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          type="text" // غيرنا الـ type لـ text عشان الموبايل
          placeholder="رقم الموبايل" 
          value={phone}
          onChange={(e) => setPhone(e.target.value)} 
          required 
          style={{ padding: '10px' }}
        />
        <input 
          type="password" 
          placeholder="كلمة السر" 
          value={password}
          onChange={(e) => setPassword(e.target.value)} 
          required 
          style={{ padding: '10px' }}
        />
        <button type="submit" disabled={loading} style={{ padding: '10px', cursor: 'pointer' }}>
          {loading ? 'جاري التسجيل...' : 'تسجيل حساب'}
        </button>
      </form>
    </div>
  );
}
