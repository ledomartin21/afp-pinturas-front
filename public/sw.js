const CACHE_NAME = "afp-pinturas-shell-v3";
const CACHE_PREFIX = "afp-pinturas-shell-";
const ASSETS_TO_CACHE = ["/manifest.webmanifest", "/pwa-icon-192.png", "/pwa-icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  const isSameOrigin = requestUrl.origin === self.location.origin;
  const isNavigation = event.request.mode === "navigate";

  // HTML/navigation should be network-first to avoid locking users on stale app shells.
  if (isNavigation) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request).then((cached) => cached || caches.match("/")))
    );
    return;
  }

  const isAppBuildAsset = isSameOrigin && requestUrl.pathname.startsWith("/_next/");

  // App build assets should be network-first to avoid stale UI after normal refresh.
  if (isAppBuildAsset) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200) {
            return caches.match(event.request).then((cached) => cached || response);
          }

          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache static same-origin assets only.
  const canCacheStatic =
    isSameOrigin &&
    (requestUrl.pathname.endsWith(".png") ||
      requestUrl.pathname.endsWith(".jpg") ||
      requestUrl.pathname.endsWith(".jpeg") ||
      requestUrl.pathname.endsWith(".svg") ||
      requestUrl.pathname.endsWith(".webp") ||
      requestUrl.pathname.endsWith(".ico"));

  if (!canCacheStatic) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200) {
            return response;
          }

          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        });
    })
  );
});
