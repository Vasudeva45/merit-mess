// lib/firebase.ts
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyAm3OVtsx419PXIPRRWlgJUtV3IEQKFQIw",
  authDomain: "meritmess-1c297.firebaseapp.com",
  projectId: "meritmess-1c297",
  storageBucket: "meritmess-1c297.firebasestorage.app",
  messagingSenderId: "254413233310",
  appId: "1:254413233310:web:c57658a42db3033604af8f",
  measurementId: "G-6FZBX6LEJ5",
};

export const initFirebase = () => {
  try {
    return getApp();
  } catch {
    return initializeApp(firebaseConfig);
  }
};
