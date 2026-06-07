const express = require("express");
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const app = express();
const PORT = process.env.PORT || 3000;

let radiosData = [];

// ======================================
// CARGAR JSON
// ======================================
try {
    const jsonPath = path.join(__dirname, "radios.json");

    const raw = fs.readFileSync(jsonPath, "utf8");

    radiosData = JSON.parse(raw);

    if (!Array.isArray(radiosData)) {
        throw new Error("El archivo radios.json debe contener un array");
    }

    console.log(
        `✅ JSON cargado correctamente (${radiosData.length} emisoras)`
    );

} catch (err) {

    console.error("❌ Error leyendo radios.json");
    console.error(err);

    process.exit(1);
}

// ======================================
// LOGGING
// ======================================
app.use((req, res, next) => {

    console.log(`📡 ${req.method} ${req.url}`);

    next();

});

// ======================================
// ROOT
// ======================================
app.get("/", (req, res) => {

    res.json({
        status: "online",
        message: "API Radio Online",
        endpoints: {
            radios: "/radios",
            radio: "/radio/:id"
        }
    });

});

// ======================================
// LISTA DE RADIOS
// ======================================
app.get("/radios", (req, res) => {

    res.json(radiosData);

});

// ======================================
// STREAM DE RADIO
// ======================================
app.get("/radio/:id", (req, res) => {

    const id = Number(req.params.id);

    const radio =
        radiosData.find(r => Number(r.id) === id);

    if (!radio) {

        return res.status(404).json({
            error: "Radio no encontrada"
        });

    }

    if (!radio.url) {

        return res.status(400).json({
            error: "La emisora no tiene URL válida"
        });

    }

    console.log(
        `🎵 Conectando: ${radio.name || id}`
    );

    let proxyReq = null;
    let stream = null;
    let clientConnected = true;

    // ==================================
    // LIMPIEZA
    // ==================================
    const cleanup = () => {

        if (stream && !stream.destroyed) {
            stream.destroy();
        }

        if (proxyReq && !proxyReq.destroyed) {
            proxyReq.destroy();
        }

        stream = null;
        proxyReq = null;

    };

    // ==================================
    // ERROR CONTROLADO
    // ==================================
    const sendError = (status, message) => {

        if (!res.headersSent && clientConnected) {

            res.status(status).json({
                error: message
            });

        }

        cleanup();

    };

    // ==================================
    // CONECTAR STREAM
    // ==================================
    const connectToStream = (
        streamUrl,
        redirectCount = 0
    ) => {

        if (!clientConnected) {
            return cleanup();
        }

        if (redirectCount > 5) {

            return sendError(
                502,
                "Demasiadas redirecciones"
            );

        }

        let parsedUrl;

        try {

            parsedUrl = new URL(streamUrl);

        } catch (err) {

            return sendError(
                400,
                "URL inválida"
            );

        }

        const client =
            parsedUrl.protocol === "https:"
                ? https
                : http;

        proxyReq = client.request({
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || (
                parsedUrl.protocol === "https:"
                    ? 443
                    : 80
            ),
            path: parsedUrl.pathname + parsedUrl.search,
            method: "GET",
            timeout: 10000,
            headers: {
                "User-Agent": "Mozilla/5.0 (RadioProxy)",
                "Icy-MetaData": "1",
                "Accept": "*/*",
                "Accept-Encoding": "identity",
                "Connection": "close"
            }

        }, (response) => {

            // ==========================
            // REDIRECCIONES
            // ==========================
            if (
                [301, 302, 307, 308]
                    .includes(response.statusCode)
                &&
                response.headers.location
            ) {

                const nextUrl =
                    new URL(
                        response.headers.location,
                        streamUrl
                    ).href;

                console.log(
                    `🔄 Redirección ${redirectCount + 1}: ${nextUrl}`
                );

                response.resume();

                return connectToStream(
                    nextUrl,
                    redirectCount + 1
                );

            }

            // ==========================
            // ERROR HTTP
            // ==========================
            if (response.statusCode >= 400) {

                response.resume();

                return sendError(
                    response.statusCode,
                    `Error HTTP ${response.statusCode}`
                );

            }

            const contentType =
                response.headers["content-type"]
                || "audio/mpeg";

            res.writeHead(200, {
                "Content-Type": contentType,
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "no-cache",
                "Transfer-Encoding": "chunked"
            });

            stream = response;

            stream.on("error", (err) => {

                console.error(
                    "❌ Error stream:",
                    err.message
                );

                cleanup();

            });

            stream.pipe(res);

        });

        // ==========================
        // TIMEOUT
        // ==========================
        proxyReq.setTimeout(10000, () => {

            console.error(
                `❌ Timeout radio ${id}`
            );

            proxyReq.destroy();

            sendError(
                504,
                "Tiempo de espera agotado"
            );

        });

        // ==========================
        // ERROR CONEXIÓN
        // ==========================
        proxyReq.on("error", (err) => {

            console.error(
                "❌ Error conexión:",
                err.message
            );

            sendError(
                502,
                "Error conectando con la emisora"
            );

        });

        proxyReq.end();

    };

    // ==================================
    // CLIENTE DESCONECTADO
    // ==================================
    req.on("close", () => {

        clientConnected = false;

        console.log(
            `👋 Cliente desconectado radio ${id}`
        );

        cleanup();

    });

    req.on("error", (err) => {

        console.error(
            "❌ Error request:",
            err.message
        );

        clientConnected = false;

        cleanup();

    });

    connectToStream(radio.url);

});

// ======================================
// HEAD RADIO
// ======================================
app.head("/radio/:id", (req, res) => {

    const id = Number(req.params.id);

    const radio =
        radiosData.find(
            r => Number(r.id) === id
        );

    if (!radio) {

        return res.sendStatus(404);

    }

    res.sendStatus(200);

});

// ======================================
// ERROR GLOBAL
// ======================================
app.use((err, req, res, next) => {

    console.error(
        "❌ Error global:",
        err.stack || err.message
    );

    res.status(500).json({
        error: "Error interno del servidor"
    });

});

// ======================================
// INICIAR SERVIDOR
// ======================================
const server = app.listen(PORT, () => {

    console.log(
        `🚀 Servidor online en puerto ${PORT}`
    );

    console.log(
        `📻 Lista radios: http://localhost:${PORT}/radios`
    );

});

// ======================================
// APAGADO LIMPIO
// ======================================
const gracefulShutdown = (signal) => {

    console.log(
        `🛑 ${signal} recibido, cerrando servidor...`
    );

    server.close(() => {

        console.log(
            "✅ Servidor cerrado correctamente"
        );

        process.exit(0);

    });

};

process.on(
    "SIGTERM",
    () => gracefulShutdown("SIGTERM")
);

process.on(
    "SIGINT",
    () => gracefulShutdown("SIGINT")
);
