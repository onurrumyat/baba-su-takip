// api/analyze.js
const axios = require('axios');

export default async function handler(req, res) {
  // Sadece POST isteklerine izin ver
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { product } = req.body;
    const apiKey = process.env.CLAUDE_API_KEY; // Vercel'deki gizli anahtarın

    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: `${product} ürünü hakkında internetteki genel kullanıcı yorumlarını analiz et. 
        Lütfen yanıtı SADECE aşağıdaki JSON formatında ver, başka metin ekleme:
        { "title": "Ürün Adı", "score": 10 üzerinden puan, "pros": ["artı1", "artı2"], "cons": ["eksi1", "eksi2"] }`
      }]
    }, {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      }
    });

    const content = response.data.content[0].text;
    const result = JSON.parse(content);

    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'AI Analiz Hatası' });
  }
}
