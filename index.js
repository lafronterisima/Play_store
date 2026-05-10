const express = require("express");
const fs = require("fs");

const app = express();

const PORT = process.env.PORT || 3000;

// Leer archivo
let radiosData = { radios: [] };

try {

  const raw = fs.readFileSync("./radios.json", "utf8");

  console.log("Contenido radios.json:");
  console.log(raw);

  radiosData = JSON.parse(raw);

} catch (err) {

  console.error("ERROR LEYENDO JSON:");
  console.error(err);

}

// Ruta principal
app.get("/", (req, res) => {

  res.json({
    status: "online",
    radios: radiosData.radios
  });

});

app.listen(PORT, () => {
  console.log(`Servidor puerto ${PORT}`);
});
