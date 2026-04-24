'use client';
import { useState } from 'react';
import { auth, db } from '@/lib/firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true); // للتبديل بين التسجيل والدخول
  const [formData, setFormData] = useState({ email: '', password: '', name: '', phone: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!isLogin) {
        // تسجيل حساب جديد
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        await setDoc(doc(db, "users", userCredential.user.uid), {
          name: formData.name,
          phone: formData.phone,
          planName: "لم يتم الاشتراك",
          paid: false,
          active: false,
          nextRenewal: "---"
        });
        alert("تم إنشاء حسابك بنجاح!");
      } else {
        // تسجيل الدخول
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        window.location.href = '/dashboard';
      }
    } catch (error) { alert(error.message); }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="bg-gray-900 border border-yellow-600/30 p-8 rounded-3xl w-full max-w-md shadow-[0_0_30px_rgba(202,138,4,0.1)]">
        <h2 className="text-2xl font-bold text-yellow-500 mb-6 text-center">
          {isLogin ? "تسجيل الدخول - MO CONTROL" : "حساب جديد - MO CONTROL"}
        </h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <>
              <input placeholder="الاسم الكامل" className="bg-black p-3 rounded-xl border border-gray-700" onChange={e => setFormData({...formData, name: e.target.value})} />
              <input placeholder="رقم الموبايل" className="bg-black p-3 rounded-xl border border-gray-700" onChange={e => setFormData({...formData, phone: e.target.value})} />
            </>
          )}
          <input type="email" placeholder="البريد الإلكتروني" className="bg-black p-3 rounded-xl border border-gray-700" onChange={e => setFormData({...formData, email: e.target.value})} />
          <input type="password" placeholder="كلمة المرور" className="bg-black p-3 rounded-xl border border-gray-700" onChange={e => setFormData({...formData, password: e.target.value})} />
          
          <button className="bg-yellow-600 text-black font-bold py-3 rounded-xl hover:bg-yellow-500 transition-all">
            {isLogin ? "دخول" : "إنشاء حساب"}
          </button>
        </form>

        <p className="text-gray-400 text-sm mt-4 text-center cursor-pointer" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? "ليس لديك حساب؟ سجل الآن" : "لديك حساب؟ سجل دخولك"}
        </p>
      </div>
    </div>
  );
}
