import { initializeApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDS5mns-yT4hRJ1Jmr9c0AeBb_QMw4zAbI",
  authDomain: "fitness-website-login.firebaseapp.com",
  projectId: "fitness-website-login",
  storageBucket: "fitness-website-login.firebasestorage.app",
  messagingSenderId: "692761075191",
  appId: "1:692761075191:web:f417d01fc1a286f173a2f2",
  measurementId: "G-9YRVE0Z6RX"
};

let auth: Auth;

// Initialize Firebase only in browser environment
if (typeof window !== 'undefined') {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
}

export { auth };