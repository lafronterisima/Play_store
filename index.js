const express = require("express");
const fs = require("fs");
const https = require("https");
const http = require("http");

const app = express();

const PORT = process.env.PORT || 3000;

// Leer radio.json
let radiosData = { radio: [] };

try {

  const raw = fs.readFileSync("./radio.json", "utf8");

  radiosData = JSON.parse(raw);

  console.log("JSON cargado");

} catch (err) {

  console.error(err);

}

// Inicio
app.get("/", (req, res) => {

  res.json({
    status: "online",
    radios: radiosData.radio
  });

});

// Stream proxy
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
