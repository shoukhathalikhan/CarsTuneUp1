import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyA2Ja4MTY-A2LE9vUyHWY6Z2LIQgrOY4x4',
  authDomain: 'carztuneup.firebaseapp.com',
  projectId: 'carztuneup',
  storageBucket: 'carztuneup.firebasestorage.app',
  messagingSenderId: '139313575789',
  appId: '1:139313575789:web:8c7599ab73b6dc53180c64',
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const db = getFirestore(app);
