// api/analyze.js
// Vercel Serverless Function — POST /api/analyze
// Ortam değişkeni: CLAUDE_API_KEY (Vercel Dashboard > Settings > Environment Variables)

export default async function handler(req, res) {
// CORS
res.setHeader(‘Access-Control-Allow-Origin’, ‘*’);
res.setHeader(‘Access-Control-Allow-Methods’, ‘POST, OPTIONS’);
res.setHeader(‘Access-Control-Allow-Headers’, ‘Content-Type’);
if (req.method === ‘OPTIONS’) return res.status(200).end();

if (req.method !== ‘POST’) {
return res.status(405).json({ error: ‘Method not allowed’ });
}

const { product } = req.body || {};
if (!product || typeof product !== ‘string’ || product.trim().length < 2) {
return res.status(400).json({ error: ‘Geçerli bir ürün adı girin.’ });
}

const apiKey = process.env.CLAUDE_API_KEY;
if (!apiKey) {
return res.status(500).json({ error: ‘Sunucu yapılandırma hatası: API anahtarı eksik.’ });
}

const systemPrompt = `Sen Vetto.ai için çalışan bir uzman ürün analiz asistanısın.
Kullanıcı bir ürün adı verir; sen o ürünü eksiksiz analiz eder ve YALNIZCA geçerli JSON dönersin.
Hiçbir şekilde markdown (backtick, başlık vb.) kullanma. Sadece ham JSON.

JSON şeması (tüm alanlar zorunlu):
{
“title”: “string — Ürünün tam resmi adı”,
“score”: number — 0.0 ile 10.0 arası ondalıklı Vetto skoru,
“pros”: [“string”, …] — 4 ila 6 madde, özlü Türkçe,
“cons”: [“string”, …] — 3 ila 5 madde, özlü Türkçe,
“summary”: “string — 2-3 cümle genel değerlendirme, Türkçe”,
“metrics”: {
“Performans”: “X/10”,
“Fiyat/Değer”: “X/10”,
“Tasarım”: “X/10”
}
}`;

const userPrompt = `Ürün: ${product.trim()}`;

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
messages: [{ role: ‘user’, content: userPrompt }],
}),
});

```
if (!claudeRes.ok) {
  const errBody = await claudeRes.text();
  console.error('Claude API error:', claudeRes.status, errBody);
  return res.status(502).json({ error: 'Claude API isteği başarısız oldu.' });
}

const claudeData = await claudeRes.json();
const rawText = claudeData?.content?.[0]?.text || '';

// Güvenli JSON parse
let parsed;
try {
  // Eğer model yanlışlıkla backtick sarmalı döndürürse temizle
  const cleaned = rawText.replace(/```json|```/g, '').trim();
  parsed = JSON.parse(cleaned);
} catch (parseErr) {
  console.error('JSON parse hatası:', rawText);
  return res.status(500).json({ error: 'Yanıt işlenemedi. Lütfen tekrar deneyin.' });
}

// Temel doğrulama
const { title, score, pros, cons, summary, metrics } = parsed;
if (!title || typeof score !== 'number' || !Array.isArray(pros) || !Array.isArray(cons)) {
  return res.status(500).json({ error: 'Eksik analiz verisi döndü. Tekrar deneyin.' });
}

return res.status(200).json({ title, score, pros, cons, summary: summary || '', metrics: metrics || {} });
```

} catch (err) {
console.error(‘İşlenmeyen hata:’, err);
return res.status(500).json({ error: ‘Beklenmeyen sunucu hatası.’ });
}
}