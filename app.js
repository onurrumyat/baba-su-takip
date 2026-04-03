document.addEventListener("DOMContentLoaded", () => {
    const menuItems = document.querySelectorAll('.menu-item[data-target]');
    const mainContent = document.getElementById('main-content');
    const searchInput = document.getElementById('global-search');
    
    let userProfile = { name: "Ege", surname: "Yılmaz", university: "Global University", faculty: "Bilgisayar Mühendisliği", year: "2. Sınıf", bio: "Kampüs hayatını ve teknolojiyi seviyorum." };

    const database = [
        { id: 1, type: "market", title: "IKEA Çalışma Masası", desc: "Çok az kullanıldı, çiziksiz.", price: "$45", img: "🪑" },
        { id: 2, type: "market", title: "Anatomi Atlası (Netter)", desc: "Tıp öğrencileri için tertemiz kitap.", price: "$30", img: "📚" },
        { id: 3, type: "housing", title: "Kampüse 5dk - Odaya Arkadaş", desc: "Sigara içmeyen bir ev arkadaşı arıyorum.", price: "$400/Ay", img: "🏠" }
    ];

    let confessionsDB = [
        { id: 1, avatar: "👻", user: "Anonim #482", time: "2 saat önce", text: "İlk yılım ve henüz hiç arkadaş bulamadım..." },
        { id: 2, avatar: "🎭", user: "Anonim #911", time: "5 saat önce", text: "Fizik 101 hocası gerçekten çok zorluyor." }
    ];

    // CHAT VERİTABANI
    let chatsDB = [
        { 
            id: "chat1", name: "Sarah B.", avatar: "👩‍⚕️", role: "Tıp Fakültesi",
            messages: [
                { type: "received", text: "Merhaba Ege, Anatomi atlası duruyor mu?" },
                { type: "sent", text: "Selam Sarah, evet duruyor. Kütüphanede buluşabiliriz." },
                { type: "received", text: "Süper, yarın 14:00 uygun mu?" }
            ]
        },
        { 
            id: "chat2", name: "John D.", avatar: "👨‍💻", role: "Aynı Sınıf",
            messages: [
                { type: "received", text: "Dostum dünkü algoritma ödevini yapabildin mi?" }
            ]
        }
    ];
    let currentChatId = "chat1";

    // MODAL YÖNETİMİ
    const modal = document.getElementById('app-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const closeModalBtn = document.getElementById('modal-close');

    window.openModal = function(title, contentHTML) { modalTitle.innerText = title; modalBody.innerHTML = contentHTML; modal.classList.add('active'); }
    window.closeModal = function() { modal.classList.remove('active'); }
    closeModalBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    // MOBİL MENÜ YÖNETİMİ
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');
    mobileMenuBtn.addEventListener('click', () => { sidebar.classList.toggle('open'); });

    // 1. ANA SAYFA VE İLANLAR
    function getHomeContent() {
        return `
            <div class="card" style="background: linear-gradient(135deg, #4F46E5, #818CF8); color: white;">
                <h2>Hoş Geldin, ${userProfile.name}! 👋</h2>
                <p>${userProfile.university} öğrencisi olarak UniLoop ağındasın.</p>
            </div>
            <div class="card">
                <h2>✨ AI Kampüs Eşleşmeleri</h2>
                <div class="match-grid">
                    <div class="match-card"><div class="avatar">👨‍💻</div><h4>John D.</h4><p>Aynı Sınıf</p><button class="action-btn" onclick="openModal('Bağlantı Kur', '<p>İstek gönderildi!</p>')">Bağlan</button></div>
                    <div class="match-card"><div class="avatar">👩‍⚕️</div><h4>Sarah B.</h4><p>Tıp Fakültesi</p><button class="action-btn" onclick="document.querySelector('[data-target=\\'messages\\']').click()">Mesaj At</button></div>
                </div>
            </div>
        `;
    }

    function renderListings(type, title, buttonText) {
        const filteredData = database.filter(item => item.type === type);
        let html = `<div class="card"><div style="display:flex; justify-content:space-between; margin-bottom: 15px;"><h2>${title}</h2><button class="btn-primary" style="width:auto;">+ İlan Ver</button></div><div class="grid-2col">`;
        filteredData.forEach(item => {
            html += `<div class="item-card"><div class="item-img-large">${item.img}</div><div class="item-details"><div class="item-title">${item.title}</div><div class="item-desc">${item.desc}</div><div class="item-footer"><span class="item-price-large">${item.price}</span><button class="action-btn" style="width:auto;" onclick="document.querySelector('[data-target=\\'messages\\']').click()">${buttonText}</button></div></div></div>`;
        });
        return html + `</div></div>`;
    }

    function renderConfessions() {
        let html = `<div class="card"><h2>🤫 Anonim Kampüs</h2><div style="background: #F3F4F6; padding: 15px; border-radius: 10px; margin-bottom: 20px;"><textarea id="new-conf-text" class="form-group" style="width:100%; height:60px; border:none;" placeholder="Aklından ne geçiyor?"></textarea><div style="text-align: right;"><button class="btn-primary" style="width:auto;" id="post-conf-btn">Gönder</button></div></div><div id="conf-feed">`;
        confessionsDB.forEach(post => {
            html += `<div class="confession-post"><div class="confession-avatar">${post.avatar}</div><div class="confession-content"><div class="confession-header"><span class="confession-user">${post.user}</span><span class="confession-time">${post.time}</span></div><div class="confession-text">${post.text}</div></div></div>`;
        });
        mainContent.innerHTML = html + `</div></div>`;

        document.getElementById('post-conf-btn').addEventListener('click', () => {
            const text = document.getElementById('new-conf-text').value;
            if(text.trim() === '') return;
            confessionsDB.unshift({ id: Date.now(), avatar: "👻", user: "Anonim #"+Math.floor(Math.random()*999), time: "Şimdi", text: text });
            renderConfessions();
        });
    }

    // 2. MESAJLAŞMA SİSTEMİ
    function renderMessages() {
        let html = `<div class="card" style="padding:0; overflow:hidden;"><div class="chat-layout"><div class="chat-sidebar"><div style="padding:15px; font-weight:bold; border-bottom:1px solid #E5E7EB;">Sohbetler</div>`;
        chatsDB.forEach(chat => {
            const lastMsg = chat.messages[chat.messages.length - 1].text;
            const isActive = chat.id === currentChatId ? 'active' : '';
            html += `<div class="chat-contact ${isActive}" data-id="${chat.id}"><div class="avatar">${chat.avatar}</div><div class="chat-contact-info"><div class="chat-contact-name">${chat.name}</div><div class="chat-contact-last">${lastMsg}</div></div></div>`;
        });
        html += `</div><div class="chat-main" id="chat-box-container"></div></div></div>`;
        mainContent.innerHTML = html;

        document.querySelectorAll('.chat-contact').forEach(contact => {
            contact.addEventListener('click', (e) => {
                currentChatId = e.currentTarget.getAttribute('data-id');
                renderMessages(); 
            });
        });
        renderActiveChat();
    }

    function renderActiveChat() {
        const activeChat = chatsDB.find(c => c.id === currentChatId);
        const container = document.getElementById('chat-box-container');
        let chatHTML = `<div class="chat-header"><div class="avatar" style="width:35px; height:35px; font-size:16px;">${activeChat.avatar}</div><div><div>${activeChat.name}</div><div style="font-size:11px; color:var(--text-gray); font-weight:normal;">${activeChat.role}</div></div></div><div class="chat-messages" id="chat-messages-scroll">`;
        activeChat.messages.forEach(msg => { chatHTML += `<div class="bubble ${msg.type}">${msg.text}</div>`; });
        chatHTML += `</div><div class="chat-input-area"><input type="text" id="chat-input-field" placeholder="Mesaj yaz..."><button id="chat-send-btn">➤</button></div>`;
        container.innerHTML = chatHTML;
        
        const scrollBox = document.getElementById('chat-messages-scroll');
        scrollBox.scrollTop = scrollBox.scrollHeight;

        const sendMsg = () => {
            const input = document.getElementById('chat-input-field');
            if(input.value.trim() !== '') {
                activeChat.messages.push({ type: 'sent', text: input.value });
                renderActiveChat(); 
            }
        };
        document.getElementById('chat-send-btn').addEventListener('click', sendMsg);
        document.getElementById('chat-input-field').addEventListener('keypress', (e) => { if(e.key === 'Enter') sendMsg(); });
    }

    // 3. TOPLULUK SAYFASI
    window.loadCommunity = function(name, icon, bgColor) {
        menuItems.forEach(m => m.classList.remove('active'));
        if(window.innerWidth <= 1024) sidebar.classList.remove('open');

        let html = `
            <div class="card" style="padding:0; border:none; box-shadow:none; background:transparent;">
                <div class="community-banner" style="background: ${bgColor};">
                    <h1>${icon} ${name}</h1>
                    <div class="community-stats">👥 1,240 Üye • 🟢 14 Çevrimiçi</div>
                    <div class="member-avatars">
                        <div class="avatar">👨‍💻</div><div class="avatar">👩‍⚕️</div>
                        <div class="avatar">👨‍🎨</div><div class="avatar" style="background:#f3f4f6; color:#000; font-size:12px;">+1K</div>
                    </div>
                </div>
                <div class="card" style="margin-bottom:20px;">
                    <div style="display:flex; gap:10px;">
                        <input type="text" class="form-group" style="flex:1; margin:0;" placeholder="${name} grubunda bir şeyler paylaş...">
                        <button class="btn-primary" style="width:auto;" onclick="alert('Gönderi paylaşıldı!')">Paylaş</button>
                    </div>
                </div>
                <div class="confession-post">
                    <div class="confession-avatar">👨‍🎨</div>
                    <div class="confession-content">
                        <div class="confession-header"><span class="confession-user">Alex M.</span><span class="confession-time">10 dk önce</span></div>
                        <div class="confession-text">Arkadaşlar bu hafta sonu ${name} etkinliği için kimler geliyor? Organizasyon için sayı almamız lazım.</div>
                        <div class="confession-actions"><span>👍 Beğen (12)</span><span onclick="document.querySelector('[data-target=\\'messages\\']').click()">💬 Alex'e Mesaj At</span></div>
                    </div>
                </div>
            </div>
        `;
        mainContent.innerHTML = html;
        window.scrollTo(0,0);
    }

    // Topluluk linklerini dinle (Mobil menüdeki ve Sağ paneldeki tüm linkleri yakalar)
    document.querySelectorAll('.community-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const name = e.currentTarget.getAttribute('data-name');
            const icon = e.currentTarget.getAttribute('data-icon');
            const color = e.currentTarget.getAttribute('data-color');
            loadCommunity(name, icon, color);
        });
    });

    // SAYFA GEÇİŞ (ROUTING)
    function loadPage(pageName) {
        searchInput.value = '';
        if (pageName === 'home') mainContent.innerHTML = getHomeContent();
        else if (pageName === 'market') mainContent.innerHTML = renderListings('market', '🛒 Kampüs Market', 'Satıcıya Yaz');
        else if (pageName === 'housing') mainContent.innerHTML = renderListings('housing', '🔑 Ev Arkadaşı & Yurt İlanları', 'İletişime Geç');
        else if (pageName === 'confessions') renderConfessions();
        else if (pageName === 'messages') renderMessages(); 
        
        if(window.innerWidth <= 1024) sidebar.classList.remove('open');
    }

    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            // Sadece tıklanan öğede 'data-target' varsa çalışsın (Topluluk linkleriyle çakışmaması için)
            if(e.currentTarget.getAttribute('data-target')) {
                menuItems.forEach(m => m.classList.remove('active'));
                e.currentTarget.classList.add('active');
                loadPage(e.currentTarget.getAttribute('data-target'));
            }
        });
    });

    document.getElementById('logo-btn').addEventListener('click', () => document.querySelector('[data-target="home"]').click());
    
    // Profil Yükleme
    document.getElementById('profile-btn').addEventListener('click', () => {
        menuItems.forEach(m => m.classList.remove('active'));
        mainContent.innerHTML = `<div class="card"><h2>👤 Profilim</h2><p>Profil ayarları alanı...</p></div>`;
        if(window.innerWidth <= 1024) sidebar.classList.remove('open');
    });

    // İlk açılış
    loadPage('home');
});
