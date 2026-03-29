export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: "Sadece POST." });

    const { topic, revisionNote, fileText, isCrisis } = req.body;
    if (!topic || topic.trim().length < 3) return res.status(400).json({ error: "Geçerli konu girin." });

    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    const CLAUDE_KEY = process.env.CLAUDE_API_KEY;

    if (!OPENAI_KEY || !CLAUDE_KEY) return res.status(500).json({ error: "API Anahtarları eksik." });

    try {
        let crisisCommand = isCrisis ? "DİKKAT: KRİZ MODU! Kurumsal dili bırak. Kanamayı anında durduracak, hızlı uygulanabilir acil durum taktikleri ver." : "";

        let finalContext = `Gündem: ${topic}\n${crisisCommand}`;
        if (fileText) finalContext += `\n\nMASAYA KONAN DOSYA:\n${fileText.substring(0, 3000)}`;
        if (revisionNote) finalContext += `\n\nREVİZYON EMRİ:\n"Planı şuna göre baştan yap: ${revisionNote}"`;

        // 1. OPENAI (Mantık ve Verimlilik)
        const openAiReq = fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
            body: JSON.stringify({
                model: 'gpt-4o-mini', 
                messages: [
                    { role: "system", content: "Sen OpenAI'sın. Konuya yapısal bütünlük, verimlilik ve mantık açısından yaklaş. Rol yapma, doğrudan konuyu çözmek için 3 net, pratik taktik ver. Madde işareti (-) kullan." },
                    { role: "user", content: finalContext }
                ]
            })
        });

        // 2. CLAUDE (Risk ve Güvenlik)
        const claudeReq = fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_KEY, 'anthropic-version': '2023-06-01' },
            body: JSON.stringify({
                model: 'claude-3-haiku-20240307', 
                max_tokens: 300,
                system: "Sen Claude'sun. Konuya risk analizi, güvenlik, etik ve uzun vadeli sürdürülebilirlik açısından yaklaş. Görünmeyen tehlikeleri engellemek için 3 koruyucu önlem üret. Madde işareti (-) kullan.",
                messages: [{ role: "user", content: finalContext }]
            })
        });

        const [openAiRes, claudeRes] = await Promise.all([openAiReq, claudeReq]);
        const openAiData = await openAiRes.json();
        const claudeData = await claudeRes.json();

        const openaiText = openAiData.choices?.[0]?.message?.content || "Analiz yapılamadı.";
        const claudeText = claudeData.content?.[0]?.text || "Analiz yapılamadı.";
        
        // 3. GEMINI SİMÜLASYONU (İnovasyon ve Hız)
        const geminiText = `- Alışılmış yöntemleri bırakıp süreci asenkron ve dijital bir modele taşı.\n- İnsan hatalarını en aza indirmek için otomasyonu devreye sok.\n- Süreci hızlandırmak için yenilikçi bir teknoloji entegrasyonu sağla.`;

        // 4. BAŞKAN / SENTEZ (Gerçek Sentez ve Şık Sunum Üretimi)
        const masterReq = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                response_format: { type: "json_object" }, 
                messages: [
                    { role: "system", content: `Sen yönetim kurulu başkanısın. Format: JSON. Şunları üret: 
                    1) 'ozetKonu': Vurucu 3-4 kelimelik özet. 
                    2) 'protokolBasligi': Kararın net ismi. 
                    3) 'munazara': OpenAI, Claude ve Gemini'nin 3 satırlık kısa tartışması. 
                    4) 'ortakKarar': Sadece fikirleri alt alta sıralama. Bu 3 farklı görüşü GERÇEKTEN harmanla, çelişkileri çöz ve ortaya mantıklı, entegre edilmiş 3-4 maddelik Kesin Aksiyon Planı çıkar.
                    5) 'verimlilikSkoru': 1 ile 100 arası başarı ihtimali sayısı.
                    6) 'sunumSlaytlari': 4 elemanlı dizi (Array). Slayt 1: Kök Sorun, Slayt 2: Stratejik Yaklaşım, Slayt 3: Uygulama Adımları, Slayt 4: Beklenen Sonuç. Slayt içerikleri çok profesyonel, temiz ve açıklayıcı olsun.` },
                    { role: "user", content: `${finalContext}\n\nOpenAI (Mantık): ${openaiText}\nClaude (Risk): ${claudeText}\nGemini (İnovasyon): ${geminiText}` }
                ]
            })
        });

        const masterData = await masterReq.json();
        const synthesis = JSON.parse(masterData.choices?.[0]?.message?.content || "{}");

        res.status(200).json({
            openai: openaiText,
            claude: claudeText,
            gemini: geminiText,
            topicSummary: synthesis.ozetKonu || "Gündem Özeti",
            masterTitle: synthesis.protokolBasligi || "Ortak Aksiyon Planı",
            debate: synthesis.munazara || "Münazara yapılamadı.",
            masterDecision: synthesis.ortakKarar || "Aksiyon planı çıkarılamadı.",
            score: synthesis.verimlilikSkoru || "85",
            slides: synthesis.sunumSlaytlari || ["Sorun tespiti", "Yaklaşım", "Uygulama", "Sonuç"]
        });

    } catch (error) {
        console.error("API Hatası:", error);
        res.status(500).json({ error: "Sunucu hatası oluştu." });
    }
}
