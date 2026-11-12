
/* =====================================================
   VANZGRAM - MAIN JAVASCRIPT
   Versi baru berdasarkan struktur VanzGram sebelumnya
   ===================================================== */


/* =====================================================
   1. DATABASE DAN SESSION
   ===================================================== */

const getData = key => {
    try {
        return JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
        return [];
    }
};

const saveData = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
};

const getElement = id => document.getElementById(id);

let currentUser = localStorage.getItem("vanzgram_session");
let currentPage = "chat";
let selectedUser = null;


/* =====================================================
   2. HELPER
   ===================================================== */

function escapeText(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function getCurrentProfile() {
    return getData("vanzgram_users")
        .find(user => user.username === currentUser);
}

function updateLocalProfile(username, changes) {
    const users = getData("vanzgram_users");
    const index = users.findIndex(user => user.username === username);

    if (index === -1) return false;

    users[index] = { ...users[index], ...changes };
    saveData("vanzgram_users", users);

    return true;
}

function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit"
    });
}


/* =====================================================
   3. TEMA VANZGRAM
   ===================================================== */

const themes = {
    "dark-moon": {
        main: "#e11d48",
        light: "#4c1425",
        background: "#190b12",
        page: "#080408",
        text: "#fff1f2",
        muted: "#c4a0aa",
        border: "#762039"
    },

    "modern-city": {
        main: "#a855f7",
        light: "#31204d",
        background: "#10101c",
        page: "#080811",
        text: "#f5f3ff",
        muted: "#aaa5c7",
        border: "#593078"
    },

    black: {
        main: "#111111",
        light: "#383838",
        background: "#202020",
        page: "#090909",
        text: "#ffffff",
        muted: "#bdbdbd",
        border: "#444444"
    },

    white: {
        main: "#087b58",
        light: "#d9f8e6",
        background: "#ffffff",
        page: "#f2f5f3",
        text: "#172b25",
        muted: "#718078",
        border: "#e5eee8"
    },

    grey: {
        main: "#626b73",
        light: "#dce0e3",
        background: "#e9ecef",
        page: "#cdd2d6",
        text: "#202830",
        muted: "#59636b",
        border: "#aeb5bb"
    },

    green: {
        main: "#087b58",
        light: "#d9f8e6",
        background: "#ffffff",
        page: "#eaf0ee",
        text: "#172b25",
        muted: "#718078",
        border: "#e5eee8"
    },

    "dark-blue": {
        main: "#123b70",
        light: "#254c7d",
        background: "#17283e",
        page: "#0b1728",
        text: "#ffffff",
        muted: "#b3c3d8",
        border: "#304661"
    },

    "dark-red": {
        main: "#8b2028",
        light: "#57252a",
        background: "#29191c",
        page: "#160d0f",
        text: "#ffffff",
        muted: "#d2b7ba",
        border: "#58363b"
    },

    "dark-green": {
        main: "#075b3d",
        light: "#174b36",
        background: "#14271e",
        page: "#09170f",
        text: "#ffffff",
        muted: "#b4cbbb",
        border: "#31513e"
    },

    "dark-yellow": {
        main: "#a77b00",
        light: "#574713",
        background: "#29230f",
        page: "#171306",
        text: "#fff6d5",
        muted: "#d3c69c",
        border: "#62552b"
    }
};

function applyTheme(themeName) {
    const theme = themes[themeName];

    if (!theme) return;

    const root = document.documentElement;

    root.style.setProperty("--theme-main", theme.main);
    root.style.setProperty("--theme-light", theme.light);
    root.style.setProperty("--theme-background", theme.background);
    root.style.setProperty("--theme-page", theme.page);
    root.style.setProperty("--theme-text", theme.text);
    root.style.setProperty("--theme-muted", theme.muted);
    root.style.setProperty("--theme-border", theme.border);

    document.body.classList.toggle(
        "theme-modern-city",
        themeName === "modern-city"
    );

    document.body.classList.toggle(
        "theme-dark-moon",
        themeName === "dark-moon"
    );

    localStorage.setItem("vanzgram_theme", themeName);
}
function selectTheme(themeName) {
    if (!themes[themeName]) return;

    applyTheme(themeName);
    renderProfile();
}


/* =====================================================
   4. LOGIN DAN REGISTRASI
   ===================================================== */

function showLogin() {
    getElement("loginPage")?.classList.remove("hidden");
    getElement("registerPage")?.classList.add("hidden");
}

function showRegister() {
    getElement("loginPage")?.classList.add("hidden");
    getElement("registerPage")?.classList.remove("hidden");
}

async function register() {
    const username = getElement("regUser")?.value.trim();
    const email = getElement("regEmail")?.value.trim();
    const age = Number(getElement("regAge")?.value);
    const password = getElement("regPass")?.value;
    const confirm = getElement("regConfirm")?.value;

    if (!username || !email || !age || !password || !confirm) {
        return alert("Lengkapi semua kolom!");
    }

    if (age < 1 || age > 120) {
        return alert("Umur tidak valid!");
    }

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
        return alert("Username harus 3-20 karakter, huruf, angka, atau underscore!");
    }

    if (password.length < 6) {
        return alert("Password minimal 6 karakter!");
    }

    if (password !== confirm) {
        return alert("Password dan konfirmasi tidak cocok!");
    }

    try {
        await window.firebaseReady;

        const exists = await window.vanzgramUsernameExists(username);

        if (exists) {
            return alert("Username sudah digunakan!");
        }

        const firebaseUser = await window.vanzgramCreateAccount(
            email,
            password
        );

        const uid = firebaseUser.uid;

        const reserved = await window.vanzgramReserve(
            "usernameIndex/" + username.toLowerCase(),
            uid
        );

        if (!reserved) {
            return alert("Username baru saja digunakan orang lain.");
        }

        let userId;
        let idReserved = false;

        for (let attempt = 0; attempt < 10; attempt++) {
            userId = String(
                Math.floor(100000 + Math.random() * 900000)
            );

            idReserved = await window.vanzgramReserve(
                "idIndex/" + userId,
                uid
            );

            if (idReserved) break;
        }

        if (!idReserved) {
            return alert("Gagal membuat VanzGram ID.");
        }

        const profile = {
            username,
            id: userId,
            age,
            bio: "",
            isVerified: false
        };

        await window.vanzgramSaveProfile(uid, profile);

        const users = getData("vanzgram_users");

        users.push(profile);
        saveData("vanzgram_users", users);

        alert(
            "Pendaftaran berhasil!\n\n" +
            "Username: " + username +
            "\nVanzGram ID: " + userId +
            "\n\nSilakan login."
        );

        ["regUser", "regEmail", "regAge", "regPass", "regConfirm"]
            .forEach(id => {
                if (getElement(id)) getElement(id).value = "";
            });

        showLogin();

    } catch (error) {
        console.error("Register error:", error);

        if (error.code === "auth/email-already-in-use") {
            alert("Email sudah terdaftar!");
        } else if (error.code === "auth/invalid-email") {
            alert("Format email tidak valid!");
        } else if (error.code === "auth/weak-password") {
            alert("Password terlalu lemah!");
        } else {
            alert("Pendaftaran gagal: " + error.message);
        }
    }
}

async function login() {
    const email = getElement("loginUser")?.value.trim();
    const password = getElement("loginPass")?.value;

    if (!email || !password) {
        return alert("Masukkan email dan password!");
    }

    try {
        await window.firebaseReady;

        const firebaseUser = await window.vanzgramLoginAccount(
            email,
            password
        );

        const profile = await window.vanzgramGetProfile(
            firebaseUser.uid
        );

        if (!profile) {
            return alert("Profil VanzGram tidak ditemukan.");
        }

        localStorage.setItem("vanzgram_session", profile.username);
        localStorage.setItem("vanzgram_uid", firebaseUser.uid);

        const users = getData("vanzgram_users");

        const index = users.findIndex(user =>
            user.username?.toLowerCase() === profile.username.toLowerCase()
        );

        if (index >= 0) {
            users[index] = { ...users[index], ...profile };
        } else {
            users.push(profile);
        }

        saveData("vanzgram_users", users);

        currentUser = profile.username;

        startApp();

    } catch (error) {
        console.error("Login error:", error);

        if (
            error.code === "auth/invalid-credential" ||
            error.code === "auth/wrong-password" ||
            error.code === "auth/user-not-found"
        ) {
            alert("Email atau password salah!");
        } else if (error.code === "auth/invalid-email") {
            alert("Format email tidak valid!");
        } else {
            alert("Login gagal: " + error.message);
        }
    }
}


