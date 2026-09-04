# Onda Joven — Sitio web con panel de administración

Sitio web del grupo musical **Onda Joven** con un panel de administración independiente para que el dueño edite **todo** el contenido: nombre, héroe, historia, redes sociales, fotos, repertorio, servicios, ubicación (Google Maps) y contactos (WhatsApp). Todo **publicable para todos los visitantes** en 1-2 minutos, sin Firebase.

- **Alojamiento:** GitHub Pages (`https://emm8123.github.io/onda-joven/`)
- **Panel:** `https://emm8123.github.io/onda-joven/admin.html` — contraseña en `firebase-config.js`
- **Guardado en la nube:** cada "Guardar" del panel publica `data.json` al repo vía la API de GitHub; GitHub Pages lo redistribuye automáticamente.
- **Idioma:** Español

---

## Estructura del proyecto

```
onda-joven-firebase/
├── index.html            <- Página principal
├── app.js                <- Lógica pública (carga de data.json + render defensivo)
├── admin.html            <- Panel de administración independiente
├── admin.js              <- Lógica del panel (login + edición + publicación GitHub)
├── firebase-config.js    <- Configuración (contraseña + token de GitHub)
├── data.json             <- Contenido publicado por el panel (se genera solo)
├── _nojekyll             <- Evita que Jekyll interfiera en GitHub Pages
├── firestore.rules       <- Reglas Firestore (solo si algún día se usa Firebase)
├── storage.rules         <- Reglas Storage (solo si algún día se usa Firebase)
└── README.md             <- Esta guía
```

### Características de la arquitectura
- El JS está **dividido en módulos** (`app.js` para lo público, `admin.js` para el panel).
- Cada sección se renderiza con **try/catch por separado** (`safe()`): si una falla, las demás siguen visibles.
- **Fotos sin frenar la página:** al subir una foto se genera el **thumbnail comprimido** (máx. 900px) para la grilla y se usa el **original** solo al ampliar. La galería usa `loading="lazy"`, `decoding="async"` y `onerror` con respaldo.
- **El panel nunca se cuelga:** todo `saveConfig()` responde siempre con un mensaje (con timeout), aunque la red falle.

---

## Cómo funciona el guardado (importante)

- Cuando el dueño pulsa cualquier **Guardar / Agregar** en el panel:
  1. Se guarda al instante en el **localStorage** del navegador (cambios visibles de inmediato en ese dispositivo).
  2. Se **publica `data.json` al repositorio** de GitHub usando la API.
  3. GitHub Pages reconstruye y los cambios quedan visibles para **todos los visitantes en 1-2 minutos**.

El sitio público lee primero el `data.json` publicado y luego pisa con el respaldo local del dispositivo.

---

## PASO 1 — Configurar el token de GitHub (el panel publica)

Abre `firebase-config.js` y comprueba esta sección:

```js
window.GITHUB_OWNER = 'Emm8123';
window.GITHUB_REPO = 'onda-joven';
window.GITHUB_TOKEN = 'ghp_...';
```

**Recomendado (seguro):** crea un token con permiso SOLO de este repositorio, así si alguien lo ve no puede tocar tus otros proyectos:

1. GitHub → avatar → **Settings → Developer settings → Fine-grained tokens → Generate new token**.
2. **Repository access:** *Only selected repositories* → `Emm8123/onda-joven`.
3. **Permissions → Contents:** *Read and write*.
4. **Generate token** y pega el resultado en `window.GITHUB_TOKEN`.

> Nota de seguridad: ese token queda visible para quien abra el sitio. Por eso conviene el token *fine-grained* restringido a este único repo.

---

## PASO 2 — Contraseña del panel

En el mismo `firebase-config.js`:

```js
window.ADMIN_PASSWORD = "escribeUnaContrasenaSegura";
```

---

## PASO 3 — Entrar al panel

1. Abre `https://emm8123.github.io/onda-joven/admin.html`.
2. Escribe la **contraseña** de `firebase-config.js` y pulsa **Entrar**.
3. Desde ahí puedes editar **absolutamente todo**:
   - **Información principal:** nombre del grupo, frase y descripción del hero.
   - **Redes sociales:** Facebook, Instagram, YouTube, Spotify, TikTok.
   - **Fotos:** arrastrar/drop o clic; se elige categoría (Integrantes, Conciertos, Eventos…) y se genera la miniatura automáticamente. También se pueden **eliminar** (se borran del repo).
   - **Ubicación y contacto:** texto, query de Google Maps, teléfono, WhatsApp, email.
   - **Historia** (Quiénes somos).
   - **Repertorio:** agrega canciones por categoría (Polkas, Cumbias, Sertanejo/Música Brasileña, etc.) y elimina las que quieras.
   - **Servicios:** agrega/elimina los lugares donde tocan (Casamientos, Quinceañeras, Festivales…).
4. Cada botón de guardar muestra el resultado: publicado para todos (1-2 min) o guardado solo en el navegador si falló la conexión.

---

## PASO 4 — Probar en tu computadora (opcional)

```bash
node server.js
```

Abre `http://localhost:3000`. El panel: `http://localhost:3000/admin.html`.

---

## Notas de seguridad

- La contraseña del panel vive en el código del cliente: quien revise el código fuente del sitio podrá verla. Es una protección **superficial** pensada para que el dueño gestione su propio contenido; para protección real se migraría a autenticación con servicio (por ejemplo Firebase Auth).
- El token de GitHub es lo que permite publicar. Mantenelo con los **menores permisos posibles** (solo `Contents: Read and write` en este repo).
- Las reglas `firestore.rules` / `storage.rules` solo aplican si algún día se opta por Firebase; actualmente **no se usa Firebase** y el sitio no depende de él.