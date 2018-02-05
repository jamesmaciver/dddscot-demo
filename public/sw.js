importScripts('js/idb.js');
importScripts('js/rest-of-sw.js');

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

const addAnnouncementToDb = (announcement) => {
    return openDb().then(db => {
        return db.transaction('announcements', 'readwrite')
            .objectStore('announcements')
            .put(announcement)
            .complete;
    });
};