/* =====================================================
   5. APLIKASI DAN NAVIGASI
   ===================================================== */

function startApp() {
    if (!currentUser) return;

    const user = getCurrentProfile();

    if (!user) {
        logout();
        return;
    }

    getElement("loginPage")?.classList.add("hidden");
    getElement("registerPage")?.classList.add("hidden");
    getElement("content")?.classList.remove("hidden");

    const accountName = getElement("accountName");

    if (accountName) {
        accountName.textContent = "@" + currentUser;
    }

    navigate("chat");
}

function navigate(page) {
    const allowedPages = [
        "chat",
        "updates",
        "groups",
        "calls",
        "profile"
    ];

    if (!allowedPages.includes(page)) return;

    currentPage = page;

    const nav = document.querySelector(".nav");
    const buttons = nav
        ? Array.from(nav.querySelectorAll("button"))
        : [];

    buttons.forEach(button => button.classList.remove("active"));

    const activeButton = getElement("nav-" + page);

    if (activeButton) {
        activeButton.classList.add("active");
    }

    // Posisi indikator Liquid Glass
    if (nav) {
        nav.style.setProperty("--nav-count", buttons.length);

        const index = buttons.indexOf(activeButton);

        if (index >= 0) {
            nav.style.setProperty("--nav-index", index);
        }
    }

    if (page === "chat") renderChat();
    if (page === "updates") renderUpdates();
    if (page === "groups") renderGroups();
    if (page === "calls") renderCalls();
    if (page === "profile") renderProfile();
}


/* =====================================================
   6. CHAT PRIBADI
   ===================================================== */

function chatKey(a, b) {
    return [a, b].sort().join("__");
}

function getChatUser(username) {
    return getData("vanzgram_users")
        .find(user => user.username === username);
}

function getChatMessages(username) {
    const key = chatKey(currentUser, username);

    return getData("vanzgram_messages")
        .filter(message => message.key === key)
        .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
}

function getLastMessage(username) {
    const messages = getChatMessages(username);

    return messages.length
        ? messages[messages.length - 1]
        : null;
}

function chatAvatar(user, className = "chat-avatar") {
    if (
        user?.profilePhoto &&
        /^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(user.profilePhoto)
    ) {
        return `
            <div class="${className}">
                <img src="${escapeText(user.profilePhoto)}" alt="Foto profil">
            </div>
        `;
    }

    const initial = user?.username
        ? user.username.charAt(0).toUpperCase()
        : "?";

    return `
        <div class="${className}">
            ${escapeText(initial)}
        </div>
    `;
}

function getChatPreview(message) {
    if (!message) return "Belum ada pesan";

    return (message.from === currentUser ? "Kamu: " : "") +
        message.message;
}

