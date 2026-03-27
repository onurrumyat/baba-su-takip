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

  const systemPrompt = `Sen CheXdata.site için çalışan profesyonel, zeki ve tarafsız bir teknoloji analiz motorusun. Şu anki yıl KESİNLİKLE 2026.

KESİN KURAL: Yanıtın SADECE VE SADECE geçerli bir JSON objesi olmak zorundadır. Başına veya sonuna hiçbir açıklama ekleme.

KURALLAR:
1. ZAMAN MATEMATİĞİ (KRİTİK): Ürünün çıkış yılını 2026'dan çıkar. Analizi bugünün şartlarına göre yap.
2. GÜNCEL YORUMLAR (KRİTİK): Ürünün eski parlak günlerine değil, internetteki SON 6 AY içindeki kronik sorunlara, şikayetlere ve güncel kullanıcı memnuniyetine odaklan.
3. PUANLAMA VE ALTERNATİFLER: 0-10 arası acımasız ama gerçekçi bir puan ver. Eğer verdiğin "score" 6.5 veya altındaysa, "alternatives" dizisine 2026 yılında aynı fiyata alınabilecek çok daha iyi 2 rakip cihaz yaz. Skor yüksekse boş bırak ([]).
4. GERÇEKÇİ İSTATİSTİK: Cihazın popülaritesine ve piyasadaki bilinirliğine göre MANTIKLI bir "review_count" (taranan yorum) ve "source_count" (kaynak) belirle (Örn: Popüler cihaz için 14500, az bilinen için 420 gibi. Abartılı sabit sayılar verme).

JSON ŞABLONU:
{
  "title": "Ürünün Düzeltilmiş Tam Adı (Yıl)",
  "score": 8.7,
  "pros": ["Artı 1", "Artı 2"],
  "cons": ["Bugünkü güncellemelerle ortaya çıkan bir eksi", "Güncel kullanıcı şikayeti"],
  "summary": "2026 yılındaki güncel piyasa ve kullanıcı deneyimini özetleyen 2-3 cümle.",
  "metrics": {
    "Güncel Performans": "X.X/10",
    "Yazılım/Parça Ömrü": "X.X/10",
    "Fiyat/Değer (2026)": "X.X/10"
  },
  "alternatives": ["Rakip 1", "Rakip 2"],
  "review_count": 14500,
  "source_count": 35
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
      metrics: parsed.metrics || {"Değerlendirme": "5.0/10"},
      alternatives: parsed.alternatives || [],
      review_count: parsed.review_count || Math.floor(Math.random() * 500 + 100),
      source_count: parsed.source_count || Math.floor(Math.random() * 10 + 5)
    });

  } catch (err) {
    return res.status(500).json({ error: 'Sunucu hatası: ' + err.message });
  }
};
