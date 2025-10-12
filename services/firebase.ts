import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Hardcoded Firebase configuration as per user request.
// This resolves runtime errors when environment variables are not available.
const firebaseConfig = {
  apiKey: "AIzaSyCJsXTXTKuyJAkc4JihBZz5vtxemIRJ4V0",
  authDomain: "qlda-npsc.firebaseapp.com",
  projectId: "qlda-npsc",
  storageBucket: "qlda-npsc.appspot.com",
  messagingSenderId: "212193217563",
  appId: "1:212193217563:web:ebb6d95b6fa9afd42cbcbe",
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };