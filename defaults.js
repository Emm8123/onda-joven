// ============================================================
// ONDA JOVEN - defaults.js
// CONTENIDO POR DEFECTO DEL GRUPO (UNICA FUENTE DE VERDAD).
// app.js (sitio) y admin.js (panel) arrancan SIEMPRE desde aqui
// para que ninguno borre el contenido del otro.
// ============================================================
window.OJ_DEFAULTS = {
    site: {
        band_name: 'Onda Joven',
        history: 'El grupo musical Onda Joven nació el 21 de septiembre de 1994 en Curuguaty, Paraguay, fundado por los Hermanos Noguera. Desde sus inicios, la música corría por las venas de la familia: Carlino Noguera en guitarra y voz, Virino Noguera en percusión y Alfirio Noguera en el teclado, quien además asumió la dirección musical. En el bajo, el Prof. Venancio Godoy acompañó al grupo durante décadas hasta el año 2025, cuando se integró Cristian Armin Noguera para continuar con la tradición familiar. Hoy Onda Joven está formada por cuatro integrantes, todos de la familia, y ofrece música en vivo con sonido propio, luces, pantalla LED y boleta legal, animando casamientos, quinceañeras, fiestas patronales, festivales y todo tipo de celebraciones en el Paraguay.',
        hero: { subtitle: 'Grupo Musical desde 1994', desc: 'Grupo musical con más de 30 años de trayectoria. Música en vivo para tus eventos: casamientos, quinceañeras, fiestas patronales y más, con sonido propio, luces y pantalla LED.' },
        location: 'Curuguaty, Paraguay',
        map_query: '-24.4633671, -55.6907254',
        phone: '0971 820 528',
        whatsapp: '0971 820 528',
        email: '',
        videos: [],
        social: {},
        services: [
            { name: 'Casamientos', desc: 'La música perfecta para tu boda y recepción.', icon: 'fa-ring' },
            { name: 'Bodas de Oro', desc: 'Celebración inolvidable para aniversarios.', icon: 'fa-heart' },
            { name: 'Quinceañeras', desc: 'Ambienta el día más especial de tus 15 años.', icon: 'fa-crown' },
            { name: 'Fiestas Patronales', desc: 'Vivamos juntos las fiestas de tu comunidad.', icon: 'fa-church' },
            { name: 'Fiestas Privadas', desc: 'Cumpleaños y reuniones familiares con música en vivo.', icon: 'fa-glass-cheers' },
            { name: 'Festivales', desc: 'Espectáculo completo para escenarios y festivales.', icon: 'fa-star' },
            { name: 'Fiestas de Colación', desc: 'Cierra con broche de oro tu colación y graduación.', icon: 'fa-graduation-cap' },
            { name: 'Eventos Empresariales', desc: 'Amenización profesional para tu empresa.', icon: 'fa-briefcase' }
        ],
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
            ],
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
        stats: [
            { label: 'Años de Música', value: '32' },
            { label: 'Fundada en', value: '1994' },
            { label: 'Integrantes', value: '4' }
        ]
    },
    photos: [
        { url: 'fotos/Integrantes.jpeg', thumb: 'fotos/thumbs/Integrantes.jpeg', title: 'Integrantes de Onda Joven', category: 'integradores' },
        { url: 'fotos/Integrantes...jpeg', thumb: 'fotos/thumbs/Integrantes...jpeg', title: 'Integrantes', category: 'integradores' },
        { url: 'fotos/Integrantes....jpeg', thumb: 'fotos/thumbs/Integrantes....jpeg', title: 'Integrantes', category: 'integradores' },
        { url: 'fotos/Casamientos.jpeg', thumb: 'fotos/thumbs/Casamientos.jpeg', title: 'Casamientos', category: 'eventos' },
        { url: 'fotos/Festivales.jpeg', thumb: 'fotos/thumbs/Festivales.jpeg', title: 'Festivales', category: 'eventos' },
        { url: 'fotos/Fiesta de colaci%C3%B3n.jpeg', thumb: 'fotos/thumbs/Fiesta de colaci%C3%B3n.jpeg', title: 'Fiesta de Colación', category: 'eventos' },
        { url: 'fotos/Fiesta de colaci%C3%B3n..jpeg', thumb: 'fotos/thumbs/Fiesta de colaci%C3%B3n..jpeg', title: 'Fiesta de Colación', category: 'eventos' },
        { url: 'fotos/Fiestas%20patronales.jpeg', thumb: 'fotos/thumbs/Fiestas%20patronales.jpeg', title: 'Fiestas Patronales', category: 'eventos' },
        { url: 'fotos/Fiestas%20privadas.jpeg', thumb: 'fotos/thumbs/Fiestas%20privadas.jpeg', title: 'Fiestas Privadas', category: 'eventos' },
        { url: 'fotos/Fiestas%20privadas%20como%20cumplea%C3%B1os.jpeg', thumb: 'fotos/thumbs/Fiestas%20privadas%20como%20cumplea%C3%B1os.jpeg', title: 'Fiestas Privadas y Cumpleaños', category: 'eventos' }
    ]
};