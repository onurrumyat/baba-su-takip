// api/analyze.js
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    const { image, user_data, mode } = req.body;

    let systemPrompt = mode === 'plan' 
        ? `Sen bir Beslenme Uzmanısın. Kullanıcı Verileri: ${user_data}. 
           GÖREV: 7 günlük beslenme planı oluştur. 
           FORMAT: Her günü şu şekilde başlat: "GÜN: [Gün Adı]". 
           Her öğünü "Sabah: [Yemek]", "Öğle: [Yemek]", "Akşam: [Yemek]" şeklinde alt alta yaz. 
           Çok düzenli ve şık bir liste olsun.`
        : `Sen bir Gıda Mühendisisin. Kullanıcı Verileri: ${user_data}. 
           GÖREV: Gıdayı 4 başlıkta analiz et: 1.Özet, 2.Tablo, 3.Hedef, 4.Tavsiye.`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [{ role: "system", content: systemPrompt }, 
                           { role: "user", content: mode === 'plan' ? "Haftalık planımı oluştur." : [{ type: "text", text: "Analiz et." }, { type: "image_url", image_url: { url: image } }] }],
                max_tokens: 1200, temperature: 0.3
            })
        });
        const data = await response.json();
        res.status(200).json({ analysis: data.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ error: "Hata oluştu." });
    }
}
