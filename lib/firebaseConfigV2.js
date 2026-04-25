// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDyu0whOujr3d5URLtYkXq-WIYZgrdxhtE",
  authDomain: "telecom-4642e.firebaseapp.com",
  projectId: "telecom-4642e",
  storageBucket: "telecom-4642e.firebasestorage.app",
  messagingSenderId: "798988856153",
  appId: "1:798988856153:web:30b0203dc8f35dd4b7ba48",
  measurementId: "G-E8E24J0LDC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
