const mongoose = require('mongoose');

const ClipJobSchema = new mongoose.Schema(
  {
    videoUrl: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['queued', 'done', 'failed'],
      default: 'queued'
    },
    opusProjectId: {
      type: String
    },
    message: {
      type: String,
      required: true,
      default: 'Find the funniest parts of this video'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ClipJob', ClipJobSchema);
