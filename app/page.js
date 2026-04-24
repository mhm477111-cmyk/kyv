'use client';
import { useState } from 'react';
import AuthModal from './components/AuthModal';

export default function Home() {
  const [showAuth, setShowAuth] = useState(false);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center text-white">
      <h1 className="text-6xl font-black text-yellow-500 mb-8 tracking-tighter">MO CONTROL</h1>
      
      <button 
        onClick={() => setShowAuth(true)}
        className="bg-yellow-600 px-10 py-5 rounded-2xl text-black font-bold text-xl hover:bg-yellow-500 transition-all shadow-[0_0_20px_rgba(202,138,4,0.3)]"
      >
        دخول العملاء
      </button>

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
