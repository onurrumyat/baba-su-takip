document.addEventListener("DOMContentLoaded", () => {
    
    // --- 🌟 KULLANICI PROFİLİ 🌟 ---
    let userProfile = { 
        name: "Ege", 
        surname: "Yılmaz", 
        email: "ege.yilmaz@uniloop.edu", 
        age: 21,
        faculty: "Bilgisayar Fakültesi", 
        year: "2. Sınıf", // Artık serbest metin girişi
        bio: "Kampüs hayatını ve teknolojiyi seviyorum." 
    };
    let joinedFaculties = [];

    // --- SİSTEM DEĞİŞKENLERİ VE VERİTABANLARI ---
    const authScreen = document.getElementById('auth-screen');
    const appScreen = document.getElementById('app-screen');
    const menuItems = document.querySelectorAll('.menu-item[data-target]');
    const mainContent = document.getElementById('main-content');

    const database = [
        { id: 1, type: "market", title: "IKEA Çalışma Masası", desc: "Çok az kullanıldı, çiziksiz.", price: "$45", img: "🪑" },
        { id: 2, type: "market", title: "Anatomi Atlası (Netter)", desc: "Tıp öğrencileri için tertemiz kitap.", price: "$30", img: "📚" },
        { id: 3, type: "housing", title: "Kampüse 5dk - Odaya Arkadaş", desc: "Sigara içmeyen bir ev arkadaşı arıyorum.", price: "$400/Ay", img: "🏠" },
        { id: 4, type: "market", title: "M1 Macbook Air", desc: "Yazılımcıdan temiz.", price: "$800", img: "💻" }
    ];

    let confessionsDB = [
        { id: 1, avatar: "👻", color: "#FEF3C7", user: "Anonim #482", time: "2 saat önce", text: "İlk yılım ve henüz hiç arkadaş bulamadım. Kütüphanede tek oturuyorum." },
        { id: 2, avatar: "🎭", color: "#E0E7FF", user: "Anonim #911", time: "5 saat önce", text: "Fizik 101 hocası gerçekten çok zorluyor. Vizeler berbat geçti." },
        { id: 3, avatar: "👽", color: "#D1FAE5", user: "Anonim #104", time: "1 gün önce", text: "Yemekhanedeki vegan menü harika olmuş!" }
    ];

    let chatsDB = [
        { 
            id: "chat1", name: "Sarah B.", avatar: "👩‍⚕️", role: "Tıp Fakültesi",
            messages: [
                { type: "received", text: "Merhaba Ege, Anatomi atlası duruyor mu?" },
                { type: "sent", text: "Selam Sarah, evet duruyor." }
            ]
        }
    ];
    let currentChatId = "chat1";

    // --- 🌟 GİRİŞ / ÇIKIŞ (AUTH) SİSTEMİ 🌟 ---
    document.getElementById('login-btn').addEventListener('click', () => {
        authScreen.style.display = 'none';
        appScreen.style.display = 'block';
        loadPage('home');
    });

    window.logout = function() {
        appScreen.style.display = 'none';
        authScreen.style.display = 'flex';
    };

    // --- MODAL YÖNETİMİ ---
    const modal = document.getElementById('app-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    window.openModal = function(title, contentHTML) { 
        modalTitle.innerText = title; 
        modalBody.innerHTML = contentHTML; 
        modal.classList.add('active'); 
    }
    window.closeModal = function() { modal.classList.remove('active'); }
    
    document.getElementById('modal-close').addEventListener('click', closeModal);
    window.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    // --- MOBİL MENÜ YÖNETİMİ ---
    const sidebar = document.getElementById('sidebar');
    document.getElementById('mobile-menu-btn').addEventListener('click', () => { sidebar.classList.toggle('open'); });

    // --- DAHA FAZLA GÖSTER MANTIĞI ---
    const setupShowMore = (btnId, containerId) => {
        const btn = document.getElementById(btnId);
        const container = document.getElementById(containerId);
        if(btn && container) {
            btn.addEventListener('click', () => {
                if(container.style.display === 'none') { container.style.display = 'block'; btn.innerText = 'Daha Az Göster'; }
                else { container.style.display = 'none'; btn.innerText = 'Daha Fazla Göster'; }
            });
        }
    }
    setupShowMore('desktop-show-more-btn', 'desktop-more-faculties');
    setupShowMore('mobile-show-more-btn', 'mobile-more-faculties');

    // --- 1. ANA SAYFA ---
    function getHomeContent() {
        return `
            <div class="card" style="background: linear-gradient(135deg, #4F46E5, #818CF8); color: white;">
                <h2>Hoş Geldin, ${userProfile.name}! 👋</h2>
                <p>Global UniLoop ağına bağlandın. ${userProfile.faculty} duyurularını ve pazar yerini keşfet.</p>
            </div>
            <div class="card">
                <h2>✨ AI Kampüs Eşleşmeleri</h2>
                <div class="match-grid">
                    <div class="match-card"><div class="avatar">👨‍💻</div><h4>John D.</h4><p>${userProfile.year}</p><button class="action-btn" onclick="openModal('Bağlantı Kur', '<p>İstek gönderildi!</p>')">Bağlan</button></div>
                    <div class="match-card"><div class="avatar">👩‍⚕️</div><h4>Sarah B.</h4><p>Tıp Fakültesi</p><button class="action-btn" onclick="document.querySelector('[data-target=\\'messages\\']').click()">Mesaj At</button></div>
                </div>
            </div>
        `;
    }

    // --- 2. İLAN LİSTELEYİCİ ---
    function renderListings(type, title, buttonText) {
        let html = `
            <div class="card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">
                    <h2 style="margin:0;">${title}</h2>
                    <button class="btn-primary" style="width:auto;">+ İlan Ver</button>
                </div>
                <input type="text" id="local-search-input" class="local-search-bar" placeholder="${title} içinde ara...">
                <div class="grid-2col" id="listings-grid-container"></div>
            </div>
        `;
        mainContent.innerHTML = html;

        const container = document.getElementById('listings-grid-container');
        const searchInput = document.getElementById('local-search-input');
        
        const drawGrid = (filterText = '') => {
            const filteredData = database.filter(item => item.type === type && (item.title.toLowerCase().includes(filterText) || item.desc.toLowerCase().includes(filterText)));
            if(filteredData.length === 0) {
                container.innerHTML = `<p style="grid-column: span 2; color: gray;">Sonuç bulunamadı.</p>`; return;
            }
            let gridHtml = '';
            filteredData.forEach(item => {
                gridHtml += `<div class="item-card"><div class="item-img-large">${item.img}</div><div class="item-details"><div class="item-title">${item.title}</div><div class="item-desc">${item.desc}</div><div class="item-footer"><span class="item-price-large">${item.price}</span><button class="action-btn" style="width:auto;" onclick="document.querySelector('[data-target=\\'messages\\']').click()">${buttonText}</button></div></div></div>`;
            });
            container.innerHTML = gridHtml;
        };

        drawGrid(); 
        searchInput.addEventListener('input', (e) => drawGrid(e.target.value.toLowerCase())); 
    }

    // --- 3. ANONİM KAMPÜS ---
    function renderConfessions() {
        let html = `
            <div class="card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">
                    <h2 style="margin:0;">🤫 Anonim Kampüs</h2>
                    <button class="btn-primary" style="width:auto;" onclick="openConfessionForm()">+ İtiraf Yaz</button>
                </div>
                <div class="confessions-grid" id="conf-feed"></div>
            </div>
        `;
        mainContent.innerHTML = html;
        drawConfessionsGrid();
    }

    window.openConfessionForm = function() {
        openModal('Yeni Anonim Gönderi', `
            <textarea id="new-conf-text" class="form-group" style="width:100%; height:100px; border-radius:12px; padding:15px;" placeholder="Aklından ne geçiyor? Tamamen anonimdir..."></textarea>
            <button class="btn-primary" onclick="submitConfession()">Kampüse Gönder</button>
        `);
    }

    window.submitConfession = function() {
        const text = document.getElementById('new-conf-text').value;
        if(text.trim() === '') return;
        const pastelColors = ["#FEF3C7", "#E0E7FF", "#D1FAE5", "#FCE7F3", "#F3E8FF"];
        confessionsDB.unshift({ 
            id: Date.now(), avatar: ["👻","👽","🤖","🦊","🎭"][Math.floor(Math.random()*5)], color: pastelColors[Math.floor(Math.random()*5)],
            user: "Anonim #"+Math.floor(Math.random()*999), time: "Şimdi", text: text 
        });
        closeModal();
        drawConfessionsGrid();
    }

    function drawConfessionsGrid() {
        const feed = document.getElementById('conf-feed');
        let html = '';
        confessionsDB.forEach((post, index) => {
            html += `<div class="confession-square" style="background:${post.color};" onclick="openConfessionDetail(${index})"><div class="confession-square-header"><div class="confession-square-avatar">${post.avatar}</div><div class="confession-square-time">${post.time}</div></div><div class="confession-square-text">${post.text}</div></div>`;
        });
        feed.innerHTML = html;
    }

    window.openConfessionDetail = function(index) {
        const post = confessionsDB[index];
        openModal(post.user + ' Diyor ki:', `
            <div style="background:${post.color}; padding: 25px; border-radius: 12px; font-size: 18px; line-height: 1.6; margin-bottom: 20px;">${post.text}</div>
            <div style="display:flex; gap:10px;"><button class="action-btn" onclick="alert('Beğenildi!')">👍 Beğen</button><button class="action-btn" onclick="alert('Yanıt bölümü açılıyor...')">💬 Yanıtla</button></div>
        `);
    }

    // --- 4. FAKÜLTE KATILIM (GATEKEEPING) SİSTEMİ ---
    function updateMyFacultiesSidebar() {
        const container = document.getElementById('my-joined-faculties');
        let html = '';
        joinedFaculties.forEach(fac => {
            html += `<div class="menu-item community-link" data-name="${fac.name}" data-icon="${fac.icon}" data-color="${fac.color}">${fac.icon} ${fac.name}</div>`;
        });
        container.innerHTML = html;
    }

    window.joinFaculty = function(name, icon, bgColor) {
        if(!joinedFaculties.some(f => f.name === name)) {
            joinedFaculties.push({name: name, icon: icon, color: bgColor});
        }
        closeModal();
        updateMyFacultiesSidebar();
        loadFacultyFeed(name, icon, bgColor);
    }

    window.loadFacultyFeed = function(name, icon, bgColor) {
        let html = `
            <div class="card" style="padding:0; border:none; box-shadow:none; background:transparent;">
                <div class="community-banner" style="background: ${bgColor};">
                    <h1>${icon} ${name}</h1>
                    <div class="community-stats">👥 1,240 Öğrenci &nbsp;•&nbsp; 🟢 42 Çevrimiçi</div>
                </div>
                <div class="card" style="margin-bottom:20px;">
                    <div style="display:flex; gap:10px;">
                        <input type="text" class="form-group" style="flex:1; margin:0;" placeholder="${name} içinde bir şeyler paylaş...">
                        <button class="btn-primary" style="width:auto;" onclick="alert('Gönderi paylaşıldı!')">Paylaş</button>
                    </div>
                </div>
                <div class="confession-post" style="background:white;">
                    <div class="confession-avatar">👨‍🏫</div>
                    <div class="confession-content">
                        <div class="confession-header"><span class="confession-user">Fakülte Temsilcisi</span><span class="confession-time">10 dk önce</span></div>
                        <div class="confession-text">Amfi 4'teki ders iptal olmuştur, duyurulur.</div>
                        <div class="confession-actions"><span onclick="alert('Beğenildi')">👍 Beğen (120)</span></div>
                    </div>
                </div>
            </div>
        `;
        mainContent.innerHTML = html;
        window.scrollTo(0,0);
    }

    window.handleFacultyClick = function(name, icon, bgColor) {
        menuItems.forEach(m => m.classList.remove('active'));
        if(window.innerWidth <= 1024) sidebar.classList.remove('open');

        const isJoined = joinedFaculties.some(f => f.name === name);

        if(isJoined) {
            loadFacultyFeed(name, icon, bgColor);
        } else {
            mainContent.innerHTML = `
                <div class="join-faculty-box">
                    <div class="icon">${icon}</div>
                    <h2>${name} Ağına Hoş Geldin</h2>
                    <p>Bu fakülte ağı kapalı bir topluluktur. Katılarak bölümündeki diğer öğrencilerle tanışabilir ve duyuruları takip edebilirsin.</p>
                    <button class="btn-primary" style="max-width:250px;" onclick="joinFaculty('${name}', '${icon}', '${bgColor}')">Fakülteye Katıl</button>
                </div>
            `;
            window.scrollTo(0,0);
        }
    }

    document.body.addEventListener('click', (e) => {
        const link = e.target.closest('.community-link');
        if(link) {
            const name = link.getAttribute('data-name');
            const icon = link.getAttribute('data-icon');
            const color = link.getAttribute('data-color');
            handleFacultyClick(name, icon, color);
        }
    });

    // --- 5. MESAJLAŞMA SİSTEMİ (WHATSAPP STİLİ) ---
    function renderMessages() {
        let html = `
            <div class="card" style="padding:0; overflow:hidden;">
                <div class="chat-layout" id="chat-layout-container">
                    <div class="chat-sidebar">
                        <div class="chat-sidebar-header">Sohbetler</div>
        `;
        
        chatsDB.forEach(chat => {
            const lastMsg = chat.messages[chat.messages.length - 1].text;
            html += `<div class="chat-contact" data-id="${chat.id}"><div class="avatar">${chat.avatar}</div><div class="chat-contact-info"><div class="chat-contact-name">${chat.name}</div><div class="chat-contact-last">${lastMsg}</div></div></div>`;
        });
        
        html += `
                    </div>
                    <div class="chat-main" id="chat-main-view">
                        <div style="display:flex; align-items:center; justify-content:center; height:100%; color:var(--text-gray);">Mesajlaşmaya başlamak için bir kişi seçin.</div>
                    </div>
                </div>
            </div>
        `;
        
        mainContent.innerHTML = html;

        document.querySelectorAll('.chat-contact').forEach(contact => {
            contact.addEventListener('click', (e) => { 
                const chatId = e.currentTarget.getAttribute('data-id');
                openChatView(chatId);
            });
        });
    }

    function openChatView(chatId) {
        currentChatId = chatId;
        const activeChat = chatsDB.find(c => c.id === chatId);
        const container = document.getElementById('chat-main-view');
        const layoutContainer = document.getElementById('chat-layout-container');
        
        layoutContainer.classList.add('chat-active');

        let chatHTML = `
            <div class="chat-header">
                <button class="back-btn" id="back-to-chats">←</button>
                <div class="avatar" style="width:40px; height:40px; font-size:20px; margin:0 15px 0 0;">${activeChat.avatar}</div>
                <div style="flex:1;">
                    <div style="font-weight:bold; font-size:15px; color:#111B21;">${activeChat.name}</div>
                    <div style="font-size:12px; color:var(--text-gray);">${activeChat.role}</div>
                </div>
            </div>
            <div class="chat-messages" id="chat-messages-scroll">
        `;
        
        activeChat.messages.forEach(msg => { chatHTML += `<div class="bubble ${msg.type}">${msg.text}</div>`; });
        
        chatHTML += `
            </div>
            <div class="chat-input-area">
                <input type="text" id="chat-input-field" placeholder="Bir mesaj yazın">
                <button id="chat-send-btn">➤</button>
            </div>
        `;
        
        container.innerHTML = chatHTML;
        
        const scrollBox = document.getElementById('chat-messages-scroll');
        scrollBox.scrollTop = scrollBox.scrollHeight;

        document.getElementById('back-to-chats').addEventListener('click', () => {
            layoutContainer.classList.remove('chat-active');
        });

        const sendMsg = () => {
            const input = document.getElementById('chat-input-field');
            if(input.value.trim() !== '') {
                activeChat.messages.push({ type: 'sent', text: input.value });
                openChatView(chatId); 
            }
        };
        document.getElementById('chat-send-btn').addEventListener('click', sendMsg);
        document.getElementById('chat-input-field').addEventListener('keypress', (e) => { if(e.key === 'Enter') sendMsg(); });
    }

    // --- 🌟 6. PROFİL VE AYARLAR EKRANI (GÜNCELLENDİ) 🌟 ---
    function renderProfile() {
        mainContent.innerHTML = `
            <div class="card">
                <h2>👤 Profil Bilgilerim</h2>
                <p style="color:var(--text-gray); margin-bottom:20px;">Hesap bilgilerini ve okul durumunu buradan güncelleyebilirsin.</p>
                <div style="background: #F3F4F6; padding: 20px; border-radius: 10px;">
                    <div class="grid-2col" style="margin-top:0;">
                        <div class="form-group"><label>Ad</label><input type="text" id="prof-name" value="${userProfile.name}"></div>
                        <div class="form-group"><label>Soyad</label><input type="text" id="prof-surname" value="${userProfile.surname}"></div>
                    </div>
                    <div class="form-group">
                        <label>Okul E-posta Adresi (Değiştirilemez)</label>
                        <input type="email" disabled value="${userProfile.email}" style="background:#E5E7EB; cursor:not-allowed;">
                    </div>
                    <div class="grid-2col" style="margin-top:0;">
                        <div class="form-group"><label>Yaş</label><input type="number" id="prof-age" value="${userProfile.age}"></div>
                        
                        <div class="form-group">
                            <label>Sınıf / Yıl</label>
                            <input type="text" id="prof-year" value="${userProfile.year}" placeholder="Örn: 3. Sınıf, Hazırlık, Mezun">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Bağlı Olduğun Fakülte</label>
                        <select id="prof-faculty">
                            <option value="Tıp Fakültesi" ${userProfile.faculty === 'Tıp Fakültesi' ? 'selected' : ''}>Tıp Fakültesi</option>
                            <option value="Bilgisayar Fakültesi" ${userProfile.faculty === 'Bilgisayar Fakültesi' ? 'selected' : ''}>Bilgisayar Fakültesi</option>
                            <option value="Diş Hekimliği" ${userProfile.faculty === 'Diş Hekimliği' ? 'selected' : ''}>Diş Hekimliği</option>
                            <option value="Hukuk Fakültesi" ${userProfile.faculty === 'Hukuk Fakültesi' ? 'selected' : ''}>Hukuk Fakültesi</option>
                            <option value="Mimarlık Fakültesi" ${userProfile.faculty === 'Mimarlık Fakültesi' ? 'selected' : ''}>Mimarlık Fakültesi</option>
                            <option value="Eğitim Fakültesi" ${userProfile.faculty === 'Eğitim Fakültesi' ? 'selected' : ''}>Eğitim Fakültesi</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Kampüs Bio'n</label>
                        <textarea id="prof-bio" rows="3">${userProfile.bio}</textarea>
                    </div>
                    <button class="btn-primary" id="save-profile-btn">Profilimi Kaydet</button>
                </div>
            </div>
        `;

        document.getElementById('save-profile-btn').addEventListener('click', () => {
            userProfile.name = document.getElementById('prof-name').value;
            userProfile.surname = document.getElementById('prof-surname').value;
            userProfile.age = document.getElementById('prof-age').value;
            userProfile.faculty = document.getElementById('prof-faculty').value;
            userProfile.year = document.getElementById('prof-year').value; // Artık serbest inputtan okunuyor
            userProfile.bio = document.getElementById('prof-bio').value;
            openModal('Başarılı', '<p>Profilin güncellendi!</p>');
        });
    }

    function renderSettings() {
        mainContent.innerHTML = `
            <div class="card">
                <h2>⚙️ Uygulama Ayarları</h2>
                <div style="background: #F3F4F6; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                    <div class="form-group">
                        <label>Dil Seçimi (Language)</label>
                        <select>
                            <option>Türkçe</option>
                            <option>English</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Bildirim Tercihleri</label>
                        <select>
                            <option>Tüm Bildirimleri Aç</option>
                            <option>Sadece Mesajları Bildir</option>
                            <option>Sessiz Mod</option>
                        </select>
                    </div>
                </div>
                
                <h3 style="margin-bottom:15px; color:var(--text-gray); font-size:14px;">Hesap İşlemleri</h3>
                <button class="btn-danger" onclick="logout()">🚪 Güvenli Çıkış Yap</button>
            </div>
        `;
    }

    // --- 7. SAYFA GEÇİŞ SİSTEMİ (ROUTING) ---
    function loadPage(pageName) {
        if (pageName === 'home') mainContent.innerHTML = getHomeContent();
        else if (pageName === 'market') renderListings('market', '🛒 Kampüs Market', 'Satıcıya Yaz');
        else if (pageName === 'housing') renderListings('housing', '🔑 Ev Arkadaşı & Yurt', 'İletişime Geç');
        else if (pageName === 'confessions') renderConfessions();
        else if (pageName === 'messages') renderMessages(); 
        else if (pageName === 'settings') renderSettings();
        
        if(window.innerWidth <= 1024) sidebar.classList.remove('open');
        window.scrollTo(0,0);
    }

    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            if(e.currentTarget.getAttribute('data-target')) {
                menuItems.forEach(m => m.classList.remove('active'));
                e.currentTarget.classList.add('active');
                loadPage(e.currentTarget.getAttribute('data-target'));
            }
        });
    });

    document.getElementById('logo-btn').addEventListener('click', () => {
        menuItems.forEach(m => m.classList.remove('active'));
        document.querySelector('[data-target="home"]').classList.add('active');
        loadPage('home');
    });
    
    document.getElementById('profile-btn').addEventListener('click', () => {
        menuItems.forEach(m => m.classList.remove('active'));
        renderProfile();
        if(window.innerWidth <= 1024) sidebar.classList.remove('open');
    });

});
