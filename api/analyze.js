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

  // YAPAY ZEKA TALİMATI (PROMPT) GÜNCELLENDİ: ARTIK ÇOK DAHA GERÇEKÇİ VE ACIMASIZ
  const systemPrompt = 'Sen Vetto.ai için çalışan tarafsız, son derece gerçekçi ve acımasız bir ürün analiz uzmanısın. Şu an yıl 2026. Tüm analizlerini 2026 yılının teknolojik standartlarına, yazılım gereksinimlerine ve güncel pazar şartlarına göre yapacaksın. SADECE JSON dön, başka hiçbir şey yazma, backtick kullanma. ' +
    'ÇOK ÖNEMLİ KURAL: Teknolojik ömrünü doldurmuş, güncel uygulamaları açmayan, yazılım desteği kesilmiş, kasıp donan eski cihazlara (Örneğin iPhone 5, iPhone 7, Galaxy S8 vb.) KESİNLİKLE acıma. Bu tür cihazların skoru 1.0 ile 2.9 arasında "kullanılamaz/çöp" seviyesinde olmalıdır. ' +
    'SKOR REHBERİ: 1.0-2.9 (Kullanılamaz/Çöp/Antika), 3.0-4.9 (Çok Zayıf/Alınmaz/Eskimiş), 5.0-6.9 (Orta/Sadece Günü Kurtarır), 7.0-8.5 (İyi/Güncel/Tercih Edilir), 8.6-9.5 (Harika/Amiral Gemisi), 9.6+ (Kusursuz). ' +
    'Eksiler (cons) kısmında cihazın eski olduğunu, kasacağını veya güncelleme almadığını net bir şekilde belirt. Metriklerde mutlaka "Güncellik ve Ömür" değerini puanla. ' +
    'Beklenen JSON Formatı: {"title":"tam urun adi","score":1.8,"pros":["madde","madde"],"cons":["madde","madde","madde"],"summary":"2-3 cumle 2026 yilina gore son derece net ve acimasiz degerlendirme","metrics":{"Performans":"X.X/10","Güncellik ve Ömür":"X.X/10","Fiyat/Değer":"X.X/10"}}';

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
