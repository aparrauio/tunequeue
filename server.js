/* ========================================
   TuneQueue — Backend API Server
   Proxies YouTube Data API v3 search
   Serves static frontend files
   ======================================== */

const express = require("express");
const path = require("path");
const app = express();

const PORT = process.env.PORT || 8000;

// ── Serve static frontend files ──
app.use(express.static(path.join(__dirname, "public")));

// ── YouTube Search API proxy ──
app.get("/api/search", async (req, res) => {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey) {
    return res.status(400).json({ error: "API key requerida. Configura tu YouTube API Key." });
  }

  const { q, type, maxResults, pageToken } = req.query;
  if (!q) {
    return res.status(400).json({ error: "Parámetro de búsqueda 'q' requerido." });
  }

  const searchType = type || "video";
  const limit = Math.min(parseInt(maxResults, 10) || 12, 50);

  const params = new URLSearchParams({
    part: "snippet",
    q: q,
    type: searchType,
    maxResults: String(limit),
    key: apiKey,
    videoEmbeddable: "true",
    safeSearch: "none",
  });

  if (pageToken) {
    params.set("pageToken", pageToken);
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/search?${params.toString()}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "Error en la API de YouTube",
        details: data.error,
      });
    }

    const videos = (data.items || [])
      .filter((item) => item.id?.videoId)
      .map((item) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        channel: item.snippet.channelTitle,
        channelId: item.snippet.channelId,
        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
        publishedAt: item.snippet.publishedAt,
        description: item.snippet.description,
      }));

    res.json({
      videos,
      nextPageToken: data.nextPageToken || null,
      totalResults: data.pageInfo?.totalResults || 0,
      resultsPerPage: data.pageInfo?.resultsPerPage || limit,
    });
  } catch (err) {
    console.error("YouTube API error:", err.message);
    res.status(500).json({ error: "Error al conectar con la API de YouTube." });
  }
});

// ── Health check ──
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Fallback: serve index.html for any non-API route ──
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`TuneQueue server listening on port ${PORT}`);
});
