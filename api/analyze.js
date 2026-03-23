// api/analyze.js
const ALLOWED_MODES = ['yemek', 'spor', 'lara'];

const buildPrompt = (mode, user_data, lang) => {
    const langRule = lang === 'en' ? 'RESPONSE LANGUAGE: ENGLISH ONLY.' : 'YANIT DİLİ: YALNIZCA TÜRKÇE.';

    if (mode === 'spor') {
        return {
            system: `Sen profesyonel bir fitness koçusun. Kullanıcı verileri: ${user_data}.
            KURALLAR:
            - Kullanıcı haftada kaç gün seçtiyse SADECE o kadar gün için program yaz.
            - Programın en sonuna "TOPLAM TAHMİNİ KALORİ: XXX kcal" yaz.
            - Şablon estetik, profesyonel ve kısa olsun.
            ${langRule}`,
            user: "Bana uygun spor programını oluştur.",
        };
    }

    if (mode === 'lara') {
        return {
            system: `Senin adın Lara. YZ Diyetisyensin. 
            KURAL: Çok kısa, net ve can alıcı cevaplar ver. Uzun cümlelerden kaçın.
            Sadece diyet, spor ve yemek konularına cevap ver.
            ${langRule}`,
            user: user_data,
        };
    }

    return {
        system: `Sen gıda bilimcisisin. Kullanıcı: ${user_data}. 6 bölümlük formatı uygula. ${langRule}`,
        user: [
            { type: 'text', text: 'Gıdayı analiz et.' },
            { type: 'image_url', image_url: { url: '{IMAGE}', detail: 'low' } }
        ],
    };
};

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send();
    const { image, user_data, mode, lang = 'tr' } = req.body ?? {};
    if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: 'Key eksik.' });

    const prompt = buildPrompt(mode, user_data, lang);
    const userContent = mode === 'yemek' ? prompt.user.map(b => b.type === 'image_url' ? { ...b, image_url: { ...b.image_url, url: image } } : b) : prompt.user;

    try {
        const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'gpt-4o', max_tokens: 1000, temperature: 0.3, messages: [{ role: 'system', content: prompt.system }, { role: 'user', content: userContent }] })
        });
        const data = await openaiRes.json();
        return res.status(200).json({ analysis: data?.choices?.[0]?.message?.content?.trim() });
    } catch (err) { return res.status(500).json({ error: 'Sistem hatası.' }); }
}
