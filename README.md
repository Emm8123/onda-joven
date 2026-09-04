# Onda Joven — Sitio web con panel de administración (Firebase)

Sitio web del grupo musical **Onda Joven** con un panel de administración oculto para que el dueño gestione el contenido (fotos, redes sociales, repertorio, servicios, historia, ubicación con Google Maps) y contactos vía **WhatsApp**.

- **Base de datos:** Firebase (Firestore + Storage)
- **Alojamiento:** Netlify (archivos estáticos, no requiere backend)
- **Idioma:** Español

---

## Estructura del proyecto

```
onda-joven-firebase/
├── public/                     <- Carpeta que se sube a Netlify
│   ├── index.html              <- Pagina principal
│   ├── app.js                  <- Logica publica (carga de datos + render defensivo)
│   ├── admin.js                <- Panel de administracion (login + CRUD + fotos)
│   ├── firebase-config.js      <- Configuracion de Firebase y contrasena (COMPLETAR)
│   └── logo.jpeg               <- Logo del grupo
├── firestore.rules             <- Reglas de seguridad Firestore
├── storage.rules               <- Reglas de seguridad Storage
└── README.md                   <- Esta guia
```

### Buena arquitectura (importante)
- El JS está **dividido en módulos** (`app.js` para lo público, `admin.js` para el panel).
- Cada sección de la página se renderiza con **try/catch por separado** (`renderAll` usa la función `safe()`). Si falla una sección (p.ej. la galería), **las demás se siguen mostrando** y la página nunca se cae.
- **Fotos en buena calidad sin frenar la página:** al subir una foto se generan dos versiones:
  - **Thumbnail comprimido** (máx. 900px) → se usa en la grilla de la galería (carga rápida).
  - **Original en alta resolución** → se usa cuando se amplía en el visor (lightbox).
  - Todas las imágenes de la galería usan `loading="lazy"`, `decoding="async"` y `onerror` con respaldo.

---

## PASO 1 — Crear el proyecto en Firebase

1. Entra a https://console.firebase.google.com y crea un proyecto llamado `onda-joven`.
2. Ve a **Configuración del proyecto → General → Tus apps** y haz clic en **"Agregar app"** → elige **Web** (ícono `</>`).
   - Ponle un nombre, p.ej. `onda-joven-web`. No es necesario hosting por aquí.
   - Copia el objeto `firebaseConfig` que te muestra.
3. Abre `public/firebase-config.js` y **pega** tus valores en las comillas:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "onda-joven",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

4. En ese mismo archivo cambia la contraseña del panel:

```js
const ADMIN_PASSWORD = "escribeUnaContrasenaSegura";
```

---

## PASO 2 — Habilitar los servicios en Firebase

### Cloud Firestore (base de datos)
1. En el menú lateral: **Build → Firestore Database → Crear base de datos**.
2. Elige **Modo de prueba** (temporal) y una ubicación cercana (ej. `nam5` / `us-central`).
3. **IMPORTANTE:** luego aplica las reglas de seguridad. Crea un archivo `firestore.rules` local con este contenido (o pégalo en la pestaña *Rules* de la consola):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /config/{doc}        { allow read: if true;  allow write: if request.auth != null; }
    match /photos/{photo}      { allow read: if true;  allow write: if request.auth != null; }
  }
}
```

*(El archivo `firestore.rules` de este proyecto ya lo incluye.)*

### Storage (para las fotos)
1. En el menú: **Build → Storage → Empezar**.
2. Acepta el bucket por defecto.
3. Aplica estas reglas en la pestaña *Rules* (ya están en `storage.rules`):

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /fotos/{allPaths=**} { allow read: if true;  allow write: if request.auth != null; }
    match /{allPaths=**}       { allow read, write: if request.auth != null; }
  }
}
```

### Authentication (para que el panel pueda escribir)
En **Build → Authentication → Empezar**, habilita el proveedor **Anónimo** (*Sign-in method* → Anonymous → Habilitar). Es necesario para que las reglas de `request.auth != null` funcionen al guardar desde el panel.

---

## PASO 3 — Probar en tu computadora (opcional)

Abre `public/index.html` directamente en el navegador (doble clic). Como Firebase aún no tiene datos, verás el diseño con textos por defecto. El panel se abre con el botón de **engranaje** (abajo a la derecha) usando la contraseña de `firebase-config.js`.

---

## PASO 4 — Publicar en Netlify

1. Crea una cuenta en https://app.netlify.com.
2. Arrastra y suelta la carpeta **`public`** en el panel de Netlify (método más simple).
   - O usa **Deploy manually → Drag and drop**.
3. Netlify generará una URL tipo `https://onda-joven.netlify.app`.

Con eso la página ya está en línea. El dueño entra al panel con el botón de engranaje **en la URL publicada** y la contraseña que definió.

---

## Uso del panel de administración

1. Abre la URL del sitio publicada.
2. Haz clic en el **engranaje** (abajo a la derecha).
3. Ingresa la **contraseña** de `firebase-config.js`.
4. Desde ahí podrás:
   - Editar nombre, frase y descripción del inicio (hero).
   - Configurar **redes sociales** (Facebook, Instagram, YouTube, Spotify, TikTok).
   - **Subir fotos** (se crea automáticamente la versión comprimida para que la página sea rápida).
   - Configurar **ubicación** de Google Maps, teléfono, **WhatsApp** y email.
   - Editar la **historia**, el **repertorio**, los **servicios** y los **testimonios**.

### Contacto por WhatsApp
- El **botón verde flotante** (abajo a la izquierda) y el número de contacto abren WhatsApp con el mensaje:
  > "Hola, quiero hacer una consulta para contratar al grupo musical"
- El número por defecto es `0971 820 528` y se puede cambiar desde el panel (campo **WhatsApp**).

---

## Notas de seguridad

- El panel usa una contraseña definida en el código del cliente (`ADMIN_PASSWORD`). Esto es una protección **superficial**: quien revise el código fuente del sitio podrá verla. Para una protección real, se recomienda migrar a **Firebase Authentication** con email/contraseña y quitar la comparación de `ADMIN_PASSWORD`. Este proyecto ya está preparado para escribir con usuarios autenticados (usa Firebase Auth anónimo tras validar la contraseña).
- Las reglas de Firestore/Storage permiten **lectura pública** (necesaria para que el sitio muestre el contenido) y **escritura solo a usuarios autenticados**.
