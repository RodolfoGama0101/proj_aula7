import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB3TU6BpIGMqLa8JY9abEHrx0DH2L3ngHY",
  authDomain: "web-mobile-a7.firebaseapp.com",
  projectId: "web-mobile-a7",
  storageBucket: "web-mobile-a7.firebasestorage.app",
  messagingSenderId: "935348669798",
  appId: "1:935348669798:web:d10f65bd8c9ff7dc6a4ca7"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);