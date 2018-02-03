importScripts('js/rest-of-sw.js');
const serviceWorkerUrl = new URL(self.location);

self.addEventListener('install', event => {
    console.log(`[ServiceWorker:install] Installing service worker.`);
    self.skipWaiting();

    event.waitUntil(
        caches.open(`v1`).then(cache => {
          return cache.addAll([
            'css/site.css',
            'css/spectre-icons.min.css',
            'css/spectre.min.css',
            'img/ddd-logo.png',
            'img/ddd-icon.png',
            'img/davidrankin.jpg',
            'img/donwibier.jpg',
            'img/filipw.jpg',
            'img/galiyawarrier.jpg',
            'img/garyfleming.jpg',
            'img/garypark.jpg',
            'img/heatherburns.jpg',
            'img/ismailmayat.jpg',
            'img/jamesmaciver.jpg',
            'img/joannaisabelleolszewska.jpg',
            'img/joestead.jpg',
            'img/jonathanchannon.jpg',
            'img/kevinsmith.jpg',
            'img/martingoodfellow.jpg',
            'img/mattellis.jpg',
            'img/matteoemili.jpg',
            'img/paulaikman.jpg',
            'img/petershaw.jpg',
            'img/robinminto.jpg',
            'img/stuartashworth.jpg',
            'img/placeholder.jpg',
            'img/marniemccormack.jpg',
            'js/register-service-worker.js',
            'index.html',
            'schedule.html'
          ])
          .catch(error => console.error('Failed to install service worker', error));
        })
      );
});

self.addEventListener('fetch', event => {
    console.log(`[ServiceWorker:fetch] Fetch Event: `, event);
    
    const requestUrl = event.request.url;
    const urlBelongsToOrigin = requestUrl.indexOf(serviceWorkerUrl.origin) > -1;
    const isStaticResourceRequest = requestUrl.indexOf('/api/') === -1;
    
    if (urlBelongsToOrigin) {
        if (isStaticResourceRequest) {
            event.respondWith(
                caches.open(`v1`).then(cache => {
                    return cache.match(event.request).then(cacheResponse => {
                        return cacheResponse || fetch(event.request).then(networkResponse => {
                            cache.put(event.request, networkResponse.clone());
                            return networkResponse;
                        });
                    });
                })
            );
        } else {
            event.respondWith(
                fetch(event.request)
            );
        }
    }
});