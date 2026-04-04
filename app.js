document.addEventListener("DOMContentLoaded", () => {
    
    // --- 🌟 KULLANICI PROFİLİ 🌟 ---
    let userProfile = { 
        name: "Ege", surname: "Yılmaz", email: "ege.yilmaz@uniloop.edu", age: 21,
        university: "Global University", // Kayıt olunca otomatik değişecek
        faculty: "Henüz Fakülte Seçilmedi", year: "2. Sınıf", 
        bio: "Kampüs hayatını ve teknolojiyi seviyorum.", avatar: "👨‍🎓"
    };
    let joinedFaculties = [];

    const authScreen = document.getElementById('auth-screen');
    const appScreen = document.getElementById('app-screen');
    const loginCard = document.getElementById('login-card');
    const registerCard = document.getElementById('register-card');
    const menuItems = document.querySelectorAll('.menu-item[data-target]');
    const mainContent = document.getElementById('main-content');

    // --- MOCK VERİTABANLARI ---
    const globalUniversities = [
        "Yakın Doğu Üniversitesi (NEU)", "Doğu Akdeniz Üniversitesi (EMU)", "Girne Amerikan Üniversitesi (GAU)", "Uluslararası Kıbrıs Üniversitesi (CIU)",
        "Orta Doğu Teknik Üniversitesi (ODTÜ)", "Boğaziçi Üniversitesi", "İstanbul Teknik Üniversitesi (İTÜ)", "Bilkent Üniversitesi", "Koç Üniversitesi",
        "Stanford University", "Massachusetts Institute of Technology (MIT)", "Harvard University", "University of Oxford", "University of Cambridge",
        "Technical University of Munich (TUM)", "ETH Zurich", "University of Toronto", "UCL (University College London)", "UCLA", "Yale University"
    ];

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
            id: "chat1", name: "Sarah B.", avatar: "👩‍⚕️", role: "Tıp Fakültesi • 3. Sınıf",
            messages: [
                { type: "received", text: "Merhaba Ege, Anatomi atlası duruyor mu?", time: "13:45" },
                { type: "sent", text: "Selam Sarah, evet duruyor.", time: "13:48" },
                { type: "received", text: "Süper! Kampüsteysen yarın teslim alabilirim.", time: "14:05" }
            ]
        },
        { 
            id: "chat2", name: "John D.", avatar: "👨‍💻", role: "Bilgisayar Mühendisliği",
            messages: [
                { type: "received", text: "Dostum dünkü algoritma ödevini yapabildin mi?", time: "Dün" }
            ]
        }
    ];
    let currentChatId = "chat1";

    // --- 🌟 GİRİŞ / KAYIT SİSTEMİ VE AUTOCOMPLETE 🌟 ---
    document.getElementById('show-register-btn').addEventListener('click', () => {
        loginCard.style.display = 'none';
        registerCard.style.display = 'block';
    });

    document.getElementById('show-login-btn').addEventListener('click', () => {
        registerCard.style.display = 'none';
        loginCard.style.display = 'block';
    });

    document.getElementById('login-btn').addEventListener('click', () => {
        // Mevcut Profili Kullan (Demo)
        authScreen.style.display = 'none';
        appScreen.style.display = 'block';
        loadPage('home');
    });

    // Üniversite Autocomplete (Arama Çubuğu) Mantığı
    const uniInput = document.getElementById('reg-uni');
    const uniList = document.getElementById('uni-autocomplete-list');

    uniInput.addEventListener('input', function() {
        const val = this.value;
        uniList.innerHTML = '';
        if (!val) return false;
        
        const matches = globalUniversities.filter(u => u.toLowerCase().includes(val.toLowerCase()));
        
        matches.forEach(match => {
            const div = document.createElement('div');
            // Eşleşen kısmı kalın yap
            const regex = new RegExp(`(${val})`, "gi");
            div.innerHTML = match.replace(regex, "<strong>$1</strong>");
            
            div.addEventListener('click', function() {
                uniInput.value = match; // Tıklananı inputa yaz
                uniList.innerHTML = ''; // Listeyi temizle
            });
            uniList.appendChild(div);
        });
    });

    // Dışarı tıklayınca listeyi kapat
    document.addEventListener('click', (e) => {
        if(e.target !== uniInput) uniList.innerHTML = '';
    });

    // Kayıt Ol Butonu
    document.getElementById('register-btn').addEventListener('click', () => {
        const name = document.getElementById('reg-name').value;
        const surname = document.getElementById('reg-surname').value;
        const uni = document.getElementById('reg-uni').value;
        const email = document.getElementById('reg-email').value;

        if(!name || !uni || !email) {
            alert("Lütfen ad, üniversite ve e-posta alanlarını doldurun.");
            return;
        }

        // Profili Güncelle
        userProfile.name = name;
        userProfile.surname = surname;
        userProfile.university = uni;
        userProfile.email = email;

        // Uygulamaya Gir
        authScreen.style.display = 'none';
        appScreen.style.display = 'block';
        loadPage('home');
    });

    window.logout = function() {
        appScreen.style.display = 'none';
        authScreen.style.display = 'flex';
        loginCard.style.display = 'block';
        registerCard.style.display = 'none';
    };

    // --- MODAL YÖNETİMİ ---
    const modal = document.getElementById('app-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    window.openModal = function(title, contentHTML) { modalTitle.innerText = title; modalBody.innerHTML = contentHTML; modal.classList.add('active'); }
    window.closeModal = function() { modal.classList.remove('active'); }
    document.getElementById('modal-close').addEventListener('click', closeModal);
    window.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    // --- MOBİL MENÜ ---
    const sidebar = document.getElementById('sidebar');
    document.getElementById('mobile-menu-btn').addEventListener('click', () => { sidebar.classList.toggle('open'); });

    // --- DAHA FAZLA GÖSTER ---
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
            <div class="card" style="background: linear-gradient(135deg, #1E3A8A, #4F46E5); color: white; border:none;">
                <h2 style="font-size:24px; margin-bottom:8px;">Hoş Geldin, ${userProfile.name}! 👋</h2>
                <p style="opacity:0.9; font-size:15px;"><strong style="color:#D9FDD3;">${userProfile.university}</strong> ağındasın. Kendi kampüsünün ilanlarını ve itiraflarını keşfet.</p>
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
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px; flex-wrap:wrap; gap:10px;">
                    <h2 style="margin:0;">${title}</h2>
                    <button class="btn-primary" style="width:auto; padding: 10px 24px;">+ Yeni İlan</button>
                </div>
                <input type="text" id="local-search-input" class="local-search-bar" placeholder="${title} içinde hızlıca ara...">
                <div class="grid-2col" id="listings-grid-container"></div>
            </div>
        `;
        mainContent.innerHTML = html;

        const container = document.getElementById('listings-grid-container');
        const searchInput = document.getElementById('local-search-input');
        
        const drawGrid = (filterText = '') => {
            const filteredData = database.filter(item => item.type === type && (item.title.toLowerCase().includes(filterText) || item.desc.toLowerCase().includes(filterText)));
            if(filteredData.length === 0) {
                container.innerHTML = `<p style="grid-column: span 2; color: var(--text-gray); text-align:center; padding: 40px 0;">Sonuç bulunamadı.</p>`; return;
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
            <textarea id="new-conf-text" class="form-group" style="width:100%; height:120px; border-radius:12px; padding:15px; font-size:16px; background:#F9FAFB;" placeholder="Aklından ne geçiyor? Tamamen anonimdir..."></textarea>
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
            <div style="background:${post.color}; padding: 30px; border-radius: 16px; font-size: 18px; line-height: 1.6; margin-bottom: 24px; color:#1F2937; font-weight:500;">${post.text}</div>
            <div style="display:flex; gap:12px;"><button class="action-btn" style="flex:1;" onclick="alert('Beğenildi!')">👍 Beğen</button><button class="action-btn" style="flex:1;" onclick="alert('Yanıt bölümü açılıyor...')">💬 Yanıtla</button></div>
        `);
    }

    // --- 4. FAKÜLTE KATILIM SİSTEMİ ---
    function updateMyFacultiesSidebar() {
        const container = document.getElementById('my-joined-faculties');
        let html = '';
        joinedFaculties.forEach(fac => {
            html += `<div class="menu-item community-link" data-name="${fac.name}" data-icon="${fac.icon}" data-color="${fac.color}">${fac.icon} ${fac.name}</div>`;
        });
        container.innerHTML = html;
    }

    window.joinFaculty = function(name, icon, bgColor) {
        joinedFaculties = [{name: name, icon: icon, color: bgColor}]; // Sadece 1 fakülte
        userProfile.faculty = name; 
        closeModal();
        updateMyFacultiesSidebar();
        loadFacultyFeed(name, icon, bgColor);
    }

    window.loadFacultyFeed = function(name, icon, bgColor) {
        let html = `
            <div style="margin-bottom: 24px;">
                <div class="community-banner" style="background: ${bgColor};">
                    <div class="comm-banner-left">
                        <h1>${icon} ${name}</h1>
                        <p>${userProfile.university} Ağındasın</p>
                    </div>
                    <div class="comm-banner-right">
                        <div class="member-avatars">
                            <div class="avatar">👨‍💻</div><div class="avatar">👩‍⚕️</div><div class="avatar">👨‍🎨</div>
                            <div class="avatar" style="background:white; color:var(--primary); font-size:11px; font-weight:bold;">+1.2K</div>
                        </div>
                        <div class="community-stats"><span class="online-dot"></span> 42 Çevrimiçi</div>
                    </div>
                </div>

                <div class="create-post-box">
                    <div class="cp-top">
                        <div class="avatar" style="background:#F3F4F6; font-size:20px;">${userProfile.avatar}</div>
                        <input type="text" placeholder="${name} ağında bir şeyler paylaş..." onclick="openModal('Gönderi Oluştur', '<textarea class=\\'form-group\\' style=\\'height:150px; font-size:16px;\\' placeholder=\\'Ne düşünüyorsun?\\'></textarea><button class=\\'btn-primary\\' onclick=\\'closeModal()\\'>Paylaş</button>')">
                    </div>
                    <div class="cp-bottom">
                        <div class="cp-actions">
                            <button class="cp-action-btn">📷 Medya</button>
                            <button class="cp-action-btn">📊 Anket</button>
                        </div>
                        <button class="cp-post-btn" onclick="alert('Gönderi Paylaşıldı!')">Paylaş</button>
                    </div>
                </div>

                <div class="premium-post">
                    <div class="pp-header">
                        <div class="pp-user-info">
                            <div class="avatar" style="background:#E0E7FF;">👨‍🏫</div>
                            <div>
                                <div class="pp-name">Fakülte Dekanlığı</div>
                                <div class="pp-role">Resmi Duyuru Hesabı</div>
                                <div class="pp-time">2 saat önce</div>
                            </div>
                        </div>
                        <div class="pp-options">•••</div>
                    </div>
                    <div class="pp-content">
                        Değerli ${name} öğrencileri,<br><br>Bu hafta sonu gerçekleştirilecek olan etkinlik Amfi 4'e alınmıştır. Katılımınız önemlidir.
                    </div>
                    <div class="pp-stats">
                        <span>👍 128 Beğeni</span>
                        <span>💬 14 Yorum</span>
                    </div>
                    <div class="pp-actions">
                        <button class="pp-btn" onclick="this.classList.toggle('active');">👍 Beğen</button>
                        <button class="pp-btn">💬 Yorum Yap</button>
                        <button class="pp-btn">🔗 Paylaş</button>
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
                    <p>Bu alan öğrencilere ve mezunlara özel, dışarıya kapalı bir ağdır. Katılarak duyuruları takip edebilir, bölümdaşlarınla iletişim kurabilirsin.</p>
                    <button class="btn-primary" style="max-width:250px; font-size:16px; padding:12px;" onclick="joinFaculty('${name}', '${icon}', '${bgColor}')">Fakülte Ağına Katıl</button>
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

    // --- 5. PREMIUM MESAJLAŞMA SİSTEMİ ---
    function renderMessages() {
        let html = `
            <div class="card" style="padding:0; border:none;">
                <div class="chat-layout" id="chat-layout-container">
                    <div class="chat-sidebar">
                        <div class="chat-sidebar-header">Mesajlar</div>
        `;
        
        chatsDB.forEach(chat => {
            const lastMsg = chat.messages[chat.messages.length - 1].text;
            const time = chat.messages[chat.messages.length - 1].time;
            const isActive = chat.id === currentChatId ? 'active' : '';
            html += `
                <div class="chat-contact ${isActive}" data-id="${chat.id}">
                    <div class="avatar">${chat.avatar}</div>
                    <div class="chat-contact-info">
                        <div class="chat-contact-top"><span class="chat-contact-name">${chat.name}</span><span class="chat-contact-time">${time}</span></div>
                        <div class="chat-contact-last">${lastMsg}</div>
                    </div>
                </div>
            `;
        });
        
        html += `
                    </div>
                    <div class="chat-main" id="chat-main-view">
                        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:var(--text-gray); opacity:0.7;">
                            <div style="font-size:48px; margin-bottom:10px;">💬</div>
                            <div>Mesajlaşmaya başlamak için bir kişi seçin.</div>
                        </div>
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
        
        if(window.innerWidth > 1024) openChatView(chatsDB[0].id);
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
                <div class="avatar" style="width:42px; height:42px; font-size:20px; margin:0;">${activeChat.avatar}</div>
                <div class="chat-header-info">
                    <div class="chat-header-name">${activeChat.name}</div>
                    <div class="chat-header-status">çevrimiçi</div>
                </div>
                <div class="chat-header-actions">⋮</div>
            </div>
            <div class="chat-messages" id="chat-messages-scroll">
                <div style="text-align:center; margin-bottom: 20px;">
                    <span style="background: rgba(0,0,0,0.05); padding: 4px 12px; border-radius: 12px; font-size:11px; font-weight:600; color:var(--text-gray);">Bugün</span>
                </div>
        `;
        
        activeChat.messages.forEach(msg => { 
            const ticks = msg.type === 'sent' ? '<span class="ticks">✓✓</span>' : '';
            chatHTML += `<div class="bubble ${msg.type}"><div class="msg-text">${msg.text}</div><div class="msg-time">${msg.time} ${ticks}</div></div>`; 
        });
        
        chatHTML += `
            </div>
            <div class="chat-input-area">
                <button class="chat-attach-btn">+</button>
                <div class="chat-input-wrapper">
                    <input type="text" id="chat-input-field" placeholder="Bir mesaj yazın...">
                </div>
                <button class="chat-send-btn" id="chat-send-btn">➤</button>
            </div>
        `;
        
        container.innerHTML = chatHTML;
        
        const scrollBox = document.getElementById('chat-messages-scroll');
        scrollBox.scrollTop = scrollBox.scrollHeight;

        document.getElementById('back-to-chats').addEventListener('click', () => { layoutContainer.classList.remove('chat-active'); });

        const sendMsg = () => {
            const input = document.getElementById('chat-input-field');
            if(input.value.trim() !== '') {
                const now = new Date();
                const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                activeChat.messages.push({ type: 'sent', text: input.value, time: timeStr });
                openChatView(chatId); 
            }
        };
        document.getElementById('chat-send-btn').addEventListener('click', sendMsg);
        document.getElementById('chat-input-field').addEventListener('keypress', (e) => { if(e.key === 'Enter') sendMsg(); });
    }

    // --- 6. PROFİL VE AYARLAR EKRANI ---
    function renderProfile() {
        mainContent.innerHTML = `
            <div class="card">
                <h2>👤 Profil Bilgilerim</h2>
                <div style="background: #F9FAFB; padding: 24px; border-radius: 16px; border: 1px solid var(--border-color);">
                    <div class="grid-2col" style="margin-top:0;">
                        <div class="form-group"><label>Ad</label><input type="text" id="prof-name" value="${userProfile.name}"></div>
                        <div class="form-group"><label>Soyad</label><input type="text" id="prof-surname" value="${userProfile.surname}"></div>
                    </div>
                    <div class="form-group">
                        <label>Bağlı Olduğun Üniversite</label>
                        <input type="text" disabled value="${userProfile.university}" style="background:#E5E7EB; cursor:not-allowed; opacity:0.7;">
                    </div>
                    <div class="form-group">
                        <label>Okul E-posta Adresi <span style="color:var(--text-gray); font-size:11px;">(Onaylı)</span></label>
                        <input type="email" disabled value="${userProfile.email}" style="background:#E5E7EB; cursor:not-allowed; opacity:0.7;">
                    </div>
                    <div class="grid-2col" style="margin-top:0;">
                        <div class="form-group"><label>Yaş</label><input type="number" id="prof-age" value="${userProfile.age}"></div>
                        <div class="form-group"><label>Sınıf / Yıl</label><input type="text" id="prof-year" value="${userProfile.year}" placeholder="Örn: 3. Sınıf"></div>
                    </div>
                    <div class="form-group">
                        <label>Kampüs Bio'n</label>
                        <textarea id="prof-bio" rows="3">${userProfile.bio}</textarea>
                    </div>
                    <button class="btn-primary" id="save-profile-btn" style="padding:12px; font-size:15px;">Profilimi Kaydet</button>
                </div>
            </div>
        `;

        document.getElementById('save-profile-btn').addEventListener('click', () => {
            userProfile.name = document.getElementById('prof-name').value;
            userProfile.surname = document.getElementById('prof-surname').value;
            userProfile.age = document.getElementById('prof-age').value;
            userProfile.year = document.getElementById('prof-year').value;
            userProfile.bio = document.getElementById('prof-bio').value;
            openModal('Başarılı', '<div style="text-align:center;"><div style="font-size:50px; margin-bottom:10px;">✅</div><p style="font-weight:bold; font-size:18px;">Profilin güncellendi!</p></div>');
        });
    }

    function renderSettings() {
        mainContent.innerHTML = `
            <div class="card">
                <h2>⚙️ Uygulama Ayarları</h2>
                <div style="background: #F9FAFB; padding: 24px; border-radius: 16px; margin-bottom: 24px; border: 1px solid var(--border-color);">
                    <div class="form-group">
                        <label>Dil Seçimi</label>
                        <select><option>Türkçe</option><option>English</option></select>
                    </div>
                    <div class="form-group" style="margin-bottom:0;">
                        <label>Uygulama Teması</label>
                        <select><option>Aydınlık Mod</option><option>Karanlık Mod (Yakında)</option></select>
                    </div>
                </div>
                <button class="btn-danger" onclick="logout()">🚪 Güvenli Çıkış Yap</button>
            </div>
        `;
    }

    // --- 7. SAYFA GEÇİŞ (ROUTING) ---
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
