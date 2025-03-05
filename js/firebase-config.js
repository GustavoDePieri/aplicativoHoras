 
 // Substitua estas configurações pelas suas do projeto Firebase
 const firebaseConfig = {
  apiKey: "AIzaSyBOJitMoSPQtWiYIXsy1T4v814tRLhnS-M",
  authDomain: "aplicativo-registra-horas.firebaseapp.com",
  projectId: "aplicativo-registra-horas",
  storageBucket: "aplicativo-registra-horas.firebasestorage.app",
  messagingSenderId: "509122969210",
  appId: "1:509122969210:web:273660fcb9fd30df04c5c3",
  measurementId: "G-HL98RX8XBG"
};
  

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Adicione este log após a inicialização
console.log('Firebase inicializado:', !!firebase.app());
console.log('Firestore disponível:', !!db);