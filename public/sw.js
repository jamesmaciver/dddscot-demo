importScripts('js/idb.js');
importScripts('js/rest-of-sw.js');
const serviceWorkerUrl = new URL(self.location);


self.addEventListener('fetch', event => {
    console.log(`[ServiceWorker:fetch] Fetch Event: `, event);
    
    const requestUrl = event.request.url;
    const urlBelongsToOrigin = requestUrl.indexOf(serviceWorkerUrl.origin) > -1;
    const isStaticResourceRequest = requestUrl.indexOf('/api/') === -1;
    
    if (urlBelongsToOrigin) {
        if (isStaticResourceRequest) {
            console.log(`[ServiceWorker:fetch] Processing static resource fetch event.`);

            event.respondWith(
                applyStaticResourceCachingStrategy(event)
            );
        } else {
            console.log(`[ServiceWorker:fetch] Processing dynamic data fetch event.`, event);
            
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
    }
});

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

