document.addEventListener("DOMContentLoaded", () => {
    const menuItems = document.querySelectorAll('.menu-item[data-target]');
    const mainContent = document.getElementById('main-content');
    const searchInput = document.getElementById('global-search');
    
    // Kullanıcı Profil Objesi
    let userProfile = {
        name: "Ege",
        surname: "Yılmaz",
        university: "Global University",
        faculty: "Bilgisayar Mühendisliği",
        year: "2. Sınıf",
        bio: "Kampüs hayatını ve teknolojiyi seviyorum. Yeni insanlarla tanışmaya açığım."
    };

    // Arama ve Listeleme İçin Sahte Veritabanı
    const database = [
        { id: 1, type: "market", title: "IKEA Çalışma Masası", desc: "Mezun olduğum için satıyorum. Çok az kullanıldı, çiziksiz.", price: "$45", img: "🪑" },
        { id: 2, type: "market", title: "Anatomi Atlası (Netter 7. Baskı)", desc: "Tıp öğrencileri için tertemiz kitap. İhtiyacım kalmadı.", price: "$30", img: "📚" },
        { id: 3, type: "market", title: "Veri Yapıları ve Algoritmalar PDF Notları", desc: "Geçen senenin tüm ders notları, sınavlarda çok işe yarıyor.", price: "$5", img: "📝" },
        { id: 4, type: "market", title: "Mini Buzdolabı", desc: "Yurt odası için ideal boyutta. Sorunsuz çalışıyor.", price: "$80", img: "❄️" },
        { id: 5, type: "housing", title: "Kampüse 5dk - 2 Kişilik Odaya Arkadaş", desc: "Sakin, sigara içmeyen bir ev arkadaşı arıyorum. Faturalar dahil.", price: "$400/Ay", img: "🏠" },
        { id: 6, type: "housing", title: "Şehir Merkezi 1+1 Stüdyo Daire", desc: "Sadece öğrencilere kiralık, eşyalı ve fiber internetli.", price: "$850/Ay", img: "🏢" }
    ];

    // ANONİM İTİRAFLAR VERİTABANI
    let confessionsDB = [
        { id: 1, avatar: "👻", user: "Anonim #482", time: "2 saat önce", text: "İlk yılım ve henüz hiç arkadaş bulamadım. Kütüphanede sürekli tek başıma oturuyorum. Benim gibi hisseden var mı?" },
        { id: 2, avatar: "🎭", user: "Anonim #911", time: "5 saat önce", text: "Fizik 101 hocası gerçekten çok zorluyor. Vizeden 20 aldım, geçebilen nasıl geçiyor bu dersi?" },
        { id: 3, avatar: "👽", user: "Anonim #104", time: "1 gün önce", text: "Yemekhanedeki vegan seçenekler son günlerde çok iyi, aşçı değişti galiba. Denemeyenlere tavsiye ederim." }
    ];

    // MODAL YÖNETİMİ
    const modal = document.getElementById('app-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const closeModalBtn = document.getElementById('modal-close');

    window.openModal = function(title, contentHTML) {
        modalTitle.innerText = title;
        modalBody.innerHTML = contentHTML;
        modal.classList.add('active');
    }
    window.closeModal = function() { modal.classList.remove('active'); }
    closeModalBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    // MOBİL MENÜ YÖNETİMİ
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');
    mobileMenuBtn.addEventListener('click', () => { sidebar.classList.toggle('open'); });

    // SAYFA İÇERİK OLUŞTURUCULARI
    function getHomeContent() {
        return `
            <div class="card" style="background: linear-gradient(135deg, #4F46E5, #818CF8); color: white;">
                <h2>Hoş Geldin, ${userProfile.name}! 👋</h2>
                <p>${userProfile.university} - ${userProfile.faculty} öğrencisi olarak UniLoop ağındasın. Bugün kampüste neler oluyor?</p>
            </div>
            <div class="card">
                <h2>✨ AI Kampüs Eşleşmeleri</h2>
                <div class="match-grid">
                    <div class="match-card">
                        <div class="avatar">👨‍💻</div><h4>John D.</h4><p>${userProfile.faculty} • Aynı Sınıf</p>
                        <button class="action-btn" onclick="openModal('Bağlantı Kur', '<p>John kişisine bağlantı isteği gönderildi!</p>')">Bağlan</button>
                    </div>
                    <div class="match-card">
                        <div class="avatar">👩‍⚕️</div><h4>Sarah B.</h4><p>Tıp Fakültesi</p>
                        <button class="action-btn" onclick="openModal('Mesaj At', '<textarea class=\\'form-group\\' style=\\'width:100%; height:80px;\\' placeholder=\\'Mesajınızı yazın...\\'></textarea><button class=\\'btn-primary\\' onclick=\\'closeModal()\\'>Gönder</button>')">Mesaj At</button>
                    </div>
                    <div class="match-card">
                        <div class="avatar">👨‍🎨</div><h4>Alex M.</h4><p>Güzel Sanatlar</p>
                        <button class="action-btn" onclick="openModal('Bağlantı Kur', '<p>Alex kişisine bağlantı isteği gönderildi!</p>')">Bağlan</button>
                    </div>
                </div>
            </div>
            <div class="card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h2>Hızlı Bakış</h2>
                    <button class="action-btn" style="width:auto;" onclick="document.querySelector('[data-target=\\'confessions\\']').click()">İtiraflara Git</button>
                </div>
                <p>Kampüsün anonim sesini dinle. İnsanlar ne konuşuyor, neleri dert ediyor öğrenmek için Anonim Kampüs'e göz at.</p>
            </div>
        `;
    }

    function renderListings(type, title, buttonText, buttonActionTitle) {
        const filteredData = database.filter(item => item.type === type);
        let html = `
            <div class="card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 15px;">
                    <h2>${title}</h2>
                    <button class="btn-primary" style="width:auto;" onclick="openModal('Yeni İlan Ver', '<div class=\\'form-group\\'><label>İlan Başlığı</label><input type=\\'text\\' placeholder=\\'Örn: Fizik 101 Notları veya Çalışma Masası\\'></div><div class=\\'form-group\\'><label>Fiyat / Takas</label><input type=\\'text\\' placeholder=\\'Örn: $10 veya Kahve ısmarla\\'></div><button class=\\'btn-primary\\' onclick=\\'closeModal()\\'>İlanı Yayınla</button>')">+ İlan Ver</button>
                </div>
                <div class="grid-2col">
        `;
        filteredData.forEach(item => {
            html += `
                <div class="item-card">
                    <div class="item-img-large">${item.img}</div>
                    <div class="item-details">
                        <div class="item-title">${item.title}</div>
                        <div class="item-desc">${item.desc}</div>
                        <div class="item-footer">
                            <span class="item-price-large">${item.price}</span>
                            <button class="action-btn" style="width:auto;" onclick="openModal('${buttonActionTitle}', '<p>İlan sahibi ile güvenli mesajlaşma başlatılıyor...</p><button class=\\'btn-primary\\' onclick=\\'closeModal()\\'>Mesaj Gönder</button>')">${buttonText}</button>
                        </div>
                    </div>
                </div>
            `;
        });
        html += `</div></div>`;
        return html;
    }

    // ANONİM KAMPÜS YÖNETİMİ VE AI MODERASYON SİSTEMİ
    function renderConfessions() {
        let html = `
            <div class="card">
                <h2>🤫 Anonim Kampüs & İtiraflar</h2>
                <p style="font-size:12px; color:var(--text-gray); margin-bottom: 15px;">Paylaşımların isimsizdir. AI moderatörümüz kampüs kuralları ve güvenliğiniz için yazılanları analiz eder.</p>
                
                <div style="background: #F3F4F6; padding: 15px; border-radius: 10px; margin-bottom: 25px;">
                    <textarea id="new-confession-text" class="form-group" style="width:100%; height:80px; background:white; border:none;" placeholder="Aklından ne geçiyor? Tamamen anonim olarak paylaş..."></textarea>
                    <div style="text-align: right;">
                        <button class="btn-primary" style="width:auto;" id="post-confession-btn">Gönder</button>
                    </div>
                </div>
                <div id="confession-feed">
        `;
        
        confessionsDB.forEach(post => {
            html += `
                <div class="confession-post">
                    <div class="confession-avatar">${post.avatar}</div>
                    <div class="confession-content">
                        <div class="confession-header">
                            <span class="confession-user">${post.user}</span>
                            <span class="confession-time">${post.time}</span>
                        </div>
                        <div class="confession-text">${post.text}</div>
                        <div class="confession-actions">
                            <span onclick="alert('Beğenildi!')">👍 Beğen</span>
                            <span onclick="alert('Yanıt bölümü açılıyor...')">💬 Yanıtla</span>
                            <span onclick="alert('Şikayet edildi.')">🚩 Bildir</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `</div></div>`;
        mainContent.innerHTML = html;

        // Yeni İtiraf Gönderme ve AI Kontrolü
        document.getElementById('post-confession-btn').addEventListener('click', () => {
            const textInput = document.getElementById('new-confession-text').value;
            if(textInput.trim() === '') return;

            // AI MODERATÖR KELİME LİSTESİ (Zorbalık, Nefret Söylemi, İntihar)
            const toxicWords = ["intihar", "ölmek", "ölmek istiyorum", "depresyon", "hayattan bıktım", "aptal", "çirkin", "nefret", "salak"];
            
            const isToxic = toxicWords.some(word => textInput.toLowerCase().includes(word));

            if(isToxic) {
                // AI MÜDAHALESİ: Gönderiyi engelle ve yardım teklif et
                openModal('⚠️ AI Moderatör Uyarısı', `
                    <div style="text-align:center;">
                        <h1 style="font-size:40px; margin-bottom:10px;">🛡️</h1>
                        <p style="color:#DC2626; font-weight:bold; margin-bottom:10px;">Gönderiniz durduruldu.</p>
                        <p style="font-size:14px; margin-bottom:15px;">Sistemimiz yazdıklarınızda zor zamanlar geçirdiğinize dair kelimeler veya topluluk kurallarına aykırı bir dil tespit etti.</p>
                        <div style="background:#FEF2F2; padding:15px; border-radius:8px; border: 1px solid #FCA5A5;">
                            <p style="font-weight:bold; color:#991B1B;">Yalnız değilsin.</p>
                            <p style="font-size:13px; color:#7F1D1D; margin-top:5px;">Kampüs psikolojik destek merkezi her zaman seninle konuşmaya hazır. Lütfen destek almaktan çekinme.</p>
                            <button class="btn-primary" style="margin-top:10px; background:#DC2626;" onclick="window.open('https://pdrc.neu.edu.tr/', '_blank')">Destek Merkezine Ulaş</button>
                        </div>
                    </div>
                `);
            } else {
                // Temiz içerik, akışa ekle
                const newPost = {
                    id: Date.now(),
                    avatar: ["🦊", "🐼", "🐯", "🐸", "🐵"][Math.floor(Math.random() * 5)], // Rastgele anonim avatar
                    user: "Anonim #" + Math.floor(Math.random() * 999),
                    time: "Şimdi",
                    text: textInput
                };
                confessionsDB.unshift(newPost); // En üste ekle
                renderConfessions(); // Sayfayı yenile
                openModal('Başarılı', '<p>Anonim mesajınız kampüs akışında yayınlandı!</p>');
            }
        });
    }

    // PROFİL SAYFASI
    function loadProfilePage() {
        const profileHTML = `
            <div class="card">
                <h2>👤 Profil Bilgilerim</h2>
                <div style="background: #F3F4F6; padding: 20px; border-radius: 10px;">
                    <div class="grid-2col" style="margin-top:0;">
                        <div class="form-group"><label>Ad</label><input type="text" id="prof-name" value="${userProfile.name}"></div>
                        <div class="form-group"><label>Soyad</label><input type="text" id="prof-surname" value="${userProfile.surname}"></div>
                    </div>
                    <div class="form-group">
                        <label>Üniversite</label>
                        <input type="text" id="prof-uni" value="${userProfile.university}">
                    </div>
                    <div class="grid-2col" style="margin-top:0;">
                        <div class="form-group"><label>Fakülte / Bölüm</label><input type="text" id="prof-faculty" value="${userProfile.faculty}"></div>
                        <div class="form-group">
                            <label>Sınıf</label>
                            <select id="prof-year">
                                <option value="Hazırlık" ${userProfile.year === 'Hazırlık' ? 'selected' : ''}>Hazırlık</option>
                                <option value="1. Sınıf" ${userProfile.year === '1. Sınıf' ? 'selected' : ''}>1. Sınıf</option>
                                <option value="2. Sınıf" ${userProfile.year === '2. Sınıf' ? 'selected' : ''}>2. Sınıf</option>
                                <option value="3. Sınıf" ${userProfile.year === '3. Sınıf' ? 'selected' : ''}>3. Sınıf</option>
                                <option value="4. Sınıf" ${userProfile.year === '4. Sınıf' ? 'selected' : ''}>4. Sınıf</option>
                                <option value="Mezun" ${userProfile.year === 'Mezun' ? 'selected' : ''}>Mezun</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Kampüs Bio'n (Kendinden Bahset)</label>
                        <textarea id="prof-bio" rows="3">${userProfile.bio}</textarea>
                    </div>
                    <button class="btn-primary" id="save-profile-btn">Değişiklikleri Kaydet</button>
                </div>
            </div>
        `;
        mainContent.innerHTML = profileHTML;

        document.getElementById('save-profile-btn').addEventListener('click', () => {
            userProfile.name = document.getElementById('prof-name').value;
            userProfile.surname = document.getElementById('prof-surname').value;
            userProfile.university = document.getElementById('prof-uni').value;
            userProfile.faculty = document.getElementById('prof-faculty').value;
            userProfile.year = document.getElementById('prof-year').value;
            userProfile.bio = document.getElementById('prof-bio').value;
            
            openModal('Başarılı', '<p>Profil bilgileriniz güncellendi. Ana sayfada değişiklikleri görebilirsiniz.</p>');
        });
    }

    document.getElementById('profile-btn').addEventListener('click', () => {
        menuItems.forEach(m => m.classList.remove('active'));
        loadProfilePage();
        if(window.innerWidth <= 1024) sidebar.classList.remove('open');
    });

    // ARAMA MOTORU
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        if(term.length === 0) { document.querySelector('[data-target="home"]').click(); return; }

        const results = database.filter(item => item.title.toLowerCase().includes(term) || item.desc.toLowerCase().includes(term));
        let searchHTML = `<div class="card"><h2>Arama Sonuçları: "${e.target.value}"</h2>`;
        
        if(results.length === 0) { searchHTML += `<p>Aradığınız kritere uygun sonuç bulunamadı.</p></div>`; } 
        else {
            searchHTML += `<div class="grid-2col">`;
            results.forEach(item => {
                searchHTML += `
                    <div class="item-card">
                        <div class="item-img-large">${item.img}</div>
                        <div class="item-details">
                            <div class="item-title">${item.title}</div><div class="item-desc">${item.desc}</div>
                            <div class="item-footer"><span class="item-price-large">${item.price}</span><button class="action-btn" style="width:auto;" onclick="openModal('İletişim', 'İlan sahibiyle mesajlaşma başlatılıyor...')">İncele</button></div>
                        </div>
                    </div>`;
            });
            searchHTML += `</div></div>`;
        }
        menuItems.forEach(m => m.classList.remove('active'));
        mainContent.innerHTML = searchHTML;
    });

    // SAYFA GEÇİŞ SİSTEMİ (ROUTING)
    function loadPage(pageName) {
        searchInput.value = '';
        if (pageName === 'home') mainContent.innerHTML = getHomeContent();
        else if (pageName === 'market') mainContent.innerHTML = renderListings('market', '🛒 Kampüs Market', 'Satıcıya Yaz', 'Ürün Detayı');
        else if (pageName === 'housing') mainContent.innerHTML = renderListings('housing', '🔑 Ev Arkadaşı & Yurt İlanları', 'İletişime Geç', 'Ev Sahibiyle Görüş');
        else if (pageName === 'confessions') renderConfessions(); // Yeni Modül Yükleniyor
        
        if(window.innerWidth <= 1024) sidebar.classList.remove('open');
    }

    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            menuItems.forEach(m => m.classList.remove('active'));
            e.currentTarget.classList.add('active');
            loadPage(e.currentTarget.getAttribute('data-target'));
        });
    });

    document.getElementById('logo-btn').addEventListener('click', () => { document.querySelector('[data-target="home"]').click(); });

    // İlk açılış
    loadPage('home');
});
