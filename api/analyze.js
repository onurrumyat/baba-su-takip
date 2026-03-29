export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: "Sadece POST." });

    const { topic, revisionNote, fileText, isCrisis, isNight, isLiveDebate, history } = req.body;
    if (!topic || topic.trim().length < 2) return res.status(400).json({ error: "Geçerli konu girin." });

    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    const CLAUDE_KEY = process.env.CLAUDE_API_KEY;

    if (!OPENAI_KEY || !CLAUDE_KEY) return res.status(500).json({ error: "API Anahtarları eksik." });

    try {
        // --- CANLI SESLİ MÜZAKERE MODU (LIVE DEBATE) ---
        if (isLiveDebate) {
            let chatHistory = history ? history.map(h => `${h.role}: ${h.text}`).join('\n') : "";
            
            const debateReq = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    response_format: { type: "json_object" },
                    messages: [
                        { role: "system", content: `Sen sırasıyla OpenAI, Claude ve Gemini modellerini simüle eden bir sistemsin. Kullanıcının (Başkan) söylediği konuya bu 3 farklı yapay zekanın kendi aralarında sesli tartışıyormuş gibi kısa (1-2 cümle), net ve zekice cevaplar vermesini sağla. Asla rol yapma (insan, ceo vs. gibi davranma). Sadece yapay zeka adlarını kullan. JSON formatında dön: { "dialogue": [ {"speaker": "openai", "text": "..."}, {"speaker": "claude", "text": "..."}, {"speaker": "gemini", "text": "..."} ] }` },
                        { role: "user", content: `GEÇMİŞ:\n${chatHistory}\n\nBAŞKAN (KULLANICI) ŞUNU SÖYLEDİ: "${topic}"\nHaydi, aranızda tartışarak cevap verin.` }
                    ]
                })
            });

            const debateData = await debateReq.json();
            const parsedDebate = JSON.parse(debateData.choices?.[0]?.message?.content || '{"dialogue":[]}');
            return res.status(200).json({ liveDialogue: parsedDebate.dialogue });
        }

        // --- STANDART KURUL MODU ---
        let toneCommand = "";
        if (isCrisis) toneCommand = "DİKKAT: DEFCON 1 KRİZ MODU! Kanamayı anında durduracak acil durum taktikleri ver.";
        else if (isNight) toneCommand = "Gece mesaisindeyiz. Dışarıda yağmur yağıyor. Stratejik ve sakin bir ton kullan.";

        let finalContext = `Gündem: ${topic}\n${toneCommand}`;
        if (fileText) finalContext += `\n\nMASAYA KONAN DOSYA:\n${fileText.substring(0, 3000)}`;
        if (revisionNote) finalContext += `\n\nREVİZYON EMRİ:\n"Planı baştan yap: ${revisionNote}"`;

        const openAiReq = fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
            body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: "system", content: `Sen OpenAI'sın. Çözüm odaklı 3 spesifik, vurucu taktik ver. Madde işareti (-) kullan.` }, { role: "user", content: finalContext }]})
        });

        const claudeReq = fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_KEY, 'anthropic-version': '2023-06-01' },
            body: JSON.stringify({ model: 'claude-3-haiku-20240307', max_tokens: 300, system: `Sen Claude'sun. Plandaki riskleri bulup net, nokta atışı 3 koruyucu önlem üret. Madde işareti (-) kullan.`, messages: [{ role: "user", content: finalContext }]})
        });

        const [openAiRes, claudeRes] = await Promise.all([openAiReq, claudeReq]);
        const openAiData = await openAiRes.json();
        const claudeData = await claudeRes.json();

        const openaiText = openAiData.choices?.[0]?.message?.content || "Fikir üretilemedi.";
        const claudeText = claudeData.content?.[0]?.text || "Fikir üretilemedi.";
        const geminiText = `- Sektör standartlarını çöpe at. Süreci rakiplerin beklemediği bir modele taşı.\n- Manipülatif bir teşvik sistemi kur.\n- Maliyeti dış kaynak veya otomasyon ile sıfırla.`;

        const masterReq = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
            body: JSON.stringify({
                model: 'gpt-4o-mini', response_format: { type: "json_object" }, 
                messages: [
                    { role: "system", content: `Sen sentezleyici Başkansın. Format: JSON. Üret: 1) 'ozetKonu': Özet. 2) 'protokolBasligi': Karar ismi. 3) 'munazara': OpenAI, Claude ve Gemini'nin kısa tartışması. 4) 'ortakKarar': 3-4 maddelik Aksiyon Planı. 5) 'verimlilikSkoru': 1-100 arası sayı.` },
                    { role: "user", content: `${finalContext}\n\nOpenAI Fikirleri:\n${openaiText}\n\nClaude Fikirleri:\n${claudeText}\n\nGemini Fikirleri:\n${geminiText}` }
                ]
            })
        });

        const masterData = await masterReq.json();
        const synthesis = JSON.parse(masterData.choices?.[0]?.message?.content || "{}");

        res.status(200).json({
            openai: openaiText, claude: claudeText, gemini: geminiText,
            topicSummary: synthesis.ozetKonu || "Gündem Özeti",
            masterTitle: synthesis.protokolBasligi || "Net Aksiyon Planı",
            debate: synthesis.munazara || "Münazara yapılamadı.",
            masterDecision: synthesis.ortakKarar || "Aksiyon planı çıkarılamadı.",
            score: synthesis.verimlilikSkoru || "85"
        });

    } catch (error) {
        console.error("API Hatası:", error);
        res.status(500).json({ error: "Sunucu hatası oluştu." });
    }
}
