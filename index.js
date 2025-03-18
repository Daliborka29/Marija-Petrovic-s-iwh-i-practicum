require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();

app.set('view engine', 'pug');
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const PRIVATE_APP_ACCESS = process.env.HUBSPOT_PRIVATE_APP_TOKEN;

// TODO: ROUTE 1 - Create a new app.get route for the homepage to call your custom object data. Pass this data along to the front-end and create a new pug template in the views folder.
app.get('/', async (req, res) => {
    const musicEvents = `https://api.hubapi.com/crm/v3/objects/p_music_events?properties=name,venue,date,genre`;
    const headers = {
        Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
        'Content-Type': 'application/json'
    };

    try {
        const resp = await axios.get(musicEvents, { headers });
        
        console.log("Full API Response:", JSON.stringify(resp.data, null, 2));
        console.log("Number of events returned:", resp.data.results.length);
        
        const cleanedEvents = resp.data.results.map(event => {
            return {
                id: event.id,
                name: event.properties.name || 'N/A',
                venue: event.properties.venue || 'N/A',
                date: event.properties.date ? new Date(event.properties.date).toLocaleDateString() : 'N/A',
                genre: event.properties.genre || 'N/A'
            };
        });

        res.render('event-dashboard', {
            title: 'Music Events Dashboard',
            events: cleanedEvents
        });
    } catch (error) {
        console.error("Error details:", error.response ? error.response.data : error.message);
        res.status(500).send('Error fetching music events');
    }
});


// TODO: ROUTE 2 - Create a new app.get route for the form to create or update new custom object data. Send this data along in the next route.
app.get('/change-cobj', (req, res) => {
    res.render('changes', { 
        title: 'Update Music Festival'
    });
});

// TODO: ROUTE 3 - Create a new app.post route for the custom objects form to create or update your custom object data. Once executed, redirect the user to the homepage.
app.post('/change-cobj', async (req, res) => {
    // Log what we're sending to HubSpot
    console.log("Form submission data:", req.body);
    
    const newEvent = {
        properties: {
            "name": req.body.name,
            "venue": req.body.venue,
            "date": new Date(req.body.date).toISOString().split('T')[0], // Format as YYYY-MM-DD
            "genre": req.body.genre
        }
    };

    console.log("Sending to HubSpot:", JSON.stringify(newEvent, null, 2));

    const createEvent = 'https://api.hubapi.com/crm/v3/objects/p_music_events';
    const headers = {
        Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
        'Content-Type': 'application/json'
    };

    try {
        const response = await axios.post(createEvent, newEvent, { headers });
        console.log("HubSpot creation response:", JSON.stringify(response.data, null, 2));
        res.redirect('/');
    } catch (error) {
        console.error("Error creating event:", error.response ? error.response.data : error.message);
        res.status(500).send('Error creating music event: ' + (error.response ? JSON.stringify(error.response.data) : error.message));
    }
});

// * Localhost
app.listen(3000, () => console.log('Listening on http://localhost:3000'));