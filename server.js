const express = require('express')
const app = express()

const sessions = require('./data/sessions.json')

app.use(express.json());  
app.use(express.static('public'));

app.get('/api/sessions', (req, res) => res.send(sessions));

app.listen(process.env.PORT || 8000, () => console.log('Server running...'))