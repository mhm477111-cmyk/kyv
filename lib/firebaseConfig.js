// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const analytics = getAnalytics(app);
