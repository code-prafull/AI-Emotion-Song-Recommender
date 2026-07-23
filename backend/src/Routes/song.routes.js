const express = require('express');
const multer = require('multer');
const songModel = require('../models/song.mode');
const { uploadFile } = require('../Service/storage.service');

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

// Create song
router.post('/', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Audio file is required" });
        }

        const fileData = await uploadFile(req.file);

        const song = await songModel.create({
            title: req.body.title,
            artist: req.body.artist,
            audio: fileData.url,
            mood: req.body.mood
        });

        res.status(201).json({
            message: 'song created successfully',
            song
        });

    } catch (error) {
        res.status(500).json({
            message: 'Something went wrong',
            error: error.message
        });
    }
});

// Get songs
router.get("/", async (req, res) => {
  try {
    const { mood } = req.query;

    let filter = {};

    if (mood) {
      filter = {
        mood: { $regex: `^${mood}$`, $options: "i" }
      };
    }

    const songs = await songModel.find(filter);

    res.status(200).json({
      message: "songs fetched successfully",
      songs,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching songs",
      error: error.message,
    });
  }
});

module.exports = router;