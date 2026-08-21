/**
 * ครัวลุงหนุ่ย (Krua Lung Nui) - Customer Mobile Web App Logic
 * Dual-Mode Edition: ทานที่ร้าน (Dine-in) & สั่งกลับบ้าน (Takeaway)
 */

// ============================================================================
// 1. Initial State & Defaults
// ============================================================================
const DEFAULT_SHOP_SETTINGS = {
  shopName: "ครัวลุงหนุ่ย (Krua Lung Nui)",
  phone: "089-123-4567",
  address: "ร้านครัวลุงหนุ่ย อร่อยเหมือนกินที่บ้าน",
  receiptFooter: "อร่อยเหมือนกินที่บ้าน • ขอบคุณที่อุดหนุนครัวลุงหนุ่ยครับ 🙏",
  promptpayType: "mobile",
  promptpayId: "0891234567",
  promptpayName: "ครัวลุงหนุ่ย (Krua Lung Nui)",
  serviceCharge: 0,
  vat: 0
};

const DEFAULT_CATEGORIES = [
  { id: "cat-all", name: "ทั้งหมด" },
  { id: "cat-1", name: "ตำแซ่บ & ยำ" },
  { id: "cat-2", name: "ไก่ย่าง & ย่างเตาถ่าน" },
  { id: "cat-3", name: "ต้มแซ่บ & แกงไทย" },
  { id: "cat-4", name: "อาหารจานเดียว" },
  { id: "cat-5", name: "เครื่องดื่ม & ของหวาน" }
];

