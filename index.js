const express = require('express');
const cors = require('cors');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// ======= CONFIGURACIÓN DE LA FRONTERÍSIMA =======
const configApp = {
  "radio": [
    {
      "radio_name": "La Fronterísima",
      "radio_genre": "Variedad",
      "radio_url": "https://virtual5.emisorasvirtuales.com/listen/la_fronterisima/live",
      "radio_image_url": "https://i.postimg.cc/4dpXTctM/Pics-Sizer-512x512.png",
      "radio_background": "false",
      "radio_background_url": "https://i.postimg.cc/yNVmRh6Q/radio-background.jpg",
      "blur_radio_background": "true",
      "song_metadata": "true",
      "image_album_art": "true",
      "image_album_art_dynamic_background": "true",
      "auto_play": "true"
    }
  ],
  "video": [
    {
      "channel_name": "La Fronterísima TV",
      "channel_url": "https://live20.bozztv.com/giatvplayout7/giatv-209411/playlist.m3u8",
      "channel_description": "<style>p {margin-bottom: 1.2em; text-align: justify; font-size: 13px;}</style><p>La Fronterísima es una plataforma digital moderna que ofrece una propuesta musical diversa, conectando artistas hispanoamericanos y del mundo para brindar una experiencia sonora auténtica, envolvente y llena de emociones.</p>\n <p>Una alternativa musical diseñada para llegar al corazón de cada oyente, con ritmos que inspiran, motivan y acompañan cada momento del día.</p>\n <p>Descubre, comparte y vibra con los contenidos exclusivos, entrevistas, playlists y una programación variada e innovadora, disponible en cualquier lugar y en cualquier dispositivo las 24 horas, para que la música siempre te acompañe sin límites.</p>",
      "channel_thumbnail": "https://i.postimg.cc/3wckw2kF/IMG-20251228-WA0012.jpg",
      "channel_vast_ads_tag_url": ""
    }
  ],
  "webview": [
    {
      "web_url": "https://lafronterisima.stream",
      "web_toolbar": "false"
    }
  ],
  "settings": [
    {
      "app_status": "1",
      "privacy_policy_url": "https://raw.githubusercontent.com/lafronterisima/Radio/gh-pages/privacy.txt",
      "redirect_url": "",
      "show_social_menu_on_radio_page": "true",
      "show_social_menu_on_video_page": "true"
    }
  ],
  "ads": [
    {
      "ad_status": "1",
      "main_ads": "admob",
      "backup_ads": "",
      "admob_app_id": "ca-app-pub-8389148678200434~3544236174",
      "admob_banner_id": "ca-app-pub-8389148678200434/4800777099",
      "admob_interstitial_id": "",
      "admob_native_id": "",
      "admob_app_open_id": "",
      "interstitial_ad_interval": 0
    }
  ],
  "socials": [
    {
      "social_name": "Youtube",
      "social_icon": "https://raw.githubusercontent.com/lafronterisima/CloudRadio/main/ic_youtube.png",
      "social_url": "https://youtube.com/@lafronterisima"
    },
    {
      "social_name": "Facebook",
      "social_icon": "https://raw.githubusercontent.com/lafronterisima/CloudRadio/main/ic_facebook.png",
      "social_url": "https://www.facebook.com/emisora.la.fronterisima"
    },
    {
      "social_name": "Instagram",
      "social_icon": "https://raw.githubusercontent.com/lafronterisima/CloudRadio/main/instagram.png",
      "social_url": "https://www.instagram.com/la_fronterisima"
    }
  ]
};

// ======= RUTAS =======

// 1. Ruta para que la App obtenga las estaciones (Simula PHP)
app.get('/api/get_stations.php', (req, res) => {
    res.status(200).json(configApp);
});

// 2. Ruta raíz para verificar que el servidor está en línea
app.get('/', (req, res) => {
    res.send("Servidor de La Fronterísima funcionando correctamente ✅");
});

// 3. Manejo de rutas no encontradas (404)
app.use((req, res) => {
    res.status(404).send("Lo siento, esa ruta no existe en el backend de la radio.");
});

// Configuración del puerto para Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});
