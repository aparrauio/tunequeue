# TuneQueue — YouTube Playlist Creator

Busca por artista, canción o género musical y crea playlists de YouTube.

## Requisitos

- Node.js 18+
- YouTube Data API v3 Key ([obtener aquí](https://console.cloud.google.com/apis/credentials))

## Instalación local

```bash
npm install
npm start
```

La app estará disponible en `http://localhost:8000`

## Despliegue en Render

1. Sube este repositorio a GitHub
2. Ve a [render.com](https://render.com) y crea una cuenta
3. Clic en **New** → **Web Service**
4. Conecta tu repositorio de GitHub
5. Configura:
   - **Name**: tunequeue (o el nombre que prefieras)
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. Clic en **Create Web Service**

Render te dará una URL como `https://tunequeue.onrender.com` donde la app estará disponible.

## Estructura

```
├── server.js          # Backend Express (API proxy + static files)
├── package.json       # Dependencias y scripts
├── public/            # Frontend (servido estáticamente)
│   ├── index.html
│   ├── app.js
│   ├── style.css
│   └── base.css
```
