import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDmswta8SbSLrQRMRVWMsEnrVxm8Map-8w",
  authDomain: "invoice-qpp.firebaseapp.com",
  projectId: "invoice-qpp",
  storageBucket: "invoice-qpp.firebasestorage.app",
  messagingSenderId: "1073315023197",
  appId: "1:1073315023197:web:527ca2c1b2382b604e80b4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
