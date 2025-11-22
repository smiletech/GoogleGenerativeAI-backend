
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
      const model = genAI.getGenerativeModel({
        model: "gemini-pro", // ✔️ SAFE MODEL
      });
  
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
    Output JSON only:
    { "mentioned": "Yes/No", "position": number }
    `,
              },
            ],
          },
        ],
        generationConfig: { temperature: 0 },
      });
  
      const json = JSON.parse(result.response.text());
  
      res.json({ ...json, prompt, brand });
    } catch (error) {
      console.error("Gemini API error:", error.message);
      res.json({
        prompt,
        brand,
        mentioned: "No",
        position: -1,
        note: "Fallback due to Gemini API error",
      });
    }
  });
  
  app.get("/api/models", async (req, res) => {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyBm9QYVvdDmuQBhtoIIKcSWevsJECcc5aE`;
      
      const response = await fetch(url);
      const data = await response.json();
  
      res.json(data);
  
    } catch (error) {
      console.error("Error listing models:", error);
      res.status(500).json({ error: "Unable to list models" });
    }
  });
  
  
  app.get("/api/check-brand", async (req, res) => {
    const { prompt, brand } = req.body;
  
    try {
      const result = await model.generateContent(`Analyze this text:
      "${prompt}"
      `);
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
  app.get("/health-check", async (req, res) => {
    res.json({ status: "ok" });
  });