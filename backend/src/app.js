const express = require('express');
const cors = require('cors');
const songRoutes = require('./Routes/song.routes');

const app = express();

app.use(cors());

app.use(express.json());

app.use('/song', songRoutes);

module.exports = app;