'use client';
import { useState } from 'react';
import { auth, db } from '@/lib/firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ phone: '', password: '', name: '' });
  const router = useRouter();

  // تحويل رقم الموبايل إلى إيميل وهمي للتعامل مع Firebase
  const mockEmail = `${formData.phone}@mocontrol.com`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!isLogin) {
        // إنشاء حساب جديد
        const userCredential = await createUserWithEmailAndPassword(auth, mockEmail, formData.password);
        // حفظ بيانات العميل الحقيقية
        await setDoc(doc(db, "users", userCredential.user.uid), {
          name: formData.name,
          phone: formData.phone,
          planName: "غير مشترك",
          paid: false,
          active: false,
          nextRenewal: "---"
        });
        alert("تم إنشاء حسابك بنجاح!");
      } else {
        // تسجيل الدخول بالرقم (المحول لإيميل)
        await signInWithEmailAndPassword(auth, mockEmail, formData.password);
      }
      router.push('/dashboard');
    } catch (error) {
      alert("خطأ: تأكد من الرقم وكلمة المرور.");
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 font-sans">
      <div className="bg-gray-900 border border-yellow-600/30 p-8 rounded-3xl w-full max-w-md shadow-[0_0_30px_rgba(202,138,4,0.1)]">
        <h2 className="text-3xl font-bold text-yellow-500 mb-8 text-center">
          {isLogin ? "دخول MO CONTROL" : "تسجيل جديد"}
        </h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <input 
              placeholder="الاسم الكامل" 
              className="bg-black p-4 rounded-xl border border-gray-700 text-white" 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              required
            />
          )}
          <input 
            type="tel"
            placeholder="رقم الموبايل (01xxxxxxxxx)" 
            className="bg-black p-4 rounded-xl border border-gray-700 text-white" 
            onChange={e => setFormData({...formData, phone: e.target.value})} 
            required
          />
          <input 
            type="password" 
            placeholder="كلمة المرور" 
            className="bg-black p-4 rounded-xl border border-gray-700 text-white" 
            onChange={e => setFormData({...formData, password: e.target.value})} 
            required
          />
          
          <button className="bg-yellow-600 text-black font-bold py-4 rounded-xl hover:bg-yellow-500 transition-all mt-2">
            {isLogin ? "دخول" : "إنشاء الحساب"}
          </button>
        </form>

        <p className="text-gray-400 text-sm mt-6 text-center cursor-pointer" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? "ليس لديك حساب؟" : "لديك حساب بالفعل؟"}
        </p>
      </div>
    </div>
  );
}