function renderChatUsers(users) {
    if (!users.length) {
        return `
            <div class="vg-no-users">
                <span>🔎</span>
                <p>Pengguna tidak ditemukan.</p>
            </div>
        `;
    }

    return users.map(user => {
        const last = getLastMessage(user.username);

        return `
            <div
                class="vg-user-item ${selectedUser === user.username ? "active" : ""}"
                data-username="${escapeText(user.username)}"
            >
                ${chatAvatar(user)}

                <div class="vg-user-details">
                    <div class="vg-user-name">
                        <strong>${escapeText(user.username)}</strong>
                        <small>${escapeText(last?.time || "")}</small>
                    </div>

                    <div class="vg-user-preview">
                        ${escapeText(getChatPreview(last))}
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

function attachChatUserEvents() {
    document.querySelectorAll(".vg-user-item").forEach(item => {
        item.addEventListener("click", () => {
            openChat(item.dataset.username);
        });
    });
}

function renderConversationHeader() {
    const user = getChatUser(selectedUser);

    if (!user) return "";

    return `
        <div class="vg-conversation-header">
            <div class="vg-header-user">
                ${chatAvatar(user)}

                <div>
                    <strong>${escapeText(user.username)}</strong>
                    <small>Pengguna VanzGram</small>
                </div>
            </div>

            <div class="vg-header-actions">
                <span title="Pencarian">⌕</span>
                <span title="Informasi">ⓘ</span>
            </div>
        </div>
    `;
}

function renderFriendInfo() {
    const user = getChatUser(selectedUser);

    if (!user) return "";

    return `
        <div class="vg-friend-profile">
            ${chatAvatar(user, "vg-info-avatar")}

            <h3>${escapeText(user.username)}</h3>
            <p>@${escapeText(user.username)}</p>

            <div class="vg-member-badge">
                ✦ ${user.username.toLowerCase() === "vanz"
            ? "VanzGram developer"
            : "VanzGram Member"}
            </div>
        </div>

        <div class="vg-info-section">
            <small>INFORMASI AKUN</small>

            <div class="vg-info-row">
                <span>Username</span>
                <strong>${escapeText(user.username)}</strong>
            </div>

            <div class="vg-info-row">
                <span>Umur</span>
                <strong>${user.age ? escapeText(user.age) + " tahun" : "-"}</strong>
            </div>

            <div class="vg-info-row">
                <span>Status</span>
                <strong>Pengguna VanzGram</strong>
            </div>
        </div>
    `;
}


function renderChat() {
    const users = getData("vanzgram_users")
        .filter(user => user.username !== currentUser);

    users.sort((a, b) =>
        (getLastMessage(b.username)?.createdAt || 0) -
        (getLastMessage(a.username)?.createdAt || 0)
    );

    if (selectedUser && !users.some(user => user.username === selectedUser)) {
        selectedUser = null;
    }

    const main = getElement("mainContent");
    if (!main) return;

    main.innerHTML = `
        <div class="vg-chat ${selectedUser ? "chat-open" : "contacts-open"}">

            <aside class="vg-chat-sidebar">
                <div class="vg-sidebar-top">
                    <div>
                        <h2>Chat</h2>
                        <p>Pesan pribadi</p>
                    </div>
                    <div class="vg-chat-logo">VG</div>
                </div>

                <div class="vg-search">
                    <span>⌕</span>
                    <input id="chatSearch" type="text"
                        placeholder="Cari kontak..."
                        autocomplete="off">
                </div>

                <div class="vg-list-heading">
                    <span>SEMUA KONTAK</span>
                    <span>${users.length}</span>
                </div>

                <div class="vg-user-list" id="chatUserList">
                    ${renderChatUsers(users)}
                </div>
            </aside>

            <section class="vg-conversation">
                ${selectedUser ? `
                    <div class="vg-mobile-chat-back">
                        <button id="backToContacts">‹</button>
                        ${renderConversationHeader()}
                    </div>

                    <div class="vg-message-list" id="messageList"></div>

                    <div class="vg-composer">
                        <input id="messageInput" type="text"
                            placeholder="Ketik pesan..."
                            autocomplete="off">
                        <button id="sendMessageButton">➤</button>
                    </div>
                ` : `
                    <div class="vg-chat-empty">
                        <div class="vg-empty-icon">✉</div>
                        <h2>VanzGram Chat</h2>
                        <p>Pilih kontak untuk mulai mengobrol.</p>
                    </div>
                `}
            </section>

            <aside class="vg-chat-info">
                ${selectedUser ? renderFriendInfo() : ""}
            </aside>

        </div>
    `;

    const search = getElement("chatSearch");

    search?.addEventListener("input", function () {
        const keyword = this.value.toLowerCase();

        const filtered = users.filter(user =>
            user.username.toLowerCase().includes(keyword)
        );

        getElement("chatUserList").innerHTML =
            renderChatUsers(filtered);

        attachChatUserEvents();
    });

    attachChatUserEvents();

    getElement("backToContacts")
        ?.addEventListener("click", () => {
            selectedUser = null;
            renderChat();
        });

    getElement("sendMessageButton")
        ?.addEventListener("click", sendMessage);

    getElement("messageInput")
        ?.addEventListener("keydown", event => {
            if (event.key === "Enter") sendMessage();
        });

    if (selectedUser) loadMessages();
}

function openChat(username) {
    const user = getChatUser(username);

    if (!user || username === currentUser) return;

    selectedUser = username;
    renderChat();
}


function sendMessage() {
    if (!selectedUser) return;

    const input = getElement("messageInput");
    if (!input) return;

    const message = input.value.trim();

    if (!message) return;

    const all = getData("vanzgram_messages");

    all.push({
        key: chatKey(currentUser, selectedUser),
        from: currentUser,
        to: selectedUser,
        message,
        time: formatTime(Date.now()),
        createdAt: Date.now()
    });

    saveData("vanzgram_messages", all);

    input.value = "";

    loadMessages();
    renderChatUserList();
}


function renderChatUserList() {
    const list = getElement("chatUserList");

    if (!list) return;

    const users = getData("vanzgram_users")
        .filter(user => user.username !== currentUser)
        .sort((a, b) =>
            (getLastMessage(b.username)?.createdAt || 0) -
            (getLastMessage(a.username)?.createdAt || 0)
        );

    list.innerHTML = renderChatUsers(users);

    attachChatUserEvents();
}

function loadMessages() {
    const box = getElement("messageList");

    if (!box || !selectedUser) return;

    const messages = getChatMessages(selectedUser);

    if (!messages.length) {
        box.innerHTML = `
            <div class="vg-message-empty">
                <div>✉</div>
                <h3>Mulai percakapan</h3>
                <p>Kirim pesan pertama kepada ${escapeText(selectedUser)}.</p>
            </div>
        `;
        return;
    }

    box.innerHTML = messages.map(message => `
        <div class="vg-message-row ${message.from === currentUser ? "mine" : "theirs"}">
            <div class="vg-message-bubble">
                <div class="vg-message-text">${escapeText(message.message)}</div>
                <small>${escapeText(message.time || "")}</small>
            </div>
        </div>
    `).join("");

    box.scrollTop = box.scrollHeight;
}


/* =====================================================
   7. PEMBARUAN / STATUS 24 JAM
   ===================================================== */

function renderUpdates() {
    const now = Date.now();
    const allStatuses = getData("vanzgram_statuses");

    // Hanya tampilkan status yang belum melewati 24 jam
    const activeStatuses = allStatuses.filter(status =>
        now - status.createdAt < 24 * 60 * 60 * 1000
    );

    saveData("vanzgram_statuses", activeStatuses);

    const myStatuses = activeStatuses.filter(
        status => status.username === currentUser
    );

    const otherUsers = [...new Set(
        activeStatuses
            .filter(status => status.username !== currentUser)
            .map(status => status.username)
    )];

    mainContent.innerHTML = `
        <div class="minimal-status-page">
            <h2 class="minimal-status-title">Status</h2>

            <div class="minimal-status-list">

                <div class="minimal-status-item add-status-item"
                     id="addStatusButton">

                    <div class="minimal-status-box add-status-box">
                        <span class="add-status-icon">+</span>
                    </div>

                    <span>Tambah Status</span>
                </div>

                ${otherUsers.map(username => {
                    const userStatuses = activeStatuses.filter(
                        status => status.username === username
                    );

                    return `
                        <div class="minimal-status-item"
                             data-status-user="${escapeText(username)}">

                            <div class="minimal-status-box other-status-box">
                                <div class="minimal-status-preview">
                                    ${
                                        userStatuses[0].image
                                        ? `<img src="${userStatuses[0].image}">`
                                        : `<span>${escapeText(username.charAt(0).toUpperCase())}</span>`
                                    }
                                </div>
                            </div>

                            <span>${escapeText(username)}</span>
                        </div>
                    `;
                }).join("")}

            </div>

            ${
                myStatuses.length
                ? `<div class="my-status-count">
                    Status saya: ${myStatuses.length}
                   </div>`
                : ""
            }
        </div>
    `;

    document.getElementById("addStatusButton")
        .addEventListener("click", showAddStatusForm);

    document.querySelectorAll("[data-status-user]")
        .forEach(item => {
            item.addEventListener("click", () => {
                openMinimalStatusViewer(item.dataset.statusUser);
            });
        });
}


// FORM TAMBAH STATUS
function showAddStatusForm() {
    const oldModal = document.getElementById("minimalStatusModal");
    if (oldModal) oldModal.remove();

    const modal = document.createElement("div");
    modal.id = "minimalStatusModal";
    modal.className = "minimal-status-modal";

    modal.innerHTML = `
        <div class="minimal-status-dialog">
            <h3>Tambah Status</h3>

            <textarea id="newStatusText"
                placeholder="Apa yang sedang kamu pikirkan?"></textarea>

            <label class="minimal-status-upload">
                <span>＋ Tambahkan Foto</span>
                <input type="file" id="newStatusImage" accept="image/*">
            </label>

            <div id="newStatusFileName"></div>

            <div class="minimal-status-actions">
                <button id="cancelNewStatus">Batal</button>
                <button id="submitNewStatus">Bagikan</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("cancelNewStatus").onclick = () => {
        modal.remove();
    };

    document.getElementById("newStatusImage").onchange = event => {
        const file = event.target.files[0];

        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert("Ukuran foto maksimal 2 MB.");
            event.target.value = "";
            return;
        }

        document.getElementById("newStatusFileName").textContent =
            file.name;
    };

    document.getElementById("submitNewStatus").onclick = () => {
        const text = document.getElementById("newStatusText").value.trim();
        const file = document.getElementById("newStatusImage").files[0];

        if (!text && !file) {
            alert("Isi teks atau pilih foto terlebih dahulu.");
            return;
        }

        const saveStatus = image => {
            const statuses = getData("vanzgram_statuses");

            statuses.push({
                id: Date.now().toString(),
                username: currentUser,
                text: text,
                image: image || "",
                createdAt: Date.now()
            });

            saveData("vanzgram_statuses", statuses);

            modal.remove();
            renderUpdates();
        };

        if (file) {
            const reader = new FileReader();

            reader.onload = event => saveStatus(event.target.result);
            reader.readAsDataURL(file);
        } else {
            saveStatus("");
        }
    };
}


// MELIHAT STATUS PENGGUNA LAIN
function openMinimalStatusViewer(username) {
    const statuses = getData("vanzgram_statuses")
        .filter(status =>
            status.username === username &&
            Date.now() - status.createdAt < 24 * 60 * 60 * 1000
        );

    if (!statuses.length) {
        renderUpdates();
        return;
    }

    let currentIndex = 0;

    const modal = document.createElement("div");
    modal.className = "minimal-status-viewer";
    modal.id = "minimalStatusViewer";

    document.body.appendChild(modal);

    function showCurrentStatus() {
        const status = statuses[currentIndex];

        modal.innerHTML = `
            <div class="minimal-viewer-content">

                <div class="minimal-viewer-top">
                    <span>${escapeText(username)}</span>
                    <button id="closeMinimalViewer">×</button>
                </div>

                <div class="minimal-viewer-progress">
                    ${statuses.map((_, index) => `
                        <span class="${index <= currentIndex ? "done" : ""}"></span>
                    `).join("")}
                </div>

                <div class="minimal-viewer-body">
                    ${
                        status.image
                        ? `<img src="${status.image}">`
                        : ""
                    }

                    ${
                        status.text
                        ? `<p>${escapeText(status.text)}</p>`
                        : ""
                    }
                </div>

                <div class="minimal-viewer-bottom">
                    ${
                        username === currentUser
                        ? `<button id="deleteMinimalStatus">Hapus Status</button>`
                        : ""
                    }

                    <button id="nextMinimalStatus">
                        ${currentIndex === statuses.length - 1 ? "Selesai" : "Berikutnya"}
                    </button>
                </div>

            </div>
        `;

        document.getElementById("closeMinimalViewer").onclick = () => {
            modal.remove();
        };

        document.getElementById("nextMinimalStatus").onclick = () => {
            currentIndex++;

            if (currentIndex >= statuses.length) {
                modal.remove();
                return;
            }

            showCurrentStatus();
        };

        const deleteButton = document.getElementById("deleteMinimalStatus");

        if (deleteButton) {
            deleteButton.onclick = () => {
                const allStatuses = getData("vanzgram_statuses");

                saveData(
                    "vanzgram_statuses",
                    allStatuses.filter(item => item.id !== status.id)
                );

                modal.remove();
                renderUpdates();
            };
        }
    }

    showCurrentStatus();
}


/* =====================================================
   8. GRUP
   ===================================================== */

function renderGroups() {
    const GROUP_KEY = "vanzgram_groups";
    const MESSAGE_KEY = "vanzgram_group_messages";
    const SELECTED_KEY = "vanzgram_selected_group";

    let groups = getData(GROUP_KEY);
    const users = getData("vanzgram_users");

    let selectedGroupId = localStorage.getItem(SELECTED_KEY);

    const myGroups = groups.filter(group =>
        Array.isArray(group.members) &&
        group.members.includes(currentUser)
    );

    if (!myGroups.some(group => group.id === selectedGroupId)) {
        selectedGroupId = null;
        localStorage.removeItem(SELECTED_KEY);
    }

    function getMessages(groupId) {
        return getData(MESSAGE_KEY)
            .filter(message => message.groupId === groupId)
            .sort((a, b) => a.createdAt - b.createdAt);
    }

    function groupAvatar(group) {
        return escapeText(group.name.charAt(0).toUpperCase());
    }

    function renderRoom(group) {
        if (!group) {
            return `
                <div class="vg-group-empty">
                    <div class="vg-group-empty-icon">👥</div>
                    <h2>Selamat datang di Grup</h2>
                    <p>Pilih grup untuk mulai mengobrol bersama teman-temanmu.</p>
                </div>
            `;
        }

        const messages = getMessages(group.id);

        const members = users.filter(user =>
            group.members.includes(user.username)
        );

        return `
            <div class="vg-group-room">
                <div class="vg-group-room-head">
                    <div class="vg-group-room-avatar">${groupAvatar(group)}</div>

                    <div class="vg-group-room-title">
                        <h3>${escapeText(group.name)}</h3>
                        <p>${members.length} anggota</p>
                    </div>

                    <button class="vg-group-info-btn" id="groupInfoButton">ⓘ</button>
                </div>

                <div class="vg-group-description">
                    ${escapeText(group.description || "Tidak ada deskripsi grup.")}
                </div>

                <div class="vg-group-messages" id="groupMessages">
                    ${messages.length
                ? messages.map(message => `
                            <div class="vg-group-message ${message.sender === currentUser ? "mine" : ""}">
                                <small>${escapeText(message.sender)}</small>

                                <div class="vg-group-bubble">
                                    ${escapeText(message.text)}
                                </div>

                                <time>${formatTime(message.createdAt)}</time>
                            </div>
                        `).join("")
                : `
                            <div class="vg-group-no-message">
                                Belum ada pesan. Mulai percakapan sekarang!
                            </div>
                        `
            }
                </div>

                <form id="groupMessageForm" class="vg-group-composer">
                    <input
                        type="text"
                        id="groupMessageInput"
                        placeholder="Tulis pesan..."
                        maxlength="2000"
                        autocomplete="off"
                        required
                    >
                    <button type="submit">➤</button>
                </form>
            </div>
        `;
    }

    function renderInfo(group) {
        if (!group) return "";

        const members = users.filter(user =>
            group.members.includes(user.username)
        );

        return `
            <div class="vg-group-info-panel">
                <div class="vg-group-info-top">
                    <div class="vg-group-info-avatar">${groupAvatar(group)}</div>
                    <h3>${escapeText(group.name)}</h3>
                    <p>${members.length} anggota</p>
                </div>

                <h4>Deskripsi Grup</h4>
                <p>${escapeText(group.description || "Tidak ada deskripsi.")}</p>

                <h4>Anggota Grup</h4>

                <div class="vg-group-member-list">
                    ${members.map(member => `
                        <div class="vg-group-member">
                            <div class="vg-group-member-avatar">
                                ${escapeText(member.username[0].toUpperCase())}
                            </div>

                            <div>
                                <strong>${escapeText(member.username)}</strong>
                                <small>
                                    ${member.username === group.owner ? "Admin grup" : "Anggota"}
                                </small>
                            </div>
                        </div>
                    `).join("")}
                </div>

                ${group.owner === currentUser
                ? `<button class="vg-group-delete" id="deleteGroupButton">Hapus Grup</button>`
                : `<button class="vg-group-leave" id="leaveGroupButton">Keluar dari Grup</button>`
            }
            </div>
        `;
    }

    const selectedGroup = myGroups.find(group =>
        group.id === selectedGroupId
    );

    getElement("mainContent").innerHTML = `
        <div class="vg-groups-page">
            <div class="vg-groups-heading">
                <div>
                    <h2>Grup</h2>
                    <p>Tempat berkumpul dan mengobrol bersama teman.</p>
                </div>

                <button id="createGroupButton" class="vg-create-group-btn">
                    ＋ Buat Grup
                </button>
            </div>

            <div class="vg-create-group-form" id="createGroupForm" hidden>
                <h3>Buat Grup Baru</h3>

                <form id="newGroupForm">
                    <input
                        type="text"
                        id="newGroupName"
                        placeholder="Nama grup"
                        maxlength="40"
                        required
                    >

                    <textarea
                        id="newGroupDescription"
                        placeholder="Deskripsi grup (opsional)"
                        maxlength="200"
                    ></textarea>

                    <h4>Pilih Anggota</h4>

                    <div class="vg-select-members">
                        ${users
            .filter(user => user.username !== currentUser)
            .map(user => `
                                <label class="vg-select-member">
                                    <input
                                        type="checkbox"
                                        name="groupMembers"
                                        value="${escapeText(user.username)}"
                                    >
                                    <span>${escapeText(user.username)}</span>
                                </label>
                            `).join("")
        || "<p>Belum ada pengguna lain yang terdaftar.</p>"
        }
                    </div>

                    <div class="vg-create-actions">
                        <button type="button" id="cancelGroupButton">Batal</button>
                        <button type="submit">Buat Grup</button>
                    </div>
                </form>
            </div>

            <div class="vg-groups-layout">
                <aside class="vg-groups-sidebar">
                    <div class="vg-groups-sidebar-title">
                        <h3>Grup Saya</h3>
                        <span>${myGroups.length}</span>
                    </div>

                    <div class="vg-groups-list">
                        ${myGroups.length
            ? myGroups.map(group => `
                                <button
                                    class="vg-group-item ${selectedGroupId === group.id ? "active" : ""}"
                                    data-group-id="${escapeText(group.id)}"
                                >
                                    <div class="vg-group-list-avatar">${groupAvatar(group)}</div>

                                    <div class="vg-group-list-details">
                                        <strong>${escapeText(group.name)}</strong>
                                        <small>${group.members.length} anggota</small>
                                    </div>
                                </button>
                            `).join("")
            : `
                                <div class="vg-groups-empty">
                                    <span>👥</span>
                                    <p>Belum ada grup.</p>
                                    <small>Buat grup pertamamu!</small>
                                </div>
                            `
        }
                    </div>
                </aside>

                <section class="vg-groups-conversation">
                    ${renderRoom(selectedGroup)}
                </section>

                <aside class="vg-groups-info" id="groupInfoPanel">
                    ${renderInfo(selectedGroup)}
                </aside>
            </div>
        </div>
    `;

    getElement("createGroupButton")
        ?.addEventListener("click", () => {
            const form = getElement("createGroupForm");
            form.hidden = !form.hidden;
        });

    getElement("cancelGroupButton")
        ?.addEventListener("click", () => {
            getElement("createGroupForm").hidden = true;
        });

    getElement("newGroupForm")
        ?.addEventListener("submit", event => {
            event.preventDefault();

            const name = getElement("newGroupName").value.trim();
            const description = getElement("newGroupDescription").value.trim();

            const selectedMembers = [
                ...document.querySelectorAll(
                    'input[name="groupMembers"]:checked'
                )
            ].map(input => input.value);

            if (!name) return alert("Masukkan nama grup!");

            if (!selectedMembers.length) {
                return alert("Pilih minimal satu anggota lain!");
            }

            const members = [...new Set([
                currentUser,
                ...selectedMembers
            ])];

            const newGroup = {
                id: Date.now().toString() +
                    Math.random().toString(36).slice(2),
                name,
                description,
                owner: currentUser,
                members,
                createdAt: Date.now()
            };

            const latestGroups = getData(GROUP_KEY);

            latestGroups.push(newGroup);

            saveData(GROUP_KEY, latestGroups);
            localStorage.setItem(SELECTED_KEY, newGroup.id);

            renderGroups();
        });

    document.querySelectorAll(".vg-group-item")
        .forEach(button => {
            button.addEventListener("click", () => {
                localStorage.setItem(
                    SELECTED_KEY,
                    button.dataset.groupId
                );

                renderGroups();
            });
        });

    getElement("groupMessageForm")
        ?.addEventListener("submit", event => {
            event.preventDefault();

            const input = getElement("groupMessageInput");
            const text = input.value.trim();

            if (!text || !selectedGroupId) return;

            const latestGroups = getData(GROUP_KEY);

            const group = latestGroups.find(item =>
                item.id === selectedGroupId &&
                item.members.includes(currentUser)
            );

            if (!group) {
                alert("Kamu bukan anggota grup ini.");
                renderGroups();
                return;
            }

            const messages = getData(MESSAGE_KEY);

            messages.push({
                id: Date.now().toString(),
                groupId: selectedGroupId,
                sender: currentUser,
                text,
                createdAt: Date.now()
            });

            saveData(MESSAGE_KEY, messages);

            renderGroups();
        });

    getElement("groupInfoButton")
        ?.addEventListener("click", () => {
            getElement("groupInfoPanel")?.classList.toggle("show");
        });

    getElement("deleteGroupButton")
        ?.addEventListener("click", () => {
            if (!confirm("Yakin ingin menghapus grup ini?")) return;

            saveData(
                GROUP_KEY,
                getData(GROUP_KEY).filter(group =>
                    !(group.id === selectedGroupId &&
                        group.owner === currentUser)
                )
            );

            saveData(
                MESSAGE_KEY,
                getData(MESSAGE_KEY).filter(message =>
                    message.groupId !== selectedGroupId
                )
            );

            localStorage.removeItem(SELECTED_KEY);

            renderGroups();
        });

    getElement("leaveGroupButton")
        ?.addEventListener("click", () => {
            if (!confirm("Yakin ingin keluar dari grup ini?")) return;

            const latestGroups = getData(GROUP_KEY)
                .map(group => {
                    if (group.id !== selectedGroupId) return group;

                    return {
                        ...group,
                        members: group.members.filter(name =>
                            name !== currentUser
                        )
                    };
                })
                .filter(group => group.members.length > 0);

            saveData(GROUP_KEY, latestGroups);
            localStorage.removeItem(SELECTED_KEY);

            renderGroups();
        });

    const messageBox = getElement("groupMessages");

    if (messageBox) {
        messageBox.scrollTop = messageBox.scrollHeight;
    }
}


/* =====================================================
   9. PANGGILAN
   ===================================================== */

function renderCalls() {
    getElement("mainContent").innerHTML = `
        <div class="call-page">
            <div class="call-header">
                <div class="call-title">
                    <span class="vg-call-logo">
                        <svg viewBox="0 0 24 24"
                             width="34"
                             height="34"
                             fill="currentColor">
                            <path d="M19.7 5.2A18 18 0 0 0 15.3 4l-.6 1.2a16 16 0 0 0-5.4 0L8.7 4a18 18 0 0 0-4.4 1.2C1.5 9.4.7 13.5 1.1 17.5a18 18 0 0 0 5.4 2.7l1.2-1.9-1.8-.9.4-.3c3.5 1.6 7.3 1.6 10.8 0l.4.3-1.8.9 1.2 1.9a18 18 0 0 0 5.4-2.7c.5-4.7-.8-8.7-3.6-12.3ZM8.8 14.9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2Zm6.4 0c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2Z"/>
                        </svg>
                    </span>

                    <div>
                        <h2>VanzGram Call</h2>
                        <p>Connect with your friends</p>
                    </div>
                </div>
            </div>

            <div class="call-welcome">
                <div class="call-big-icon">🎧</div>
                <h2>Let's hang out!</h2>
                <p>
                    Tempat untuk terhubung dan mengobrol
                    bersama teman-temanmu.
                </p>

                <button class="call-start-button" id="startCallButton">
                    + Mulai Panggilan
                </button>
            </div>
        </div>
    `;

    getElement("startCallButton")
        ?.addEventListener("click", () => {
            alert("Fitur panggilan akan segera hadir!");
        });
}


/* =====================================================
   10. PROFIL
   ===================================================== */

function renderProfile() {
    const user = getCurrentProfile();

    if (!user) return;

    const currentTheme =
        localStorage.getItem("vanzgram_theme") || "green";

    const themeOptions = [
        ["dark-moon", "Dark Moon", "#e11d48"],
        ["modern-city", "Modern City", "#a020f0"],
        ["black", "Black", "#111111"],
        ["white", "White", "#ffffff"],
        ["grey", "Grey", "#626b73"],
        ["green", "Green", "#087b58"],
        ["dark-blue", "Dark Blue", "#123b70"],
        ["dark-red", "Dark Red", "#8b2028"],
        ["dark-green", "Dark Green", "#075b3d"],
        ["dark-yellow", "Dark Yellow", "#a77b00"]
    ];
    getElement("mainContent").innerHTML = `
        <div class="modern-profile">

            <div class="profile-heading">
                <div>
                    <h2>Profil Saya</h2>
                    <p>Kelola akun VanzGram kamu</p>
                </div>
                <span class="profile-heading-icon">⚙️</span>
            </div>

            <section class="modern-profile-card">

                <div class="profile-banner" id="profileBanner">
                    <div class="profile-banner-placeholder">
                        <span>Banner Profil</span>
                    </div>

                    <button
                        type="button"
                        class="profile-banner-edit"
                        id="editProfileBanner"
                        title="Ubah banner"
                    >✏️</button>

                    <div class="profile-banner-menu" id="profileBannerMenu">
                        <button type="button" id="bannerFromDevice">
                            <span>📁</span>
                            <span>
                                <strong>Buat banner dari perangkat</strong>
                                <small>Pilih gambar atau video</small>
                            </span>
                        </button>

                        <button type="button" id="bannerFromUrl">
                            <span>🔗</span>
                            <span>
                                <strong>Buat banner melalui URL</strong>
                                <small>Gunakan tautan gambar atau video</small>
                            </span>
                        </button>

                        <button
                            type="button"
                            class="profile-banner-remove"
                            id="removeProfileBanner"
                        >
                            🗑️ Hapus banner
                        </button>
                    </div>
                </div>

                <input
                    type="file"
                    id="profileBannerInput"
                    accept="image/*,video/*"
                    hidden
                >

                <div class="modern-avatar-wrap">
                    <div class="modern-avatar">
                        ${user.profilePhoto
            ? `<img src="${escapeText(user.profilePhoto)}" alt="Foto profil">`
            : escapeText(user.username[0].toUpperCase())
        }
                    </div>

                    <label for="profilePhotoInput" class="modern-camera">
                        📷
                    </label>
                </div>

                <h2>
                    ${escapeText(user.username)}
                    ${user.isVerified ? '<span class="vg-verified">✓</span>' : ""}
                </h2>

                <p class="modern-username">
                    @${escapeText(user.username)}
                </p>

                <span class="modern-member">
                    ✦ ${user.username.toLowerCase() === "vanz"
            ? "VANZGRAM DEVELOPER"
            : "VANZGRAM MEMBER"
        }
                </span>

                <div class="modern-photo-actions">
                    <label for="profilePhotoInput" class="modern-photo-button">
                        📸 Ganti Foto Profil
                    </label>

                    <input
                        type="file"
                        id="profilePhotoInput"
                        accept="image/png,image/jpeg,image/webp"
                        hidden
                    >
                </div>

                <p class="modern-photo-hint">JPG, PNG atau WEBP</p>
            </section>

            <section class="modern-settings-card">
                <h3>📝 Bio Saya</h3>
                <p class="modern-setting-description">
                    Ceritakan sedikit tentang dirimu.
                </p>

                <p class="modern-bio">
                    ${escapeText(user.bio || "Belum ada bio")}
                </p>

                <textarea
                    id="profileBio"
                    maxlength="139"
                    rows="3"
                    placeholder="Tulis bio kamu..."
                >${escapeText(user.bio || "")}</textarea>

                <p class="modern-setting-description">
                    Maksimal 139 karakter.
                </p>

                <button class="modern-save-button" id="saveBioButton">
                    Simpan Bio
                </button>
            </section>

            <section class="modern-settings-card">
                <h3>👤 Informasi Akun</h3>

                <div class="modern-info-row">
                    <span>Username</span>
                    <strong>@${escapeText(user.username)}</strong>
                </div>

                <div class="modern-info-row">
                    <span>VanzGram ID</span>
                    <strong>${escapeText(user.id || "-")}</strong>
                </div>

                <div class="modern-info-row">
                    <span>Umur</span>
                    <strong>${escapeText(String(user.age || "-"))} tahun</strong>
                </div>

                <div class="modern-info-row">
                    <span>Status</span>
                    <strong class="modern-active">● Aktif</strong>
                </div>
            </section>

            <section class="modern-settings-card">
                <h3>✏️ Ubah Username</h3>

                <p class="modern-setting-description">
                    Perubahan username memerlukan sinkronisasi Firebase.
                </p>

                <input
                    type="text"
                    id="newUsername"
                    placeholder="Masukkan username baru"
                    maxlength="20"
                >

                <button class="modern-save-button" id="changeUsernameButton">
                    Simpan Username
                </button>
            </section>

            <section class="modern-settings-card">
                <h3>🔒 Keamanan Akun</h3>

                <p class="modern-setting-description">
                    Penggantian sandi menggunakan Firebase Authentication.
                </p>

                <input
                    type="password"
                    id="oldPassword"
                    placeholder="Sandi lama"
                >

                <input
                    type="password"
                    id="newPassword"
                    placeholder="Sandi baru"
                >

                <input
                    type="password"
                    id="confirmNewPassword"
                    placeholder="Konfirmasi sandi baru"
                >

                <button class="modern-save-button" id="changePasswordButton">
                    Simpan Sandi
                </button>
            </section>

            <section class="modern-settings-card">
                <h3>🎨 Tema VanzGram</h3>

                <p class="modern-setting-description">
                    Sesuaikan tampilan aplikasi dengan pilihanmu.
                </p>

                <div class="modern-theme-grid">
                    ${themeOptions.map(([id, name, color]) => `
                        <button
                            class="modern-theme-option ${["modern-city", "dark-moon"].includes(id)
                ? `${id}-option`
                : ""} ${currentTheme === id ? "selected" : ""}"
                            data-theme="${id}"
                        >
                            <span style="background:${color}"></span>
                            ${name}
                            ${currentTheme === id ? "✓" : ""}
                        </button>
                    `).join("")}
                </div>
            </section>

            ${currentUser.toLowerCase() === "vanz" ? `
                <section class="modern-settings-card">
                    <h3>🛠️ Developer Center</h3>

                    <p class="modern-setting-description">
                        Kelola akun terverifikasi VanzGram.
                    </p>

                    <button class="modern-save-button" id="developerButton">
                        🔵 Buka Developer Panel
                    </button>
                </section>
            ` : ""}

            <button class="modern-logout" id="logoutButton">
                ↪ Keluar dari Akun
            </button>
        </div>
    `;

    getElement("saveBioButton")
        ?.addEventListener("click", saveProfileBio);

    getElement("profilePhotoInput")
        ?.addEventListener("change", function () {
            changeProfilePhoto(this);
        });

    getElement("changeUsernameButton")
        ?.addEventListener("click", changeUsername);

    getElement("changePasswordButton")
        ?.addEventListener("click", changePassword);

    getElement("logoutButton")
        ?.addEventListener("click", logout);

    getElement("developerButton")
        ?.addEventListener("click", renderDeveloperPanel);

    getElement("editProfileBanner")
        ?.addEventListener("click", () => {
            const menu = getElement("profileBannerMenu");
            menu?.classList.toggle("show");
        });

    getElement("bannerFromDevice")
        ?.addEventListener("click", () => {
            getElement("profileBannerMenu")?.classList.remove("show");
            getElement("profileBannerInput")?.click();
        });

    getElement("bannerFromUrl")
        ?.addEventListener("click", setProfileBannerFromUrl);

    getElement("removeProfileBanner")
        ?.addEventListener("click", removeProfileBanner);

    getElement("profileBannerInput")
        ?.addEventListener("change", function () {
            saveProfileBannerFile(this);
        });

    document.querySelectorAll("[data-theme]")
        .forEach(button => {
            button.addEventListener("click", () => {
                selectTheme(button.dataset.theme);
            });
        });

    loadProfileBanner();
}
// =====================================
// VANZGRAM PROFILE BANNER
// =====================================

