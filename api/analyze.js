// api/analyze.js
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { image, user_data, mode } = req.body;

    // AI'ya giden ana talimat (Prompt)
    const prompt = mode === "yemek" 
        ? `Sen 'AI Bio-Chef' platformunun öncü beslenme mühendisisin. 
           Kullanıcı Bilgileri: ${user_data}.
           Görevin: Fotoğraftaki yemeği analiz et. 
           Cevabını 5 madde halinde (1. ANALİZ, 2. SAĞLIK ETKİSİ, 3. KİLO ETKİSİ, 4. TAVSİYE, 5. SAAT/ADIM YORUMU) ver.
           Özellikle kullanıcının o anki SAATİNE ve ADIM SAYISINA göre bu yemeği yiyip yememesi gerektiğini açıkla.`
        : `Sen 'AI Bio-Chef' envanter uzmanısın. 
           Kullanıcı Bilgileri: ${user_data}.
           Görevin: Fotoğraftaki BUZDOLABINI analiz et, malzemeleri listele ve bu malzemelerle kullanıcının hedefine uygun bir tarif öner.`;

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
                    { role: "system", content: prompt },
                    {
                        role: "user",
                        content: [
                            { type: "text", text: `Bu benim ${mode === 'yemek' ? 'yemeğim' : 'buzdolabım'}. Lütfen analiz et.` },
                            { type: "image_url", image_url: { url: image } }
                        ]
                    }
                ],
                max_tokens: 800
            })
        });

        const data = await response.json();
        res.status(200).json({ analysis: data.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
