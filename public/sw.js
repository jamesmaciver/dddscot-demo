importScripts('js/idb.js');
importScripts('js/rest-of-sw.js');

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


