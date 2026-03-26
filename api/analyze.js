const axios = require('axios');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Sadece POST isteği kabul edilir' });
    }

    const { product } = req.body;
    const apiKey = process.env.CLAUDE_API_KEY;

    try {
        const response = await axios.post('https://api.anthropic.com/v1/messages', {
            model: "claude-3-5-sonnet-20240620",
            max_tokens: 1024,
            messages: [{
                role: "user",
                content: `${product} hakkında internetteki genel yorumları analiz et. 
                Bana şunları JSON formatında ver, SADECE JSON döndür: 
                { "title": "Ürün Adı", "score": 8.5, "pros": ["artı1", "artı2"], "cons": ["eksi1", "eksi2"] }`
            }]
        }, {
            headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            }
        });

        // Claude bazen yanıtın içine ```json ... ``` ekleyebilir, onu temizleyelim
        const rawText = response.data.content[0].text;
        const jsonContent = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
        const aiResult = JSON.parse(jsonContent);

        res.status(200).json(aiResult);
    } catch (error) {
        console.error("Vercel API Hatası:", error.message);
        res.status(500).json({ error: "Analiz başarısız oldu." });
    }
}
