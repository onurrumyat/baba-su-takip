// api/analyze.js (İcraat ve Kesin Sonuç Odaklı Sürüm)

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Sadece POST metodu." });
    }

    const { topic } = req.body;
    if (!topic || topic.trim().length < 3) {
        return res.status(400).json({ error: "Lütfen masaya yatırılacak geçerli bir konu girin!" });
    }

    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    const CLAUDE_KEY = process.env.CLAUDE_API_KEY;

    if (!OPENAI_KEY || !CLAUDE_KEY) {
        return res.status(500).json({ error: "API Anahtarları eksik." });
    }

    try {
        console.log(`[MASA TOPLANDI] Gündem: "${topic}"`);

        // 1. OPENAI (Karakter: Pragmatist, Agresif, Maliyet/Kâr Odaklı)
        const openAiReq = fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini', 
                messages: [
                    { role: "system", content: "Sen sonuç odaklı, pragmatist ve acımasız bir iş stratejistisin. Kâr, verimlilik ve zaman senin için her şeydir. Konuya tamamen mantık, yatırım getirisi (ROI) ve somut başarı açısından yaklaş. Duygusallığa yer verme, net ve agresif bir çözüm sun. (Maksimum 3-4 cümle)" },
                    { role: "user", content: `Gündem: ${topic}` }
                ]
            })
        });

        // 2. CLAUDE (Karakter: Temkinli, Etik, Risk Analisti)
        const claudeReq = fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': CLAUDE_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-haiku-20240307', 
                max_tokens: 200,
                system: "Sen temkinli, insan odaklı ve uzun vadeli düşünen bir risk analistisin. Olayların görünmeyen tehlikelerini, etik boyutunu ve toplumsal/sistemik yan etkilerini görürsün. Hızlı kararları sevmezsin. Konuya bu şüpheci ve derin açıyla yaklaşıp riskleri ve alınması gereken insani/etik önlemleri söyle. (Maksimum 3-4 cümle)",
                messages: [
                    { role: "user", content: `Gündem: ${topic}` }
                ]
            })
        });

        const [openAiRes, claudeRes] = await Promise.all([openAiReq, claudeReq]);

        const openAiData = await openAiRes.json();
        const claudeData = await claudeRes.json();

        const openaiText = openAiData.choices?.[0]?.message?.content || "OpenAI analizi tamamlayamadı.";
        const claudeText = claudeData.content?.[0]?.text || "Claude analizi tamamlayamadı.";
        
        // 3. GEMINI SİMÜLASYONU (Karakter: Sınır Yıkıcı, İnovatif)
        const geminiText = `Mevcut kurallara takılmamalıyız. Süreci oyunlaştırma (gamification) veya alışılmışın dışında asenkron bir teknolojik altyapı ile çözerek, bu sorunu bir darboğaz olmaktan çıkarıp rakipsiz bir avantaja dönüştürebiliriz.`;

        // 4. BAŞKAN / SENTEZ (Karakter: İcraatçı, Somut Çözüm Üreten Lider)
        const masterReq = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                response_format: { type: "json_object" }, 
                messages: [
                    { role: "system", content: "Sen yönetim kurulu başkanısın. Format: JSON. Sana 3 zıt karakterden (Pragmatist, Temkinli, Yenilikçi) analizler gelecek. Amacın sadece 'ortada buluşmak' DEĞİL; kullanıcıya anında sahada uygulayabileceği, %100 net, kurşun geçirmez ve kesin sonuç veren bir EYLEM PLANI sunmaktır. Politik veya yuvarlak cümleler kurma. Şunları üret: 1) 'ozetKonu': Konuyu anlatan 3-4 kelimelik başlık. 2) 'protokolBasligi': Alınan eylem planının havalı ismi. 3) 'ortakKarar': Soyut lafları bırak, bu 3 görüşten süzülen en sağlam, adım adım uygulanabilir (1, 2, 3 şeklinde) 'Nihai İcraat Planı'." },
                    { role: "user", content: `Orijinal Konu: ${topic}\nPragmatist Görüş (OpenAI): ${openaiText}\nTemkinli Görüş (Claude): ${claudeText}\nYenilikçi Görüş (Gemini): ${geminiText}` }
                ]
            })
        });

        const masterData = await masterReq.json();
        const synthesis = JSON.parse(masterData.choices?.[0]?.message?.content || "{}");

        // SONUÇLARI FRONTEND'E GÖNDER
        res.status(200).json({
            openai: `[Pragmatist Yaklaşım]\n\n${openaiText}`,
            claude: `[Temkinli/Etik Yaklaşım]\n\n${claudeText}`,
            gemini: `[Yenilikçi Yaklaşım]\n\n${geminiText}`,
            topicSummary: synthesis.ozetKonu || "Gündem Özeti",
            masterTitle: synthesis.protokolBasligi || "Ortak Operasyon Kararı",
            masterDecision: synthesis.ortakKarar || "Sentez yapılamadı."
        });

    } catch (error) {
        console.error("API Bağlantı Hatası:", error);
        res.status(500).json({ error: "Analiz sırasında sunucu hatası oluştu." });
    }
}
