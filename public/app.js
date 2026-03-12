/* ========================================
   TuneQueue — YouTube Playlist Creator
   YouTube URL builder (no OAuth required)
   ======================================== */

(function () {
  "use strict";

  // ── API Base URL ──
  const API = "";

  // ── State ──
  let activeTab = "artist";
  let selectedVideos = [];
  let apiKey = "";
  let nextPageToken = null;
  let currentQuery = "";
  let isLoading = false;

  // ── DOM refs ──
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");
  const suggestionChips = document.getElementById("suggestionChips");
  const resultsArea = document.getElementById("resultsArea");
  const resultsTitle = document.getElementById("resultsTitle");
  const resultsCount = document.getElementById("resultsCount");
  const videoList = document.getElementById("videoList");
  const emptyState = document.getElementById("emptyState");
  const loadingSkeleton = document.getElementById("loadingSkeleton");
  const playlistBar = document.getElementById("playlistBar");
  const playlistCount = document.getElementById("playlistCount");
  const createPlaylistBtn = document.getElementById("createPlaylistBtn");
  const configPanel = document.getElementById("configPanel");
  const apiKeyInput = document.getElementById("apiKeyInput");
  const saveKeyBtn = document.getElementById("saveKeyBtn");
  const configToggle = document.getElementById("configToggle");
  const configStatus = document.getElementById("configStatus");
  const loadMoreBtn = document.getElementById("loadMoreBtn");
  const playlistModal = document.getElementById("playlistModal");
  const modalOverlay = document.getElementById("modalOverlay");
  const modalCancelBtn = document.getElementById("modalCancelBtn");
  const modalUrlInput = document.getElementById("modalUrlInput");
  const modalCopyBtn = document.getElementById("modalCopyBtn");
  const modalOpenBtn = document.getElementById("modalOpenBtn");
  const modalSuccess = document.getElementById("modalSuccess");
  const toastContainer = document.getElementById("toastContainer");

  // ── Suggestions data ──
  const suggestions = {
    artist: [
      { label: "Bad Bunny", icon: "mic" },
      { label: "Taylor Swift", icon: "mic" },
      { label: "The Weeknd", icon: "mic" },
      { label: "Daft Punk", icon: "mic" },
      { label: "Radiohead", icon: "mic" },
      { label: "Billie Eilish", icon: "mic" },
    ],
    song: [
      { label: "Bohemian Rhapsody", icon: "music" },
      { label: "Blinding Lights", icon: "music" },
      { label: "Shape of You", icon: "music" },
      { label: "Despacito", icon: "music" },
      { label: "Levitating", icon: "music" },
      { label: "As It Was", icon: "music" },
    ],
    genre: [
      { label: "Pop", icon: "headphones" },
      { label: "Rock", icon: "headphones" },
      { label: "Hip Hop", icon: "headphones" },
      { label: "Reggaeton", icon: "headphones" },
      { label: "Jazz", icon: "headphones" },
      { label: "Lo-fi", icon: "headphones" },
    ],
  };

  const placeholders = {
    artist: "Nombre del artista...",
    song: "Nombre de la canción...",
    genre: "Género musical...",
  };

  // ── Icons ──
  function getChipIcon(type) {
    const icons = {
      mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>',
      music: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
      headphones: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>',
    };
    return icons[type] || icons.music;
  }

  function checkIcon() {
    return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>';
  }

  // ── Toast notifications ──
  function showToast(message, type) {
    type = type || "info";
    var toast = document.createElement("div");
    toast.className = "toast toast-" + type;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    requestAnimationFrame(function () {
      toast.classList.add("visible");
    });
    setTimeout(function () {
      toast.classList.remove("visible");
      setTimeout(function () { toast.remove(); }, 300);
    }, 4000);
  }

  // ── Render suggestion chips ──
  function renderSuggestions() {
    var chips = suggestions[activeTab] || [];
    suggestionChips.innerHTML = chips
      .map(function (chip) {
        return '<button class="chip" data-query="' + chip.label + '">' +
          getChipIcon(chip.icon) +
          chip.label +
          '</button>';
      })
      .join("");
  }

  // ── Config Panel ──
  configToggle.addEventListener("click", function () {
    configPanel.classList.toggle("open");
  });

  saveKeyBtn.addEventListener("click", function () {
    var key = apiKeyInput.value.trim();
    if (!key) {
      showToast("Ingresa una API key válida", "error");
      return;
    }
    apiKey = key;
    updateConfigStatus();
    configPanel.classList.remove("open");
    showToast("API Key guardada correctamente", "success");
  });

  function updateConfigStatus() {
    if (apiKey) {
      configStatus.textContent = "API Key: " + apiKey.slice(0, 8) + "...";
      configStatus.classList.add("active");
    } else {
      configStatus.textContent = "Configurar API Key";
      configStatus.classList.remove("active");
    }
  }

  // ── Tab switching ──
  document.querySelectorAll(".tab-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".tab-btn").forEach(function (b) {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");
      activeTab = btn.dataset.tab;
      searchInput.placeholder = placeholders[activeTab];
      searchInput.value = "";
      renderSuggestions();
    });
  });

  // ── Chip click ──
  suggestionChips.addEventListener("click", function (e) {
    var chip = e.target.closest(".chip");
    if (!chip) return;
    searchInput.value = chip.dataset.query;
    doSearch();
  });

  // ── Search ──
  searchBtn.addEventListener("click", doSearch);
  searchInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") doSearch();
  });

  function doSearch() {
    var query = searchInput.value.trim();
    if (!query) {
      searchInput.focus();
      return;
    }

    if (!apiKey) {
      showToast("Configura tu YouTube API Key para buscar", "error");
      configPanel.classList.add("open");
      return;
    }

    currentQuery = query;
    nextPageToken = null;

    videoList.innerHTML = "";
    emptyState.style.display = "none";
    resultsArea.style.display = "none";
    loadingSkeleton.style.display = "flex";
    if (loadMoreBtn) loadMoreBtn.style.display = "none";

    fetchVideos(query, null);
  }

  function buildSearchQuery(query, tab) {
    switch (tab) {
      case "artist":
        return query + " music";
      case "song":
        return query + " official";
      case "genre":
        return query + " music mix";
      default:
        return query;
    }
  }

  async function fetchVideos(query, pageToken) {
    if (isLoading) return;
    isLoading = true;

    var enhancedQuery = buildSearchQuery(query, activeTab);
    var params = new URLSearchParams({
      q: enhancedQuery,
      type: "video",
      maxResults: "12",
    });

    if (pageToken) {
      params.set("pageToken", pageToken);
    }

    try {
      var response = await fetch(API + "/api/search?" + params.toString(), {
        headers: { "x-api-key": apiKey },
      });

      var data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error en la búsqueda");
      }

      nextPageToken = data.nextPageToken;

      loadingSkeleton.style.display = "none";
      resultsArea.style.display = "block";

      var tabLabels = { artist: "artista", song: "canción", genre: "género" };
      resultsTitle.textContent = 'Resultados para "' + query + '"';
      resultsCount.textContent = data.videos.length + " videos · " + tabLabels[activeTab];

      renderVideos(data.videos, !!pageToken);

      if (loadMoreBtn) {
        loadMoreBtn.style.display = nextPageToken ? "flex" : "none";
      }
    } catch (err) {
      loadingSkeleton.style.display = "none";
      showToast(err.message, "error");

      if (!pageToken) {
        emptyState.style.display = "block";
      }
    } finally {
      isLoading = false;
    }
  }

  function renderVideos(videos, append) {
    var html = videos
      .map(function (video) {
        var isSelected = selectedVideos.some(function (v) { return v.id === video.id; });
        return '<div class="video-card' + (isSelected ? " selected" : "") + '" ' +
          'data-id="' + video.id + '" ' +
          'data-title="' + escapeAttr(video.title) + '" ' +
          'data-channel="' + escapeAttr(video.channel) + '" ' +
          'data-thumbnail="' + escapeAttr(video.thumbnail || "") + '">' +
          '<img class="video-thumb" src="' + escapeAttr(video.thumbnail || "") + '" alt="" loading="lazy" width="120" height="68">' +
          '<div class="video-info">' +
            '<div class="video-title">' + escapeHtml(decodeEntities(video.title)) + '</div>' +
            '<div class="video-channel">' + escapeHtml(video.channel) + '</div>' +
          '</div>' +
          '<div class="video-check">' + (isSelected ? checkIcon() : "") + '</div>' +
        '</div>';
      })
      .join("");

    if (append) {
      videoList.insertAdjacentHTML("beforeend", html);
    } else {
      videoList.innerHTML = html;
    }
  }

  // ── Load more ──
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", function () {
      if (nextPageToken && currentQuery) {
        loadMoreBtn.querySelector(".load-more-text").textContent = "Cargando...";
        fetchVideos(currentQuery, nextPageToken).then(function () {
          loadMoreBtn.querySelector(".load-more-text").textContent = "Cargar más";
        });
      }
    });
  }

  // ── Select / deselect video ──
  videoList.addEventListener("click", function (e) {
    var card = e.target.closest(".video-card");
    if (!card) return;

    var id = card.dataset.id;
    var idx = selectedVideos.findIndex(function (v) { return v.id === id; });

    if (idx >= 0) {
      selectedVideos.splice(idx, 1);
      card.classList.remove("selected");
      card.querySelector(".video-check").innerHTML = "";
    } else {
      selectedVideos.push({
        id: id,
        title: card.dataset.title,
        channel: card.dataset.channel,
        thumbnail: card.dataset.thumbnail,
      });
      card.classList.add("selected");
      card.querySelector(".video-check").innerHTML = checkIcon();
    }

    updatePlaylistBar();
  });

  // ── Playlist bar ──
  function updatePlaylistBar() {
    playlistCount.textContent = String(selectedVideos.length);
    if (selectedVideos.length > 0) {
      playlistBar.classList.add("visible");
    } else {
      playlistBar.classList.remove("visible");
    }
  }

  // ── Build YouTube playlist URL ──
  function buildPlaylistUrl() {
    var ids = selectedVideos.map(function (v) { return v.id; });
    return "https://www.youtube.com/watch_videos?video_ids=" + ids.join(",");
  }

  // ── Create Playlist (open modal with URL) ──
  createPlaylistBtn.addEventListener("click", function () {
    if (selectedVideos.length === 0) return;
    openPlaylistModal();
  });

  function openPlaylistModal() {
    var url = buildPlaylistUrl();

    // Update video count
    var countEl = document.getElementById("modalVideoCount");
    if (countEl) countEl.textContent = selectedVideos.length + " videos seleccionados";

    // Set URL in input and link
    modalUrlInput.value = url;
    modalOpenBtn.href = url;

    // Reset success state
    modalSuccess.style.display = "none";

    // Show modal
    playlistModal.classList.add("open");
    modalOverlay.classList.add("open");

    // Auto-copy to clipboard
    copyUrlToClipboard(url);
  }

  // ── Copy URL to clipboard ──
  function copyUrlToClipboard(url) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () {
        showCopySuccess();
      }).catch(function () {
        fallbackCopy(url);
      });
    } else {
      fallbackCopy(url);
    }
  }

  function fallbackCopy(url) {
    modalUrlInput.select();
    try {
      document.execCommand("copy");
      showCopySuccess();
    } catch (err) {
      showToast("No se pudo copiar automáticamente. Selecciona y copia la URL manualmente.", "info");
    }
  }

  function showCopySuccess() {
    modalSuccess.style.display = "flex";
    showToast("URL copiada al portapapeles", "success");

    // Hide success after 3 seconds
    setTimeout(function () {
      modalSuccess.style.display = "none";
    }, 3000);
  }

  // ── Copy button ──
  modalCopyBtn.addEventListener("click", function () {
    copyUrlToClipboard(modalUrlInput.value);
  });

  // ── Close modal ──
  modalCancelBtn.addEventListener("click", closeModal);
  modalOverlay.addEventListener("click", closeModal);

  function closeModal() {
    playlistModal.classList.remove("open");
    modalOverlay.classList.remove("open");
  }

  // ── Theme toggle ──
  (function () {
    var t = document.querySelector("[data-theme-toggle]");
    var r = document.documentElement;
    var d = matchMedia("(prefers-color-scheme:dark)").matches ? "dark" : "light";
    r.setAttribute("data-theme", d);
    if (t) {
      t.addEventListener("click", function () {
        d = d === "dark" ? "light" : "dark";
        r.setAttribute("data-theme", d);
        t.setAttribute("aria-label", "Cambiar a modo " + (d === "dark" ? "claro" : "oscuro"));
        t.innerHTML = d === "dark"
          ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
          : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
      });
    }
  })();

  // ── Helpers ──
  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function decodeEntities(str) {
    var textarea = document.createElement("textarea");
    textarea.innerHTML = str;
    return textarea.value;
  }

  // ── Init ──
  renderSuggestions();
  updateConfigStatus();
})();
