// api/analyze.js
// Vercel Serverless Function — POST /api/analyze
// Gereken env değişkeni: CLAUDE_API_KEY

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
return res.status(500).json({ error: ‘Sunucu yapılandırma hatası: API anahtarı eksik.’ });
}

const systemPrompt = `Sen Vetto.ai için çalışan bir uzman ürün analiz asistanısın.
Kullanıcı bir ürün adı verir; sen o ürünü kapsamlı şekilde analiz eder ve YALNIZCA geçerli JSON dönersin.
Kesinlikle markdown (backtick, başlık, açıklama vb.) kullanma. Sadece saf JSON objesi döndür.

Zorunlu JSON şeması:
{
“title”: “Ürünün tam ve resmi adı”,
“score”: 7.4,
“pros”: [“madde1”, “madde2”, “madde3”, “madde4”, “madde5”],
“cons”: [“madde1”, “madde2”, “madde3”],
“summary”: “2-3 cümle genel değerlendirme.”,
“metrics”: {
“Performans”: “8.2/10”,
“Fiyat/Değer”: “7.0/10”,
“Tasarım”: “9.1/10”
}
}

Kurallar:

- score: 0.0-10.0 arası ondalıklı sayı (number tipinde, string değil)
- pros: 4-6 madde, kısa ve özlü Türkçe
- cons: 3-5 madde, kısa ve özlü Türkçe
- summary: Türkçe, 2-3 cümle
- metrics: tam olarak 3 anahtar, değer “X.X/10” formatında string`;
  
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
  return res.status(502).json({ error: ‘Analiz servisi şu an yanıt vermiyor.’ });
  }
  
  const claudeData = await claudeRes.json();
  const rawText = claudeData?.content?.[0]?.text || ‘’;
  
  let parsed;
  try {
  const cleaned = rawText.replace(/`json|`/gi, ‘’).trim();
  parsed = JSON.parse(cleaned);
  } catch {
  console.error(‘JSON parse hatası. Ham yanıt:’, rawText);
  return res.status(500).json({ error: ‘Yanıt işlenemedi. Lütfen tekrar deneyin.’ });
  }
  
  const { title, score, pros, cons, summary, metrics } = parsed;
  
  if (!title || typeof score !== ‘number’ || !Array.isArray(pros) || !Array.isArray(cons)) {
  return res.status(500).json({ error: ‘Eksik analiz verisi. Tekrar deneyin.’ });
  }
  
  return res.status(200).json({ title, score, pros, cons, summary: summary || ‘’, metrics: metrics || {} });
  
  } catch (err) {
  console.error(‘Beklenmeyen hata:’, err);
  return res.status(500).json({ error: ‘Beklenmeyen sunucu hatası.’ });
  }
  }