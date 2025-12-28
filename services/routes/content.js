const express = require('express')
const router = express.Router()
const Content = require('../models/Content')


// show all content
router.get('/', async (req, res) => {
    try {
        const allContent = await Content.find()
        res.status(200).json(allContent)

    }
    catch (err) {
        res.status(500).json({ err: err.message })
    }

})

// add new content
router.post('/new', async (req, res) => {
    try {
        newContent = req.body
        const createContent = await Content.create(newContent)
        res.status(200).json(createContent)
    }
    catch (err) {
        res.status(500).json({ err: err.message })

    }

})

// show all content with status: queued
router.get('/queued', async (req, res) => {
    try {
        const queued = await Content.find({ status: "queued" })

        if (queued.length === 0) {
            return res.send('There is no queued content')
        }
        res.status(200).json(queued)

    }
    catch (err) {
        res.status(500).json({ err: err.message })
    }

})

// get one content with status queued
router.get('/process', async(req, res) => {
    try{
        const toProcess = await Content.findOne({status: "queued"})
        if (!toProcess){
            return res.send('There is not a single video to queue')
        }
        res.status(200).json(toProcess)

    }
    catch(err){
        res.status(500).json({err: err.message})

    }

})

router.delete('/delete/:id', async (req, res) => {
    try{
        const toDelete = await Content.findByIdAndDelete(req.params.id)

        if (toDelete){
            console.log(`successfully deleted content with id ${req.params.id}`)
        }

        res.status(200).json(toDelete)

    }
    catch(err){
        res.status(500).json({err: err.message})

    }

})

module.exports = router