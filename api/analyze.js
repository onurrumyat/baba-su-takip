// api/analyze.js
export default async function handler(req, res) {
res.setHeader(‘Access-Control-Allow-Origin’, ‘*’);
res.setHeader(‘Access-Control-Allow-Methods’, ‘POST, OPTIONS’);
res.setHeader(‘Access-Control-Allow-Headers’, ‘Content-Type’);
if (req.method === ‘OPTIONS’) return res.status(200).end();
if (req.method !== ‘POST’) return res.status(405).json({ error: ‘Method not allowed’ });

const { product } = req.body || {};
if (!product || typeof product !== ‘string’ || product.trim().length < 2) {
return res.status(400).json({ error: ‘Geçerli bir ürün adı girin.’ });
}

const apiKey = process.env.CLAUDE_API_KEY;
if (!apiKey) {
return res.status(500).json({ error: ‘API anahtarı eksik.’ });
}

const systemPrompt = `Sen bir ürün analiz uzmanısın. Kullanıcının verdiği ürünü analiz et.
SADECE aşağıdaki formatta düz JSON döndür. Başka hiçbir şey yazma, açıklama yapma, backtick kullanma.

{“title”:“string”,“score”:7.5,“pros”:[“madde”,“madde”,“madde”,“madde”],“cons”:[“madde”,“madde”,“madde”],“summary”:“string”,“metrics”:{“Performans”:“8.0/10”,“Fiyat/Değer”:“7.0/10”,“Tasarım”:“8.5/10”}}

Kurallar:

- title: ürünün tam adı
- score: 0.0 ile 10.0 arası sayı (number)
- pros: 4-5 kısa Türkçe madde
- cons: 3-4 kısa Türkçe madde
- summary: 2 cümle Türkçe genel değerlendirme
- metrics: tam olarak bu 3 anahtar, “X.X/10” formatı`;
  
  try {
  const claudeRes = await fetch(‘https://api.anthropic.com/v1/messages’, {
  method: ‘POST’,
  headers: {
  ‘Content-Type’: ‘application/json’,
  ‘x-api-key’: apiKey,
  ‘anthropic-version’: ‘2023-06-01’,
  },
  body: JSON.stringify({
  model: ‘claude-sonnet-4-20250514’,
  max_tokens: 1024,
  system: systemPrompt,
  messages: [{ role: ‘user’, content: `Ürün: ${product.trim()}` }],
  }),
  });
  
  if (!claudeRes.ok) {
  const errBody = await claudeRes.text();
  console.error(‘Claude API hatası:’, claudeRes.status, errBody);
  return res.status(502).json({ error: ‘Analiz servisi yanıt vermiyor.’ });
  }
  
  const claudeData = await claudeRes.json();
  const rawText = (claudeData?.content?.[0]?.text || ‘’).trim();
  
  // Robust JSON extraction
  let jsonStr = rawText;
  
  // 1) `json ... ` veya `...` varsa içini al
  const fenceMatch = rawText.match(/`(?:json)?\s*([\s\S]*?)`/i);
  if (fenceMatch) jsonStr = fenceMatch[1].trim();
  
  // 2) İlk { ile son } arasını al
  const braceMatch = jsonStr.match(/{[\s\S]*}/);
  if (braceMatch) jsonStr = braceMatch[0];
  
  let parsed;
  try {
  parsed = JSON.parse(jsonStr);
  } catch (parseErr) {
  console.error(‘JSON parse hatası. Ham yanıt:’, rawText);
  return res.status(500).json({ error: ‘Yanıt işlenemedi. Lütfen tekrar deneyin.’ });
  }
  
  const { title, score, pros, cons, summary, metrics } = parsed;
  
  if (!title || typeof score !== ‘number’ || !Array.isArray(pros) || !Array.isArray(cons)) {
  console.error(‘Eksik alan:’, parsed);
  return res.status(500).json({ error: ‘Eksik analiz verisi. Tekrar deneyin.’ });
  }
  
  return res.status(200).json({
  title,
  score,
  pros,
  cons,
  summary: summary || ‘’,
  metrics: metrics || {}
  });
  
  } catch (err) {
  console.error(‘Beklenmeyen hata:’, err);
  return res.status(500).json({ error: ’Sunucu hatası: ’ + err.message });
  }
  }