const DEFAULT_MENUS = [
  {
    id: "m-101",
    categoryId: "cat-1",
    name: "ส้มตำไทยไข่เค็มทรงเครื่อง",
    description: "มะละกอกรอบ ตำสดครกต่อครก กุ้งแห้งตัวโต ถั่วลิสงคั่วหอม ไข่เค็มไชยาเนื้อเนียนมันนัว รสชาติกลมกล่อม",
    price: 75,
    imageUrl: "images/somtum_thai_egg.jpg",
    options: "พริก 1 เม็ด (ไม่เผ็ด), พริก 3 เม็ด (เผ็ดน้อย), พริก 5 เม็ด (เผ็ดปกติ), พริก 10 เม็ด (เผ็ดมาก)",
    isAvailable: true
  },
  {
    id: "m-102",
    categoryId: "cat-1",
    name: "ตำปูปลาร้าแซ่บนัว (สูตรลุงหนุ่ย)",
    description: "น้ำปลาร้าต้มสุกสูตรเด็ดลุงหนุ่ย หอมนัวลึกถึงเครื่อง ปูดองสะอาด แซ่บถึงใจ รสจัดจ้าน",
    price: 65,
    imageUrl: "images/somtum_pu_plara.jpg",
    options: "เผ็ดน้อย, เผ็ดปกติ, เผ็ดพ่นไฟ, เพิ่มกุ้งสด (+40), เพิ่มหมูยอ (+25)",
    isAvailable: true
  },
  {
    id: "m-103",
    categoryId: "cat-2",
    name: "เมี่ยงปลาทับทิม สูตรเด็ดอร่อยแซ่บ",
    description: "ปลาทับทิมสดตัวโต ทอดกรอบนอกเนื้อนุ่มฟู เสิร์ฟพร้อมเส้นหมี่ลวก ผักสดปลอดสาร และน้ำจิ้มเมี่ยง 2 สูตร (ซีฟู้ด & ถั่วหวาน)",
    price: 260,
    imageUrl: "images/miang_pla_tabtim.jpg",
    options: "น้ำจิ้มซีฟู้ดแซ่บ, น้ำจิ้มถั่วตัดหวาน, รับทั้ง 2 น้ำจิ้ม, เพิ่มเส้นหมี่ (+15), เพิ่มผักสด (+20)",
    isAvailable: true
  },
  {
    id: "m-104",
    categoryId: "cat-2",
    name: "ไก่ย่างหอมกลิ่นเตาถ่าน (สูตรลุงหนุ่ย)",
    description: "หมักด้วยสมุนไพรไทยข้ามคืน ย่างบนเตาถ่านไฟอ่อนจนหนังกรอบเนื้อนุ่มฉ่ำ เสิร์ฟพร้อมน้ำจิ้มแจ่วมะขามเปียก",
    price: 140,
    imageUrl: "images/gai_yang.jpg",
    options: "พร้อมน้ำจิ้มแจ่ว, พร้อมน้ำจิ้มไก่หวาน, รับข้าวเหนียวเพิ่ม (+15)",
    isAvailable: true
  },
  {
    id: "m-105",
    categoryId: "cat-2",
    name: "คอหมูย่างเตาถ่านน้ำจิ้มแจ่ว",
    description: "สันคอหมูแทรกมันนุ่ม หมักสูตรพิเศษ ย่างเตาถ่านหอมละมุน เสิร์ฟคู่น้ำจิ้มแจ่วข้าวคั่วพริกป่นคั่วเอง",
    price: 120,
    imageUrl: "images/kor_moo_yang.jpg",
    options: "มันน้อย, เนื้อแทรกมัน, ข้าวคั่วเยอะ, เพิ่มน้ำจิ้มแจ่ว",
    isAvailable: true
  },
  {
    id: "m-106",
    categoryId: "cat-3",
    name: "ต้มแซ่บกระดูกหมูอ่อน",
    description: "ซี่โครงอ่อนเคี่ยวนานจนเปื่อยนุ่ม น้ำซุปต้มแซ่บรสจัดจ้าน ซดร้อนๆ คล่องคอ หอมข้าวคั่วและพริกขี้หนูสวนบุบ",
    price: 150,
    imageUrl: "images/tom_saap.jpg",
    options: "เผ็ดน้อย, เผ็ดปกติ, เผ็ดแซ่บจี๊ด, เปรี้ยวนำ",
    isAvailable: true
  },
  {
    id: "m-107",
    categoryId: "cat-4",
    name: "ข้าวกะเพราเนื้อโคขุนคั่วพริกแห้ง + ไข่ดาว",
    description: "อาหารไทยรสจัดจ้าน เนื้อโคขุนบดหยาบ คั่วแห้งพริกแห้งกระเทียมไทย ใบกะเพราป่ากลิ่นหอมแรง",
    price: 95,
    imageUrl: "images/pad_krapow_beef.jpg",
    options: "ไข่ดาวกรอบไข่แดงเยิ้ม, ไข่ดาวสุก, ไข่เจียว (+10), พิเศษเนื้อโคขุน (+30)",
    isAvailable: true
  },
  {
    id: "m-108",
    categoryId: "cat-5",
    name: "ชาไทยโบราณเย็น (สูตรเข้มข้น)",
    description: "ใบชาต้มสดใหม่ หอมมัน กลมกล่อม หวานเย็นชื่นใจ รสชาติชาไทยแท้",
    price: 45,
    imageUrl: "images/thai_tea.jpg",
    options: "หวานน้อย (50%), หวานปกติ (100%), ไม่หวาน, เพิ่มเฉาก๊วย (+10)",
    isAvailable: true
  },
  {
    id: "m-109",
    categoryId: "cat-5",
    name: "ลอดช่องวัดเจษฯ น้ำกะทิน้ำตาลมะพร้าว",
    description: "เส้นลอดช่องเหนียวนุ่ม หอมใบเตยสด ราดกะทิน้ำตาลมะพร้าวแท้อบควันเทียน ใส่น้ำแข็งเกล็ดหอมหวานชื่นใจ",
    price: 45,
    imageUrl: "images/lod_chong.jpg",
    options: "หวานปกติ, หวานน้อย, เพิ่มข้าวต้มน้ำวุ้น (+10)",
    isAvailable: true
  }
];

const DEFAULT_TABLES = [
  { id: "t-1", name: "1", seats: 4 },
  { id: "t-2", name: "2", seats: 4 },
  { id: "t-3", name: "3", seats: 4 },
  { id: "t-4", name: "4", seats: 6 },
  { id: "t-5", name: "5", seats: 6 },
  { id: "t-6", name: "6", seats: 8 }
];

