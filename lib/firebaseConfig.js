import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDpOVutqknIS9-lf8TM3suaD7aYn00utXQ",
  authDomain: "mo-control-site.firebaseapp.com",
  projectId: "mo-control-site",
  storageBucket: "mo-control-site.firebasestorage.app",
  messagingSenderId: "116572656345",
  appId: "1:116572656345:web:5f4b758daf21a9b7c164c8",
  measurementId: "G-T34HXXMMLD"
};

const app = initializeApp(firebaseConfig);

// تهيئة الـ Auth مع تفعيل الـ Persistence (حفظ الجلسة)
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error("خطأ في تفعيل الـ Persistence:", error);
  });

export const db = getFirestore(app);

// حل مشكلة الـ Analytics
let analytics;
if (typeof window !== 'undefined') {
  isSupported().then(supported => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}
export { analytics };
