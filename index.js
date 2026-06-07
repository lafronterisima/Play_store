const express = require("express");
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const app = express();
const PORT = process.env.PORT || 3000;

let radiosData = [];

// Cargar radios.json de forma segura
try {
    const jsonPath = path.join(__dirname, "radios.json");
    if (fs.existsSync(jsonPath)) {
        const raw = fs.readFileSync(jsonPath, "utf8");
        radiosData = JSON.parse(raw);
        console.log(`✅ JSON cargado correctamente: ${radiosData.length} emisoras`);
    } else {
        console.warn("⚠️ radios.json no encontrado, usando datos por defecto");
        radiosData = [];
    }
} catch (err) {
    console.error("❌ Error leyendo radios.json:", err.message);
    radiosData = [];
}

// Middleware para logging de peticiones
app.use((req, res, next) => {
    console.log(`📡 ${req.method} ${req.url}`);
    next();
});

// ROOT
app.get("/", (req, res) => {
    res.json({
        status: "online",
        message: "API de Radio Online",
        endpoints: {
            radios: "/radio",
            radio_por_id: "/radio/:id"
        }
    });
});

// LISTA DE RADIOS
app.get("/radio", (req, res) => {
    if (radiosData.length === 0) {
        return res.status(404).json({ error: "No hay emisoras disponibles" });
    }
    res.json(radiosData);
});

// STREAM RADIO (SEGURO CONTRA FUGAS Y REDIRECCIONES)
app.get("/radio/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const radio = radiosData.find(r => r.id === id);

    if (!radio) {
        return res.status(404).json({ error: "Radio no encontrada" });
    }

    if (!radio.url) {
        return res.status(400).json({ error: "La emisora no tiene URL válida" });
    }

    console.log(`🎵 Transmitiendo: ${radio.name || `Radio ID ${id}`} - ${radio.url}`);

    let isClientConnected = true;
    let proxyReq = null;
    let stream = null;

    // Función para limpiar recursos
    const cleanup = () => {
        if (stream) {
            stream.destroy();
            stream = null;
        }
        if (proxyReq) {
            proxyReq.destroy();
            proxyReq = null;
        }
    };

    // Función para enviar error
    const sendError = (statusCode, errorMessage) => {
        if (!res.headersSent && isClientConnected) {
            res.status(statusCode).json({ error: errorMessage });
        }
        cleanup();
    };

    // Función para conectar al stream
    const connectToStream = (streamUrl, redirectCount = 0) => {
        // Evitar bucles infinitos
        if (redirectCount > 5) {
            console.error(`❌ Radio ID ${id} superó el límite de redirecciones`);
            sendError(502, "Demasiadas redirecciones en la emisora origen");
            return;
        }

        // Verificar cliente conectado
        if (!isClientConnected) {
            cleanup();
            return;
        }

        // Validar URL
        let url;
        try {
            url = new URL(streamUrl);
        } catch (err) {
            console.error(`❌ URL inválida para radio ID ${id}: ${streamUrl}`);
            sendError(400, "URL de emisora inválida");
            return;
        }

        const client = url.protocol === "https:" ? https : http;

        const options = {
            hostname: url.hostname,
            port: url.port || (url.protocol === "https:" ? 443 : 80),
            path: url.pathname + url.search,
            method: "GET",
            headers: {
                "User-Agent": "Mozilla/5.0 (Radio-Proxy/1.0)",
                "Accept": "*/*",
                "Accept-Encoding": "identity", // Evitar compresión
                "Connection": "close"
            },
            timeout: 10000 // 10 segundos de timeout
        };

        proxyReq = client.request(options, (response) => {
            // Manejar redirecciones
            if ([301, 302, 307, 308].includes(response.statusCode) && response.headers.location) {
                console.log(`🔄 Redirigiendo radio ID ${id} [Salto ${redirectCount + 1}] → ${response.headers.location}`);
                response.resume(); // Vaciar buffer
                cleanup();
                return connectToStream(response.headers.location, redirectCount + 1);
            }

            // Error HTTP
            if (response.statusCode >= 400) {
                console.error(`❌ Error HTTP ${response.statusCode} para radio ID ${id}`);
                response.resume();
                sendError(response.statusCode, `La emisora origen devolvió error ${response.statusCode}`);
                return;
            }

            // Verificar contenido
            const contentType = response.headers["content-type"] || "audio/mpeg";
            if (!contentType.includes("audio")) {
                console.warn(`⚠️ Content-Type inesperado: ${contentType} para radio ID ${id}`);
            }

            // Configurar respuesta
            res.writeHead(200, {
                "Content-Type": contentType,
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET",
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Connection": "keep-alive"
            });

            stream = response;

            // Manejar errores del stream
            stream.on("error", (err) => {
                console.error(`❌ Error en stream de radio ID ${id}:`, err.message);
                if (!res.headersSent && isClientConnected) {
                    res.end();
                }
                cleanup();
            });

            // Pipe al cliente
            stream.pipe(res);
        });

        // Timeout
        proxyReq.setTimeout(10000, () => {
            console.error(`❌ Timeout conectando a radio ID ${id}`);
            proxyReq.destroy();
            sendError(504, "Tiempo de espera agotado con la emisora");
        });

        // Manejar errores de conexión
        proxyReq.on("error", (err) => {
            console.error(`❌ Error de conexión para radio ID ${id}:`, err.message);
            sendError(502, "Error conectando con la emisora origen");
        });

        // Finalizar request
        proxyReq.end();
    };

    // Manejar desconexión del cliente
    req.on("close", () => {
        if (isClientConnected) {
            console.log(`👋 Cliente desconectado de radio ID ${id}`);
            isClientConnected = false;
            cleanup();
        }
    });

    // Manejar error del request
    req.on("error", (err) => {
        console.error(`❌ Error en request de radio ID ${id}:`, err.message);
        isClientConnected = false;
        cleanup();
    });

    // Iniciar conexión
    connectToStream(radio.url);
});

// Ruta para verificar estado de una radio específica (HEAD request)
app.head("/radio/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const radio = radiosData.find(r => r.id === id);

    if (!radio || !radio.url) {
        return res.status(404).send();
    }
    res.status(200).send();
});

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error("❌ Error global:", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
});

// Iniciar servidor
const server = app.listen(PORT, () => {
    console.log(`🚀 Servidor online en puerto ${PORT}`);
    console.log(`📻 API disponibles:`);
    console.log(`   - GET  /radio      → Lista de emisoras`);
    console.log(`   - GET  /radio/:id  → Stream de emisora`);
});

// Manejo de cierre graceful
process.on("SIGTERM", () => {
    console.log("🛑 Recibido SIGTERM, cerrando servidor...");
    server.close(() => {
        console.log("✅ Servidor cerrado");
        process.exit(0);
    });
});

process.on("SIGINT", () => {
    console.log("🛑 Recibido SIGINT, cerrando servidor...");
    server.close(() => {
        console.log("✅ Servidor cerrado");
        process.exit(0);
    });
});
