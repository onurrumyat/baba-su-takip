// api/analyze.js
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    const { image, user_data, mode, lang } = req.body; 

    const languageInstruction = lang === 'en' ? "RESPONSE LANGUAGE MUST BE ENGLISH." : "YANIT DİLİ TÜRKÇE OLMALIDIR.";

    let systemPrompt = '';
    
    // EKLENEN: VS Modu için Boks Spikeri Komutu
    if (mode === 'vs') {
        systemPrompt = `Sen enerjik bir boks spikeri ve gıda uzmanısın. Kullanıcı 2 farklı yemeği (veya aynı tabaktaki 2 ana bileşeni) okutuyor. Bu iki yemeği bir boks maçındaymış gibi karşılaştır ve daha sağlıklı olanı kazanan ilan et.
        FORMAT:
        1. MAÇIN SONUCU 🏆: Kazananı seç ve "X, Y'yi %40 daha fazla proteinle nakavt etti!" gibi eğlenceli bir spiker yorumu yap.
        2. 1. KÖŞE 🔴: İlk gıdanın adı, tahmini kalorisi ve avantaj/dezavantajı.
        3. 2. KÖŞE 🔵: İkinci gıdanın adı, tahmini kalorisi ve avantaj/dezavantajı.
        ${languageInstruction}`;
    } else if (mode === 'plan') {
        systemPrompt = `Sen profesyonel bir diyetisyensin. Kullanıcı: ${user_data}. 7 günlük planı GÜN GÜN, sadece öğün ve yemek adı olarak kısa ve net ver. ${languageInstruction}`;
    } else {
        systemPrompt = `Sen kıdemli gıda uzmanısın. Kullanıcı: ${user_data}. 
           ÖNEMLİ: Görüntüdeki kişilere odaklanma, doğrudan gıdaya odaklan. 
           FORMAT:
           1. HEDEF UYUM SKORU: Kullanıcının hedefine uygunluk skoru 1 ile 10 arasında olmalı. YAZIYA KESİNLİKLE ŞU FORMATTA BAŞLA: "[SKOR: X]". Sonrasında tek cümle açıklama yap.
           2. ÜRÜN ÖZETİ: Gördüğün gıdanın tam adı ve porsiyonu.
           3. BESİN DEĞERLERİ: Kalori (kcal), Protein (g), Karbonhidrat (g), Yağ (g) net rakamlarla.
           4. HEDEF ANALİZİ: Kullanıcının hedefine uygunluk durumu.
           5. NET TAVSİYE: Tüketim onayı ve profesyonel görüş.
           ${languageInstruction}`;
    }

    let userMessageText = "Net beslenme planı çıkar.";
    if (mode === 'yemek') userMessageText = "Gıdayı analiz et ve 1-10 arası skor ver.";
    if (mode === 'vs') userMessageText = "Görüntüdeki iki yemeği savaştır ve kazananı seç."; // VS Modu mesajı

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [{ role: "system", content: systemPrompt }, 
                           { role: "user", content: mode === 'plan' ? userMessageText : [{ type: "text", text: userMessageText }, { type: "image_url", image_url: { url: image } }] }],
                max_tokens: 800, temperature: 0.1
            })
        });
        const data = await response.json();
        res.status(200).json({ analysis: data.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ error: "Sistem hatası." });
    }
}
