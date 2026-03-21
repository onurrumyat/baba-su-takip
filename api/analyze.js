// api/analyze.js
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { image, user_data } = req.body;

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
                        content: `Sen 'AI Bio-Chef' platformunun öncü beslenme mühendisi ve tıbbi analiz uzmanısın.
                        Kullanıcı Profili: ${user_data}.

                        Görevin: Kullanıcının gönderdiği yemek fotoğrafını (Vision) ve bu biyometrik verileri birleştirerek analiz etmek.
                        Cevabını mutlaka şu 4 başlık altında, net ve sıralı (1., 2., 3.) olarak ver:

                        1. YEMEK ANALİZİ VE KALORİ: Tabağın içindeki makro besinleri (Protein, Karbonhidrat, Yağ) ve tahmini kaloriyi Vision kullanarak hesapla.
                        2. KİŞİSEL SAĞLIK ETKİSİ: Bu yemeğin, kullanıcının mevcut yaşına, kilosuna ve biyometrik verilerine (örneğin kan şekeri veya demir durumu) etkisini muhakeme (reasoning) et.
                        3. KİLO VE HEDEF DURUMU: Bu yemeği yemek, kullanıcının belirlediği hedefe (Kilo Almak / Vermek / Korumak) uygun mu? Bu yemeğin vücut ağırlığına tahmini etkisi nedir?
                        4. ANLIK TAKTİKSEL TAVSİYE: Kullanıcıya eyleme dönüştürülebilir, samimi ama bilimsel bir tavsiye ver (Örn: 'Bunu ye ama yarısını bırak' veya 'Yanına limon sık').

                        Cevabın tıp jargonuna girmeden, net, eyleme dönüştürülebilir ve samimi olsun.`
                    },
                    {
                        role: "user",
                        content: [
                            { type: "text", text: "Bu benim yemeğim. Benim için analiz eder misin?" },
                            {
                                type: "image_url",
                                image_url: {
                                    url: image,
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
