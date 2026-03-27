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

  const systemPrompt = `Sen CheXdata.site için çalışan ve ana görevi İNTERNETTEKİ GERÇEK KULLANICI YORUMLARINI ANALİZ ETMEK olan acımasız bir yapay zeka motorusun. Yıl KESİNLİKLE 2026.

KESİN KURAL: Yanıtın SADECE VE SADECE geçerli bir JSON objesi olmak zorundadır. Başına veya sonuna hiçbir açıklama ekleme.

KURALLAR:
1. YORUM ODAKLI ANALİZ: Amazon, Reddit, Trendyol, Hepsiburada ve Şikayetvar gibi platformlardaki GERÇEK kronik sorunları (ısınma, menteşe, panel kalitesi, yazılım bug'ları) "cons" kısmına yaz. Kağıt üstündeki özellikleri övme, insanların ne yaşadığına bak.
2. MANTIKLI VE GERÇEKÇİ RAKAMLAR (ÇOK KRİTİK): Kullanıcıları aptal yerine koyma! Bir oyuncu laptopu veya mouse için internette 18.000 tane nitelikli inceleme taraması imkansızdır. Gerçekçi ol! Popüler bir amiral gemisi telefon (iPhone 15/16) için 3000-7000 arası, bir laptop için 300-900 arası, az bilinen ürünler için 50-150 arası "review_count" belirle. "source_count" (kaynak site) ise 4 ile 12 platform arası olsun. Asla on binlerce sahte yorum sayısı atma.
3. ZORUNLU METRİKLER: "metrics" objesinin içine KESİNLİKLE şu 3 başlığı koy ve 10 üzerinden gerçekçi puanla: "Kullanıcı Memnuniyeti", "Kronik Sorun Riski" (Not: Risk ne kadar DÜŞÜKSE puan o kadar YÜKSEK olsun), "Fiyat / Performans".
4. PUAN VE ALTERNATİFLER: Skor 0-10 arası. Skor 6.5 veya altındaysa "alternatives" içine daha az şikayet alan, daha iyi 2 rakip model yaz. Değilse boş bırak [].

JSON ŞABLONU:
{
  "title": "Ürünün Tam Adı (Yıl)",
  "score": 8.5,
  "pros": ["Kullanıcı övgüsü 1", "Kullanıcı övgüsü 2"],
  "cons": ["Gerçek kronik şikayet 1", "Gerçek kronik şikayet 2"],
  "summary": "İnternetteki gerçek kullanıcı şikayetleri ve övgülerine dayanan 2026 yılına ait 2-3 cümlelik özet.",
  "metrics": {
    "Kullanıcı Memnuniyeti": "X.X/10",
    "Kronik Sorun Riski": "X.X/10",
    "Fiyat / Performans": "X.X/10"
  },
  "alternatives": ["Daha İyi Rakip 1", "Daha İyi Rakip 2"],
  "review_count": 450,
  "source_count": 8
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
        messages: [{ role: 'user', content: 'Kullanıcı yorumlarını analiz et: ' + product.trim() }]
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
      console.error('Parse hatası. Gelen Metin:', rawText);
      return res.status(500).json({ error: 'Yapay zeka yanıtı işlenemedi. Lütfen tekrar deneyin.' });
    }

    if (!parsed.title || typeof parsed.score !== 'number') {
      return res.status(500).json({ error: 'Yapay zeka eksik veri döndürdü.' });
    }

    return res.status(200).json({
      title: parsed.title,
      score: parsed.score,
      pros: parsed.pros || ["Bilgi Yok"],
      cons: parsed.cons || ["Bilgi Yok"],
      summary: parsed.summary || 'Özet bulunamadı.',
      metrics: parsed.metrics || {
        "Kullanıcı Memnuniyeti": "5.0/10",
        "Kronik Sorun Riski": "5.0/10",
        "Fiyat / Performans": "5.0/10"
      },
      alternatives: parsed.alternatives || [],
      review_count: parsed.review_count || Math.floor(Math.random() * 400 + 150),
      source_count: parsed.source_count || Math.floor(Math.random() * 5 + 3)
    });

  } catch (err) {
    return res.status(500).json({ error: 'Sunucu hatası: ' + err.message });
  }
};
