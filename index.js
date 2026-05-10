const express = require("express");
const fs = require("fs");

const app = express();

const PORT = process.env.PORT || 3000;

let radiosData = { radios: [] };

try {

  const raw = fs.readFileSync("radios.json", "utf8");

  radiosData = JSON.parse(raw);

  console.log(radiosData);

} catch (err) {

  console.error(err);

}

app.get("/", (req, res) => {

  res.json({
    status: "online",
    radios: radiosData.radios
  });

});

app.listen(PORT, () => {

  console.log(`Servidor ${PORT}`);

});
