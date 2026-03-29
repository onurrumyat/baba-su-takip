export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: "Sadece POST." });

    const { topic, boardType, revisionNote, fileText, isCrisis, isNight } = req.body;
    if (!topic || topic.trim().length < 3) return res.status(400).json({ error: "Geçerli konu girin." });

    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    const CLAUDE_KEY = process.env.CLAUDE_API_KEY;

    if (!OPENAI_KEY || !CLAUDE_KEY) return res.status(500).json({ error: "API Anahtarları eksik." });

    try {
        // --- DİNAMİK UZMAN ROLLERİ (TARİHİN DAHİLERİ EKLENDİ) ---
        let r1, r2, r3;
        if (boardType === 'hukuk') { r1 = "Siber Güvenlik Uzmanı"; r2 = "Şirket Avukatı"; r3 = "Mali Müşavir"; } 
        else if (boardType === 'pazarlama') { r1 = "Growth Hacker"; r2 = "Tüketici Psikoloğu"; r3 = "Gerilla Pazarlamacı"; } 
        else if (boardType === 'dahiler') { r1 = "Steve Jobs (Mükemmeliyetçi & Tasarımcı)"; r2 = "Sun Tzu (Acımasız Savaş Stratejisti)"; r3 = "Machiavelli (Kurnaz Politikacı)"; } 
        else { r1 = "Acımasız CEO"; r2 = "Risk Avcısı"; r3 = "İnovasyon Dehası"; }

        // --- PSİKOLOJİK MODLAR (GECE / KRİZ) ---
        let toneCommand = "";
        if (isCrisis) toneCommand = "DİKKAT: DEFCON 1 KRİZ MODU! Kurumsal jargonu bırak. Kanamayı anında durduracak acil durum taktikleri ver.";
        else if (isNight) toneCommand = "Gece mesaisindeyiz. Dışarıda yağmur yağıyor. Dilini çok daha samimi, felsefi ve yoldaşça bir tona çek. (Örn: 'Başkanım, uzun bir gün oldu ama şunu şöyle çözeriz' gibi başla).";

        let finalContext = `Gündem: ${topic}\n${toneCommand}`;
        if (fileText) finalContext += `\n\nMASAYA KONAN DOSYA:\n${fileText.substring(0, 3000)}`;
        if (revisionNote) finalContext += `\n\nREVİZYON EMRİ:\n"Bunu dikkate alarak planı baştan yap: ${revisionNote}"`;

        // 1. OPENAI (Agresif/Birinci Uzman)
        const openAiReq = fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
            body: JSON.stringify({
                model: 'gpt-4o-mini', 
                messages: [
                    { role: "system", content: `Sen '${r1}' rolündesin. Ezber laf kullanma. Sadece işe yarayan 3 spesifik, vurucu taktik ver. Madde işareti (-) kullan.` },
                    { role: "user", content: finalContext }
                ]
            })
        });

        // 2. CLAUDE (Risk/İkinci Uzman)
        const claudeReq = fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_KEY, 'anthropic-version': '2023-06-01' },
            body: JSON.stringify({
                model: 'claude-3-haiku-20240307', 
                max_tokens: 300,
                system: `Sen '${r2}' rolündesin. Felsefe yapma. Net, nokta atışı 3 koruyucu ve stratejik önlem üret. Madde işareti (-) kullan.`,
                messages: [{ role: "user", content: finalContext }]
            })
        });

        const [openAiRes, claudeRes] = await Promise.all([openAiReq, claudeReq]);
        const openAiData = await openAiRes.json();
        const claudeData = await claudeRes.json();

        const openaiText = openAiData.choices?.[0]?.message?.content || "Fikir üretilemedi.";
        const claudeText = claudeData.content?.[0]?.text || "Fikir üretilemedi.";
        
        // 3. GEMINI SİMÜLASYONU (Üçüncü Uzman)
        const geminiText = `- (${r3} Gözünden): Sektör standartlarını çöpe at. Süreci tamamen rakiplerin beklemediği bir modele taşı.\n- Müşteri/Personel direncini kırmak için manipülatif bir teşvik sistemi kur.\n- Maliyeti dış kaynak veya otomasyon ile sıfırla.`;

        // 4. BAŞKAN / SENTEZ (Pre-Mortem Eklendi)
        const masterReq = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                response_format: { type: "json_object" }, 
                messages: [
                    { role: "system", content: `Sen yönetim kurulu başkanısın. Format: JSON. Şunları üret: 
                    1) 'ozetKonu': Vurucu 3-4 kelimelik özet. 
                    2) 'protokolBasligi': Kararın havalı ismi. 
                    3) 'munazara': Uzmanların kısa çatışması. 
                    4) 'ortakKarar': 3-4 maddelik net Aksiyon Planı.
                    5) 'verimlilikSkoru': 1-100 arası başarı ihtimali.
                    6) 'zihinHaritasi': 3 anahtar kelime dizisi.
                    7) 'sunumSlaytlari': 4 elemanlı sunum dizisi.
                    8) 'preMortem': (FELAKET SİMÜLATÖRÜ) 1 yıl sonrasına git ve 'Bu plan GİZLİ bir sebepten dolayı patladı ve şirket devasa zarar etti' varsayımıyla, bu çöküşün NEDENİNİ anlatan 3 cümlelik acımasız ve korkutucu bir 'Otopsi Raporu' yaz.` },
                    { role: "user", content: `${finalContext}\n\n${r1} Fikirleri:\n${openaiText}\n\n${r2} Fikirleri:\n${claudeText}\n\n${r3} Fikirleri:\n${geminiText}` }
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
            slides: synthesis.sunumSlaytlari || ["Sorun", "Yaklaşım", "Uygulama", "Sonuç"],
            preMortem: synthesis.preMortem || "Bu plan başarısız oldu çünkü piyasa dinamikleri değişti."
        });

    } catch (error) {
        console.error("API Hatası:", error);
        res.status(500).json({ error: "Sunucu hatası oluştu." });
    }
}
