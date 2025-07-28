import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey:
    process.env.REACT_APP_FIREBASE_API_KEY ||
    "AIzaSyDVzAzEpC9EEW3x9uUyuyV7gDmE5gvU8BA",
  authDomain:
    process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ||
    "pharma-stock-61186.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "pharma-stock-61186",
  storageBucket:
    process.env.REACT_APP_FIREBASE_STORAGE_BUCKET ||
    "pharma-stock-61186.firebasestorage.app",
  messagingSenderId:
    process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "563873474094",
  appId:
    process.env.REACT_APP_FIREBASE_APP_ID ||
    "1:563873474094:web:4b58acb1c9151e62bc21bf",
  measurementId:
    process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-PKX9K1Z8EV",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
