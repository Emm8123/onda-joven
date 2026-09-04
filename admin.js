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
        if (typeof firebase !== 'undefined' && typeof firebaseConfig !== 'undefined') {
            firebase.initializeApp(firebaseConfig);
            db = firebase.firestore();
            storage = firebase.storage();
            CONFIG_DOC = db.collection('config').doc('principal');
            firebaseReady = true;
        }
    } catch (e) {
        console.warn('Firebase no disponible:', e.message);
    }

    // ===== STORAGE SEGURO =====
    function setAuthed() { try { sessionStorage.setItem('adminAuthed', '1'); } catch (e) {} }
    function clearAuthed() { try { sessionStorage.removeItem('adminAuthed'); } catch (e) {} }
    function getAuthed() { try { return sessionStorage.getItem('adminAuthed') === '1'; } catch (e) { return false; } }

    // ===== CATEGORIAS =====
    const CAT_LABELS = { general: 'General', concierto: 'Conciertos', integradores: 'Integrantes', eventos: 'Eventos', promo: 'Promocional' };
    const SONG_CATS = { paraguayas: 'Polkas y Guaranías', latinas: 'Cumbias y Salsa', merengues: 'Merengues', romanticas: 'Baladas', boleros: 'Boleros', mexicanas: 'Mexicanos y Corridos', internacional: 'Rock y Pop' };

    // ===== ESTADO =====
    const state = {
        authed: false,
        firebaseWritable: true,
        site: {
            band_name: 'Onda Joven',
            about: 'Onda Joven se fundó el 21 de septiembre de 1994 bajo la dirección de los Hermanos Noguera. Desde entonces, más de tres décadas poniendo a bailar los eventos de nuestro Paraguay.',
            history: 'La banda nació en 1994 con Los Hermanos Noguera.',
            hero: { subtitle: 'Banda Musical desde 1994', desc: 'Música en vivo para tus eventos.' },
            location: '', map_query: '',
            phone: '0971 820 528', whatsapp: '0971 820 528', email: '',
            social: {}, services: [],
            repertoire: {
                paraguayas: [], latinas: [], merengues: [], romanticas: [],
                boleros: [], mexicanas: [], internacional: []
            },
            stats: []
        },
        photos: []
    };

    // ===== CARGAR DATOS =====
    async function loadData() {
        // Backup local
        try {
            const raw = localStorage.getItem('onaSiteBackup');
            if (raw) { const b = JSON.parse(raw); state.site = Object.assign({}, state.site, b); state.site.hero = Object.assign({ subtitle: 'Banda Musical desde 1994', desc: '' }, (b.hero || {})); }
        } catch (e) {}
        if (firebaseReady) {
            try { const doc = await CONFIG_DOC.get(); if (doc.exists) { const d = doc.data() || {}; state.site = Object.assign({}, state.site, d); state.site.hero = Object.assign({ subtitle: 'Banda Musical desde 1994', desc: '' }, (d.hero || {})); } } catch (e) { console.error('Error cargando config:', e); }
            try { const snap = await db.collection('photos').orderBy('order', 'asc').get(); const list = []; snap.forEach(p => list.push(Object.assign({ id: p.id }, p.data()))); state.photos = list; } catch (e) { console.error('Error cargando fotos:', e); }
        }
        populate();
    }

    // ===== SAVE =====
    async function saveConfig() {
        try { localStorage.setItem('onaSiteBackup', JSON.stringify(state.site)); } catch (e) {}
        if (!firebaseReady || state.firebaseWritable === false) return;
        try { await CONFIG_DOC.set(state.site, { merge: true }); } catch (e) { console.error('Error guardando:', e); }
    }
    function saveBasic() {
        state.site.band_name = $('aBandName').value || 'Onda Joven';
        state.site.hero = state.site.hero || {};
        state.site.hero.subtitle = $('aHeroSubtitle').value;
        state.site.hero.desc = $('aHeroDesc').value;
        saveConfig().then(() => { alert('Guardado'); }).catch(e => { alert('Error: ' + e.message); });
    }
    function saveStory() { state.site.about = $('aAbout').value; saveConfig().then(() => alert('Guardado')); }
    function saveSocial() {
        state.site.social = { facebook: $('aSocialFb').value, instagram: $('aSocialIg').value, youtube: $('aSocialYt').value, spotify: $('aSocialSp').value, tiktok: $('aSocialTk').value };
        saveConfig().then(() => alert('Redes guardadas'));
    }
    function saveContact() {
        state.site.location = $('aLocation').value; state.site.map_query = $('aMapQuery').value;
        state.site.phone = $('aPhone').value; state.site.whatsapp = $('aWhatsapp').value; state.site.email = $('aEmail').value;
        saveConfig().then(() => alert('Guardado'));
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
        if (!firebaseReady || !storage) { alert('Firebase no configurado. No se pueden subir fotos.'); return; }
        const title = $('uploadTitle').value || 'Onda Joven';
        const cat = $('uploadCategory').value;
        $('uploading').style.display = 'block';
        let ok = 0, errCount = 0;
        for (const file of files) {
            try {
                const base = 'fotos/' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
                const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
                const thumbBlob = await makeThumb(file, 900, 0.82, 'image/jpeg');
                await storage.ref(base + '-thumb.jpg').put(thumbBlob, { contentType: 'image/jpeg' });
                const thumb = await storage.ref(base + '-thumb.jpg').getDownloadURL();
                await storage.ref(base + '-original.' + ext).put(file);
                const url = await storage.ref(base + '-original.' + ext).getDownloadURL();
                await db.collection('photos').add({ url, thumb, title, category: cat, order: state.photos.length });
                ok++;
            } catch (e) { errCount++; console.error('Error subiendo foto:', e); $('photoStatus').textContent = 'Error: ' + e.message; }
        }
        $('uploading').style.display = 'none'; $('uploadTitle').value = '';
        $('photoStatus').textContent = ok > 0 ? ok + ' foto(s) subida(s)' : (errCount > 0 ? 'Error al subir.' : '');
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
        const photo = state.photos.find(p => p.id === id);
        if (photo) { [photo.url, photo.thumb].forEach(function (d) { if (!d) return; try { const m = d.match(/\/o\/([^?]+)/); if (m) storage.ref(decodeURIComponent(m[1])).delete().catch(() => {}); } catch (e) {} }); }
        try { await db.collection('photos').doc(id).delete(); } catch (e) {}
        await loadData(); alert('Foto eliminada');
    }
    function renderGalleryList() {
        const el = $('adminGalleryList'); if (!el) return;
        el.innerHTML = state.photos.map(p => '<div class="list-item"><span><i class="fas fa-image"></i> ' + esc(p.title || 'Foto') + '</span><button class="btn-delete" onclick="OJAdmin.deletePhoto(\'' + p.id + '\')">Eliminar</button></div>').join('') || '<p style="color:var(--text-dim);font-size:.85rem">No hay fotos aún</p>';
    }

    // ===== REPERTORIO =====
    function addSong() {
        const name = $('songName').value; if (!name) { alert('Escribe el nombre'); return; }
        const cat = $('songCategory').value;
        state.site.repertoire = state.site.repertoire || {};
        state.site.repertoire[cat] = state.site.repertoire[cat] || [];
        state.site.repertoire[cat].push({ name, artist: $('songArtist').value, duration: $('songDuration').value });
        saveConfig().then(() => { ['songName', 'songArtist', 'songDuration'].forEach(i => $(i).value = ''); renderSongList(); $('songStatus').textContent = 'Canción agregada'; });
    }
    function deleteSong(cat, index) {
        if (state.site.repertoire[cat]) state.site.repertoire[cat].splice(index, 1);
        saveConfig().then(() => renderSongList());
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
        saveConfig().then(() => { ['serviceName', 'serviceDesc', 'serviceIcon'].forEach(i => $(i).value = ''); renderServiceList(); $('serviceStatus').textContent = 'Servicio agregado'; });
    }
    function deleteService(index) { state.site.services.splice(index, 1); saveConfig().then(() => renderServiceList()); }
    function renderServiceList() {
        const el = $('adminServiceList'); if (!el) return;
        const sv = state.site.services || [];
        el.innerHTML = sv.map((s, i) => '<div class="list-item"><span>' + esc(s.name) + '</span><button class="btn-delete" onclick="OJAdmin.deleteService(' + i + ')">Eliminar</button></div>').join('') || '<p style="color:var(--text-dim);font-size:.85rem">No hay servicios</p>';
    }

    // ===== LOGIN =====
    async function doLogin() {
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
        if (firebase.auth && firebase.auth().currentUser) firebase.auth().signOut().catch(() => {});
        $('adminPanel').classList.remove('active');
        $('loginOverlay').classList.remove('hidden');
        $('adminPasswordInput').value = '';
    }

    // ===== Cerrar con Escape =====
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { const p = $('adminPanel'); if (p && p.classList.contains('active')) logout(); }
    });

    // ===== API PUBLICA =====
    window.OJAdmin = { doLogin, logout, saveBasic, saveStory, saveSocial, saveContact, handleUpload, handleFiles, deletePhoto, addSong, deleteSong, addService, deleteService };

    // ===== INICIO =====
    if (getAuthed()) {
        state.authed = true;
        $('loginOverlay').classList.add('hidden');
        $('adminPanel').classList.add('active');
    }
    loadData();
})();