/**
 * ครัวลุงหนุ่ย (Krua Lung Nui) - Manager / Admin Logic
 */

let currentAdminTab = "menus";
let selectedCategory = "cat-all";

document.addEventListener("DOMContentLoaded", () => {
  if (!verifyPageAccess("admin")) return;

  // ⚡ Auto-Reset: Auto-repair data immediately if empty
  if (!window.posState || !window.posState.menus || window.posState.menus.length < 30 || !window.posState.tables || window.posState.tables.length === 0) {
    autoResetMenusAndTables();
  }

  updateTopNavUserBadge();
  applyRoleNavPermissions();
  startLiveClock();
  initSettingsForm();
  renderCategoryPills();
  renderMenuList();
  renderTableAdminList();
  renderKPIs();
  renderOrderHistoryTable();
  updatePromptPayPreview();
  updateStatsCounters();
  if (typeof initAccountingModule === "function") initAccountingModule();
  refreshLucideIcons();
});

function applyRoleNavPermissions() {
  const isOwnerUser = typeof isOwner === "function" && isOwner();
  const navOwnerSecurity = document.getElementById("navTabOwnerSecurity");
  if (navOwnerSecurity) {
    navOwnerSecurity.style.display = isOwnerUser ? "flex" : "none";
  }

  // If regular manager, check permissions for sensitive tabs
  if (!isOwnerUser && typeof getRolePermissions === "function") {
    const perms = getRolePermissions();
    const adminPerms = perms.admin || {};

    const tabLoansBtn = document.querySelector('.side-nav-item[data-tab="loans"]');
    if (tabLoansBtn) tabLoansBtn.style.display = adminPerms.canViewLoans ? "flex" : "none";

    const tabSettingsBtn = document.querySelector('.side-nav-item[data-tab="settings"]');
    if (tabSettingsBtn) tabSettingsBtn.style.display = adminPerms.canAccessSettings ? "flex" : "none";

    const tabAccBtn = document.querySelector('.side-nav-item[data-tab="accounting"]');
    if (tabAccBtn) tabAccBtn.style.display = adminPerms.canViewAccounting ? "flex" : "none";

    const tabLedgerBtn = document.querySelector('.side-nav-item[data-tab="ledger"]');
    if (tabLedgerBtn) tabLedgerBtn.style.display = adminPerms.canViewLedger ? "flex" : "none";
  }
}

function updateStatsCounters() {
  document.getElementById("statMenuCount").innerText = window.posState.menus.length;
  document.getElementById("statTableCount").innerText = window.posState.tables.length;
  document.getElementById("headerShopName").innerText = window.posState.settings.shopName;
}

function switchAdminTab(tab) {
  if (tab === "owner-security") {
    if (typeof isOwner === "function" && !isOwner()) {
      alert("⚠️ หน้านี้สำหรับเจ้าของร้าน (Owner) เท่านั้น");
      return switchAdminTab("menus");
    }
  }

  currentAdminTab = tab;
  document.querySelectorAll(".side-nav-item").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });
  document.querySelectorAll(".admin-tab-content").forEach(content => {
    content.classList.toggle("active", content.id === `tab-${tab}`);
  });

  if (tab === "reports") renderKPIs(), renderOrderHistoryTable();
  if (tab === "tables") renderTableAdminList();
  if (tab === "menus") renderMenuList();
  if (tab === "settings") updatePromptPayPreview();
  if (tab === "accounting" && typeof renderAccountingDashboard === "function") renderAccountingDashboard();
  if (tab === "ledger") {
    if (typeof initAccountingModule === "function") initAccountingModule();
    if (typeof renderTransactionLedger === "function") renderTransactionLedger();
    if (typeof renderShiftClosingView === "function") renderShiftClosingView();
  }
  if (tab === "loans" && typeof renderLoanTracker === "function") renderLoanTracker();
  if (tab === "owner-security") renderOwnerSecurityPanel();
  refreshLucideIcons();
}

function resetToDefault24Menus() {
  if (confirm("ต้องการโหลดรายการอาหาร 43 เมนูและผังโต๊ะมาตรฐานของครัวลุงหนุ่ยใช่หรือไม่?")) {
    window.posState.menus = (typeof window.DEFAULT_MENUS !== 'undefined' && window.DEFAULT_MENUS.length > 0) ? window.DEFAULT_MENUS : FALLBACK_MENUS;
    window.posState.categories = (typeof window.DEFAULT_CATEGORIES !== 'undefined' && window.DEFAULT_CATEGORIES.length > 0) ? window.DEFAULT_CATEGORIES : FALLBACK_CATEGORIES;
    window.posState.tables = (typeof window.DEFAULT_TABLES !== 'undefined' && window.DEFAULT_TABLES.length > 0) ? window.DEFAULT_TABLES : FALLBACK_TABLES;
    savePOSState();
    localStorage.setItem("pos_menus", JSON.stringify(window.posState.menus));
    localStorage.setItem("pos_categories", JSON.stringify(window.posState.categories));
    localStorage.setItem("pos_tables", JSON.stringify(window.posState.tables));
    localStorage.setItem("pos_menu_version", "krua_lung_nui_v5_clean_drinks");
    selectedCategory = "cat-all";
    renderCategoryPills();
    renderMenuList();
    renderTableAdminList();
    updateStatsCounters();
    alert("✅ โหลดเมนูมาตรฐาน 43 รายการและผังโต๊ะของครัวลุงหนุ่ยเรียบร้อยแล้วครับ!");
  }
}

// Category Management
function renderCategoryPills() {
  const container = document.getElementById("categoryFilterPills");
  if (!container) return;
  container.innerHTML = window.posState.categories.map(cat => `
    <button class="pill-btn ${cat.id === selectedCategory ? 'active' : ''}" onclick="selectCategoryFilter('${cat.id}')">
      ${cat.name}
    </button>
  `).join("");
}

function selectCategoryFilter(catId) {
  selectedCategory = catId;
  renderCategoryPills();
  renderMenuList();
}

