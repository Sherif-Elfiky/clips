const mongoose = require('mongoose')

const ClipJobSchema = new mongoose.Schema(
  {
    videoUrl: {
      type: String,
      required: true
    },
    startTime: {
      type: Number,
      required: false
    },
    endTime: {
      type: Number,
      required: false
    },
    status: {
      type: String,
      enum: ['queued', 'done'],
      default: 'queued'
    },
    outputPath: {
      type: String
    },
    error: {
      type: String
    },

    message: {
      type: String,
      required: true,
      default: 'Find the funniest parts of this video'
    }
  },
  { timestamps: true }
)

module.exports = mongoose.model('ClipJob', ClipJobSchema)
