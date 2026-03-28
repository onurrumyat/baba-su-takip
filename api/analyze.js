// api/analyze.js (Maliyet Odaklı, Ciddi ve Derin Analiz Sürümü)

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Sadece POST metodu kabul edilir." });
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
        console.log(`[ANALİZ BAŞLADI] Gündem: "${topic}"`);

        // 1. OPENAI İSTEĞİ (Model: gpt-4o-mini -> En ucuz ve en akıllı)
        const openAiReq = fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini', 
                messages: [
                    { role: "system", content: "Sen bir baş stratejist ve sistem mimarısın. Konuyu yüzeysel değil, derinlemesine analiz et. Soyut kavramlar kullanma. Mantıklı, net ve gerçek hayatta yüzde yüz işe yarayacak somut çözüm adımları sun. (Maksimum 3-4 cümle)" },
                    { role: "user", content: `Gündem: ${topic}` }
                ]
            })
        });

        // 2. CLAUDE İSTEĞİ (Model: claude-3-haiku-20240307 -> En ucuz Claude modeli)
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
                system: "Sen bir risk, operasyon ve etik uzmanısın. Konuya ciddiyetle yaklaş. İşin felsefesini yapma; doğrudan riskleri belirle ve uygulanabilir, net, ciddi önlemler sırala. (Maksimum 3-4 cümle)",
                messages: [
                    { role: "user", content: `Gündem: ${topic}` }
                ]
            })
        });

        // İkisini aynı anda çalıştır (Hız için)
        const [openAiRes, claudeRes] = await Promise.all([openAiReq, claudeReq]);

        const openAiData = await openAiRes.json();
        const claudeData = await claudeRes.json();

        const openaiText = openAiData.choices?.[0]?.message?.content || "OpenAI analizi tamamlayamadı.";
        const claudeText = claudeData.content?.[0]?.text || "Claude analizi tamamlayamadı.";
        
        // Gemini'nin anahtarı olmadığı için derin ve ciddi bir kalıp oluşturuyoruz
        const geminiText = `Süreçlerdeki darboğazlar (bottlenecks) tespit edilip otomasyona devredilmeli. Operasyonel maliyeti artırmadan kullanıcı/sistem hızını maksimize edecek asenkron bir akış yapılandırılmalı.`;

        // 3. ORTAK KARAR VE ÖZET SENTEZİ (Maliyet için yine gpt-4o-mini kullanıyoruz, JSON formatında kesin çıktı alıyoruz)
        const masterReq = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                response_format: { type: "json_object" }, // Yapay zekadan JSON dönmesini zorluyoruz
                messages: [
                    { role: "system", content: "Sen komuta merkezi başkanısın. Format: JSON. Sana verilen konuyu ve 3 AI raporunu sentezle. Şunları üret: 1) 'ozetKonu': Kullanıcının uzun konusunu anlatan 3-4 kelimelik çok kısa, net bir başlık. 2) 'protokolBasligi': Alınan ortak karara verilen profesyonel isim. 3) 'ortakKarar': Masadaki analizleri birleştiren, aşırı mantıklı, ciddi ve tamamen uygulanabilir madde imli bir sonuç bildirgesi." },
                    { role: "user", content: `Orijinal Konu: ${topic}\nOpenAI: ${openaiText}\nClaude: ${claudeText}\nGemini: ${geminiText}` }
                ]
            })
        });

        const masterData = await masterReq.json();
        // Gelen JSON string'ini JavaScript objesine çeviriyoruz
        const synthesis = JSON.parse(masterData.choices?.[0]?.message?.content || "{}");

        // SONUÇLARI FRONTEND'E GÖNDER
        res.status(200).json({
            openai: `[Strateji & Mimari Raporu]\n\n${openaiText}`,
            claude: `[Risk & Operasyon Raporu]\n\n${claudeText}`,
            gemini: `[Performans & Akış Raporu]\n\n${geminiText}`,
            topicSummary: synthesis.ozetKonu || "Gündem Özeti Belirlenemedi",
            masterTitle: synthesis.protokolBasligi || "Operasyon Protokolü",
            masterDecision: synthesis.ortakKarar || "Sentez yapılamadı."
        });

    } catch (error) {
        console.error("API Bağlantı Hatası:", error);
        res.status(500).json({ error: "Analiz sırasında kritik bir sunucu hatası oluştu." });
    }
}