// Menu Management
function renderMenuList() {
  const container = document.getElementById("menuGridContainer");
  if (!container) return;
  const searchQuery = (document.getElementById("menuSearchInput")?.value || "").toLowerCase().trim();

  let filtered = window.posState.menus.filter(m => {
    const matchCat = selectedCategory === "cat-all" || m.categoryId === selectedCategory;
    const matchSearch = m.name.toLowerCase().includes(searchQuery) || (m.description && m.description.toLowerCase().includes(searchQuery));
    return matchCat && matchSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state col-span-2" style="grid-column: 1/-1; padding: 3rem; text-align: center; color: var(--text-muted);">
        <i data-lucide="utensils" style="width: 48px; height: 48px; margin: 0 auto 1rem; opacity: 0.4;"></i>
        <p>ไม่พบรายการอาหารตามเงื่อนไขที่ค้นหา</p>
      </div>
    `;
    refreshLucideIcons();
    return;
  }

  container.innerHTML = filtered.map(item => {
    const category = window.posState.categories.find(c => c.id === item.categoryId)?.name || "ทั่วไป";
    return `
      <div class="menu-card ${!item.isAvailable ? 'out-of-stock' : ''}">
        <div class="menu-card-img-wrap">
          <img src="${item.imageUrl || 'images/somtum_thai_egg.jpg'}" class="menu-card-img" alt="${item.name}" loading="lazy" onerror="this.src='logo/logo.png'">
          <span class="menu-card-badge">${category}</span>
          <div class="menu-card-stock-tag">
            <span class="badge ${item.isAvailable ? 'badge-success' : 'badge-danger'}">
              ${item.isAvailable ? 'พร้อมขาย' : 'ของหมด'}
            </span>
          </div>
        </div>
        <div class="menu-card-body">
          <div>
            <h4 class="menu-card-title">${item.name}</h4>
            <p class="menu-card-desc">${item.description || 'ไม่มีคำอธิบาย'}</p>
          </div>
          <div class="menu-card-price">฿${item.price.toFixed(2)}</div>
          <div class="menu-card-actions">
            <label class="switch-wrap" title="สลับสถานะพร้อมขาย">
              <input type="checkbox" ${item.isAvailable ? 'checked' : ''} onchange="toggleMenuAvailability('${item.id}', this.checked)">
              <span>${item.isAvailable ? 'พร้อมขาย' : 'ปิดชั่วคราว'}</span>
            </label>
            <div style="display: flex; gap: 0.35rem;">
              <button class="btn btn-icon btn-light" onclick="openEditMenuModal('${item.id}')" title="แก้ไข">
                <i data-lucide="edit-3"></i>
              </button>
              <button class="btn btn-icon btn-danger-subtle" onclick="deleteMenu('${item.id}')" title="ลบ">
                <i data-lucide="trash-2"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join("");
  refreshLucideIcons();
}

function toggleMenuAvailability(menuId, isAvailable) {
  const item = window.posState.menus.find(m => m.id === menuId);
  if (item) {
    item.isAvailable = isAvailable;
    savePOSState();
    renderMenuList();
  }
}

function openAddMenuModal() {
  document.getElementById("menuForm").reset();
  document.getElementById("menuFormId").value = "";
  document.getElementById("menuModalTitle").innerText = "เพิ่มเมนูอาหารใหม่";
  populateCategorySelect();
  openModal("menuModal");
}

function openEditMenuModal(menuId) {
  const item = window.posState.menus.find(m => m.id === menuId);
  if (!item) return;
  populateCategorySelect(item.categoryId);
  document.getElementById("menuFormId").value = item.id;
  document.getElementById("menuName").value = item.name;
  document.getElementById("menuPrice").value = item.price;
  document.getElementById("menuDesc").value = item.description || "";
  document.getElementById("menuImage").value = item.imageUrl || "";
  document.getElementById("menuOptions").value = item.options || "";
  document.getElementById("menuAvailable").checked = item.isAvailable;
  document.getElementById("menuModalTitle").innerText = "แก้ไขเมนูอาหาร";
  openModal("menuModal");
}

function populateCategorySelect(selectedId = null) {
  const select = document.getElementById("menuCategory");
  const options = window.posState.categories
    .filter(c => c.id !== "cat-all")
    .map(c => `<option value="${c.id}" ${c.id === selectedId ? 'selected' : ''}>${c.name}</option>`);
  select.innerHTML = options.join("");
}

function handleSaveMenu(e) {
  e.preventDefault();
  const id = document.getElementById("menuFormId").value;
  const name = document.getElementById("menuName").value.trim();
  const categoryId = document.getElementById("menuCategory").value;
  const price = parseFloat(document.getElementById("menuPrice").value) || 0;
  const description = document.getElementById("menuDesc").value.trim();
  const imageUrl = document.getElementById("menuImage").value.trim();
  const options = document.getElementById("menuOptions").value.trim();
  const isAvailable = document.getElementById("menuAvailable").checked;

  if (id) {
    const index = window.posState.menus.findIndex(m => m.id === id);
    if (index !== -1) {
      window.posState.menus[index] = { ...window.posState.menus[index], name, categoryId, price, description, imageUrl, options, isAvailable };
    }
  } else {
    const newId = "m-" + Date.now().toString().slice(-4);
    window.posState.menus.unshift({ id: newId, name, categoryId, price, description, imageUrl, options, isAvailable });
  }

  savePOSState();
  closeModal("menuModal");
  renderMenuList();
  updateStatsCounters();
}

function deleteMenu(menuId) {
  if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบเมนูนี้?")) {
    window.posState.menus = window.posState.menus.filter(m => m.id !== menuId);
    savePOSState();
    renderMenuList();
    updateStatsCounters();
  }
}

// Category modal logic
function openCategoryModal() {
  renderCategoryManageList();
  openModal("categoryModal");
}

function renderCategoryManageList() {
  const container = document.getElementById("categoryListManage");
  container.innerHTML = window.posState.categories
    .filter(c => c.id !== "cat-all")
    .map(c => `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:0.6rem 0.8rem; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; margin-bottom:0.5rem;">
        <span>${c.name}</span>
        <button class="btn btn-icon btn-danger-subtle" onclick="deleteCategory('${c.id}')"><i data-lucide="trash-2"></i></button>
      </div>
    `).join("");
  refreshLucideIcons();
}

function handleAddCategory() {
  const input = document.getElementById("newCategoryInput");
  const name = input.value.trim();
  if (!name) return;
  const newCat = { id: "cat-" + Date.now().toString().slice(-4), name };
  window.posState.categories.push(newCat);
  savePOSState();
  input.value = "";
  renderCategoryManageList();
  renderCategoryPills();
}

function deleteCategory(catId) {
  if (confirm("ต้องการลบหมวดหมู่นี้หรือไม่?")) {
    window.posState.categories = window.posState.categories.filter(c => c.id !== catId);
    savePOSState();
    renderCategoryManageList();
    renderCategoryPills();
    renderMenuList();
  }
}

// Robust URL helper for QR Codes (Always generates scannable public URLs for mobile phones)
function getFrontendUrl(queryParams = "") {
  const origin = (window.location.origin && window.location.origin !== "null") ? window.location.origin : "";
  const isLocalOrFile = !origin || origin === "null" || origin.includes("localhost") || origin.includes("127.0.0.1") || window.location.protocol === "file:";

  if (isLocalOrFile) {
    // When run on local PC (file:// or localhost), mobile phones scanning the QR code need the live public URL
    return `https://kenshiro99.github.io/Krua-Lung-Nui/frontend/index.html${queryParams}`;
  }

  const path = window.location.pathname;
  const backendIndex = path.indexOf("/backend/");
  let basePath = "";
  if (backendIndex !== -1) {
    basePath = path.substring(0, backendIndex);
  } else {
    basePath = path.substring(0, path.lastIndexOf("/"));
    if (basePath.endsWith("/backend")) basePath = basePath.substring(0, basePath.length - 8);
  }
  
  const cleanBase = basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;
  return `${origin}${cleanBase}/frontend/index.html${queryParams}`;
}

// Table & QR Management (No zones, No seats)
function renderTableAdminList() {
  const container = document.getElementById("tableAdminGrid");
  if (!container) return;

  container.innerHTML = window.posState.tables.map(t => {
    const isOccupied = t.status === "occupied";
    const displayName = t.name.startsWith("โต๊ะ") ? t.name : `โต๊ะ ${t.name}`;
    return `
      <div class="table-admin-card">
        <div>
          <div class="table-card-top">
            <span class="table-number-title">${displayName}</span>
            <span class="badge ${isOccupied ? 'badge-warning' : 'badge-success'}">
              ${isOccupied ? 'กำลังทาน' : 'โต๊ะว่าง'}
            </span>
          </div>
          <div class="table-qr-mini-preview" id="qr-mini-${t.id}"></div>
        </div>
        <div class="table-card-foot-actions">
          <button class="btn btn-secondary" style="flex:1;" onclick="previewTableQRTent('${t.id}')">
            <i data-lucide="printer"></i> ดูป้ายตั้งโต๊ะ
          </button>
          <button class="btn btn-icon btn-light" onclick="deleteTable('${t.id}')" title="ลบโต๊ะนี้">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </div>
    `;
  }).join("");

  setTimeout(() => {
    window.posState.tables.forEach(t => {
      const el = document.getElementById(`qr-mini-${t.id}`);
      if (el) {
        el.innerHTML = "";
        const cleanNum = t.name.replace(/^โต๊ะ\s*/, '');
        new QRCode(el, {
          text: getFrontendUrl(`?table=${encodeURIComponent(cleanNum)}`),
          width: 80,
          height: 80,
          colorDark: "#0f172a",
          colorLight: "#f8fafc"
        });
      }
    });
    refreshLucideIcons();
  }, 50);
}

function openAddTableModal() {
  document.getElementById("tableForm").reset();
  document.getElementById("tableFormId").value = "";
  document.getElementById("tableModalTitle").innerText = "เพิ่มโต๊ะอาหารใหม่";
  openModal("tableModal");
}

function handleSaveTable(e) {
  e.preventDefault();
  const name = document.getElementById("tableName").value.trim();
  const newId = "t-" + Date.now().toString().slice(-4);
  window.posState.tables.push({ id: newId, name, status: "available" });

  savePOSState();
  closeModal("tableModal");
  renderTableAdminList();
  updateStatsCounters();
}

function deleteTable(tableId) {
  if (confirm("ต้องการลบโต๊ะนี้ใช่หรือไม่?")) {
    window.posState.tables = window.posState.tables.filter(t => t.id !== tableId);
    savePOSState();
    renderTableAdminList();
    updateStatsCounters();
  }
}

function previewTableQRTent(tableId) {
  const table = window.posState.tables.find(t => t.id === tableId);
  if (!table) return;

  const container = document.getElementById("qrPrintContent");
  const titleEl = document.getElementById("qrPrintModalTitle");
  const subEl = document.getElementById("qrPrintModalSub");
  const cleanTName = table.name.replace(/^โต๊ะ\s*/, '');
  const orderUrl = getFrontendUrl(`?table=${encodeURIComponent(cleanTName)}`);

  if (titleEl) titleEl.innerText = `ป้าย QR Code ประจำโต๊ะ ${cleanTName}`;
  if (subEl) subEl.innerText = "แบบป้ายตั้งโต๊ะ (Tent Card) สแกนติดง่าย พร้อมพิมพ์ใช้งานได้ทันที";

  container.innerHTML = `
    <div class="qr-stand-card qr-cut-guide-border" style="max-width: 380px;">
      <div class="qr-stand-header">
        <div class="qr-stand-logo-wrap">
          <img src="logo/logo.jpg" alt="โลโก้ครัวลุงหนุ่ย" class="qr-stand-logo-img" onerror="this.src='logo/logo.png'">
        </div>
        <div class="qr-stand-shop-title">${window.posState.settings.shopName}</div>
        <div class="qr-stand-shop-sub">รสชาติต้นตำรับ • อร่อยเหมือนกินที่บ้าน</div>
      </div>
      
      <div class="qr-stand-table-badge">
        <span>🍽️ โต๊ะ ${cleanTName}</span>
      </div>

      <div class="qr-stand-code-wrap" id="modalTentQRBox"></div>

      <div class="qr-stand-instructions">
        <div class="qr-step-item">
          <span class="qr-step-num">1</span>
          <span>เปิดกล้องมือถือ หรือ LINE สแกน QR Code</span>
        </div>
        <div class="qr-step-item">
          <span class="qr-step-num">2</span>
          <span>เลือกเมนูอาหาร ระบุตัวเลือก แล้วกดสั่ง</span>
        </div>
        <div class="qr-step-item">
          <span class="qr-step-num">3</span>
          <span>ระบบส่งออเดอร์เข้าครัวปรุงสดทันที</span>
        </div>
      </div>

      <div class="qr-stand-footer">
        <div>✨ สแกนสั่งเพิ่มหรือเรียกพนักงานได้ตลอดเวลา</div>
        <div style="font-size: 0.68rem; color: #94a3b8; margin-top: 3px;">
          เบอร์โทรติดต่อ: ${window.posState.settings.phone || '089-123-4567'}
        </div>
      </div>
    </div>
  `;

  setTimeout(() => {
    const qrBox = document.getElementById("modalTentQRBox");
    if (qrBox) {
      qrBox.innerHTML = "";
      new QRCode(qrBox, {
        text: orderUrl,
        width: 175,
        height: 175,
        colorDark: "#0f172a",
        colorLight: "#ffffff"
      });
    }
  }, 50);

  openModal("qrPrintModal");
}

function previewTakeawayQRStand() {
  const container = document.getElementById("qrPrintContent");
  const titleEl = document.getElementById("qrPrintModalTitle");
  const subEl = document.getElementById("qrPrintModalSub");
  const takeawayUrl = getFrontendUrl(`?type=takeaway`);

  if (titleEl) titleEl.innerText = "ป้าย QR Code สั่งอาหารกลับบ้าน (Takeaway)";
  if (subEl) subEl.innerText = "สำหรับตั้งที่เคาน์เตอร์หน้าร้าน ให้ลูกค้าสแกนสั่งกลับบ้านและรับบัตรคิวในมือถือทันที";

  container.innerHTML = `
    <div class="qr-stand-card takeaway-stand-theme qr-cut-guide-border" style="max-width: 380px;">
      <div class="qr-stand-header">
        <div class="qr-stand-logo-wrap">
          <img src="logo/logo.jpg" alt="โลโก้ครัวลุงหนุ่ย" class="qr-stand-logo-img" onerror="this.src='logo/logo.png'">
        </div>
        <div class="qr-stand-shop-title" style="color: #9a3412;">${window.posState.settings.shopName}</div>
        <div class="qr-stand-shop-sub">จุดบริการสั่งอาหารกลับบ้าน (Takeaway)</div>
      </div>
      
      <div class="qr-stand-table-badge">
        <span>🛍️ สั่งอาหารกลับบ้าน</span>
      </div>

      <div class="qr-stand-code-wrap" id="modalTakeawayQRBox"></div>

      <div class="qr-stand-instructions" style="background: #fff7ed; border-color: #ffedd5;">
        <div class="qr-step-item">
          <span class="qr-step-num">1</span>
          <span>สแกน QR เพื่อเลือกรายการอาหารบนมือถือ</span>
        </div>
        <div class="qr-step-item">
          <span class="qr-step-num">2</span>
          <span>กดยืนยันออเดอร์เพื่อรับ "หมายเลขคิว" ทันที</span>
        </div>
        <div class="qr-step-item">
          <span class="qr-step-num">3</span>
          <span>โอนจ่ายพร้อมเพย์หน้าร้าน แล้วรอรับอาหารปรุงสด</span>
        </div>
      </div>

      <div class="qr-stand-footer" style="color: #9a3412;">
        <div style="font-weight: 700;">⚡ สั่งง่าย สะดวก รวดเร็ว ไม่ต้องยืนรอคิว</div>
        <div style="font-size: 0.68rem; color: #b45309; margin-top: 3px;">
          ครัวลุงหนุ่ยขอบพระคุณทุกท่านครับ 🙏
        </div>
      </div>
    </div>
  `;

  setTimeout(() => {
    const qrBox = document.getElementById("modalTakeawayQRBox");
    if (qrBox) {
      qrBox.innerHTML = "";
      new QRCode(qrBox, {
        text: takeawayUrl,
        width: 175,
        height: 175,
        colorDark: "#9a3412",
        colorLight: "#ffffff"
      });
    }
  }, 50);

  openModal("qrPrintModal");
}

function printAllQRCards() {
  const container = document.getElementById("qrPrintContent");
  const titleEl = document.getElementById("qrPrintModalTitle");
  const subEl = document.getElementById("qrPrintModalSub");

  if (titleEl) titleEl.innerText = `พิมพ์ป้าย QR Code ทุกโต๊ะ (${window.posState.tables.length} โต๊ะ)`;
  if (subEl) subEl.innerText = "ป้ายตั้งโต๊ะพร้อมพิมพ์ (2 คอลัมน์ต่อหน้า A4) พร้อมเส้นประพับ/ตัด ใช้งานได้ทันที";

  container.innerHTML = `
    <div class="qr-batch-print-grid">
      ${window.posState.tables.map(t => {
        const cleanTName = t.name.replace(/^โต๊ะ\s*/, '');
        return `
          <div class="qr-stand-card qr-cut-guide-border">
            <div class="qr-stand-header">
              <div class="qr-stand-logo-wrap" style="width: 52px; height: 52px;">
                <img src="logo/logo.jpg" alt="โลโก้ครัวลุงหนุ่ย" class="qr-stand-logo-img" onerror="this.src='logo/logo.png'">
              </div>
              <div class="qr-stand-shop-title" style="font-size: 1.05rem;">${window.posState.settings.shopName}</div>
            </div>
            
            <div class="qr-stand-table-badge" style="font-size: 1.2rem; padding: 0.35rem 1rem; margin: 0.5rem 0;">
              <span>🍽️ โต๊ะ ${cleanTName}</span>
            </div>

            <div class="qr-stand-code-wrap" id="all-print-qr-${t.id}"></div>

            <div class="qr-stand-instructions" style="padding: 0.5rem 0.65rem; margin: 0.4rem 0;">
              <div class="qr-step-item" style="font-size: 0.78rem;">
                <span class="qr-step-num" style="width: 18px; height: 18px; font-size: 0.65rem;">1</span>
                <span>เปิดกล้องมือถือ หรือ LINE สแกน QR</span>
              </div>
              <div class="qr-step-item" style="font-size: 0.78rem;">
                <span class="qr-step-num" style="width: 18px; height: 18px; font-size: 0.65rem;">2</span>
                <span>เลือกอาหารและกดส่งออเดอร์เข้าครัว</span>
              </div>
            </div>

            <div class="qr-stand-footer" style="font-size: 0.72rem;">
              ✨ อร่อยเหมือนกินที่บ้าน • สแกนสั่งได้ตลอดเวลา
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;

  setTimeout(() => {
    window.posState.tables.forEach(t => {
      const cleanTName = t.name.replace(/^โต๊ะ\s*/, '');
      const el = document.getElementById(`all-print-qr-${t.id}`);
      if (el) {
        el.innerHTML = "";
        new QRCode(el, {
          text: getFrontendUrl(`?table=${encodeURIComponent(cleanTName)}`),
          width: 145,
          height: 145,
          colorDark: "#0f172a",
          colorLight: "#ffffff"
        });
      }
    });
    openModal("qrPrintModal");
  }, 60);
}

// Sales KPIs & Reports
function renderKPIs() {
  const todayOrders = window.posState.orders;
  const paidOrders = todayOrders.filter(o => o.paymentStatus === "paid");
  const totalSales = paidOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const avgBill = paidOrders.length > 0 ? (totalSales / paidOrders.length) : 0;

  const itemCounts = {};
  paidOrders.forEach(o => {
    o.items.forEach(i => {
      itemCounts[i.name] = (itemCounts[i.name] || 0) + i.qty;
    });
  });

  let topItem = "-";
  let topCount = 0;
  for (const [name, count] of Object.entries(itemCounts)) {
    if (count > topCount) {
      topCount = count;
      topItem = name;
    }
  }

  document.getElementById("kpiTodaySales").innerText = `฿${totalSales.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;
  document.getElementById("kpiPaidCount").innerText = `${paidOrders.length} บิลที่ชำระแล้ว`;
  document.getElementById("kpiTotalOrders").innerText = todayOrders.length;
  document.getElementById("kpiAvgBill").innerText = `฿${avgBill.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;
  document.getElementById("kpiTopMenu").innerText = topItem;
  document.getElementById("kpiTopMenuSales").innerText = topCount > 0 ? `ขายได้ ${topCount} จาน` : 'ยังไม่มีสถิติ';
}

function renderOrderHistoryTable() {
  const tbody = document.getElementById("orderHistoryTableBody");
  if (!tbody) return;
  const filter = document.getElementById("orderStatusFilter")?.value || "all";

  let list = window.posState.orders;
  if (filter !== "all") {
    list = list.filter(o => o.status === filter);
  }

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 2rem; color: var(--text-muted);">ไม่มีรายการคำสั่งซื้อ</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(o => {
    const timeStr = new Date(o.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
    const itemsSummary = o.items.map(i => `${i.name} x${i.qty}`).join(", ");
    const isPaid = o.paymentStatus === "paid";
    const isTakeaway = o.orderType === "takeaway" || String(o.tableName).startsWith("Q-");

    const statusBadgeMap = {
      pending: '<span class="badge badge-warning">รอดำเนินการ</span>',
      cooking: '<span class="badge badge-info">กำลังปรุง</span>',
      served: '<span class="badge badge-primary">เสิร์ฟแล้ว</span>',
      completed: '<span class="badge badge-success">เช็คบิลแล้ว</span>',
      cancelled: '<span class="badge badge-danger">ยกเลิก</span>'
    };

    return `
      <tr>
        <td><b>${o.id}</b></td>
        <td>${timeStr}</td>
        <td>
          <span class="badge ${isTakeaway ? 'badge-warning' : 'badge-primary'}">
            ${isTakeaway ? `🛍️ คิว ${o.tableName}` : `โต๊ะ ${o.tableName}`}
          </span>
        </td>
        <td style="max-width: 250px;" class="text-truncate" title="${itemsSummary}">${itemsSummary}</td>
        <td><b>฿${(o.total || 0).toFixed(2)}</b></td>
        <td>
          <span class="badge ${isPaid ? 'badge-success' : 'badge-warning'}">
            ${isPaid ? 'ชำระแล้ว' : 'รอชำระ'}
          </span>
        </td>
        <td>${statusBadgeMap[o.status] || o.status}</td>
        <td>
          <button class="btn btn-icon btn-light" onclick="deleteOrder('${o.id}')" title="ลบประวัติ">
            <i data-lucide="trash-2"></i>
          </button>
        </td>
      </tr>
    `;
  }).join("");
  refreshLucideIcons();
}

function deleteOrder(orderId) {
  if (confirm("ต้องการลบบิลนี้หรือไม่?")) {
    window.posState.orders = window.posState.orders.filter(o => o.id !== orderId);
    savePOSState();
    renderOrderHistoryTable();
    renderKPIs();
  }
}

function exportOrdersCSV() {
  if (window.posState.orders.length === 0) {
    alert("ยังไม่มีข้อมูลคำสั่งซื้อสำหรับส่งออก");
    return;
  }

  let csvContent = "\uFEFFเลขที่บิล,เวลาที่สั่ง,ประเภท/โต๊ะ,รายการอาหาร,ยอดรวม,สถานะการชำระ,สถานะออเดอร์\n";
  window.posState.orders.forEach(o => {
    const timeStr = new Date(o.createdAt).toLocaleString("th-TH");
    const items = o.items.map(i => `${i.name}(${i.qty})`).join("; ");
    csvContent += `"${o.id}","${timeStr}","${o.tableName}","${items}","${o.total}","${o.paymentStatus}","${o.status}"\n`;
  });

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `orders_krua_lung_nui_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function clearOrdersHistory() {
  if (confirm("คำเตือน: คุณต้องการล้างประวัติคำสั่งซื้อทั้งหมดใช่หรือไม่?")) {
    window.posState.orders = [];
    savePOSState();
    renderOrderHistoryTable();
    renderKPIs();
  }
}

// Settings & PromptPay Engine
function initSettingsForm() {
  document.getElementById("settingShopName").value = window.posState.settings.shopName;
  document.getElementById("settingShopPhone").value = window.posState.settings.phone;
  document.getElementById("settingShopAddress").value = window.posState.settings.address;
  document.getElementById("settingReceiptFooter").value = window.posState.settings.receiptFooter;
  document.getElementById("settingPromptPayId").value = window.posState.settings.promptpayId;
  document.getElementById("settingPromptPayName").value = window.posState.settings.promptpayName;
  document.getElementById("settingLineWebhook").value = window.posState.settings.lineWebhook;
  document.getElementById("settingServiceCharge").value = window.posState.settings.serviceCharge;
  document.getElementById("settingVat").value = window.posState.settings.vat;
}

function saveSettings() {
  window.posState.settings = {
    shopName: document.getElementById("settingShopName").value.trim(),
    phone: document.getElementById("settingShopPhone").value.trim(),
    address: document.getElementById("settingShopAddress").value.trim(),
    receiptFooter: document.getElementById("settingReceiptFooter").value.trim(),
    promptpayType: document.querySelector('input[name="promptpayType"]:checked')?.value || "mobile",
    promptpayId: document.getElementById("settingPromptPayId").value.trim(),
    promptpayName: document.getElementById("settingPromptPayName").value.trim(),
    lineWebhook: document.getElementById("settingLineWebhook").value.trim(),
    serviceCharge: parseFloat(document.getElementById("settingServiceCharge").value) || 0,
    vat: parseFloat(document.getElementById("settingVat").value) || 0
  };

  savePOSState();
  updatePromptPayPreview();
  updateStatsCounters();
  alert("✅ บันทึกการตั้งค่าร้านครัวลุงหนุ่ยและพร้อมเพย์เรียบร้อยแล้ว!");
}

function handleSaveSecurityPins() {
  const ownerInput = document.getElementById("newOwnerPin");
  const adminInput = document.getElementById("newAdminPin");
  const managerInput = document.getElementById("newManagerPin");
  const cashierInput = document.getElementById("newCashierPin");
  const kitchenInput = document.getElementById("newKitchenPin");

  const ownerPin = ownerInput ? ownerInput.value.trim() : "";
  const adminPin = adminInput ? adminInput.value.trim() : "";
  const managerPin = managerInput ? managerInput.value.trim() : "";
  const cashierPin = cashierInput ? cashierInput.value.trim() : "";
  const kitchenPin = kitchenInput ? kitchenInput.value.trim() : "";

  if (!ownerPin && !adminPin && !managerPin && !cashierPin && !kitchenPin) {
    alert("กรุณากรอกรหัส PIN ใหม่ของแผนกที่ต้องการเปลี่ยนอย่างน้อย 1 แผนก (4-6 หลัก)");
    return;
  }

  let updated = [];

  if (ownerPin) {
    if (ownerPin.length < 4) {
      alert("⚠️ รหัส PIN เจ้าของร้านต้องมีความยาว 4-6 หลัก");
      return;
    }
    updateDepartmentPin("owner", ownerPin);
    updated.push("👑 เจ้าของร้าน (Owner)");
  }

  if (adminPin) {
    if (adminPin.length < 4) {
      alert("⚠️ รหัส PIN แอดมินต้องมีความยาว 4-6 หลัก");
      return;
    }
    updateDepartmentPin("admin", adminPin);
    updated.push("🛡️ แอดมิน (Admin)");
  }

  if (managerPin) {
    if (managerPin.length < 4) {
      alert("⚠️ รหัส PIN ผู้จัดการต้องมีความยาว 4-6 หลัก");
      return;
    }
    updateDepartmentPin("manager", managerPin);
    updated.push("👨‍💼 ผู้จัดการ (Manager)");
  }

  if (cashierPin) {
    if (cashierPin.length < 4) {
      alert("⚠️ รหัส PIN แคชเชียร์ต้องมีความยาว 4-6 หลัก");
      return;
    }
    updateDepartmentPin("cashier", cashierPin);
    updated.push("💵 แคชเชียร์ (POS)");
  }

  if (kitchenPin) {
    if (kitchenPin.length < 4) {
      alert("⚠️ รหัส PIN แผนกครัวต้องมีความยาว 4-6 หลัก");
      return;
    }
    updateDepartmentPin("kitchen", kitchenPin);
    updated.push("👨‍🍳 ห้องครัว (KDS)");
  }

  // Clear inputs immediately for shoulder-surfing security
  if (ownerInput) ownerInput.value = "";
  if (adminInput) adminInput.value = "";
  if (managerInput) managerInput.value = "";
  if (cashierInput) cashierInput.value = "";
  if (kitchenInput) kitchenInput.value = "";

  alert(`🔒 อัปเดตรหัส PIN ปลอดภัยสำเร็จ!\n\nแผนกที่เปลี่ยนรหัส:\n${updated.map(u => "• " + u).join("\n")}\n\nรหัสถูกเข้ารหัสแบบ Salted Hash เรียบร้อยแล้ว`);
}

function handleResetAllPinsPrompt() {
  const confirmed = confirm("⚠️ ต้องการรีเซ็ตรหัส PIN ของทุกแผนกกลับเป็นค่าเริ่มต้นจากโรงงานใช่หรือไม่?\n\n• 👑 เจ้าของร้าน: 8888\n• 🛡️ แอดมิน: 1111\n• 👨‍💼 ผู้จัดการ: 2222\n• 💵 แคชเชียร์: 3333\n• 👨‍🍳 ครัว: 4444");
  if (!confirmed) return;

  if (typeof resetAllPinsToFactoryDefault === "function") {
    resetAllPinsToFactoryDefault();
  }
  alert("✅ รีเซ็ตรหัส PIN ทั้งหมดกลับเป็นค่าเริ่มต้นจากโรงงานเรียบร้อยแล้ว!\n\n👑 เจ้าของร้าน: 8888\n🛡️ แอดมิน: 1111 (หรือ 1234)\n👨‍💼 ผู้จัดการ: 2222\n💵 แคชเชียร์: 3333\n👨‍🍳 ครัว: 4444");
}

// ============================================================================
// OWNER EXCLUSIVE SECURITY, MULTI-USER & ACCESS CONTROL FUNCTIONS
// ============================================================================
let currentUserFilter = "all";

function renderOwnerSecurityPanel() {
  if (typeof isOwner === "function" && !isOwner()) return;

  // 1. Live Session Banner
  const currentUser = typeof getCurrentUser === "function" ? getCurrentUser() : null;
  const bannerText = document.getElementById("liveCurrentSessionText");
  if (bannerText && currentUser) {
    const roleInfo = (typeof ROLES !== "undefined" && ROLES[currentUser.role]) ? ROLES[currentUser.role] : {};
    bannerText.innerHTML = `${roleInfo.icon || '👤'} <b>${currentUser.name}</b> <span class="badge" style="background:${roleInfo.bg || '#f1f5f9'}; color:${roleInfo.color || '#333'}; border:1px solid ${roleInfo.border || '#ccc'}; margin-left:0.4rem;">${roleInfo.name || currentUser.role}</span>`;
  }

  // 2. Render Users Table
  renderOwnerUserTable();

  // 3. Render Audit Logs Table
  renderOwnerAuditLogs();

  // 4. Role Permission Matrix
  const perms = typeof getRolePermissions === "function" ? getRolePermissions() : {};
  const a = perms.admin || {};
  const m = perms.manager || {};
  const c = perms.cashier || {};
  const k = perms.kitchen || {};

  const setCheck = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.checked = !!val;
  };

  setCheck("perm_admin_canManageMenus", a.canManageMenus);
  setCheck("perm_admin_canManageTables", a.canManageTables);
  setCheck("perm_admin_canViewReports", a.canViewReports);
  setCheck("perm_admin_canAccessSettings", a.canAccessSettings);

  setCheck("perm_manager_canViewAccounting", m.canViewAccounting);
  setCheck("perm_manager_canViewLedger", m.canViewLedger);
  setCheck("perm_manager_canViewLoans", m.canViewLoans);

  setCheck("perm_cashier_canViewDailyTotal", c.canViewDailyTotal);
  setCheck("perm_cashier_canCancelOrder", c.canCancelOrder);
  setCheck("perm_cashier_canGiveDiscount", c.canGiveDiscount);

  setCheck("perm_kitchen_canToggleStock", k.canToggleStock);

  // Clear master PIN inputs
  const clearVal = (id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  };
  clearVal("ownerCurrentPin");
  clearVal("ownerNewPin1");
  clearVal("ownerNewPin2");
  refreshLucideIcons();
}

function filterUserList(role) {
  currentUserFilter = role;
  document.querySelectorAll(".user-filter-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.filter === role);
  });
  renderOwnerUserTable();
}

function renderOwnerUserTable() {
  const tbody = document.getElementById("ownerUserTableBody");
  if (!tbody || typeof getAllUsers !== "function") return;

  const users = getAllUsers();
  const filtered = currentUserFilter === "all" ? users : users.filter(u => u.role === currentUserFilter);

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem; color:#94a3b8;">ไม่พบผู้ใช้งานในกลุ่มนี้</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(user => {
    const roleInfo = (typeof ROLES !== "undefined" && ROLES[user.role]) ? ROLES[user.role] : { name: user.role, icon: "👤", bg: "#f1f5f9", color: "#333", border: "#e2e8f0" };
    const isOwnerUser = user.role === "owner";
    const statusBadge = user.active
      ? `<span class="badge" style="background:#ecfdf5; color:#059669; border:1px solid #a7f3d0; font-weight:600;"><span class="dot-online"></span> ใช้งานปกติ</span>`
      : `<span class="badge" style="background:#fef2f2; color:#ef4444; border:1px solid #fca5a5; font-weight:600;">🔴 ระงับชั่วคราว</span>`;

    return `
      <tr>
        <td style="font-size:1.5rem; text-align:center;">${roleInfo.icon}</td>
        <td>
          <strong style="font-size:0.95rem; color:#0f172a; display:block;">${user.name}</strong>
          <small class="text-muted">ID: ${user.id}</small>
        </td>
        <td>
          <span class="badge" style="background:${roleInfo.bg}; color:${roleInfo.color}; border:1px solid ${roleInfo.border}; font-weight:700;">
            ${roleInfo.name}
          </span>
        </td>
        <td>
          <span style="letter-spacing:0.25em; font-weight:700; color:#64748b;">••••••</span>
        </td>
        <td>${statusBadge}</td>
        <td style="text-align:right;">
          <div style="display:inline-flex; gap:0.35rem;">
            <button type="button" class="btn btn-sm btn-outline" onclick="openQuickChangePinModal('${user.id}')" title="เปลี่ยนรหัส PIN">
              <i data-lucide="key"></i> <span>PIN</span>
            </button>
            <button type="button" class="btn btn-sm btn-outline" onclick="openAddUserModal('${user.id}')" title="แก้ไขข้อมูล">
              <i data-lucide="edit-2"></i>
            </button>
            ${!isOwnerUser ? `
              <button type="button" class="btn btn-sm btn-outline" onclick="handleToggleUserStatus('${user.id}')" title="${user.active ? 'ระงับการใช้' : 'เปิดใช้งาน'}">
                <i data-lucide="${user.active ? 'pause-circle' : 'play-circle'}"></i>
              </button>
              <button type="button" class="btn btn-sm btn-danger-subtle" onclick="handleDeleteUser('${user.id}')" title="ลบผู้ใช้งาน">
                <i data-lucide="trash-2"></i>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join("");

  refreshLucideIcons();
}

function renderOwnerAuditLogs() {
  const tbody = document.getElementById("ownerAuditLogTableBody");
  if (!tbody || typeof getAuditLogs !== "function") return;

  const logs = getAuditLogs();
  if (logs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:2rem; color:#94a3b8;">ยังไม่มีประวัติการเข้าใช้งาน</td></tr>`;
    return;
  }

  tbody.innerHTML = logs.map(log => {
    const roleInfo = (typeof ROLES !== "undefined" && ROLES[log.role]) ? ROLES[log.role] : { name: log.role, icon: "👤", color: "#64748b" };
    const statusPill = log.status === "SUCCESS"
      ? `<span class="badge badge-success-subtle">✅ สำเร็จ</span>`
      : `<span class="badge" style="background:#fef2f2; color:#ef4444; border:1px solid #fca5a5;">❌ รหัสไม่ผ่าน</span>`;

    return `
      <tr>
        <td style="font-size:0.85rem; color:#64748b; white-space:nowrap;">${log.timestamp}</td>
        <td>
          <strong style="color:#0f172a;">${log.userName}</strong>
        </td>
        <td>
          <span style="color:${roleInfo.color}; font-weight:600; font-size:0.85rem;">
            ${roleInfo.icon} ${roleInfo.name || log.role}
          </span>
        </td>
        <td style="font-size:0.88rem;">${log.action}</td>
        <td>${statusPill}</td>
      </tr>
    `;
  }).join("");
}

function handleClearAuditLogs() {
  if (!confirm("ต้องการล้างประวัติการเข้าสู่ระบบทั้งหมดใช่หรือไม่?")) return;
  if (typeof clearAuditLogs === "function") clearAuditLogs();
  renderOwnerAuditLogs();
  alert("ล้างประวัติการเข้าสู่ระบบเรียบร้อยแล้ว");
}

function openAddUserModal(userId = null) {
  const modal = document.getElementById("addUserModal");
  if (!modal) return;

  document.getElementById("editUserId").value = userId || "";
  const title = document.getElementById("userModalTitle");
  const pinInput = document.getElementById("userFormPin");

  if (userId) {
    const user = getUserById(userId);
    if (!user) return alert("ไม่พบข้อมูลผู้ใช้");
    title.innerHTML = `<span>✏️</span> <span>แก้ไขข้อมูล: ${user.name}</span>`;
    document.getElementById("userFormName").value = user.name;
    document.getElementById("userFormRole").value = user.role;
    pinInput.required = false;
    pinInput.placeholder = "ปล่อยว่างหากไม่ต้องการเปลี่ยนรหัส";
    document.getElementById("userFormPinHelp").innerText = "* ปล่อยว่างไว้หากใช้รหัสเดิม";
  } else {
    title.innerHTML = `<span>👤</span> <span>เพิ่มผู้ใช้งานใหม่</span>`;
    document.getElementById("userFormName").value = "";
    document.getElementById("userFormRole").value = "manager";
    pinInput.required = true;
    pinInput.value = "";
    pinInput.placeholder = "กำหนดรหัส PIN 4-6 หลัก";
    document.getElementById("userFormPinHelp").innerText = "* ผู้ใช้งานจะใช้รหัสนี้ในการเข้าสู่ระบบ";
  }

  openModal("addUserModal");
}

function handleSaveUserForm(e) {
  e.preventDefault();
  const userId = document.getElementById("editUserId").value;
  const name = document.getElementById("userFormName").value.trim();
  const role = document.getElementById("userFormRole").value;
  const pin = document.getElementById("userFormPin").value.trim();

  if (!name) return alert("กรุณากรอกชื่อผู้ปฏิบัติงาน");

  if (userId) {
    const res = updateUser(userId, { name, role, pin: pin || undefined });
    if (!res.success) return alert(res.message);
    alert(res.message);
  } else {
    if (!pin || pin.length < 4) return alert("กรุณากำหนดรหัส PIN อย่างน้อย 4 หลัก");
    const res = addUser({ name, role, pin });
    if (!res.success) return alert(res.message);
    alert(res.message);
  }

  closeModal("addUserModal");
  renderOwnerUserTable();
  renderOwnerAuditLogs();
}

function openQuickChangePinModal(userId) {
  const user = getUserById(userId);
  if (!user) return alert("ไม่พบข้อมูลผู้ใช้งาน");

  document.getElementById("quickPinUserId").value = user.id;
  const roleName = (typeof ROLES !== "undefined" && ROLES[user.role]) ? ROLES[user.role].name : user.role;
  document.getElementById("quickPinUserNameDisplay").innerText = `${user.name} (${roleName})`;
  document.getElementById("quickNewPinInput").value = "";
  openModal("quickChangePinModal");
}

function handleQuickSaveUserPin(e) {
  e.preventDefault();
  const userId = document.getElementById("quickPinUserId").value;
  const newPin = document.getElementById("quickNewPinInput").value.trim();

  if (!newPin || newPin.length < 4) {
    return alert("รหัส PIN ต้องมีความยาวอย่างน้อย 4 หลัก");
  }

  const res = updateDepartmentPin(userId, newPin);
  if (!res.success) return alert(res.message);

  alert(`🔒 อัปเดตรหัส PIN เรียบร้อยแล้ว!`);
  closeModal("quickChangePinModal");
  renderOwnerUserTable();
}

function handleToggleUserStatus(userId) {
  const user = getUserById(userId);
  if (!user) return;
  const actionName = user.active ? "ระงับการใช้งาน" : "เปิดใช้งาน";
  if (!confirm(`ต้องการ${actionName} "${user.name}" ใช่หรือไม่?`)) return;

  toggleUserStatus(userId);
  renderOwnerUserTable();
  renderOwnerAuditLogs();
}

function handleDeleteUser(userId) {
  const user = getUserById(userId);
  if (!user) return;
  if (!confirm(`⚠️ ยืนยันการลบ "${user.name}" ออกจากระบบถาวรใช่หรือไม่?`)) return;

  const res = deleteUser(userId);
  alert(res.message);
  renderOwnerUserTable();
  renderOwnerAuditLogs();
}

function handleSaveOwnerMasterPin() {
  if (typeof isOwner === "function" && !isOwner()) {
    return alert("⚠️ สิทธิ์นี้สำหรับเจ้าของร้าน (Owner) เท่านั้น");
  }
  
  const currentPin = document.getElementById("ownerCurrentPin").value.trim();
  const newPin1 = document.getElementById("ownerNewPin1").value.trim();
  const newPin2 = document.getElementById("ownerNewPin2").value.trim();

  if (!verifyDepartmentPin("owner", currentPin)) {
    alert("❌ รหัส PIN ปัจจุบันของเจ้าของร้านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง");
    return;
  }

  if (!newPin1 || newPin1.length < 4) {
    alert("⚠️ รหัส PIN ใหม่ต้องมีความยาวอย่างน้อย 4 หลัก (4-6 หลัก)");
    return;
  }

  if (newPin1 !== newPin2) {
    alert("⚠️ รหัส PIN ใหม่ทั้งสองช่องไม่ตรงกัน กรุณากรอกให้ตรงกัน");
    return;
  }

  updateDepartmentPin("owner", newPin1);
  document.getElementById("ownerCurrentPin").value = "";
  document.getElementById("ownerNewPin1").value = "";
  document.getElementById("ownerNewPin2").value = "";

  alert("👑 บันทึกรหัสผ่านใหม่ของเจ้าของร้าน (Master Owner PIN) สำเร็จเรียบร้อยแล้ว!");
}

function handleSaveRolePermissionsMatrix() {
  if (typeof isOwner === "function" && !isOwner()) {
    return alert("⚠️ เฉพาะเจ้าของร้าน (Owner) เท่านั้นที่สามารถจัดการสิทธิ์ได้");
  }

  const getCheck = (id) => {
    const el = document.getElementById(id);
    return el ? el.checked : false;
  };

  const perms = {
    admin: {
      canManageMenus: getCheck("perm_admin_canManageMenus"),
      canManageTables: getCheck("perm_admin_canManageTables"),
      canViewReports: getCheck("perm_admin_canViewReports"),
      canAccessSettings: getCheck("perm_admin_canAccessSettings")
    },
    manager: {
      canViewAccounting: getCheck("perm_manager_canViewAccounting"),
      canViewLedger: getCheck("perm_manager_canViewLedger"),
      canViewLoans: getCheck("perm_manager_canViewLoans")
    },
    cashier: {
      canViewDailyTotal: getCheck("perm_cashier_canViewDailyTotal"),
      canCancelOrder: getCheck("perm_cashier_canCancelOrder"),
      canGiveDiscount: getCheck("perm_cashier_canGiveDiscount")
    },
    kitchen: {
      canToggleStock: getCheck("perm_kitchen_canToggleStock")
    }
  };

  if (typeof saveRolePermissions === "function") {
    saveRolePermissions(perms);
  }
  applyRoleNavPermissions();

  logUserActivity(
    getCurrentUser()?.id || "usr_owner",
    getCurrentUser()?.name || "เจ้าของร้าน",
    "owner",
    "ปรับปรุงการกำหนดขอบเขตสิทธิ์ของตำแหน่งพนักงาน (Role Permissions)",
    "SUCCESS"
  );

  alert("✅ บันทึกการกำหนดขอบเขตสิทธิ์เรียบร้อยแล้ว!\nระบบมีผลใช้งานทันที");
}

function updatePromptPayPreview() {
  const promptpayId = document.getElementById("settingPromptPayId")?.value || window.posState.settings.promptpayId;
  const merchantName = document.getElementById("settingPromptPayName")?.value || window.posState.settings.promptpayName;
  const qrContainer = document.getElementById("settingsQRPreview");

  if (!qrContainer) return;
  qrContainer.innerHTML = "";

  document.getElementById("previewMerchantName").innerText = merchantName || "ครัวลุงหนุ่ย";
  document.getElementById("previewMerchantId").innerText = promptpayId || "089-123-4567";

  const payload = generatePromptPayPayload(promptpayId, 150);

  new QRCode(qrContainer, {
    text: payload,
    width: 170,
    height: 170,
    colorDark: "#002d62",
    colorLight: "#ffffff"
  });
}

function testWebhookNotification() {
  const webhookUrl = document.getElementById("settingLineWebhook").value;
  alert(`🔔 จำลองการส่ง Notification ผ่าน Webhook:\n\n[ข้อความแจ้งเตือนครัวลุงหนุ่ย]\n🛎️ ออเดอร์ใหม่: เมี่ยงปลาทับทิม + ส้มตำไทยไข่เค็ม\n(ส่งเข้า LINE พนักงาน: ${webhookUrl || 'LINE Bot'})`);
}

// Modal Helpers
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add("active");
  refreshLucideIcons();
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove("active");
}

