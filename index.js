const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const MODEL_NAME = "tngtech/deepseek-r1t2-chimera:free";

app.post("/api/check-brand-list", async (req, res) => {
  const { prompt, brand } = req.body;

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          {
            role: "user",
            content: `
Role: You are a Brand Visibility Auditor.

Task:
1. Based on the user's request: "${prompt}", generate a response that lists relevant items.
2. Analyze the GENERATED response. Is the brand "${brand}" explicitly mentioned in the generated list?
3. If the brand is mentioned in a ranked/numbered list, identify its position number. Otherwise, set position to 0.
4. If the brand is not mentioned in the generated response, set position to 0.
Output JSON only: {"mentioned": "Yes/No", "position": number, "context": "short snippet or reasoning"}
            `,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0,
      }),
    });

    const data = await response.json();

    if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
      const text = data.choices[0].message.content;
      console.log("OpenRouter Raw Analysis Result:", text);
      console.log("OpenRouter Analysis Result:", text);
      const json = JSON.parse(text);
      res.json({
        ...json,
        prompt,
        brand,
      });
    } else {
      throw new Error("Invalid response from OpenRouter API");
    }
  } catch (error) {
    console.error("OpenRouter API error:", error.message);

    res.status(500).json({
      prompt,
      brand,
      mentioned: "No",
      position: -1,
      context: "Analysis failed due to API error",
      error: error.message,
    });
  }
});

// Start server
app.listen(5001, async () => {
  console.log("API server running on port 5001");
  try {
    // Simple startup test
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          { role: "user", content: "Say 'System Online' if you hear me." },
        ],
        temperature: 0,
      }),
    });
    const data = await response.json();
    if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
      console.log("Startup Test:", data.choices[0].message.content.trim());
    } else {
      throw new Error("Invalid response from OpenRouter API during startup test");
    }
  } catch (error) {
    console.error("Startup Test Failed:", error.message);
  }
});
