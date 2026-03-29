// api/analyze.js (Nihai Profesyonel Sürüm: Roller, Arşiv ve Revizyon Destekli)

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: "Sadece POST metodu." });

    const { topic, boardType, feedback } = req.body;
    if (!topic || topic.trim().length < 3) return res.status(400).json({ error: "Geçerli konu girin." });

    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    const CLAUDE_KEY = process.env.CLAUDE_API_KEY;

    if (!OPENAI_KEY || !CLAUDE_KEY) return res.status(500).json({ error: "API Anahtarları eksik." });

    // Dinamik Karakterler (Board Type)
    let role1 = "", role2 = "", role3 = "";
    if (boardType === 'creative') {
        role1 = "Sen sınırları zorlayan bir 'Vizyoner'sin. Çılgın, riskli ama devasa getirisi olan 3 pratik fikir üret.";
        role2 = "Sen bir 'Eleştirmen'sin. Fikirlere temkinli yaklaşır, markanın itibarını koruyacak 3 pratik önlem üretirsin.";
        role3 = "Sen bir 'İnovasyon Uzmanı'sın. Teknolojik ve sıra dışı 3 oyunlaştırılmış fikir üretirsin.";
    } else if (boardType === 'crisis') {
        role1 = "Sen bir 'Kriz Yöneticisi'sin (CEO). Acımasız, anında kanamayı durduracak 3 sert ve pratik karar al.";
        role2 = "Sen 'Hukuk Müşaviri'sin. Yasal riskleri ve tazminatları önleyecek 3 katı ve pratik kural belirle.";
        role3 = "Sen 'Halkla İlişkiler (PR)' uzmanısın. İtibarı kurtaracak, algıyı yönetecek 3 pratik acil durum hamlesi ver.";
    } else {
        // Varsayılan: Kurumsal Yönetim
        role1 = "Sen sonuç odaklı 'Strateji Direktörü'sün. Kâr ve verimlilik odaklı, maliyet düşürücü 3 pratik taktik ver.";
        role2 = "Sen 'Risk Yöneticisi'sin (CRO). Olası görünmez tehlikeleri önleyecek, güvenli ve temkinli 3 pratik kural koy.";
        role3 = "Sen 'Teknoloji Lideri'sin (CTO). Süreci hızlandıracak, otomasyon ve dijitalleşme odaklı 3 pratik çözüm üret.";
    }

    // Eğer kullanıcı revizyon istediyse, promptlara ekle
    const revisionContext = feedback ? `\n\nDİKKAT! Önceki plan reddedildi. Kullanıcının şu eleştirisine göre yepyeni fikirler üret: "${feedback}"` : "";

    try {
        console.log(`[ANALİZ] Konu: ${topic} | Tip: ${boardType} | Revizyon: ${feedback ? 'Evet' : 'Hayır'}`);

        // 1. KOLTUK (OPENAI)
        const req1 = fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
            body: JSON.stringify({
                model: 'gpt-4o-mini', 
                messages: [
                    { role: "system", content: role1 + revisionContext + " Paragraf yazma, sadece 3 net madde (-) üret." },
                    { role: "user", content: `Gündem: ${topic}` }
                ]
            })
        });

        // 2. KOLTUK (CLAUDE)
        const req2 = fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_KEY, 'anthropic-version': '2023-06-01' },
            body: JSON.stringify({
                model: 'claude-3-haiku-20240307', 
                max_tokens: 250,
                system: role2 + revisionContext + " Paragraf yazma, sadece 3 net madde (-) üret.",
                messages: [{ role: "user", content: `Gündem: ${topic}` }]
            })
        });

        // 3. KOLTUK (Yine OpenAI ile dinamikleştirildi, sıfır maliyetle gerçek zeka)
        const req3 = fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
            body: JSON.stringify({
                model: 'gpt-4o-mini', 
                messages: [
                    { role: "system", content: role3 + revisionContext + " Paragraf yazma, sadece 3 net madde (-) üret." },
                    { role: "user", content: `Gündem: ${topic}` }
                ]
            })
        });

        const [res1, res2, res3] = await Promise.all([req1, req2, req3]);
        const data1 = await res1.json(); const data2 = await res2.json(); const data3 = await res3.json();

        const text1 = data1.choices?.[0]?.message?.content || "Fikir üretilemedi.";
        const text2 = data2.content?.[0]?.text || "Fikir üretilemedi.";
        const text3 = data3.choices?.[0]?.message?.content || "Fikir üretilemedi.";
        
        // 4. BAŞKAN / SENTEZ (JSON FORMATINDA AKSİYON PLANI)
        const masterReq = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                response_format: { type: "json_object" }, 
                messages: [
                    { role: "system", content: "Sen başkansın. Format: JSON. Sana 3 farklı vizyondan listeler gelecek. Şunları üret: 1) 'ozetKonu': 3-4 kelimelik başlık. 2) 'protokolBasligi': Planın havalı ismi. 3) 'ortakKarar': Gelen fikirleri süz, hemen uygulanabilir, aşırı net, en iyi 3 maddelik 'Nihai Aksiyon Planı'." },
                    { role: "user", content: `Konu: ${topic}\nUzman 1: ${text1}\nUzman 2: ${text2}\nUzman 3: ${text3}${revisionContext}` }
                ]
            })
        });

        const masterData = await masterReq.json();
        const synthesis = JSON.parse(masterData.choices?.[0]?.message?.content || "{}");

        res.status(200).json({
            seat1: text1, seat2: text2, seat3: text3,
            topicSummary: synthesis.ozetKonu || "Gündem Özeti",
            masterTitle: synthesis.protokolBasligi || "Ortak Aksiyon Planı",
            masterDecision: synthesis.ortakKarar || "Aksiyon planı çıkarılamadı."
        });

    } catch (error) {
        console.error("API Bağlantı Hatası:", error);
        res.status(500).json({ error: "Sunucu hatası oluştu." });
    }
}