// ============================================================================
// Supabase Cloud Config & Test Modal Logic
// ============================================================================
function openSupabaseConfigModal() {
  const modal = document.getElementById("supabaseConfigModal");
  if (!modal) return;
  const urlInput = document.getElementById("supaUrlInput");
  const keyInput = document.getElementById("supaKeyInput");
  
  if (urlInput) urlInput.value = localStorage.getItem("KRUA_SUPABASE_URL") || "https://myajcbynabcwfmlvqpwv.supabase.co";
  if (keyInput) keyInput.value = localStorage.getItem("KRUA_SUPABASE_ANON_KEY") || "";
  
  updateSupaModalStatus();
  openModal("supabaseConfigModal");
}

function updateSupaModalStatus() {
  const isOnline = window.SUPABASE_SYNC_STATUS && window.SUPABASE_SYNC_STATUS.isOnline;
  const statusEl = document.getElementById("supaStatusBadge");
  const dot = document.getElementById("cloudStatusDot");
  const txt = document.getElementById("cloudStatusText");

  if (statusEl) {
    if (isOnline) {
      statusEl.className = "badge badge-success";
      statusEl.style.color = "#10b981";
      statusEl.innerText = "🟢 คลาวด์ Supabase เชื่อมต่อสำเร็จ";
    } else {
      statusEl.className = "badge badge-warning";
      statusEl.style.color = "#d97706";
      statusEl.innerText = "🟡 โหมดออฟไลน์ / ยังไม่ได้ใส่ Key";
    }
  }

  if (dot && txt) {
    if (isOnline) {
      dot.style.background = "#10b981";
      txt.innerText = "Supabase: ออนไลน์";
    } else {
      dot.style.background = "#f59e0b";
      txt.innerText = "Supabase: ออฟไลน์";
    }
  }
}

