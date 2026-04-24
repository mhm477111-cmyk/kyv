'use client';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebaseConfig';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const querySnapshot = await getDocs(collection(db, "users"));
      setUsers(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchUsers();
  }, []);

  const togglePaidStatus = async (userId, currentStatus) => {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { paid: !currentStatus });
    // تحديث القائمة محلياً بعد التعديل
    setUsers(users.map(u => u.id === userId ? { ...u, paid: !currentStatus } : u));
  };

  return (
    <div className="p-8 bg-gray-950 min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-6">لوحة تحكم الإدارة - MO CONTROL</h1>
      <div className="grid gap-4">
        {users.map(user => (
          <div key={user.id} className="bg-gray-900 p-4 rounded-xl flex justify-between items-center border border-gray-800">
            <div>
              <p className="font-bold">{user.name}</p>
              <p className="text-gray-400 text-sm">{user.phone} - {user.planName}</p>
            </div>
            <button 
              onClick={() => togglePaidStatus(user.id, user.paid)}
              className={`px-4 py-2 rounded-lg ${user.paid ? 'bg-green-600' : 'bg-yellow-600'}`}
            >
              {user.paid ? 'تم الدفع' : 'لم يتم الدفع'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
