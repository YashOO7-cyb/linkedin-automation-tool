const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  linkedinPostId: {
    type: String,
    required: true,
    unique: true,
  },
  postContent: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Post", postSchema);
