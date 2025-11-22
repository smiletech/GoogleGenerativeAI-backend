// const express = require("express");
// const cors = require("cors");
// const { GoogleGenerativeAI } = require("@google/generative-ai");
// require("dotenv").config();

// const app = express();
// app.use(express.json());
// app.use(cors({ origin: "*" }));

// // Initialize Gemini
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// // Choose correct model name (old SDK still supports it)
// const model = genAI.getGenerativeModel({
//   model: "gemini-2.5-flash",
// });

// app.post("/api/check-brand-list", async (req, res) => {
//   const { prompt, brand } = req.body;

//   try {
//     const result = await model.generateContent({
//       contents: [
//         {
//           role: "user",
//           parts: [
//             {
//               text: `
//     Analyze the following text:
//     "${prompt}"

//     1. Is the brand "${brand}" mentioned?
//     2. If in a list, give its list position.
//     Output JSON only: {"mentioned": "Yes/No", "position": number}
//     `,
//             },
//           ],
//         },
//       ],
//       // --- THIS IS THE FIX ---
//       generationConfig: {
//         temperature: 0,
//         responseMimeType: "application/json",
//       },
//       // -----------------------
//     });

//     // Now the text is guaranteed to be clean JSON
//     const text = result.response.text();
//     console.log(text, "---------->text");
//     const json = JSON.parse(text);

//     res.json({ ...json, prompt, brand });
//   } catch (error) {
//     console.error("Gemini API error:", error.message);

//     // Helpful debugging: print what the bad text actually looked like
//     // console.log("Failed text:", result?.response?.text());

//     res.json({
//       prompt,
//       brand,
//       mentioned: "No",
//       position: -1,
//       note: "Fallback due to Gemini API error",
//     });
//   }
// });

// // Start server
// app.listen(5001, async () => {
//   console.log("API server running on port 5001");
//   try {
//     // Test call
//     const test = await model.generateContent("Hello world!");
//     console.log("Gemini Test Output:", test.response.text());
//   } catch (error) {
//     console.error("Startup Test Failed:", error);
//   }
// });

const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Define the Strict JSON Schema
const analysisSchema = {
  type: SchemaType.OBJECT,
  properties: {
    mentioned: {
      type: SchemaType.STRING,
      description: "Whether the brand is mentioned. Returns 'Yes' or 'No'.",
      enum: ["Yes", "No"],
    },
    position: {
      type: SchemaType.INTEGER,
      description:
        "The numeric rank of the brand in the list. Returns 0 if not found or list is unranked.",
    },
    context: {
      type: SchemaType.STRING,
      description:
        "A short snippet of text where the brand was found, or reasoning if not found.",
    },
  },
  required: ["mentioned", "position"],
};

// Configure Model with Schema
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    temperature: 0, // Keep it deterministic
    responseMimeType: "application/json",
    responseSchema: analysisSchema, // <--- This guarantees the structure
  },
});

app.post("/api/check-brand-list", async (req, res) => {
  // CRITICAL: We need 'aiResponse' (the text containing the list)
  const { prompt, brand } = req.body;

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `
    Role: You are a Brand Visibility Auditor.

    Context:
    1. User Prompt: "${prompt}"
    2. Brand to Track: "${brand}"
    
    Text to Analyze (AI Response):
    """
    ${prompt}
    """
    
    Task:
    1. Scan the "Text to Analyze". Is "${brand}" explicitly mentioned?
    2. If the text is a ranked/numbered list, identify the position number of "${brand}".
    3. If the brand is mentioned but the list is NOT numbered (bullet points), set position to 0.
    4. If the brand is not mentioned, set position to 0.
    `,
            },
          ],
        },
      ],
    });

    // Because of responseSchema, this text is guaranteed to be clean JSON
    const text = result.response.text();
    console.log("Gemini Analysis Result:", text);

    const json = JSON.parse(text);

    res.json({
      ...json,
      prompt,
      brand,
    });
  } catch (error) {
    console.error("Gemini API error:", error.message);

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
    // Note: We use a separate config for the test so it doesn't fail schema validation
    const testModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const test = await testModel.generateContent(
      "Say 'System Online' if you hear me."
    );
    console.log("Startup Test:", test.response.text().trim());
  } catch (error) {
    console.error("Startup Test Failed:", error.message);
  }
});
