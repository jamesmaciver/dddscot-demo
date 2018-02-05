const express = require('express')
const app = express()

const webpush = require('web-push');

const sessions = require('./data/sessions.json')
const subscriptions = [];

app.use(express.json());  
app.use(express.static('public'));

const vapidKeys = {
    "publicKey":"BOEpNeaPku57fL5fVGlovdIyOV0ixMxsEdzrlq319C3-1f_nPmHtEk_5FBEO-bPxrRULosYwOwH9j5dcKXXZmvk",
    "privateKey":"LMB9AUqaRtYAdp8ZaSx2q0v_0zJZK84y2cgMldxbBHg"
};
webpush.setVapidDetails(
    'mailto:james@test.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

app.get('/api/sessions', (req, res) => res.send(sessions));

app.post('/api/announcements', (req, res) => {
    const announcements = req.body;
    subscriptions.forEach(subscription => {
        announcements.forEach(announcement => {
            webpush.sendNotification(subscription, JSON.stringify({
                title: 'New Announcement',
                message: announcement.message,
                timestamp: announcement.timestamp || new Date().getTime(),
            })).catch(error => console.error(error));
        });
    });
    res.send(JSON.stringify({ data: { success: true } }));
});

app.get('/api/subscriptions', (req, res) => res.send({ subscriptions }));

app.post('/api/subscriptions', (req, res) => {
    const subscription = req.body
    const subscriptionExists = subscriptions.some(x => x.endpoint === subscription.endpoint);
    if(!subscriptionExists){
        subscriptions.push(subscription);
    }
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ data: { success: true } }));
});

app.listen(process.env.PORT || 8000, () => console.log('Server running...'))