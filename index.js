const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const VALID_API_KEY = process.env.API_KEY || "azura_key";

// Middleware para seguridad
const checkApiKey = (req, res, next) => {
    const userKey = req.headers['x-api-key'] || req.query.api_key;
    if (userKey === VALID_API_KEY) {
        next();
    } else {
        res.status(403).json({ status: "error", message: "Acceso no autorizado" });
    }
};

// Ruta que busca tu App (Simulando PHP)
app.get('/api/get_stations.php', checkApiKey, (req, res) => {
    const filePath = path.join(__dirname, 'radios.json');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return res.status(500).send("Error interno");
        res.status(200).json(JSON.parse(data));
    });
});

// Para que no de error al entrar a /api
app.get('/api', (req, res) => {
    res.send("API de Radio activa. Endpoint: /get_stations.php");
});

app.get('/', (req, res) => {
    res.send('La Fronterisima Backend ✅');
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});