// App State
let state = {
  settings: JSON.parse(localStorage.getItem("pos_settings")) || DEFAULT_SHOP_SETTINGS,
  categories: JSON.parse(localStorage.getItem("pos_categories")) || DEFAULT_CATEGORIES,
  menus: JSON.parse(localStorage.getItem("pos_menus")) || DEFAULT_MENUS,
  tables: JSON.parse(localStorage.getItem("pos_tables")) || DEFAULT_TABLES,
  orderMode: "dinein", // "dinein" | "takeaway"
  currentTable: "1",
  currentQueue: "Q-" + Math.floor(10 + Math.random() * 89),
  selectedCategory: "cat-all",
  cart: [],
  activeCustomItem: null,
  customQty: 1
};

// ============================================================================
// 2. Initialization & URL Parameter Parsing
// ============================================================================
// ============================================================================
// 2. Initialization & URL Parameter Parsing
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const typeParam = urlParams.get("type");
  const tableParam = urlParams.get("table");

  if (typeParam === "takeaway") {
    setOrderMode("takeaway");
  } else if (tableParam) {
    state.currentTable = tableParam;
    setOrderMode("dinein");
  } else {
    // Default to Dine-in Table 1, and prompt selector if not sure
    state.currentTable = "1";
    setOrderMode("dinein");
  }

  renderCategoryTabs();
  renderMenuFeed();
  updateCartUI();
  checkActiveOrders();
  refreshIcons();
});

function refreshIcons() {
  if (window.lucide) {
    lucide.createIcons();
  }
}

// ============================================================================
// 3. Mode Display & Context Banner Controller
// ============================================================================
function setOrderMode(mode) {
  state.orderMode = mode;

  const banner = document.getElementById("orderContextBanner");
  const iconWrap = document.getElementById("contextIconWrap");
  const titleWrap = document.getElementById("contextMainTitle");
  const descWrap = document.getElementById("contextSubDesc");
  const actionsWrap = document.getElementById("contextQuickActions");
  const takeawayForm = document.getElementById("takeawayExtraForm");
  const floatBar = document.getElementById("floatingCartBar");

  if (mode === "dinein") {
    if (banner) {
      banner.className = "order-context-banner dinein";
    }
    if (iconWrap) iconWrap.innerHTML = "🍽️";
    if (titleWrap) titleWrap.innerHTML = `กำลังสั่งอาหารสำหรับ <b>โต๊ะ ${state.currentTable}</b>`;
    if (descWrap) descWrap.innerText = "อาหารจะนำไปเสิร์ฟที่โต๊ะของคุณโดยตรง";
    if (actionsWrap) {
      actionsWrap.innerHTML = `
        <button class="context-action-btn" onclick="callWaiter()">
          <i data-lucide="bell"></i> <span>เรียกพนักงาน</span>
        </button>
        <button class="context-action-btn bill-action" onclick="requestBill()">
          <i data-lucide="receipt"></i> <span>ขอเช็คบิล</span>
        </button>
      `;
    }
    if (takeawayForm) takeawayForm.style.display = "none";
    if (floatBar) floatBar.classList.remove("takeaway-theme");
  } else {
    if (banner) {
      banner.className = "order-context-banner takeaway";
    }
    if (iconWrap) iconWrap.innerHTML = "🛍️";
    if (titleWrap) titleWrap.innerHTML = `กำลังสั่งอาหารกลับบ้าน <b>คิว ${state.currentQueue}</b>`;
    if (descWrap) descWrap.innerText = "อาหารบรรจุใส่กล่อง/ถุง • รอเรียกรับอาหาร";
    if (actionsWrap) {
      actionsWrap.innerHTML = `
        <button class="context-action-btn tracker-action" onclick="openOrderTrackerModal()">
          <i data-lucide="clock"></i> <span>ดูคิวของฉัน</span>
        </button>
      `;
    }
    if (takeawayForm) takeawayForm.style.display = "block";
    if (floatBar) floatBar.classList.add("takeaway-theme");
  }

  updateHeaderLabels();
  checkActiveOrders();
  refreshIcons();
}

