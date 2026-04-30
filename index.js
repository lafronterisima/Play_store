const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Aquí leemos la API_KEY desde Render o usamos la que pusiste por defecto
const VALID_API_KEY = process.env.API_KEY || "7174dfea01d88d15:97937cd553c3c76145ab3ed92cc4c4ab";

// Middleware de seguridad
const checkApiKey = (req, res, next) => {
    // La App suele enviarlo como parámetro 'api_key' en la URL
    const userKey = req.query.api_key || req.headers['x-api-key'];
    
    if (userKey === VALID_API_KEY) {
        next();
    } else {
        console.log(`Intento de acceso fallido con llave: ${userKey}`);
        res.status(403).json({ status: "error", message: "Acceso no autorizado" });
    }
};

// ESTA ES LA RUTA QUE BUSCA TU APP
// Al unir SERVER_URL + "get_stations.php" se activa este endpoint
app.get('/api/get_stations.php', checkApiKey, (req, res) => {
    const filePath = path.join(__dirname, 'radios.json');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({status: "error", message: "No se encontró radios.json"});
        res.status(200).json(JSON.parse(data));
    });
});

// Ruta de cortesía para /api
app.get('/api', (req, res) => {
    res.send("API de Radio activa. Endpoint: /get_stations.php");
});

app.get('/', (req, res) => {
    res.send('Servidor de La Fronterísima funcionando correctamente ✅');
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Servidor listo para la App en el puerto ${PORT}`);
});
