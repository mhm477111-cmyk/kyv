'use client';
import { useState } from 'react';
import AuthModal from './components/AuthModal';

export default function Home() {
  const [showAuth, setShowAuth] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-yellow-600">
      
      {/* Navbar بسيط فيه زرار الدخول */}
      <nav className="p-6 flex justify-between items-center border-b border-yellow-600/20">
        <h1 className="text-2xl font-black text-yellow-500">MO CONTROL</h1>
        <button 
          onClick={() => setShowAuth(true)}
          className="bg-gray-900 border border-yellow-600/50 px-6 py-2 rounded-xl text-yellow-500 font-bold hover:bg-yellow-600 hover:text-black transition-all"
        >
          تسجيل الدخول
        </button>
      </nav>

      {/* واجهة الموقع (محتوى الصورة اللي بعتها) */}
      <main className="flex flex-col items-center justify-center p-6 text-center mt-10">
        <h2 className="text-5xl md:text-7xl font-black mb-6">MO CONTROL</h2>
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-10">
          <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800">تفعيل فوري ⚡</div>
          <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800">حماية فائقة 🛡️</div>
        </div>

        <button className="bg-yellow-600 text-black font-black text-xl px-12 py-6 rounded-3xl w-full max-w-sm shadow-[0_0_30px_rgba(202,138,4,0.3)] hover:scale-105 transition-all">
          حمل تطبيق MO CONTROL 📱
        </button>
      </main>

      {/* الـ Modal بتاع تسجيل الدخول */}
      {showAuth && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="relative w-full max-w-md">
            <button 
              onClick={() => setShowAuth(false)} 
              className="absolute -top-10 right-0 text-white hover:text-red-500"
            >
              إغلاق ✕
            </button>
            <AuthModal />
          </div>
        </div>
      )}
    </div>
  );
}
