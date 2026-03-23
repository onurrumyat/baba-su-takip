// api/analyze.js
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    const { image, user_data, mode, lang } = req.body; 

    const languageInstruction = lang === 'en' ? "RESPONSE LANGUAGE MUST BE ENGLISH." : "YANIT DİLİ TÜRKÇE OLMALIDIR.";

    let systemPrompt = mode === 'plan' 
        ? `Sen profesyonel bir diyetisyensin. Kullanıcı: ${user_data}. 7 günlük planı GÜN GÜN, sadece öğün ve yemek adı olarak kısa ve net ver. ${languageInstruction}`
        : `Sen kıdemli gıda uzmanısın. Kullanıcı: ${user_data}. 
           ÖNEMLİ: Görüntüdeki kişilere odaklanma, doğrudan gıdaya odaklan. 
           FORMAT:
           1. HEDEF UYUM SKORU: Kullanıcının hedefine uygunluk skoru 1 ile 10 arasında olmalı. YAZIYA KESİNLİKLE ŞU FORMATTA BAŞLA: "[SKOR: X]". Sonrasında tek cümle açıklama yap.
           2. AÇLIK KRONOMETRESİ ⏳: Bu tabağın glisemik indeksi ve sindirim süresine göre tahmini acıkma süresini net saat/dakika olarak ver.
           3. ÜRÜN ÖZETİ: Gördüğün gıdanın tam adı ve porsiyonu.
           4. BESİN DEĞERLERİ: Kalori (kcal), Protein (g), Karbonhidrat (g), Yağ (g) net rakamlarla.
           5. HEDEF ANALİZİ: Kullanıcının hedefine uygunluk durumu.
           6. NET TAVSİYE: Tüketim onayı ve profesyonel görüş.
           ${languageInstruction}`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [{ role: "system", content: systemPrompt }, 
                           { role: "user", content: mode === 'plan' ? "Net beslenme planı çıkar." : [{ type: "text", text: "Gıdayı analiz et, skoru ve acıkma süresini ver." }, { type: "image_url", image_url: { url: image } }] }],
                max_tokens: 800, temperature: 0.1
            })
        });
        const data = await response.json();
        res.status(200).json({ analysis: data.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ error: "Sistem hatası." });
    }
}