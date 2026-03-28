// api/analyze.js (Vercel Serverless Formatı)

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default async function handler(req, res) {
    // Sadece POST isteklerini kabul et
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Sadece POST metodu kabul edilir." });
    }

    const { topic } = req.body;

    if (!topic) {
        return res.status(400).json({ error: "Lütfen masaya yatırılacak bir konu girin!" });
    }

    try {
        // Ağ gecikmesi ve düşünme simülasyonu (2.5 saniye)
        await delay(2500);

        const openaiText = `[Güvenlik Protokolü Raporu]\nKonu: ${topic}\n\nDeğerlendirme: Bu senaryoda yapısal bütünlük tehlikeye girebilir. Veri akışını 3 katmanlı bir doğrulama süzgecinden geçirerek, kapalı devre bir sistem kurmamız en güvenli yaklaşım olacaktır.`;

        const claudeText = `[Etik ve Gizlilik Raporu]\nKonu: ${topic}\n\nDeğerlendirme: Kullanıcı verilerinin anonimleştirilmesi kritik bir şarttır. Sistemin her adımında şeffaf olmalı ve üçüncü parti erişimlerini engellemeliyiz.`;

        const geminiText = `[Performans Raporu]\nKonu: ${topic}\n\nDeğerlendirme: Sürtünmesiz bir deneyim şart. Arayüzde gecikme yaşatmadan arka planda işlemleri tamamlayacak asenkron bir akış tasarlamalıyız.`;

        // Ortak karar öncesi 1 saniye daha düşünme
        await delay(1000);

        const masterTitle = "Asenkron Şifreli Katman Protokolü";
        const masterDecision = `SENTEZLENMİŞ ORTAK KARAR (KONSENSÜS)\n\nGündem: ${topic}\n\nStrateji:\n1. 3 Katmanlı kapalı devre doğrulama (OpenAI).\n2. Tam veri şifrelemesi (Claude).\n3. İşlemlerin asenkron yürütülmesi (Gemini).\n\n-> Operasyon Vercel API üzerinden sentezlendi. Lütfen paneli kullanarak onay verin.`;

        // Veriyi Frontend'e Gönder
        res.status(200).json({
            openai: openaiText,
            claude: claudeText,
            gemini: geminiText,
            masterTitle: masterTitle,
            masterDecision: masterDecision
        });

    } catch (error) {
        console.error("API Hatası:", error);
        res.status(500).json({ error: "Sistemde bir arıza meydana geldi." });
    }
}
