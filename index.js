const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ======= CONFIGURACIÓN COMPLETA DE TU RADIO =======
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
      "channel_description": "<style>p {margin-bottom: 1.2em; text-align: justify; font-size: 13px;}</style><p>La Fronterísima es una plataforma digital moderna...</p>",
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

// ======= LA RUTA QUE SIMULA EL ARCHIVO PHP =======
app.get('/api/get_stations.php', (req, res) => {
    // Esto responde exactamente igual que si fuera un archivo .php real
    res.json(configApp);
});

// Ruta raíz para prueba
app.get('/', (req, res) => {
    res.send("API Central de La Fronterísima activa ✅");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Bridge de Radio corriendo en puerto ${PORT}`));
