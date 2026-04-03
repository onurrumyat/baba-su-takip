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
      response_format: { type: "json_object" }, 
      messages: [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: `You are an expert repair estimator in ${region}. Analyze the image.
                     You MUST respond strictly in JSON format with these exact keys:
                     "diagnosis": A short 1-2 sentence diagnosis in ${language}.
                     "parts": An array of strings detailing exact parts needed and realistic CHEAPEST to AVERAGE retail prices in the local currency of ${region}. (Write in ${language}).
                     "total_cost": Estimated total cost including labor in ${language}.
                     "search_keywords": 2-3 highly optimized English keywords to find these exact parts on Amazon (e.g., "35mm ceramic faucet cartridge").` 
            },
            {
              type: "image_url",
              image_url: { "url": image }, 
            },
          ],
        },
      ],
      max_tokens: 350,
    });

    // OpenAI bazen JSON'u markdown (```json ... ```) içine alır, bunu temizliyoruz
    let rawContent = response.choices[0].message.content;
    rawContent = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();

    const aiData = JSON.parse(rawContent);
    return res.status(200).json(aiData);

  } catch (error) {
    console.error("OpenAI API Error:", error);
    return res.status(500).json({ error: "AI analysis failed.", details: error.message });
  }
};
