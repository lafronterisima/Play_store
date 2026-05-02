const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ======= CONFIGURACIÓN =======
const RADIOS_FILE = path.join(__dirname, 'radios.json');
let cachedData = null;
let cacheTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos de caché

// ======= FUNCIÓN PARA LEER RADIOS.JSON CON CACHÉ =======
async function readRadiosConfig() {
    try {
        // Verificar caché
        if (cachedData && cacheTime && (Date.now() - cacheTime) < CACHE_DURATION) {
            console.log('📦 Sirviendo desde caché');
            return cachedData;
        }

        // Leer archivo
        const data = await fs.readFile(RADIOS_FILE, 'utf8');
        const config = JSON.parse(data);
        
        // Actualizar caché
        cachedData = config;
        cacheTime = Date.now();
        
        // Contar emisoras
        const radioCount = config.radio ? config.radio.length : 0;
        console.log(`✅ radios.json cargado correctamente - ${radioCount} emisora(s) encontrada(s)`);
        
        return config;
    } catch (err) {
        console.error("❌ Error al leer radios.json:", err);
        
        // Si hay error pero tenemos caché, devolver caché antigua
        if (cachedData) {
            console.log('⚠️ Usando caché antigua por error');
            return cachedData;
        }
        
        throw new Error("No se pudo cargar la configuración");
    }
}

// ======= RUTAS API =======

// Ruta principal para la app (emulando PHP)
app.get('/api/get_stations.php', async (req, res) => {
    try {
        const config = await readRadiosConfig();
        
        // Agregar metadatos útiles
        const response = {
            ...config,
            _metadata: {
                timestamp: new Date().toISOString(),
                server: "Render - La Fronterísima",
                version: "1.0.0",
                total_radios: config.radio ? config.radio.length : 0,
                total_videos: config.video ? config.video.length : 0,
                total_socials: config.socials ? config.socials.length : 0
            }
        };
        
        res.status(200).json(response);
    } catch (err) {
        res.status(500).json({ 
            status: "error", 
            message: "No se pudo cargar la configuración",
            error: err.message 
        });
    }
});

