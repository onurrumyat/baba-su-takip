export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: "Sadece POST metodu kabul edilir." });

    const { topic, boardType, revisionNote, fileText, isNight, isLiveDebate, history } = req.body;
    if (!topic || topic.trim().length < 2) return res.status(400).json({ error: "Geçerli bir konu girmediniz." });

    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    const CLAUDE_KEY = process.env.CLAUDE_API_KEY;

    if (!OPENAI_KEY || !CLAUDE_KEY) return res.status(500).json({ error: "API Anahtarları eksik." });

    try {
        // --- 1. CANLI MÜZAKERE MODU ---
        if (isLiveDebate) {
            let chatHistory = history && history.length > 0 ? history.map(h => `${h.role.toUpperCase()}: ${h.text}`).join('\n') : "";

            const debateReq = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
                body: JSON.stringify({
                    model: 'gpt-4o-mini', response_format: { type: "json_object" },
                    messages: [
                        { role: "system", content: `Sen OpenAI, Claude ve Gemini modellerini yöneten bir zekasın. Kullanıcının söylediği konuya bu 3 farklı yapay zekanın SESLİ TARTIŞIYORMUŞ GİBİ kısa (1'er cümlelik), net, YARATICI ve SIRA DIŞI taktikler vererek cevaplamasını sağla. Asla yuvarlak cümle kurmasınlar. JSON Formatında dön: { "dialogue": [ {"speaker": "openai", "text": "..."}, {"speaker": "claude", "text": "..."}, {"speaker": "gemini", "text": "..."} ] }` },
                        { role: "user", content: `GEÇMİŞ:\n${chatHistory}\n\nBAŞKAN DEDİ Kİ: "${topic}"\nCevap verin.` }
                    ]
                })
            });
            const debateData = await debateReq.json();
            const parsedDebate = JSON.parse(debateData.choices?.[0]?.message?.content || '{"dialogue":[]}');
            return res.status(200).json({ liveDialogue: parsedDebate.dialogue });
        }

        // --- 2. STANDART KURUL MODU (GELİŞMİŞ PROMPT MÜHENDİSLİĞİ) ---
        let toneCommand = isNight ? "Gece mesaisindeyiz. Dilini samimi, felsefi ve yoldaşça bir tona çek ancak kararlar çok keskin olsun." : "";
        let finalContext = `Gündem: ${topic}\n${toneCommand}`;
        
        if (fileText) finalContext += `\n\nMASAYA KONAN DOSYALAR:\n${fileText.substring(0, 10000)}`;
        if (revisionNote) finalContext += `\n\nREVİZYON EMRİ:\n"Bunu dikkate alarak planı baştan yap: ${revisionNote}"`;

        // 1. OpenAI (Stratejist)
        const openAiReq = fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
            body: JSON.stringify({ 
                model: 'gpt-4o-mini', 
                messages: [
                    { role: "system", content: "Sen dünyanın en pragmatik ve sonuç odaklı CEO'susun. Klişe, yuvarlak veya 'daha iyi pazarlama yapın', 'analiz edin' gibi ezber laflar KESİNLİKLE KULLANMA. Gündemi çözmek veya büyütmek için sahada hemen uygulanabilecek, rakiplerin aklına gelmeyecek, yaratıcı ve nokta atışı 3 gerilla taktiği ver. Sadece madde işareti (-) kullan." }, 
                    { role: "user", content: finalContext }
                ]
            })
        });

        // 2. Claude (Risk & Güvenlik Analisti)
        const claudeReq = fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_KEY, 'anthropic-version': '2023-06-01' },
            body: JSON.stringify({ 
                model: 'claude-3-haiku-20240307', 
                max_tokens: 300, 
                system: "Sen acımasız ve detaya inen bir Risk Yöneticisisin. Yüzeysel öğütler verme. Bu plandaki/gündemdeki en büyük güvenlik açığını, potansiyel iflas sebebini veya veri problemini bul. Bunu kökünden çözmek için teknik ve %100 işe yarayacak 3 spesifik, keskin önlem yaz. Madde işareti (-) kullan.", 
                messages: [{ role: "user", content: finalContext }]
            })
        });

        // 3. Gemini Simülasyonu (İnovasyon & Teknoloji)
        const geminiReq = fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
            body: JSON.stringify({ 
                model: 'gpt-4o-mini', 
                messages: [
                    { role: "system", content: "Sen Google'ın yapay zekası Gemini'sin. Teknoloji, verimlilik, otomasyon ve geleceğin trendleri konusunda dâhisin. İnsanların saatlerce yapacağı işi saniyelere indirecek, sistemi tamamen dijitalleştirecek veya mevcut iş modelini 'Disrupt' (yıkıp baştan yapacak) 3 yenilikçi teknoloji/yazılım taktiği ver. Ezber laflar etme, vizyoner ol. Madde işareti (-) kullan." }, 
                    { role: "user", content: finalContext }
                ]
            })
        });

        const [openAiRes, claudeRes, geminiRes] = await Promise.all([openAiReq, claudeReq, geminiReq]);
        const openAiData = await openAiRes.json();
        const claudeData = await claudeRes.json();
        const geminiData = await geminiRes.json();

        const openaiText = openAiData.choices?.[0]?.message?.content || "Fikir üretilemedi.";
        const claudeText = claudeData.content?.[0]?.text || "Fikir üretilemedi.";
        const geminiText = geminiData.choices?.[0]?.message?.content || "Fikir üretilemedi.";

        // Master Karar Verici (Sentez)
        const masterReq = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
            body: JSON.stringify({
                model: 'gpt-4o-mini', response_format: { type: "json_object" }, 
                messages: [
                    { role: "system", content: `Sen kusursuz bir Yönetim Kurulu Başkanısın. SANA VERİLEN 3 RAPORDAKİ FİKİRLERİ (OpenAI, Claude, Gemini) HARMANLA. Asla şirket jargonu, boş laflar veya yuvarlak cümleler kurma. JSON Formatında dön: 
                    1) 'ozetKonu': Vurucu 3-4 kelimelik gündem özeti. 
                    2) 'protokolBasligi': Aksiyon planının akılda kalıcı havalı ismi. 
                    3) 'munazara': 3 modelin fikirlerinin 2 cümlelik acımasız sentezi. 
                    4) 'ortakKarar': Harfiyen uygulanacak, çok spesifik, somut ve vurucu 3-4 maddelik Aksiyon Planı (Gerçekçi adımlar).
                    5) 'verimlilikSkoru': Planın uygulanabilirliği (1-100 arası sadece sayı).
                    6) 'sunumSlaytlari': Planı yatırımcılara veya ekibe sunmak için net, kısa ve etkileyici 4 elemanlı dizi (Sorun, Yaklaşım, Uygulama, Sonuç).` },
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
            slides: synthesis.sunumSlaytlari || ["Sorun", "Yaklaşım", "Uygulama", "Sonuç"]
        });

    } catch (error) {
        console.error("API Hatası:", error);
        res.status(500).json({ error: error.message || "Sunucu hatası oluştu." });
    }
}
