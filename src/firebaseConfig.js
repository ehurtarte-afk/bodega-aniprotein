// ============================================================
// PEGA AQUÍ TU CONFIGURACIÓN DE FIREBASE (la consigues gratis
// en https://console.firebase.google.com)
//
// Pasos:
// 1. Entra a console.firebase.google.com con tu cuenta de Google
// 2. "Agregar proyecto" -> ponle un nombre, ej. "bodega-aniprotein"
// 3. Dentro del proyecto, ve a "Realtime Database" -> "Crear base de datos"
//    -> elige modo de PRUEBA (test mode) por ahora
// 4. Ve a Configuración del proyecto (ícono de engrane) -> "Tus apps"
//    -> click en el ícono "</>" (Web) -> regístrala con cualquier nombre
// 5. Te va a mostrar un bloque de código "firebaseConfig" con varios
//    valores (apiKey, authDomain, databaseURL, etc.) -> copia esos
//    valores y pégalos abajo, reemplazando los de ejemplo.
// ============================================================

export const firebaseConfig = {
  apiKey: "AIzaSyBbJjdiqorJy2mhRWB_-Lj7xnj1_GnJCpw",
  authDomain: "cedianiproteinguatemala.firebaseapp.com",
  databaseURL: "https://cedianiproteinguatemala-default-rtdb.firebaseio.com",
  projectId: "cedianiproteinguatemala",
  storageBucket: "cedianiproteinguatemala.firebasestorage.app",
  messagingSenderId: "166684623701",
  appId: "1:166684623701:web:7e887af14a3257a2a8a5dc",
};

// Si dejaste los valores de ejemplo (sin configurar Firebase todavía),
// la app sigue funcionando en modo local (localStorage) automáticamente.
export const firebaseEnabled = !firebaseConfig.apiKey.startsWith("PEGA_AQUI");