function updateHeaderLabels() {
  const cartHeader = document.getElementById("cartModalHeaderTitle");
  if (cartHeader) {
    cartHeader.innerText = state.orderMode === "dinein" 
      ? `ตะกร้าอาหาร (ทานที่ร้าน โต๊ะ ${state.currentTable})` 
      : `ตะกร้าอาหาร (สั่งกลับบ้าน ${state.currentQueue})`;
  }

  const trackerHeader = document.getElementById("trackerModalHeaderTitle");
  if (trackerHeader) {
    trackerHeader.innerText = state.orderMode === "dinein"
      ? `สถานะอาหาร (โต๊ะ ${state.currentTable})`
      : `สถานะอาหาร (สั่งกลับบ้าน ${state.currentQueue})`;
  }
}

// ============================================================================
// 4. Category & Menu Rendering
// ============================================================================
function renderCategoryTabs() {
  const container = document.getElementById("categoryTabsNav");
  container.innerHTML = state.categories.map(cat => `
    <button class="cat-tab-btn ${cat.id === state.selectedCategory ? 'active' : ''}" onclick="selectCategory('${cat.id}')">
      ${cat.name}
    </button>
  `).join("");
}

function selectCategory(catId) {
  state.selectedCategory = catId;
  renderCategoryTabs();
  renderMenuFeed();
}

function handleSearch() {
  renderMenuFeed();
}

