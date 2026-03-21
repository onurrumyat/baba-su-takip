// api/analyze.js
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    const { image, user_data, mode, is_premium } = req.body;

    let systemPrompt = "";
    
    if (mode === 'plan') {
        systemPrompt = `Sen bir Beslenme Uzmanısın. Kullanıcı Profili: ${user_data}. 
        GÖREV: Kullanıcıya özel 7 günlük, öğün öğün (Kahvaltı, Öğle, Akşam, Atıştırmalık) Besin Planı oluştur. 
        HEDEFE odaklan (Kilo al/ver/koru). Planı tablo formatında ve çok net ver.`;
    } else {
        systemPrompt = `Sen bir Gıda Mühendisisin. Kullanıcı Profili: ${user_data}. 
        GÖREV: Fotoğraftaki gıdayı 4 başlıkta analiz et: 1. Özet, 2. Besin Tablosu, 3. Hedef Analizi, 4. Tavsiye.`;
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [{ role: "system", content: systemPrompt }, 
                           { role: "user", content: mode === 'plan' ? "Bana haftalık planımı çıkar." : [{ type: "text", text: "Analiz et." }, { type: "image_url", image_url: { url: image } }] }],
                max_tokens: 1500, temperature: 0.3
            })
        });
        const data = await response.json();
        res.status(200).json({ analysis: data.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ error: "Sistem meşgul." });
    }
}
