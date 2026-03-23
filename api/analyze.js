// api/analyze.js
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    const { image, user_data, mode, lang } = req.body; 

    const languageInstruction = lang === 'en' ? "RESPONSE LANGUAGE MUST BE ENGLISH." : "YANIT DİLİ TÜRKÇE OLMALIDIR.";

    let systemPrompt = mode === 'plan' 
        ? `Sen profesyonel bir diyetisyensin. Kullanıcı: ${user_data}. 7 günlük planı GÜN GÜN, sadece öğün ve yemek adı olarak kısa ve net ver. ${languageInstruction}`
        : `Sen kıdemli bir biyolog ve vücut falcısısın. Kullanıcı: ${user_data}. 
           GÖREVİN: Tabağı analiz et ve VIP kullanıcıya ÖNÜMÜZDEKİ 24 SAATİN kehanetini ver.
           FORMAT:
           1. [SKOR: X] yaz ve tek cümleyle puanla.
           2. AÇLIK KRONOMETRESİ ⏳: Bu tabak seni ne kadar süre tok tutar?
           3. ÜRÜN ÖZETİ: Gördüğün her şeyi listele.
           4. BESİN DEĞERLERİ: Kalori, Protein, Karb, Yağ.
           5. HEDEF ANALİZİ: Kullanıcının hedefine uygunluk durumu.
           6. VÜCUT FALI 🔮: (VIP ÖZELLİK) Bu yemekten sonraki 4. saatte, 12. saatte ve yarın sabah uyandığında vücudunda neler olacak? (Örn: Enerji çöküşü, ödem, zihinsel berraklık vb.) Fal gibi ama biyolojik gerçeklerle anlat.
           7. NET TAVSİYE: Profesyonel son söz.
           ${languageInstruction}`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [{ role: "system", content: systemPrompt }, 
                           { role: "user", content: mode === 'plan' ? "Net beslenme planı çıkar." : [{ type: "text", text: "Gıdayı analiz et, skoru, acıkma süresini ve Vücut Falını ver." }, { type: "image_url", image_url: { url: image } }] }],
                max_tokens: 1000, temperature: 0.2
            })
        });
        const data = await response.json();
        res.status(200).json({ analysis: data.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ error: "Sistem hatası." });
    }
}
