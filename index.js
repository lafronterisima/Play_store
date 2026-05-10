const express = require("express");
const fs = require("fs");
const httpProxy = require("http-proxy");

const app = express();
const proxy = httpProxy.createProxyServer({});

const PORT = process.env.PORT || 3000;

// Leer radios.json
const radiosData = JSON.parse(
  fs.readFileSync("./radios.json", "utf8")
);

// Inicio
app.get("/", (req, res) => {
  res.json({
    status: "online",
    radios: radiosData.radios
  });
});

// Stream dinámico
app.get("/radio/:id", (req, res) => {

  const radio = radiosData.radios.find(
    r => r.id === req.params.id
  );

  if (!radio) {
    return res.status(404).json({
      error: "Radio no encontrada"
    });
  }

  proxy.web(req, res, {
    target: radio.stream_url,
    changeOrigin: true
  });

});

// Manejo errores
proxy.on("error", (err, req, res) => {

  console.error(err);

  res.writeHead(500, {
    "Content-Type": "application/json"
  });

  res.end(JSON.stringify({
    error: "Error conectando stream"
  }));

});

app.listen(PORT, () => {
  console.log(`Servidor iniciado puerto ${PORT}`);
});
