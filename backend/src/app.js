const express = require('express');
const cors = require('cors');
const songRoutes = require('./Routes/song.routes');

const app = express();

app.use(cors());

app.use(express.json());

// Health check - hosting platforms ping "/" to verify the deploy is alive.
app.get('/', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'AI-Emotion-Song-Recommender API' });
});

app.use('/song', songRoutes);

module.exports = app;
