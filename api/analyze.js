import { OpenAI } from "openai";

// Vercel'deki şifreli anahtarı çağırıyoruz
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Sadece POST istekleri kabul edilir.' });
  }

  try {
    const { image } = req.body; // Base64 formatında gelen fotoğraf

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Vision yeteneği olan en güçlü model
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Bir ev tamirat uzmanı gibi davran. Bu fotoğraftaki arızayı teşhis et. Gereken parçaları listele ve Türkiye için işçilik dahil tahmini TL fiyat aralığı ver. Yanıtı kısa ve net maddelerle ver." },
            {
              type: "image_url",
              image_url: { "url": image }, // Base64 verisi buraya gelir
            },
          ],
        },
      ],
    });

    res.status(200).json({ result: response.choices[0].message.content });
  } catch (error) {
    console.error("Hata:", error);
    res.status(500).json({ error: "Analiz sırasında bir hata oluştu." });
  }
}
