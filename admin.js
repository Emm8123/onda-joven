// ============================================================
// ONDA JOVEN - admin.js (STANDALONE)
// Panel de administracion independiente.
// Funciona SIN app.js — inicializa Firebase directamente.
// ============================================================
(function () {
    'use strict';

    function $(id) { return document.getElementById(id); }
    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    // ===== FIREBASE =====
    let db = null, storage = null, CONFIG_DOC = null;
    let firebaseReady = false;
    try {
        if (window.FIREBASE_CONFIGURED && typeof firebase !== 'undefined' && window.firebaseConfig) {
            firebase.initializeApp(window.firebaseConfig);
            db = firebase.firestore();
            storage = firebase.storage();
            CONFIG_DOC = db.collection('config').doc('principal');
            firebaseReady = true;
        }
    } catch (e) {
        console.warn('Firebase no disponible:', e.message);
    }
    if (!firebaseReady) {
        // Sin Firebase real: el guardado se publica via GitHub (data.json).
        try { if (window.state) window.state.firebaseWritable = false; } catch (e) {}
    }

    // ===== GITHUB (modo nube SIN Firebase: publica data.json) =====
    // El token se guarda en este navegador (campo "Token de GitHub" del login),
    // NO en el codigo. Si se borra el campo, se recupera copiandolo de nuevo.
    function ghToken() {
        try {
            const s = localStorage.getItem('onaGhToken') || sessionStorage.getItem('onaGhToken');
            if (s) return s;
        } catch (e) {}
        return String(window.GITHUB_TOKEN || '').trim();
    }
    function saveGhToken() {
        const el = $('ghTokenInput');
        const v = el ? el.value.trim() : '';
        try { if (v) { localStorage.setItem('onaGhToken', v); } else { localStorage.removeItem('onaGhToken'); } } catch (e) {}
        if (el) el.value = v;
        return v;
    }
    function ghEnabled() { return !!(ghToken() && window.GITHUB_OWNER && window.GITHUB_REPO); }
    function ghBase() { return 'https://api.github.com/repos/' + window.GITHUB_OWNER + '/' + window.GITHUB_REPO; }
    function ghHeaders() { return { 'Authorization': 'token ' + ghToken(), 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json' }; }
    function ghRaw(path) { return 'https://raw.githubusercontent.com/' + window.GITHUB_OWNER + '/' + window.GITHUB_REPO + '/main/' + path; }
    function ghB64(str) { try { return btoa(unescape(encodeURIComponent(str))); } catch (e) { return ''; } }
    function ghEncodePath(p) { return String(p).split('/').map(function (s) { return encodeURIComponent(s); }).join('/'); }
    function ghFileToB64(fileOrBlob) {
        return new Promise(function (resolve, reject) {
            const r = new FileReader();
            r.onload = function () { const c = String(r.result); const i = c.indexOf(','); resolve(i >= 0 ? c.slice(i + 1) : c); };
            r.onerror = function () { reject(new Error('No se pudo leer el archivo')); };
            r.readAsDataURL(fileOrBlob);
        });
    }
    function ghTimeout(promise, ms) {
        return Promise.race([promise, new Promise(function (_, reject) { setTimeout(function () { reject(new Error('Tiempo agotado al publicar')); }, ms); })]);
    }
    function ghGet(path) {
        return new Promise(function (resolve) {
            fetch(ghBase() + '/contents/' + ghEncodePath(path) + '?ref=main', { headers: ghHeaders() })
                .then(function (r) { if (!r.ok) { resolve(null); return; } r.json().then(resolve).catch(function () { resolve(null); }); })
                .catch(function () { resolve(null); });
        });
    }
    function ghWrite(path, contentB64, message, sha, isDelete) {
        const body = isDelete
            ? { message: message, sha: sha, branch: 'main' }
            : { message: message, content: contentB64, sha: sha || null, branch: 'main' };
        return fetch(ghBase() + '/contents/' + ghEncodePath(path), {
            method: isDelete ? 'DELETE' : 'PUT',
            headers: ghHeaders(),
            body: JSON.stringify(body)
        }).then(function (r) { return r.ok; });
    }
    function ghDelete(path) {
        return ghGet(path).then(function (f) {
            if (!f) return true;
            return ghWrite(path, '', 'Eliminar foto', f.sha, true);
        });
    }
    function ghPublish() {
        const body = { site: state.site, photos: state.photos, saved_at: new Date().toISOString() };
        const b64 = ghB64(JSON.stringify(body, null, 2));
        return ghGet('data.json').then(function (existing) {
            return ghWrite('data.json', b64, 'Actualizar contenido de Onda Joven', existing ? existing.sha : null, false)
                .then(function (ok) { if (!ok) throw new Error('GitHub rechazó el guardado'); });
        });
    }

    // ===== STORAGE SEGURO =====
    function setAuthed() { try { sessionStorage.setItem('adminAuthed', '1'); } catch (e) {} }
    function clearAuthed() { try { sessionStorage.removeItem('adminAuthed'); } catch (e) {} }
    function getAuthed() { try { return sessionStorage.getItem('adminAuthed') === '1'; } catch (e) { return false; } }

    // ===== CATEGORIAS =====
    const CAT_LABELS = { general: 'General', concierto: 'Conciertos', integradores: 'Integrantes', eventos: 'Eventos', promo: 'Promocional' };
    const SONG_CATS = { paraguayas: 'Polkas y Guaranías', latinas: 'Cumbias y Salsa', merengues: 'Merengues', romanticas: 'Baladas', boleros: 'Boleros', mexicanas: 'Mexicanos y Corridos', internacional: 'Rock y Pop', brasileñas: 'Sertanejo y Música Brasileña' };

    // ===== ESTADO =====
    const state = {
        authed: false,
        firebaseWritable: firebaseReady,
        site: {
            band_name: 'Onda Joven',
            about: 'Onda Joven se fundó el 21 de septiembre de 1994 bajo la dirección de los Hermanos Noguera. Desde entonces, más de tres décadas poniendo a bailar los eventos de nuestro Paraguay.',
            history: 'El grupo nació en 1994 con Los Hermanos Noguera.',
            hero: { subtitle: 'Grupo Musical desde 1994', desc: 'Música en vivo para tus eventos.' },
            location: 'Curuguaty, Paraguay', map_query: '-24.4633671, -55.6907254',
            phone: '0971 820 528', whatsapp: '0971 820 528', email: '',
            social: {}, services: [
                { name: 'Casamientos', desc: 'La música perfecta para tu boda y recepción.', icon: 'fa-ring' },
                { name: 'Bodas de Oro', desc: 'Celebración inolvidable para aniversarios.', icon: 'fa-heart' },
                { name: 'Quinceañeras', desc: 'Ambienta el día más especial de tu 15 años.', icon: 'fa-crown' },
                { name: 'Fiestas Patronales', desc: 'Vivamos juntos las fiestas de tu comunidad.', icon: 'fa-church' },
                { name: 'Fiestas Privadas', desc: 'Cumpleaños y reuniones familiares con música en vivo.', icon: 'fa-glass-cheers' },
                { name: 'Festivales', desc: 'Espectáculo completo para escenarios y festivales.', icon: 'fa-star' },
                { name: 'Fiestas de Colación', desc: 'Cierra con broche de oro tu colación y graduación.', icon: 'fa-graduation-cap' },
                { name: 'Eventos Empresariales', desc: 'Amenización profesional para tu empresa.', icon: 'fa-briefcase' }
            ],
            repertoire: {
                paraguayas: [], latinas: [], merengues: [], romanticas: [],
                boleros: [], mexicanas: [], internacional: [],
                brasileñas: [
                    { name: 'Evidências', artist: 'Chitãozinho & Xororó', duration: '4:30' },
                    { name: 'Foi Deus', artist: 'Chitãozinho & Xororó', duration: '3:50' },
                    { name: 'No Rancho Fundo', artist: 'Chitãozinho & Xororó', duration: '4:15' },
                    { name: 'Boate Azul', artist: 'Bruno & Marrone', duration: '3:30' },
                    { name: 'Chora Me Liga', artist: 'Bruno & Marrone', duration: '3:45' },
                    { name: 'Amore', artist: 'Bruno & Marrone', duration: '3:40' },
                    { name: 'Meu Coração', artist: 'Leonardo', duration: '3:55' },
                    { name: 'Diz Pra Mim', artist: 'Jorge & Mateus', duration: '3:20' },
                    { name: 'Aquarela do Brasil', artist: 'Música Brasileña', duration: '3:50' },
                    { name: 'Garota de Ipanema', artist: 'Tom Jobim', duration: '3:35' }
                ]
            },
            stats: []
        },
        photos: []
    };

    // ===== CARGAR DATOS =====
    async function loadData() {
        // En modo GitHub: leemos primero lo publicado (data.json) y luego
        // se pisa con la ultima edicion local de este navegador.
        if (!firebaseReady && ghEnabled()) {
            try {
                const r = await fetch('data.json?v=' + Date.now(), { cache: 'no-store' });
                if (r.ok) {
                    const d = await r.json();
                    const cloud = (d && d.site) ? d.site : {};
                    state.site = Object.assign({}, state.site, cloud);
                    state.site.hero = Object.assign({ subtitle: 'Grupo Musical desde 1994', desc: '' }, (cloud.hero || {}));
                    if (d && Array.isArray(d.photos)) {
                        state.photos = d.photos.map(p => Object.assign({}, p, { id: p.id || p.url }));
                    }
                }
            } catch (e) { }
        }
        // Backup local (ultima edicion de este dispositivo)
        try {
            const raw = localStorage.getItem('onaSiteBackup');
            if (raw) {
                const b = JSON.parse(raw);
                state.site = Object.assign({}, state.site, b);
                state.site.hero = Object.assign({ subtitle: 'Grupo Musical desde 1994', desc: '' }, (b.hero || {}));
                if (b.photos && b.photos.length) state.photos = b.photos.map(p => Object.assign({}, p, { id: p.id || p.url }));
            }
        } catch (e) {}
        if (firebaseReady) {
            try { const doc = await CONFIG_DOC.get(); if (doc.exists) { const d = doc.data() || {}; state.site = Object.assign({}, state.site, d); state.site.hero = Object.assign({ subtitle: 'Grupo Musical desde 1994', desc: '' }, (d.hero || {})); } } catch (e) { console.error('Error cargando config:', e); }
            try { const snap = await db.collection('photos').orderBy('order', 'asc').get(); const list = []; snap.forEach(p => list.push(Object.assign({ id: p.id }, p.data()))); state.photos = list; } catch (e) { console.error('Error cargando fotos:', e); }
        }
        populate();
    }

    // ===== SAVE (nunca debe colgarse; responde siempre con un mensaje) =====
    function saveConfig() {
        const local = Object.assign({}, state.site, { photos: state.photos });
        try { localStorage.setItem('onaSiteBackup', JSON.stringify(local)); } catch (e) {}
        return new Promise(function (resolve) {
            if (firebaseReady && state.firebaseWritable !== false) {
                const timer = setTimeout(function () { console.warn('Timeout Firestore: se guardo solo local.'); resolve('Guardado (solo este navegador: sin conexión con Firebase)'); }, 4000);
                CONFIG_DOC.set(state.site, { merge: true })
                    .then(function () { clearTimeout(timer); resolve('Guardado'); })
                    .catch(function (e) { clearTimeout(timer); console.error('Error guardando:', e); state.firebaseWritable = false; resolve('Guardado (solo este navegador: no se pudo conectar)'); });
                return;
            }
            if (ghEnabled()) {
                ghTimeout(ghPublish(), 25000)
                    .then(function () { resolve('Guardado y publicado. Todos los visitantes lo verán en 1–2 minutos.'); })
                    .catch(function (e) { console.error('Error publicando en GitHub:', e); resolve('Guardado en este navegador. No se pudo publicar: ' + e.message + '. Revisa la conexión y vuelve a guardar.'); });
                return;
            }
            resolve('Guardado (solo este navegador: falta configurar la nube)');
        });
    }
    function saveBasic() {
        state.site.band_name = $('aBandName').value || 'Onda Joven';
        state.site.hero = state.site.hero || {};
        state.site.hero.subtitle = $('aHeroSubtitle').value;
        state.site.hero.desc = $('aHeroDesc').value;
        saveConfig().then((msg) => { alert(msg); }).catch(e => { alert('Error: ' + e.message); });
    }
    function saveStory() { state.site.about = $('aAbout').value; saveConfig().then((msg) => alert(msg)); }
    function saveSocial() {
        state.site.social = { facebook: $('aSocialFb').value, instagram: $('aSocialIg').value, youtube: $('aSocialYt').value, spotify: $('aSocialSp').value, tiktok: $('aSocialTk').value };
        saveConfig().then((msg) => alert(msg));
    }
    function saveContact() {
        state.site.location = $('aLocation').value; state.site.map_query = $('aMapQuery').value;
        state.site.phone = $('aPhone').value; state.site.whatsapp = $('aWhatsapp').value; state.site.email = $('aEmail').value;
        saveConfig().then((msg) => alert(msg));
    }

    // ===== POPULATE =====
    function populate() {
        const s = state.site;
        const vars = { aBandName: s.band_name, aHeroSubtitle: (s.hero && s.hero.subtitle), aHeroDesc: (s.hero && s.hero.desc), aLocation: s.location, aMapQuery: s.map_query, aPhone: s.phone, aWhatsapp: s.whatsapp, aEmail: s.email, aAbout: s.about };
        Object.keys(vars).forEach(id => { const el = $(id); if (el) el.value = vars[id] || ''; });
        const soc = s.social || {};
        const so = { aSocialFb: 'facebook', aSocialIg: 'instagram', aSocialYt: 'youtube', aSocialSp: 'spotify', aSocialTk: 'tiktok' };
        Object.keys(so).forEach(id => { const el = $(id); if (el) el.value = soc[so[id]] || ''; });
        renderSongList(); renderServiceList(); renderGalleryList();
    }

    // ===== FOTOS =====
    const uz = document.querySelector('.upload-zone');
    if (uz) {
        uz.addEventListener('dragover', e => { e.preventDefault(); uz.style.borderColor = 'var(--accent)'; });
        uz.addEventListener('dragleave', () => { uz.style.borderColor = ''; });
        uz.addEventListener('drop', e => { e.preventDefault(); uz.style.borderColor = ''; handleFiles(e.dataTransfer.files); });
    }
    function handleUpload(e) { handleFiles(e.target.files); e.target.value = ''; }
    async function handleFiles(files) {
        if (!firebaseReady && !ghEnabled()) { alert('Falta configurar la nube (Firebase o GitHub). No se pueden subir fotos.'); return; }
        const title = $('uploadTitle').value || 'Onda Joven';
        const cat = $('uploadCategory').value;
        $('uploading').style.display = 'block';
        let ok = 0, errCount = 0;
        for (const file of files) {
            try {
                const base = 'fotos/admin-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
                const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
                const thumbBlob = await makeThumb(file, 900, 0.82, 'image/jpeg');
                if (firebaseReady) {
                    await storage.ref(base + '-thumb.jpg').put(thumbBlob, { contentType: 'image/jpeg' });
                    const thumb = await storage.ref(base + '-thumb.jpg').getDownloadURL();
                    await storage.ref(base + '-original.' + ext).put(file);
                    const url = await storage.ref(base + '-original.' + ext).getDownloadURL();
                    await db.collection('photos').add({ url, thumb, title, category: cat, order: state.photos.length });
                } else {
                    const t64 = await ghFileToB64(thumbBlob);
                    const o64 = await ghFileToB64(file);
                    await ghTimeout(ghWrite(base + '-thumb.jpg', t64, 'Subir foto: ' + title, null, false), 30000);
                    await ghTimeout(ghWrite(base + '-original.' + ext, o64, 'Subir foto: ' + title, null, false), 30000);
                    state.photos.push({ id: base, url: ghRaw(base + '-original.' + ext), thumb: ghRaw(base + '-thumb.jpg'), title, category: cat, order: state.photos.length });
                }
                ok++;
            } catch (e) { errCount++; console.error('Error subiendo foto:', e); $('photoStatus').textContent = 'Error: ' + e.message; }
        }
        $('uploading').style.display = 'none'; $('uploadTitle').value = '';
        $('photoStatus').textContent = ok > 0 ? ok + ' foto(s) subida(s)' : (errCount > 0 ? 'Error al subir.' : '');
        if (!firebaseReady) { await saveConfig(); }
        await loadData();
    }
    function makeThumb(file, maxSize, quality, type) {
        return new Promise(function (resolve, reject) {
            if (!file.type.match(/^image\//)) { reject(new Error('No es imagen')); return; }
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = function () {
                let w = img.width, h = img.height;
                if (w > maxSize || h > maxSize) { const r = Math.min(maxSize / w, maxSize / h); w = Math.round(w * r); h = Math.round(h * r); }
                const c = document.createElement('canvas'); c.width = w; c.height = h;
                c.getContext('2d').drawImage(img, 0, 0, w, h);
                c.toBlob(function (b) { URL.revokeObjectURL(url); b ? resolve(b) : reject(new Error('No se pudo comprimir')); }, type, quality);
            };
            img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Imagen no válida')); };
            img.src = url;
        });
    }
    async function deletePhoto(id) {
        const idx = state.photos.findIndex(p => p.id === id);
        if (idx < 0) { await loadData(); return; }
        const photo = state.photos[idx];
        state.photos.splice(idx, 1);
        if (firebaseReady) {
            [photo.url, photo.thumb].forEach(function (d) { if (!d) return; try { const m = d.match(/\/o\/([^?]+)/); if (m) storage.ref(decodeURIComponent(m[1])).delete().catch(() => {}); } catch (e) {} });
            try { await db.collection('photos').doc(id).delete(); } catch (e) {}
        }
        if (!firebaseReady && ghEnabled()) {
            const fromRaw = function (u) {
                const pr = '/main/';
                const i = String(u).indexOf(pr);
                return i >= 0 ? String(u).slice(i + pr.length) : null;
            };
            for (const u of [photo.thumb, photo.url]) {
                const p = fromRaw(u);
                if (p) { try { await ghDelete(p); } catch (e) {} }
            }
            await saveConfig();
        }
        await loadData(); alert('Foto eliminada');
    }
    function renderGalleryList() {
        const el = $('adminGalleryList'); if (!el) return;
        el.innerHTML = state.photos.map(p => '<div class="list-item"><span><i class="fas fa-image"></i> ' + esc(p.title || 'Foto') + '</span><button class="btn-delete" onclick="OJAdmin.deletePhoto(\'' + (p.id || p.url) + '\')">Eliminar</button></div>').join('') || '<p style="color:var(--text-dim);font-size:.85rem">No hay fotos aún</p>';
    }

    // ===== REPERTORIO =====
    function addSong() {
        const name = $('songName').value; if (!name) { alert('Escribe el nombre'); return; }
        const cat = $('songCategory').value;
        state.site.repertoire = state.site.repertoire || {};
        state.site.repertoire[cat] = state.site.repertoire[cat] || [];
        state.site.repertoire[cat].push({ name, artist: $('songArtist').value, duration: $('songDuration').value });
        saveConfig().then((msg) => { ['songName', 'songArtist', 'songDuration'].forEach(i => $(i).value = ''); renderSongList(); $('songStatus').textContent = 'Canción agregada'; if (msg) alert(msg); });
    }
    function deleteSong(cat, index) {
        if (state.site.repertoire[cat]) state.site.repertoire[cat].splice(index, 1);
        saveConfig().then((msg) => { renderSongList(); if (msg) alert(msg); });
    }
    function renderSongList() {
        const el = $('adminSongList'); if (!el) return;
        const rep = state.site.repertoire || {};
        let html = '';
        for (const cat of Object.keys(rep)) { rep[cat].forEach((s, i) => { html += '<div class="list-item"><span>' + esc(s.name) + ' (' + esc(SONG_CATS[cat] || cat) + ')</span><button class="btn-delete" onclick="OJAdmin.deleteSong(\'' + cat + '\',' + i + ')">Eliminar</button></div>'; }); }
        el.innerHTML = html || '<p style="color:var(--text-dim);font-size:.85rem">No hay canciones</p>';
    }

    // ===== SERVICIOS =====
    function addService() {
        const name = $('serviceName').value; if (!name) { alert('Escribe el nombre'); return; }
        state.site.services = state.site.services || [];
        state.site.services.push({ name, desc: $('serviceDesc').value, icon: $('serviceIcon').value || 'fa-star' });
        saveConfig().then((msg) => { ['serviceName', 'serviceDesc', 'serviceIcon'].forEach(i => $(i).value = ''); renderServiceList(); $('serviceStatus').textContent = 'Servicio agregado'; if (msg) alert(msg); });
    }
    function deleteService(index) { state.site.services.splice(index, 1); saveConfig().then((msg) => { renderServiceList(); if (msg) alert(msg); }); }
    function renderServiceList() {
        const el = $('adminServiceList'); if (!el) return;
        const sv = state.site.services || [];
        el.innerHTML = sv.map((s, i) => '<div class="list-item"><span>' + esc(s.name) + '</span><button class="btn-delete" onclick="OJAdmin.deleteService(' + i + ')">Eliminar</button></div>').join('') || '<p style="color:var(--text-dim);font-size:.85rem">No hay servicios</p>';
    }

    // ===== LOGIN =====
    async function doLogin() {
        saveGhToken();
        const pass = $('adminPasswordInput').value;
        $('loginError').textContent = '';
        if (!pass) { $('loginError').textContent = 'Ingresa la contraseña'; return; }
        if (pass !== window.ADMIN_PASSWORD) { $('loginError').textContent = 'Contraseña incorrecta'; return; }
        state.authed = true; setAuthed();
        $('loginOverlay').classList.add('hidden');
        $('adminPanel').classList.add('active');
        populate();
        if (firebaseReady && firebase.auth) {
            try { await firebase.auth().signInAnonymously(); } catch (e) { state.firebaseWritable = false; console.warn('Modo local.'); }
        } else { state.firebaseWritable = false; }
    }
    function logout() {
        state.authed = false; clearAuthed();
        if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
            try { firebase.auth().signOut().catch(() => {}); } catch (e) {}
        }
        $('adminPanel').classList.remove('active');
        $('loginOverlay').classList.remove('hidden');
        $('adminPasswordInput').value = '';
    }

    // ===== Cerrar con Escape =====
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { const p = $('adminPanel'); if (p && p.classList.contains('active')) logout(); }
    });

    // ===== API PUBLICA =====
    window.OJAdmin = { doLogin, logout, saveBasic, saveStory, saveSocial, saveContact, handleUpload, handleFiles, deletePhoto, addSong, deleteSong, addService, deleteService, saveGhToken };

    // ===== INICIO =====
    try { const el = $('ghTokenInput'); if (el && localStorage.getItem('onaGhToken')) el.value = localStorage.getItem('onaGhToken'); } catch (e) {}
    if (getAuthed()) {
        state.authed = true;
        $('loginOverlay').classList.add('hidden');
        $('adminPanel').classList.add('active');
    }
    loadData();
})();