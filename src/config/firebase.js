import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// Configuração do Firebase - substitua pelas suas credenciais
const firebaseConfig = {
  apiKey: "AIzaSyChU_cHC4ySIMuCKoHE04cvYXHKqq9jjUA",
  authDomain: "serrah-rifas.firebaseapp.com",
  projectId: "serrah-rifas",
  storageBucket: "serrah-rifas.firebasestorage.app",
  messagingSenderId: "965693456570",
  appId: "1:965693456570:web:f6ddf2b5a42ad8dfb90283"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar serviços
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

// Conectar aos emuladores em desenvolvimento (opcional)
if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_EMULATORS === 'true') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectFunctionsEmulator(functions, 'localhost', 5001);
  } catch (error) {
    console.log('Emuladores já conectados ou não disponíveis');
  }
}

export default app;
