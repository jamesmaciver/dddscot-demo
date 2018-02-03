self.addEventListener('install', event => {
    console.log(`[ServiceWorker:install] Installing service worker.`);
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    console.log(`[ServiceWorker:activate] Activating service worker.`);
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    console.log(`[ServiceWorker:fetch] Fetch Event: `, event);
    event.respondWith(
        fetch(event.request)
    );
});