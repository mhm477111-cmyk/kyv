'use client';
import { useRouter } from 'next/navigation';

export default function DeletedAccount() {
  const router = useRouter();
  const adminWhatsApp = "201112893086"; // ضع رقمك هنا (بدون صفر البداية)
  const message = "مرحباً، تم إيقاف حسابي وأحتاج للمساعدة بخصوص MO CONTROL.";

  const handleWhatsApp = () => {
    // فتح الواتساب في تاب جديدة
    window.open(`https://wa.me/${adminWhatsApp}?text=${encodeURIComponent(message)}`, '_blank');
    // تحويل الصفحة الحالية للرئيسية
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
      <div className="bg-gray-900 border border-red-600 p-8 rounded-3xl max-w-md w-full">
        <h2 className="text-3xl font-bold text-red-500 mb-6">لقد تم حذف حسابك</h2>
        <p className="text-gray-300 mb-8">عذراً، تم حذف حسابك من قبل الإدارة ولا يمكنك الوصول للوحة التحكم.</p>
        
        <div className="flex flex-col gap-4">
          <button 
            onClick={handleWhatsApp} 
            className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-500 transition"
          >
            تواصل مع الإدارة 💬
          </button>
          <button 
            onClick={() => router.push('/')} 
            className="w-full bg-gray-700 text-white py-3 rounded-xl font-bold hover:bg-gray-600 transition"
          >
            العودة للصفحة الرئيسية
          </button>
        </div>
      </div>
    </div>
  );
}