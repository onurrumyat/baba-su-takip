export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: "Sadece POST metodu kabul edilir." });

    const { topic, boardType, revisionNote, fileText, isCrisis, isNight, isLiveDebate, history } = req.body;
    if (!topic || topic.trim().length < 2) return res.status(400).json({ error: "Geçerli bir konu girmediniz." });

    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    const CLAUDE_KEY = process.env.CLAUDE_API_KEY;

    if (!OPENAI_KEY || !CLAUDE_KEY) return res.status(500).json({ error: "API Anahtarları eksik." });

    try {
        // --- 1. CANLI MÜZAKERE MODU (Voice Mode) ---
        if (isLiveDebate) {
            let chatHistory = history && history.length > 0 ? history.map(h => `${h.role.toUpperCase()}: ${h.text}`).join('\n') : "";
            const debateReq = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
                body: JSON.stringify({
                    model: 'gpt-4o-mini', response_format: { type: "json_object" },
                    messages: [
                        { role: "system", content: `Sen OpenAI, Claude ve Gemini modellerini yöneten bir zekasın. Kullanıcının söylediği konuya bu 3 farklı yapay zekanın SESLİ TARTIŞIYORMUŞ GİBİ kısa (1'er cümlelik), net cevaplar vermesini sağla. JSON Formatında dön: { "dialogue": [ {"speaker": "openai", "text": "..."}, {"speaker": "claude", "text": "..."}, {"speaker": "gemini", "text": "..."} ] }` },
                        { role: "user", content: `GEÇMİŞ:\n${chatHistory}\n\nBAŞKAN DEDİ Kİ: "${topic}"\nCevap verin.` }
                    ]
                })
            });
            const debateData = await debateReq.json();
            const parsedDebate = JSON.parse(debateData.choices?.[0]?.message?.content || '{"dialogue":[]}');
            return res.status(200).json({ liveDialogue: parsedDebate.dialogue });
        }

        // --- 2. STANDART KURUL MODU (Karar Dosyaları ve Pitch Deck) ---
        
        // Rolleri belirleme
        let r1, r2, r3;
        if (boardType === 'hukuk') { r1 = "Siber Güvenlik Uzmanı"; r2 = "Şirket Avukatı"; r3 = "Mali Müşavir"; } 
        else if (boardType === 'pazarlama') { r1 = "Growth Hacker"; r2 = "Tüketici Psikoloğu"; r3 = "Gerilla Pazarlamacı"; } 
        else if (boardType === 'dahiler') { r1 = "Steve Jobs (Mükemmeliyetçi)"; r2 = "Sun Tzu (Stratejist)"; r3 = "Machiavelli (Politikacı)"; } 
        else { r1 = "Acımasız CEO"; r2 = "Risk Avcısı"; r3 = "İnovasyon Dehası"; }

        let toneCommand = isCrisis ? "DİKKAT: DEFCON 1 KRİZ MODU! Kurumsal jargonu bırak. Kanamayı anında durduracak acil durum taktikleri ver." : (isNight ? "Gece mesaisindeyiz. Dilini samimi, felsefi ve yoldaşça bir tona çek." : "");
        let finalContext = `Gündem: ${topic}\n${toneCommand}`;
        
        // Bütün dosyaları bağlama dahil ediyoruz (10.000 karaktere kadar)
        if (fileText) finalContext += `\n\nMASAYA KONAN DOSYALAR:\n${fileText.substring(0, 10000)}`;
        if (revisionNote) finalContext += `\n\nREVİZYON EMRİ:\n"Bunu dikkate alarak planı baştan yap: ${revisionNote}"`;

        const openAiReq = fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
            body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: "system", content: `Sen '${r1}' rolündesin. Ezber laf kullanma. Sadece işe yarayan 3 spesifik, vurucu taktik ver. Madde işareti (-) kullan.` }, { role: "user", content: finalContext }]})
        });

        const claudeReq = fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_KEY, 'anthropic-version': '2023-06-01' },
            body: JSON.stringify({ model: 'claude-3-haiku-20240307', max_tokens: 300, system: `Sen '${r2}' rolündesin. Felsefe yapma. Net, nokta atışı 3 koruyucu ve stratejik önlem üret. Madde işareti (-) kullan.`, messages: [{ role: "user", content: finalContext }]})
        });

        const [openAiRes, claudeRes] = await Promise.all([openAiReq, claudeReq]);
        const openAiData = await openAiRes.json();
        const claudeData = await claudeRes.json();

        const openaiText = openAiData.choices?.[0]?.message?.content || "Fikir üretilemedi.";
        const claudeText = claudeData.content?.[0]?.text || "Fikir üretilemedi.";
        const geminiText = `- Sektör standartlarını çöpe at. Süreci tamamen rakiplerin beklemediği bir modele taşı.\n- Müşteri/Personel direncini kırmak için manipülatif bir teşvik sistemi kur.\n- Maliyeti dış kaynak veya otomasyon ile sıfırla.`;

        const masterReq = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
            body: JSON.stringify({
                model: 'gpt-4o-mini', response_format: { type: "json_object" }, 
                messages: [
                    { role: "system", content: `Sen yönetim kurulu başkanısın. Format: JSON. Şunları üret: 
                    1) 'ozetKonu': Vurucu 3-4 kelimelik özet. 
                    2) 'protokolBasligi': Kararın havalı ismi. 
                    3) 'munazara': Uzmanların kısa çatışması. 
                    4) 'ortakKarar': 3-4 maddelik net Aksiyon Planı.
                    5) 'verimlilikSkoru': 1-100 arası başarı ihtimali.
                    6) 'zihinHaritasi': 3 anahtar kelime dizisi.
                    7) 'sunumSlaytlari': 4 elemanlı sunum dizisi.` },
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
            score: synthesis.verimlilikSkoru || "85",
            mindMap: synthesis.zihinHaritasi || ["Analiz", "Strateji", "Uygulama"],
            slides: synthesis.sunumSlaytlari || ["Sorun", "Yaklaşım", "Uygulama", "Sonuç"]
        });

    } catch (error) {
        console.error("API Hatası:", error);
        res.status(500).json({ error: error.message || "Sunucu hatası oluştu." });
    }
}
