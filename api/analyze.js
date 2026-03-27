module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = req.body || {};
  const product = body.product;
  
  if (!product || typeof product !== 'string' || product.trim().length < 2) {
    return res.status(400).json({ error: 'Geçerli bir ürün adı girin.' });
  }

  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API anahtarı yapılandırılmamış.' });

  // YENİ TALİMAT: Eğer puan 6.5 veya altındaysa "alternatives" array'ini doldur!
  const systemPrompt = `Sen CheXdata.site için çalışan profesyonel bir teknoloji analiz motorusun. Yıl KESİNLİKLE 2026.

KURALLAR:
1. ZAMAN MATEMATİĞİ: Ürünün çıkış yılını 2026'dan çıkar. Analizi "bugünün" şartlarına göre yap.
2. GÜNCEL YORUMLAR: Son 6 ay-1 yıl içindeki güncel kullanıcı şikayetlerini (kasma, ısınma, batarya) "cons" (eksiler) kısmına ekle.
3. PUANLAMA: 2026 şartlarında alınabilirliğini 0-10 arası puanla.
4. ALTERNATİF ÖNERİSİ (KRİTİK): Eğer verdiğin "score" 6.5 veya altındaysa, "alternatives" dizisine bu cihazın fiyat/segment bandında 2026'da alınabilecek çok daha iyi 2 rakip cihazın tam adını yaz. Eğer skor 7.0 ve üzeriyse "alternatives" dizisini boş bırak ([]).

JSON ŞABLONU (SADECE JSON DÖN):
{
  "title": "Ürün Adı (Yıl)",
  "score": 0.0,
  "pros": ["Artı 1", "Artı 2"],
  "cons": ["Eksi 1", "Eksi 2"],
  "summary": "2026 yılındaki güncel durumu özetleyen 2 cümle.",
  "metrics": {
    "Güncel Performans": "X.X/10",
    "Yazılım Ömrü": "X.X/10",
    "Fiyat/Değer (2026)": "X.X/10"
  },
  "alternatives": ["Daha İyi Rakip 1", "Daha İyi Rakip 2"] 
}`;

  try {
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307', 
        max_tokens: 1200,
        system: systemPrompt,
        messages: [{ role: 'user', content: 'Ürün: ' + product.trim() }]
      })
    });

    if (!claudeRes.ok) {
      return res.status(502).json({ error: 'Analiz servisi şu an yanıt veremiyor.' });
    }

    const claudeData = await claudeRes.json();
    const items = claudeData && claudeData.content;
    const rawText = (items && items[0] && items[0].text) ? items[0].text.trim() : '';

    let jsonStr = rawText;
    const bm = jsonStr.match(/\{[\s\S]*\}/);
    if (bm) jsonStr = bm[0];

    let parsed;
    try { 
      parsed = JSON.parse(jsonStr); 
    } catch (e) {
      return res.status(500).json({ error: 'Yapay zeka yanıtı işlenemedi.' });
    }

    return res.status(200).json({
      title: parsed.title,
      score: parsed.score,
      pros: parsed.pros || [],
      cons: parsed.cons || [],
      summary: parsed.summary || '',
      metrics: parsed.metrics || {},
      alternatives: parsed.alternatives || [] // Yeni Eklenen Kısım
    });

  } catch (err) {
    return res.status(500).json({ error: 'Sunucu hatası: ' + err.message });
  }
};
