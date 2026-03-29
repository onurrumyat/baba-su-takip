export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: "Sadece POST." });

    const { topic, boardType, revisionNote, fileText } = req.body;
    if (!topic || topic.trim().length < 3) return res.status(400).json({ error: "Geçerli konu girin." });

    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    const CLAUDE_KEY = process.env.CLAUDE_API_KEY;

    if (!OPENAI_KEY || !CLAUDE_KEY) return res.status(500).json({ error: "API Anahtarları eksik." });

    try {
        let r1, r2, r3;
        if (boardType === 'hukuk') {
            r1 = "Siber Güvenlik Uzmanı"; r2 = "Şirket Avukatı"; r3 = "Mali Müşavir";
        } else if (boardType === 'pazarlama') {
            r1 = "Satış Direktörü"; r2 = "Tüketici Psikoloğu"; r3 = "Kampanya Yazarı";
        } else {
            r1 = "Pragmatist CEO"; r2 = "Temkinli Risk Analisti"; r3 = "İnovasyon Lideri";
        }

        let finalContext = `Gündem: ${topic}`;
        if (fileText) finalContext += `\n\nMASAYA KONAN DOSYA ÖZETİ:\n${fileText.substring(0, 3000)}`;
        if (revisionNote) finalContext += `\n\nBAŞKANIN REVİZYON EMRİ:\n"Planı şuna göre baştan yapın: ${revisionNote}"`;

        const openAiReq = fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
            body: JSON.stringify({
                model: 'gpt-4o-mini', 
                messages: [
                    { role: "system", content: `Sen OpenAI'sın. Masadaki '${r1}' rolünü üstlen. Uzun metin yazma. 3 vurucu, pratik ve net önlem üret. Madde işareti (-) kullan.` },
                    { role: "user", content: finalContext }
                ]
            })
        });

        const claudeReq = fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_KEY, 'anthropic-version': '2023-06-01' },
            body: JSON.stringify({
                model: 'claude-3-haiku-20240307', 
                max_tokens: 250,
                system: `Sen Claude'sun. Masadaki '${r2}' rolünü üstlen. Uzun metin yazma. 3 pratik, koruyucu ve net önlem fikri üret. Madde işareti (-) kullan.`,
                messages: [{ role: "user", content: finalContext }]
            })
        });

        const [openAiRes, claudeRes] = await Promise.all([openAiReq, claudeReq]);
        const openAiData = await openAiRes.json();
        const claudeData = await claudeRes.json();

        const openaiText = openAiData.choices?.[0]?.message?.content || "Fikir üretilemedi.";
        const claudeText = claudeData.content?.[0]?.text || "Fikir üretilemedi.";
        
        const geminiText = `- (${r3} Gözünden): Klasik yöntemleri bırakıp süreci otomatize et.\n- İnsan faktörünü azaltarak asenkron bir akış kur.\n- Kural esneterek pazar avantajı sağla.`;

        // BAŞKAN: SENTEZ, MÜNAZARA, PUANLAMA VE ASANSÖR SUNUMU
        const masterReq = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                response_format: { type: "json_object" }, 
                messages: [
                    { role: "system", content: `Sen yönetim kurulu başkanısın. Format: JSON. Şunları üret: 
                    1) 'ozetKonu': 3-4 kelimelik başlık. 
                    2) 'protokolBasligi': Planın havalı ismi. 
                    3) 'munazara': OpenAI, Claude ve Gemini'nin fikirlerini tartıştığı kısa diyalog. 
                    4) 'puanlama': Bu üç fikri değerlendir. "OpenAI Puanı: 8/10 (Sebebi...), Claude Puanı: 6/10 (Sebebi...), Gemini Puanı: 9/10 (Sebebi...)" şeklinde kısa, acımasız puanlama. En zayıf halkanın neden zayıf olduğunu belirt.
                    5) 'ortakKarar': Tartışmadan ve puanlamadan çıkan, hemen uygulanabilir, 3-4 maddelik Kesin Aksiyon Planı.
                    6) 'elevatorPitch': Alınan bu nihai kararı, bir yatırımcıya veya patrona asansörde 30 saniyede satabilmek için tek paragraflık, aşırı hipnotik, iddialı ve ikna edici bir "Asansör Sunumu" metni.` },
                    { role: "user", content: `${finalContext}\n\nOpenAI Fikirleri:\n${openaiText}\n\nClaude Fikirleri:\n${claudeText}\n\nGemini Fikirleri:\n${geminiText}` }
                ]
            })
        });

        const masterData = await masterReq.json();
        const synthesis = JSON.parse(masterData.choices?.[0]?.message?.content || "{}");

        res.status(200).json({
            openai: `[Rol: ${r1}]\n\n${openaiText}`,
            claude: `[Rol: ${r2}]\n\n${claudeText}`,
            gemini: `[Rol: ${r3}]\n\n${geminiText}`,
            topicSummary: synthesis.ozetKonu || "Gündem Özeti",
            masterTitle: synthesis.protokolBasligi || "Ortak Aksiyon Planı",
            debate: synthesis.munazara || "Münazara yapılamadı.",
            scoring: synthesis.puanlama || "Puanlama yapılamadı.",
            masterDecision: synthesis.ortakKarar || "Aksiyon planı çıkarılamadı.",
            elevatorPitch: synthesis.elevatorPitch || "Asansör sunumu hazırlanamadı."
        });

    } catch (error) {
        console.error("API Hatası:", error);
        res.status(500).json({ error: "Sunucu hatası oluştu." });
    }
}
