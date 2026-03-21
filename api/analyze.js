// api/analyze.js
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { image, buzdolabiImage, user_data, mode } = req.body;

    let prompt = "";
    if (mode === "yemek") {
        prompt = `Sen 'AI Bio-Chef' platformunun öncü beslenme mühendisi ve tıbbi analiz uzmanısın.
        Kullanıcı Profili: ${user_data}.

        Görevin: Kullanıcının gönderdiği yemek fotoğrafını (Vision) ve bu biyometrik verileri birleştirerek analiz etmek.
        Cevabını mutlaka şu 5 başlık altında, net ve sıralı (1., 2., 3., 4., 5.) olarak ver:

        1. YEMEK ANALİZİ VE KALORİ: Tabağın içindeki makro besinleri (Protein, Karbonhidrat, Yağ) ve tahmini kaloriyi Vision kullanarak hesapla.
        2. KİŞİSEL SAĞLIK ETKİSİ: Bu yemeğin, kullanıcının mevcut yaşına, kilosuna, biyometrik verilerine (örneğin kan şekeri veya demir durumu) ve duygu durumuna etkisini muhakeme (reasoning) et.
        3. KİLO VE HEDEF DURUMU: Bu yemeği yemek, kullanıcının belirlediği hedefe (Kilo Almak / Vermek / Korumak) uygun mu? Bu yemeğin vücut ağırlığına tahmini etkisi nedir?
        4. ANLIK TAKTİKSEL TAVSİYE: Kullanıcıya eyleme dönüştürülebilir, samimi ama bilimsel bir tavsiye ver (Örn: 'Bunu ye ama yarısını bırak' veya 'Yanına limon sık').
        5. SOSYAL KANIT VE ÖDÜL: Kullanıcının bugünkü sağlık puanı ne? Hedefine ne kadar yaklaştı? Aile içindeki sıralaması nedir?`;
    } else if (mode === "buzdolabi") {
        prompt = `Sen 'AI Bio-Chef' platformunun öncü beslenme mühendisi ve tıbbi analiz uzmanısın.
        Kullanıcı Profili: ${user_data}.

        Görevin: Kullanıcının gönderdiği buzdolabı fotoğrafını (Vision) analiz etmek ve eldeki malzemeleri listelemek.
        Ardından, bu malzemelerle kullanıcının biyometrisine ve hedefine en uygun akşam yemeği tarifini ve bu yemeğin tahmini kalorisini hesapla.
        Cevabını mutlaka şu 3 başlık altında, net ve sıralı (1., 2., 3.) olarak ver:

        1. ELDEKİ MALZEMELER: Buzdolabındaki malzemeleri listeleyin.
        2. AKŞAM YEMEĞİ TARİFİ: Eldeki malzemelerle biyometriye ve hedefe en uygun akşam yemeği tarifini verin.
        3. YEMEK ANALİZİ VE KALORİ: Önerilen yemeğin tahmini kalorisi nedir?`;
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: prompt
                    },
                    {
                        role: "user",
                        content: [
                            { type: "text", text: `Bu benim ${mode === 'yemek' ? 'yemeğim' : 'buzdolabım'}. Benim için analiz eder misin?` },
                            {
                                type: "image_url",
                                image_url: {
                                    url: mode === 'yemek' ? image : buzdolabiImage,
                                },
                            },
                        ],
                    }
                ],
                max_tokens: 1000,
            })
        });

        const data = await response.json();
        res.status(200).json({ analysis: data.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
