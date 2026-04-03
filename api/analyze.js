const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests are allowed.' });
  }

  try {
    const { image, language, region } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image data is missing.' });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: `You are a strict, expert repair estimator. The user is in ${region}.
                     RULES:
                     1. DIAGNOSIS: Maximum 2 short sentences.
                     2. PARTS: List exact parts needed.
                     3. REALISTIC PRICES: Give highly realistic, current retail market prices for parts and labor in the local currency of ${region}. Do not give vague ranges.
                     4. FORMAT: Use a very short, clean bulleted list.
                     5. LANGUAGE: You MUST write your entire response in ${language}. No exceptions.` 
            },
            {
              type: "image_url",
              image_url: { "url": image }, 
            },
          ],
        },
      ],
      max_tokens: 300,
    });

    return res.status(200).json({ result: response.choices[0].message.content });
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return res.status(500).json({ error: "AI analysis failed.", details: error.message });
  }
};
