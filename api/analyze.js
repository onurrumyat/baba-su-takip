// api/analyze.js
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    const { image, user_data, mode } = req.body;

    let systemPrompt = mode === 'plan' 
        ? `Sen profesyonel bir diyetisyensin. Kullanıcı: ${user_data}. 7 günlük planı GÜN GÜN, sadece öğün ve yemek adı olarak kısa ve net ver.`
        : `Sen kıdemli gıda uzmanısın. Kullanıcı: ${user_data}. Görseldeki gıdayı şu şekilde analiz et:
           1. ÖZET: Ürünün adı ve porsiyon miktarı.
           2. BESİN DEĞERLERİ: Sadece şu değerleri net rakamla ver: Kalori (kcal), Protein (g), Karbonhidrat (g), Yağ (g).
           3. HEDEF ANALİZİ: Bu gıda kullanıcının hedefine uygun mu? (Evet/Hayır ve neden).
           4. NET TAVSİYE: Tüketilmeli mi, alternatifi ne?
           GEREKSİZ SÖZ VE KARMAŞIK SAYI DİZİLERİNDEN KAÇIN. NET OL.`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [{ role: "system", content: systemPrompt }, 
                           { role: "user", content: mode === 'plan' ? "Haftalık planı tablo gibi çıkar." : [{ type: "text", text: "Net analiz raporu." }, { type: "image_url", image_url: { url: image } }] }],
                max_tokens: 800, temperature: 0.1
            })
        });
        const data = await response.json();
        res.status(200).json({ analysis: data.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ error: "Sistem hatası." });
    }
}
