// server.js
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors()); // Arayüzün sunucuya erişebilmesi için gerekli
app.use(express.json());

// Gecikme simülatörü (Yapay zekalar "düşünüyor" hissi vermek için)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

app.post('/api/analyze', async (req, res) => {
    const { topic } = req.body;

    if (!topic) {
        return res.status(400).json({ error: "Lütfen masaya yatırılacak bir konu girin!" });
    }

    console.log(`[SİSTEM] Yeni gündem alındı: "${topic}" - Analiz başlatılıyor...`);

    try {
        // Ağ gecikmesini simüle etmek için 2.5 saniye bekletiyoruz
        await delay(2500);

        const openaiText = `[Güvenlik Protokolü Raporu]\nKonu: ${topic}\n\nDeğerlendirme: Bu senaryoda yapısal bütünlük tehlikeye girebilir. Veri akışını 3 katmanlı bir doğrulama süzgecinden geçirerek, kapalı devre bir sistem kurmamız en güvenli yaklaşım olacaktır.`;

        const claudeText = `[Etik ve Gizlilik Raporu]\nKonu: ${topic}\n\nDeğerlendirme: Kullanıcı verilerinin anonimleştirilmesi kritik bir şarttır. Sistemin her adımında şeffaf olmalı ve üçüncü parti erişimlerini engellemeliyiz.`;

        const geminiText = `[Performans Raporu]\nKonu: ${topic}\n\nDeğerlendirme: Sürtünmesiz bir deneyim şart. Arayüzde gecikme yaşatmadan arka planda işlemleri tamamlayacak asenkron bir akış tasarlamalıyız.`;

        // Ortak karar öncesi 1 saniye daha düşünme
        await delay(1000);

        const masterTitle = "Asenkron Şifreli Katman Protokolü";
        const masterDecision = `SENTEZLENMİŞ ORTAK KARAR (KONSENSÜS)\n\nGündem: ${topic}\n\nStrateji:\n1. 3 Katmanlı kapalı devre doğrulama kurulacak (OpenAI).\n2. Tam veri şifrelemesi yapılacak (Claude).\n3. Tüm işlemler asenkron hızda yapılacak (Gemini).\n\n-> Operasyon API üzerinden sentezlendi. Lütfen paneli kullanarak onay verin.`;

        console.log(`[SİSTEM] Analiz tamamlandı. Veriler frontend'e gönderiliyor.`);

        res.json({
            openai: openaiText,
            claude: claudeText,
            gemini: geminiText,
            masterTitle: masterTitle,
            masterDecision: masterDecision
        });

    } catch (error) {
        console.error("Sunucu Hatası:", error);
        res.status(500).json({ error: "Sistemde bir arıza meydana geldi." });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 DEMO API AKTİF: Sunucu http://localhost:${PORT} adresinde çalışıyor.`);
    console.log(`HTML dosyasını tarayıcıda açıp test edebilirsiniz.`);
});
