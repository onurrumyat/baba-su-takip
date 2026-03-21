// api/analyze.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { image, biometrics } = req.body;

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
            content: `Sen bir AI Beslenme Mühendisisin. Kullanıcı verileri: ${biometrics}. Fotoğraftaki yemeği analiz et ve bu verilere göre kişisel tavsiye ver.`
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Bu yemeği analiz et." },
              { type: "image_url", image_url: { url: image } }
            ]
          }
        ]
      })
    });

    const data = await response.json();
    res.status(200).json({ analysis: data.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
