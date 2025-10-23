import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyDVzAzEpC9EEW3x9uUyuyV7gDmE5gvU8BA",
  authDomain: "pharma-stock-61186.firebaseapp.com",
  projectId: "pharma-stock-61186",
  storageBucket: "pharma-stock-61186.firebasestorage.app",
  messagingSenderId: "563873474094",
  appId: "1:563873474094:web:4b58acb1c9151e62bc21bf",
  measurementId: "G-PKX9K1Z8EV",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export { db, auth };
