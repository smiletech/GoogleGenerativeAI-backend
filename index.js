// const express = require("express");
// const cors = require("cors");
// const { GoogleGenerativeAI } = require("@google/generative-ai");
// require("dotenv").config();

// const app = express();
// app.use(express.json());
// app.use(cors({ origin: "*" }));

// // Initialize Gemini
// const genAI = new GoogleGenerativeAI("AIzaSyBm9QYVvdDmuQBhtoIIKcSWevsJECcc5aE");

// // Use correct model
// const model = genAI.getGenerativeModel({
//   model: "gemini-1.5-flash",
// });

// // Test route
// app.post("/generate", async (req, res) => {
//   try {
//     const { prompt } = req.body;

//     const result = await model.generateContent(prompt);
//     const text = result.response.text();

//     return res.json({ output: text });
//   } catch (error) {
//     console.error("Gemini API Error:", error);
//     res
//       .status(500)
//       .json({ error: "Error generating content", details: error.message });
//   }
// });

// // Start server
// app.listen(5001, async () => {
//   console.log("Server running on port 5001");

//   try {
//     console.log("\nFetching available models...");
//     const models = await genAI.listModels();

//     models.forEach((m) => console.log(" - " + m.name));

//     // Test API call
//     const test = await model.generateContent("Hello world from Gemini!");
//     console.log("\nGemini Test Output:", test.response.text());
//   } catch (err) {
//     console.error("\nStartup Error:", err);
//   }
// });

const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY4);

// Choose correct model name (old SDK still supports it)
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

// POST route
app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return res.json({ output: text });

  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "Gemini error", details: error.message });
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
