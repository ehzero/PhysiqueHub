// Service worker behavior is temporarily disabled for PWA routing tests.
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

/*
const CACHE_PREFIX = "physiquehub-pwa";
const CACHE_VERSION = "v2";
const STATIC_CACHE = `${CACHE_PREFIX}-${CACHE_VERSION}-static`;
const PAGE_CACHE = `${CACHE_PREFIX}-${CACHE_VERSION}-pages`;
const OFFLINE_URL = "/offline.html";
const APP_SHELL_URLS = ["/", "/competitions", "/guide", "/saved"];

const PRECACHE_URLS = [
  OFFLINE_URL,
  "/icons/android-chrome-192x192.png",
  "/icons/android-chrome-512x512.png",
  "/icons/apple-touch-icon.png",
  "/icons/favicon-16x16.png",
  "/icons/favicon-32x32.png",
  "/favicon.ico",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)),
      precacheAppShell(),
    ])
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key.startsWith(CACHE_PREFIX) &&
                ![STATIC_CACHE, PAGE_CACHE].includes(key),
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => precacheAppShell())
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin || shouldBypass(url)) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
  }
});

function shouldBypass(url) {
  return url.pathname.startsWith("/api/") || url.pathname.startsWith("/admin");
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/favicon.ico" ||
    url.pathname === "/manifest.webmanifest"
  );
}

async function networkFirstPage(request) {
  const cache = await caches.open(PAGE_CACHE);

  try {
    const response = await fetch(request);

    if (response.ok && response.type === "basic") {
      await cache.put(request, response.clone());
    }

    return response;
  } catch {
    const cached =
      (await cache.match(request)) || (await getRouteFallback(cache, request));
    const offline = await caches.match(OFFLINE_URL);

    return (
      cached ||
      offline ||
      new Response("Offline", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=UTF-8" },
      })
    );
  }
}

async function precacheAppShell() {
  const cache = await caches.open(PAGE_CACHE);

  await Promise.allSettled(
    APP_SHELL_URLS.map(async (url) => {
      const request = new Request(url, {
        cache: "reload",
        credentials: "same-origin",
        headers: {
          Accept: "text/html",
        },
      });
      const response = await fetch(request);

      if (response.ok && response.type === "basic") {
        await cache.put(url, response.clone());
      }
    }),
  );
}

async function getRouteFallback(cache, request) {
  const url = new URL(request.url);
  const normalizedPath = normalizeAppShellPath(url.pathname);

  if (!normalizedPath) {
    return undefined;
  }

  return cache.match(normalizedPath);
}

function normalizeAppShellPath(pathname) {
  const normalized =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;

  return APP_SHELL_URLS.includes(normalized) ? normalized : undefined;
}

async function cacheFirst(request) {
  const cached = await caches.match(request);

  if (cached) {
    return cached;
  }

  const response = await fetch(request);

  if (response.ok && response.type === "basic") {
    const cache = await caches.open(STATIC_CACHE);
    await cache.put(request, response.clone());
  }

  return response;
}
*/
