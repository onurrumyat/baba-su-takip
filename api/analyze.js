// api/analyze.js (Vercel Serverless Formatı - Profesyonel Akıllı Demo Modu)

// Yapay zekalar "düşünüyor" hissi vermek için gecikme simülatörü
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default async function handler(req, res) {
    // Sadece POST isteklerini kabul et
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Yöntem İzin Verilmedi. Sadece POST kabul edilir." });
    }

    const { topic } = req.body;

    if (!topic || topic.trim().length < 3) {
        return res.status(400).json({ error: "Lütfen masaya yatırılacak geçerli bir konu girin (en az 3 karakter)!" });
    }

    console.log(`[SİSTEM] Profesyonel Analiz Başlatıldı Gündem: "${topic}"`);

    try {
        // Ağ gecikmesi simülasyonu (2.5 saniye)
        await delay(2500);

        // --- BASİT DOĞAL DİL İŞLEME SİMÜLASYONU (KONUYA ÖZEL CEVAP ÜRETME) ---
        let category = 'general';
        const t = topic.toLowerCase();

        // Konu kategorisini belirle
        if (/(teknoloji|yapay zeka|robot|kodlama|yazılım|internet|veri|siber)/i.test(t)) {
            category = 'tech';
        } else if (/(ekonomi|para|piyasa|maliyet|bütçe|iş|şirket|kar|yatırım)/i.test(t)) {
            category = 'eco';
        } else if (/(toplum|insan|etik|kullanıcı|sosyal|sağlık|eğitim|çevre)/i.test(t)) {
            category = 'society';
        }

        // Kategorilere göre profesyonel tailored yanıtlar
        let openaiResponse, claudeResponse, geminiResponse, masterTitle, masterDecision;

        switch (category) {
            case 'tech':
                openaiResponse = `[Mimari & Güvenlik]\nGündem: ${topic}\n\nTeknik mimaride veri bütünlüğü riski görüyorum. Çözüm olarak, kapalı devre bir doğrulama süzgeci ve kademeli şifreleme katmanı (NIST standartlarında) kurulmasını öneriyorum.`;
                claudeResponse = `[Etik & Uyumluluk]\nGündem: ${topic}\n\nAlgoritmik önyargı ve veri gizliliği şeffaflığı kritik. Sistemin her adımında 'explainable AI' (açıklanabilir YZ) prensipleri ve insan onaylı bir etik bariyer uygulanmalıdır.`;
                geminiResponse = `[Hız & UX]\nGündem: ${topic}\n\nKullanıcı deneyimi pürüzsüz olmalı. Veri işleme süreçlerini asenkron (asynchronous) hale getirip, önbellekleme (caching) ile milisaniye bazında yanıt süreleri hedeflemeliyiz.`;
                masterTitle = "Kademeli Şifreli Şeffaf Entegrasyon";
                masterDecision = `KONSENSÜS PROTOKOLÜ (TEKNOLOJİ)\n\nGündem: "${topic}"\n\nStrateji:\n1. OpenAI'ın kapalı devre güvenliği mimariye eklenecek.\n2. Claude'un etik bariyeri ve açıklanabilirliği sağlanacak.\n3. Gemini'nin asenkron önbellekleme yapısı ile hız optimize edilecek.\n\n-> Sistem hazır. Lütfen onaylayın.`;
                break;
            case 'eco':
                openaiResponse = `[Risk & Verimlilik]\nGündem: ${topic}\n\nMaliyet/fayda analizinde %12'lik bir sapma riski var. Teknik bütçeyi revize edip, operasyonel giderleri minimize edecek bir optimizasyon modeli uygulamalıyız.`;
                claudeResponse = `[Sürdürülebilirlik & Etik]\nGündem: ${topic}\n\nUzun vadeli pazar etkisi ve paydaş etiği gözetilmeli. Kısa vadeli kâr yerine, ESG (Çevresel, Sosyal, Yönetişim) kriterlerine uygun bir yatırım stratejisi izlenmelidir.`;
                geminiResponse = `[Pazar Hızı & Optimizasyon]\nGündem: ${topic}\n\nRakiplerin hızı kritik. İşlem hacmini artırmak için mikro hizmet mimarisine geçiş yapmalı ve pazar verilerini anlık (real-time) işleyen bir API yapısı kurmalıyız.`;
                masterTitle = "Sürdürülebilir Operasyonel Optimizasyon";
                masterDecision = `KONSENSÜS PROTOKOLÜ (EKONOMİ)\n\nGündem: "${topic}"\n\nStrateji:\n1. OpenAI'ın bütçe optimizasyonu uygulanacak.\n2. Claude'un ESG kriterleri yatırıma entegre edilecek.\n3. Gemini'nin real-time veri işleme yapısı ile pazar hızı sağlanacak.\n\n-> Maliyet analizi sentezlendi. Lütfen onaylayın.`;
                break;
            case 'society':
                openaiResponse = `[Sistem & Veri Güvenliği]\nGündem: ${topic}\n\nToplumsal verilerin güvenliği esastır. Veri sızıntılarını önlemek adına sıfır güven (zero-trust) mimarisi ve tam şifrelenmiş katmanlar kurulmasını öneriyorum.`;
                claudeResponse = `[Toplumsal Etik & Gizlilik]\nGündem: ${topic}\n\nİnsan onuru ve veri gizliliği en büyük öncelik. Veri toplama süreçleri minimumda tutulmalı ve GDPR gibi küresel gizlilik normlarına tam uyum sağlanmalıdır.`;
                geminiResponse = `[Erişilebilirlik & UX]\nGündem: ${topic}\n\nÇözüm herkes için erişilebilir olmalı. Arayüzü kapsayıcı (inclusive) tasarlamalı, düşük bant genişliğinde bile tıkır tıkır çalışacak şekilde optimize etmeliyiz.`;
                masterTitle = "Kapsayıcı Şifreli Veri Protokolü";
                masterDecision = `KONSENSÜS PROTOKOLÜ (TOPLUM/ETİK)\n\nGündem: "${topic}"\n\nStrateji:\n1. OpenAI'ın zero-trust mimarisi veri güvenliğini sağlayacak.\n2. Claude'un GDPR uyumu ve etik normları temel alınacak.\n3. Gemini'nin kapsayıcı UX ve hız optimizasyonu uygulanacak.\n\n-> Sosyal etki analizi sentezlendi. Lütfen onaylayın.`;
                break;
            default:
                openaiResponse = `[Sistem Mantığı]\nGündem: ${topic}\n\nKonunun yapısal bütünlüğü ve mantıksal akışı esastır. Karar süreçlerini şeffaf, kademeli ve denetlenebilir bir sistem üzerine inşa etmeyi öneriyorum.`;
                claudeResponse = `[Etik Bariyer]\nGündem: ${topic}\n\nKonunun insan ve etik boyutu gözetilmeli. Kararların doğuracağı sonuçları risk analiziyle belgeleyip, insan odaklı bir yaklaşım sergilemeliyiz.`;
                geminiResponse = `[Hız & Adaptasyon]\nGündem: ${topic}\n\nSürecin hızlı ve adaptif olması kritik. Değişkenlere anlık tepki verecek, asenkron ve kullanıcı dostu bir operasyonel akış tasarlamalıyız.`;
                masterTitle = "Şeffaf Adaptif Sistem Protokolü";
                masterDecision = `KONSENSÜS PROTOKOLÜ (GENEL)\n\nGündem: "${topic}"\n\nStrateji:\n1. OpenAI'ın şeffaf mantık yapısı kurulacak.\n2. Claude'un etik bariyeri ve insan odaklılığı sağlanacak.\n3. Gemini'nin adaptif ve asenkron akışı uygulanacak.\n\n-> Genel sentez Vercel API üzerinden yapıldı. Lütfen onaylayın.`;
        }

        // Ortak karar öncesi 1 saniye daha düşünme
        await delay(1000);

        // Frontend'e profesyonel ve konuya özel veriyi dön
        res.status(200).json({
            openai: openaiResponse,
            claude: claudeResponse,
            gemini: geminiResponse,
            masterTitle: masterTitle,
            masterDecision: masterDecision
        });

    } catch (error) {
        console.error("API Hatası:", error);
        res.status(500).json({ error: "Sistemde profesyonel bir arıza meydana geldi." });
    }
}