const PROFILE_BANNER_DB = "vanzgram_banner_database";
const PROFILE_BANNER_STORE = "banners";

function getProfileBannerKey() {
    return "vanzgram_banner_" + currentUser.toLowerCase();
}

function openProfileBannerDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(PROFILE_BANNER_DB, 1);

        request.onupgradeneeded = function () {
            const db = request.result;

            if (!db.objectStoreNames.contains(PROFILE_BANNER_STORE)) {
                db.createObjectStore(PROFILE_BANNER_STORE);
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function saveBannerBlob(blob) {
    const db = await openProfileBannerDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(
            PROFILE_BANNER_STORE,
            "readwrite"
        );

        transaction.objectStore(PROFILE_BANNER_STORE)
            .put(blob, getProfileBannerKey());

        transaction.oncomplete = () => {
            db.close();
            resolve();
        };

        transaction.onerror = () => {
            db.close();
            reject(transaction.error);
        };
    });
}

async function getBannerBlob() {
    const db = await openProfileBannerDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(
            PROFILE_BANNER_STORE,
            "readonly"
        );

        const request = transaction.objectStore(PROFILE_BANNER_STORE)
            .get(getProfileBannerKey());

        request.onsuccess = () => {
            const result = request.result;
            db.close();
            resolve(result);
        };

        request.onerror = () => {
            db.close();
            reject(request.error);
        };
    });
}

