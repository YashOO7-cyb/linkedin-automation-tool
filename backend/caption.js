import OpenAI from "openai";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateCaption(imagePath) {
  try {
    const imageBase64 = fs.readFileSync(imagePath, { encoding: "base64" });
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a LinkedIn content creator." },
        {
          role: "user",
          content: [
            { type: "text", text: "Write a professional LinkedIn caption for this image." },
            { type: "image_url", image_url: `data:image/jpeg;base64,${imageBase64}` }
          ]
        }
      ]
    });
    return response.choices[0].message.content;
  } catch (err) {
    console.error("Caption generation failed:", err);
    return "Exciting update! 🚀"; // fallback
  }
}
