// api/analyze.js
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    const { image, user_data, mode } = req.body;

    let systemPrompt = mode === 'plan' 
        ? `Sen profesyonel bir Diyetisyen ve Beslenme Uzmanısın. Kullanıcı Verileri: ${user_data}. 
           GÖREV: 7 günlük beslenme planı oluştur. 
           DİL: Akademik ve profesyonel. 
           FORMAT: Her günü "GÜN: [Gün Adı]" başlığıyla aç. Öğünleri "Sabah:", "Öğle:", "Akşam:" şeklinde, aralarına net boşluk bırakarak yaz.`
        : `Sen kıdemli bir Gıda Mühendisi ve Beslenme Uzmanısın. Kullanıcı Verileri: ${user_data}. 
           GÖREV: Görseldeki gıdayı profesyonel bir teknik rapor halinde analiz et. 
           FORMAT:
           1. ÜRÜN TANIMI VE ÖZET (Teknik analiz)
           2. BESİN DEĞERLERİ TABLOSU (Porsiyon bazlı; Enerji kcal, Protein g, Karbonhidrat g, Yağ g, Şeker g)
           3. MAKRO ANALİZ VE HEDEF UYUMU (Kullanıcının hedefine göre bilimsel etkisi)
           4. KLİNİK TAVSİYE (Tüketim onayı ve profesyonel öneri)
           DİL: Resmi ve bilgilendirici. Hatalı semboller kullanma.`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [{ role: "system", content: systemPrompt }, 
                           { role: "user", content: mode === 'plan' ? "Teknik beslenme planı oluştur." : [{ type: "text", text: "Analiz raporu hazırla." }, { type: "image_url", image_url: { url: image } }] }],
                max_tokens: 1200, temperature: 0.2
            })
        });
        const data = await response.json();
        res.status(200).json({ analysis: data.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ error: "Sistem meşgul." });
    }
}
