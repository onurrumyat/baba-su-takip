// api/analyze.js
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    const { image, user_data, mode } = req.body;

    const systemPrompt = `Sen bir Gıda Mühendisi ve Beslenme Uzmanısın. 
    Kullanıcı Verileri: ${user_data}.

    GÖREV: Fotoğraftaki her türlü gıdayı analiz et. 
    ÖNEMLİ: Cevabını MUTLAKA şu 4 ana başlık altında ver ve başlıkların başına "1.", "2." koy:
    
    1. GENEL ÖZET: (Yemeğin adı ve kısa tanımı)
    2. BESİN TABLOSU: (Kalori, Protein, Karbonhidrat, Yağ, Şeker değerlerini liste şeklinde yaz)
    3. HEDEF ANALİZİ: (Kullanıcının hedefine göre bu besinin etkisi)
    4. UZMAN TAVSİYESİ: (Tüketim önerisi ve alternatif)

    NOT: Kişi analizi uyarısı yapma, doğrudan gıdaya odaklan.`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [{ role: "system", content: systemPrompt }, 
                           { role: "user", content: [{ type: "text", text: "Analiz et." }, { type: "image_url", image_url: { url: image } }] }],
                max_tokens: 800, temperature: 0.2
            })
        });
        const data = await response.json();
        res.status(200).json({ analysis: data.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ error: "Görsel işlenemedi." });
    }
}
