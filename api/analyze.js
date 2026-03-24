<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bio-Chef Pro | VIP Analiz</title>
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
    
    <style>
        :root { --bg: #0b0f1a; --card: #161b2a; --primary: #10b981; --accent: #0ea5e9; --premium: #f59e0b; --text: #f1f5f9; --danger: #ef4444; --neutral: #334155; }
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', sans-serif; scroll-behavior: smooth; }
        body { background: var(--bg); color: var(--text); display: flex; justify-content: center; min-height: 100vh; padding: 20px; }
        .app-card { width: 100%; max-width: 420px; background: var(--card); border-radius: 35px; padding: 30px; box-shadow: 0 30px 60px rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.05); height: fit-content; position: relative; }
        .auth-container h1 { font-size: 2.2rem; text-align: center; margin-bottom: 20px; color: var(--primary); font-weight: 900; }
        input, select, textarea { width: 100%; padding: 15px; border-radius: 15px; background: #0b0f1a; border: 1px solid #2d3748; color: white; margin-bottom: 12px; text-align: center; }
        .btn { width: 100%; padding: 18px; border-radius: 18px; border: none; font-weight: 700; cursor: pointer; color: white; transition: 0.3s; }
        .btn-main { background: var(--primary); }
        .btn-sub { background: var(--accent); margin-top: 10px; }
        .btn-outline { background: transparent; color: #94a3b8; border: 1px solid #2d3748; margin-top: 10px; font-size: 0.8rem; }
        .cam-box { width: 100%; aspect-ratio: 1/1; background: #000; border-radius: 25px; overflow: hidden; border: 2px solid #1e293b; margin-bottom: 20px; position: relative; }
        video { width: 100%; height: 100%; object-fit: cover; }
        .freeze-overlay { display: none; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(16, 185, 129, 0.2); backdrop-filter: blur(4px); z-index: 5; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 1.2rem; text-shadow: 0 2px 10px rgba(0,0,0,0.5); }
        #results { display: none; flex-direction: column; gap: 12px; margin-top: 25px; padding: 15px; background: var(--bg); border-radius: 20px; }
        .report-card { background: #1a202c; border-radius: 15px; padding: 18px; border-top: 4px solid var(--accent); position: relative; }
        .report-tag { font-size: 0.7rem; font-weight: 800; color: var(--accent); text-transform: uppercase; margin-bottom: 8px; }
        .report-txt { font-size: 0.9rem; line-height: 1.8; color: #cbd5e1; white-space: pre-line; font-weight: 500; }
        
        /* Görsel Puan Çubuğu */
        .score-container { margin-top: 15px; }
        .score-label { display: flex; justify-content: space-between; font-size: 0.7rem; margin-bottom: 5px; color: #94a3b8; font-weight: bold; }
        .score-bar-bg { height: 12px; width: 100%; background: linear-gradient(to right, #ef4444, #f59e0b, #10b981); border-radius: 6px; position: relative; }
        .score-pointer { position: absolute; top: -5px; width: 22px; height: 22px; background: #fff; border: 3px solid var(--card); border-radius: 50%; transform: translateX(-50%); transition: left 1s ease-in-out; box-shadow: 0 0 10px rgba(255,255,255,0.5); z-index: 10; }

        .history-box { background: rgba(255,255,255,0.05); padding: 15px; border-radius: 15px; margin-top: 10px; font-size: 0.85rem; border-left: 3px solid var(--primary); cursor: pointer; transition: 0.2s; }
        .history-box:hover { background: rgba(255,255,255,0.1); }
        
        .bell-container, .friends-btn { cursor: pointer; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; background: rgba(255,255,255,0.05); border-radius: 50%; position: relative; }
        .notif-badge { position: absolute; top: 0; right: 0; background: var(--danger); color: white; font-size: 0.6rem; font-weight: 900; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .notif-dropdown, .friends-dropdown { display: none; position: absolute; top: 50px; right: 0; width: 280px; background: #1e293b; border: 1px solid #334155; border-radius: 15px; padding: 15px; z-index: 100; max-height: 350px; overflow-y: auto; box-shadow: 0 10px 30px rgba(0,0,0,0.8); }
        
        .modal { display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); padding: 20px; overflow-y: auto; }
        .modal-content { background: var(--card); margin: auto; padding: 20px; border-radius: 25px; max-width: 400px; border: 1px solid var(--primary); }
        .friend-pill { display: block; padding: 10px; background: #0b0f1a; border-radius: 10px; margin-bottom: 5px; color: var(--primary); cursor: pointer; font-size: 0.8rem; }
        .user-tag { font-size: 1.1rem; font-weight: 900; color: var(--primary); margin-top: 5px; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
        .split-btns { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
        .chat-box { display: flex; flex-direction: column; gap: 10px; max-height: 300px; overflow-y: auto; margin-bottom: 15px; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 15px; }
        .msg-lara { align-self: flex-start; background: var(--accent); color: white; padding: 10px; border-radius: 15px 15px 15px 0; font-size: 0.8rem; max-width: 85%; }
        .msg-user { align-self: flex-end; background: var(--primary); color: white; padding: 10px; border-radius: 15px 15px 0 15px; font-size: 0.8rem; max-width: 85%; }
        .loading-text { font-size: 1rem; color: var(--premium); font-weight: 900; text-align: center; padding: 20px; animation: blink 1s infinite; }
        @keyframes blink { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }
        .partner-box { background: rgba(255,255,255,0.05); border: 1px dashed var(--neutral); padding: 15px; border-radius: 15px; margin-top: 15px; text-align: center; }
    </style>
</head>
<body>

<div id="laraModal" class="modal">
    <div class="modal-content">
        <h3 id="txtLaraTitle" style="color:var(--accent); text-align:center; margin-bottom:15px;">🤖 YZ Diyetisyen: LARA</h3>
        <div id="laraChatDisplay" class="chat-box">
            <div class="msg-lara">Merhaba! Ben Lara. Çok kısa ve can alıcı yanıtlar için buradayım.</div>
        </div>
        <div style="display:flex; gap:5px;">
            <input type="text" id="laraInput" placeholder="..." style="margin-bottom:0;">
            <button class="btn btn-main" onclick="askLara()" style="width:60px; padding:0;">🚀</button>
        </div>
        <button class="btn btn-outline" onclick="document.getElementById('laraModal').style.display='none'">Kapat</button>
    </div>
</div>

<div id="sportQuestionsModal" class="modal">
    <div class="modal-content">
        <div id="sportInputArea">
            <h3 style="color:var(--premium); text-align:center; margin-bottom:15px;">🏋️ Spor Programı Hazırlığı</h3>
            <input type="number" id="sqAge" placeholder="Yaş">
            <input type="number" id="sqWeight" placeholder="Kilo">
            <input type="number" id="sqDays" placeholder="Kaç Gün?">
            <select id="sqGoal"><option value="Yağ Yakımı">Yağ Yakımı</option><option value="Kas Kütlesi">Kas Kütlesi</option></select>
            <button class="btn btn-main" style="background:var(--premium); color:black;" onclick="generateSportProgram()">OLUŞTUR</button>
        </div>
        <div id="sportLoadingArea" style="display:none;"><div class="loading-text">HAZIRLANIYOR...</div></div>
        <div id="sportResultArea" style="display:none;">
            <div id="sportPlanContent" class="report-txt" style="max-height: 350px; overflow-y: auto;"></div>
            <button class="btn btn-sub" onclick="downloadSportPDF()">📄 PDF İNDİR</button>
        </div>
        <button class="btn btn-outline" onclick="document.getElementById('sportQuestionsModal').style.display='none'; resetSportModal();">Kapat</button>
    </div>
</div>

<div id="detailModal" class="modal">
    <div class="modal-content">
        <h3 id="modalTitle" style="color:var(--primary); margin-bottom:15px; text-align:center;">Öğün Detayı</h3>
        <div id="modalBody" class="report-txt" style="max-height: 400px; overflow-y: auto;"></div>
        <button class="btn btn-sub" style="margin-top:15px;" onclick="document.getElementById('detailModal').style.display='none'">Kapat</button>
    </div>
</div>

<div class="app-card">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 15px;">
        <div>
            <span onclick="changeLang('tr')" style="font-size: 1.8rem; cursor: pointer; margin-right: 15px;">🇹🇷</span>
            <span onclick="changeLang('en')" style="font-size: 1.8rem; cursor: pointer;">🇺🇸</span>
        </div>
        <div style="display: flex; gap:10px;">
            <div class="bell-container" onclick="toggleNotifications()" id="bellIcon" style="display:none;">
                🔔<span class="notif-badge" id="notifBadge" style="display:none;">0</span>
                <div class="notif-dropdown" id="notifDropdown"><h4 id="txtNotifHead" style="color:white; margin-bottom:10px;">Bildirimler</h4><div id="notifList"></div></div>
            </div>
            <div class="friends-btn" onclick="toggleFriends()" id="friendListBtn" style="display:none;">
                👤<div class="friends-dropdown" id="friendsDropdown"><h4 id="txtFriendsHead" style="color:white; margin-bottom:10px;">Takip Ettiklerin</h4><div id="friendsListContainer"></div></div>
            </div>
        </div>
    </div>

    <div id="loginView" class="auth-container">
        <h1>BIO-CHEF</h1>
        <input type="email" id="lEmail" placeholder="E-posta">
        <input type="password" id="lPass" placeholder="Şifre">
        <button class="btn btn-main" onclick="doLogin()">GİRİŞ YAP</button>
        <button class="btn btn-outline" onclick="toggleView('regView')">Kayıt Ol</button>
    </div>

    <div id="regView" class="auth-container" style="display:none;">
        <h1>KAYIT OL</h1>
        <input type="email" id="rEmail" placeholder="E-posta">
        <input type="text" id="rUser" placeholder="Kullanıcı Adı">
        <input type="password" id="rPass" placeholder="Şifre">
        <button class="btn btn-sub" onclick="doRegister()">HESABI OLUŞTUR</button>
        <button class="btn btn-outline" onclick="toggleView('loginView')">Geri Dön</button>
    </div>

    <div id="mainView" style="display:none;">
        <div style="text-align: center; margin-bottom: 20px;">
            <div id="clock" style="font-size: 2.2rem; font-weight: 800; color: var(--accent);">00:00:00</div>
            <div id="uMail" class="user-tag"></div> 
        </div>
        <div class="cam-box">
            <video id="video" autoplay playsinline></video>
            <div id="freezeLayer" class="freeze-overlay">🔍 İNCELENİYOR...</div>
        </div>

        <button class="btn btn-main" id="btnAnalyze" onclick="runAI('yemek')">📸 ANALİZ ET</button>
        <button class="btn btn-sub" id="btnRetry" style="display:none;" onclick="resetCamera()">🔄 YENİDEN ANALİZ</button>

        <div id="results"></div>

        <button class="btn btn-outline" onclick="toggleHistory()" id="btnHist">📚 GEÇMİŞİM (24s)</button>
        <div id="historyPanel" style="display:none; margin-top:10px;"><div id="historyList"></div></div>

        <button class="btn btn-outline" style="background:var(--neutral); color:white;" onclick="togglePartner()" id="btnDost">👫 DİYET DOSTU</button>
        <div id="partnerPanel" class="partner-box" style="display:none;">
            <input type="text" id="partnerUser" placeholder="Kullanıcı Adı">
            <button class="btn btn-sub" onclick="sendFriendRequest()">➕ TAKİP ET</button>
            <button class="btn btn-sub" style="background:var(--primary);" id="btnSorgu" onclick="checkPartner()">🔍 DURUM SORGULA</button>
            <div id="partnerResult" style="margin-top:15px; font-weight:bold; white-space:pre-line;"></div>
        </div>

        <div class="split-btns">
            <button class="btn btn-neutral" onclick="document.getElementById('sportQuestionsModal').style.display='block'">🏃‍♂️ SPOR</button>
            <button class="btn btn-neutral" onclick="document.getElementById('laraModal').style.display='block'">🤖 LARA</button>
        </div>

        <div id="dietConnect" class="partner-box" style="border-color: var(--primary);">
            <h3 id="txtDietTitle" style="color:var(--primary); font-size:1rem;">Diyetisyene Bağlan</h3>
            <input type="text" id="dietCodeInput" placeholder="Diyetisyen Kodu">
            <button class="btn btn-sub" style="background:var(--primary);" onclick="connectToDietician()">BAĞLAN</button>
            <p id="dietStatus" style="font-size:0.7rem; margin-top:5px; color:#94a3b8;"></p>
        </div>

        <button class="btn btn-outline" onclick="auth.signOut(); location.reload();">ÇIKIŞ YAP</button>
    </div>
</div>

<script>
    const firebaseConfig = { apiKey: "AIzaSyDaZ3eZsoAKW3ZazFPebAd-b147KaW5wOA", authDomain: "voice2post-9e8ca.firebaseapp.com", projectId: "voice2post-9e8ca", storageBucket: "voice2post-9e8ca.firebasestorage.app", messagingSenderId: "511446656614", appId: "1:511446656614:web:32101ee70299543c716fa7" };
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth(); const db = firebase.firestore();

    let currentLang = 'tr';
    const langData = {
        tr: { headers: ["YEMEK ADI 🍽️","BESİN DEĞERLERİ 📊","NET TAVSİYE 💡","ÜRÜN ÖZETİ 🔍","SKOR 🎯"], notif: "Bildirimler", followers: "Takip Ettiklerin", hist: "GEÇMİŞİM (24s)", dost: "👫 DİYET DOSTU", sorgu: "🔍 DURUM SORGULA" },
        en: { headers: ["MEAL NAME 🍽️","NUTRITION 📊","ADVICE 💡","SUMMARY 🔍","SCORE 🎯"], notif: "Notifications", followers: "Following", hist: "HISTORY (24h)", dost: "👫 DIET PARTNER", sorgu: "🔍 CHECK STATUS" }
    };

    function changeLang(l) {
        currentLang = l; const d = langData[l];
        document.getElementById('txtNotifHead').innerText = d.notif;
        document.getElementById('txtFriendsHead').innerText = d.followers;
        document.getElementById('btnHist').innerText = d.hist;
        document.getElementById('btnDost').innerText = d.dost;
        document.getElementById('btnSorgu').innerText = d.sorgu;
        alert("Dil: " + l);
    }

    auth.onAuthStateChanged(user => {
        if (user) {
            toggleView('mainView');
            document.getElementById('uMail').innerText = "@" + user.displayName;
            document.getElementById('bellIcon').style.display = 'flex';
            document.getElementById('friendListBtn').style.display = 'flex';
            startCamera(); listenNotifications(); listenFriends(); checkDieticianLink();
        } else { toggleView('loginView'); }
    });

    async function runAI(mode) {
        const resDiv = document.getElementById('results'); const vid = document.getElementById('video');
        vid.pause(); document.getElementById('freezeLayer').style.display = 'flex';
        document.getElementById('btnAnalyze').style.display = 'none';

        const canv = document.createElement('canvas'); canv.width = 640; canv.height = 480;
        canv.getContext('2d').drawImage(vid, 0, 0, 640, 480);
        let img = canv.toDataURL('image/jpeg', 0.7);

        try {
            const r = await fetch('/api/analyze', {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ mode, image: img, user_data: `Hedef:Kilo Koruma`, lang: currentLang })
            });
            const d = await r.json();
            resDiv.innerHTML = ''; resDiv.style.display = 'flex';
            const sections = d.analysis.split(/\d\./).filter(s => s.trim().length > 2);
            const headers = langData[currentLang].headers;
            let finalScore = 5; let mealName = "Yemek";

            sections.forEach((txt, i) => {
                const card = document.createElement('div'); card.className = 'report-card';
                let content = txt.trim();
                if (i === 0) mealName = content.substring(0,30);
                if (content.includes('[SKOR:')) {
                    const match = content.match(/\[SKOR:\s*(\d+)\]/);
                    if(match) {
                        finalScore = parseInt(match[1]);
                        let left = (finalScore/10)*100;
                        card.innerHTML = `<div class="report-tag">${headers[i]}</div><div class="report-txt">${content.replace(match[0], '')}</div>
                        <div class="score-container"><div class="score-bar-bg"><div class="score-pointer" style="left:${left}%"></div></div><div style="text-align:center; margin-top:5px; font-weight:900;">${finalScore}/10</div></div>`;
                    }
                } else { card.innerHTML = `<div class="report-tag">${headers[i] || 'DETAY'}</div><div class="report-txt">${content}</div>`; }
                resDiv.appendChild(card);
            });
            document.getElementById('btnRetry').style.display = 'block';
            document.getElementById('freezeLayer').style.display = 'none';
            saveHistory(finalScore, d.analysis, mealName);
            resDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch(e) { resetCamera(); }
    }

    function saveHistory(s, r, m) {
        const me = auth.currentUser.displayName.toLowerCase();
        const now = Date.now();
        const dateStr = new Date().toLocaleString();
        db.collection('partner_data').doc(me).collection('history').add({ score: s, fullText: r, date: dateStr, unix: now, mealName: m });
        let arr = JSON.parse(localStorage.getItem('history_' + auth.currentUser.uid) || '[]');
        arr.unshift({ summary: s, date: dateStr, detail: r, meal: m, unix: now });
        localStorage.setItem('history_' + auth.currentUser.uid, JSON.stringify(arr.slice(0, 50)));
    }

    function toggleHistory() {
        const p = document.getElementById('historyPanel'); p.style.display = p.style.display === 'none' ? 'block' : 'none';
        if(p.style.display === 'block') {
            let arr = JSON.parse(localStorage.getItem('history_' + auth.currentUser.uid) || '[]');
            const now = Date.now();
            const last24 = arr.filter(h => (now - h.unix) < 86400000);
            document.getElementById('historyList').innerHTML = last24.map(h => `<div class="history-box" onclick="openDetail(\`${h.detail.replace(/`/g, "'")}\`)">🕒 ${h.date}<br>🍽️ ${h.meal} (Puan: ${h.summary}/10)</div>`).join('');
        }
    }

    async function checkDieticianLink() {
        const me = auth.currentUser.displayName.toLowerCase();
        db.collection('partner_data').doc(me).get().then(doc => {
            if(doc.exists && doc.data().linkedDietician) {
                document.getElementById('dietStatus').innerText = "Bağlı: @" + doc.data().linkedDietician;
                document.getElementById('dietConnect').style.display = 'none';
            }
        });
    }

    async function connectToDietician() {
        const c = document.getElementById('dietCodeInput').value.trim().toUpperCase();
        const me = auth.currentUser.displayName.toLowerCase();
        const q = await db.collection('dieticians').where('code', '==', c).get();
        if(q.empty) return alert("Hatalı.");
        const dID = q.docs[0].id;
        await db.collection('dieticians').doc(dID).update({ patients: firebase.firestore.FieldValue.arrayUnion(me) });
        await db.collection('partner_data').doc(me).update({ linkedDietician: dID });
        alert("Bağlandınız."); checkDieticianLink();
    }

    function checkSpecific(u) { document.getElementById('partnerUser').value = u; checkPartner(); toggleFriends(); document.getElementById('partnerPanel').style.display = 'block'; document.getElementById('partnerPanel').scrollIntoView({ behavior: 'smooth' }); }
    function openDetail(txt) { document.getElementById('modalBody').innerText = txt; document.getElementById('detailModal').style.display = 'block'; }
    function startCamera() { navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(s => { document.getElementById('video').srcObject = s; }); }
    function resetCamera() { document.getElementById('video').play(); document.getElementById('freezeLayer').style.display = 'none'; document.getElementById('results').style.display = 'none'; document.getElementById('btnAnalyze').style.display = 'block'; document.getElementById('btnRetry').style.display = 'none'; }
    function toggleView(id) { document.querySelectorAll('.auth-container, #mainView').forEach(v => v.style.display = 'none'); document.getElementById(id).style.display = 'block'; }
    async function doLogin() { try { await auth.signInWithEmailAndPassword(document.getElementById('lEmail').value, document.getElementById('lPass').value); } catch(e) { alert("Hata"); } }
    async function doRegister() { const u = document.getElementById('rUser').value.trim(); const cred = await auth.createUserWithEmailAndPassword(document.getElementById('rEmail').value, document.getElementById('rPass').value); await cred.user.updateProfile({ displayName: u }); await db.collection('partner_data').doc(u.toLowerCase()).set({ username: u.toLowerCase(), role: 'user' }, { merge: true }); location.reload(); }
    function toggleNotifications() { const d = document.getElementById('notifDropdown'); d.style.display = d.style.display === 'none' ? 'block' : 'none'; }
    function toggleFriends() { const d = document.getElementById('friendsDropdown'); d.style.display = d.style.display === 'none' ? 'block' : 'none'; }
    function togglePartner() { const p = document.getElementById('partnerPanel'); p.style.display = p.style.display === 'none' ? 'block' : 'none'; }
    function listenNotifications() { db.collection('notifications').where('toUser', '==', auth.currentUser.displayName.toLowerCase()).onSnapshot(snap => { document.getElementById('notifBadge').innerText = snap.size; document.getElementById('notifBadge').style.display = snap.size > 0 ? 'flex' : 'none'; }); }
    function listenFriends() { db.collection('partner_data').doc(auth.currentUser.displayName.toLowerCase()).onSnapshot(doc => { if(doc.exists && doc.data().friends) { document.getElementById('friendsListContainer').innerHTML = doc.data().friends.map(f => `<div class="friend-pill" onclick="checkSpecific('${f}')">@${f}</div>`).join(''); } }); }
    async function askLara() { /* API call logic */ }
    async function generateSportProgram() { /* API call logic */ }
    function downloadSportPDF() { /* PDF logic */ }
    function resetSportModal() { /* Reset logic */ }
    function downloadPDF() { html2pdf().from(document.getElementById('results')).save('Analiz.pdf'); }
    function saveUserData() { if(auth.currentUser) localStorage.setItem('userData_'+auth.currentUser.uid, JSON.stringify({age:document.getElementById('uAge').value, weight:document.getElementById('uWeight').value, goal:document.getElementById('uGoal').value})); }
    setInterval(() => { if(document.getElementById('clock')) document.getElementById('clock').innerText = new Date().toLocaleTimeString(); }, 1000);
</script>
</body>
</html>
