// api/analyze.js
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    
    const { image, user_data, mode, lang } = req.body; 
    const languageInstruction = lang === 'en' ? "RESPONSE LANGUAGE MUST BE ENGLISH." : "YANIT DİLİ TÜRKÇE OLMALIDIR.";

    // VIP KEHANETİ VE ANALİZ TALİMATI
    let systemPrompt = mode === 'plan' 
        ? `Sen profesyonel bir diyetisyensin. Kullanıcı Verileri: ${user_data}. 7 günlük beslenme planını gün gün, öğün bazlı ve net bir şekilde çıkar. ${languageInstruction}`
        : `Sen kıdemli bir biyolog ve vücut kehanetçisisin. Kullanıcı Verileri: ${user_data}. 
           GÖREVİN: Fotoğraftaki tabağı analiz et ve kullanıcıya '24 Saatlik Vücut Falı' bak.
           
           FORMAT ŞU ŞEKİLDE OLMALIDIR:
           1. [SKOR: X] yaz ve yanına tek cümlelik bir özet ekle.
           2. AÇLIK KRONOMETRESİ ⏳: Bu yemek kullanıcıyı kaç saat tok tutar?
           3. ÜRÜN ÖZETİ: Tabakta gördüğün tüm malzemeleri listele.
           4. BESİN DEĞERLERİ: Tahmini Kalori, Protein, Karbonhidrat ve Yağ değerleri.
           5. HEDEF ANALİZİ: Kullanıcının kilo alma/verme hedefine bu yemek ne kadar hizmet ediyor?
           6. 24 SAATLİK VÜCUT KEHANETİ 🔮: (VIP ÖZELLİK) Bu yemekten sonraki 4. saatte, 12. saatte ve yarın sabah uyandığında vücutta neler olacak? Enerji durumu, ödem riski, susuzluk veya zihinsel odaklanma gibi durumları bir falcı edasıyla ama bilimsel temelle anlat.
           7. NET TAVSİYE: Bu öğünü dengelemek için bir sonraki adım ne olmalı?
           ${languageInstruction}`;

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
                        { type: "text", text: "Bu tabağı analiz et ve 24 saatlik biyolojik kehanetimi söyle." },
                        { type: "image_url", image_url: { url: image } }
                    ]}
                ],
                max_tokens: 1200,
                temperature: 0.4
            })
        });
        const data = await response.json();
        res.status(200).json({ analysis: data.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ error: "Sunucu hatası: AI yanıt veremedi." });
    }
}
