// api/analyze.js
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    const { image, user_data, mode } = req.body;

    const systemPrompt = `Sen profesyonel bir AI Beslenme Uzmanısın. 
    Kullanıcı Verisi: ${user_data}.
    
    KURALLAR:
    1. Analizi çok sade ve net yap. Uzun cümlelerden kaçın.
    2. Cevabı mutlaka şu formatta ver:
       1. ANALİZ: (Kalori ve içerik tahmini)
       2. SAĞLIK: (Kullanıcının yaşına/şekerine/deminine göre etkisi)
       3. HEDEF: (Kilosuna ve adım sayısına göre uygunluk)
       4. TAVSİYE: (Kısa ve net aksiyon önerisi)
    3. Eğer gece geç saatse veya adım azsa bunu mutlaka vurgula.`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: [
                        { type: "text", text: `${mode === 'yemek' ? 'Bu yemeği' : 'Bu buzdolabını'} en sade şekilde analiz et.` },
                        { type: "image_url", image_url: { url: image } }
                    ]}
                ],
                max_tokens: 600
            })
        });
        const data = await response.json();
        res.status(200).json({ analysis: data.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
