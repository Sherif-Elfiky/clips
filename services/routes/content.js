const express = require('express');
const router = express.Router();
const Content = require('../models/Content');

// list all content
router.get('/', async (req, res) => {
    try {
        const allContent = await Content.find();
        res.status(200).json(allContent);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// list content with status: done
router.get('/done', async (req, res) => {
    try {
        const allDone = await Content.find({ status: 'done' });
        res.status(200).json(allDone);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// add new content (only whitelisted fields are accepted)
router.post('/new', async (req, res) => {
    try {
        const { videoUrl, message } = req.body;

        if (!videoUrl) {
            return res.status(400).json({ error: 'videoUrl is required' });
        }

        const created = await Content.create({ videoUrl, message });
        res.status(201).json(created);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// count of queued videos
router.get('/count-queued', async (req, res) => {
    try {
        const count = await Content.countDocuments({ status: 'queued' });
        res.status(200).json(count);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// list content with status: queued
router.get('/queued', async (req, res) => {
    try {
        const queued = await Content.find({ status: 'queued' });
        res.status(200).json(queued);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// fetch the next queued video to process
router.get('/process', async (req, res) => {
    try {
        const toProcess = await Content.findOne({ status: 'queued' }).sort({ createdAt: -1 });
        if (!toProcess) {
            return res.status(404).json({ error: 'No queued content to process' });
        }
        res.status(200).json(toProcess);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// delete all content
router.delete('/delete-all', async (req, res) => {
    try {
        const result = await Content.deleteMany({});
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// delete all queued content
router.delete('/delete-queued', async (req, res) => {
    try {
        const result = await Content.deleteMany({ status: 'queued' });
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// delete content by id
router.delete('/delete/:id', async (req, res) => {
    try {
        const deleted = await Content.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: `No content found with id ${req.params.id}` });
        }
        res.status(200).json(deleted);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// mark content as done
router.put('/completed/:id', async (req, res) => {
    try {
        const update = { status: 'done' };
        if (req.body && req.body.opusProjectId) {
            update.opusProjectId = req.body.opusProjectId;
        }

        const updated = await Content.findByIdAndUpdate(
            req.params.id,
            update,
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ error: `No content found with id ${req.params.id}` });
        }

        res.status(200).json({ message: `Content with id ${req.params.id} has been marked done` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
