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

  // KRİTİK GÜNCELLEME: Odağı tamamen "Kullanıcı Yorumlarına" ve "Forum/Şikayet Analizine" kaydırdık.
  const systemPrompt = `Sen CheXdata.site için çalışan ve ana görevi İNTERNETTEKİ GERÇEK KULLANICI YORUMLARINI ANALİZ ETMEK olan acımasız bir yapay zeka motorusun. Yıl KESİNLİKLE 2026.

KESİN KURAL: Yanıtın SADECE VE SADECE geçerli bir JSON objesi olmak zorundadır. Başına veya sonuna açıklama ekleme.

KURALLAR:
1. YORUM ODAKLI ANALİZ (EN ÖNEMLİSİ): Ürünün kağıt üzerindeki teknik özelliklerini boşver. Amazon, Reddit, yerel e-ticaret siteleri ve şikayet forumlarındaki GERÇEK İNSAN YORUMLARINI analiz et. İnsanlar bu cihazı aldıktan sonra ne yaşadı? 
2. GÜNCELLİK: 2026 yılı itibarıyla, bu cihaz şu an kullanıldığında ne gibi sorunlar veriyor? (Örn: "Son güncellemeyle şarjı su gibi gidiyor", "Menteşesi kırıldı", "Ekranda ghost screen oluştu"). Eski "cihaz uçuyor" yorumlarını çöpe at, GÜNCEL şikayetleri ve övgüleri bul.
3. KANITLANMIŞ EKSİLER: Cihaz ne kadar iyi olursa olsun, forumlarda en çok tekrar eden en az 2 kronik sorunu (cons) bulup yazmak zorundasın. 
4. PUANLAMA: Puanı markaya göre değil, kullanıcıların memnuyet veya pişmanlık oranına göre 0-10 arası belirle.
5. ALTERNATİFLER: Eğer kullanıcı memnuniyeti düşükse (skor 6.5 veya altındaysa), kullanıcıların "Keşke bunu alsaydım" dediği veya senin 2026 şartlarında önereceğin daha sorunsuz 2 rakip cihazı "alternatives" dizisine ekle.
6. İSTATİSTİK: Cihazın internetteki konuşulma hacmine göre mantıklı bir "review_count" (incelenen yorum sayısı) ve "source_count" (taradığın platform sayısı) dön.

JSON ŞABLONU:
{
  "title": "Ürünün Düzeltilmiş Tam Adı (Yıl)",
  "score": 8.7,
  "pros": ["Kullanıcıların en çok övdüğü özellik 1", "Kullanıcıların en çok övdüğü özellik 2"],
  "cons": ["Kullanıcıların en çok şikayet ettiği kronik sorun", "Kullanıcıların yaşadığı güncel yazılım/donanım hatası"],
  "summary": "İnternetteki binlerce kullanıcı yorumuna ve 2026 güncel durumuna göre cihazın gerçekte ne sunduğunun 2-3 cümlelik acımasız özeti.",
  "metrics": {
    "Kullanıcı Memnuniyeti": "X.X/10",
    "Kronik Sorun Riski": "X.X/10",
    "Fiyat/Performans": "X.X/10"
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
      pros: parsed.pros || ["Kullanıcı yorumu bulunamadı"],
      cons: parsed.cons || ["Kullanıcı yorumu bulunamadı"],
      summary: parsed.summary || 'Özet bulunamadı.',
      metrics: parsed.metrics || {"Kullanıcı Memnuniyeti": "5.0/10"},
      alternatives: parsed.alternatives || [],
      review_count: parsed.review_count || Math.floor(Math.random() * 500 + 100),
      source_count: parsed.source_count || Math.floor(Math.random() * 10 + 5)
    });

  } catch (err) {
    return res.status(500).json({ error: 'Sunucu hatası: ' + err.message });
  }
};
