// ============================================================
// CONFIGURACION DE FIREBASE
// ============================================================
// 1. Ve a https://console.firebase.google.com y crea un proyecto:
//    - Nombre: onda-joven
// 2. En "Agrega una app" elige la opcion Web (</>) con un nombre,
//    EJ: "onda-joven-web". Copia el objeto firebaseConfig de abajo.
// 3. Pega el objeto firebaseConfig en las comillas de abajo.
// ============================================================

const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto-id.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};

// ============================================================
// EXPONE la configuracion en una variable global segura.
// FIREBASE_CONFIGURED es true SOLO cuando pusiste valores reales.
// Mientras esten los placeholders (TU_/tu-), la pagina NO intenta
// conectar con Firebase: se evita el cuelgue y la lentitud.
// ============================================================
window.firebaseConfig = firebaseConfig;
window.FIREBASE_CONFIGURED = !!(firebaseConfig.apiKey && firebaseConfig.apiKey.indexOf('TU_') !== 0 && firebaseConfig.projectId && firebaseConfig.projectId.indexOf('tu-') !== 0 && firebaseConfig.appId && firebaseConfig.appId.indexOf('TU_') !== 0);

// ============================================================
// CONFIGURACION GITHUB (modo nube SIN Firebase)
// ============================================================
// Con esto el ADMIN puede publicar el contenido para TODOS los
// visitantes: cada "Guardar" sube data.json al repo y GitHub
// Pages lo publica en 1-2 minutos.
//
// El TOKEN NO va en este archivo (GitHub bloquea subir secretos y
// ademas quedaria visible para cualquiera). Se pega UNA vez en la
// pantalla de login del panel (campo "Token de GitHub") y se guarda
// solo en el navegador del dueño.
//
// Como crearlo (recomendado, con permiso SOLO de este repo):
//   GitHub > Settings > Developer settings > Fine-grained tokens
//   > Generate new token > Repository access: ONLY (Emm8123/onda-joven)
//   > Permissions > Contents: Read and write > Generate token
window.GITHUB_OWNER = 'Emm8123';
window.GITHUB_REPO = 'onda-joven';
window.GITHUB_TOKEN = '';

// ============================================================
// CONTRASENA DEL PANEL DE ADMINISTRACION
// ============================================================
// Escribe aqui la contrasena que quieras usar para entrar al panel
// de administracion de Onda Joven.
// ============================================================
// Nota: se define como variable global (window.ADMIN_PASSWORD) para que
// admin.js pueda leerla. NUNCA la pongas dentro de un objeto firebaseConfig
// publico, porque quedaria visible para cualquiera.
window.ADMIN_PASSWORD = "ARMIN12345";