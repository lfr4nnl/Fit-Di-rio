self.addEventListener("install", (e) => {
    e.waitUntil(
        caches.open("fit-v1").then((cache) => {
            return cache.addAll([
                "index.html",
                "style.css",
                "script.js",
                "manifest.json",
                "icons/icon-192.png",
                "icons/icon-512.png"
            ]);
        })
    );
    console.log("Service Worker instalado!");
});

self.addEventListener("fetch", (e) => {
    e.respondWith(
        caches.match(e.request).then((resp) => {
            return resp || fetch(e.request);
        })
    );
});
