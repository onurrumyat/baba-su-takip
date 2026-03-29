// api/analyze.js (Nihai Kurmay Heyeti Sürümü)

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: "Sadece POST." });

    const { topic, boardType, revisionNote, fileText } = req.body;
    if (!topic || topic.trim().length < 3) return res.status(400).json({ error: "Geçerli konu girin." });

    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    const CLAUDE_KEY = process.env.CLAUDE_API_KEY;

    if (!OPENAI_KEY || !CLAUDE_KEY) return res.status(500).json({ error: "API Anahtarları eksik." });

    try {
        // --- DİNAMİK UZMAN ROLLERİ ---
        let r1, r2, r3;
        if (boardType === 'hukuk') {
            r1 = "Siber Güvenlik Uzmanı (Riskleri ve açıkları bulur)";
            r2 = "Şirket Avukatı (Hukuki ve sözleşme risklerini bulur)";
            r3 = "Mali Müşavir (Finansal cezaları hesaplar)";
        } else if (boardType === 'pazarlama') {
            r1 = "Satış Direktörü (Kâr ve dönüşüm odaklıdır)";
            r2 = "Tüketici Psikoloğu (Müşterinin hislerine odaklanır)";
            r3 = "Metin/Kampanya Yazarı (Yaratıcı ve sınır yıkıcıdır)";
        } else {
            r1 = "Pragmatist CEO (Verim ve hız odaklı)";
            r2 = "Temkinli Risk Analisti (Etik ve uzun vade odaklı)";
            r3 = "İnovasyon Lideri (Alışılmışın dışında oyunlaştıran)";
        }

        // --- GİRDİLERİ BİRLEŞTİRME (Dosya ve Revizyon Varsa) ---
        let finalContext = `Gündem: ${topic}`;
        if (fileText) finalContext += `\n\nMASAYA KONAN DOSYA/SÖZLEŞME ÖZETİ:\n${fileText.substring(0, 3000)}`;
        if (revisionNote) finalContext += `\n\nDİKKAT! BAŞKANIN REVİZYON EMRİ (ESKİ PLAN REDDEDİLDİ):\n"Lütfen planı şu eleştiriye göre baştan yapın: ${revisionNote}"`;

        // 1. OPENAI İSTEĞİ
        const openAiReq = fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
            body: JSON.stringify({
                model: 'gpt-4o-mini', 
                messages: [
                    { role: "system", content: `Sen masadaki '${r1}' rolüsün. Uzun metin yazma. Kendi uzmanlık alanından bakarak 3 vurucu, pratik ve acımasız önlem/fikir üret. Madde işareti (-) kullan.` },
                    { role: "user", content: finalContext }
                ]
            })
        });

        // 2. CLAUDE İSTEĞİ
        const claudeReq = fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_KEY, 'anthropic-version': '2023-06-01' },
            body: JSON.stringify({
                model: 'claude-3-haiku-20240307', 
                max_tokens: 250,
                system: `Sen masadaki '${r2}' rolüsün. Uzun metin yazma. Kendi uzmanlık alanından bakarak 3 pratik, koruyucu ve net önlem fikri üret. Madde işareti (-) kullan.`,
                messages: [
                    { role: "user", content: finalContext }
                ]
            })
        });

        const [openAiRes, claudeRes] = await Promise.all([openAiReq, claudeReq]);
        const openAiData = await openAiRes.json();
        const claudeData = await claudeRes.json();

        const openaiText = openAiData.choices?.[0]?.message?.content || "Fikir üretilemedi.";
        const claudeText = claudeData.content?.[0]?.text || "Fikir üretilemedi.";
        
        // 3. GEMINI (Simüle Edilmiş 3. Uzman)
        const geminiText = `- (${r3} Gözünden): Klasik yöntemleri bırakıp süreci tamamen otomatize et.\n- İnsan faktörünü azaltarak doğrudan sonuca giden asenkron bir akış kur.\n- Kural esneterek pazar/sistem avantajı sağla.`;

        // 4. BAŞKAN / SENTEZ VE MÜNAZARA (DEBATE) MODU
        const masterReq = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                response_format: { type: "json_object" }, 
                messages: [
                    { role: "system", content: `Sen yönetim kurulu başkanısın. Format: JSON. Sana 3 farklı rolden fikirler gelecek. Şunları üret: 
                    1) 'ozetKonu': 3-4 kelimelik başlık. 
                    2) 'protokolBasligi': Aksiyon planının havalı ismi. 
                    3) 'munazara': Bu 3 uzmanın birbiriyle tartıştığı, birbirinin fikrini eleştirdiği 3-4 satırlık kısa bir diyalog/münazara dökümü (Örn: Uzman 1: Şöyle yapalım. Uzman 2: Hayır o riskli, böyle yapalım.). 
                    4) 'ortakKarar': Tartışmadan çıkan, hemen uygulanabilir, 3-4 maddelik Kesin Aksiyon Planı.` },
                    { role: "user", content: `${finalContext}\n\n${r1} Fikirleri:\n${openaiText}\n\n${r2} Fikirleri:\n${claudeText}\n\n${r3} Fikirleri:\n${geminiText}` }
                ]
            })
        });

        const masterData = await masterReq.json();
        const synthesis = JSON.parse(masterData.choices?.[0]?.message?.content || "{}");

        res.status(200).json({
            openai: `[${r1}]\n\n${openaiText}`,
            claude: `[${r2}]\n\n${claudeText}`,
            gemini: `[${r3}]\n\n${geminiText}`,
            topicSummary: synthesis.ozetKonu || "Gündem Özeti",
            masterTitle: synthesis.protokolBasligi || "Ortak Aksiyon Planı",
            debate: synthesis.munazara || "Münazara yapılamadı.",
            masterDecision: synthesis.ortakKarar || "Aksiyon planı çıkarılamadı."
        });

    } catch (error) {
        console.error("API Hatası:", error);
        res.status(500).json({ error: "Sunucu hatası oluştu." });
    }
}
