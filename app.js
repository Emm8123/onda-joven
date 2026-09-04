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
        if (typeof firebase !== 'undefined' && typeof firebaseConfig !== 'undefined') {
            firebase.initializeApp(firebaseConfig);
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

    // ===== ESTADO GLOBAL (expuesto para el panel de admin) =====
    const state = {
        site: {
            band_name: 'Onda Joven',
            about: 'Onda Joven se fundó el 21 de septiembre de 1994 bajo la dirección de los Hermanos Noguera. Desde entonces, más de tres décadas poniendo a bailar los eventos de nuestro Paraguay: sonido propio, luces, pantalla LED y boleta legal.',
            history: 'La banda nació en 1994 con Los Hermanos Noguera: Carlino Noguera en guitarra y voz, Virino Noguera en percusión y Alfirio Noguera en teclados, quien además asumió la dirección musical. En el bajo acompañó por décadas el Prof. Venancio Godoy hasta el 2025, año en que se integró Cristian Armin Noguera para continuar la tradición familiar.',
            hero: { subtitle: 'Banda Musical desde 1994', desc: 'Música en vivo para tus eventos: sonido propio, luces y pantalla LED. Boleta legal.' },
            location: '',
            map_query: '',
            phone: '0971 820 528',
            whatsapp: '0971 820 528',
            email: '',
            social: {},
            services: [],
            repertoire: {
                paraguayas: [
                    { name: 'Pájaro Chogüí', artist: 'Popular Paraguaya', duration: '3:20' },
                    { name: 'Mis Noches Sin Ti', artist: 'Dúo Quiñonez–Molina', duration: '4:10' },
                    { name: 'Che Payé', artist: 'Herminio Giménez', duration: '3:45' },
                    { name: 'Nde Resa Kuéra', artist: 'Juan Carlos Oviedo', duration: '3:55' },
                    { name: 'Kurusu Pepo', artist: 'Félix Pérez Cardozo', duration: '3:15' },
                    { name: 'Panambi Vera', artist: 'Mauricio Cardozo Ocampo', duration: '4:00' },
                    { name: 'Regalo de Amor', artist: 'Grupo Generación', duration: '3:35' },
                    { name: '18 de Julio', artist: 'Popular Paraguaya', duration: '2:50' }
                ],
                latinas: [
                    { name: 'La Cumbia de la Cerveza', artist: 'Grupo Sonador', duration: '3:40' },
                    { name: 'La Colegiala', artist: 'Rodolfo Aicardi', duration: '3:20' },
                    { name: 'El Baile del Perrito', artist: 'Wilfrido Vargas', duration: '3:10' },
                    { name: 'La Chona', artist: 'Los Tucanes de Tijuana', duration: '3:30' },
                    { name: 'Ojitos Hechiceros', artist: 'Intocable', duration: '3:50' },
                    { name: 'Cumbia Sampuesana', artist: 'Alfredo Gutiérrez', duration: '3:05' }
                ],
                merengues: [
                    { name: 'Suavemente', artist: 'Elvis Crespo', duration: '4:10' },
                    { name: 'La Dueña del Swing', artist: 'Los Hermanos Rosario', duration: '3:55' },
                    { name: 'El Venao', artist: 'Rumaliz Perera', duration: '4:00' },
                    { name: 'Yo Quiero Andar', artist: 'Sergio Vargas', duration: '3:45' },
                    { name: 'La Razón', artist: 'Banda Real', duration: '3:35' }
                ],
                romanticas: [
                    { name: 'El Triste', artist: 'José José', duration: '4:10' },
                    { name: 'Si No Te Hubieras Ido', artist: 'Marco Antonio Solís', duration: '4:00' },
                    { name: 'Como Fui a Enamorarme de Ti', artist: 'Los Bukis', duration: '3:45' },
                    { name: 'Hasta Que Te Conocí', artist: 'Juan Gabriel', duration: '4:30' },
                    { name: 'Te Amo', artist: 'Franco De Vita', duration: '4:05' }
                ],
                boleros: [
                    { name: 'Y Hubo Alguien', artist: 'Marc Anthony', duration: '4:20' },
                    { name: 'Dos Gardenias', artist: 'Buena Vista Social Club', duration: '3:05' },
                    { name: 'Bésame Mucho', artist: 'Bolero Tradicional', duration: '3:45' },
                    { name: 'Contigo Aprendí', artist: 'Armando Manzanero', duration: '3:50' },
                    { name: 'Somos Novios', artist: 'Armando Manzanero', duration: '4:00' }
                ],
                mexicanas: [
                    { name: 'El Rey', artist: 'José Alfredo Jiménez', duration: '3:15' },
                    { name: 'El Son de la Negra', artist: 'Mariachi Vargas', duration: '3:00' },
                    { name: 'La Bamba', artist: 'Ritchie Valens', duration: '2:40' },
                    { name: 'Cielito Lindo', artist: 'Popular Mexicana', duration: '3:20' },
                    { name: 'El Payaso', artist: 'Los Alegres de Terán', duration: '3:05' }
                ],
                internacional: [
                    { name: 'Procura', artist: 'Chichi Peralta', duration: '4:10' },
                    { name: 'La Bilirrubina', artist: 'Juan Luis Guerra', duration: '4:00' },
                    { name: 'Tu Sonrisa', artist: 'Elvis Crespo', duration: '3:45' },
                    { name: 'Mojito', artist: 'Tito El Bambino', duration: '3:30' },
                    { name: 'Dura', artist: 'Daddy Yankee', duration: '3:20' }
                ]
            },
            stats: [
                { label: 'Años de Música', value: '32' },
                { label: 'Fundada en', value: '1994' },
                { label: 'Integrantes', value: '5' }
            ]
        },
        photos: [
            { url: 'fotos/Integrantes.jpeg', thumb: 'fotos/Integrantes.jpeg', title: 'Integrantes de Onda Joven', category: 'integradores' },
            { url: 'fotos/Integrantes..jpeg', thumb: 'fotos/Integrantes..jpeg', title: 'Integrantes', category: 'integradores' },
            { url: 'fotos/Integrantes...jpeg', thumb: 'fotos/Integrantes...jpeg', title: 'Integrantes', category: 'integradores' },
            { url: 'fotos/Integrantes....jpeg', thumb: 'fotos/Integrantes....jpeg', title: 'Integrantes', category: 'integradores' },
            { url: 'fotos/Casamientos.jpeg', thumb: 'fotos/Casamientos.jpeg', title: 'Casamientos', category: 'eventos' },
            { url: 'fotos/Festivales.jpeg', thumb: 'fotos/Festivales.jpeg', title: 'Festivales', category: 'eventos' },
            { url: 'fotos/Fiesta de colaci%C3%B3n.jpeg', thumb: 'fotos/Fiesta de colaci%C3%B3n.jpeg', title: 'Fiesta de Colación', category: 'eventos' },
            { url: 'fotos/Fiesta de colaci%C3%B3n..jpeg', thumb: 'fotos/Fiesta de colaci%C3%B3n..jpeg', title: 'Fiesta de Colación', category: 'eventos' },
            { url: 'fotos/Fiestas%20patronales.jpeg', thumb: 'fotos/Fiestas%20patronales.jpeg', title: 'Fiestas Patronales', category: 'eventos' },
            { url: 'fotos/Fiestas%20privadas.jpeg', thumb: 'fotos/Fiestas%20privadas.jpeg', title: 'Fiestas Privadas', category: 'eventos' },
            { url: 'fotos/Fiestas%20privadas%20como%20cumplea%C3%B1os.jpeg', thumb: 'fotos/Fiestas%20privadas%20como%20cumplea%C3%B1os.jpeg', title: 'Fiestas Privadas y Cumpleaños', category: 'eventos' }
        ],
        filteredPhotos: [],
        authed: false,
        firebaseWritable: true,
        currentFilter: 'all',
        currentImageIndex: 0
    };

    // ===== CATEGORIAS Y ETIQUETAS =====
    const SONG_CATS = { paraguayas: 'Polkas y Guaranías', latinas: 'Cumbias y Salsa', merengues: 'Merengues', romanticas: 'Baladas', boleros: 'Boleros', mexicanas: 'Mexicanos y Corridos', internacional: 'Rock y Pop' };
    const CAT_ICONS = { paraguayas: 'fa-flag', latinas: 'fa-drum', merengues: 'fa-bolt', romanticas: 'fa-heart', boleros: 'fa-music', mexicanas: 'fa-guitar', internacional: 'fa-globe', general: 'fa-star', concierto: 'fa-music', integradores: 'fa-users', eventos: 'fa-glass-cheers', promo: 'fa-camera' };
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
        return 'Hola, quiero hacer una consulta para contratar a la banda';
    }

    // URL de foto: si existe thumbnail para el grid, la usamos;
    // para el lightbox (full-res) siempre usamos la original.
    function thumbUrl(p) { return (p && p.thumb) ? p.thumb : (p ? p.url : ''); }

    // ===== CARGAR DATOS =====
    function loadBackup() {
        try { const raw = localStorage.getItem('onaSiteBackup'); return raw ? JSON.parse(raw) : null; }
        catch (e) { return null; }
    }
    async function loadData() {
        // Respaldo LOCAL: si Firebase no esta configurado (o fallo), la
        // pagina publica lee lo que se guardo desde el panel en localStorage.
        if (!firebaseReady) {
            const backup = loadBackup();
            if (backup) {
                state.site = Object.assign({}, state.site, backup);
                state.site.hero = Object.assign({ subtitle: 'Banda Musical desde 1994', desc: '' }, (backup.hero || {}));
                if (backup.photos && backup.photos.length) {
                    state.photos = backup.photos;
                }
            }
            state.filteredPhotos = state.photos.slice();
        }
        if (firebaseReady) {
            try {
                const doc = await CONFIG_DOC.get();
                if (doc.exists) {
                    const data = doc.data() || {};
                    state.site = Object.assign({}, state.site, data);
                    state.site.hero = Object.assign({ subtitle: 'Banda Musical desde 1994', desc: '' }, (data.hero || {}));
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
        safe(renderGallery);
        safe(renderRepertoire);
        safe(renderServices);
        safe(renderContact);
        safe(renderMap);
        safe(updateWaFloat);
    }

    function updateWaFloat() {
        const f = $('waFloat');
        if (f) f.href = waLink() + '?text=' + encodeURIComponent(waMessage());
    }

    function safe(fn) {
        try { fn(); } catch (e) { console.error('Error en render:', fn && fn.name, e && e.message); }
    }

    function renderBrand() {
        const name = state.site.band_name || 'Onda Joven';
        document.title = name + ' | Banda Musical';
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

    function renderAbout() {
        const at = $('aboutText');
        if (at) at.textContent = state.site.about || 'Onda Joven se fundó el 21 de septiembre de 1994 bajo la dirección de los Hermanos Noguera.';
        const ht = $('historyText');
        if (ht) ht.textContent = state.site.history || '';
        const stats = (state.site.stats && state.site.stats.length) ? state.site.stats
            : [{ label: 'Años de Música', value: '32' }, { label: 'Desde el Año', value: '1994' }, { label: 'Integrantes', value: '5' }];
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
        const cl = $('contactLocation'); if (cl && s.location) cl.textContent = s.location;

        // Telefono con enlace a WhatsApp (abre chat con mensaje de consulta)
        const cp = $('contactPhone');
        if (cp && s.phone) cp.innerHTML = '<a href="' + waLink() + '?text=' + encodeURIComponent(waMessage()) + '" target="_blank" rel="noopener" style="color:var(--accent);text-decoration:none">' + esc(s.phone) + ' <i class="fab fa-whatsapp" style="font-size:1.2rem;vertical-align:middle"></i></a>';

        const ce = $('contactEmail');
        if (ce) {
            if (s.email) { ce.innerHTML = '<a href="mailto:' + esc(s.email) + '" style="color:var(--accent);text-decoration:none">' + esc(s.email) + '</a>'; }
            else { ce.textContent = '--'; }
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
        frame.style.display = 'block'; placeholder.style.display = 'none'; bar.style.display = 'block';
        const at = $('mapAddressText'); if (at) at.textContent = query;
        $('mapIframe').src = 'https://www.google.com/maps?q=' + encodeURIComponent(query) + '&output=embed';
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
            try { const doc = await CONFIG_DOC.get(); if (doc.exists) { const d = doc.data(); state.site = Object.assign({}, state.site, d); state.site.hero = Object.assign({ subtitle: 'Banda Musical desde 1994', desc: '' }, (d.hero || {})); } } catch (e) {}
            try { const snap = await db.collection('photos').orderBy('order', 'asc').get(); const l = []; snap.forEach(p => l.push(Object.assign({ id: p.id }, p.data()))); state.photos = l; state.filteredPhotos = l.slice(); } catch (e) {}
        }
        renderAll();
    }
})();
