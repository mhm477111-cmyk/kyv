'use client';
import { useState } from 'react';
import { auth } from '@/lib/firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation'; // 1. أضف هذا السطر

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter(); // 2. أضف هذا السطر

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fakeEmail = `${phone}@mocontrol.com`;
      await signInWithEmailAndPassword(auth, fakeEmail, password);
      
      // 3. التوجيه للوحة التحكم بعد النجاح
      router.push('/dashboard'); 
      
    } catch (error) {
      alert("خطأ في تسجيل الدخول: تأكد من الرقم وكلمة السر");
    } finally {
      setLoading(false);
    }
  };

  return (
    // ... (باقي الكود زي ما هو)
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
