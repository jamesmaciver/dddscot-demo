importScripts('js/idb.js');

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
            'img/ddd-icon-192.png',
            'img/ddd-icon-512.png',
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
            'js/idb.js',
            'manifest.json',
            'index.html',
            'schedule.html',
            'announcements.html'
          ])
          .catch(error => console.error('Failed to install service worker', error));
        })
      );
});

self.addEventListener('activate', event => {
    console.log(`[ServiceWorker:activate] Activating service worker.`);
    self.clients.claim();
    event.waitUntil(openDb());
});

const serviceWorkerUrl = new URL(self.location);

self.addEventListener('fetch', event => {
    console.log(`[ServiceWorker:fetch] Fetch Event: `, event);
    
    const requestUrl = event.request.url;
    const urlBelongsToOrigin = requestUrl.indexOf(serviceWorkerUrl.origin) > -1;
    const isStaticResourceRequest = requestUrl.indexOf('/api/') === -1;
    
    if (urlBelongsToOrigin) {

        const isGETRequest = event.request.method === 'GET';
        const isPOSTRequest = event.request.method === 'POST';
        
        if(isGETRequest) {

            if (isStaticResourceRequest) {
                console.log(`[ServiceWorker:fetch] Processing static resource fetch event.`);

                event.respondWith(
                    applyStaticResourceCachingStrategy(event)
                );
            } else {
                console.log(`[ServiceWorker:fetch] Processing dynamic data fetch event`, event);
                
                const accessingSessions = requestUrl.indexOf('/api/sessions') > -1;
                
                let promiseToResolve;
        
                if (accessingSessions) {
                    promiseToResolve = getSessions(event.request);
                } else {
                    promiseToResolve = fetch(event.request);
                }
                event.respondWith(
                    promiseToResolve
                );
            }
        } else if (isPOSTRequest) {
            console.log(`[ServiceWorker:fetch] Processing data POST fetch event.`, event);
            event.respondWith(fetch(event.request));
        }
    }
});

self.addEventListener('push', event => {
    if (!(self.Notification && self.Notification.permission === 'granted')) {
        return;
    }
    const data = event.data.json();
    
    addAnnouncementToDb(data)
        .then(() => clients.matchAll())
        .then(clients => {
            clients.forEach(client => {
                client.postMessage({
                    type: 'NEW_ANNOUNCEMENT'
                })
            });
        });

    const title = data.title || "N/A title";
    const body = data.message || "N/A body.";
    const icon = "img/ddd-icon.png";

    event.waitUntil(
        self.registration.showNotification(
            title, 
            { body, icon, requireInteraction: true, vibrate: [100, 50, 100, 50] })
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(clients.openWindow('/announcements.html'));
});

self.addEventListener('sync', event => {
    if (event.tag === 'send-queued-announcements') {
        console.log(`[ServiceWorker:sync] Online, will now send queued announcements.`);
        
        event.waitUntil(
            getPendingAnnouncementsFromDb()
                .then(announcements => {
                    return fetch('/api/announcements/', {
                                method: 'POST',
                                headers: {
                                'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(announcements)
                            })
                            .then(() =>  markPendingAnnouncementsAsDelivered(announcements));
                })
                .catch(error => console.error(error))
        );
    } 
});

const addAnnouncementToDb = (announcement) => {
    return openDb().then(db => {
        return db.transaction('announcements', 'readwrite')
            .objectStore('announcements')
            .put(announcement)
            .complete;
    });
};

const getSessions = (request) => {
    return getSessionsFromDb().then((resultSet) => {
        if(resultSet && resultSet.length > 0) {
            return returnAsJsonResponse(resultSet);
        }
        return fetch(request)
                .then(response => response.json())
                .then(sessions => 
                {
                    const promises = [];
                    sessions.forEach(session => {
                        promises.push(addSessionToDb(session));
                    });
                    return Promise.all(promises).then(() => {
                        return returnAsJsonResponse(sessions);
                    });
                });
    });
}

const getSessionsFromDb = () => {
    return openDb()
        .then(db => 
                db.transaction('sessions')
                    .objectStore('sessions')
                    .getAll()
            );
}

const addSessionToDb = (session) => {
    return openDb()
        .then(db =>
                db.transaction('sessions', 'readwrite')
                    .objectStore('sessions')
                    .put(session)
                    .complete
            );
}

const applyStaticResourceCachingStrategy = (event) => {
    return caches.open(`v1`).then(cache => {
        return cache.match(event.request).then(cacheResponse => {
            return cacheResponse || fetch(event.request).then(networkResponse => {
                cache.put(event.request, networkResponse.clone());
                return networkResponse;
            });
        });
    })
}

const openDb = () => {
    return idb.open('dddscot', 2, (upgradeDB) => {
        console.log(`[ServiceWorker:activate] Migrating db from  v${upgradeDB.oldVersion}}.`);
            
        if(!upgradeDB.objectStoreNames.contains('sessions')){
            upgradeDB.createObjectStore('sessions', {
                keyPath: 'title'
            });
        }   
        if(!upgradeDB.objectStoreNames.contains('announcements')){
            upgradeDB.createObjectStore('announcements', {
                keyPath: 'timestamp'
            });
        }     
    });
}

const getPendingAnnouncementsFromDb = () => {
    return openDb().then(db => {
        return db.transaction('announcements')
                .objectStore('announcements')
                .getAll()
                .then((announcements) => Promise.resolve(announcements.filter(announcement => announcement.isPending)));
    })
}

const markPendingAnnouncementsAsDelivered = () => {
    return openDb().then(db => {
        const transaction = db.transaction('announcements', 'readwrite');
        transaction.objectStore('announcements')
            .iterateCursor(cursor => {
                if (!cursor) return;
                const announcement = cursor.value;
                announcement.isPending = false;
                cursor.update(announcement);
                cursor.continue();
            });
        return transaction.complete;
    });
}

const returnAsJsonResponse = (resultSet) => {
    return Promise.resolve(new Response(
                JSON.stringify(resultSet), 
                {
                    headers: {
                        'content-type': 'application/json'
                    }
                }));
}