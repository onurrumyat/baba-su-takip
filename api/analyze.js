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
                        { role: "system", content: `Sen OpenAI, Claude ve Gemini modellerini yöneten bir zekasın. Kullanıcının söylediği konuya bu 3 farklı yapay zekanın SESLİ TARTIŞIYORMUŞ GİBİ kısa (1'er cümlelik), net, YARATICI ve SIRA DIŞI taktikler vererek cevaplamasını sağla. Asla yuvarlak veya klişe cümle ("analiz etmeliyiz" vb.) kurmasınlar. Herkes birbirinin fikrine meydan okuyabilir. JSON Formatında dön: { "dialogue": [ {"speaker": "openai", "text": "..."}, {"speaker": "claude", "text": "..."}, {"speaker": "gemini", "text": "..."} ] }` },
                        { role: "user", content: `GEÇMİŞ:\n${chatHistory}\n\nBAŞKAN DEDİ Kİ: "${topic}"\nCevap verin.` }
                    ]
                })
            });
            const debateData = await debateReq.json();
            const parsedDebate = JSON.parse(debateData.choices?.[0]?.message?.content || '{"dialogue":[]}');
            return res.status(200).json({ liveDialogue: parsedDebate.dialogue });
        }

        // --- 2. STANDART KURUL MODU (GELİŞMİŞ PROMPT MÜHENDİSLİĞİ) ---
        let r1, r2, r3;
        if (boardType === 'hukuk') { r1 = "Siber Güvenlik Uzmanı"; r2 = "Şirket Avukatı"; r3 = "Mali Müşavir"; } 
        else if (boardType === 'pazarlama') { r1 = "Growth Hacker"; r2 = "Tüketici Psikoloğu"; r3 = "Gerilla Pazarlamacı"; } 
        else { r1 = "Acımasız CEO"; r2 = "Risk Avcısı"; r3 = "İnovasyon Dehası"; }

        let toneCommand = isNight ? "Gece mesaisindeyiz. Dilini samimi, felsefi ve yoldaşça bir tona çek ancak kararlar çok keskin olsun." : "";
        let finalContext = `Gündem: ${topic}\n${toneCommand}`;
        
        if (fileText) finalContext += `\n\nMASAYA KONAN DOSYALAR:\n${fileText.substring(0, 10000)}`;
        if (revisionNote) finalContext += `\n\nREVİZYON EMRİ:\n"Bunu dikkate alarak planı baştan yap: ${revisionNote}"`;

        // 1. OpenAI
        const openAiReq = fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
            body: JSON.stringify({ 
                model: 'gpt-4o-mini', 
                messages: [
                    { role: "system", content: `Sen '${r1}' rolündesin. Klişe, yuvarlak veya 'daha iyi pazarlama yapın', 'analiz edin' gibi genel geçer laflar KESİNLİKLE KULLANMA. Gündemi çözmek veya büyütmek için sahada hemen uygulanabilecek, rakiplerin aklına gelmeyecek, pragmatik, yaratıcı ve nokta atışı 3 taktik ver. Doğrudan aksiyona odaklan. Sadece madde işareti (-) kullan.` }, 
                    { role: "user", content: finalContext }
                ]
            })
        });

        // 2. Claude
        const claudeReq = fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_KEY, 'anthropic-version': '2023-06-01' },
            body: JSON.stringify({ 
                model: 'claude-3-haiku-20240307', 
                max_tokens: 300, 
                system: `Sen '${r2}' rolündesin. Yüzeysel öğütler verme. Bu plandaki/gündemdeki en büyük açığı, hatayı veya büyüme fırsatını bul. Bunu kökünden çözmek için teknik ve %100 işe yarayacak 3 spesifik, keskin önlem/aksiyon yaz. Sadece eyleme geçirilebilir adımlar ver. Madde işareti (-) kullan.`, 
                messages: [{ role: "user", content: finalContext }]
            })
        });

        // 3. Gemini (Dinamik)
        const geminiReq = fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
            body: JSON.stringify({ 
                model: 'gpt-4o-mini', 
                messages: [
                    { role: "system", content: `Sen '${r3}' rolündesin. İnsanların saatlerce yapacağı işi saniyelere indirecek, sistemi tamamen otomatize edecek veya mevcut iş modelini 'Disrupt' (yıkıp baştan yapacak) 3 acımasız ve yenilikçi taktik ver. Ezber laflar etme, maliyeti sıfırlamaya ve maksimum etkiye odaklan. Sadece madde işareti (-) kullan.` }, 
                    { role: "user", content: finalContext }
                ]
            })
        });

        const [openAiRes, claudeRes, geminiRes] = await Promise.all([openAiReq, claudeReq, geminiReq]);
        const openAiData = await openAiRes.json();
        const claudeData = await claudeRes.json();
        const geminiData = await geminiRes.json();

        const openaiText = openAiData.choices?.[0]?.message?.content || "Veri sağlanamadı.";
        const claudeText = claudeData.content?.[0]?.text || "Veri sağlanamadı.";
        const geminiText = geminiData.choices?.[0]?.message?.content || "Veri sağlanamadı.";

        // Master Karar Verici (Sentez)
        const masterReq = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
            body: JSON.stringify({
                model: 'gpt-4o-mini', response_format: { type: "json_object" }, 
                messages: [
                    { role: "system", content: `Sen kusursuz ve acımasız bir Yönetim Kurulu Başkanısın. SANA VERİLEN 3 RAPORDAKİ FİKİRLERİ HARMANLA. Asla şirket jargonu, boş laflar, "durumu gözden geçirmeliyiz" gibi yuvarlak cümleler kurma. Kararlar bıçak gibi keskin ve hemen uygulanabilir olmalı. JSON Formatında dön: 
                    1) 'ozetKonu': Vurucu 3-4 kelimelik gündem özeti. 
                    2) 'protokolBasligi': Aksiyon planının akılda kalıcı havalı ismi. 
                    3) 'munazara': 3 modelin fikirlerinin 2 cümlelik acımasız sentezi. 
                    4) 'ortakKarar': Harfiyen uygulanacak, çok spesifik, somut ve vurucu 3-4 maddelik Aksiyon Planı (Gerçekçi adımlar).
                    5) 'verimlilikSkoru': Planın uygulanabilirliği (1-100 arası sadece sayı).
                    6) 'sunumSlaytlari': Planı ekibe sunmak için net, kısa ve etkileyici 4 elemanlı dizi (Sorun, Yaklaşım, Uygulama, Sonuç).` },
                    { role: "user", content: `${finalContext}\n\nOpenAI Raporu:\n${openaiText}\n\nClaude Raporu:\n${claudeText}\n\nGemini Raporu:\n${geminiText}` }
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
