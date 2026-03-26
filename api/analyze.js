// api/analyze.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Sadece POST kabul edilir' });
    }

    const { product } = req.body;
    const apiKey = process.env.CLAUDE_API_KEY;

    try {
        // Axios yerine yerleşik fetch kullanıyoruz
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                model: "claude-3-5-sonnet-20240620",
                max_tokens: 1024,
                messages: [{
                    role: "user",
                    content: `${product} hakkında internetteki genel yorumları analiz et. 
                    Bana sadece şu formatta JSON döndür: 
                    { "title": "Ürün Adı", "score": 8.5, "pros": ["artı1"], "cons": ["eksi1"] }`
                }]
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error?.message || 'Claude API Hatası');
        }

        const rawText = data.content[0].text;
        const jsonContent = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
        const aiResult = JSON.parse(jsonContent);

        res.status(200).json(aiResult);
    } catch (error) {
        console.error("Hata Detayı:", error.message);
        res.status(500).json({ error: error.message });
    }
}
