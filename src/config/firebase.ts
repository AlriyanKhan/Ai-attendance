import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

// Log environment variables to help debug
console.log("API Key from env:", import.meta.env.VITE_FIREBASE_API_KEY);
console.log("Auth Domain from env:", import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);

// Using direct values since environment variables aren't loading correctly
const firebaseConfig = {
  apiKey: "AIzaSyAsVSzkz4QHRYAcAzLWksKIXtctc4CVqmk",
  authDomain: "ai-attendance-c2c75.firebaseapp.com",
  projectId: "ai-attendance-c2c75",
  storageBucket: "ai-attendance-c2c75.firebasestorage.app",
  messagingSenderId: "372950559266",
  appId: "1:372950559266:web:af852006c5f13db6e7387b"
};

// Log the full config to help debug
console.log("Firebase Config:", firebaseConfig);

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Storage
export const storage = getStorage(app);

// Initialize Authentication with debug info
console.log("Initializing Firebase Auth...");
const auth = getAuth(app);
console.log("Firebase Auth initialized successfully");

export { auth };
export default app; 