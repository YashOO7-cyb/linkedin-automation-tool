const axios = require("axios");
const mongoose = require("mongoose");
const Anthropic = require("@anthropic-ai/sdk");
const express = require("express");
const cron = require("node-cron");
const Post = require("./models/Post");

const app = express();

require("dotenv").config();

const prompt = `Create a LinkedIn post (maximum 150 words) about the latest trend or advancement in AI, Node.js, or distributed systems.

The tone should be casual, friendly, and have a human touch — like explaining something to friends or the community.

Do not write from a personal experience point of view (like "I learned" or "I tried").

Always sound like you are informing or telling about something interesting.

Keep sentences short and easy to read.

You can use new lines to make the post more readable.

Only include the post content — no titles, no hashtags, no extra explanation.

If needed, you can include a tiny real-world example to make the post engaging.`;

app.use(express.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Initialize Claude API
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

class LinkedInAutomation {
  constructor() {
    this.baseURL = "https://api.linkedin.com/rest";
    this.headers = {
      Authorization: `Bearer ${process.env.LINKEDIN_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
      "LinkedIn-Version": "202504",
    };
  }

  // Generate post content using Claude
  async generatePostContent() {
    try {
      const message = await anthropic.messages.create({
        model: "claude-3-opus-20240229",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      return message.content[0].text;
    } catch (error) {
      console.error("Error generating post content:", error);
      throw error;
    }
  }

  // Create a new post
  async createPost(commentary) {
    try {
      const response = await axios.post(
        `${this.baseURL}/posts`,
        {
          author: `urn:li:person:${process.env.LINKEDIN_USER_ID}`,
          commentary: commentary,
          visibility: "PUBLIC",
          distribution: {
            feedDistribution: "MAIN_FEED",
            targetEntities: [],
            thirdPartyDistributionChannels: [],
          },
          lifecycleState: "PUBLISHED",
          isReshareDisabledByAuthor: false,
        },
        { headers: this.headers }
      );

      // Extract post ID from response headers
      const postId = response.headers["x-restli-id"];

      // Save post to MongoDB
      const post = new Post({
        linkedinPostId: postId,
        postContent: commentary,
        createdAt: new Date(),
      });
      await post.save();

      console.log("Post created and saved successfully:", postId);
      return { postId, data: response.data };
    } catch (error) {
      console.error(
        "Error creating post:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  // Get recent posts from last 2 days
  async getRecentPosts() {
    try {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const posts = await Post.find({
        createdAt: { $gte: twoDaysAgo },
      });

      return posts;
    } catch (error) {
      console.error("Error fetching recent posts:", error);
      throw error;
    }
  }
}

const linkedIn = new LinkedInAutomation();

// API endpoint to create post
app.post("/api/posts", async (req, res) => {
  try {
    const { content } = req.body;
    const ai = req.query.ai === "true";

    if (!content && !ai) {
      return res.status(400).json({
        error: "Either content in body or ai=true in query params is required",
      });
    }

    let postContent;
    if (ai) {
      postContent = await linkedIn.generatePostContent();
    } else {
      postContent = content;
    }

    const result = await linkedIn.createPost(postContent);
    res.json({
      ...result,
      aiGenerated: ai,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to get recent posts
app.get("/api/posts", async (req, res) => {
  try {
    const posts = await linkedIn.getRecentPosts();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cron job to create posts every 4 hours between 9 AM and 10 PM
cron.schedule("0 9,13,17,21 * * *", async () => {
  try {
    const currentHour = new Date().getHours();
    if (currentHour >= 9 && currentHour <= 22) {
      const content = await linkedIn.generatePostContent();
      await linkedIn.createPost(content);
      console.log("Scheduled post created successfully");
    }
  } catch (error) {
    console.error("Error in scheduled post creation:", error);
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
