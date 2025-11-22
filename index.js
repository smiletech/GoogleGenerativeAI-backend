const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Choose correct model name (old SDK still supports it)
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

app.post("/api/check-brand", async (req, res) => {
  const { prompt, brand } = req.body;

  try {
    const result = await model.generateContent(`Analyze this text:
  "${prompt}"
  1. Is the brand "${brand}" mentioned?
  2. If mentioned in a list, return its position. Else return -1.
  Return JSON only.`);

    const text = result.response.text();
    const clean = JSON.parse(text);

    res.json({
      prompt,
      brand,
      mentioned: clean.mentioned,
      position: clean.position,
    });
  } catch (error) {
    console.error("Gemini API error:", error.message);

    res.json({
      prompt,
      brand,
      mentioned: "No",
      position: -1,
      note: "Fallback response due to API error",
    });
  }
});

app.post("/api/check-brand-list", async (req, res) => {
  const { prompt, brand } = req.body;

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `
    Analyze the following text:
    "${prompt}"
    
    1. Is the brand "${brand}" mentioned?
    2. If in a list, give its list position.
    Output JSON only: {"mentioned": "Yes/No", "position": number}
    `,
            },
          ],
        },
      ],
      // --- THIS IS THE FIX ---
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json",
      },
      // -----------------------
    });

    // Now the text is guaranteed to be clean JSON
    const text = result.response.text();
    console.log(text, "---------->text");
    const json = JSON.parse(text);

    res.json({ ...json, prompt, brand });
  } catch (error) {
    console.error("Gemini API error:", error.message);

    // Helpful debugging: print what the bad text actually looked like
    // console.log("Failed text:", result?.response?.text());

    res.json({
      prompt,
      brand,
      mentioned: "No",
      position: -1,
      note: "Fallback due to Gemini API error",
    });
  }
});

// Start server
app.listen(5001, async () => {
  console.log("API server running on port 5001");

  try {
    // Test call
    const test = await model.generateContent("Hello world!");
    console.log("Gemini Test Output:", test.response.text());
  } catch (error) {
    console.error("Startup Test Failed:", error);
  }
});
