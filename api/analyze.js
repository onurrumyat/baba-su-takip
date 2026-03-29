export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: "Sadece POST." });

    const { topic, boardType, revisionNote, fileText, isCrisis } = req.body;
    if (!topic || topic.trim().length < 3) return res.status(400).json({ error: "Geçerli konu girin." });

    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    const CLAUDE_KEY = process.env.CLAUDE_API_KEY;

    if (!OPENAI_KEY || !CLAUDE_KEY) return res.status(500).json({ error: "API Anahtarları eksik." });

    try {
        // --- DİNAMİK UZMAN ROLLERİ ---
        let r1, r2, r3;
        if (boardType === 'hukuk') {
            r1 = "Siber Güvenlik Uzmanı"; r2 = "Şirket Avukatı"; r3 = "Mali Müşavir";
        } else if (boardType === 'pazarlama') {
            r1 = "Satış Direktörü"; r2 = "Tüketici Psikoloğu"; r3 = "Kampanya Yazarı";
        } else {
            r1 = "Pragmatist CEO"; r2 = "Temkinli Risk Analisti"; r3 = "İnovasyon Lideri";
        }

        let crisisCommand = isCrisis ? "DİKKAT: DEFCON 1 KRİZ MODU AKTİF! Uzun vadeyi bırak. Kanamayı anında durduracak 10 dakikalık acil durum refleksleri üret." : "";

        let finalContext = `Gündem: ${topic}\n${crisisCommand}`;
        if (fileText) finalContext += `\n\nMASAYA KONAN DOSYA ÖZETİ:\n${fileText.substring(0, 3000)}`;
        if (revisionNote) finalContext += `\n\nBAŞKANIN REVİZYON EMRİ:\n"Planı şuna göre baştan yapın: ${revisionNote}"`;

        // 1. OPENAI
        const openAiReq = fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
            body: JSON.stringify({
                model: 'gpt-4o-mini', 
                messages: [
                    { role: "system", content: `Sen OpenAI'sın. Masadaki '${r1}' rolünü üstlen. Uzun metin yazma. 3 vurucu, pratik önlem üret. Madde işareti (-) kullan.` },
                    { role: "user", content: finalContext }
                ]
            })
        });

        // 2. CLAUDE
        const claudeReq = fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_KEY, 'anthropic-version': '2023-06-01' },
            body: JSON.stringify({
                model: 'claude-3-haiku-20240307', 
                max_tokens: 300,
                system: `Sen Claude'sun. Masadaki '${r2}' rolünü üstlen. Uzun metin yazma. 3 pratik, koruyucu ve net önlem fikri üret. Madde işareti (-) kullan.`,
                messages: [{ role: "user", content: finalContext }]
            })
        });

        const [openAiRes, claudeRes] = await Promise.all([openAiReq, claudeReq]);
        const openAiData = await openAiRes.json();
        const claudeData = await claudeRes.json();

        const openaiText = openAiData.choices?.[0]?.message?.content || "Fikir üretilemedi.";
        const claudeText = claudeData.content?.[0]?.text || "Fikir üretilemedi.";
        
        // 3. GEMINI SİMÜLASYONU
        const geminiText = `- (${r3} Gözünden): Krizi fırsata çevirecek agresif bir pivot yap.\n- Eski kuralları yıkıp asenkron bir iletişim/onay ağı kur.\n- Pazar manipülasyonu/PR hamlesi ile algıyı yönet.`;

        // 4. BAŞKAN / SENTEZ
        const masterReq = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                response_format: { type: "json_object" }, 
                messages: [
                    { role: "system", content: `Sen başkansın. Format: JSON. Şunları üret: 
                    1) 'ozetKonu': 3-4 kelimelik başlık. 
                    2) 'protokolBasligi': Planın havalı ismi. 
                    3) 'munazara': OpenAI, Claude ve Gemini'nin 3 satırlık tartışması. 
                    4) 'ortakKarar': Tartışmadan çıkan 3-4 maddelik Kesin Aksiyon Planı.
                    5) 'verimlilikSkoru': 1 ile 100 arası bir sayı. Sadece sayı.
                    6) 'zihinHaritasi': 3 anahtar kelimelik dizi. Örn: ["Maliyet", "PR", "Güvenlik"]` },
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
            masterDecision: synthesis.ortakKarar || "Aksiyon planı çıkarılamadı.",
            score: synthesis.verimlilikSkoru || "85",
            mindMap: synthesis.zihinHaritasi || ["Analiz", "Strateji", "Uygulama"]
        });

    } catch (error) {
        console.error("API Hatası:", error);
        res.status(500).json({ error: "Sunucu hatası oluştu." });
    }
}
