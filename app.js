// ============================================================
// ONDA JOVEN - app.js
// Logica principal publica (estructura, carga de datos y render)
// Arquitectura: cada seccion se renderiza por separado con
// try/catch para que un error puntual NO tumbe toda la pagina.
// ============================================================
(function () {
    'use strict';

    // ===== UTILIDADES =====
    function $(id) { return document.getElementById(id); }
    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    // ===== INICIALIZAR FIREBASE (nunca debe tumbar la pagina) =====
    let db = null, storage = null, CONFIG_DOC = null;
    let firebaseReady = false;
    try {
        if (window.FIREBASE_CONFIGURED && typeof firebase !== 'undefined' && window.firebaseConfig) {
            firebase.initializeApp(window.firebaseConfig);
            db = firebase.firestore();
            storage = firebase.storage();
            CONFIG_DOC = db.collection('config').doc('principal');
            firebaseReady = true;
        } else {
            console.warn('Firebase no configurado. Se muestra el contenido por defecto.');
        }
    } catch (e) {
        console.error('Error inicializando Firebase:', e);
    }

    // ===== OCULTAR PRELOADER SIEMPRE (aunque Firebase falle) =====
    function hidePreloader() {
        const p = $('preloader');
        if (p) p.classList.add('hidden');
    }

    // ===== ESTADO GLOBAL (base: defaults.js, unica fuente de verdad) =====
    function cloneObj(o) { try { return JSON.parse(JSON.stringify(o)); } catch (e) { return o; } }
    const state = {
        site: cloneObj(window.OJ_DEFAULTS.site),
        photos: (window.OJ_DEFAULTS.photos || []).map(p => Object.assign({}, p)),
        filteredPhotos: [],
        authed: false,
        firebaseWritable: true,
        currentFilter: 'all',
        currentImageIndex: 0
    };

    // ===== CATEGORIAS Y ETIQUETAS =====
    const SONG_CATS = { paraguayas: 'Polkas y Guaranías', latinas: 'Cumbias y Salsa', merengues: 'Merengues', romanticas: 'Baladas', boleros: 'Boleros', mexicanas: 'Mexicanos y Corridos', internacional: 'Rock y Pop', brasileñas: 'Sertanejo y Música Brasileña' };
    const CAT_ICONS = { paraguayas: 'fa-flag', latinas: 'fa-drum', merengues: 'fa-bolt', romanticas: 'fa-heart', boleros: 'fa-music', mexicanas: 'fa-guitar', internacional: 'fa-globe', brasileñas: 'fa-earth-americas', general: 'fa-star', concierto: 'fa-music', integradores: 'fa-users', eventos: 'fa-glass-cheers', promo: 'fa-camera' };
    const CAT_LABELS = { general: 'General', concierto: 'Conciertos', integradores: 'Integrantes', eventos: 'Eventos', promo: 'Promocional' };

    // Utilidades para el panel de administracion (mismo contexto global)
    window.OJ = { db, storage, CONFIG_DOC, state, SONG_CATS, CAT_ICONS, CAT_LABELS };

    // Enlace de WhatsApp: convierte el numero al formato internacional
    // para que el chat abra correctamente (Paraguay: prefijo 595).
    function waNumber() {
        const raw = state.site.whatsapp || state.site.phone || '';
        let digits = String(raw).replace(/\D/g, '');
        if (!digits) return '';
        // Si empieza con 0 (formato local), lo reemplazamos por el indicativo del pais
        if (digits.charAt(0) === '0') {
            digits = '595' + digits.slice(1);
        } else if (digits.length === 9) {
            // Numero nacional sin 0 ni prefijo -> agregamos el indicativo
            digits = '595' + digits;
        }
        return digits;
    }
    function waLink() {
        const n = waNumber();
        return n ? ('https://wa.me/' + n) : '#';
    }

    // Mensaje de consulta predefinido para WhatsApp
    function waMessage() {
        return 'Hola, quiero hacer una consulta para contratar al grupo musical';
    }

    // URL de foto: si existe thumbnail para el grid, la usamos;
    // para el lightbox (full-res) siempre usamos la original.
    function thumbUrl(p) { return (p && p.thumb) ? p.thumb : (p ? p.url : ''); }

    // ===== CARGAR DATOS =====
    
    // FUSION SEGURA: un dato publicado/respaldo que este PARTIALMENTE vacio
    // (categoria sin canciones, sin servicios) NO puede borrar el contenido
    // completo. protectEmpty=true: las listas vacias se ignoran.
    function mergeSite(base, over, protectEmpty) {
        if (!over || typeof over !== 'object') return base;
        const out = Object.assign({}, base, over || {});
        out.hero = Object.assign({}, base.hero || {}, over.hero || {});
        out.social = Object.assign({}, base.social || {}, over.social || {});
        if (over.repertoire && typeof over.repertoire === 'object') {
            // Se usan SIEMPRE las categorias fijas del base (defaults).
            // Cualquier clave rara/rota (ej. 'brasileÃ±as') se ignora.
            const cats = {};
            Object.keys(base.repertoire || {}).forEach(function (c) {
                const arr = (over.repertoire && Array.isArray(over.repertoire[c])) ? over.repertoire[c] : null;
                if (arr && (!protectEmpty || arr.length > 0)) { cats[c] = arr.slice(); }
                else if (base.repertoire && base.repertoire[c]) { cats[c] = base.repertoire[c].slice(); }
                else { cats[c] = []; }
            });
            out.repertoire = cats;
        }
        if (Array.isArray(over.services) && (!protectEmpty || over.services.length > 0)) out.services = over.services.slice();
        if (Array.isArray(over.stats) && (!protectEmpty || over.stats.length > 0)) out.stats = over.stats.slice();
        if (Array.isArray(over.videos)) out.videos = over.videos.slice();
        return out;
    }
    // Extrae el ID de un link de YouTube (watch, youtu.be, embed, shorts, live)
    function ytId(url) {
        const s = String(url || '');
        const m = s.match(/(?:youtube\.com\/(?:watch\?.*(?:^|[?&])v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{6,})/);
        return m ? m[1] : '';
    }
    // Decodifica base64 (con acentos) a texto.
    function b64ToStr(b64) {
        try { return decodeURIComponent(escape(atob(String(b64)))); } catch (e) { return ''; }
    }
    async function loadData() {
        // Con Firebase SIN configurar, la pagina muestra lo PUBLICADO en
        // data.json (autoritativo). Si no existe aun, usa los defaults
        // completos. El respaldo local ya NO se autoaplica: un respaldo
        // viejo/podado no puede volver a borrar el contenido.
        if (!firebaseReady) {
            // Lectura SIEMPRE actual: 1) API de GitHub (sin caché, en vivo) ->
            // 2) raw GitHub (rápido, con caché corta) -> 3) local (respaldo).
            const gh = (window.GITHUB_OWNER && window.GITHUB_REPO) ? window.GITHUB_OWNER + '/' + window.GITHUB_REPO : null;
            const api = gh ? 'https://api.github.com/repos/' + gh + '/contents/data.json' : null;
            const raw = gh ? 'https://github.com/' + gh + '/raw/main/data.json?v=' + Date.now() : null;
            const candidates = [api, raw, 'data.json?v=' + Date.now()].filter(Boolean);
            let ok = false;
            for (const url of candidates) {
                try {
                    const r = await fetch(url, { cache: 'no-store' });
                    if (!r.ok || r.status === 403) continue;
                    const d = await r.json();
                    let src = d;
                    if (d.content && d.encoding === 'base64') {
                        try { src = JSON.parse(b64ToStr(d.content)); } catch (e) { continue; }
                    }
                    const c = (src && src.site) ? src.site : (src || {});
                    state.site = mergeSite(state.site, c, false);
                    if (src && Array.isArray(src.photos)) {
                        state.photos = src.photos.map(p => Object.assign({}, p, { id: p.id || p.url }));
                    }
                    ok = true;
                    break;
                } catch (e) { }
            }
            if (!ok) console.warn('No se pudo leer data.json publicado; se usan los defaults completos.');
            state.filteredPhotos = state.photos.slice();
        }
        if (firebaseReady) {
            try {
                const doc = await CONFIG_DOC.get();
                if (doc.exists) {
                    const data = doc.data() || {};
                    state.site = mergeSite(state.site, data, false);
                }
            } catch (e) {
                console.error('Error cargando config:', e);
            }

            try {
                const snap = await db.collection('photos').orderBy('order', 'asc').get();
                const list = [];
                snap.forEach(p => list.push(Object.assign({ id: p.id }, p.data())));
                if (list.length > 0) {
                    state.photos = list;
                    state.filteredPhotos = list.slice();
                }
            } catch (e) {
                console.error('Error cargando fotos:', e);
            }
        }

        renderAll();
        hidePreloader();
    }

    // ===== RENDER DEFENSIVO (una seccion no tumba al resto) =====
    function renderAll() {
        safe(renderBrand);
        safe(renderAbout);
        safe(renderVideos);
        safe(renderGallery);
        safe(renderRepertoire);
        safe(renderServices);
        safe(renderContact);
        safe(renderMap);
    }

    function safe(fn) {
        try { fn(); } catch (e) { console.error('Error en render:', fn && fn.name, e && e.message); }
    }

    function renderBrand() {
        const name = state.site.band_name || 'Onda Joven';
        document.title = name + ' | Grupo Musical';
        const el = (i) => { const n = $(i); if (n) n.textContent = name; };
        el('navLogo'); el('heroTitle');
        const fl = document.querySelector('.footer-logo'); if (fl) fl.textContent = name;
        const hs = $('heroSubtitle'); if (hs) hs.textContent = state.site.hero.subtitle || '';
        const hd = $('heroDesc'); if (hd) hd.textContent = state.site.hero.desc || '';

        // Imagen de "historia": usa foto de integrantes si existe
        const img = state.photos.find(p => p.category === 'integradores') || state.photos[0];
        const aboutImg = $('aboutImage');
        if (aboutImg) {
            if (img) {
                aboutImg.src = img.url;
                aboutImg.onerror = () => { aboutImg.src = 'logo.jpeg'; };
            } else {
                aboutImg.src = 'logo.jpeg';
            }
        }
    }

    function renderVideos() {
        const sec = $('videos');
        const grid = $('videosGrid');
        if (!sec || !grid) return;
        const vids = (state.site.videos || []).filter(v => ytId(v && v.url));
        if (!vids.length) { sec.style.display = 'none'; return; }
        sec.style.display = 'block';
        grid.innerHTML = vids.map(v => {
            const id = ytId(v.url);
            const t = esc(v.title || 'Mira a Onda Joven en acción');
            return '<div class="video-item"><iframe src="https://www.youtube.com/embed/' + id + '" title="' + t + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe><h4>' + t + '</h4></div>';
        }).join('');
        const tl = $('videosTitle');
        if (tl) tl.textContent = 'Mirá a Onda Joven en acción';
    }

    function renderAbout() {
        const ht = $('historyText');
        if (ht) ht.textContent = state.site.history || '';
        const stats = (state.site.stats && state.site.stats.length) ? state.site.stats
            : [{ label: 'Años de Música', value: '32' }, { label: 'Desde el Año', value: '1994' }, { label: 'Integrantes', value: '4' }];
        const box = $('aboutStats');
        if (box) box.innerHTML = stats.map(s => '<div class="stat"><div class="stat-number">' + esc(s.value) + '</div><div class="stat-label">' + esc(s.label) + '</div></div>').join('');
    }

    function renderGallery() {
        const cats = ['all'].concat(Array.from(new Set(state.photos.map(p => p.category))));
        const filterEl = $('galleryFilter');
        if (filterEl) {
            filterEl.innerHTML = cats.map(c =>
                '<button class="filter-btn ' + (state.currentFilter === c ? 'active' : '') + '" data-filter="' + esc(c) + '" onclick="OJ.setFilter(\'' + esc(c) + '\')">' + (c === 'all' ? 'Todos' : (CAT_LABELS[c] || esc(c))) + '</button>'
            ).join('');
        }

        const items = state.currentFilter === 'all' ? state.photos : state.photos.filter(p => p.category === state.currentFilter);
        state.filteredPhotos = items;
        const grid = $('galleryGrid');
        const empty = $('emptyGallery');
        if (!grid) return;

        if (items.length === 0) {
            grid.innerHTML = '';
            if (empty) empty.style.display = 'block';
        } else {
            if (empty) empty.style.display = 'none';
            grid.innerHTML = items.map((p, i) =>
                '<div class="gallery-item reveal" onclick="OJ.openLightbox(' + i + ')">' +
                    '<img src="' + esc(thumbUrl(p)) + '" alt="' + esc(p.title || 'Onda Joven') + '" loading="lazy" decoding="async" fetchpriority="low" onerror="this.parentElement.parentElement.style.display=\'none\'">' +
                    '<div class="gallery-overlay"><h4>' + esc(p.title || 'Onda Joven') + '</h4><p>' + esc(CAT_LABELS[p.category] || p.category) + '</p></div>' +
                '</div>'
            ).join('');
        }
        observeReveal();
    }

    window.OJ.setFilter = function (c) { state.currentFilter = c; renderGallery(); };

    function openLightbox(index) {
        if (!state.filteredPhotos[index]) return;
        state.currentImageIndex = index;
        const img = $('lightboxImg');
        img.src = state.filteredPhotos[index].url; // resolucion completa
        img.onerror = function () { img.src = thumbUrl(state.filteredPhotos[index]); };
        $('lightbox').classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    function closeLightbox() { $('lightbox').classList.remove('active'); document.body.style.overflow = ''; }
    function nextImage() {
        if (state.filteredPhotos.length === 0) return;
        state.currentImageIndex = (state.currentImageIndex + 1) % state.filteredPhotos.length;
        openLightbox(state.currentImageIndex);
    }
    function prevImage() {
        if (state.filteredPhotos.length === 0) return;
        state.currentImageIndex = (state.currentImageIndex - 1 + state.filteredPhotos.length) % state.filteredPhotos.length;
        openLightbox(state.currentImageIndex);
    }

    window.OJ.openLightbox = openLightbox;
    window.OJ.closeLightbox = closeLightbox;
    window.OJ.nextImage = nextImage;
    window.OJ.prevImage = prevImage;

    document.addEventListener('keydown', function (e) {
        const lb = $('lightbox');
        if (!lb || !lb.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') nextImage();
        if (e.key === 'ArrowLeft') prevImage();
    });

    function renderRepertoire() {
        const rep = state.site.repertoire || {};
        const c = $('repertoireContainer');
        if (!c) return;
        const keys = Object.keys(rep).filter(k => (rep[k] || []).length > 0);
        if (keys.length === 0) {
            c.innerHTML = '<p style="text-align:center;color:var(--text-dim);font-size:1.2rem">El administrador agregará el repertorio de canciones.</p>';
            return;
        }
        // Solo títulos de categorías (sin listar las canciones)
        c.innerHTML = '<div class="repertoire-grid">' +
            keys.map(key =>
                '<div class="repertoire-category-title reveal">' +
                    '<i class="fas ' + (CAT_ICONS[key] || 'fa-music') + '"></i> ' +
                    esc(SONG_CATS[key] || key) +
                '</div>'
            ).join('') +
            '</div>';
        observeReveal();
    }

    function renderServices() {
        const sv = state.site.services || [];
        const g = $('servicesGrid');
        if (!g) return;
        if (sv.length === 0) { g.innerHTML = '<p style="text-align:center;color:var(--text-dim)">El administrador agregará los servicios.</p>'; return; }
        g.innerHTML = sv.map(s =>
            '<div class="service-card reveal">' +
                '<div class="service-icon"><i class="fas ' + esc(s.icon || 'fa-star') + '"></i></div>' +
                '<h3>' + esc(s.name) + '</h3><p>' + esc(s.desc) + '</p>' +
            '</div>'
        ).join('');
        observeReveal();
    }

    function renderContact() {
        const s = state.site;
        // Tarjeta de ubicacion: abre la ruta en Google Maps hacia la ubicacion exacta
        const lc = $('locCard');
        if (lc) {
            const q = s.map_query || s.location || '';
            lc.setAttribute('href', q ? ('https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(q)) : '#');
            lc.setAttribute('title', 'Abrir la ruta en Google Maps');
        }
        const cl = $('contactLocation'); if (cl && s.location) cl.textContent = s.location;

        // Tarjeta de WhatsApp: en general clicable con el numero y chat directo
        const wc = $('waCard');
        if (wc) {
            const wa = waLink();
            wc.setAttribute('href', (s.phone && wa && wa !== '#') ? (wa + '?text=' + encodeURIComponent(waMessage())) : '#');
            wc.setAttribute('title', 'Abrir chat de WhatsApp');
        }
        const cp = $('contactPhone');
        if (cp) cp.textContent = s.phone || '--';

        const fp = $('formPhone');
        if (fp) fp.textContent = s.phone || '';

        // Boton flotante de WhatsApp (mismo numero y mensaje que la tarjeta)
        const wf = $('waFloat');
        if (wf) {
            const wa = waLink();
            wf.setAttribute('href', (s.phone && wa && wa !== '#') ? (wa + '?text=' + encodeURIComponent(waMessage())) : '#');
        }

        const social = s.social || {};
        const links = [
            { key: 'facebook', icon: 'fab fa-facebook-f', t: 'Facebook' },
            { key: 'instagram', icon: 'fab fa-instagram', t: 'Instagram' },
            { key: 'youtube', icon: 'fab fa-youtube', t: 'YouTube' },
            { key: 'spotify', icon: 'fab fa-spotify', t: 'Spotify' },
            { key: 'tiktok', icon: 'fab fa-tiktok', t: 'TikTok' }
        ];
        const box = $('socialLinks');
        if (!box) return;
        const html = links.filter(l => social[l.key]).map(l => '<a href="' + esc(social[l.key]) + '" target="_blank" rel="noopener" class="social-link" title="' + l.t + '"><i class="' + l.icon + '"></i></a>').join('');
        box.innerHTML = html || '<span style="color:var(--text-dim);font-size:.9rem">Redes aún no configuradas.</span>';
    }

    function renderMap() {
        const query = state.site.map_query || state.site.location || '';
        const frame = $('mapFrame'), placeholder = $('mapPlaceholder'), bar = $('mapAddressBar');
        if (!frame || !placeholder || !bar) { return; }
        if (!query) { frame.style.display = 'none'; placeholder.style.display = 'block'; bar.style.display = 'none'; return; }
        frame.style.display = 'block'; placeholder.style.display = 'none'; bar.style.display = 'flex';
        const at = $('mapAddressText'); if (at) at.textContent = state.site.location || query;
        $('mapIframe').src = 'https://www.google.com/maps?q=' + encodeURIComponent(query) + '&output=embed';
        const dir = $('mapDirections');
        if (dir) dir.href = 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(query);
    }

    function observeReveal() {
        const obs = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
        }, { threshold: 0.1 });
        document.querySelectorAll('.reveal:not(.visible)').forEach(function (el) { obs.observe(el); });
    }

    function sendContact(e) {
        e.preventDefault();
        window.open(waLink() + '?text=' + encodeURIComponent(waMessage()), '_blank');
        e.target.reset();
    }
    window.OJ.sendContact = sendContact;

    // Menu movil
    window.OJ.toggleMobile = function () {
        const menu = $('mobileMenu');
        if (menu) menu.classList.toggle('active');
    };

    // Navegacion suave
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
        a.addEventListener('click', function (e) {
            e.preventDefault();
            const t = document.querySelector(a.getAttribute('href'));
            if (t) t.scrollIntoView({ behavior: 'smooth' });
        });
    });

    // ===== SESSION STORAGE SEGURO (evita errores en origenes opacos / file://) =====
    function getAuthed() {
        try { return sessionStorage.getItem('adminAuthed') === '1'; } catch (e) { return false; }
    }

    // ===== INICIO =====
    if (getAuthed()) state.authed = true;
    window.OJ.loadData = loadData;
    window.OJ.refresh = loadFromDoc;
    window.OJ.renderAll = renderAll;

    // Ocultar el preloader de inmediato como respaldo (max 3s) para que
    // la pagina siempre se muestre aunque Firebase tarde o falle.
    setTimeout(hidePreloader, 3000);

    // Render inicial inmediato con los datos por defecto: pinta la pagina
    // (y asigna el enlace de WhatsApp) aunque Firebase aun no responda.
    renderAll();

    // Luego cargar datos reales (Firestore o backup local) y re-renderizar.
    loadData();

    async function loadFromDoc() {
        if (firebaseReady) {
            try { const doc = await CONFIG_DOC.get(); if (doc.exists) { const d = doc.data(); state.site = Object.assign({}, state.site, d); state.site.hero = Object.assign({ subtitle: 'Grupo Musical desde 1994', desc: '' }, (d.hero || {})); } } catch (e) {}
            try { const snap = await db.collection('photos').orderBy('order', 'asc').get(); const l = []; snap.forEach(p => l.push(Object.assign({ id: p.id }, p.data()))); state.photos = l; state.filteredPhotos = l.slice(); } catch (e) {}
        }
        renderAll();
    }
})();
