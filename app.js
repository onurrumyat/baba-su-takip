document.addEventListener("DOMContentLoaded", () => {
    const menuItems = document.querySelectorAll('.menu-item[data-target]');
    const mainContent = document.getElementById('main-content');
    const searchInput = document.getElementById('global-search');
    
    // Kullanıcı Profil Objesi (Global)
    let userProfile = {
        name: "Ege",
        surname: "Yılmaz",
        university: "Global University",
        faculty: "Bilgisayar Mühendisliği",
        year: "2. Sınıf",
        bio: "Kampüs hayatını ve teknolojiyi seviyorum. Yeni insanlarla tanışmaya açığım."
    };

    // Arama ve Listeleme İçin Sahte Veritabanı (Ulaşım çıkarıldı, Kitap/Not Eklendi)
    const database = [
        { id: 1, type: "market", title: "IKEA Çalışma Masası", desc: "Mezun olduğum için satıyorum. Çok az kullanıldı, çiziksiz.", price: "$45", img: "🪑" },
        { id: 2, type: "market", title: "Anatomi Atlası (Netter 7. Baskı)", desc: "Tıp öğrencileri için tertemiz kitap. İhtiyacım kalmadı.", price: "$30", img: "📚" },
        { id: 3, type: "market", title: "Veri Yapıları ve Algoritmalar PDF Notları", desc: "Geçen senenin tüm ders notları, sınavlarda çok işe yarıyor.", price: "$5", img: "📝" },
        { id: 4, type: "market", title: "Mini Buzdolabı", desc: "Yurt odası için ideal boyutta. Sorunsuz çalışıyor.", price: "$80", img: "❄️" },
        { id: 5, type: "housing", title: "Kampüse 5dk - 2 Kişilik Odaya Arkadaş", desc: "Sakin, sigara içmeyen bir ev arkadaşı arıyorum. Faturalar dahil.", price: "$400/Ay", img: "🏠" },
        { id: 6, type: "housing", title: "Şehir Merkezi 1+1 Stüdyo Daire", desc: "Sadece öğrencilere kiralık, eşyalı ve fiber internetli.", price: "$850/Ay", img: "🏢" },
        { id: 7, type: "housing", title: "Yurt Devri (Kız Öğrenci)", desc: "Dönem ortasında ayrıldığım için sözleşmemi devrediyorum.", price: "$300/Ay", img: "🛏️" }
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
    window.closeModal = function() {
        modal.classList.remove('active');
    }
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
                <p>${userProfile.university} - ${userProfile.faculty} öğrencisi olarak kampüs ağındasın. Bugün neler oluyor?</p>
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
                </div>
            </div>
            <div class="card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h2>Hızlı Bakış</h2>
                    <button class="action-btn" style="width:auto;" onclick="document.querySelector('[data-target=\\'market\\']').click()">Market'e Git</button>
                </div>
                <p>Kullanmadığın ders kitaplarını veya notlarını satarak diğer öğrencilere yardımcı olabilirsin.</p>
            </div>
        `;
    }

    function renderListings(type, title, buttonText, buttonActionTitle) {
        const filteredData = database.filter(item => item.type === type);
        let html = `
            <div class="card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 15px;">
                    <h2>${title}</h2>
                    <button class="btn-primary" style="width:auto;" onclick="openModal('Yeni İlan Ver', '<div class=\\'form-group\\'><label>İlan Başlığı</label><input type=\\'text\\' placeholder=\\'Örn: Fizik 101 Notları\\'></div><div class=\\'form-group\\'><label>Fiyat / Takas</label><input type=\\'text\\' placeholder=\\'Örn: $10 veya Kahve ısmarla\\'></div><button class=\\'btn-primary\\' onclick=\\'closeModal()\\'>İlanı Yayınla</button>')">+ İlan Ver</button>
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
                            <button class="action-btn" style="width:auto;" onclick="openModal('${buttonActionTitle}', '<p>Satıcı ile iletişim başlatılıyor...</p><button class=\\'btn-primary\\' onclick=\\'closeModal()\\'>Mesaj Gönder</button>')">${buttonText}</button>
                        </div>
                    </div>
                </div>
            `;
        });
        html += `</div></div>`;
        return html;
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
        else if (pageName === 'market') mainContent.innerHTML = renderListings('market', '🛒 Kampüs Market (Eşya, Kitap & Not)', 'Satıcıya Yaz', 'Ürün Detayı');
        else if (pageName === 'housing') mainContent.innerHTML = renderListings('housing', '🔑 Ev Arkadaşı & Yurt İlanları', 'İletişime Geç', 'Ev Sahibiyle Görüş');
        
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
