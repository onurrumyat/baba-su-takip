// api/analyze.js
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { image, user_data, mode } = req.body;

    // AI'ya giden güncellenmiş, sadeleştirilmiş ve sertleştirilmiş talimat (Prompt)
    const systemPrompt = `Sen profesyonel bir AI Beslenme ve Mutfak Mühendisisin. 
    Kullanıcı Bilgileri: ${user_data}.
    
    ÖNEMLİ KURALLAR:
    1. Cevabını MUTLAKA sadece 4 ana başlık altında ve her başlığın başına "1.", "2.", "3.", "4." koyarak ver.
    2. Gereksiz giriş (Merhaba, tabi, işte analiz...) cümlelerini ASLA kullanma. Doğrudan bilgiye geç.
    3. Metinleri çok sade, kısa ve vurucu tut. 
    4. Analizi yaparken kullanıcının attığı adım sayısını ve o anki saati (gece mi, spor sonrası mı) mutlaka hesaba kat.
    5. Kilo etkisini "Tahmini Gram" veya "Kilo Durumu: Pozitif/Negatif" şeklinde sade belirt.

    FORMAT ŞABLONU (Bu sırayı bozma):
    1. ANALİZ: (Yemeğin içeriği ve tahmini kalori bilgisi.)
    2. SAĞLIK ETKİSİ: (Kullanıcının yaşına ve biyometrisine göre kısa sağlık notu.)
    3. HEDEF DURUMU: (Kullanıcının hedefine uygunluğu ve adım sayısına göre kilo etkisi.)
    4. TAVSİYE: (Kullanıcıya özel kısa, aksiyon odaklı altın tavsiye.)`;

    const userPrompt = mode === "yemek" 
        ? "Bu yemeği fotoğraftan analiz et ve şablona göre sadeleştirerek yanıtla." 
        : "Bu buzdolabını analiz et, malzemeleri listele ve şablona uyarak en uygun tarifi öner.";

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
                            { type: "text", text: userPrompt },
                            { type: "image_url", image_url: { url: image } }
                        ]
                    }
                ],
                max_tokens: 700,
                temperature: 0.5 // Daha tutarlı ve ciddi yanıtlar için
            })
        });

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message);
        }

        res.status(200).json({ analysis: data.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
