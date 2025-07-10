// src/firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database"; // <-- important

const firebaseConfig = {
  apiKey: "AIzaSyBg4TA9l8AbJU2e_Gn7Qi_Cd1ugjlfy2SM",
  authDomain: "planning-master-pro.firebaseapp.com",
  projectId: "planning-master-pro",
  storageBucket: "planning-master-pro.firebasestorage.app",
  messagingSenderId: "676881441699",
  appId: "1:676881441699:web:5e955d668e6fa8d1f77016",
  databaseURL: "https://planning-master-pro-default-rtdb.europe-west1.firebasedatabase.app" // <-- ajoute bien cette ligne
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database };
