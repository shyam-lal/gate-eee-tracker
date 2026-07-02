import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBLCwPwqgTUr9bg1d5G9Cj9lp_lsluFjAo",
  authDomain: "gate-tracker-16fb9.firebaseapp.com",
  projectId: "gate-tracker-16fb9",
  storageBucket: "gate-tracker-16fb9.firebasestorage.app",
  messagingSenderId: "340552693026",
  appId: "1:340552693026:web:c21f5b505856c2329ea17b",
  measurementId: "G-3P0EXKMR42"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

auth.onIdTokenChanged(async (user) => {
  if (user) {
    const token = await user.getIdToken();
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
});
