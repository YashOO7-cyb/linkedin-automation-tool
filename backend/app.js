import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { generateCaption } from "./caption.js";
import { publishScheduled } from "./publishJob.js";

dotenv.config();
const app = express();
const upload = multer({ dest: "uploads/" });

app.use(express.json());

// --- DB Setup ---
let db;
(async () => {
  db = await open({ filename: "posts.db", driver: sqlite3.Database });
  await db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      imagePath TEXT,
      publishAt TEXT,
      status TEXT DEFAULT 'pending'
    )
  `);
})();

// --- API to create scheduled post ---
app.post("/create-scheduled-post", upload.single("image"), async (req, res) => {
  try {
    const { publishAt } = req.body;
    await db.run("INSERT INTO posts (imagePath, publishAt) VALUES (?, ?)", [
      req.file.path,
      publishAt
    ]);
    res.json({ ok: true, msg: "Post scheduled" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to schedule post" });
  }
});

// --- Endpoint triggered by Render Cron ---
app.get("/run-cron", async (req, res) => {
  try {
    const now = new Date().toISOString();
    const posts = await db.all(
      "SELECT * FROM posts WHERE publishAt <= ? AND status='pending'",
      [now]
    );

    if (posts.length === 0) {
      return res.json({ ok: true, msg: "No pending posts" });
    }

    for (const post of posts) {
      try {
        console.log("Publishing post:", post.id);
        const caption = await generateCaption(post.imagePath);
        await publishScheduled({
          imagePath: post.imagePath,
          caption,
          linkedinActorUrn: process.env.LINKEDIN_ACTOR_URN,
          accessToken: process.env.LINKEDIN_ACCESS_TOKEN
        });
        await db.run("UPDATE posts SET status='done' WHERE id=?", [post.id]);
      } catch (err) {
        console.error("Failed publishing:", err);
      }
    }

    res.json({ ok: true, msg: `Processed ${posts.length} posts` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Cron execution failed" });
  }
});

app.listen(process.env.PORT || 4000, () =>
  console.log("Backend running on port " + (process.env.PORT || 4000))
);
