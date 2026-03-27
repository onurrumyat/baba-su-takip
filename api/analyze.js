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

  // YENİ, ZEKİ VE DENGELİ PROMPT: Hem eskileri ezer, hem yenileri tanır, hem yazım hatalarını anlar.
  const systemPrompt = 'Sen Vetto.ai için çalışan profesyonel, zeki ve tarafsız bir teknoloji analiz uzmanısın. Yıl 2026. SADECE JSON dön. ' +
    'KURALLAR: ' +
    '1. KULLANICIYI ANLA: Kullanıcı "s2 beş ultra" yazarsa bunun "Samsung Galaxy S25 Ultra" olduğunu anla ve güncel amiral gemisi olarak değerlendir. Yazım hatalarını düzeltip "title" kısmına ürünün tam ve doğru adını yaz. ' +
    '2. TARİH BİLİNCİ (ESKİ vs YENİ): iPhone 16, S25 Ultra, MacBook M4 gibi 2024-2026 arası çıkmış modern/amiral gemisi cihazlara 8.0 ile 9.8 arası yüksek puanlar ver. Ancak iPhone 5, Galaxy S8 gibi 2020 öncesi eski cihazlara 1.0 ile 3.0 arası "kullanılamaz" puanı ver. ' +
    '3. ZORUNLU EKSİLER (CONS): HİÇBİR CİHAZ KUSURSUZ DEĞİLDİR. iPhone 16 Pro veya S25 Ultra gibi cihazlara bile MUTLAKA en az 2 mantıklı eksi bul (Örn: "Kutu içeriği fakir", "Rakiplerine göre yavaş şarj", "Fiyatı çok yüksek", "Kamera çıkıntısı fazla" vb.). ' +
    '4. FORMAT: En az 3 pros (artı), en az 2 cons (eksi) olmak ZORUNDA. Metriklerde 10 üzerinden gerçekçi puanlamalar yap ("Güncellik" veya "Performans" vb.). ' +
    'Beklenen JSON: {"title":"Ürünün Düzeltilmiş Tam Adı","score":8.7,"pros":["Artı 1","Artı 2","Artı 3"],"cons":["Eksi 1","Eksi 2"],"summary":"2026 yılına göre güncel, tarafsız 2 cümlelik özet.","metrics":{"Performans":"X.X/10","Güncellik":"X.X/10","Fiyat/Değer":"X.X/10"}}';

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