async function deleteBannerBlob() {
    const db = await openProfileBannerDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(
            PROFILE_BANNER_STORE,
            "readwrite"
        );

        transaction.objectStore(PROFILE_BANNER_STORE)
            .delete(getProfileBannerKey());

        transaction.oncomplete = () => {
            db.close();
            resolve();
        };

        transaction.onerror = () => {
            db.close();
            reject(transaction.error);
        };
    });
}

async function loadProfileBanner() {
    const banner = getElement("profileBanner");
    if (!banner) return;

    const saved = JSON.parse(
        localStorage.getItem(getProfileBannerKey()) || "null"
    );

    if (!saved) return;

    let source = "";
    let type = saved.type;

    try {
        if (saved.kind === "file") {
            const blob = await getBannerBlob();

            if (!blob) return;

            if (window.vanzgramBannerObjectUrl) {
                URL.revokeObjectURL(window.vanzgramBannerObjectUrl);
            }

            source = URL.createObjectURL(blob);
            window.vanzgramBannerObjectUrl = source;
            type = blob.type.startsWith("video/") ? "video" : "image";
        } else {
            source = saved.url;
        }

        if (!banner.isConnected) return;

        banner.querySelector(".profile-banner-placeholder")?.remove();

        banner.querySelector(".profile-banner-media")?.remove();

        let media;

        if (type === "video") {
            media = document.createElement("video");
            media.autoplay = true;
            media.muted = true;
            media.loop = true;
            media.playsInline = true;
        } else {
            media = document.createElement("img");
            media.alt = "Banner profil";
        }

        media.className = "profile-banner-media";
        media.src = source;

        banner.prepend(media);

        if (type === "video") {
            media.play().catch(() => { });
        }

    } catch (error) {
        console.error("Gagal memuat banner:", error);
    }
}

