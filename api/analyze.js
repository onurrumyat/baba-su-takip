// api/analyze.js (Fikir Üreten, Madde İmli ve Pratik Sürüm)

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: "Sadece POST." });

    const { topic } = req.body;
    if (!topic || topic.trim().length < 3) return res.status(400).json({ error: "Geçerli konu girin." });

    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    const CLAUDE_KEY = process.env.CLAUDE_API_KEY;

    if (!OPENAI_KEY || !CLAUDE_KEY) return res.status(500).json({ error: "API Anahtarları eksik." });

    try {
        // 1. OPENAI (Agresif, Pratik, Maddeler Halinde)
        const openAiReq = fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
            body: JSON.stringify({
                model: 'gpt-4o-mini', 
                messages: [
                    { role: "system", content: "Sen sonuç odaklı bir iş insanısın. ASLA uzun paragraf veya metin yazma. Doğrudan konuya gir ve sorunu çözecek 3 adet vurucu, pratik ve net fikir üret. Her birini madde işareti (-) ile yaz." },
                    { role: "user", content: `Konu: ${topic}` }
                ]
            })
        });

        // 2. CLAUDE (Temkinli, Risk Çözen, Maddeler Halinde)
        const claudeReq = fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_KEY, 'anthropic-version': '2023-06-01' },
            body: JSON.stringify({
                model: 'claude-3-haiku-20240307', 
                max_tokens: 200,
                system: "Sen bir risk ve sistem uzmanısın. ASLA uzun metinler yazma. Sadece konudaki tehlikeleri önleyecek 3 pratik ve net önlem fikri üret. Kesinlikle madde işareti (-) kullan.",
                messages: [
                    { role: "user", content: `Konu: ${topic}` }
                ]
            })
        });

        const [openAiRes, claudeRes] = await Promise.all([openAiReq, claudeReq]);

        const openAiData = await openAiRes.json();
        const claudeData = await claudeRes.json();

        const openaiText = openAiData.choices?.[0]?.message?.content || "Fikir üretilemedi.";
        const claudeText = claudeData.content?.[0]?.text || "Fikir üretilemedi.";
        
        // 3. GEMINI SİMÜLASYONU (Pratik, oyunlaştırılmış maddeler)
        const geminiText = `- İşi sıradanlıktan çıkarıp oyunlaştırma (gamification) ekle.\n- Zaman kaybını önlemek için asenkron bir onay mekanizması kur.\n- Eski kuralları esneterek süreci 2 kat hızlandır.`;

        // 4. BAŞKAN / SENTEZ (Sadece Eylem Planı)
        const masterReq = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                response_format: { type: "json_object" }, 
                messages: [
                    { role: "system", content: "Sen başkansın. Format: JSON. Sana 3 farklı pratik fikir listesi gelecek. Uzun paragraf ve felsefe YAPMA. Şunları üret: 1) 'ozetKonu': 3-4 kelimelik başlık. 2) 'protokolBasligi': Eylem planının havalı ismi. 3) 'ortakKarar': Gelen fikirleri süz, hemen uygulanabilir, aşırı net, sadece 3-4 maddeden oluşan kısa bir 'Aksiyon Planı' listesi ver." },
                    { role: "user", content: `Konu: ${topic}\nOpenAI Fikirleri: ${openaiText}\nClaude Fikirleri: ${claudeText}\nGemini Fikirleri: ${geminiText}` }
                ]
            })
        });

        const masterData = await masterReq.json();
        const synthesis = JSON.parse(masterData.choices?.[0]?.message?.content || "{}");

        res.status(200).json({
            openai: `[Pragmatist Fikirler]\n\n${openaiText}`,
            claude: `[Temkinli Fikirler]\n\n${claudeText}`,
            gemini: `[Yenilikçi Fikirler]\n\n${geminiText}`,
            topicSummary: synthesis.ozetKonu || "Gündem Özeti",
            masterTitle: synthesis.protokolBasligi || "Ortak Aksiyon Planı",
            masterDecision: synthesis.ortakKarar || "Aksiyon planı çıkarılamadı."
        });

    } catch (error) {
        console.error("API Bağlantı Hatası:", error);
        res.status(500).json({ error: "Analiz sırasında sunucu hatası oluştu." });
    }
}
