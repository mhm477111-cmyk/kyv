// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // إضافة Firestore

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDyu0whOujr3d5URLtYkXq-WIYZgrdxhtE",
  authDomain: "telecom-4642e.firebaseapp.com",
  projectId: "telecom-4642e",
  storageBucket: "telecom-4642e.firebasestorage.app",
  messagingSenderId: "798988856153",
  appId: "1:798988856153:web:30b0203dc8f35dd4b7ba48",
  measurementId: "G-E8E24J0LDC"
};

// Initialize Firebase (تأكد من عدم تهيئته أكثر من مرة لتجنب الأخطاء)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// تصدير db ليتم استخدامه في باقي الملفات
export const db = getFirestore(app);
