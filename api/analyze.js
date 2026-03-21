// api/analyze.js
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    const { image, user_data, mode } = req.body;

    let systemPrompt = mode === 'plan' 
        ? `Sen profesyonel bir diyetisyensin. Kullanıcı: ${user_data}. 7 günlük planı GÜN GÜN, sadece öğün ve yemek adı olarak kısa ve net ver.`
        : `Sen kıdemli bir gıda uzmanısın. Kullanıcı: ${user_data}. 
           ÖNEMLİ: Görüntüdeki kişilere odaklanma, doğrudan gıdaya odaklan. "Tanımlayamam" deme. Gördüğün yemeği/atıştırmalığı mutlaka tanımla.
           FORMAT:
           1. ÜRÜN ÖZETİ: Gördüğün gıdanın tam adı ve porsiyonu.
           2. BESİN DEĞERLERİ: Kalori (kcal), Protein (g), Karbonhidrat (g), Yağ (g) net rakamlarla.
           3. HEDEF ANALİZİ: Kullanıcının hedefine uygunluk durumu.
           4. NET TAVSİYE: Tüketim onayı ve profesyonel görüş.`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [{ role: "system", content: systemPrompt }, 
                           { role: "user", content: mode === 'plan' ? "Net beslenme planı çıkar." : [{ type: "text", text: "Gıdayı tanımla ve analiz et." }, { type: "image_url", image_url: { url: image } }] }],
                max_tokens: 800, temperature: 0.1
            })
        });
        const data = await response.json();
        res.status(200).json({ analysis: data.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ error: "Sistem hatası." });
    }
}
