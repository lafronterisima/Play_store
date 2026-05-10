const express = require("express");
const axios = require("axios");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Leer radios.json
const radiosData = JSON.parse(
  fs.readFileSync("./radios.json", "utf8")
);

// Ruta principal
app.get("/", (req, res) => {
  res.json({
    status: "online",
    radios: radiosData.radios.map(radio => ({
      id: radio.id,
      name: radio.name,
      endpoint: `/radio/${radio.id}`
    }))
  });
});

// Streaming dinámico
app.get("/radio/:id", async (req, res) => {
  const radioId = req.params.id;

  const radio = radiosData.radios.find(
    r => r.id === radioId
  );

  if (!radio) {
    return res.status(404).json({
      error: "Radio no encontrada"
    });
  }

  try {
    const response = await axios({
      method: "get",
      url: radio.stream_url,
      responseType: "stream"
    });

    res.setHeader("Content-Type", "audio/mpeg");

    response.data.pipe(res);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Error conectando al streaming"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor iniciado en puerto ${PORT}`);
});
