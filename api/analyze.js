// api/analyze.js
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    const { image, user_data, mode, lang } = req.body; 

    const languageInstruction = lang === 'en' ? "RESPONSE LANGUAGE MUST BE ENGLISH." : "YANIT DİLİ TÜRKÇE OLMALIDIR.";

    let systemPrompt = mode === 'plan' 
        ? `Sen profesyonel bir diyetisyensin. Kullanıcı: ${user_data}. 7 günlük planı GÜN GÜN, sadece öğün ve yemek adı olarak kısa ve net ver. ${languageInstruction}`
        : `Sen kıdemli gıda uzmanısın. 
           KRİTİK TALİMAT: Eğer görüntüde net bir yemek/gıdaya dair bir şey yoksa, kişileri veya nesneleri tanımlamaya çalışma. Sadece "Görüntüde analiz edilecek bir yemek bulunamadı." de ve bitir.
           Eğer yemek varsa:
           1. HEDEF UYUM SKORU: Kullanıcının (${user_data}) hedefine uygunluk skoru 1-10 arası. FORMAT: "[SKOR: X]". Sonrasında kısa açıklama.
           2. AÇLIK KRONOMETRESİ ⏳: Tahmini acıkma süresi.
           3. ÜRÜN ÖZETİ: Gıdanın tam adı (Örn: Tavuklu Pilav).
           4. BESİN DEĞERLERİ: Kalori, Protein, Karbonhidrat, Yağ.
           5. HEDEF ANALİZİ: Hedefe uygunluk.
           6. NET TAVSİYE: Tüketim onayı.
           ${languageInstruction}`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [{ role: "system", content: systemPrompt }, 
                           { role: "user", content: mode === 'plan' ? "Net beslenme planı çıkar." : [{ type: "text", text: "Gıdayı analiz et." }, { type: "image_url", image_url: { url: image } }] }],
                max_tokens: 800, temperature: 0.1
            })
        });
        const data = await response.json();
        res.status(200).json({ analysis: data.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ error: "Sistem hatası." });
    }
}
