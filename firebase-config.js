// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA00GkhZNunKF1511HlWhbI4MiwA8Iwu1Q",
  authDomain: "internjapanese.firebaseapp.com",
  databaseURL: "https://internjapanese-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "internjapanese",
  storageBucket: "internjapanese.firebasestorage.app",
  messagingSenderId: "414738503770",
  appId: "1:414738503770:web:eae9304e9c9e1337d46063",
  measurementId: "G-59ZWV7Y5Y3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);