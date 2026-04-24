'use client';
import { useState } from 'react';
import { auth, db } from '@/lib/firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function AuthModal() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ phone: '', password: '', name: '' });
  const router = useRouter();
  const mockEmail = `${formData.phone}@mocontrol.com`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!isLogin) {
        const userCredential = await createUserWithEmailAndPassword(auth, mockEmail, formData.password);
        await setDoc(doc(db, "users", userCredential.user.uid), {
          name: formData.name, phone: formData.phone, planName: "غير مشترك", paid: false, active: false, nextRenewal: "---"
        });
      } else {
        await signInWithEmailAndPassword(auth, mockEmail, formData.password);
      }
      router.push('/dashboard');
    } catch (error) { alert("خطأ في البيانات: تأكد من الرقم وكلمة المرور"); }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900 p-8 rounded-3xl border border-yellow-600/30 w-full shadow-2xl">
      <h2 className="text-2xl font-bold text-yellow-500 mb-6 text-center">{isLogin ? "دخول MO CONTROL" : "تسجيل جديد"}</h2>
      
      {!isLogin && (
        <input placeholder="الاسم الكامل" className="w-full bg-black p-4 mb-4 rounded-xl border border-gray-700 text-white" onChange={e => setFormData({...formData, name: e.target.value})} required />
      )}
      
      <input type="tel" placeholder="رقم الموبايل" className="w-full bg-black p-4 mb-4 rounded-xl border border-gray-700 text-white" onChange={e => setFormData({...formData, phone: e.target.value})} required />
      
      <input type="password" placeholder="كلمة المرور" className="w-full bg-black p-4 mb-6 rounded-xl border border-gray-700 text-white" onChange={e => setFormData({...formData, password: e.target.value})} required />
      
      <button className="w-full bg-yellow-600 text-black font-bold py-4 rounded-xl hover:bg-yellow-500 transition-all">
        {isLogin ? "دخول" : "إنشاء حساب"}
      </button>
      
      <p className="text-gray-400 text-sm mt-6 text-center cursor-pointer hover:text-white" onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? "ليس لديك حساب؟ سجل الآن" : "لديك حساب بالفعل؟ سجل دخولك"}
      </p>
    </form>
  );
}
