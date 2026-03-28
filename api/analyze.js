// Gerekli kütüphaneleri dahil ediyoruz
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

require('dotenv').config(); // API keyleri .env dosyasından çekmek için

const app = express();
app.use(cors());
app.use(express.json());

// API İstemcilerini Başlatıyoruz (Kendi API Key'lerini .env dosyasına girmelisin)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/analyze', async (req, res) => {
    const { topic } = req.body;

    if (!topic) {
        return res.status(400).json({ error: "Konu (topic) eksik!" });
    }

    try {
        // 1. AŞAMA: 3 Yapay Zekaya Aynı Anda İstek Atıyoruz (Promise.all ile hız kazanıyoruz)
        const [openaiResponse, claudeResponse, geminiResponse] = await Promise.all([
            // OpenAI İstegi (Güvenlik ve Mantık Odaklı)
            openai.chat.completions.create({
                model: "gpt-4-turbo",
                messages: [
                    { role: "system", content: "Sen yönetim kurulunda güvenlik ve mimari uzmanı bir yapay zekasın. Kısa ve öz konuş." },
                    { role: "user", content: `Şu konuyu analiz et ve kısa bir öneri sun: ${topic}` }
                ]
            }),
            // Claude İstegi (Etik ve Detay Odaklı)
            anthropic.messages.create({
                model: "claude-3-opus-20240229",
                max_tokens: 300,
                system: "Sen yönetim kurulunda etik ve sürdürülebilirlik uzmanı bir yapay zekasın. Kısa ve öz konuş.",
                messages: [
                    { role: "user", content: `Şu konuyu analiz et ve kısa bir öneri sun: ${topic}` }
                ]
            }),
            // Gemini İstegi (Hız ve Kullanıcı Deneyimi Odaklı)
            genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" }).generateContent({
                contents: [{ role: "user", parts: [{ text: `Sen yönetim kurulunda kullanıcı deneyimi ve hız uzmanısın. Şu konuyu analiz et ve kısa, öz bir öneri sun: ${topic}` }] }]
            })
        ]);

        // Gelen yanıtları temiz metne çeviriyoruz
        const openaiText = openaiResponse.choices[0].message.content;
        const claudeText = claudeResponse.content[0].text;
        const geminiText = geminiResponse.response.text();

        // 2. AŞAMA: Ortak Karar Sentezi (Bunu OpenAI'a veya Claude'a yaptırabiliriz, burada OpenAI'a yaptırıyoruz)
        const consensusResponse = await openai.chat.completions.create({
            model: "gpt-4-turbo",
            messages: [
                { role: "system", content: "Sen yönetim kurulu başkanısın. Sana 3 farklı yapay zekanın analizi verilecek. Bunları birleştirip 'Ortak Karar' metni ve bu karar için kısa bir 'Protokol Başlığı' oluştur." },
                { role: "user", content: `Konu: ${topic}\n\nOpenAI: ${openaiText}\nClaude: ${claudeText}\nGemini: ${geminiText}\n\nLütfen bana şu formatta JSON dön: {"baslik": "...", "ortakKarar": "..."}` }
            ],
            response_format: { type: "json_object" } // Sadece JSON dönmesini zorluyoruz
        });

        const consensusData = JSON.parse(consensusResponse.choices[0].message.content);

        // 3. AŞAMA: Tüm verileri Frontend'e (Kullanıcıya) gönderiyoruz
        res.json({
            openai: openaiText,
            claude: claudeText,
            gemini: geminiText,
            masterTitle: consensusData.baslik,
            masterDecision: consensusData.ortakKarar
        });

    } catch (error) {
        console.error("API Hatası:", error);
        res.status(500).json({ error: "Yapay zekalarla iletişim kurulamadı." });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Yapay Zeka Komuta Merkezi Backend'i ${PORT} portunda çalışıyor.`));