async function saveProfileBannerFile(input) {
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") &&
        !file.type.startsWith("video/")) {
        alert("Pilih file gambar atau video yang valid.");
        input.value = "";
        return;
    }

    // Batas ukuran file 20 MB
    if (file.size > 20 * 1024 * 1024) {
        alert("Ukuran banner maksimal 20 MB.");
        input.value = "";
        return;
    }

    try {
        await saveBannerBlob(file);

        const type = file.type.startsWith("video/")
            ? "video"
            : "image";

        localStorage.setItem(
            getProfileBannerKey(),
            JSON.stringify({
                kind: "file",
                type: type
            })
        );

        await loadProfileBanner();

        alert("Banner profil berhasil diperbarui!");

    } catch (error) {
        console.error(error);
        alert("Gagal menyimpan banner. Coba gunakan file yang lebih kecil.");
    }

    input.value = "";
}

function setProfileBannerFromUrl() {
    const url = prompt("Masukkan URL gambar atau video:");

    if (!url) return;

    let parsedUrl;

    try {
        parsedUrl = new URL(url.trim());

        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
            throw new Error("URL tidak valid");
        }
    } catch {
        alert("URL tidak valid. Gunakan tautan http:// atau https://");
        return;
    }

    const pathname = parsedUrl.pathname.toLowerCase();

    const isVideo = /\.(mp4|webm|ogg|mov|m4v)$/.test(pathname);

    localStorage.setItem(
        getProfileBannerKey(),
        JSON.stringify({
            kind: "url",
            url: parsedUrl.href,
            type: isVideo ? "video" : "image"
        })
    );

    deleteBannerBlob().catch(console.error);
    loadProfileBanner();

    alert("URL banner berhasil disimpan!");
}

