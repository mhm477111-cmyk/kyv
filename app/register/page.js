'use client';
import { useState } from 'react';
import { auth, db } from '@/lib/firebaseConfig'; // اتأكد إن ده مسار ملف الـ config عندك
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. إنشاء الحساب
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. إنشاء بيانات العميل في Firestore
      await setDoc(doc(db, "users", user.uid), {
        email: email,
        planDetails: { name: "باقة أساسية", expiryDate: "لم يتم التفعيل" },
        paymentStatus: { totalAmount: 0, paidAmount: 0 }
      });

      alert("تم إنشاء حسابك بنجاح في MO CONTROL!");
    } catch (error) {
      alert("حدث خطأ: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>إنشاء حساب عميل جديد</h1>
      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          type="email" 
          placeholder="البريد الإلكتروني" 
          value={email}
          onChange={(e) => setEmail(e.target.value)} 
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