// Ruta alternativa sin .php (para compatibilidad)
app.get('/api/stations', async (req, res) => {
    try {
        const config = await readRadiosConfig();
        res.status(200).json(config);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Ruta para obtener solo las radios
app.get('/api/radios', async (req, res) => {
    try {
        const config = await readRadiosConfig();
        res.status(200).json({ 
            radios: config.radio || [],
            count: config.radio ? config.radio.length : 0
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Ruta para obtener solo videos
app.get('/api/videos', async (req, res) => {
    try {
        const config = await readRadiosConfig();
        res.status(200).json({ 
            videos: config.video || [],
            count: config.video ? config.video.length : 0
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Ruta para obtener redes sociales
app.get('/api/socials', async (req, res) => {
    try {
        const config = await readRadiosConfig();
        res.status(200).json({ 
            socials: config.socials || [],
            count: config.socials ? config.socials.length : 0
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Ruta para obtener settings
app.get('/api/settings', async (req, res) => {
    try {
        const config = await readRadiosConfig();
        res.status(200).json({ 
            settings: config.settings ? config.settings[0] : {},
            ads: config.ads ? config.ads[0] : {}
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Ruta para obtener una radio específica por índice
app.get('/api/radio/:index', async (req, res) => {
    try {
        const config = await readRadiosConfig();
        const index = parseInt(req.params.index);
        
        if (config.radio && config.radio[index]) {
            res.json(config.radio[index]);
        } else {
            res.status(404).json({ error: "Radio no encontrada" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Ruta para actualizar el archivo (con autenticación)
app.post('/api/update-stations', async (req, res) => {
    const authToken = req.headers.authorization;
    
    // Validar token (cambia esto por una clave segura)
    if (authToken !== 'Bearer tu_token_secreto_aqui_123') {
        return res.status(401).json({ error: "No autorizado" });
    }
    
    try {
        const newData = req.body;
        
        // Validar estructura básica
        if (!newData || !newData.radio) {
            return res.status(400).json({ error: "Formato inválido. Se requiere array 'radio'" });
        }
        
        // Guardar archivo
        await fs.writeFile(RADIOS_FILE, JSON.stringify(newData, null, 2), 'utf8');
        
        // Limpiar caché
        cachedData = null;
        cacheTime = null;
        
        res.json({ 
            success: true, 
            message: "Archivo actualizado correctamente",
            radios_count: newData.radio.length
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Ruta para forzar recarga de caché
app.post('/api/reload-cache', async (req, res) => {
    const authToken = req.headers.authorization;
    
    if (authToken !== 'Bearer tu_token_secreto_aqui_123') {
        return res.status(401).json({ error: "No autorizado" });
    }
    
    try {
        // Limpiar caché
        cachedData = null;
        cacheTime = null;
        
        // Recargar datos
        const config = await readRadiosConfig();
        
        res.json({ 
            success: true, 
            message: "Caché recargada",
            radios_count: config.radio ? config.radio.length : 0,
            data: config 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Ruta de health check para Render
app.get('/health', async (req, res) => {
    try {
        const config = await readRadiosConfig();
        res.status(200).json({ 
            status: "OK", 
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            cache: {
                active: cachedData !== null,
                age: cacheTime ? Math.floor((Date.now() - cacheTime) / 1000) : 0
            },
            stats: {
                radios: config.radio ? config.radio.length : 0,
                videos: config.video ? config.video.length : 0,
                socials: config.socials ? config.socials.length : 0
            }
        });
    } catch (err) {
        res.status(500).json({ 
            status: "Error", 
            error: err.message 
        });
    }
});

// Ruta raíz con información
app.get('/', (req, res) => {
    res.json({
        name: "La Fronterísima API",
        version: "1.0.0",
        status: "online",
        endpoints: {
            all_data: "/api/get_stations.php",
            radios: "/api/radios",
            videos: "/api/videos",
            socials: "/api/socials",
            settings: "/api/settings",
            health: "/health"
        },
        server: "Render",
        documentation: "https://github.com/lafronterisima/api"
    });
});

// ======= MIDDLEWARE DE ERRORES =======
app.use((req, res, next) => {
    res.status(404).json({ 
        error: "Ruta no encontrada",
        path: req.path,
        available_endpoints: [
            "/api/get_stations.php",
            "/api/radios",
            "/api/videos",
            "/api/socials",
            "/api/settings",
            "/health"
        ]
    });
});

app.use((err, req, res, next) => {
    console.error("Error no manejado:", err);
    res.status(500).json({ 
        error: "Error interno del servidor",
        message: err.message 
    });
});

// ======= INICIO DEL SERVIDOR =======
app.listen(PORT, "0.0.0.0", async () => {
    console.log(`
    ═══════════════════════════════════════
    📻 LA FRONTERÍSIMA - API SERVER
    ═══════════════════════════════════════
    🚀 Puerto: ${PORT}
    📁 Archivo: ${RADIOS_FILE}
    💾 Caché: ${CACHE_DURATION / 1000} segundos
    🌐 CORS: Activado
    ═══════════════════════════════════════
    `);
    
    // Verificar que el archivo existe al inicio
    try {
        await fs.access(RADIOS_FILE);
        const config = await readRadiosConfig();
        const radioCount = config.radio ? config.radio.length : 0;
        const videoCount = config.video ? config.video.length : 0;
        const socialCount = config.socials ? config.socials.length : 0;
        
        console.log(`✅ Configuración cargada:`);
        console.log(`   📻 Emisoras: ${radioCount}`);
        console.log(`   📺 Videos: ${videoCount}`);
        console.log(`   💬 Redes Sociales: ${socialCount}`);
        
        if (radioCount === 0) {
            console.warn(`⚠️ ADVERTENCIA: No se encontraron emisoras en el archivo`);
        }
        
    } catch (err) {
        console.error("❌ ERROR CRÍTICO: No se encuentra el archivo radios.json");
        console.log("📝 Creando archivo con tus datos...");
        
        // Crear archivo con los datos que me proporcionaste
        const ejemploConfig = {
            "radio": [
                {
                    "radio_name": "La Fronterísima",
                    "radio_genre": "Variedad",
                    "radio_url": "https://virtual5.emisorasvirtuales.com/listen/la_fronterisima/live",
                    "radio_image_url": "https://i.postimg.cc/4dpXTctM/Pics-Sizer-512x512.png",
                    "radio_background": "false",
                    "radio_background_url": "https://i.postimg.cc/yNVmRh6Q/radio-background.jpg",
                    "blur_radio_background": "true",
                    "song_metadata": "true",
                    "image_album_art": "true",
                    "image_album_art_dynamic_background": "true",
                    "auto_play": "true"
                }
            ],
            "video": [
                {
                    "channel_name": "La Fronterísima TV",
                    "channel_url": "https://live20.bozztv.com/giatvplayout7/giatv-209411/playlist.m3u8",
                    "channel_description": "<p>La Fronterísima es una plataforma digital moderna que ofrece una propuesta musical diversa</p>",
                    "channel_thumbnail": "https://i.postimg.cc/3wckw2kF/IMG-20251228-WA0012.jpg",
                    "channel_vast_ads_tag_url": ""
                }
            ],
            "socials": [
                {
                    "social_name": "Youtube",
                    "social_icon": "https://raw.githubusercontent.com/lafronterisima/CloudRadio/main/ic_youtube.png",
                    "social_url": "https://youtube.com/@lafronterisima"
                },
                {
                    "social_name": "Facebook",
                    "social_icon": "https://raw.githubusercontent.com/lafronterisima/CloudRadio/main/ic_facebook.png",
                    "social_url": "https://www.facebook.com/emisora.la.fronterisima"
                },
                {
                    "social_name": "Instagram",
                    "social_icon": "https://raw.githubusercontent.com/lafronterisima/CloudRadio/main/instagram.png",
                    "social_url": "https://www.instagram.com/la_fronterisima"
                }
            ]
        };
        
        await fs.writeFile(RADIOS_FILE, JSON.stringify(ejemploConfig, null, 2), 'utf8');
        console.log("✅ Archivo creado correctamente con 1 emisora");
    }
});

// ======= MANEJO DE SEÑALES DE CIERRE =======
process.on('SIGTERM', () => {
    console.log('🛑 Recibida señal SIGTERM, cerrando servidor...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 Recibida señal SIGINT, cerrando servidor...');
    process.exit(0);
});
