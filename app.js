document.addEventListener("DOMContentLoaded", () => {
    const menuItems = document.querySelectorAll('.menu-item[data-target]');
    const mainContent = document.getElementById('main-content');
    
    let userProfile = { name: "Ege", surname: "Yılmaz", university: "Global University", faculty: "Bilgisayar Mühendisliği", year: "2. Sınıf", bio: "Kampüs hayatını ve teknolojiyi seviyorum." };

    // SİSTEM HAFIZASI: Katılınan Fakülteler
    let joinedFaculties = [];

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

    // MODAL YÖNETİMİ
    const modal = document.getElementById('app-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    window.openModal = function(title, contentHTML) { modalTitle.innerText = title; modalBody.innerHTML = contentHTML; modal.classList.add('active'); }
    window.closeModal = function() { modal.classList.remove('active'); }
    document.getElementById('modal-close').addEventListener('click', closeModal);
    window.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    // MOBİL MENÜ YÖNETİMİ
    const sidebar = document.getElementById('sidebar');
    document.getElementById('mobile-menu-btn').addEventListener('click', () => { sidebar.classList.toggle('open'); });

    // DAHA FAZLA GÖSTER MANTIĞI
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

    // 1. ANA SAYFA
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

    // 2. SAYFA İÇİ ARAMALI İLAN LİSTELEYİCİ
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

        drawGrid(); // İlk çizim
        searchInput.addEventListener('input', (e) => drawGrid(e.target.value.toLowerCase())); // Arama dinleyici
    }

    // 3. ANONİM KAMPÜS (KARE TASARIM & MODAL DETAY)
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
            id: Date.now(), 
            avatar: ["👻","👽","🤖","🦊","🎭"][Math.floor(Math.random()*5)], 
            color: pastelColors[Math.floor(Math.random()*5)],
            user: "Anonim #"+Math.floor(Math.random()*999), 
            time: "Şimdi", 
            text: text 
        });
        closeModal();
        drawConfessionsGrid();
    }

    function drawConfessionsGrid() {
        const feed = document.getElementById('conf-feed');
        let html = '';
        confessionsDB.forEach((post, index) => {
            html += `
                <div class="confession-square" style="background:${post.color};" onclick="openConfessionDetail(${index})">
                    <div class="confession-square-header">
                        <div class="confession-square-avatar">${post.avatar}</div>
                        <div class="confession-square-time">${post.time}</div>
                    </div>
                    <div class="confession-square-text">${post.text}</div>
                </div>
            `;
        });
        feed.innerHTML = html;
    }

    // Kareye Tıklanınca Büyüyen Modal
    window.openConfessionDetail = function(index) {
        const post = confessionsDB[index];
        openModal(post.user + ' Diyor ki:', `
            <div style="background:${post.color}; padding: 25px; border-radius: 12px; font-size: 18px; line-height: 1.6; margin-bottom: 20px;">
                ${post.text}
            </div>
            <div style="display:flex; gap:10px;">
                <button class="action-btn" onclick="alert('Beğenildi!')">👍 Beğen</button>
                <button class="action-btn" onclick="alert('Yanıt bölümü açılıyor...')">💬 Yanıtla</button>
            </div>
        `);
    }

    // 4. FAKÜLTE KATILIM (GATEKEEPING) VE SAYFA SİSTEMİ
    function updateMyFacultiesSidebar() {
        const container = document.getElementById('my-joined-faculties');
        let html = '';
        joinedFaculties.forEach(fac => {
            html += `<div class="menu-item community-link" data-name="${fac.name}" data-icon="${fac.icon}" data-color="${fac.color}">
                        ${fac.icon} ${fac.name}
                     </div>`;
        });
        container.innerHTML = html;
        // Yeni eklenen linkleri de dinlemek için tekrar tetikle
        bindCommunityLinks(); 
    }

    window.joinFaculty = function(name, icon, bgColor) {
        joinedFaculties.push({name: name, icon: icon, color: bgColor});
        closeModal();
        updateMyFacultiesSidebar();
        loadFacultyFeed(name, icon, bgColor); // Katıldıktan sonra direkt akışa gir
    }

    window.loadFacultyFeed = function(name, icon, bgColor) {
        let html = `
            <div class="card" style="padding:0; border:none; box-shadow:none; background:transparent;">
                <div class="community-banner" style="background: ${bgColor};">
                    <h1>${icon} ${name}</h1>
                    <div class="community-stats">👥 1,240 Öğrenci • 🟢 42 Çevrimiçi</div>
                    <div class="member-avatars">
                        <div class="avatar">👨‍💻</div><div class="avatar">👩‍⚕️</div>
                        <div class="avatar">👨‍🎨</div><div class="avatar" style="background:#f3f4f6; color:#000; font-size:12px;">+1K</div>
                    </div>
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
                        <div class="confession-text">Arkadaşlar bu hafta sonu yapılacak olan tanışma toplantısı amfi 4'e alınmıştır. Lütfen not alalım.</div>
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

        // Kullanıcı bu fakülteye katılmış mı?
        const isJoined = joinedFaculties.some(f => f.name === name);

        if(isJoined) {
            loadFacultyFeed(name, icon, bgColor);
        } else {
            // Katılma Ekranı
            mainContent.innerHTML = `
                <div class="join-faculty-box">
                    <div class="icon">${icon}</div>
                    <h2>${name} Topluluğuna Hoş Geldin</h2>
                    <p>Bu fakülte ağı kapalı bir topluluktur. Katılarak bölümündeki diğer öğrencilerle tanışabilir, özel notları görebilir ve duyuruları takip edebilirsin.</p>
                    <button class="btn-primary" style="max-width:250px;" onclick="joinFaculty('${name}', '${icon}', '${bgColor}')">Fakülteye Katıl</button>
                </div>
            `;
            window.scrollTo(0,0);
        }
    }

    function bindCommunityLinks() {
        document.querySelectorAll('.community-link').forEach(link => {
            // Çoklu event eklenmesini önlemek için eski eventi kaldır-ekle yapısı
            const clone = link.cloneNode(true);
            link.parentNode.replaceChild(clone, link);
            clone.addEventListener('click', (e) => {
                const name = e.currentTarget.getAttribute('data-name');
                const icon = e.currentTarget.getAttribute('data-icon');
                const color = e.currentTarget.getAttribute('data-color');
                handleFacultyClick(name, icon, color);
            });
        });
    }
    bindCommunityLinks(); // İlk çalıştırma

    // 5. MESAJLAŞMA SİSTEMİ
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
            contact.addEventListener('click', (e) => { currentChatId = e.currentTarget.getAttribute('data-id'); renderMessages(); });
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

    // SAYFA GEÇİŞ (ROUTING)
    function loadPage(pageName) {
        if (pageName === 'home') mainContent.innerHTML = getHomeContent();
        else if (pageName === 'market') renderListings('market', '🛒 Kampüs Market', 'Satıcıya Yaz');
        else if (pageName === 'housing') renderListings('housing', '🔑 Ev Arkadaşı & Yurt İlanları', 'İletişime Geç');
        else if (pageName === 'confessions') renderConfessions();
        else if (pageName === 'messages') renderMessages(); 
        
        if(window.innerWidth <= 1024) sidebar.classList.remove('open');
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
