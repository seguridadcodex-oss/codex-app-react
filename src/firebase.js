import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCMaTa30Wr9sN0gljb5DgS9eSR14pFGrUk",
  authDomain: "apps-cm.firebaseapp.com",
  projectId: "apps-cm",
  storageBucket: "apps-cm.firebasestorage.app",
  messagingSenderId: "22867806679",
  appId: "1:22867806679:web:79126ccf611837a310a392"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
