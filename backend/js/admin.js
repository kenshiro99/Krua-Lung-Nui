/**
 * ครัวลุงหนุ่ย (Krua Lung Nui) - Manager / Admin Logic
 */

let currentAdminTab = "menus";
let selectedCategory = "cat-all";

document.addEventListener("DOMContentLoaded", () => {
  if (!verifyPageAccess("admin")) return;

  updateTopNavUserBadge();
  startLiveClock();
  initSettingsForm();
  renderCategoryPills();
  renderMenuList();
  renderTableAdminList();
  renderKPIs();
  renderOrderHistoryTable();
  updatePromptPayPreview();
  updateStatsCounters();
  refreshLucideIcons();
});

function updateStatsCounters() {
  document.getElementById("statMenuCount").innerText = window.posState.menus.length;
  document.getElementById("statTableCount").innerText = window.posState.tables.length;
  document.getElementById("headerShopName").innerText = window.posState.settings.shopName;
}

function switchAdminTab(tab) {
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
  refreshLucideIcons();
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

// Table & QR Management (No zones)
function renderTableAdminList() {
  const container = document.getElementById("tableAdminGrid");
  if (!container) return;

  container.innerHTML = window.posState.tables.map(t => {
    const isOccupied = t.status === "occupied";
    return `
      <div class="table-admin-card">
        <div>
          <div class="table-card-top">
            <span class="table-number-title">โต๊ะ ${t.name}</span>
            <span class="badge ${isOccupied ? 'badge-warning' : 'badge-success'}">
              ${isOccupied ? 'กำลังทาน' : 'โต๊ะว่าง'}
            </span>
          </div>
          <div class="table-meta-info">
            <span><i data-lucide="users"></i> ${t.seats || 4} ที่นั่ง</span>
          </div>
          <div class="table-qr-mini-preview" id="qr-mini-${t.id}"></div>
        </div>
        <div class="table-card-foot-actions">
          <button class="btn btn-secondary" style="flex:1;" onclick="previewTableQRTent('${t.id}')">
            <i data-lucide="printer"></i> ดูป้ายตั้งโต๊ะ
          </button>
          <button class="btn btn-icon btn-light" onclick="deleteTable('${t.id}')">
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
        new QRCode(el, {
          text: `${window.location.origin}${window.location.pathname.replace('/backend/', '/frontend/')}?table=${t.name}`,
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
  const seats = parseInt(document.getElementById("tableSeats").value) || 4;

  const newId = "t-" + Date.now().toString().slice(-4);
  window.posState.tables.push({ id: newId, name, seats, status: "available" });

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
  const orderUrl = `${window.location.origin}${window.location.pathname.replace('/backend/', '/frontend/')}?table=${table.name}`;

  container.innerHTML = `
    <div class="printable-tent-card">
      <div class="tent-logo-wrap">
        <img src="logo/logo.jpg" alt="โลโก้ครัวลุงหนุ่ย" class="tent-logo-img" onerror="this.src='logo/logo.png'">
      </div>
      <div class="tent-shop-title">${window.posState.settings.shopName}</div>
      <div class="tent-table-no">โต๊ะ ${table.name}</div>
      <div class="tent-qr-box" id="modalTentQRBox"></div>
      <div class="tent-scan-instruction">
        📱 สแกน QR Code เพื่อสั่งอาหารและเรียกพนักงาน
      </div>
      <div style="font-size: 0.75rem; color: #64748b; margin-top: 0.75rem;">
        (อร่อยเหมือนกินที่บ้าน • รวดเร็วทันใจ • สแกนสั่งได้ตลอดเวลา)
      </div>
    </div>
  `;

  setTimeout(() => {
    new QRCode(document.getElementById("modalTentQRBox"), {
      text: orderUrl,
      width: 170,
      height: 170,
      colorDark: "#0f172a",
      colorLight: "#ffffff"
    });
  }, 50);

  openModal("qrPrintModal");
}

function previewTakeawayQRStand() {
  const container = document.getElementById("qrPrintContent");
  const takeawayUrl = `${window.location.origin}${window.location.pathname.replace('/backend/', '/frontend/')}?type=takeaway`;

  container.innerHTML = `
    <div class="printable-tent-card" style="border: 4px solid #ea580c; background: #fffbf7;">
      <div class="tent-logo-wrap" style="border-color: #fed7aa;">
        <img src="logo/logo.jpg" alt="โลโก้ครัวลุงหนุ่ย" class="tent-logo-img" onerror="this.src='logo/logo.png'">
      </div>
      <div class="tent-shop-title" style="color: #9a3412;">${window.posState.settings.shopName}</div>
      <div class="tent-table-no" style="color: #ea580c; font-size: 1.5rem; letter-spacing: normal;">🛍️ จุดสั่งอาหารกลับบ้าน</div>
      <div class="tent-qr-box" id="modalTakeawayQRBox" style="border-color: #fed7aa;"></div>
      <div class="tent-scan-instruction" style="color: #c2410c; font-size: 0.95rem; font-weight: 700;">
        📱 สแกนสั่งกลับบ้าน • รับบัตรคิวในมือถือทันที
      </div>
      <div style="font-size: 0.75rem; color: #64748b; margin-top: 0.75rem;">
        (ไม่ต้องรอคิวหน้าร้าน • จ่ายสะดวกผ่านพร้อมเพย์ • รอเรียกรับอาหาร)
      </div>
    </div>
  `;

  setTimeout(() => {
    new QRCode(document.getElementById("modalTakeawayQRBox"), {
      text: takeawayUrl,
      width: 180,
      height: 180,
      colorDark: "#9a3412",
      colorLight: "#ffffff"
    });
  }, 50);

  openModal("qrPrintModal");
}

function printAllQRCards() {
  const container = document.getElementById("qrPrintContent");
  container.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
      ${window.posState.tables.map(t => `
        <div class="printable-tent-card" style="page-break-inside: avoid; margin-bottom: 1.5rem;">
          <div class="tent-logo-wrap">
            <img src="logo/logo.jpg" alt="โลโก้ครัวลุงหนุ่ย" class="tent-logo-img" onerror="this.src='logo/logo.png'">
          </div>
          <div class="tent-shop-title">${window.posState.settings.shopName}</div>
          <div class="tent-table-no">โต๊ะ ${t.name}</div>
          <div class="tent-qr-box" id="all-print-qr-${t.id}"></div>
          <div class="tent-scan-instruction">📱 สแกนสั่งอาหารประจำโต๊ะ</div>
        </div>
      `).join("")}
    </div>
  `;

  setTimeout(() => {
    window.posState.tables.forEach(t => {
      const el = document.getElementById(`all-print-qr-${t.id}`);
      if (el) {
        new QRCode(el, {
          text: `${window.location.origin}${window.location.pathname.replace('/backend/', '/frontend/')}?table=${t.name}`,
          width: 140,
          height: 140,
          colorDark: "#0f172a",
          colorLight: "#ffffff"
        });
      }
    });
    openModal("qrPrintModal");
  }, 50);
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
