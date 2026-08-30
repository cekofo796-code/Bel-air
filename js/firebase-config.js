/* ============================================================
   BEL-AIR — FIREBASE-CONFIG.JS
   Initialisation de Firebase (Firestore + Authentication).
   Ce fichier doit être chargé APRÈS les scripts Firebase (CDN)
   et AVANT tous les autres scripts du site (config.js, main.js...).
   ============================================================ */

const firebaseConfig = {
  apiKey: "AIzaSyDgM3afUu6zMEKm6ZMGhQ6x9lkfOsQj2S0",
  authDomain: "bel-air-shop-1ea5d.firebaseapp.com",
  projectId: "bel-air-shop-1ea5d",
  storageBucket: "bel-air-shop-1ea5d.firebasestorage.app",
  messagingSenderId: "656642681747",
  appId: "1:656642681747:web:9651a24b7a4734c224d666",
  measurementId: "G-JRNGCLMFTV"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const auth = firebase.auth();