function renderMenuFeed() {
  const container = document.getElementById("menuFeed");
  const searchQuery = (document.getElementById("searchInput")?.value || "").toLowerCase().trim();

  let filtered = state.menus.filter(m => {
    const matchCat = state.selectedCategory === "cat-all" || m.categoryId === state.selectedCategory;
    const matchSearch = m.name.toLowerCase().includes(searchQuery) || (m.description && m.description.toLowerCase().includes(searchQuery));
    return matchCat && matchSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding: 3rem 1rem; color: var(--text-muted);">
        <i data-lucide="utensils" style="width: 48px; height: 48px; margin: 0 auto 0.75rem; opacity: 0.4;"></i>
        <p>ไม่พบรายการอาหารที่ค้นหา</p>
      </div>
    `;
    refreshIcons();
    return;
  }

  container.innerHTML = filtered.map(item => `
    <article class="food-card ${!item.isAvailable ? 'out-of-stock' : ''}" onclick="openCustomizeModal('${item.id}')">
      <div class="food-card-img-wrap">
        <img src="${item.imageUrl || 'images/somtum_thai_egg.jpg'}" alt="${item.name}" class="food-card-img" onerror="this.src='logo/logo.png'">
        ${!item.isAvailable ? '<div class="food-stock-badge">หมดชั่วคราว</div>' : ''}
      </div>
      <div class="food-card-info">
        <div>
          <h3 class="food-title">${item.name}</h3>
          <p class="food-desc">${item.description || ''}</p>
        </div>
        <div class="food-price-row">
          <span class="food-price">฿${item.price.toFixed(2)}</span>
          ${item.isAvailable ? `
            <button class="btn-add-circle" onclick="event.stopPropagation(); openCustomizeModal('${item.id}')" title="สั่งเมนูนี้">
              <i data-lucide="plus"></i>
            </button>
          ` : ''}
        </div>
      </div>
    </article>
  `).join("");
  refreshIcons();
}

// ============================================================================
// 5. Customization Modal
// ============================================================================
function openCustomizeModal(itemId) {
  const item = state.menus.find(m => m.id === itemId);
  if (!item || !item.isAvailable) return;

  state.activeCustomItem = item;
  state.customQty = 1;

  const container = document.getElementById("customizeModalBody");
  const optionsList = item.options ? item.options.split(",").map(o => o.trim()).filter(Boolean) : [];

  let optionsHtml = "";
  if (optionsList.length > 0) {
    optionsHtml = `
      <div class="custom-section-title">ระดับความเผ็ด / ตัวเลือกพิเศษ</div>
      <div class="option-pill-group">
        ${optionsList.map((opt, idx) => `
          <label class="option-pill-label ${idx === 0 ? 'selected' : ''}">
            <input type="radio" name="customOption" value="${opt}" ${idx === 0 ? 'checked' : ''} onchange="handleOptionSelect(this)">
            <span>${opt}</span>
          </label>
        `).join("")}
      </div>
    `;
  }

  container.innerHTML = `
    <div class="custom-item-hero">
      <img src="${item.imageUrl || 'images/somtum_thai_egg.jpg'}" alt="${item.name}" class="custom-hero-img" onerror="this.src='logo/logo.png'">
      <div>
        <h3 style="font-size:1.05rem; font-weight:700;">${item.name}</h3>
        <p style="font-size:0.8rem; color:#64748b; margin-top:0.25rem;">${item.description || ''}</p>
        <div style="font-size:1.1rem; font-weight:800; color:var(--primary); margin-top:0.35rem;">฿${item.price.toFixed(2)}</div>
      </div>
    </div>

    ${optionsHtml}

    <div class="custom-section-title">หมายเหตุเพิ่มเติมถึงกุ๊กครัวลุงหนุ่ย</div>
    <textarea id="customItemNote" class="special-note-input" rows="2" placeholder="เช่น ไม่ใส่ผักชี, ไม่ใส่ชูรส, ขอข้าวเหนียวร้อนๆ..."></textarea>
  `;

  updateCustomModalFooter();
  openModal("customizeModal");
}

function handleOptionSelect(inputEl) {
  document.querySelectorAll(".option-pill-label").forEach(l => l.classList.remove("selected"));
  inputEl.closest(".option-pill-label").classList.add("selected");
}

function adjustCustomModalQty(delta) {
  state.customQty = Math.max(1, state.customQty + delta);
  updateCustomModalFooter();
}

function updateCustomModalFooter() {
  document.getElementById("customModalQty").innerText = state.customQty;
  const totalPrice = (state.activeCustomItem.price * state.customQty);
  document.getElementById("customModalTotalPrice").innerText = `฿${totalPrice.toFixed(2)}`;
}

function confirmAddToCartFromModal() {
  if (!state.activeCustomItem) return;

  const selectedOpt = document.querySelector('input[name="customOption"]:checked')?.value || "";
  const note = document.getElementById("customItemNote")?.value.trim() || "";

  const existing = state.cart.find(c => c.id === state.activeCustomItem.id && c.options === selectedOpt && c.note === note);

  if (existing) {
    existing.qty += state.customQty;
  } else {
    state.cart.push({
      id: state.activeCustomItem.id,
      name: state.activeCustomItem.name,
      price: state.activeCustomItem.price,
      qty: state.customQty,
      options: selectedOpt,
      note: note,
      imageUrl: state.activeCustomItem.imageUrl
    });
  }

  closeModal("customizeModal");
  updateCartUI();
  navigator.vibrate?.(40);
}

// ============================================================================
// 6. Cart Management & Floating Bar
// ============================================================================
function updateCartUI() {
  const totalCount = state.cart.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const floatBar = document.getElementById("floatingCartBar");
  const floatCount = document.getElementById("floatCartItemCount");
  const floatCountText = document.getElementById("floatCartItemCountText");
  const floatPrice = document.getElementById("floatCartTotalPrice");

  if (totalCount > 0) {
    floatBar.style.display = "flex";
    floatCount.innerText = totalCount;
    floatCountText.innerText = totalCount;
    floatPrice.innerText = `฿${totalPrice.toFixed(2)}`;
  } else {
    floatBar.style.display = "none";
  }
}

function openCartModal() {
  const container = document.getElementById("cartModalItemsContainer");
  const subtotalEl = document.getElementById("cartModalSubtotal");
  const grandTotalEl = document.getElementById("cartModalGrandTotal");
  const takeawayForm = document.getElementById("takeawayExtraForm");
  const btnSubmit = document.getElementById("btnSubmitOrder");

  updateHeaderLabels();

  if (state.orderMode === "takeaway") {
    if (takeawayForm) takeawayForm.style.display = "block";
    btnSubmit.classList.add("takeaway-btn");
    btnSubmit.innerHTML = `<i data-lucide="send"></i> ยืนยันสั่งกลับบ้าน (รับคิว ${state.currentQueue})`;
  } else {
    if (takeawayForm) takeawayForm.style.display = "none";
    btnSubmit.classList.remove("takeaway-btn");
    btnSubmit.innerHTML = `<i data-lucide="send"></i> ยืนยันสั่งอาหารเข้าครัวลุงหนุ่ย`;
  }

  if (state.cart.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding: 3rem 1rem; color: var(--text-muted);">
        <i data-lucide="shopping-bag" style="width: 48px; height: 48px; margin: 0 auto 0.75rem; opacity: 0.4;"></i>
        <p>ยังไม่มีรายการอาหารในตะกร้า</p>
      </div>
    `;
    subtotalEl.innerText = "฿0.00";
    grandTotalEl.innerText = "฿0.00";
    document.getElementById("cartSheetSummary").style.display = "none";
  } else {
    document.getElementById("cartSheetSummary").style.display = "block";
    const total = state.cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
    subtotalEl.innerText = `฿${total.toFixed(2)}`;
    grandTotalEl.innerText = `฿${total.toFixed(2)}`;

    container.innerHTML = state.cart.map((item, idx) => `
      <div class="cart-item-row">
        <div style="flex:1; padding-right:0.75rem;">
          <div class="cart-item-title">${item.name}</div>
          ${item.options ? `<div class="cart-item-sub">⚡ ${item.options}</div>` : ''}
          ${item.note ? `<div class="cart-item-note">💬 ${item.note}</div>` : ''}
          <div style="font-weight:700; color:var(--primary); font-size:0.9rem; margin-top:0.25rem;">฿${(item.price * item.qty).toFixed(2)}</div>
        </div>
        <div class="qty-stepper">
          <button type="button" class="stepper-btn" onclick="adjustCartItemQty(${idx}, -1)"><i data-lucide="minus"></i></button>
          <span class="stepper-value">${item.qty}</span>
          <button type="button" class="stepper-btn" onclick="adjustCartItemQty(${idx}, 1)"><i data-lucide="plus"></i></button>
        </div>
      </div>
    `).join("");
  }

  refreshIcons();
  openModal("cartModal");
}

function adjustCartItemQty(index, delta) {
  state.cart[index].qty += delta;
  if (state.cart[index].qty <= 0) {
    state.cart.splice(index, 1);
  }
  openCartModal();
  updateCartUI();
}

function clearCart() {
  if (state.cart.length === 0) return;
  if (confirm("ต้องการล้างรายการอาหารในตะกร้าทั้งหมดใช่หรือไม่?")) {
    state.cart = [];
    openCartModal();
    updateCartUI();
  }
}

// ============================================================================
// 7. Submit Order (Dine-in vs. Takeaway)
// ============================================================================
function submitOrder() {
  if (state.cart.length === 0) return;

  const total = state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const isTakeaway = state.orderMode === "takeaway";

  let custName = "";
  let custPhone = "";
  let packaging = [];

  if (isTakeaway) {
    custName = document.getElementById("custNameInput")?.value.trim() || "";
    custPhone = document.getElementById("custPhoneInput")?.value.trim() || "";
    if (document.getElementById("chkPlasticCutlery")?.checked) packaging.push("รับช้อนส้อมพลาสติก");
    if (document.getElementById("chkSeparateSauce")?.checked) packaging.push("แยกน้ำจิ้ม/น้ำส้มตำ");
  }

  const newOrder = {
    id: "ORD-" + new Date().toISOString().slice(0, 10).replace(/-/g, '') + "-" + Math.floor(100 + Math.random() * 900),
    orderType: state.orderMode, // "dinein" | "takeaway"
    tableId: isTakeaway ? "takeaway" : ("t-" + state.currentTable),
    tableName: isTakeaway ? state.currentQueue : state.currentTable,
    customerName: custName,
    customerPhone: custPhone,
    packagingNotes: packaging.join(", "),
    createdAt: new Date().toISOString(),
    status: "pending",
    paymentStatus: "unpaid",
    paymentMethod: "promptpay",
    items: JSON.parse(JSON.stringify(state.cart)),
    subtotal: total,
    total: total
  };

  // 1. Save to LocalStorage
  let existingOrders = JSON.parse(localStorage.getItem("pos_orders")) || [];
  existingOrders.unshift(newOrder);
  localStorage.setItem("pos_orders", JSON.stringify(existingOrders));

  // 2. Mark table as occupied only if Dine-in
  if (!isTakeaway) {
    let existingTables = JSON.parse(localStorage.getItem("pos_tables")) || DEFAULT_TABLES;
    const targetTable = existingTables.find(t => t.name === state.currentTable);
    if (targetTable) {
      targetTable.status = "occupied";
      localStorage.setItem("pos_tables", JSON.stringify(existingTables));
    }
  }

  // 3. Try sending to Backend REST API
  fetch("http://localhost:5000/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newOrder)
  }).catch(() => console.log("Local-only mode"));

  // 4. Play success audio
  const audio = document.getElementById("orderSuccessSound");
  if (audio) audio.play().catch(() => {});

  // 5. Clear Cart & Close Modal
  state.cart = [];
  closeModal("cartModal");
  updateCartUI();
  checkActiveOrders();

  if (isTakeaway) {
    alert(`🎉 สั่งอาหารกลับบ้านสำเร็จ!\n\nหมายเลขคิวของคุณคือ: [ ${state.currentQueue} ]\nกรุณารอฟังเสียงเรียกคิวเพื่อรับอาหารครับ 🛍️👨‍🍳`);
    // Prompt to pay via PromptPay immediately for takeaway
    requestBill();
  } else {
    alert(`🎉 สั่งอาหารสำเร็จ!\n\nออเดอร์ของโต๊ะ ${state.currentTable} ถูกส่งไปยังกุ๊กครัวลุงหนุ่ยเรียบร้อยแล้วครับ 👨‍🍳`);
  }
}

