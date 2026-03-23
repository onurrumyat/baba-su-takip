// api/analyze.js
// Bio-Chef Pro — AI Analysis Endpoint
// ─────────────────────────────────────────────────────────

const ALLOWED_MODES = ['yemek', 'spor', 'lara'];

const buildPrompt = (mode, user_data, lang) => {
    const langRule = lang === 'en' 
        ? 'RESPONSE LANGUAGE: ENGLISH ONLY.' 
        : 'YANIT DİLİ: YALNIZCA TÜRKÇE.';

    if (mode === 'spor') {
        return {
            system: `Sen profesyonel bir fitness koçusun. 
            Kullanıcı profili: ${user_data}. 
            KURALLAR:
            - Kullanıcı haftada kaç gün seçtiyse (örn: 4 gün) SADECE o kadar gün için program yaz.
            - Her gün için hareket, set ve tekrar ver.
            - Programın en sonuna "BU HAFTA TAHMİNİ YAKILACAK KALORİ: XXX kcal" şeklinde bir hesaplama ekle.
            - Format çok düzenli ve estetik olsun.
            ${langRule}`,
            user: "Bana özel spor programımı hazırla.",
        };
    }

    if (mode === 'lara') {
        return {
            system: `Senin adın Lara. Bir yapay zeka diyetisyenisin.
            KURALLAR:
            - Cevapların can alıcı, çok kısa ve net olsun. Gereksiz uzun cümlelerden kaçın.
            - Sadece diyet, spor, besin değerleri ve yemek tarifleri hakkında konuş.
            - Bu konular dışındaki sorulara nazikçe reddederek sadece uzmanlık alanında cevap verebileceğini söyle.
            ${langRule}`,
            user: user_data,
        };
    }

    // Orijinal Yemek Analiz Modu
    return {
        system: `Sen kıdemli bir gıda bilimcisisin. Kullanıcı profili: ${user_data}.
        6 bölümlük formatı (Skor, Açlık, Özet, Besin, Hedef, Tavsiye) eksiksiz uygula.
        ${langRule}`,
        user: [
            { type: 'text', text: 'Görüntüdeki gıdayı analiz et.' },
            { type: 'image_url', image_url: { url: '{IMAGE}', detail: 'low' } },
        ],
    };
};

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { image, user_data, mode, lang = 'tr' } = req.body ?? {};

    if (!ALLOWED_MODES.includes(mode)) return res.status(400).json({ error: 'Geçersiz mod.' });
    if (!user_data) return res.status(400).json({ error: 'Veri eksik.' });

    try {
        const prompt = buildPrompt(mode, user_data, lang);
        const userContent = mode === 'yemek' 
            ? prompt.user.map(b => b.type === 'image_url' ? { ...b, image_url: { ...b.image_url, url: image } } : b)
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
                temperature: 0.4,
                messages: [
                    { role: 'system', content: prompt.system },
                    { role: 'user', content: userContent },
                ],
            }),
        });

        const data = await openaiRes.json();
        const analysis = data?.choices?.[0]?.message?.content?.trim();
        return res.status(200).json({ analysis });

    } catch (err) {
        return res.status(500).json({ error: 'Sistem hatası.' });
    }
}