async function testAndSaveSupabaseConfig(doSave = false) {
  const url = document.getElementById("supaUrlInput").value.trim();
  const key = document.getElementById("supaKeyInput").value.trim();
  const testResult = document.getElementById("supaTestResult");

  if (!url || !key) {
    testResult.innerHTML = '<span style="color:#ef4444;">⚠️ กรุณากรอก Supabase Anon Key ให้ครบถ้วน</span>';
    return;
  }

  testResult.innerHTML = '<span style="color:#3b82f6;">🔄 กำลังทดสอบเชื่อมต่อไปยังฐานข้อมูล Supabase...</span>';

  try {
    const res = await fetch(url + '/rest/v1/menus?select=id,name&limit=1', {
      headers: {
        'apikey': key,
        'Authorization': 'Bearer ' + key
      }
    });

    if (res.ok) {
      testResult.innerHTML = '<span style="color:#10b981; font-weight:700;">✅ เชื่อมต่อคลาวด์สำเร็จ! ฐานข้อมูลพร้อมทำงาน</span>';
      if (doSave) {
        localStorage.setItem("KRUA_SUPABASE_URL", url);
        localStorage.setItem("KRUA_SUPABASE_ANON_KEY", key);
        if (window.SupabaseService && typeof window.SupabaseService.saveCredentials === 'function') {
          window.SupabaseService.saveCredentials(url, key);
        }
        setTimeout(() => {
          closeModal("supabaseConfigModal");
          updateSupaModalStatus();
        }, 1200);
      }
    } else {
      const err = await res.json().catch(() => ({}));
      testResult.innerHTML = `<span style="color:#ef4444;">❌ การเชื่อมต่อล้มเหลว (${res.status}): ${err.message || 'Key ไม่ถูกต้อง'}</span>`;
    }
  } catch (e) {
    testResult.innerHTML = `<span style="color:#ef4444;">❌ ไม่สามารถติดต่อ Server ได้: ${e.message}</span>`;
  }
}

