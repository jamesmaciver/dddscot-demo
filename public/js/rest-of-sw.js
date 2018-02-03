self.addEventListener('activate', event => {
    console.log(`[ServiceWorker:activate] Activating service worker.`);
    self.clients.claim();
});