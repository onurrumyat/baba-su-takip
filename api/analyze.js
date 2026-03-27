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

  const systemPrompt = 'Sen Vetto.ai için tarafsız bir ürün analiz uzmanısın. 2025-2026 koşullarına göre analiz yap. SADECE JSON dön, başka hiçbir şey yazma, backtick kullanma. ' +
    'SKOR REHBERI: 1-3 çok kötü, 3-5 zayıf, 5-6.5 orta, 6.5-7.5 iyi ama kusurlu, 7.5-8.5 çok iyi, 8.5-9.5 mükemmel, 9.5+ neredeyse kusursuz (çok nadir). ' +
    'Her ürün GERÇEKÇİ ve FARKLI skor almalı. Eski/ucuz ürünler düşük skor alır. ' +
    'ZAMAN FARKINDASI OL: Eğer ürün eskide iyiydi ama şimdi rakipler geçti, işlemci eskidi, yazılım desteği kesildi veya fiyatı artık değerini karşılamıyorsa bunu yansıt. ' +
    'Metrikler birbirinden çok farklı olabilir (örn performans 9.0 iken fiyat/değer 4.5). ' +
    'Beklenen JSON Formatı: {"title":"tam urun adi","score":6.2,"pros":["madde","madde"],"cons":["madde","madde"],"summary":"2-3 cumle guncel degerlendirme","metrics":{"Performans":"X.X/10","Fiyat/Deger":"X.X/10","Tasarim":"X.X/10"}}';

  try {
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307', // 404 hatasını önleyen çalışan model!
        max_tokens: 1200,
        system: systemPrompt,
        messages: [{ role: 'user', content: 'Ürün: ' + product.trim() }]
      })
    });

    if (!claudeRes.ok) {
      const errBody = await claudeRes.text();
      console.error('Claude API hatası:', claudeRes.status, errBody);
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
      console.error('Parse hatası:', rawText);
      return res.status(500).json({ error: 'Yapay zeka yanıtı işlenemedi. Lütfen tekrar deneyin.' });
    }

    if (!parsed.title || typeof parsed.score !== 'number' || !Array.isArray(parsed.pros) || !Array.isArray(parsed.cons)) {
      return res.status(500).json({ error: 'Yapay zeka eksik veri döndürdü. Lütfen tekrar deneyin.' });
    }

    return res.status(200).json({
      title: parsed.title,
      score: parsed.score,
      pros: parsed.pros,
      cons: parsed.cons,
      summary: parsed.summary || '',
      metrics: parsed.metrics || {}
    });

  } catch (err) {
    console.error('Sunucu Hatası:', err);
    return res.status(500).json({ error: 'Sunucu hatası: ' + err.message });
  }
};
