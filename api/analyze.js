// api/analyze.js
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    const { image, user_data, mode } = req.body;

    const systemPrompt = `Sen profesyonel bir Gıda Analiz Sistemisin. Kullanıcı Profili ve Hedefi: ${user_data}.
    GÖREV: Fotoğraftaki nesneye odaklan. Kişi analizi uyarısı yapma, doğrudan tabağa/dolaba odaklan.
    FORMAT: Yanıtı sadece 4 madde (1., 2., 3., 4.) halinde, çok sade ve teknik ver.
    1. ANALİZ: Kalori ve içerik tahmini.
    2. SAĞLIK: Profil verilerine ve hedefine göre tıbbi/beslenme etkisi.
    3. HEDEF/KİLO: Kullanıcının seçtiği hedefe göre bu yemeğin kilo değişimine (+/- gr) tahmini etkisi.
    4. TAVSİYE: Hedefe ulaşmak için kısa ve net aksiyon önerisi.`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [{ role: "system", content: systemPrompt }, 
                           { role: "user", content: [{ type: "text", text: "Analiz et." }, { type: "image_url", image_url: { url: image } }] }],
                max_tokens: 600, temperature: 0.3
            })
        });
        const data = await response.json();
        res.status(200).json({ analysis: data.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ error: "Sistem meşgul, tekrar deneyin." });
    }
}
