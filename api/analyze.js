// api/analyze.js
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    const { image, user_data, mode } = req.body;

    const systemPrompt = `Sen bir Gıda Mühendisi ve Beslenme Uzmanısın. 
    Kullanıcı Verileri: ${user_data}.

    GÖREV: Fotoğraftaki her türlü yemeği, atıştırmalığı veya tatlıyı analiz et. 
    ÖNEMLİ: Cevabını MUTLAKA şu 3 bölümde ver:
    
    1. ÖZET: Yemeğin adı ve genel durumu (Örn: Çikolatalı sufle, yaklaşık 450 kcal).
    2. TABLO: Aşağıdaki verileri bir liste/tablo gibi alt alta sırala:
       - Protein: ...g
       - Karbonhidrat: ...g
       - Yağ: ...g
       - Şeker: ...g
       - Lif: ...g
    3. HEDEF ANALİZİ: Kullanıcının yaşına, kilosuna ve "Hedefine" göre bu besini tüketmesinin sonucunu (Kilo alımı/verimi etkisi) açıkla.
    4. TAVSİYE: Tüketilmeli mi? Yanında ne içilmeli veya sonrası için ne yapılmalı?

    Not: Kişi analizi yapma, sadece gıdaya odaklan. Eğer buzdolabıysa içindekileri listele ve tarif ver.`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [{ role: "system", content: systemPrompt }, 
                           { role: "user", content: [{ type: "text", text: "Bu gıdayı tablo şeklinde analiz et." }, { type: "image_url", image_url: { url: image } }] }],
                max_tokens: 800, temperature: 0.2
            })
        });
        const data = await response.json();
        res.status(200).json({ analysis: data.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ error: "Görsel işlenemedi. Lütfen daha ışıklı bir ortamda tekrar çekin." });
    }
}
