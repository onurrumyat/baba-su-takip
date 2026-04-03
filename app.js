document.addEventListener("DOMContentLoaded", () => {
    const menuItems = document.querySelectorAll('.menu-item[data-target]');
    const mainContent = document.getElementById('main-content');
    const logoBtn = document.getElementById('logo-btn');

    // 1. ANA SAYFA İÇERİĞİ
    const homeContent = `
        <div class="card" style="background: linear-gradient(135deg, #4F46E5, #818CF8); color: white;">
            <h2>Hoş Geldin, Ege! 👋</h2>
            <p>Profilini %80 tamamladın. KKTC'deki yeni hayatına başlamak için doğru yerdesin. Sistemimiz bölümüne ve ilgi alanlarına göre sana özel öneriler hazırladı.</p>
        </div>

        <div class="card">
            <h2>✨ AI Önerisi: Seninle Aynı Fakültedekiler</h2>
            <div class="match-grid">
                <div class="match-card">
                    <div class="avatar">👨‍💻</div>
                    <h4>Ahmet Y.</h4>
                    <p>Bilgisayar Müh. • 2. Sınıf</p>
                    <button class="btn-connect" onclick="alert('Ahmet\\'e bağlantı isteği gönderildi!')">Tanış</button>
                </div>
                <div class="match-card">
                    <div class="avatar">👩‍⚕️</div>
                    <h4>Ayşe B.</h4>
                    <p>Tıp Fak. • 1. Sınıf</p>
                    <button class="btn-connect" onclick="alert('Ayşe ile mesajlaşma başlatıldı.')">Mesaj At</button>
                </div>
                <div class="match-card">
                    <div class="avatar">👨‍⚖️</div>
                    <h4>Caner K.</h4>
                    <p>Hukuk Fak. • 3. Sınıf</p>
                    <button class="btn-connect" onclick="alert('Bağlantı isteği gönderildi!')">Tanış</button>
                </div>
            </div>
        </div>

        <div class="card">
            <h2>🛒 Kampüs İkinci El Pazarı <span style="font-size: 14px; color: var(--primary); cursor:pointer;" onclick="alert('İlan Verme Formu Açılır')">+ Yeni İlan Ver</span></h2>
            
            <div class="market-item">
                <div class="market-img">🛏️</div>
                <div class="market-info">
                    <h4>IKEA Çift Kişilik Yatak (Az Kullanılmış)</h4>
                    <p style="color: var(--text-gray); font-size: 14px;">Mezun oluyorum, acil satılık. Nakliyeye yardımcı olurum.</p>
                    <p style="font-size: 12px; margin-top: 5px;">Satıcı: <strong>Mehmet (İşletme 4.Sınıf)</strong></p>
                    <div class="market-price">2.500 TL</div>
                </div>
            </div>

            <div class="market-item">
                <div class="market-img">🚗</div>
                <div class="market-info">
                    <h4>2015 Ford Fiesta - Öğrenciden</h4>
                    <p style="color: var(--text-gray); font-size: 14px;">Motor sorunsuz, evrakları tam. Girne içi görülebilir.</p>
                    <p style="font-size: 12px; margin-top: 5px;">Satıcı: <strong>Zeynep (Mimarlık 3.Sınıf)</strong></p>
                    <div class="market-price">£4.200 (Sterlin)</div>
                </div>
            </div>
        </div>
    `;

    // 2. KAPSAMLI MARKET SAYFASI
    const marketContent = `
        <div class="card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 15px;">
                <h2>🛒 2. El Kampüs Marketi</h2>
                <button class="btn-primary" onclick="alert('İlan Formu')">+ İlan Ver</button>
            </div>
            <p style="color: var(--text-gray); font-size: 14px;">Öğrenciden öğrenciye güvenli alışveriş ağı. Tüm ilanlar öğrenci belgesi onaylıdır.</p>
            
            <div class="grid-2col">
                <div class="item-card">
                    <div class="item-img-large">🛏️</div>
                    <div class="item-details">
                        <div class="item-title">IKEA Çift Kişilik Yatak</div>
                        <div class="item-desc">Mezun oluyorum, acil satılık. Nakliyeye yardımcı olurum. Gönyeli.</div>
                        <div class="item-footer">
                            <span class="item-price-large">2.500 TL</span>
                            <button class="action-btn">Satıcıya Yaz</button>
                        </div>
                    </div>
                </div>
                <div class="item-card">
                    <div class="item-img-large">💻</div>
                    <div class="item-details">
                        <div class="item-title">M1 Macbook Air 8GB</div>
                        <div class="item-desc">Yazılım için kullandım, tertemiz. Garantisi bitti. Pili %88.</div>
                        <div class="item-footer">
                            <span class="item-price-large">18.000 TL</span>
                            <button class="action-btn">Satıcıya Yaz</button>
                        </div>
                    </div>
                </div>
                <div class="item-card">
                    <div class="item-img-large">📚</div>
                    <div class="item-details">
                        <div class="item-title">Tıp Fak. Anatomi Atlası</div>
                        <div class="item-desc">Netter Anatomi 7. Baskı. Çizik yok, jelatinli.</div>
                        <div class="item-footer">
                            <span class="item-price-large">800 TL</span>
                            <button class="action-btn">Satıcıya Yaz</button>
                        </div>
                    </div>
                </div>
                <div class="item-card">
                    <div class="item-img-large">❄️</div>
                    <div class="item-details">
                        <div class="item-title">Beko Mini Buzdolabı</div>
                        <div class="item-desc">Yurt odası için birebir. Sorunsuz soğutuyor.</div>
                        <div class="item-footer">
                            <span class="item-price-large">1.200 TL</span>
                            <button class="action-btn">Satıcıya Yaz</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // 3. KAPSAMLI EV ARKADAŞI / KİRALIK SAYFASI
    const housingContent = `
        <div class="card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 15px;">
                <h2>🔑 Ev Arkadaşı & Kiralık Daireler</h2>
                <button class="btn-primary">İlan Ver / Arıyorum De</button>
            </div>
            <p style="margin-bottom: 15px; color: var(--text-gray); font-size: 14px;">Yapay Zeka, yaşam tarzı anketine (sigara, uyku düzeni, bütçe) göre sana en uygun ev arkadaşlarını listeliyor.</p>
            
            <div class="grid-2col">
                <div class="item-card">
                    <div class="item-img-large" style="background:#fce7f3; font-size: 24px; font-weight:bold; color: #db2777;">🏠 AI %90 Eşleşme</div>
                    <div class="item-details">
                        <div class="item-title">Lefkoşa/Ortaköy - 3+1 Eve 3. Arkadaş</div>
                        <div class="item-desc">Sigara içmeyen, temizliğe dikkat eden öğrenci arıyoruz. Elektrik/Su ortak.</div>
                        <div class="item-footer">
                            <span class="item-price-large">£150 / Ay</span>
                            <button class="action-btn">Evi Gör</button>
                        </div>
                    </div>
                </div>
                <div class="item-card">
                    <div class="item-img-large" style="background:#e0e7ff; font-size: 24px; font-weight:bold; color: #4F46E5;">🏢 Kiralık Daire</div>
                    <div class="item-details">
                        <div class="item-title">Girne Merkez 1+1 Eşyalı</div>
                        <div class="item-desc">Üniversite otobüs durağına 2 dk yürüme mesafesinde, aidat dahil, yeni bina.</div>
                        <div class="item-footer">
                            <span class="item-price-large">£450 / Ay</span>
                            <button class="action-btn">Emlakçıya Yaz</button>
                        </div>
                    </div>
                </div>
                <div class="item-card">
                    <div class="item-img-large" style="background:#fce7f3; font-size: 24px; font-weight:bold; color: #db2777;">🏠 AI %75 Eşleşme</div>
                    <div class="item-details">
                        <div class="item-title">Gönyeli - 2+1 Eve Arkadaş</div>
                        <div class="item-desc">Evcil hayvan kabul edilir. Sadece faturaları bölüşecek birini arıyorum.</div>
                        <div class="item-footer">
                            <span class="item-price-large">£200 / Ay</span>
                            <button class="action-btn">Evi Gör</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // 4. KAPSAMLI ULAŞIM SAYFASI
    const transportContent = `
        <div class="card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 15px;">
                <h2>🚗 Ulaşım & Araç Ağı</h2>
                <div>
                    <button class="btn-primary">Araç Sat/Al</button>
                </div>
            </div>
            
            <div style="background: #EEF2FF; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                <h3 style="font-size:16px; margin-bottom: 10px; color: var(--primary);">📍 Günlük Yolculuk Paylaşımı (Carpooling)</h3>
                <div style="display:flex; justify-content:space-between; align-items:center; background: white; padding: 15px; border-radius: 8px;">
                    <div style="display:flex; align-items:center; gap: 15px;">
                        <div class="avatar" style="margin:0;">🚘</div>
                        <div>
                            <div class="item-title" style="margin-bottom:3px;">Gönyeli ➔ Kampüs (Sabah 08:30)</div>
                            <div class="item-desc" style="margin-bottom:0;">Aracımda 3 kişilik boş yer var. Benzin masrafı bölüşülecek. Sürücü: Ali K.</div>
                        </div>
                    </div>
                    <button class="btn-primary">Koltuk Ayırt (20 TL)</button>
                </div>
            </div>

            <h3 style="font-size:16px; margin-bottom: 10px;">🏷️ Öğrenciden Satılık Araçlar</h3>
            <div class="grid-2col">
                <div class="item-card">
                    <div class="item-img-large">🚙</div>
                    <div class="item-details">
                        <div class="item-title">2015 Ford Fiesta (Otomatik)</div>
                        <div class="item-desc">Evrakları tam, seyrüsefer ödendi. Ada içi ideal öğrenci aracı.</div>
                        <div class="item-footer">
                            <span class="item-price-large">£4.200</span>
                            <button class="action-btn">İletişime Geç</button>
                        </div>
                    </div>
                </div>
                <div class="item-card">
                    <div class="item-img-large">🏍️</div>
                    <div class="item-details">
                        <div class="item-title">Honda PCX 125cc Motor</div>
                        <div class="item-desc">Trafik derdi yok. 2 kask hediye. Kuryelik yapmadım, temiz.</div>
                        <div class="item-footer">
                            <span class="item-price-large">£1.800</span>
                            <button class="action-btn">İletişime Geç</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Sayfa yükleme fonksiyonu
    function loadPage(pageName) {
        if (pageName === 'home') mainContent.innerHTML = homeContent;
        else if (pageName === 'market') mainContent.innerHTML = marketContent;
        else if (pageName === 'housing') mainContent.innerHTML = housingContent;
        else if (pageName === 'transport') mainContent.innerHTML = transportContent;
    }

    // Menü tıklama olayları
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            // Aktif sınıfını güncelle
            menuItems.forEach(m => m.classList.remove('active'));
            e.currentTarget.classList.add('active');

            // Hedef sayfayı yükle
            const targetPage = e.currentTarget.getAttribute('data-target');
            loadPage(targetPage);
        });
    });

    // Logoya tıklayınca Ana Sayfaya dön
    logoBtn.addEventListener('click', () => {
        document.querySelector('[data-target="home"]').click();
    });

    // İlk açılışta ana sayfayı yükle
    loadPage('home');
});
