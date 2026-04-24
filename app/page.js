'use client';
import { useState } from 'react';
import AuthModal from '../components/AuthModal';

export default function Home() {
  const [showAuth, setShowAuth] = useState(false);

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      <h1 className="text-6xl font-black text-yellow-500 mb-10">MO CONTROL</h1>
      
      <button 
        onClick={() => setShowAuth(true)}
        className="bg-yellow-600 px-10 py-4 rounded-2xl text-black font-bold text-lg hover:bg-yellow-500 transition-all"
      >
        تسجيل الدخول
      </button>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </main>
  );
}
