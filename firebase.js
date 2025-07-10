// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBg4T A918AbJU2e_Gn7Qi_Cd1ugj1fy2SM",
  authDomain: "planning-master-pro.firebaseapp.com",
  projectId: "planning-master-pro",
  storageBucket: "planning-master-pro.appspot.com",
  messagingSenderId: "676884141699",
  appId: "1:676884141699:web:5e955d668e6fa8d1f77016"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default db;
