// ============================================================================
// 🌟 UNILOOP - GLOBAL CAMPUS NETWORK | CORE ENGINE (FIREBASE) 🌟
// ============================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, setDoc, getDoc, updateDoc, arrayUnion, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDaZ3eZsoAKW3ZazFPebAd-b147KaW5wOA",
  authDomain: "voice2post-9e8ca.firebaseapp.com",
  projectId: "voice2post-9e8ca",
  storageBucket: "voice2post-9e8ca.firebasestorage.app",
  messagingSenderId: "511446656614",
  appId: "1:511446656614:web:32101ee70299543c716fa7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

document.addEventListener("DOMContentLoaded", () => {
    
    const bind = (id, event, callback) => { 
        const el = document.getElementById(id); 
        if (el) el.addEventListener(event, callback); 
    };

    window.userProfile = { uid: "", name: "", surname: "", email: "", university: "", avatar: "👨‍🎓", faculty: "" };
    window.joinedFaculties = [];
    
    let marketDB = [];
    let confessionsDB = [];
    let qaDB = [];
    let chatsDB = [];
    let currentChatId = null;

    const FACULTY_PASSCODES = {
        "Tıp Fakültesi": "tıpfak100",
        "Bilgisayar Fakültesi": "bil1000",
        "Diş Hekimliği": "dis1000",
        "Hukuk Fakültesi": "hukuk1000",
        "Mimarlık Fakültesi": "mim1000",
        "Eğitim Fakültesi": "egt1000"
    };

    const globalUniversities = ["Yakın Doğu Üniversitesi (NEU)", "Doğu Akdeniz Üniversitesi (EMU)", "Girne Amerikan Üniversitesi (GAU)", "Uluslararası Kıbrıs Üniversitesi (CIU)", "Orta Doğu Teknik Üniversitesi (ODTÜ)", "Boğaziçi Üniversitesi", "İstanbul Teknik Üniversitesi (İTÜ)", "Bilkent Üniversitesi", "Koç Üniversitesi", "Stanford University", "Massachusetts Institute of Technology (MIT)", "Harvard University"];

    const authScreen = document.getElementById('auth-screen');
    const appScreen = document.getElementById('app-screen');
    const mainContent = document.getElementById('main-content');

    // ============================================================================
    // 1. GİRİŞ & KAYIT
    // ============================================================================
    
    bind('show-register-btn', 'click', () => {
        document.getElementById('login-card').style.display = 'none'; 
        document.getElementById('register-card').style.display = 'block';
    });
    
    bind('show-login-btn', 'click', () => {
        document.getElementById('register-card').style.display = 'none'; 
        document.getElementById('login-card').style.display = 'block';
    });

    const uniInput = document.getElementById('reg-uni');
    const uniList = document.getElementById('uni-autocomplete-list');
    if (uniInput && uniList) {
        uniInput.addEventListener('input', function() {
            const val = this.value;
            uniList.innerHTML = '';
            if (!val) return false;
            const matches = globalUniversities.filter(u => u.toLowerCase().includes(val.toLowerCase()));
            matches.forEach(match => {
                const div = document.createElement('div');
                const regex = new RegExp(`(${val})`, "gi");
                div.innerHTML = match.replace(regex, "<strong>$1</strong>");
                div.addEventListener('click', function() {
                    uniInput.value = match; uniList.innerHTML = ''; 
                });
                uniList.appendChild(div);
            });
        });
        document.addEventListener('click', (e) => { if(e.target !== uniInput) uniList.innerHTML = ''; });
    }

    bind('register-btn', 'click', async () => {
        const name = document.getElementById('reg-name').value.trim();
        const surname = document.getElementById('reg-surname').value.trim();
        const uni = document.getElementById('reg-uni').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;

        if(!name || !surname || !uni || !email || !password) return alert("Lütfen tüm alanları doldurun.");
        if(!email.includes(".edu")) return alert("Güvenlik nedeniyle sadece onaylı .edu uzantılı üniversite e-postaları kabul edilmektedir.");

        try {
            const userCred = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCred.user;
            
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid, name: name, surname: surname, university: uni, email: email, avatar: "👨‍🎓", isOnline: false, faculty: ""
            });

            await addDoc(collection(db, "chats"), {
                participants: [user.uid, "system"],
                participantNames: { [user.uid]: name, "system": "UniLoop Ekibi" },
                participantAvatars: { [user.uid]: "👨‍🎓", "system": "🌍" },
                lastUpdated: serverTimestamp(),
                messages: [{
                    senderId: "system", 
                    text: `Merhaba ${name}! UniLoop'a hoş geldin. İlan verebilir, itirafları okuyabilir ve kampüsün nabzını tutabilirsin.`, 
                    time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                }]
            });

            await sendEmailVerification(user);
            alert("Kayıt başarılı! Lütfen " + email + " adresine giden doğrulama linkine tıklayarak hesabınızı aktif edin.");
            await signOut(auth);
            document.getElementById('show-login-btn').click();
        } catch (error) {
            alert("Kayıt olurken bir hata oluştu: " + error.message);
        }
    });

    bind('login-btn', 'click', async () => {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const btn = document.getElementById('login-btn');

        if(!email || !password) return alert("Lütfen e-posta ve şifrenizi girin.");

        const originalText = btn.innerText;
        btn.innerText = "Giriş Yapılıyor...";
        btn.disabled = true;

        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error("Giriş Hatası:", error);
            alert("Giriş başarısız! E-posta veya şifreniz yanlış.");
            btn.innerText = originalText;
            btn.disabled = false;
        } 
    });

    window.logout = async function() {
        try {
            if(window.userProfile.uid) await updateDoc(doc(db, "users", window.userProfile.uid), { isOnline: false });
            await signOut(auth);
            if(authScreen && appScreen) {
                appScreen.style.display = 'none';
                authScreen.style.display = 'flex';
                document.getElementById('login-card').style.display = 'block';
                document.getElementById('register-card').style.display = 'none';
            }
        } catch(error) { console.error("Çıkış hatası:", error); }
    };

    // ============================================================================
    // 2. OTURUM DURUMU (PROFİL BİLGİLERİ KAYDEDİLMESİ)
    // ============================================================================

    onAuthStateChanged(auth, async (user) => {
        if (user) { 
            try {
                const userDocRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(userDocRef);
                
                if(docSnap.exists()) {
                    window.userProfile = docSnap.data();
                } else {
                    window.userProfile = { 
                        uid: user.uid, name: "Kampüs", surname: "Öğrencisi", email: user.email, 
                        university: "UniLoop Ağı", avatar: "👨‍🎓", faculty: "", isOnline: true
                    };
                    await setDoc(userDocRef, window.userProfile);
                }
                
                if(!window.userProfile.email) window.userProfile.email = user.email;
                if(!window.userProfile.university) window.userProfile.university = "UniLoop Ağı";

                await updateDoc(userDocRef, { isOnline: true });
                initRealtimeListeners(user.uid);

                if(authScreen && appScreen) { 
                    authScreen.style.display = 'none'; 
                    appScreen.style.display = 'block'; 
                    
                    // 💡 PROFİLE KAYDEDİLMİŞ FAKÜLTE VARSA OTOMATİK EKLE
                    if(window.userProfile.faculty) {
                        window.joinedFaculties = [{name: window.userProfile.faculty, icon: "🏢", color: "linear-gradient(135deg, #1E3A8A, #4F46E5)"}];
                        window.updateMyFacultiesSidebar();
                    }

                    const activeTab = document.querySelector('.menu-item.active');
                    window.loadPage(activeTab ? activeTab.getAttribute('data-target') : 'home'); 
                }
                // Butonu düzelt
                const btn = document.getElementById('login-btn');
                if(btn) { btn.innerText = "Giriş Yap"; btn.disabled = false; }

            } catch(error) { console.error("Kullanıcı verisi yüklenirken hata:", error); }
        }
    });

    window.addEventListener("beforeunload", () => {
        if(window.userProfile.uid) updateDoc(doc(db, "users", window.userProfile.uid), { isOnline: false });
    });

    function initRealtimeListeners(currentUid) {
        onSnapshot(query(collection(db, "listings"), orderBy("createdAt", "desc")), (snapshot) => {
            marketDB = [];
            snapshot.forEach(doc => marketDB.push({ id: doc.id, ...doc.data() }));
            const activeTab = document.querySelector('.menu-item.active');
            if(activeTab && activeTab.getAttribute('data-target') === 'market') window.renderListings('market', '🛒 Kampüs Market', 'Satıcıya Yaz');
            if(activeTab && activeTab.getAttribute('data-target') === 'housing') window.renderListings('housing', '🔑 Ev Arkadaşı & Yurt', 'İletişime Geç');
        });

        onSnapshot(query(collection(db, "confessions"), orderBy("createdAt", "desc")), (snapshot) => {
            confessionsDB = [];
            snapshot.forEach(doc => confessionsDB.push({ id: doc.id, ...doc.data() }));
            const activeTab = document.querySelector('.menu-item.active');
            if(activeTab && activeTab.getAttribute('data-target') === 'confessions') window.drawConfessionsGrid();
        });

        onSnapshot(query(collection(db, "qa"), orderBy("createdAt", "desc")), (snapshot) => {
            qaDB = [];
            snapshot.forEach(doc => qaDB.push({ id: doc.id, ...doc.data() }));
            const activeTab = document.querySelector('.menu-item.active');
            if(activeTab && activeTab.getAttribute('data-target') === 'qa') {
                const activeFilter = document.querySelector('.qa-filter-btn.active');
                window.drawQAGrid(activeFilter ? activeFilter.getAttribute('data-filter') : 'Genel');
            }
        });

        onSnapshot(query(collection(db, "chats"), where("participants", "array-contains", currentUid), orderBy("lastUpdated", "desc")), (snapshot) => {
            chatsDB = [];
            let totalChats = 0;
            snapshot.forEach(doc => {
                const data = doc.data();
                const otherUid = data.participants.find(p => p !== currentUid);
                const otherName = data.participantNames[otherUid] || "Bilinmeyen";
                const otherAvatar = data.participantAvatars[otherUid] || "👤";
                chatsDB.push({ id: doc.id, otherUid, name: otherName, avatar: otherAvatar, messages: data.messages });
                totalChats++; 
            });

            const badge = document.getElementById('msg-badge');
            if(badge) {
                if(totalChats > 0) { badge.style.display = 'inline-block'; badge.innerText = totalChats; }
                else { badge.style.display = 'none'; }
            }

            const activeTab = document.querySelector('.menu-item.active');
            if(activeTab && activeTab.getAttribute('data-target') === 'messages') window.renderMessages();
        });
    }

    // ============================================================================
    // 3. MODAL VE ORTAK FONKSİYONLAR
    // ============================================================================

    window.goToMessages = function() {
        const msgTab = document.querySelector('[data-target="messages"]');
        if(msgTab) msgTab.click();
    }

    const modal = document.getElementById('app-modal');
    window.openModal = function(title, contentHTML) { 
        document.getElementById('modal-title').innerText = title; 
        document.getElementById('modal-body').innerHTML = contentHTML; 
        modal.classList.add('active'); 
    }
    window.closeModal = function() { 
        modal.classList.remove('active'); 
        document.getElementById('modal-body').innerHTML = ''; // Temizlik
    }
    bind('modal-close', 'click', window.closeModal);
    window.addEventListener('click', (e) => { if (e.target === modal) window.closeModal(); });

    bind('mobile-menu-btn', 'click', () => { document.getElementById('sidebar').classList.toggle('open'); });

    document.body.addEventListener('click', (e) => {
        const link = e.target.closest('.community-link');
        if(link) {
            const name = link.getAttribute('data-name');
            const icon = link.getAttribute('data-icon');
            const color = link.getAttribute('data-color');
            if(typeof window.handleFacultyClick === 'function') window.handleFacultyClick(name, icon, color);
        }
    });

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

    function getHomeContent() {
        return `
            <div class="card" style="background: linear-gradient(135deg, #1E3A8A, #4F46E5); color: white; border:none;">
                <h2 style="font-size:24px; margin-bottom:8px;">Hoş Geldin, ${window.userProfile.name}! 👋</h2>
                <p style="opacity:0.9; font-size:15px;"><strong style="color:#D9FDD3;">${window.userProfile.university}</strong> ağındasın. Kendi kampüsünün ilanlarını ve itiraflarını keşfet.</p>
            </div>
            <div class="card">
                <h2>✨ AI Kampüs Eşleşmeleri</h2>
                <div class="match-grid">
                    <div class="match-card"><div class="avatar">👨‍💻</div><h4>John D.</h4><p>Bilgisayar Müh.</p><button class="action-btn" onclick="openModal('Bağlantı Kur', '<p>İstek gönderildi!</p>')">Bağlan</button></div>
                    <div class="match-card"><div class="avatar">👩‍⚕️</div><h4>Sarah B.</h4><p>Tıp Fakültesi</p><button class="action-btn" onclick="goToMessages()">Mesaj At</button></div>
                </div>
            </div>
        `;
    }

    // ============================================================================
    // 4. İLAN YÖNETİMİ VE GÖNDERİ OLUŞTURMA (HATA ÇÖZÜLDÜ)
    // ============================================================================

    window.renderListings = function(type, title, buttonText) {
        let html = `
            <div class="card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px; flex-wrap:wrap; gap:10px;">
                    <h2 style="margin:0;">${title}</h2>
                    <button class="btn-primary" style="width:auto; padding: 10px 24px;" onclick="openListingForm('${type}')">+ Yeni İlan Ekle</button>
                </div>
                <input type="text" id="local-search-input" class="local-search-bar" placeholder="${title} içinde hızlıca ara...">
                <div class="grid-2col" id="listings-grid-container"></div>
            </div>
        `;
        mainContent.innerHTML = html;
        window.drawListingsGrid(type, buttonText, '');
        const searchInput = document.getElementById('local-search-input');
        if(searchInput) searchInput.addEventListener('input', (e) => window.drawListingsGrid(type, buttonText, e.target.value.toLowerCase())); 
    }

    window.drawListingsGrid = function(type, buttonText, filterText) {
        const container = document.getElementById('listings-grid-container');
        if(!container) return;

        const filteredData = marketDB.filter(item => item.type === type && (item.title.toLowerCase().includes(filterText) || item.desc.toLowerCase().includes(filterText)));
        
        if(filteredData.length === 0) {
            container.innerHTML = `<p style="grid-column: span 2; color: var(--text-gray); text-align:center; padding: 40px 0;">Henüz ilan yok veya bulunamadı.</p>`; return;
        }

        let gridHtml = '';
        filteredData.forEach(item => {
            let imgHtml = '';
            let indicatorsHtml = '';

            if (item.imgUrls && item.imgUrls.length > 0) {
                imgHtml += '<div class="image-gallery">';
                item.imgUrls.forEach((url, i) => {
                    imgHtml += `<div class="gallery-item"><img src="${url}" alt="İlan"></div>`;
                    indicatorsHtml += `<div class="gallery-dot ${i===0 ? 'active' : ''}"></div>`;
                });
                imgHtml += '</div>';
                if(item.imgUrls.length > 1) { imgHtml += `<div class="gallery-indicators">${indicatorsHtml}</div>`; }
            } else if (item.imgUrl) { 
                imgHtml = `<img src="${item.imgUrl}" alt="İlan" style="width:100%; height:100%; object-fit:cover;">`;
            } else {
                imgHtml = `<div style="font-size:48px; width:100%; height:100%; display:flex; align-items:center; justify-content:center;">📦</div>`;
            }

            gridHtml += `
                <div class="item-card">
                    <div class="item-img-large" style="overflow:hidden; position:relative;">${imgHtml}</div>
                    <div class="item-details">
                        <div class="item-title">${item.title}</div>
                        <div class="item-desc">${item.desc}</div>
                        <div style="font-size:11px; color:var(--text-gray); margin-bottom:10px;">Satıcı: <strong>${item.sellerName}</strong></div>
                        <div class="item-footer">
                            <span class="item-price-large">${item.price}</span>
                            <button class="action-btn" style="width:auto;" onclick="startChat('${item.sellerId}', '${item.sellerName}')">${buttonText}</button>
                        </div>
                    </div>
                </div>`;
        });
        container.innerHTML = gridHtml;
    }

    window.openListingForm = function(type) {
        window.openModal('Yeni İlan Oluştur', `
            <div class="form-group"><input type="text" id="new-item-title" placeholder="İlan Başlığı (Örn: Temiz Çalışma Masası)"></div>
            <div class="form-group"><input type="text" id="new-item-price" placeholder="Fiyat (Örn: 500 TL veya Ücretsiz)"></div>
            <div class="form-group"><textarea id="new-item-desc" rows="3" placeholder="İlan detayları ve durumu..."></textarea></div>
            
            <div class="upload-btn-wrapper">
                <button class="action-btn" style="width:100%; justify-content:center;">📷 En Fazla 3 Fotoğraf Seç</button>
                <input type="file" id="new-item-photo" accept="image/*" multiple style="opacity:0; position:absolute; left:0; top:0; height:100%; width:100%; cursor:pointer;" />
            </div>
            
            <div id="preview-container" class="preview-container"></div>
            
            <button class="btn-primary" id="publish-listing-btn" onclick="submitListing('${type}')">İlanı Yayınla</button>
            <p id="upload-status" style="font-size:12px; color:var(--primary); text-align:center; margin-top:10px; display:none;">Yükleniyor, lütfen bekleyin...</p>
        `);

        setTimeout(() => {
            const photoInput = document.getElementById('new-item-photo');
            if(photoInput) {
                photoInput.addEventListener('change', function(e) {
                    const files = Array.from(e.target.files).slice(0, 3); 
                    const previewContainer = document.getElementById('preview-container');
                    previewContainer.innerHTML = ''; 
                    
                    files.forEach(file => {
                        const reader = new FileReader();
                        reader.onload = function(event) {
                            previewContainer.innerHTML += `<div class="preview-box"><img src="${event.target.result}"></div>`;
                        }
                        reader.readAsDataURL(file);
                    });
                });
            }
        }, 100);
    }

    // HATA BURADA ÇÖZÜLDÜ: Fotoğraf olmasa bile ilan yayınlanır, hata fırlatmaz.
    window.submitListing = async function(type) {
        const title = document.getElementById('new-item-title').value;
        const price = document.getElementById('new-item-price').value;
        const desc = document.getElementById('new-item-desc').value;
        const photoInput = document.getElementById('new-item-photo');
        const statusEl = document.getElementById('upload-status');
        const btn = document.getElementById('publish-listing-btn');

        if(!title || !price || !desc) return alert("Lütfen başlık, fiyat ve açıklama girin.");

        btn.disabled = true;
        statusEl.style.display = 'block';

        let files = [];
        if(photoInput && photoInput.files && photoInput.files.length > 0) {
            files = Array.from(photoInput.files).slice(0, 3);
        }

        let imgUrlsArray = [];

        try {
            // Eğer dosya seçildiyse storage'a yükle
            for (let file of files) {
                const storageRef = ref(storage, 'listings/' + Date.now() + '_' + file.name);
                await uploadBytes(storageRef, file);
                const url = await getDownloadURL(storageRef);
                imgUrlsArray.push(url);
            }

            await addDoc(collection(db, "listings"), {
                type: type, 
                title: title, 
                price: price, 
                desc: desc, 
                imgUrls: imgUrlsArray, 
                imgUrl: imgUrlsArray.length > 0 ? imgUrlsArray[0] : "", 
                sellerId: window.userProfile.uid, 
                sellerName: window.userProfile.name + " " + window.userProfile.surname,
                createdAt: serverTimestamp()
            });

            window.closeModal();
        } catch (error) {
            console.error("İlan eklenirken hata:", error);
            alert("İlan yayınlanırken bir hata oluştu.");
            statusEl.style.display = 'none';
            btn.disabled = false;
        }
    }

    // ============================================================================
    // 5. MESAJLAŞMA SİSTEMİ (CHATS)
    // ============================================================================

    window.startChat = async function(targetUserId, targetUserName) {
        if(targetUserId === window.userProfile.uid) return alert("Kendi ilanınıza mesaj atamazsınız!");

        const existingChat = chatsDB.find(chat => chat.otherUid === targetUserId);
        
        if(existingChat) {
            window.goToMessages();
            setTimeout(() => window.openChatView(existingChat.id), 200);
        } else {
            try {
                const newChatRef = await addDoc(collection(db, "chats"), {
                    participants: [window.userProfile.uid, targetUserId],
                    participantNames: { [window.userProfile.uid]: window.userProfile.name, [targetUserId]: targetUserName },
                    participantAvatars: { [window.userProfile.uid]: window.userProfile.avatar, [targetUserId]: "👤" },
                    lastUpdated: serverTimestamp(),
                    messages: []
                });
                window.goToMessages();
                setTimeout(() => window.openChatView(newChatRef.id), 500); 
            } catch (error) { console.error(error); }
        }
    }

    window.renderMessages = function() {
        let html = `
            <div class="card" style="padding:0; border:none;">
                <div class="chat-layout" id="chat-layout-container">
                    <div class="chat-sidebar">
                        <div class="chat-sidebar-header">Mesajlar</div>
        `;
        
        chatsDB.forEach(chat => {
            const lastMsgObj = chat.messages[chat.messages.length - 1];
            const lastMsg = lastMsgObj ? lastMsgObj.text : "Henüz mesaj yok.";
            const time = lastMsgObj ? lastMsgObj.time : "";
            const isActive = chat.id === currentChatId ? 'active' : '';
            html += `
                <div class="chat-contact ${isActive}" data-id="${chat.id}" onclick="openChatView('${chat.id}')">
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
                            <div>Mesajlaşmaya başlamak için sol taraftan bir kişi seçin.</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        mainContent.innerHTML = html;
        if(window.innerWidth > 1024 && currentChatId && chatsDB.find(c=>c.id===currentChatId)) window.openChatView(currentChatId);
    }

    window.openChatView = function(chatId) {
        currentChatId = chatId;
        const activeChat = chatsDB.find(c => c.id === chatId);
        if(!activeChat) return;

        const container = document.getElementById('chat-main-view');
        const layoutContainer = document.getElementById('chat-layout-container');
        layoutContainer.classList.add('chat-active');

        let chatHTML = `
            <div class="chat-header">
                <button class="back-btn" onclick="document.getElementById('chat-layout-container').classList.remove('chat-active'); currentChatId=null;">←</button>
                <div class="avatar" style="width:42px; height:42px; font-size:20px; margin:0;">${activeChat.avatar}</div>
                <div class="chat-header-info">
                    <div class="chat-header-name">${activeChat.name}</div>
                    <div class="chat-header-status">Çevrimiçi olabilir</div>
                </div>
            </div>
            <div class="chat-messages" id="chat-messages-scroll">
        `;
        
        activeChat.messages.forEach(msg => { 
            const type = msg.senderId === window.userProfile.uid ? 'sent' : 'received';
            const ticks = type === 'sent' ? '<span class="ticks">✓✓</span>' : '';
            chatHTML += `<div class="bubble ${type}"><div class="msg-text">${msg.text}</div><div class="msg-time">${msg.time} ${ticks}</div></div>`; 
        });
        
        chatHTML += `
            </div>
            <div class="chat-input-area">
                <div class="chat-input-wrapper">
                    <input type="text" id="chat-input-field" placeholder="Bir mesaj yazın...">
                </div>
                <button class="chat-send-btn" onclick="sendMsg('${chatId}')">➤</button>
            </div>
        `;
        container.innerHTML = chatHTML;
        
        const scrollBox = document.getElementById('chat-messages-scroll');
        if(scrollBox) scrollBox.scrollTop = scrollBox.scrollHeight;

        const inputField = document.getElementById('chat-input-field');
        if(inputField) {
            inputField.addEventListener('keypress', (e) => { if(e.key === 'Enter') window.sendMsg(chatId); });
        }
    }

    window.sendMsg = async function(chatId) {
        const input = document.getElementById('chat-input-field');
        if(input && input.value.trim() !== '') {
            const text = input.value.trim();
            input.value = '';
            const timeStr = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            await updateDoc(doc(db, "chats", chatId), {
                messages: arrayUnion({ senderId: window.userProfile.uid, text: text, time: timeStr }),
                lastUpdated: serverTimestamp()
            });
        }
    };

    // ============================================================================
    // 6. İTİRAFLAR (HATA ÇÖZÜLDÜ)
    // ============================================================================

    window.renderConfessions = function() {
        let html = `
            <div class="card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">
                    <h2 style="margin:0;">🤫 Anonim Kampüs</h2>
                    <button class="btn-primary" style="width:auto;" onclick="openConfessionForm()">+ İtiraf Yaz</button>
                </div>
                <div class="confessions-feed" id="conf-feed"></div>
            </div>
        `;
        mainContent.innerHTML = html;
        if(confessionsDB) window.drawConfessionsGrid();
    }

    window.openConfessionForm = function() {
        window.openModal('Yeni Anonim Gönderi', `
            <div class="form-group"><input type="text" id="new-conf-tag" placeholder="Örn: 📍 Kütüphane"></div>
            <textarea id="new-conf-text" class="form-group" style="width:100%; height:120px; border-radius:12px; padding:15px; font-size:16px;" placeholder="Aklından ne geçiyor?"></textarea>
            <button class="btn-primary" id="publish-conf-btn" onclick="submitConfession()">Kampüse Gönder</button>
        `);
    }

    window.submitConfession = async function() {
        const textEl = document.getElementById('new-conf-text');
        const tagEl = document.getElementById('new-conf-tag');
        const btn = document.getElementById('publish-conf-btn');
        if(!textEl || textEl.value.trim() === '') return;
        
        btn.disabled = true;

        const themes = ["theme-midnight", "theme-love", "theme-drama"];
        const tagVal = tagEl && tagEl.value ? tagEl.value : "📍 Kampüs";
        
        try {
            await addDoc(collection(db, "confessions"), {
                avatar: ["👻","👽","🤖","🦊","🎭"][Math.floor(Math.random()*5)], 
                theme: themes[Math.floor(Math.random()*3)],
                user: "Anonim #"+Math.floor(Math.random()*9999), time: "Şimdi", tag: tagVal, text: textEl.value, likes: 0, comments: 0, createdAt: serverTimestamp()
            });
            window.closeModal();
        } catch(e) { 
            alert("Hata: " + e.message); 
            btn.disabled = false;
        }
    }

    window.drawConfessionsGrid = function() {
        const feed = document.getElementById('conf-feed');
        if(!feed) return;
        let html = '';
        confessionsDB.forEach((post, index) => {
            html += `
            <div class="confess-card ${post.theme}" onclick="openConfessionDetail('${post.id}')">
                <div class="cc-header">
                    <div class="cc-avatar">${post.avatar}</div>
                    <div class="cc-meta">
                        <span class="cc-author">${post.user}</span><span class="cc-time">${post.time}</span><span class="cc-tag">${post.tag}</span>
                    </div>
                </div>
                <div class="cc-body">"${post.text}"</div>
                <div class="cc-footer">
                    <div class="cc-action-btn">🔥 (${post.likes})</div><div class="cc-action-btn">💬 (${post.comments})</div>
                </div>
            </div>`;
        });
        feed.innerHTML = html;
    }

    window.openConfessionDetail = function(docId) {
        const post = confessionsDB.find(p => p.id === docId);
        if(!post) return;
        let bgStyle = post.theme === "theme-midnight" ? "linear-gradient(135deg, #111827, #374151)" : post.theme === "theme-love" ? "linear-gradient(135deg, #4c1d95, #be185d)" : "linear-gradient(135deg, #7f1d1d, #ea580c)";

        window.openModal(post.user + ' Diyor ki:', `
            <div style="background:${bgStyle}; color:white; padding: 30px; border-radius: 16px; font-size: 18px; line-height: 1.6; margin-bottom: 24px; font-style:italic;">
                <div style="font-size:12px; margin-bottom:10px; opacity:0.8;">${post.tag}</div>"${post.text}"
            </div>
            <div style="display:flex; gap:12px;">
                <button class="action-btn" style="flex:1;" onclick="alert('Beğenildi!')">🔥 Yanıyor</button>
            </div>
        `);
    }

    // ============================================================================
    // 7. SORU VE CEVAP MODÜLÜ (HATA ÇÖZÜLDÜ)
    // ============================================================================

    window.renderQA = function() {
        let html = `
            <div class="card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 16px; flex-wrap:wrap; gap:10px;">
                    <h2 style="margin:0;">❓ Kampüs Soru & Cevap</h2>
                    <button class="btn-primary" style="width:auto; padding: 10px 24px;" onclick="openQAForm()">+ Soru Sor</button>
                </div>
                <div class="qa-filters" id="qa-filters-container">
                    <button class="qa-filter-btn active" data-filter="Genel" onclick="filterQA(this, 'Genel')">Genel</button>
                    <button class="qa-filter-btn" data-filter="Yurtlar" onclick="filterQA(this, 'Yurtlar')">Yurtlar</button>
                    <button class="qa-filter-btn" data-filter="Ders" onclick="filterQA(this, 'Ders')">Ders</button>
                    <button class="qa-filter-btn" data-filter="Kampüs Yaşamı" onclick="filterQA(this, 'Kampüs Yaşamı')">Kampüs Yaşamı</button>
                </div>
                <div id="qa-feed"></div>
            </div>
        `;
        mainContent.innerHTML = html;
        window.drawQAGrid('Genel'); 
    }

    window.filterQA = function(btn, filterName) {
        document.querySelectorAll('.qa-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        window.drawQAGrid(filterName);
    }

    window.openQAForm = function() {
        window.openModal('Yeni Soru Sor', `
            <div class="form-group">
                <label>Kategori Seç</label>
                <select id="new-qa-tag"><option>Genel</option><option>Yurtlar</option><option>Ders</option><option>Kampüs Yaşamı</option></select>
            </div>
            <textarea id="new-qa-text" class="form-group" style="width:100%; height:120px; border-radius:12px; padding:15px; font-size:15px;" placeholder="Sorunuzu detaylı yazın..."></textarea>
            <button class="btn-primary" id="publish-qa-btn" onclick="submitQA()">Soruyu Yayınla</button>
        `);
    }

    window.submitQA = async function() {
        const textEl = document.getElementById('new-qa-text');
        const tagEl = document.getElementById('new-qa-tag');
        const btn = document.getElementById('publish-qa-btn');
        if(!textEl || textEl.value.trim() === '') return;
        
        btn.disabled = true;
        try {
            await addDoc(collection(db, "qa"), {
                avatar: window.userProfile.avatar, user: window.userProfile.name, time: "Şimdi", tag: tagEl.value, question: textEl.value, answers: [], createdAt: serverTimestamp()
            });
            window.closeModal();
        } catch(e) { 
            alert("Hata: "+e.message); 
            btn.disabled = false;
        }
    }

    window.drawQAGrid = function(filterTag = 'Genel') {
        const feed = document.getElementById('qa-feed');
        if(!feed) return;
        
        let filteredDB = filterTag === 'Genel' ? qaDB : qaDB.filter(q => q.tag === filterTag);
        if(filteredDB.length === 0) { feed.innerHTML = '<p style="text-align:center; padding: 30px 0; color:var(--text-gray);">Bu kategoride henüz soru yok.</p>'; return; }

        let html = '';
        filteredDB.forEach((q) => {
            const statusClass = q.answers.length > 0 ? 'answered' : '';
            html += `
                <div class="qa-card" onclick="openQADetail('${q.id}')">
                    <div class="qa-left-stats"><div class="qa-stat-box ${statusClass}"><div style="font-size:18px;">${q.answers.length}</div><div style="font-weight:500;">Cevap</div></div></div>
                    <div class="qa-right-content">
                        <div class="qa-title">${q.question}</div>
                        <div class="qa-meta"><span class="qa-tag">${q.tag}</span><span>Soran: <strong>${q.user}</strong></span></div>
                    </div>
                </div>`;
        });
        feed.innerHTML = html;
    }

    window.openQADetail = function(docId) {
        const q = qaDB.find(item => item.id === docId);
        if(!q) return;
        let answersHtml = q.answers.length === 0 ? '<p style="text-align:center; padding:20px; color:var(--text-gray);">İlk cevap veren sen ol!</p>' : '';
        q.answers.forEach(ans => { answersHtml += `<div style="background:#F9FAFB; padding:16px; border-radius:12px; margin-bottom:12px; border:1px solid var(--border-color);"><div style="font-weight:bold; color:var(--primary); margin-bottom:6px;">${ans.user}</div><div style="font-size:15px;">${ans.text}</div></div>`; });

        window.openModal('Soru Detayı', `
            <div style="margin-bottom: 24px;"><span class="qa-tag" style="font-size:12px;">${q.tag}</span><div style="font-size:18px; font-weight:800; margin-top:12px;">${q.question}</div></div>
            <div style="border-top:1px solid var(--border-color); padding-top:24px; margin-bottom:24px;"><h4>Cevaplar (${q.answers.length})</h4>${answersHtml}</div>
            <div style="display:flex; gap:10px;">
                <input type="text" id="new-answer-input" class="form-group" style="flex:1; margin:0;" placeholder="Cevabını yaz...">
                <button class="btn-primary" style="width:auto;" onclick="submitAnswer('${q.id}')">Gönder</button>
            </div>
        `);
    }

    window.submitAnswer = async function(docId) {
        const ansInput = document.getElementById('new-answer-input');
        if(ansInput && ansInput.value.trim() !== '') {
            try {
                await updateDoc(doc(db, "qa", docId), { answers: arrayUnion({ user: window.userProfile.name, text: ansInput.value.trim() }) });
                window.closeModal(); 
            } catch(e) { console.error(e); }
        }
    }

    // ============================================================================
    // 8. FAKÜLTE SİSTEMİ (KALICI VE ESTETİK)
    // ============================================================================

    window.updateMyFacultiesSidebar = function() {
        const container = document.getElementById('my-joined-faculties');
        if(!container) return;
        let html = '';
        window.joinedFaculties.forEach(fac => { html += `<div class="menu-item community-link" data-name="${fac.name}" data-icon="${fac.icon}" data-color="${fac.color}" onclick="handleFacultyClick('${fac.name}', '${fac.icon}', '${fac.color}')">${fac.icon} ${fac.name}</div>`; });
        container.innerHTML = html;
    }

    // 💡 Tıklanınca eğer daha önce girmişse (şifre girmişse) direkt açar
    window.handleFacultyClick = async function(name, icon, bgColor) {
        document.querySelectorAll('.menu-item[data-target]').forEach(m => m.classList.remove('active'));
        if(window.innerWidth <= 1024) document.getElementById('sidebar').classList.remove('open');

        // Fakülte kayıtlı mı?
        const isJoined = window.joinedFaculties.some(f => f.name === name);

        if(isJoined) {
            window.loadFacultyFeed(name, icon, bgColor);
        } else {
            mainContent.innerHTML = `
                <div class="join-faculty-box">
                    <div class="icon">${icon}</div><h2>${name} Ağına Hoş Geldin</h2>
                    <p>Bu alan kapalı bir ağdır. Girmek için fakülte kodunu girmelisin.</p>
                    <div style="max-width: 300px; margin: 0 auto 20px auto;">
                        <input type="text" id="faculty-passcode-input" class="form-group" style="width: 100%; text-align:center; font-size:18px; font-weight:bold; letter-spacing:2px; padding: 15px; border: 2px solid var(--border-color); border-radius: 12px; outline:none;" placeholder="Giriş Kodunu Yazın">
                    </div>
                    <button class="btn-primary" style="max-width:250px; font-size:16px; padding:12px;" onclick="verifyFacultyCode('${name}', '${icon}', '${bgColor}')">Ağa Katıl</button>
                </div>
            `;
            window.scrollTo(0,0);
        }
    }

    // 💡 Şifre doğruysa KİLİTLER VE DİREKT AÇAR
    window.verifyFacultyCode = async function(name, icon, bgColor) {
        const inputCode = document.getElementById('faculty-passcode-input').value.trim();
        if (inputCode.toLowerCase() === FACULTY_PASSCODES[name].toLowerCase()) {
            
            // 1. Profiline mühürle
            window.userProfile.faculty = name; 
            window.joinedFaculties = [{name: name, icon: icon, color: bgColor}]; 
            window.updateMyFacultiesSidebar();
            
            // 2. Veritabanına Kalıcı Olarak Kaydet
            await updateDoc(doc(db, "users", window.userProfile.uid), { faculty: name });
            
            // 3. EKRANI ANINDA FAKÜLTE İÇİNE ÇEVİR
            window.loadFacultyFeed(name, icon, bgColor);
            
        } else { 
            alert("Hatalı kod girdiniz. Lütfen tekrar deneyin."); 
        }
    }

    window.loadFacultyFeed = async function(name, icon, bgColor) {
        let totalMembers = 0; let onlineMembers = 0;
        try {
            const q = query(collection(db, "users"), where("faculty", "==", name));
            const querySnapshot = await getDocs(q);
            totalMembers = querySnapshot.size;
            querySnapshot.forEach((doc) => { if(doc.data().isOnline) onlineMembers++; });
        } catch (e) { console.error(e); }
        
        if(totalMembers === 0) totalMembers = 1; if(onlineMembers === 0) onlineMembers = 1;

        mainContent.innerHTML = `
            <div style="margin-bottom: 24px;">
                <div class="community-banner" style="background: ${bgColor};">
                    <div class="comm-banner-left"><h1>${icon} ${name}</h1><p>Küresel Ağa Bağlısın</p></div>
                    <div class="comm-banner-right">
                        <div class="member-avatars"><div class="avatar">👨‍💻</div><div class="avatar" style="background:white; color:var(--primary); font-size:11px; font-weight:bold;">+${totalMembers}</div></div>
                        <div class="community-stats"><span class="online-dot"></span> Gerçek Çevrimiçi: ${onlineMembers}</div>
                    </div>
                </div>
                <div class="create-post-box">
                    <div class="cp-top"><div class="avatar" style="background:#F3F4F6; font-size:20px;">${window.userProfile.avatar}</div><input type="text" placeholder="${name} ağında paylaşım yap..." onclick="alert('Bu özellik premium sürüme (v2) saklanmıştır.')"></div>
                </div>
            </div>
        `;
    }

    // ============================================================================
    // 9. SAYFA YÖNLENDİRME, PROFİL VE AYARLAR
    // ============================================================================

    window.loadPage = function(pageName) {
        if (pageName === 'home') mainContent.innerHTML = getHomeContent();
        else if (pageName === 'market') window.renderListings('market', '🛒 Kampüs Market', 'Satıcıya Yaz');
        else if (pageName === 'housing') window.renderListings('housing', '🔑 Ev Arkadaşı & Yurt', 'İletişime Geç');
        else if (pageName === 'confessions') window.renderConfessions();
        else if (pageName === 'qa') window.renderQA(); 
        else if (pageName === 'messages') window.renderMessages(); 
        else if (pageName === 'settings') window.renderSettings();
        else if (pageName === 'profile') window.renderProfile();
        
        if(window.innerWidth <= 1024 && sidebar) sidebar.classList.remove('open');
        window.scrollTo(0,0);
    }

    document.querySelectorAll('.menu-item[data-target]').forEach(item => {
        item.addEventListener('click', (e) => {
            if(e.currentTarget.getAttribute('data-target')) {
                document.querySelectorAll('.menu-item[data-target]').forEach(m => m.classList.remove('active'));
                e.currentTarget.classList.add('active');
                window.loadPage(e.currentTarget.getAttribute('data-target'));
            }
        });
    });

    bind('logo-btn', 'click', () => { 
        document.querySelectorAll('.menu-item[data-target]').forEach(m => m.classList.remove('active'));
        document.querySelector('[data-target="home"]').classList.add('active');
        window.loadPage('home'); 
    });
    
    bind('profile-btn', 'click', () => { 
        document.querySelectorAll('.menu-item[data-target]').forEach(m => m.classList.remove('active'));
        window.loadPage('profile'); 
    });

    window.renderProfile = function() {
        mainContent.innerHTML = `
            <div class="card">
                <h2>👤 Profil Bilgilerim</h2>
                <div style="background: #F9FAFB; padding: 24px; border-radius: 16px; border: 1px solid var(--border-color);">
                    <div class="grid-2col" style="margin-top:0;">
                        <div class="form-group"><label>Ad</label><input type="text" id="prof-name" value="${window.userProfile.name}"></div>
                        <div class="form-group"><label>Soyad</label><input type="text" id="prof-surname" value="${window.userProfile.surname}"></div>
                    </div>
                    <div class="form-group"><label>Üniversite</label><input type="text" disabled value="${window.userProfile.university}" style="background:#E5E7EB; cursor:not-allowed;"></div>
                    <div class="form-group"><label>E-posta</label><input type="email" disabled value="${window.userProfile.email}" style="background:#E5E7EB; cursor:not-allowed;"></div>
                    <button class="btn-primary" onclick="saveProfile()" style="padding:12px; margin-bottom: 15px;">Profilimi Kaydet</button>
                    <button class="btn-danger" onclick="logout()">🚪 Güvenli Çıkış Yap</button>
                </div>
            </div>
        `;
    }

    window.saveProfile = async function() {
        const name = document.getElementById('prof-name').value;
        const surname = document.getElementById('prof-surname').value;
        window.userProfile.name = name; window.userProfile.surname = surname;
        await updateDoc(doc(db, "users", window.userProfile.uid), { name: name, surname: surname });
        window.openModal('Başarılı', '<div style="text-align:center;"><p style="font-size:40px; margin:0;">✅</p><p>Profil güncellendi!</p></div>');
    }

    window.renderSettings = function() {
        mainContent.innerHTML = `
            <div class="card">
                <h2>⚙️ Uygulama Ayarları</h2>
                <div style="background: #F9FAFB; padding: 24px; border-radius: 16px; margin-bottom: 24px; border: 1px solid var(--border-color);">
                    <div class="form-group"><label>Dil Seçimi</label><select><option>Türkçe</option><option>English</option></select></div>
                    <div class="form-group"><label>Tema</label><select><option>Aydınlık Mod</option><option>Karanlık Mod (Yakında)</option></select></div>
                </div>
                <button class="btn-danger" onclick="logout()">🚪 Güvenli Çıkış Yap</button>
            </div>
        `;
    }
});
