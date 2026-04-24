import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDpOVutqknIS9-lf8TM3suaD7aYn00utXQ",
  authDomain: "mo-control-site.firebaseapp.com",
  projectId: "mo-control-site",
  storageBucket: "mo-control-site.firebasestorage.app",
  messagingSenderId: "116572656345",
  appId: "1:116572656345:web:5f4b758daf21a9b7c164c8",
  measurementId: "G-T34HXXMMLD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// التعديل المهم هنا: بنعمل export عشان الصفحات التانية تقدر تستخدمهم
export const auth = getAuth(app);
export const db = getFirestore(app);
