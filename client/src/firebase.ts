import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDXyFCb3pakPporp1fXA2nGg_sM9FlrOMQ",
    authDomain: "cognipath-c16ea.firebaseapp.com",
    projectId: "cognipath-c16ea",
    storageBucket: "cognipath-c16ea.firebasestorage.app",
    messagingSenderId: "270604373816",
    appId: "1:270604373816:web:9ac438c62350438e2f7bcd"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
