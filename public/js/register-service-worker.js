if ('serviceWorker' in navigator) {
    console.log('Beginning to register service worker.')

    navigator.serviceWorker.register('sw.js')
        .then(registration => {
            console.log('Registered service worker successfully. Scope is ' + registration.scope);
        })
        .catch(error => {
            console.log('Failed to register service worker: ' + error);
        });
}