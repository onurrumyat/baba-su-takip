// api/analyze.js
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { image, user_data, mode } = req.body;

    // AI'yı "Kişi analizi yapmıyorum" tuzağından kurtaran ve doğrudan yemeğe odaklayan komut
    const systemPrompt = `Sen profesyonel bir Gıda ve Beslenme Analiz Sistemisin. 
    Kullanıcı Profili (Sadece girdi olarak kullan): ${user_data}.
    
    ÖNEMLİ GÜVENLİK VE GÖREV TALİMATI:
    1. Fotoğrafta insan olsa bile KİŞİ ANALİZİ YAPMA. Sadece TABAĞA/YEMEĞE odaklan. 
    2. 'Kişi analizi yapamam' gibi uyarılar verme. Doğrudan yemeğin içeriğini ve bu yemeğin belirtilen kilodaki/yaştaki insana etkisini yaz.
    3. Yanıtı sadece şu 4 madde ile sınırla (1., 2., 3., 4. şeklinde):
    
    1. ANALİZ: (Yemek içeriği ve tahmini toplam kalori.)
    2. SAĞLIK ETKİSİ: (Bu içeriğin profil verilerine göre tıbbi/beslenme etkisi.)
    3. HEDEF VE KİLO: (Adım sayısı ve saate göre bu yemeğin kilo değişimine (+/- gr) tahmini etkisi.)
    4. TAVSİYE: (Kısa, net ve uygulanabilir bir direktif.)

    NOT: Çok sade ve teknik bir dil kullan. Gereksiz nezaket cümleleri kurma.`;

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
                    {
                        role: "user",
                        content: [
                            { type: "text", text: mode === "yemek" ? "Bu tabağı analiz et." : "Bu dolaptaki malzemeleri listele ve tarif ver." },
                            { type: "image_url", image_url: { url: image } }
                        ]
                    }
                ],
                max_tokens: 600,
                temperature: 0.3 // Daha tutarlı sonuçlar için
            })
        });

        const data = await response.json();
        
        if (data.error) throw new Error(data.error.message);

        res.status(200).json({ analysis: data.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ error: "Analiz Motoru Yanıt Vermedi. Lütfen tekrar deneyin." });
    }
}
