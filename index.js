const express = require("express");
const fs = require("fs");
const https = require("https");
const http = require("http");

const app = express();

const PORT = process.env.PORT || 3000;

// Leer radios.json
let radiosData = { radios: [] };

try {

  const data = fs.readFileSync("./radios.json", "utf8");

  radiosData = JSON.parse(data);

  console.log("Radios cargadas:", radiosData);

} catch (err) {

  console.error("Error leyendo radios.json", err);

}

// Inicio
app.get("/", (req, res) => {

  res.json({
    status: "online",
    radios: radiosData.radios
  });

});

// Stream
app.get("/radio/:id", (req, res) => {

  const radio = radiosData.radios.find(
    r => r.id === req.params.id
  );

  if (!radio) {

    return res.status(404).json({
      error: "Radio no encontrada"
    });

  }

  const client = radio.stream_url.startsWith("https")
    ? https
    : http;

  client.get(radio.stream_url, (stream) => {

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
