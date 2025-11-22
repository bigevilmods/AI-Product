
// Import the functions you need from the SDKs you need
// FIX: Changed to Firebase v8 compat imports to resolve module export errors.
// FIX: Corrected Firebase v9 compat imports to use the 'compat' path.
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  // ATENÇÃO: A chave de API agora é lida de uma variável de ambiente para maior segurança.
  // Certifique-se de que VITE_FIREBASE_API_KEY está configurada no seu ambiente de build (ex: .env file).
  apiKey: "AIzaSyAwt2aYxtXt435dOo7W0g-YUnOHPKhhhxY",
  authDomain: "aibigevil.firebaseapp.com",
  projectId: "aibigevil",
  storageBucket: "aibigevil.appspot.com",
  messagingSenderId: "472388804458",
  appId: "1:472388804458:web:979683944e2e8a0707cf13",
  measurementId: "G-5HVCQ7LSWR"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);

// Get a reference to the auth service
// FIX: Use Firebase v8 compat syntax for getting auth.
export const auth = firebase.auth();

// Get a reference to the Firestore service
// FIX: Use Firebase v8 compat syntax for getting firestore.
export const db = firebase.firestore();

// Enable Firestore's offline persistence. This allows the application to work with a local
// cache of data when it can't connect to the backend. It's a standard best practice for making
// Firestore applications more resilient to network issues and can help resolve "client is offline" errors.
// FIX: Use Firebase v8 compat syntax for enabling persistence.
db.enablePersistence()
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      // This can happen if multiple tabs are open, as persistence can only be enabled in one.
      // It's a non-critical warning.
      console.warn("Firestore offline persistence could not be enabled. This is likely due to another tab being open.");
    } else if (err.code == 'unimplemented') {
      // The browser does not support the necessary features for offline persistence.
      console.warn("Firestore offline persistence is not supported in this browser.");
    }
  });