// ============================================================================
// 8. Live Order Tracker & Active Status
// ============================================================================
function checkActiveOrders() {
  const allOrders = JSON.parse(localStorage.getItem("pos_orders")) || [];
  const targetId = state.orderMode === "dinein" ? state.currentTable : state.currentQueue;
  const activeOrders = allOrders.filter(o => o.tableName === targetId && o.paymentStatus === "unpaid");

  const dot = document.getElementById("activeOrdersDot");
  if (dot) {
    dot.style.display = activeOrders.length > 0 ? "block" : "none";
  }
}

function openOrderTrackerModal() {
  const allOrders = JSON.parse(localStorage.getItem("pos_orders")) || [];
  const targetId = state.orderMode === "dinein" ? state.currentTable : state.currentQueue;
  const activeOrders = allOrders.filter(o => o.tableName === targetId && o.paymentStatus === "unpaid");
  
  const container = document.getElementById("trackerModalBody");
  const totalDisplay = document.getElementById("trackerGrandTotalDisplay");

  updateHeaderLabels();

  if (activeOrders.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding: 3rem 1rem; color: var(--text-muted);">
        <i data-lucide="clipboard-list" style="width: 48px; height: 48px; margin: 0 auto 0.75rem; opacity: 0.4;"></i>
        <p>ยังไม่มีรายการอาหารที่สั่งในขณะนี้</p>
      </div>
    `;
    totalDisplay.innerText = "฿0.00";
  } else {
    const grandTotal = activeOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    totalDisplay.innerText = `฿${grandTotal.toFixed(2)}`;

    const statusMap = {
      pending: '<span class="tracker-status-badge status-pending">🕒 รอดำเนินการ</span>',
      cooking: '<span class="tracker-status-badge status-cooking">🔥 กำลังปรุงอาหาร</span>',
      served: '<span class="tracker-status-badge status-served">🍽️ พร้อมรับ/เสิร์ฟแล้ว</span>',
      completed: '<span class="tracker-status-badge status-completed">✅ ชำระเงินแล้ว</span>'
    };

    container.innerHTML = activeOrders.map((ord, idx) => `
      <div class="tracker-ticket ${ord.orderType === 'takeaway' ? 'takeaway-ticket' : ''}">
        <div class="tracker-ticket-header">
          <div>
            <b>${ord.orderType === 'takeaway' ? '🛍️ สั่งกลับบ้าน' : '🍽️ ทานที่ร้าน'} รอบที่ ${idx + 1}</b>
            <div style="font-size:0.75rem; color:#64748b;">⏱️ ${new Date(ord.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</div>
            ${ord.customerName ? `<div style="font-size:0.75rem; color:#ea580c;">ผู้สั่ง: ${ord.customerName} (${ord.tableName})</div>` : ''}
          </div>
          <div>${statusMap[ord.status] || ord.status}</div>
        </div>
        <div>
          ${ord.items.map(i => `
            <div style="display:flex; justify-content:space-between; font-size:0.85rem; padding:0.25rem 0;">
              <div>
                <b>${i.name}</b> x ${i.qty}
                ${i.options ? `<div style="font-size:0.75rem; color:var(--primary);">${i.options}</div>` : ''}
              </div>
              <div>฿${(i.price * i.qty).toFixed(2)}</div>
            </div>
          `).join("")}
        </div>
        ${ord.packagingNotes ? `<div style="font-size:0.75rem; color:#64748b; margin-top:0.35rem;">📦 ${ord.packagingNotes}</div>` : ''}
        <div style="text-align:right; font-weight:700; font-size:0.9rem; color:var(--primary); margin-top:0.4rem; border-top:1px dashed #e2e8f0; padding-top:0.35rem;">
          รวมรอบนี้: ฿${ord.total.toFixed(2)}
        </div>
      </div>
    `).join("");
  }

  refreshIcons();
  openModal("trackerModal");
}

// ============================================================================
// 9. Service Calls & PromptPay Bill Generation
// ============================================================================
function callWaiter() {
  alert(`🔔 เรียกพนักงานเรียบร้อย!\n\nพนักงานกำลังเดินทางมาให้บริการที่ โต๊ะ ${state.currentTable} ครับ`);
}

function requestBill() {
  const allOrders = JSON.parse(localStorage.getItem("pos_orders")) || [];
  const targetId = state.orderMode === "dinein" ? state.currentTable : state.currentQueue;
  const activeOrders = allOrders.filter(o => o.tableName === targetId && o.paymentStatus === "unpaid");

  const total = activeOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  document.getElementById("billMerchantName").innerText = state.settings.shopName;
  document.getElementById("billTargetDisplay").innerText = state.orderMode === "dinein"
    ? `โต๊ะ ${state.currentTable} • ยอดชำระสุทธิ`
    : `คิวสั่งกลับบ้าน ${state.currentQueue} • ยอดชำระสุทธิ`;
  document.getElementById("billPayAmount").innerText = `฿${total.toFixed(2)}`;

  const qrContainer = document.getElementById("customerBillQRCode");
  qrContainer.innerHTML = "";

  if (total > 0 && typeof generatePromptPayPayload === "function") {
    const payload = generatePromptPayPayload(state.settings.promptpayId, total);
    new QRCode(qrContainer, {
      text: payload,
      width: 170,
      height: 170,
      colorDark: "#002d62",
      colorLight: "#ffffff"
    });
  } else {
    qrContainer.innerHTML = `<p style="padding:1.5rem; color:#64748b; font-size:0.85rem;">ไม่มีรายการค้างชำระ</p>`;
  }

  closeModal("trackerModal");
  openModal("billModal");
}

// ============================================================================
// 10. Table Switch Modal (Dine-in)
// ============================================================================
function openChangeTableModal() {
  const container = document.getElementById("tableSelectionGrid");
  const storedTables = JSON.parse(localStorage.getItem("pos_tables")) || DEFAULT_TABLES;

  container.innerHTML = storedTables.map(t => `
    <div class="table-select-card ${t.name === state.currentTable ? 'active' : ''}" onclick="selectCurrentTable('${t.name}')">
      <div style="font-size:1.15rem; font-weight:800;">โต๊ะ ${t.name}</div>
      <div style="font-size:0.75rem; color:#64748b; margin-top:0.2rem;">${t.seats || 4} ที่นั่ง</div>
    </div>
  `).join("");

  openModal("tableModal");
}

function selectCurrentTable(tableName) {
  state.currentTable = tableName;
  updateHeaderLabels();
  checkActiveOrders();
  closeModal("tableModal");
}

// ============================================================================
// 11. Modal Utilities
// ============================================================================
function openModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) el.classList.add("active");
  refreshIcons();
}

function closeModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) el.classList.remove("active");
}
