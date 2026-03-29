export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: "Sadece POST." });

    const { topic, boardType, revisionNote, fileText, isCrisis } = req.body;
    if (!topic || topic.trim().length < 3) return res.status(400).json({ error: "Geçerli konu girin." });

    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    const CLAUDE_KEY = process.env.CLAUDE_API_KEY;

    if (!OPENAI_KEY || !CLAUDE_KEY) return res.status(500).json({ error: "API Anahtarları eksik." });

    try {
        let r1, r2, r3;
        if (boardType === 'hukuk') {
            r1 = "Siber Güvenlik Uzmanı"; r2 = "Şirket Avukatı"; r3 = "Mali Müşavir";
        } else if (boardType === 'pazarlama') {
            r1 = "Growth Hacker (Büyüme Uzmanı)"; r2 = "Tüketici Psikoloğu"; r3 = "Gerilla Pazarlamacı";
        } else {
            r1 = "Acımasız CEO"; r2 = "Risk Avcısı"; r3 = "İnovasyon Dehası";
        }

        let crisisCommand = isCrisis ? "DİKKAT: KRİZ MODU! Kurumsal jargonu bırak. Kanamayı anında durduracak, çok agresif 10 dakikalık acil durum taktikleri ver." : "";

        let finalContext = `Gündem: ${topic}\n${crisisCommand}`;
        if (fileText) finalContext += `\n\nMASAYA KONAN DOSYA:\n${fileText.substring(0, 3000)}`;
        if (revisionNote) finalContext += `\n\nREVİZYON EMRİ:\n"Bunu dikkate alarak planı baştan yap: ${revisionNote}"`;

        // 1. OPENAI (Agresif İcraat)
        const openAiReq = fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
            body: JSON.stringify({
                model: 'gpt-4o-mini', 
                messages: [
                    { role: "system", content: `Sen '${r1}' rolündesin. Ezber, sıkıcı ve yuvarlak laflar kullanma. Sadece işe yarayan, sahada test edilmiş 3 spesifik, vurucu ve acımasız taktik ver. Madde işareti (-) kullan.` },
                    { role: "user", content: finalContext }
                ]
            })
        });

        // 2. CLAUDE (Kritik Açık Bulucu)
        const claudeReq = fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_KEY, 'anthropic-version': '2023-06-01' },
            body: JSON.stringify({
                model: 'claude-3-haiku-20240307', 
                max_tokens: 300,
                system: `Sen '${r2}' rolündesin. Felsefe yapma. Bu planın 6 ay içinde neden patlayabileceğini (en zayıf noktasını) bul ve bunu önleyecek 3 nokta atışı koruma kalkanı üret. Madde işareti (-) kullan.`,
                messages: [{ role: "user", content: finalContext }]
            })
        });

        const [openAiRes, claudeRes] = await Promise.all([openAiReq, claudeReq]);
        const openAiData = await openAiRes.json();
        const claudeData = await claudeRes.json();

        const openaiText = openAiData.choices?.[0]?.message?.content || "Fikir üretilemedi.";
        const claudeText = claudeData.content?.[0]?.text || "Fikir üretilemedi.";
        
        // 3. GEMINI SİMÜLASYONU (Aykırı Düşünce)
        const geminiText = `- (${r3} Gözünden): Sektör standartlarını çöpe at. Bu süreci tamamen rakiplerin beklemediği asenkron bir modele taşı.\n- Müşteri/Personel direncini kırmak için manipülatif bir teşvik (ödül/ceza) sistemi kur.\n- Maliyeti sıfırlamak için dış kaynak veya otomasyon kullan.`;

        // 4. BAŞKAN / SENTEZ (Sunum Slaytları ve Harita Üreten Süper Beyin)
        const masterReq = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                response_format: { type: "json_object" }, 
                messages: [
                    { role: "system", content: `Sen yönetim kurulu başkanısın. Format: JSON. Şunları üret: 
                    1) 'ozetKonu': Kurumsal saçmalıklardan uzak, vurucu 3-4 kelimelik özet. 
                    2) 'protokolBasligi': Kararın çok net ve havalı ismi. 
                    3) 'munazara': Uzmanların kısa çatışması. 
                    4) 'ortakKarar': 3-4 maddelik, kesinlikle sonuç odaklı ve 'nasıl yapılacağını' anlatan net Aksiyon Planı.
                    5) 'verimlilikSkoru': 1 ile 100 arası başarı ihtimali sayısı.
                    6) 'zihinHaritasi': 3 anahtar kelimelik dizi.
                    7) 'sunumSlaytlari': 4 elemanlı bir dizi (Array). Sunum için: Slayt 1: Kök Sorun, Slayt 2: Yaklaşım, Slayt 3: Uygulama Adımı, Slayt 4: Beklenen Getiri (Kısa ve çok profesyonel cümleler).` },
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
            masterTitle: synthesis.protokolBasligi || "Net Aksiyon Planı",
            debate: synthesis.munazara || "Münazara yapılamadı.",
            masterDecision: synthesis.ortakKarar || "Aksiyon planı çıkarılamadı.",
            score: synthesis.verimlilikSkoru || "85",
            mindMap: synthesis.zihinHaritasi || ["Analiz", "Strateji", "Uygulama"],
            slides: synthesis.sunumSlaytlari || ["Sorun tespiti", "Yaklaşım", "Uygulama", "Sonuç"]
        });

    } catch (error) {
        console.error("API Hatası:", error);
        res.status(500).json({ error: "Sunucu hatası oluştu." });
    }
}
