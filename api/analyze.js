module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = req.body || {};
  const product = body.product;
  if (!product || typeof product !== 'string' || product.trim().length < 2) {
    return res.status(400).json({ error: 'Gecerli bir urun adi girin.' });
  }

  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API anahtari eksik.' });

  const systemPrompt = 'Sen Vetto.ai icin tarafsiz bir urun analiz uzmanisın. 2025-2026 kosullarina gore analiz yap. SADECE JSON don, baska hicbir sey yazma, backtick kullanma. ' +
    'SKOR REHBERI: 1-3 cok kotu, 3-5 zayif, 5-6.5 orta, 6.5-7.5 iyi ama kusurlu, 7.5-8.5 cok iyi, 8.5-9.5 mukemmel, 9.5+ neredeyse kusursuz (cok nadir). ' +
    'Her urun GERCEKCI ve FARKLI skor almali. Eski/ucuz urunler dusum skor alir. ' +
    'ZAMAN FARKINDASI OL: Eger urun eskide iyiydi ama simdi rakipler gecti, islemci eskidi, yazilim destegi kesildi veya fiyati artik degerini karsilamiyorsa bunu yansit. Eski yorumlar iyi yeni yorumlar kotu ise bunu summary ve cons icinde belirt. ' +
    'Metrikler birbirinden cok farkli olabilir (orn performans 9.0 iken fiyat/deger 4.5). ' +
    'JSON: {"title":"tam urun adi","score":6.2,"pros":["madde","madde","madde","madde"],"cons":["madde","madde","madde"],"summary":"2-3 cumle guncel degerlendirme, eski vs yeni durum, tavsiye edilip edilmedigi","metrics":{"Performans":"X.X/10","Fiyat/Deger":"X.X/10","Tasarim":"X.X/10"}}';

  try {
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1200,
        system: systemPrompt,
        messages: [{ role: 'user', content: 'Urun: ' + product.trim() }]
      })
    });

    if (!claudeRes.ok) {
      const errBody = await claudeRes.text();
      console.error('Claude API hatasi:', claudeRes.status, errBody);
      return res.status(502).json({ error: 'Analiz servisi yanit vermiyor.' });
    }

    const claudeData = await claudeRes.json();
    const items = claudeData && claudeData.content;
    const rawText = (items && items[0] && items[0].text) ? items[0].text.trim() : '';

    var jsonStr = rawText;
    var bm = jsonStr.match(/\{[\s\S]*\}/);
    if (bm) jsonStr = bm[0];

    var parsed;
    try { parsed = JSON.parse(jsonStr); }
    catch (e) {
      console.error('Parse hatasi:', rawText);
      return res.status(500).json({ error: 'Yanit islenemedi. Tekrar deneyin.' });
    }

    if (!parsed.title || typeof parsed.score !== 'number' || !Array.isArray(parsed.pros) || !Array.isArray(parsed.cons)) {
      return res.status(500).json({ error: 'Eksik veri. Tekrar deneyin.' });
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
    console.error('Hata:', err);
    return res.status(500).json({ error: 'Sunucu hatasi: ' + err.message });
  }
};
