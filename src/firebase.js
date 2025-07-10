// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // 🔄 Firestore au lieu de Realtime

const firebaseConfig = {
  apiKey: "AIzaSyBg4TA9l8AbJU2e_Gn7Qi_Cd1ugjlfy2SM",
  authDomain: "planning-master-pro.firebaseapp.com",
  projectId: "planning-master-pro",
  storageBucket: "planning-master-pro.appspot.com",
  messagingSenderId: "676881441699",
  appId: "1:676881441699:web:5e955d668e6fa8d1f77016"
  // ❌ Pas de databaseURL ici pour Firestore
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