async function removeProfileBanner() {
    if (!confirm("Hapus banner profil kamu?")) return;

    localStorage.removeItem(getProfileBannerKey());

    try {
        await deleteBannerBlob();
    } catch (error) {
        console.error(error);
    }

    if (window.vanzgramBannerObjectUrl) {
        URL.revokeObjectURL(window.vanzgramBannerObjectUrl);
        window.vanzgramBannerObjectUrl = null;
    }

    const banner = getElement("profileBanner");

    if (banner) {
        banner.querySelector(".profile-banner-media")?.remove();

        if (!banner.querySelector(".profile-banner-placeholder")) {
            const placeholder = document.createElement("div");
            placeholder.className = "profile-banner-placeholder";
            placeholder.innerHTML = "<span>Banner Profil</span>";
            banner.prepend(placeholder);
        }
    }

    banner?.querySelector(".profile-banner-menu")
        ?.classList.remove("show");

    alert("Banner berhasil dihapus.");
}
/* =====================================================
   11. SIMPAN BIO
   ===================================================== */

async function saveProfileBio() {
    const input = getElement("profileBio");

    if (!input) return;

    const bio = input.value.trim();

    if (bio.length > 139) {
        return alert("Bio maksimal 139 karakter!");
    }

    const saved = updateLocalProfile(currentUser, { bio });

    if (!saved) {
        return alert("Pengguna tidak ditemukan!");
    }

    try {
        await window.firebaseReady;

        const uid = localStorage.getItem("vanzgram_uid");

        if (uid) {
            const cloudProfile =
                await window.vanzgramGetProfile(uid) || {};

            await window.vanzgramSaveProfile(uid, {
                ...cloudProfile,
                bio
            });
        }

        alert("Bio berhasil disimpan!");
        renderProfile();

    } catch (error) {
        console.error("Bio sync error:", error);

        alert(
            "Bio tersimpan di perangkat ini, " +
            "tetapi gagal disinkronkan ke Firebase."
        );

        renderProfile();
    }
}


/* =====================================================
   12. FOTO PROFIL
   ===================================================== */

function changeProfilePhoto(input) {
    const file = input.files?.[0];

    if (!file) return;

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
        input.value = "";
        return alert("Gunakan gambar JPG, PNG atau WEBP!");
    }

    if (file.size > 2 * 1024 * 1024) {
        input.value = "";
        return alert("Ukuran foto maksimal 2 MB!");
    }

    const reader = new FileReader();

    reader.onload = () => {
        const saved = updateLocalProfile(currentUser, {
            profilePhoto: reader.result
        });

        if (!saved) return alert("Pengguna tidak ditemukan!");

        alert("Foto profil berhasil diubah!");

        renderProfile();
    };

    reader.onerror = () => alert("Foto gagal dibaca!");

    reader.readAsDataURL(file);
}


/* =====================================================
   13. UBAH USERNAME
   ===================================================== */

async function changeUsername() {
    const input = getElement("newUsername");
    const newUsername = input?.value.trim();

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(newUsername || "")) {
        return alert(
            "Username harus 3-20 karakter dan hanya berisi huruf, angka, atau underscore!"
        );
    }

    if (newUsername.toLowerCase() === currentUser.toLowerCase()) {
        return alert("Username tersebut adalah username kamu saat ini.");
    }

    const users = getData("vanzgram_users");

    if (users.some(user =>
        user.username.toLowerCase() === newUsername.toLowerCase()
    )) {
        return alert("Username sudah digunakan!");
    }

    // Username terhubung ke Firebase usernameIndex dan identitas chat.
    // Jangan mengubahnya secara lokal saja karena dapat merusak sinkronisasi.
    alert(
        "Perubahan username belum diaktifkan.\n\n" +
        "Fitur ini perlu memperbarui usernameIndex dan profil Firebase " +
        "secara bersamaan agar akun dan ID tetap aman."
    );
}


/* =====================================================
   14. UBAH PASSWORD
   ===================================================== */

function changePassword() {
    const oldPassword = getElement("oldPassword")?.value || "";
    const newPassword = getElement("newPassword")?.value || "";
    const confirmPassword = getElement("confirmNewPassword")?.value || "";

    if (!oldPassword || !newPassword || !confirmPassword) {
        return alert("Lengkapi semua kolom sandi!");
    }

    if (newPassword.length < 8) {
        return alert("Sandi baru minimal 8 karakter!");
    }

    if (newPassword !== confirmPassword) {
        return alert("Konfirmasi sandi tidak cocok!");
    }

    // Tidak menyimpan atau memeriksa password di localStorage.
    // Perlu Firebase reauthentication dan updatePassword.
    alert(
        "Penggantian sandi belum diaktifkan pada versi ini. " +
        "Password akun tetap dikelola oleh Firebase Authentication."
    );
}


/* =====================================================
   15. DEVELOPER PANEL
   ===================================================== */


