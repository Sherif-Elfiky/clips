const mongoose = require('mongoose')

const ClipJobSchema = new mongoose.Schema(
  {
    videoUrl: {
      type: String,
      required: true
    },
    startTime: {
      type: Number,
      required: true
    },
    endTime: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['queued', 'processing', 'done', 'failed'],
      default: 'queued'
    },
    outputPath: {
      type: String
    },
    error: {
      type: String
    }
  },
  { timestamps: true }
)

module.exports = mongoose.model('ClipJob', ClipJobSchema)
