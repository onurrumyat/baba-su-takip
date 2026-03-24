// api/analyze.js
// Bio-Chef Pro — AI Analysis Endpoint (GPT-4o Integrated)
// ─────────────────────────────────────────────────────────

const ALLOWED_MODES = ['yemek', 'spor', 'lara'];

const buildPrompt = (mode, user_data, lang) => {
    const langRule = lang === 'en' 
        ? 'RESPONSE LANGUAGE: ENGLISH ONLY.' 
        : 'YANIT DİLİ: YALNIZCA TÜRKÇE.';

    // SPOR MODU
    if (mode === 'spor') {
        return {
            system: `Sen profesyonel bir fitness koçusun. 
            Kullanıcı verileri: ${user_data}. 
            KURALLAR:
            - Kullanıcı haftada kaç gün seçtiyse SADECE o kadar gün için program yaz.
            - Her gün için hareket, set ve tekrar ver.
            - Programın en sonuna "BU HAFTA TAHMİNİ YAKILACAK TOPLAM KALORİ: XXX kcal" yaz.
            - Format çok düzenli ve estetik olsun.
            ${langRule}`,
            user: "Bana özel spor programımı hazırlamanı istiyorum.",
        };
    }

    // LARA CHATBOT MODU
    if (mode === 'lara') {
        return {
            system: `Senin adın Lara. Sen Bio-Chef Pro sisteminin yapay zeka diyetisyenisin. 
            KURALLAR:
            - Cevapların can alıcı, çok kısa ve net olsun. Asla uzun cümleler kurma.
            - Sadece diyet, sağlıklı yemekler, besin değerleri ve spor konularında uzman bir asistan gibi davran. 
            - Kullanıcı bu konular dışında bir şey sorarsa kibarca reddet.
            ${langRule}`,
            user: user_data,
        };
    }

    // YEMEK ANALİZ MODU (İstediğin Özel Format)
    return {
        system: `Sen kıdemli bir gıda bilimcisi ve klinik diyetisyensin.
        Kullanıcı Hedefi: ${user_data}.

        KESİN KURALLAR:
        1. Görüntüdeki insanları ASLA tanımlama, onları tamamen yoksay. "İnsanları tanımlayamam" gibi bir cümle bile kurma.
        2. Analize DOĞRUDAN yemeğin adıyla başla.
        3. Eğer görselde gıda yoksa sadece "Üzgünüm, görselde gıda bulunamadı." yaz.
        4. BESİN DEĞERLERİ kısmında her madde arasında MUTLAKA bir boş satır bırak.

        FORMAT (Aşağıdaki 5 bölümü sırasıyla yaz):
        1. YEMEK ADI: (Sadece gıdanın tam adı, yorumsuz)
        2. BESİN DEĞERLERİ: 
           Kalori: XXX kcal
           
           Protein: XX gr
           
           Karbonhidrat: XX gr
           
           Yağ: XX gr
        3. NET TAVSİYE: (Kullanıcı hedefine göre can alıcı 1-2 cümlelik tavsiye)
        4. ÜRÜN ÖZETİ: (İçerik hakkında profesyonel kısa özet)
        5. SKOR: [SKOR: X] (X = 1-10 arası bir puan)

        ${langRule}`,
        user: [
            {
                type: 'text',
                text: 'Görüntüdeki gıdayı analiz et. İnsanları görmezden gel ve formatı eksiksiz uygula.',
            },
            {
                type: 'image_url',
                image_url: { url: '{IMAGE}', detail: 'low' },
            },
        ],
    };
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { image, user_data, mode, lang = 'tr' } = req.body ?? {};

    if (!ALLOWED_MODES.includes(mode)) {
        return res.status(400).json({ error: 'Geçersiz mod.' });
    }
    if (!user_data && mode !== 'lara') {
        return res.status(400).json({ error: 'Kullanıcı verisi eksik.' });
    }
    if (mode === 'yemek' && !image) {
        return res.status(400).json({ error: 'Görüntü eksik.' });
    }
    if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: 'Sunucu yapılandırma hatası.' });
    }

    try {
        const prompt = buildPrompt(mode, user_data, lang);

        // Görseli prompt içine yerleştirme
        const userContent = mode === 'yemek' 
            ? prompt.user.map(b => 
                b.type === 'image_url' 
                    ? { ...b, image_url: { ...b.image_url, url: image } } 
                    : b
              )
            : prompt.user;

        const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                max_tokens: 1000,
                temperature: 0.2, // Daha net ve yorumsuz sonuçlar için sıcaklık düşürüldü
                messages: [
                    { role: 'system', content: prompt.system },
                    { role: 'user', content: userContent },
                ],
            }),
        });

        const data = await openaiRes.json();
        const analysis = data?.choices?.[0]?.message?.content?.trim();

        if (!analysis) {
            return res.status(502).json({ error: 'Analiz sonucu alınamadı.' });
        }

        return res.status(200).json({ analysis });

    } catch (err) {
        console.error('[BioChef] Sistem hatası:', err);
        return res.status(500).json({ error: 'Sistem hatası.' });
    }
}
