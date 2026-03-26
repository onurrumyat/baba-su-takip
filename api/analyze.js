// api/analyze.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Sadece POST kabul edilir' });
    }

    const { product } = req.body;
    const apiKey = process.env.CLAUDE_API_KEY;

    // Güvenlik kontrolü
    if (!apiKey) {
        return res.status(500).json({ error: 'API Anahtarı sunucuda eksik (CLAUDE_API_KEY bulunamadı).' });
    }

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                model: "claude-3-5-sonnet-latest",
                max_tokens: 1024,
                messages: [{
                    role: "user",
                    content: `${product} hakkında internetteki genel yorumları analiz et. 
                    Bana sadece şu formatta JSON döndür, format dışına çıkma: 
                    { "title": "Ürün Adı", "score": 8.5, "pros": ["artı1", "artı2"], "cons": ["eksi1", "eksi2"] }`
                }]
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error?.message || 'Claude API Hatası');
        }

        const rawText = data.content[0].text;
        
        // Claude'un metni içinden garanti olarak JSON'u cımbızla çeken Regex yapısı
        const match = rawText.match(/\{[\s\S]*\}/);
        if (!match) {
            throw new Error('Yapay zeka geçerli bir format döndürmedi.');
        }

        const aiResult = JSON.parse(match[0]);
        res.status(200).json(aiResult);
        
    } catch (error) {
        console.error("Hata Detayı:", error.message);
        res.status(500).json({ error: error.message });
    }
}
