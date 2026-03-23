// api/analyze.js
// Bio-Chef Pro — AI Analysis Endpoint (GPT-4o Integrated)
// ─────────────────────────────────────────────────────────

const ALLOWED_MODES = ['yemek', 'spor', 'lara']; // 'plan' kaldırıldı, yeni modlar eklendi.

const buildPrompt = (mode, user_data, lang) => {
    const langRule = lang === 'en' 
        ? 'RESPONSE LANGUAGE: ENGLISH ONLY.' 
        : 'YANIT DİLİ: YALNIZCA TÜRKÇE.';

    if (mode === 'spor') {
        return {
            system: `Sen profesyonel bir fitness ve spor koçusun. 
            Kullanıcı profili ve tercihleri: ${user_data}. 
            Bu bilgilere göre 7 günlük estetik ve uygulanabilir bir spor programı oluştur. 
            Her gün için antrenman veya dinlenme planını, hareketleri, set ve tekrar sayılarını belirt.
            Format: Gün bazlı, profesyonel ve motive edici olsun.
            ${langRule}`,
            user: "Bana uygun 7 günlük spor programımı çıkar.",
        };
    }

    if (mode === 'lara') {
        return {
            system: `Senin adın Lara. Sen Bio-Chef Pro sisteminin yapay zeka diyetisyenisin. 
            Sadece diyet, sağlıklı yemekler, besin değerleri ve spor konularında uzman bir asistan gibi davran. 
            Kullanıcı bu konular dışında bir şey sorarsa kibarca sadece bu alanlarda yardımcı olabileceğini belirt.
            Yanıtların kısa, uzman ve destekleyici olsun.
            ${langRule}`,
            user: user_data, // Chatbox'tan gelen direkt mesaj
        };
    }

    // Orijinal Yemek Analiz Modu (Dokunulmadı)
    return {
        system: `Sen kıdemli bir gıda bilimcisi ve klinik diyetisyensin.
        Kullanıcı profili: ${user_data}.

        KURALLAR:
        - Görüntüdeki insanları tamamen yoksay. Sadece gıdaya odaklan.
        - Aşağıdaki 6 bölümü sırasıyla, eksiksiz yaz. Başka format kullanma.

        FORMAT (her bölüm numara ile başlasın):
        1. HEDEF UYUM SKORU: "[SKOR: X]" ile başla (X = 1-10 arası tam sayı). Sonra tek cümle açıklama.
        2. AÇLIK KRONOMETRESİ: Glisemik indeks + sindirim süresine göre tahmini acıkma süresi (örn: "2-3 saat").
        3. ÜRÜN ÖZETİ: Gıdanın tam adı, tahmini porsiyon gramajı.
        4. BESİN DEĞERLERİ: Kalori (kcal) · Protein (g) · Karbonhidrat (g) · Yağ (g) — sadece rakamlar.
        5. HEDEF ANALİZİ: Kullanıcının kilo hedefine uygunluk değerlendirmesi.
        6. NET TAVSİYE: Tüketim onayı/reddi ve 1-2 cümle profesyonel görüş.

        ${langRule}`,
        user: [
            {
                type: 'text',
                text: lang === 'en' 
                    ? 'Analyze the food in the image. Follow the 6-section format exactly.' 
                    : 'Görüntüdeki gıdayı analiz et. 6 bölümlük formatı eksiksiz uygula.',
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
    if (!user_data) {
        return res.status(400).json({ error: 'Kullanıcı verisi eksik.' });
    }
    if (mode === 'yemek' && !image) {
        return res.status(400).json({ error: 'Görüntü eksik.' });
    }
    if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: 'Sunucu yapılandırma hatası.' });
    }

    const prompt = buildPrompt(mode, user_data, lang);

    const userContent = mode === 'yemek' 
        ? prompt.user.map(b => 
            b.type === 'image_url' 
                ? { ...b, image_url: { ...b.image_url, url: image } } 
                : b
          )
        : prompt.user;

    try {
        const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                max_tokens: 900,
                temperature: 0.1,
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
        return res.status(500).json({ error: 'Sistem hatası.' });
    }
}