function renderDeveloperPanel() {
    if (currentUser?.toLowerCase() !== "vanz") {
        return alert("Akses ditolak!");
    }

    const users = getData("vanzgram_users");

    getElement("mainContent").innerHTML = `
        <div class="modern-profile">
            <div class="profile-heading">
                <div>
                    <h2>🛠️ Developer Panel</h2>
                    <p>Kelola pengguna VanzGram</p>
                </div>
            </div>

            <!-- VERIFIED BADGE -->
            <section class="modern-settings-card">
                <h3>🔎 Verifikasi berdasarkan ID</h3>

                <input
                    type="text"
                    id="verifyUserId"
                    placeholder="Masukkan ID pengguna"
                    maxlength="6"
                >

                <button class="modern-save-button" id="verifyByIdButton">
                    🔵 Verifikasi Pengguna
                </button>
            </section>

            <!-- CUSTOM USER ID -->
            <section class="modern-settings-card">
                <h3>🆔 Custom User ID</h3>
                <p>Ubah ID pengguna secara manual.</p>

                <input
                    type="text"
                    id="customIdUsername"
                    placeholder="Masukkan username pengguna"
                >

                <input
                    type="text"
                    id="customUserId"
                    placeholder="Masukkan ID baru (6 digit)"
                    maxlength="6"
                    inputmode="numeric"
                >

                <button class="modern-save-button" id="saveCustomUserId">
                    💾 Simpan User ID
                </button>
            </section>

            <!-- DAFTAR PENGGUNA -->
            <section class="modern-settings-card">
                <h3>👥 Daftar Pengguna</h3>

                ${users.map(user => `
                    <div class="modern-info-row">
                        <div>
                            <strong>
                                ${escapeText(user.username)}
                                ${user.isVerified
                                    ? '<span class="vg-verified">✓</span>'
                                    : ""
                                }
                            </strong>
                            <br>
                            <small>
                                ID: ${escapeText(String(user.id || "Belum ada ID"))}
                            </small>
                        </div>

                        <button
                            class="modern-save-button"
                            data-verify-id="${escapeText(String(user.id || ""))}"
                        >
                            ${user.isVerified ? "Cabut Badge" : "Verifikasi"}
                        </button>
                    </div>
                `).join("")}
            </section>

            <button class="modern-logout" id="backProfileButton">
                ← Kembali ke Profil
            </button>
        </div>
    `;

    getElement("verifyByIdButton")
        ?.addEventListener("click", verifyUserById);

    getElement("backProfileButton")
        ?.addEventListener("click", renderProfile);

    document.querySelectorAll("[data-verify-id]")
        .forEach(button => {
            button.addEventListener("click", () => {
                toggleVerification(button.dataset.verifyId);
            });
        });

    // SIMPAN CUSTOM USER ID
    getElement("saveCustomUserId")
        ?.addEventListener("click", () => {

            if (currentUser?.toLowerCase() !== "vanz") {
                return alert("Akses ditolak!");
            }

            const username = getElement("customIdUsername")
                .value.trim();

            const newId = getElement("customUserId")
                .value.trim();

            if (!username || !newId) {
                return alert("Username dan ID wajib diisi!");
            }

            if (!/^\d{6}$/.test(newId)) {
                return alert("ID harus terdiri dari 6 angka!");
            }

            const allUsers = getData("vanzgram_users");

            const targetUser = allUsers.find(user =>
                user.username.toLowerCase() === username.toLowerCase()
            );

            if (!targetUser) {
                return alert("Pengguna tidak ditemukan!");
            }

            const duplicate = allUsers.some(user =>
                user !== targetUser &&
                String(user.id) === newId
            );

            if (duplicate) {
                return alert("ID tersebut sudah digunakan pengguna lain!");
            }

            const oldId = targetUser.id;

            if (String(oldId) === newId) {
                return alert("ID tersebut sama dengan ID sebelumnya!");
            }

            const confirmation = confirm(
                `Ubah ID ${targetUser.username} dari ${oldId} menjadi ${newId}?`
            );

            if (!confirmation) return;

            targetUser.id = newId;

            saveData("vanzgram_users", allUsers);

            alert("User ID berhasil diubah!");

            renderDeveloperPanel();
        });
}

function verifyUserById() {
    if (currentUser?.toLowerCase() !== "vanz") {
        return alert("Akses ditolak!");
    }

    const id = getElement("verifyUserId")?.value.trim();

    if (!/^\d{6}$/.test(id || "")) {
        return alert("Masukkan ID 6 digit yang valid!");
    }

    const users = getData("vanzgram_users");
    const user = users.find(item => String(item.id) === id);

    if (!user) return alert("Pengguna tidak ditemukan!");

    if (user.isVerified) {
        return alert("Pengguna sudah terverifikasi!");
    }

    user.isVerified = true;

    saveData("vanzgram_users", users);

    alert("Centang biru berhasil diberikan!");

    renderDeveloperPanel();
}

function toggleVerification(id) {
    if (currentUser?.toLowerCase() !== "vanz") {
        return alert("Akses ditolak!");
    }

    const users = getData("vanzgram_users");
    const user = users.find(item => String(item.id) === id);

    if (!user) return alert("Pengguna tidak ditemukan!");

    user.isVerified = !user.isVerified;

    saveData("vanzgram_users", users);

    alert(
        user.isVerified
            ? "Centang biru berhasil diberikan!"
            : "Centang biru berhasil dicabut!"
    );

    renderDeveloperPanel();
}


/* =====================================================
   16. LOGOUT
   ===================================================== */

function logout() {
    localStorage.removeItem("vanzgram_session");
    localStorage.removeItem("vanzgram_uid");

    currentUser = null;
    selectedUser = null;

    getElement("content")?.classList.add("hidden");

    showLogin();
}


/* =====================================================
   17. PEMULIHAN TEMA DAN SESSION
   ===================================================== */

const savedTheme =
    localStorage.getItem("vanzgram_theme") || "green";

applyTheme(savedTheme);

if (currentUser) {
    startApp();
} else {
    showLogin();
}


/* =====================================================
   18. MIGRASI AKUN LAMA
   ===================================================== */

// Dipertahankan untuk kompatibilitas.
// Jangan jalankan lagi jika akun Vanz sudah berhasil dimigrasikan.

window.migrateVanzAccount = async function () {
    const email = prompt("Masukkan email baru untuk akun Vanz:");

    if (!email) return;

    const password = prompt("Masukkan password baru akun Vanz:");

    if (!password) return;

    try {
        await window.firebaseReady;

        const profile = await window.vanzgramMigrateOldAccount(
            email.trim(),
            password
        );

        currentUser = profile.username;

        localStorage.setItem("vanzgram_session", profile.username);

        alert(
            "Migrasi berhasil!\n\n" +
            "Username: " + profile.username +
            "\nVanzGram ID: " + profile.id
        );

        startApp();

    } catch (error) {
        console.error("Migration error:", error);

        alert("Migrasi gagal: " + error.message);
    }
};


/* =====================================================
   19. LIQUID GLASS NAVIGATION
   ===================================================== */

function updateLiquidGlass() {
    const nav = document.querySelector(".nav");

    if (!nav) return;

    const buttons = Array.from(nav.querySelectorAll("button"));

    if (!buttons.length) return;

    const activeIndex = buttons.findIndex(button =>
        button.classList.contains("active")
    );

    nav.style.setProperty("--nav-count", buttons.length);

    if (activeIndex >= 0) {
        nav.style.setProperty("--nav-index", activeIndex);
    }
}

// Sinkronisasi indikator setelah DOM siap
document.addEventListener("DOMContentLoaded", updateLiquidGlass);

// Pantau perubahan class active
const liquidGlassObserver = new MutationObserver(() => {
    updateLiquidGlass();
});

if (document.body) {
    liquidGlassObserver.observe(document.body, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ["class"]
    });
}

// Perbarui saat ukuran jendela berubah
window.addEventListener("resize", updateLiquidGlass);

// Sediakan fungsi untuk dipanggil dari navigasi
window.updateLiquidGlass = updateLiquidGlass;
