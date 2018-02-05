const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/')
        ;
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

const sendSubscriptionToBackEnd = (subscription) => {
    return fetch('/api/subscriptions/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscription)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Bad status code from server.');
        }

        return response.json();
    })
    .then(responseData => {
        if (!(responseData.data && responseData.data.success)) {
            throw new Error('Bad response from server.');
        }
    });
}

if ('serviceWorker' in navigator) {
    console.log('Beginning to register service worker.')

    navigator.serviceWorker.register('sw.js')
        .then(registration => {
            console.log('Registered service worker successfully. Scope is ' + registration.scope);

            const subscribeOptions = {
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(
                    'BOEpNeaPku57fL5fVGlovdIyOV0ixMxsEdzrlq319C3-1f_nPmHtEk_5FBEO-bPxrRULosYwOwH9j5dcKXXZmvk'
                )
            };

            return registration.pushManager.subscribe(subscribeOptions)
        })
        .then(pushSubscription => {
            console.log('Received PushSubscription: ', JSON.stringify(pushSubscription));

            sendSubscriptionToBackEnd(pushSubscription);
            return pushSubscription;
        })
        .catch(error => {
            console.log('Failed to register service worker: ' + error);
        });
}
