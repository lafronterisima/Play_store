const express = require("express");
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const app = express();

const PORT = process.env.PORT || 3000;

let radiosData = { radio: [] };

try {

    const jsonPath = path.join(__dirname, "radios.json");

    const raw = fs.readFileSync(jsonPath, "utf8");

    radiosData = JSON.parse(raw);

    console.log("JSON cargado correctamente");

} catch (err) {

    console.error("Error leyendo radio.json");

    console.error(err);

}

app.get("/", (req, res) => {

    res.json({
        status: "online",
        radios: radiosData.radio
    });

});

app.get("/radio/:id", (req, res) => {

    const radio = radiosData.radio[0];

    if (!radio) {

        return res.status(404).json({
            error: "Radio no encontrada"
        });

    }

    const streamUrl = radio.radio_url;

    const client = streamUrl.startsWith("https")
        ? https
        : http;

    client.get(streamUrl, (stream) => {

        res.writeHead(200, {
            "Content-Type": stream.headers["content-type"] || "audio/mpeg",
            "Access-Control-Allow-Origin": "*"
        });

        stream.pipe(res);

    }).on("error", (err) => {

        console.error(err);

        res.status(500).json({
            error: "Error conectando stream"
        });

    });

});

app.listen(PORT, () => {

    console.log(`Servidor online puerto ${PORT}`);

});
