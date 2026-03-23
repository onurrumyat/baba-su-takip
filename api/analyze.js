// api/analyze.js
// Bio-Chef Pro — Food Analysis & Weekly Plan Endpoint
// ─────────────────────────────────────────────────────

const ALLOWED_MODES = [‘yemek’, ‘plan’];

const PROMPTS = {
plan: (user_data, lang) => ({
system: `Sen profesyonel bir diyetisyen ve beslenme uzmanısın. Kullanıcı profili: ${user_data}. Görevin: 7 günlük detaylı beslenme planı oluşturmak. Her gün için kahvaltı, öğle, akşam yemeği ve ara öğünleri kısa ve net şekilde yaz. Gereksiz açıklama yapma. ${lang === 'en' ? 'RESPOND IN ENGLISH.' : 'YANIT TÜRKÇE OLMALIDIR.'}`,
user: lang === ‘en’
? ‘Create a structured 7-day meal plan.’
: ‘7 günlük net beslenme planı çıkar.’,
}),

yemek: (user_data, lang) => ({
system: `Sen kıdemli bir gıda bilimcisi ve diyetisyensin.
Kullanıcı profili: ${user_data}.

KURALLAR:

- Görüntüdeki kişileri tamamen görmezden gel. Sadece gıdaya odaklan.
- Aşağıdaki formatı eksiksiz ve sırayla uygula. Başka bir format kullanma.

FORMAT:

1. HEDEF UYUM SKORU: Şu şablon ile başla: “[SKOR: X]” (X = 1-10). Ardından tek cümle açıklama.
1. AÇLIK KRONOMETRESİ ⏳: Glisemik indeks ve sindirim süresine göre tahmini acıkma süresi (saat/dakika).
1. ÜRÜN ÖZETİ: Gıdanın tam adı ve tahmini porsiyon miktarı.
1. BESİN DEĞERLERİ: Kalori (kcal) · Protein (g) · Karbonhidrat (g) · Yağ (g) — net rakamlar.
1. HEDEF ANALİZİ: Kullanıcı hedefine uygunluk değerlendirmesi.
1. NET TAVSİYE: Tüketim onayı ve profesyonel görüş.

${lang === ‘en’ ? ‘RESPOND IN ENGLISH.’ : ‘YANIT TÜRKÇE OLMALIDIR.’}`,
user: [
{ type: ‘text’, text: lang === ‘en’
? ‘Analyze the food. Provide the score and hunger duration.’
: ‘Gıdayı analiz et, skoru ve acıkma süresini ver.’ },
{ type: ‘image_url’, image_url: { url: ‘{IMAGE}’ } },
],
}),
};

export default async function handler(req, res) {
// ── Method guard ──────────────────────────────────────────
if (req.method !== ‘POST’) {
return res.status(405).json({ error: ‘Method Not Allowed’ });
}

// ── Input validation ──────────────────────────────────────
const { image, user_data, mode, lang = ‘tr’ } = req.body ?? {};

if (!ALLOWED_MODES.includes(mode)) {
return res.status(400).json({ error: ‘Geçersiz mod.’ });
}
if (!user_data || typeof user_data !== ‘string’) {
return res.status(400).json({ error: ‘Kullanıcı verisi eksik.’ });
}
if (mode === ‘yemek’ && !image) {
return res.status(400).json({ error: ‘Görüntü verisi eksik.’ });
}
if (!process.env.OPENAI_API_KEY) {
console.error(’[BioChef] OPENAI_API_KEY ortam değişkeni tanımlı değil.’);
return res.status(500).json({ error: ‘Sunucu yapılandırma hatası.’ });
}

// ── Build prompt ──────────────────────────────────────────
const prompt  = PROMPTS[mode](user_data, lang);
let userContent = prompt.user;

if (mode === ‘yemek’) {
// Inject actual image URL into the template
userContent = userContent.map(block =>
block.type === ‘image_url’
? { …block, image_url: { url: image } }
: block
);
}

// ── Call OpenAI ───────────────────────────────────────────
try {
const openaiRes = await fetch(‘https://api.openai.com/v1/chat/completions’, {
method: ‘POST’,
headers: {
‘Authorization’: `Bearer ${process.env.OPENAI_API_KEY}`,
‘Content-Type’:  ‘application/json’,
},
body: JSON.stringify({
model:       ‘gpt-4o’,
max_tokens:  900,
temperature: 0.1,
messages: [
{ role: ‘system’, content: prompt.system },
{ role: ‘user’,   content: userContent   },
],
}),
});

```
// ── Handle non-200 from OpenAI ─────────────────────────
if (!openaiRes.ok) {
  const errBody = await openaiRes.text();
  console.error('[BioChef] OpenAI API hatası:', openaiRes.status, errBody);
  return res.status(502).json({ error: 'Yapay zeka servisi yanıt vermedi.' });
}

const data     = await openaiRes.json();
const analysis = data?.choices?.[0]?.message?.content;

if (!analysis) {
  console.error('[BioChef] Beklenmeyen OpenAI yanıt yapısı:', JSON.stringify(data));
  return res.status(502).json({ error: 'Analiz sonucu alınamadı.' });
}

return res.status(200).json({ analysis });
```

} catch (err) {
console.error(’[BioChef] Sistem hatası:’, err);
return res.status(500).json({ error: ‘Sistem hatası. Lütfen tekrar deneyin.’ });
}
}