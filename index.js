const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(cors());
app.use(express.json());

// 1. Ruta raíz para prueba
app.get('/', (req, res) => {
    res.send("Servidor de La Fronterísima funcionando ✅");
});

/**
 * 2. PUENTE PARA LA APP (Andromob)
 * Las apps de esta plantilla buscan específicamente esta ruta:
 * /api/get_stations.php (o similar según tu config)
 */
app.get('/api/get_stations.php', (req, res) => {
    const filePath = path.join(__dirname, 'radios.json');
    
    // Leemos tu archivo radios.json
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ status: "error", message: "No se encontró el archivo de radios" });
        }
        
        // Enviamos el contenido tal cual (asegúrate que el JSON tenga el formato Andromob)
        res.header("Content-Type", 'application/json');
        res.send(data);
    });
});

// 3. Tu endpoint original por si lo usas en otro lado
app.get('/radios', (req, res) => {
    const filePath = path.join(__dirname, 'radios.json');
    res.sendFile(filePath);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));