// Auto update status on load
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(updateSupaModalStatus, 800);
});


function autoResetMenusAndTables() {
  const menus = (typeof window.DEFAULT_MENUS !== 'undefined' && window.DEFAULT_MENUS.length > 0) ? window.DEFAULT_MENUS : FALLBACK_MENUS;
  const cats = (typeof window.DEFAULT_CATEGORIES !== 'undefined' && window.DEFAULT_CATEGORIES.length > 0) ? window.DEFAULT_CATEGORIES : FALLBACK_CATEGORIES;
  const tbls = (typeof window.DEFAULT_TABLES !== 'undefined' && window.DEFAULT_TABLES.length > 0) ? window.DEFAULT_TABLES : FALLBACK_TABLES;

  if (menus && menus.length > 0) {
    window.posState.menus = menus;
    window.posState.categories = cats;
    window.posState.tables = tbls;
    localStorage.setItem("pos_menus", JSON.stringify(menus));
    localStorage.setItem("pos_categories", JSON.stringify(cats));
    localStorage.setItem("pos_tables", JSON.stringify(tbls));
    localStorage.setItem("pos_menu_version", "krua_lung_nui_v6_modular_supabase");
    console.log("✅ Auto-Reset: Restored 43 menus & tables successfully");
  }
}

// Live sync across tabs & window focus
window.addEventListener("storage", (e) => {
  if (e.key === "pos_users" || e.key === "pos_current_user") {
    if (typeof renderOwnerUserTable === "function") renderOwnerUserTable();
    if (typeof renderOwnerAuditLogs === "function") renderOwnerAuditLogs();
    if (typeof updateTopNavUserBadge === "function") updateTopNavUserBadge();
  }
});

window.addEventListener("focus", () => {
  if (typeof renderOwnerUserTable === "function") renderOwnerUserTable();
  if (typeof renderOwnerAuditLogs === "function") renderOwnerAuditLogs();
  if (typeof updateTopNavUserBadge === "function") updateTopNavUserBadge();
});
