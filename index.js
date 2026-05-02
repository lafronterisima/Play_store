const express = require('express');
const cors = require('cors');
const fs = require('fs').promises; // Usar versión promesa para mejor rendimiento
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
        
        console.log('✅ radios.json cargado correctamente');
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
                version: "1.0.0"
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

// Ruta para obtener solo una estación específica
app.get('/api/station/:id', async (req, res) => {
    try {
        const config = await readRadiosConfig();
        const stationId = req.params.id;
        
        if (config.radios && config.radios[stationId]) {
            res.json(config.radios[stationId]);
        } else {
            res.status(404).json({ error: "Radio no encontrada" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Ruta para actualizar el archivo (con autenticación básica)
app.post('/api/update-stations', async (req, res) => {
    const authToken = req.headers.authorization;
    
    // Validar token simple (cámbialo por una clave segura)
    if (authToken !== 'Bearer tu_token_secreto_aqui') {
        return res.status(401).json({ error: "No autorizado" });
    }
    
    try {
        const newData = req.body;
        
        // Validar estructura básica
        if (!newData || !newData.radios) {
            return res.status(400).json({ error: "Formato inválido" });
        }
        
        // Guardar archivo
        await fs.writeFile(RADIOS_FILE, JSON.stringify(newData, null, 2), 'utf8');
        
        // Limpiar caché
        cachedData = null;
        cacheTime = null;
        
        res.json({ success: true, message: "Archivo actualizado correctamente" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Ruta para forzar recarga de caché
app.post('/api/reload-cache', async (req, res) => {
    const authToken = req.headers.authorization;
    
    if (authToken !== 'Bearer tu_token_secreto_aqui') {
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
            data: config 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Ruta de health check para Render
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: "OK", 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cache: {
            active: cachedData !== null,
            age: cacheTime ? Date.now() - cacheTime : 0
        }
    });
});

// Ruta raíz con información
app.get('/', (req, res) => {
    res.json({
        name: "La Fronterísima API",
        version: "1.0.0",
        status: "online",
        endpoints: {
            stations: "/api/get_stations.php",
            station: "/api/station/:id",
            health: "/health"
        },
        server: "Render",
        documentation: "https://github.com/tu-repo"
    });
});

// Ruta para ver el archivo crudo (solo para admin)
app.get('/admin/raw-config', async (req, res) => {
    const authToken = req.headers.authorization;
    
    if (authToken !== 'Bearer tu_token_secreto_aqui') {
        return res.status(401).json({ error: "No autorizado" });
    }
    
    try {
        const data = await fs.readFile(RADIOS_FILE, 'utf8');
        res.type('application/json').send(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ======= MIDDLEWARE DE ERRORES =======
app.use((req, res, next) => {
    res.status(404).json({ 
        error: "Ruta no encontrada",
        path: req.path 
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
        const radioCount = config.radios ? Object.keys(config.radios).length : 0;
        console.log(`✅ radios.json cargado - ${radioCount} emisora(s) encontrada(s)`);
    } catch (err) {
        console.error("❌ ERROR CRÍTICO: No se encuentra el archivo radios.json");
        console.error("📝 Creando archivo de ejemplo...");
        
        // Crear archivo de ejemplo
        const ejemploConfig = {
            radios: {
                "fronterisima": {
                    name: "La Fronterísima",
                    url: "https://virtual5.emisorasvirtuales.com/listen/la_fronterisima/live",
                    image: "https://ejemplo.com/logo.png",
                    description: "¡La Rumbera que Manda en el Dial!",
                    genre: "Salsa, Reggaetón, Vallenato"
                }
            }
        };
        
        await fs.writeFile(RADIOS_FILE, JSON.stringify(ejemploConfig, null, 2), 'utf8');
        console.log("✅ Archivo de ejemplo creado");
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
