module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const product = req.body?.product;
  if (!product || product.trim().length < 2) {
    return res.status(400).json({ error: 'Geçerli bir ürün adı girin.' });
  }

  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API anahtarı yapılandırılmamış.' });

  // YENİ TALİMAT: Güncel Kullanıcı Deneyimi ve Zaman Yolculuğu Analizi
  const systemPrompt = `Sen CheXdata.site için çalışan profesyonel bir teknoloji analiz motorusun. Yıl KESİNLİKLE 2026.

KURALLAR:
1. ZAMAN MATEMATİĞİ: Ürünün çıkış yılını 2026'dan çıkar. (Örn: iPhone 13 = 5 yıllık). Analizi "bugünün" şartlarına göre yap.
2. GÜNCEL KULLANICI YORUMLARI (KRİTİK): Ürünün ilk çıktığı yıllardaki yorumları ASLA baz alma. İnternetteki SON 6 AY ve SON 1 YIL içindeki kullanıcı geri bildirimlerini analiz et. 
   - Örn: Eskiden "çok hızlı" denilen bir cihaz için bugün kullanıcılar "WhatsApp bile donuyor", "Batarya yarım gün gitmiyor", "Uygulama desteği kesildi" diyorsa, EKSİLER (cons) kısmına bunları yaz.
3. DİNAMİK PUANLAMA: 2026 yılındaki bir kullanıcının o ürünü eline aldığında yaşayacağı gerçek hayal kırıklığını veya memnuniyetini puanla. 2015'in yıldızı, 2026'nın çöpü olabilir.
4. İKİNCİ EL NABZI: Kullanıcıların ikinci el alım-satım platformlarındaki güncel şikayetlerini (ekran sararması, ghost screen, kronik anakart arızaları) mutlaka analizine dahil et.

JSON ŞABLONU (SADECE JSON DÖN):
{
  "title": "Ürün Adı (Çıkış Yılı)",
  "score": 0.0,
  "pros": ["2026 itibarıyla hala geçerli olan artı", "Güncel bir kullanıcı avantajı"],
  "cons": ["Bugünkü güncellemelerle ortaya çıkan yavaşlama", "Güncel batarya/ekran sorunları"],
  "summary": "2026 yılındaki bir kullanıcı için bu cihazın bugün ne ifade ettiğine dair 2 cümlelik gerçekçi özet.",
  "metrics": {
    "Güncel Performans": "X.X/10",
    "Yazılım Ömrü": "X.X/10",
    "Fiyat/Değer (2026)": "X.X/10"
  }
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

    const claudeData = await claudeRes.json();
    const rawText = claudeData.content[0].text.trim();
    const jsonStr = rawText.match(/\{[\s\S]*\}/)[0];
    const parsed = JSON.parse(jsonStr);

    return res.status(200).json(parsed);

  } catch (err) {
    return res.status(500).json({ error: 'Sunucu hatası: ' + err.message });
  }
};
