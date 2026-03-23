// api/analyze.js
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    const { image, user_data, mode, lang } = req.body; 

    const languageInstruction = lang === 'en' ? "RESPONSE LANGUAGE MUST BE ENGLISH." : "YANIT DİLİ TÜRKÇE OLMALIDIR.";

    let systemPrompt = mode === 'plan' 
        ? `Sen profesyonel bir diyetisyensin. Kullanıcı: ${user_data}. 7 günlük planı GÜN GÜN, sadece öğün ve yemek adı olarak kısa ve net ver. ${languageInstruction}`
        : `Sen kıdemli gıda uzmanısın ve gelecek öngörüsü yapabilen bir biyologsun. Kullanıcı: ${user_data}. 
           FORMAT:
           1. [SKOR: X] formatında skor ve açıklama.
           2. AÇLIK KRONOMETRESİ ⏳: Net süre.
           3. ÜRÜN ÖZETİ.
           4. BESİN DEĞERLERİ.
           5. HEDEF ANALİZİ.
           6. VIP GELECEK ÖNGÖRÜSÜ 🔮: Bu yemek yarın sabahki şişkinliği, enerjiyi ve 10 yıl sonraki hücresel yaşlanmayı nasıl etkiler? (Fal gibi ama bilimsel temelli öngörü).
           7. NET TAVSİYE.
           ${languageInstruction}`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [{ role: "system", content: systemPrompt }, 
                           { role: "user", content: mode === 'plan' ? "Net beslenme planı çıkar." : [{ type: "text", text: "Gıdayı analiz et, skoru, acıkma süresini ve VIP gelecek öngörüsünü ver." }, { type: "image_url", image_url: { url: image } }] }],
                max_tokens: 1000, temperature: 0.2
            })
        });
        const data = await response.json();
        res.status(200).json({ analysis: data.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ error: "Sistem hatası." });
    }
}
