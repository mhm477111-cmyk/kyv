'use client';
import { useState } from 'react';
import { auth, db } from '../../lib/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      // 1. إنشاء الحساب في Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. إنشاء مستند للعميل في Firestore (عشان نحفظ فيه بيانات الباقة لاحقاً)
      await setDoc(doc(db, "users", user.uid), {
        email: email,
        planDetails: { name: "غير محدد", expiryDate: "لم يتم التفعيل" },
        paymentStatus: { totalAmount: 0, paidAmount: 0 }
      });

      alert("تم إنشاء حسابك بنجاح في MO CONTROL!");
    } catch (error) {
      alert("حدث خطأ: " + error.message);
    }
  };

  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>إنشاء حساب عميل جديد</h1>
      <form onSubmit={handleRegister}>
        <input type="email" placeholder="البريد الإلكتروني" onChange={(e) => setEmail(e.target.value)} required />
        <br /><br />
        <input type="password" placeholder="كلمة السر" onChange={(e) => setPassword(e.target.value)} required />
        <br /><br />
        <button type="submit">تسجيل</button>
      </form>
    </div>
  );
}
