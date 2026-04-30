const express = require('express');
const cors = require('cors');
const fs = require('fs'); // Módulo para leer archivos
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ======= RUTA PARA LA APP =======

app.get('/api/get_stations.php', (req, res) => {
    // Definimos la ruta del archivo radios.json
    const filePath = path.join(__dirname, 'radios.json');

    // Leemos el archivo de forma asíncrona
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error("Error al leer radios.json:", err);
            return res.status(500).json({ status: "error", message: "No se pudo cargar la configuración" });
        }

        try {
            // Convertimos el texto del archivo a un objeto JSON
            const configApp = JSON.parse(data);
            res.status(200).json(configApp);
        } catch (parseErr) {
            console.error("Error al procesar JSON:", parseErr);
            res.status(500).json({ status: "error", message: "Formato de archivo inválido" });
        }
    });
});

// Ruta raíz
app.get('/', (req, res) => {
  res.send('Servidor de La Fronterisima funcionando 📻');
});

// Inicio del servidor optimizado para Render
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor leyendo radios.json en el puerto ${PORT}`);
});
