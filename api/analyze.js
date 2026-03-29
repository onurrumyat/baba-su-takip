export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: "Sadece POST." });

    const { topic, boardType, revisionNote, fileText, isCrisis, isNight, isLiveDebate, history } = req.body;
    if (!topic || topic.trim().length < 2) return res.status(400).json({ error: "Geçerli konu girin." });

    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    const CLAUDE_KEY = process.env.CLAUDE_API_KEY;

    if (!OPENAI_KEY || !CLAUDE_KEY) return res.status(500).json({ error: "API Anahtarları eksik." });

    try {
        // --- CANLI SESLİ MÜZAKERE MODU ---
        if (isLiveDebate) {
            let chatHistory = history && history.length > 0 
                ? history.map(h => `${h.role.toUpperCase()}: ${h.text}`).join('\n') 
                : "Geçmiş yok. Toplantı yeni başladı.";
            
            const debateReq = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    response_format: { type: "json_object" },
                    messages: [
                        { role: "system", content: `Sen sırasıyla OpenAI, Claude ve Gemini modellerini simüle eden bir süper zekasın. Kullanıcının (Başkan) söylediği konuya bu 3 farklı yapay zekanın SESLİ TARTIŞIYORMUŞ GİBİ kısa (1'er cümlelik), net ve ardışık cevaplar vermesini sağla. İnsan rolü yapma. JSON Formatında dön: { "dialogue": [ {"speaker": "openai", "text": "..."}, {"speaker": "claude", "text": "..."}, {"speaker": "gemini", "text": "..."} ] }` },
                        { role: "user", content: `GEÇMİŞ:\n${chatHistory}\n\nBAŞKAN ŞUNU SÖYLEDİ: "${topic}"\nHaydi, aranızda tartışarak doğrudan cevap verin.` }
                    ]
                })
            });

            const debateData = await debateReq.json();
            const parsedDebate = JSON.parse(debateData.choices?.[0]?.message?.content || '{"dialogue":[]}');
            return res.status(200).json({ liveDialogue: parsedDebate.dialogue });
        }

        // --- STANDART KURUL MODU ---
        let toneCommand = isCrisis ? "DİKKAT: DEFCON 1 KRİZ MODU! Kanamayı anında durduracak taktikler ver." : (isNight ? "Gece mesaisi. Sakin ve stratejik bir ton kullan." : "");
        let finalContext = `Gündem: ${topic}\n${toneCommand}`;
        if (fileText) finalContext += `\n\nMASAYA KONAN DOSYA:\n${fileText.substring(0, 3000)}`;
        if (revisionNote) finalContext += `\n\nREVİZYON EMRİ:\n"Bunu dikkate alarak planı baştan yap: ${revisionNote}"`;

        const openAiReq = fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
            body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: "system", content: `Sen OpenAI'sın. Sadece işe yarayan 3 vurucu taktik ver. Madde işareti (-) kullan.` }, { role: "user", content: finalContext }]})
        });

        const claudeReq = fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_KEY, 'anthropic-version': '2023-06-01' },
            body: JSON.stringify({ model: 'claude-3-haiku-20240307', max_tokens: 300, system: `Sen Claude'sun. Plandaki riskleri bulup 3 koruyucu önlem üret. Madde işareti (-) kullan.`, messages: [{ role: "user", content: finalContext }]})
        });

        const [openAiRes, claudeRes] = await Promise.all([openAiReq, claudeReq]);
        const openAiData = await openAiRes.json();
        const claudeData = await claudeRes.json();

        const openaiText = openAiData.choices?.[0]?.message?.content || "Fikir üretilemedi.";
        const claudeText = claudeData.content?.[0]?.text || "Fikir üretilemedi.";
        const geminiText = `- Sektör standartlarını çöpe at. Süreci rakiplerin beklemediği bir modele taşı.\n- Teşvik sistemi kur.\n- Maliyeti dış kaynak ile sıfırla.`;

        const masterReq = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
            body: JSON.stringify({
                model: 'gpt-4o-mini', response_format: { type: "json_object" }, 
                messages: [
                    { role: "system", content: `Sen yönetim kurulu başkanısın. Format: JSON. Üret: 1) 'ozetKonu': Özet. 2) 'protokolBasligi': Karar ismi. 3) 'munazara': Kısa tartışma. 4) 'ortakKarar': 3-4 maddelik Aksiyon Planı. 5) 'verimlilikSkoru': 1-100 arası sayı.` },
                    { role: "user", content: `${finalContext}\n\nOpenAI:\n${openaiText}\n\nClaude:\n${claudeText}\n\nGemini:\n${geminiText}` }
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
