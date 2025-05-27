
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyAdNPvbrX4RzaF-j-AbStaCNbHBBbTXuBE",
  authDomain: "business-directory-cff2a.firebaseapp.com",
  projectId: "business-directory-cff2a",
  storageBucket: "business-directory-cff2a.appspot.com",
  messagingSenderId: "738676480865",
  appId: "1:738676480865:web:ef5511d034ddf6d4300320",
  measurementId: "G-1EFF221J08"
};

// Initialize Firebase app (singleton pattern)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firestore only (no Auth)
const db = getFirestore(app);

export { app, db };
