'use client';
import { useState } from 'react';
import { auth } from '@/lib/firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // بنحول رقم الموبايل لإيميل وهمي عشان Firebase
      const fakeEmail = `${phone}@mocontrol.com`;
      await signInWithEmailAndPassword(auth, fakeEmail, password);
      alert("تم تسجيل الدخول بنجاح! أهلاً بك في MO CONTROL");
      // ممكن توجهه لصفحة الـ dashboard هنا لو عايز
    } catch (error) {
      alert("خطأ في تسجيل الدخول: تأكد من الرقم وكلمة السر");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', textAlign: 'center' }}>
      <h1>دخول MO CONTROL</h1>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input 
          type="text" 
          placeholder="رقم الموبايل" 
          onChange={(e) => setPhone(e.target.value)} 
          required 
          style={{ padding: '10px' }}
        />
        <input 
          type="password" 
          placeholder="كلمة السر" 
          onChange={(e) => setPassword(e.target.value)} 
          required 
          style={{ padding: '10px' }}
        />
        <button type="submit" disabled={loading} style={{ padding: '10px' }}>
          {loading ? 'جاري الدخول...' : 'دخول'}
        </button>
      </form>
    </div>
  );
}
