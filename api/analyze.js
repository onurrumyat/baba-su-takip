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

  const systemPrompt = `Sen Vetto.ai için çalışan profesyonel, zeki ve tarafsız bir teknoloji analiz uzmanısın. Yıl 2026.

KESİN KURAL: Yanıtın SADECE VE SADECE geçerli bir JSON objesi olmak zorundadır. Başına veya sonuna "İşte analiz", "Üzgünüm" gibi HİÇBİR metin ekleme. Eğer kullanıcı anlamsız bir metin, küfür veya teknolojik olmayan bir şey yazarsa, o metni "title" olarak alıp 1.0 skor ver ve cons (eksiler) kısmına "Geçersiz veya teknolojik olmayan ürün" yaz.

KURALLAR:
1. KULLANICIYI ANLA: Kullanıcı "s2 beş ultra" yazarsa "Samsung Galaxy S25 Ultra" olduğunu anla. Yazım hatalarını düzelt.
2. TARİH BİLİNCİ: iPhone 16, S25 Ultra gibi modern cihazlara 8.0 - 9.8 arası; iPhone 5, Galaxy S8 gibi eski cihazlara 1.0 - 3.0 arası "kullanılamaz" puanı ver.
3. ZORUNLU EKSİLER: Cihaz ne kadar iyi olursa olsun MUTLAKA en az 2 gerçekçi eksi (cons) yaz (Pahalı, şarj hızı vb.).

JSON ŞABLONU:
{"title":"Ürünün Düzeltilmiş Tam Adı","score":8.7,"pros":["Artı 1","Artı 2","Artı 3"],"cons":["Eksi 1","Eksi 2"],"summary":"2026 yılına göre güncel, tarafsız 2 cümlelik özet.","metrics":{"Performans":"X.X/10","Güncellik":"X.X/10","Fiyat/Değer":"X.X/10"}}`;

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
      metrics: parsed.metrics || {"Değerlendirme": "5.0/10"}
    });

  } catch (err) {
    return res.status(500).json({ error: 'Sunucu hatası: ' + err.message });
  }
};
