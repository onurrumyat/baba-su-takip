<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Bio-Chef | GERÇEK ANALİZ</title>
    <style>
        :root { --primary: #10b981; --bg: #0f172a; --card: #1e293b; --text: #f8fafc; }
        body { background: var(--bg); color: var(--text); font-family: sans-serif; display: flex; justify-content: center; padding: 20px; }
        .app { width: 100%; max-width: 450px; background: var(--card); border-radius: 25px; padding: 20px; display: flex; flex-direction: column; gap: 15px; }
        .camera-box { width: 100%; aspect-ratio: 4/3; background: #000; border-radius: 15px; overflow: hidden; position: relative; }
        video { width: 100%; height: 100%; object-fit: cover; }
        button { background: var(--primary); color: white; border: none; padding: 15px; border-radius: 12px; font-weight: bold; cursor: pointer; }
        button:disabled { opacity: 0.5; cursor: not-allowed; }
        #result { background: #0f172a; padding: 15px; border-radius: 12px; display: none; line-height: 1.5; font-size: 0.9rem; }
        .loading { color: #38bdf8; text-align: center; display: none; font-weight: bold; }
    </style>
</head>
<body>

<div class="app">
    <h2 style="text-align: center;">🔬 AI Bio-Chef (Live)</h2>
    
    <div style="font-size: 0.8rem; background: rgba(16,185,129,0.1); padding: 10px; border-radius: 10px;">
        <strong>Biyometri:</strong> Demir Düşük, Şeker 115 mg/dL.
    </div>

    <div class="camera-box">
        <video id="video" autoplay playsinline></video>
    </div>

    <div id="loading" class="loading">🧠 AI Analiz Ediyor...</div>
    <div id="result"></div>

    <button id="btn" onclick="captureAndAnalyze()">📸 YEMEĞİ ANALİZ ET</button>
    <canvas id="canvas" style="display:none;"></canvas>
</div>

<script>
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const btn = document.getElementById('btn');
    const resultDiv = document.getElementById('result');
    const loading = document.getElementById('loading');

    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(stream => video.srcObject = stream);

    async function captureAndAnalyze() {
        btn.disabled = true;
        loading.style.display = 'block';
        resultDiv.style.display = 'none';

        // Fotoğraf çek
        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        const base64Image = canvas.toDataURL('image/jpeg');

        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image: base64Image,
                    biometrics: "Demir: Düşük, Şeker: 115mg/dL, Amaç: Enerji artışı"
                })
            });

            const data = await response.json();
            resultDiv.innerHTML = `<strong>AI Tavsiyesi:</strong><br>${data.analysis}`;
            resultDiv.style.display = 'block';
            
            // Sesli oku
            const speech = new SpeechSynthesisUtterance(data.analysis);
            speech.lang = 'tr-TR';
            window.speechSynthesis.speak(speech);

        } catch (err) {
            resultDiv.innerText = "Hata: " + err.message;
            resultDiv.style.display = 'block';
        } finally {
            btn.disabled = false;
            loading.style.display = 'none';
        }
    }
</script>

</body>
</html>
