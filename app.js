document.addEventListener("DOMContentLoaded", () => {
    // --- 1. SİSTEM DEĞİŞKENLERİ VE KULLANICI VERİSİ ---
    const menuItems = document.querySelectorAll('.menu-item[data-target]');
    const mainContent = document.getElementById('main-content');
    const searchInput = document.getElementById('global-search');
    
    // Kullanıcı Profil Objensi (Sistemin Hafızası)
    let userProfile = {
        name: "Ege",
        surname: "Yılmaz",
        age: 21,
        faculty: "Bilgisayar Mühendisliği",
        year: "2. Sınıf",
        bio: "Yazılım geliştirmeyi ve kahve içmeyi severim. Ada hayatına alışmaya çalışıyorum."
    };

    // Arama Çubuğu İçin Sahte Veritabanı
    const database = [
        { id: 1, type: "market", title: "IKEA Çift Kişilik Yatak", desc: "Mezun oluyorum, acil satılık. Gönyeli.", price: "2.500 TL", img: "🛏️" },
        { id: 2, type: "market", title: "M1 Macbook Air 8GB", desc: "Yazılım için kullandım, garantisi bitti.", price: "18.000 TL", img: "💻" },
        { id: 3, type: "market", title: "Tıp Fak. Anatomi Atlası", desc: "Netter 7. Baskı. Çizik yok.", price: "800 TL", img: "📚" },
        { id: 4, type: "housing", title: "Lefkoşa/Ortaköy - 3+1 Eve 3. Arkadaş", desc: "Sigara içmeyen öğrenci arıyoruz.", price: "£150/Ay", img: "🏠" },
        { id: 5, type: "housing", title: "Girne Merkez 1+1 Kiralık", desc: "Otobüs durağına yakın, eşyalı.", price: "£450/Ay", img: "🏢" },
        { id: 6, type: "transport", title: "Gönyeli ➔ Kampüs (Yolculuk)", desc: "Aracımda 3 kişilik boş yer var. Sürücü: Ali K.", price: "20 TL", img: "🚘" },
        { id: 7, type: "transport", title: "2015 Ford Fiesta", desc: "Seyrüsefer ödendi, ideal öğrenci aracı.", price: "£4.200", img: "🚙" }
    ];

    // --- 2. MODAL (AÇILIR PENCERE) YÖNETİMİ ---
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

    // --- 3. MOBİL MENÜ YÖNETİMİ ---
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');

    mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    // --- 4. SAYFA ŞABLONLARI OLUŞTURUCULARI ---

    function getHomeContent() {
        return `
            <div class="card" style="background: linear-gradient(135deg, #4F46E5, #818CF8); color: white;">
                <h2>Hoş Geldin, ${userProfile.name}! 👋</h2>
                <p>${userProfile.faculty} - ${userProfile.year} öğrencisi olarak KKTC'deki yeni hayatına başlamak için doğru yerdesin.</p>
            </div>
            <div class="card">
                <h2>✨ AI Önerisi: Seninle Aynı Fakültedekiler</h2>
                <div class="match-grid">
                    <div class="match-card">
                        <div class="avatar">👨‍💻</div><h4>Ahmet Y.</h4><p>${userProfile.faculty} • 2. Sınıf</p>
                        <button class="action-btn" onclick="openModal('Bağlantı Kur', '<p>Ahmet kişisine bağlantı isteği gönderildi!</p>')">Tanış</button>
                    </div>
                    <div class="match-card">
                        <div class="avatar">👩‍⚕️</div><h4>Ayşe B.</h4><p>Tıp Fak. • 1. Sınıf</p>
                        <button class="action-btn" onclick="openModal('Mesaj At', '<textarea class=\\'form-group\\' style=\\'width:100%; height:80px;\\' placeholder=\\'Mesajınızı yazın...\\'></textarea><button class=\\'btn-primary\\' onclick=\\'closeModal()\\'>Gönder</button>')">Mesaj At</button>
                    </div>
                </div>
            </div>
            <div class="card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h2>Hızlı Bakış</h2>
                    <button class="action-btn" style="width:auto;" onclick="document.querySelector('[data-target=\\'market\\']').click()">Tümünü Gör</button>
                </div>
                <p>Uygulamada dolaşmak için sol menüyü (telefondaysanız sol üstteki ☰ butonunu) kullanın.</p>
            </div>
        `;
    }

    function renderListings(type, title, buttonText, buttonActionTitle) {
        const filteredData = database.filter(item => item.type === type);
        let html = `
            <div class="card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 15px;">
                    <h2>${title}</h2>
                    <button class="btn-primary" style="width:auto;" onclick="openModal('Yeni İlan Ver', '<div class=\\'form-group\\'><label>İlan Başlığı</label><input type=\\'text\\'></div><div class=\\'form-group\\'><label>Fiyat</label><input type=\\'text\\'></div><button class=\\'btn-primary\\' onclick=\\'closeModal()\\'>İlanı Kaydet</button>')">+ İlan Ver</button>
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
                            <button class="action-btn" style="width:auto;" onclick="openModal('${buttonActionTitle}', '<p>${item.title} ile ilgili işlem başlatılıyor...</p><button class=\\'btn-primary\\' onclick=\\'closeModal()\\'>Onayla</button>')">${buttonText}</button>
                        </div>
                    </div>
                </div>
            `;
        });
        html += `</div></div>`;
        return html;
    }

    // --- 5. PROFİL SAYFASI VE KAYIT MANTIĞI ---
    function loadProfilePage() {
        const profileHTML = `
            <div class="card">
                <h2>👤 Profil Bilgilerim</h2>
                <div style="background: #F3F4F6; padding: 20px; border-radius: 10px;">
                    <div class="form-group">
                        <label>Ad</label>
                        <input type="text" id="prof-name" value="${userProfile.name}">
                    </div>
                    <div class="form-group">
                        <label>Soyad</label>
                        <input type="text" id="prof-surname" value="${userProfile.surname}">
                    </div>
                    <div class="form-group">
                        <label>Yaş</label>
                        <input type="number" id="prof-age" value="${userProfile.age}">
                    </div>
                    <div class="form-group">
                        <label>Fakülte</label>
                        <select id="prof-faculty">
                            <option value="Bilgisayar Mühendisliği" ${userProfile.faculty === 'Bilgisayar Mühendisliği' ? 'selected' : ''}>Bilgisayar Mühendisliği</option>
                            <option value="Tıp Fakültesi" ${userProfile.faculty === 'Tıp Fakültesi' ? 'selected' : ''}>Tıp Fakültesi</option>
                            <option value="Hukuk Fakültesi" ${userProfile.faculty === 'Hukuk Fakültesi' ? 'selected' : ''}>Hukuk Fakültesi</option>
                            <option value="Mimarlık" ${userProfile.faculty === 'Mimarlık' ? 'selected' : ''}>Mimarlık</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Sınıf</label>
                        <select id="prof-year">
                            <option value="Hazırlık" ${userProfile.year === 'Hazırlık' ? 'selected' : ''}>Hazırlık</option>
                            <option value="1. Sınıf" ${userProfile.year === '1. Sınıf' ? 'selected' : ''}>1. Sınıf</option>
                            <option value="2. Sınıf" ${userProfile.year === '2. Sınıf' ? 'selected' : ''}>2. Sınıf</option>
                            <option value="3. Sınıf" ${userProfile.year === '3. Sınıf' ? 'selected' : ''}>3. Sınıf</option>
                            <option value="4. Sınıf" ${userProfile.year === '4. Sınıf' ? 'selected' : ''}>4. Sınıf</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Kendinden Bahset (Bio)</label>
                        <textarea id="prof-bio" rows="3">${userProfile.bio}</textarea>
                    </div>
                    <button class="btn-primary" id="save-profile-btn">Değişiklikleri Kaydet</button>
                </div>
            </div>
        `;
        mainContent.innerHTML = profileHTML;

        // Kaydet butonunu dinle
        document.getElementById('save-profile-btn').addEventListener('click', () => {
            userProfile.name = document.getElementById('prof-name').value;
            userProfile.surname = document.getElementById('prof-surname').value;
            userProfile.age = document.getElementById('prof-age').value;
            userProfile.faculty = document.getElementById('prof-faculty').value;
            userProfile.year = document.getElementById('prof-year').value;
            userProfile.bio = document.getElementById('prof-bio').value;
            
            openModal('Başarılı', '<p>Profil bilgileriniz başarıyla güncellendi!</p>');
        });
    }

    document.getElementById('profile-btn').addEventListener('click', () => {
        menuItems.forEach(m => m.classList.remove('active')); // Sol menü seçimini temizle
        loadProfilePage();
        if(window.innerWidth <= 1024) sidebar.classList.remove('open'); // Mobilde menüyü kapat
    });

    // --- 6. ARAMA MOTORU FONKSİYONU ---
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        
        if(term.length === 0) {
            // Arama silindiyse ana sayfaya dön
            document.querySelector('[data-target="home"]').click();
            return;
        }

        // Aramaya uyanları filtrele
        const results = database.filter(item => 
            item.title.toLowerCase().includes(term) || 
            item.desc.toLowerCase().includes(term)
        );

        let searchHTML = `<div class="card"><h2>Arama Sonuçları: "${e.target.value}"</h2>`;
        
        if(results.length === 0) {
            searchHTML += `<p>Aradığınız kritere uygun sonuç bulunamadı.</p></div>`;
        } else {
            searchHTML += `<div class="grid-2col">`;
            results.forEach(item => {
                searchHTML += `
                    <div class="item-card">
                        <div class="item-img-large">${item.img}</div>
                        <div class="item-details">
                            <div class="item-title">${item.title}</div>
                            <div class="item-desc">${item.desc}</div>
                            <div class="item-footer">
                                <span class="item-price-large">${item.price}</span>
                                <button class="action-btn" style="width:auto;" onclick="openModal('İletişim', 'Satıcıya mesaj gönderiliyor...')">İncele</button>
                            </div>
                        </div>
                    </div>
                `;
            });
            searchHTML += `</div></div>`;
        }
        
        // Sol menü aktifliklerini kaldırıp sonuçları göster
        menuItems.forEach(m => m.classList.remove('active'));
        mainContent.innerHTML = searchHTML;
    });

    // --- 7. SAYFA GEÇİŞ SİSTEMİ (ROUTING) ---
    function loadPage(pageName) {
        searchInput.value = ''; // Sayfa değişince aramayı temizle
        if (pageName === 'home') mainContent.innerHTML = getHomeContent();
        else if (pageName === 'market') mainContent.innerHTML = renderListings('market', '🛒 2. El Kampüs Marketi', 'Satıcıya Yaz', 'Mesaj Ekranı');
        else if (pageName === 'housing') mainContent.innerHTML = renderListings('housing', '🔑 Ev Arkadaşı & Kiralık Daireler', 'İletişime Geç', 'Ev Sahibiyle Görüş');
        else if (pageName === 'transport') mainContent.innerHTML = renderListings('transport', '🚗 Araç & Ulaşım Ağı', 'Koltuk/Araç Ayırt', 'Rezervasyon');
        
        // Mobilde bir menüye tıklanınca menüyü otomatik kapat
        if(window.innerWidth <= 1024) {
            sidebar.classList.remove('open');
        }
    }

    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            menuItems.forEach(m => m.classList.remove('active'));
            e.currentTarget.classList.add('active');
            loadPage(e.currentTarget.getAttribute('data-target'));
        });
    });

    document.getElementById('logo-btn').addEventListener('click', () => {
        document.querySelector('[data-target="home"]').click();
    });

    // İlk açılış
    loadPage('home');
});
