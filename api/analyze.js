module.exports = async function handler(req, res) {
res.setHeader(‘Access-Control-Allow-Origin’, ‘*’);
res.setHeader(‘Access-Control-Allow-Methods’, ‘POST, OPTIONS’);
res.setHeader(‘Access-Control-Allow-Headers’, ‘Content-Type’);
if (req.method === ‘OPTIONS’) return res.status(200).end();
if (req.method !== ‘POST’) return res.status(405).json({ error: ‘Method not allowed’ });

const body = req.body || {};
const product = body.product;
if (!product || typeof product !== ‘string’ || product.trim().length < 2) {
return res.status(400).json({ error: ‘Gecerli bir urun adi girin.’ });
}

const apiKey = process.env.CLAUDE_API_KEY;
if (!apiKey) {
return res.status(500).json({ error: ‘API anahtari eksik.’ });
}

const systemPrompt = `Sen Vetto.ai icin calisan tarafsiz bir urun analiz uzmanisın. Gorevin kullanicinin belirttigi urunu 2025-2026 yili kosullarina gore derinlemesine analiz etmek.

ONEMLI KURALLAR:

1. Skoru GERCEKCI ver. Her urun farkli skor almali. Ucuz/eski/sorunlu urunler 3-5, orta segment 5-7, iyi urunler 7-8.5, mukemmel urunler 8.5-9.5 alabilir. Hicbir urun otomatik olarak 7-8 almaz.
1. GUNCEL DEGERLENDIRME: Urunu piyasaya ciktigi zamana gore degil, BUGUNUN kosullarina gore degerlendir. Eger urun 2-3 yil once iyiydi ama simdi daha iyi rakipler ciktiysa veya donanim eskidiyse bunu yansit. Islemci, batarya, kamera, yazilim destegi gibi konularda guncel karsilastirma yap.
1. ZAMAN FARKINDASI OL: Eger bir urunun eski yorumlari cok iyiydi ama yeni yorumlari kotu ise (orn: yazilim guncelleme sonrasi performans dususu, daha iyi rakip cikti, pil omru azaldi, destek kesildi) bunu pros/cons ve summary’de mutlaka belirt.
1. Sadece JSON don, markdown veya backtick kullanma.

Degerlendirme kriterleri:

- Performans: Gunumuz standartlarinda nasil? Rakiplere gore?
- Fiyat/Deger: 2025-2026 piyasa fiyatiyla deger yaratıyor mu?
- Tasarim: Hala modern mi, yoksa eskidi mi?
- Yazilim/Destek: Guncel yazilim aliyor mu, kac yil destek var?
- Kullanici deneyimi: Gercek kullanici sorunlari var mi?

JSON formati (sadece bunu don, baska hicbir sey yazma):
{“title”:“Urunun tam adi”,“score”:6.2,“pros”:[“madde1”,“madde2”,“madde3”,“madde4”],“cons”:[“madde1”,“madde2”,“madde3”],“summary”:“2-3 cumle. Urunun guncel durumunu, eski ile yeni yorumlar arasindaki farki ve gunumuz kosullarinda tavsiye edilip edilmedigini belirt.”,“metrics”:{“Performans”:“7.0/10”,“Fiyat/Deger”:“5.5/10”,“Tasarim”:“8.0/10”}}

Skor rehberi:

- 1-3: Cok kotu, kesinlikle tavsiye edilmez
- 3-5: Zayif, ciddi sorunlari var
- 5-6.5: Orta, alternatifleri dusun
- 6.5-7.5: Iyi ama kusurlu
- 7.5-8.5: Cok iyi, tavsiye edilir
- 8.5-9.5: Mukemmel, kendi segmentinin en iyisi
- 9.5+: Neredeyse kusursuz (cok nadir)

Metriklerdeki sayilar da gercekci olmali ve birbirinden farkli olabilir. Ornegin performans 9.0 iken fiyat/deger 4.5 olabilir.`;

try {
const claudeRes = await fetch(‘https://api.anthropic.com/v1/messages’, {
method: ‘POST’,
headers: {
‘Content-Type’: ‘application/json’,
‘x-api-key’: apiKey,
‘anthropic-version’: ‘2023-06-01’
},
body: JSON.stringify({
model: ‘claude-haiku-4-5-20251001’,
max_tokens: 1200,
system: systemPrompt,
messages: [{ role: ‘user’, content: ’Su urunu analiz et: ’ + product.trim() }]
})
});

```
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
```

} catch (err) {
console.error(‘Beklenmeyen hata:’, err);
return res.status(500).json({ error: ’Sunucu hatasi: ’ + err.message });
}
};