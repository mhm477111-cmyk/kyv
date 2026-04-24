// 1. استدعاء الدوال المطلوبة من Firebase
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// 2. إعدادات المشروع
const firebaseConfig = {
  apiKey: "AIzaSyDpOVutqknIS9-lf8TM3suaD7aYn00utXQ",
  authDomain: "mo-control-site.firebaseapp.com",
  projectId: "mo-control-site",
  storageBucket: "mo-control-site.firebasestorage.app",
  messagingSenderId: "116572656345",
  appId: "1:116572656345:web:5f4b758daf21a9b7c164c8",
  measurementId: "G-T34HXXMMLD"
};

// 3. تهيئة Firebase (لازم تكون قبل ما تعرف الـ auth والـ db)
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// 4. تصدير الـ auth والـ db لاستخدامهم في الصفحات التانية
export const auth = getAuth(app);
export const db = getFirestore(app);
