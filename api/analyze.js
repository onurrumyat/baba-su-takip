const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests are allowed.' });
  }

  try {
    // Frontend'den gelen resim, dil ve ülke verilerini alıyoruz
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
              // AI'a seçilen ülke ve dile göre dinamik talimat veriyoruz
              text: `You are an expert home repair assistant. Analyze the image. The user is located in ${region}. 
                     Provide a short diagnosis, list the required parts, and give an estimated total cost including labor in the local currency of ${region}. 
                     IMPORTANT: Write your entire response in ${language}. Keep it professional and well-formatted.` 
            },
            {
              type: "image_url",
              image_url: { "url": image }, 
            },
          ],
        },
      ],
      max_tokens: 500,
    });

    return res.status(200).json({ result: response.choices[0].message.content });
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return res.status(500).json({ error: "AI analysis failed.", details: error.message });
  }
};
