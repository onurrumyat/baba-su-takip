import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // Sadece POST isteklerine izin ver
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Yöntem İzin Verilmiyor. Lütfen POST kullanın.' });
  }

  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Görüntü verisi eksik.' });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: "Sen uzman bir ev tamirat asistanısın. Bu fotoğraftaki arızayı teşhis et, tamir için gereken parçaları listele ve Türkiye piyasası için (işçilik dahil) tahmini TL fiyat aralığı ver. Yanıtın kısa, profesyonel ve yardımcı olsun." 
            },
            {
              type: "image_url",
              image_url: { "url": image }, 
            },
          ],
        },
      ],
      max_tokens: 500,
    });

    return res.status(200).json({ result: response.choices[0].message.content });
  } catch (error) {
    console.error("OpenAI Hatası:", error);
    return res.status(500).json({ error: "Analiz başarısız oldu.", details: error.message });
  }
}
