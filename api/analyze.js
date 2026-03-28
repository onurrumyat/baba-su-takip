// api/analyze.js (Gerçek API Bağlantılı ve Şifreli Sürüm)

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Sadece POST metodu kabul edilir." });
    }

    const { topic } = req.body;
    if (!topic || topic.trim().length < 3) {
        return res.status(400).json({ error: "Lütfen masaya yatırılacak geçerli bir konu girin!" });
    }

    // VERCEL ÜZERİNDEN ÇEKECEĞİMİZ GİZLİ ŞİFRELER (SEMBOLLER)
    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    const CLAUDE_KEY = process.env.CLAUDE_API_KEY;

    if (!OPENAI_KEY || !CLAUDE_KEY) {
        return res.status(500).json({ error: "Sunucu Hatası: API Anahtarları Vercel'e eklenmemiş!" });
    }

    try {
        console.log(`[GERÇEK API] Analiz başlatılıyor: "${topic}"`);

        // 1. OPENAI (GPT) İSTEĞİ (Güvenlik ve Mimari Odaklı)
        const openAiReq = fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini', // Hızlı ve uygun maliyetli model
                messages: [
                    { role: "system", content: "Sen bir AI komuta merkezinde güvenlik ve mimari uzmanısın. Kısa, çok profesyonel ve sadece 2 cümlelik bir önlem/analiz raporu sun." },
                    { role: "user", content: `Gündem: ${topic}` }
                ]
            })
        });

        // 2. CLAUDE İSTEĞİ (Etik ve Gizlilik Odaklı)
        const claudeReq = fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': CLAUDE_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-haiku-20240307', // Hızlı Claude modeli
                max_tokens: 150,
                system: "Sen bir AI komuta merkezinde etik, toplum ve gizlilik uzmanısın. Kısa, çok profesyonel ve sadece 2 cümlelik bir analiz raporu sun.",
                messages: [
                    { role: "user", content: `Gündem: ${topic}` }
                ]
            })
        });

        // İki gerçek API'nin cevap vermesini aynı anda bekle (Hız kazandırır)
        const [openAiRes, claudeRes] = await Promise.all([openAiReq, claudeReq]);

        const openAiData = await openAiRes.json();
        const claudeData = await claudeRes.json();

        // Yanıtları Değişkenlere Al
        const openaiText = openAiData.choices?.[0]?.message?.content || "OpenAI yanıt veremedi.";
        const claudeText = claudeData.content?.[0]?.text || "Claude yanıt veremedi.";
        
        // 3. GEMINI SİMÜLASYONU (Anahtarın olmadığı için akıllı mock kullanıyoruz)
        const geminiText = `Kullanıcı deneyimi pürüzsüz olmalı. Veri işleme süreçlerini asenkron (asynchronous) hale getirip, önbellekleme (caching) ile milisaniye bazında yanıt süreleri hedeflemeliyiz.`;

        // 4. ORTAK KARAR SENTEZİ (Bunu OpenAI'a yaptırıyoruz)
        const masterReq = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: "system", content: "Sen komuta merkezi başkanısın. Sana 3 farklı AI'ın raporu verilecek. Bunları birleştirip 3 maddelik bir strateji ve en üste 3-4 kelimelik havalı bir 'Protokol Başlığı' yaz. Yanıtı doğrudan ver, giriş cümlesi kullanma." },
                    { role: "user", content: `Konu: ${topic}\nOpenAI: ${openaiText}\nClaude: ${claudeText}\nGemini: ${geminiText}` }
                ]
            })
        });

        const masterData = await masterReq.json();
        const masterFullText = masterData.choices?.[0]?.message?.content || "Sentez yapılamadı.";
        
        // Başlığı ve içeriği basitçe ayırıyoruz (İlk satır başlık, gerisi içerik)
        const parts = masterFullText.split('\n');
        const masterTitle = parts[0].replace(/["*]/g, ''); // Temiz başlık
        const masterDecision = parts.slice(1).join('\n').trim();

        // SONUÇLARI FRONTEND'E GÖNDER
        res.status(200).json({
            openai: `[Sistem Mimarisi Raporu]\n\n${openaiText}`,
            claude: `[Etik & Gizlilik Raporu]\n\n${claudeText}`,
            gemini: `[UX & Performans Raporu]\n\n${geminiText}`,
            masterTitle: masterTitle,
            masterDecision: masterDecision
        });

    } catch (error) {
        console.error("Gerçek API Bağlantı Hatası:", error);
        res.status(500).json({ error: "API sunucularıyla iletişim kurulamadı." });
    }
}
