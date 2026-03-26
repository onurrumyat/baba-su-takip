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
  if (!apiKey) {
    return res.status(500).json({ error: 'API anahtari eksik.' });
  }

  const sys = [
    'Sen bir urun analiz uzmanisın.',
    'Kullanicinin verdigi urunu Turkce analiz et.',
    'SADECE asagidaki JSON formatinda yanit ver, baska hicbir sey yazma, markdown veya backtick kullanma.',
    '{"title":"string","score":7.5,"pros":["a","b","c","d"],"cons":["a","b","c"],"summary":"string","metrics":{"Performans":"8.0/10","Fiyat/Deger":"7.0/10","Tasarim":"8.5/10"}}',
    'score 0-10 arasi sayi olmali. pros 4-5 madde, cons 3-4 madde, summary 2 cumle.'
  ].join(' ');

  try {
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: sys,
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
      console.error('JSON parse hatasi:', rawText);
      return res.status(500).json({ error: 'Yanit islenemedi. Tekrar deneyin.' });
    }

    if (!parsed.title || typeof parsed.score !== 'number' || !Array.isArray(parsed.pros) || !Array.isArray(parsed.cons)) {
      return res.status(500).json({ error: 'Eksik analiz verisi. Tekrar deneyin.' });
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
    console.error('Beklenmeyen hata:', err);
    return res.status(500).json({ error: 'Sunucu hatasi: ' + err.message });
  }
};
