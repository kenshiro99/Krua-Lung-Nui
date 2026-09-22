/**
 * ครัวลุงหนุ่ย (Krua Lung Nui) - Cashier POS Module
 */

let selectedCashierTableId = null;
let currentCashierTab = "dinein"; // "dinein" | "takeaway"

document.addEventListener("DOMContentLoaded", () => {
  if (!verifyPageAccess("cashier")) return;

  updateTopNavUserBadge();
  startLiveClock();
  renderCashierView();
  refreshLucideIcons();

  // Initial Cloud Sync
  syncCashierFromCloud();

  // Realtime subscription from Supabase Cloud
  if (window.SupabaseService && typeof window.SupabaseService.subscribeOrders === "function") {
    window.SupabaseService.subscribeOrders(
      (newOrder) => {
        console.log("💵 [Cashier POS] New Cloud Order received:", newOrder);
        syncCashierFromCloud();
      },
      (updatedOrder) => {
        syncCashierFromCloud();
      }
    );
  }

  // Polling to update live cashier bills (every 3s)
  setInterval(() => {
    syncCashierFromCloud();

    window.posState.orders = JSON.parse(localStorage.getItem("pos_orders")) || [];
    window.posState.tables = JSON.parse(localStorage.getItem("pos_tables")) || [];
    renderCashierView();
  }, 3000);
});

async function syncCashierFromCloud() {
  if (window.SupabaseService && window.SupabaseService.isConfigured()) {
    const cloudOrders = await window.SupabaseService.getOrders();
    if (cloudOrders && Array.isArray(cloudOrders)) {
      const mapped = cloudOrders.map(normalizeCashierOrderFormat).filter(Boolean);
      window.posState.orders = mapped;
      localStorage.setItem("pos_orders", JSON.stringify(mapped));

      // Sync table statuses based on active dine-in orders
      if (Array.isArray(window.posState.tables)) {
        window.posState.tables.forEach(t => {
          const hasActiveOrder = mapped.some(o => 
            (o.tableId === t.id || o.tableId === ("t-" + t.id) || o.tableName === t.name || String(o.tableName).replace(/^โต๊ะ\s*/, '') === String(t.name).replace(/^โต๊ะ\s*/, '')) &&
            o.paymentStatus !== "paid"
          );
          t.status = hasActiveOrder ? "occupied" : "available";
        });
        localStorage.setItem("pos_tables", JSON.stringify(window.posState.tables));
      }

      renderCashierView();
    }
  }
}

async function clearAllTestData() {
  if (!confirm("⚠️ ต้องการล้างรายการอาหารที่ทดสอบทั้งหมด และรีเซ็ตทุกโต๊ะให้ว่าง ใช่หรือไม่?")) return;

  // 1. Clear Local Storage
  localStorage.removeItem("pos_orders");
  if (window.posState) {
    window.posState.orders = [];
    if (Array.isArray(window.posState.tables)) {
      window.posState.tables.forEach(t => t.status = "available");
      localStorage.setItem("pos_tables", JSON.stringify(window.posState.tables));
    }
  }

  // 2. Clear Supabase Cloud Orders
  if (window.SupabaseService && window.SupabaseService.isConfigured()) {
    try {
      const client = window.SupabaseService.getClient();
      if (client) {
        await client.from('orders').delete().neq('id', '___NEVER_MATCH___');
      }
    } catch (e) {
      console.warn("Supabase clear orders:", e);
    }
  }

  alert("✅ ล้างข้อมูลการทดสอบทั้งหมดเรียบร้อยแล้ว! ทุกโต๊ะว่างและพร้อมเริ่มทดสอบใหม่ทันทีครับ");
  window.location.reload();
}

function normalizeCashierOrderFormat(o) {
  if (!o) return null;
  return {
    id: o.id,
    orderType: o.order_type || o.orderType || "dinein",
    tableId: o.table_id || o.tableId || "t-1",
    tableName: o.table_name || o.tableName || "1",
    customerName: o.customer_name || o.customerName || "",
    customerPhone: o.customer_phone || o.customerPhone || "",
    packagingNotes: o.packaging_notes || o.packagingNotes || o.customer_notes || "",
    createdAt: o.created_at || o.createdAt || new Date().toISOString(),
    status: o.status || "pending",
    paymentStatus: o.payment_status || o.paymentStatus || "unpaid",
    paymentMethod: o.payment_method || o.paymentMethod || "promptpay",
    items: Array.isArray(o.items) ? o.items : (typeof o.items === 'string' ? JSON.parse(o.items) : []),
    subtotal: Number(o.subtotal || o.total || 0),
    total: Number(o.total || 0)
  };
}

function switchCashierTab(tab) {
  currentCashierTab = tab;
  document.querySelectorAll(".cashier-filter-tab").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });
  selectedCashierTableId = null;
  renderCashierView();
}

function isOrderForTable(o, t) {
  if (!o || !t) return false;
  if (o.tableId === t.id) return true;
  if (o.tableId === ("t-" + t.name)) return true;
  if (o.tableName === t.name) return true;
  if (o.tableName === t.id.replace('t-', '')) return true;
  const cleanTName = String(t.name).replace(/^โต๊ะ\s*/, '');
  const cleanOName = String(o.tableName).replace(/^โต๊ะ\s*/, '');
  return cleanTName === cleanOName;
}

function renderCashierView() {
  const tableListContainer = document.getElementById("cashierTableList");
  if (!tableListContainer) return;

  const unpaidOrders = window.posState.orders.filter(o => o.paymentStatus === "unpaid");
  const dineinOrders = unpaidOrders.filter(o => o.orderType !== "takeaway" && !String(o.tableName).startsWith("Q-"));
  const takeawayOrders = unpaidOrders.filter(o => o.orderType === "takeaway" || String(o.tableName).startsWith("Q-"));

  document.getElementById("badgeDineinUnpaid").innerText = `${dineinOrders.length} โต๊ะ`;
  document.getElementById("badgeTakeawayUnpaid").innerText = `${takeawayOrders.length} คิว`;

  if (currentCashierTab === "dinein") {
    // Show Dine-in tables
    tableListContainer.innerHTML = window.posState.tables.map(t => {
      const isOccupied = t.status === "occupied";
      const isSelected = t.id === selectedCashierTableId;
      const tableOrders = dineinOrders.filter(o => isOrderForTable(o, t));
      const totalDue = tableOrders.reduce((sum, o) => sum + (o.total || 0), 0);

      return `
        <div class="cashier-table-item ${isOccupied ? 'occupied' : 'available'} ${isSelected ? 'active' : ''}" onclick="selectCashierTarget('${t.id}', 'dinein')">
          <div>
            <strong style="font-size: 1.05rem;">โต๊ะ ${t.name.replace(/^โต๊ะ\s*/, '')}</strong>
          </div>
          <div style="text-align:right;">
            <span class="badge ${isOccupied ? 'badge-warning' : 'badge-success'}">${isOccupied ? 'กำลังทาน' : 'ว่าง'}</span>
            ${totalDue > 0 ? `<div style="font-size:0.85rem; font-weight:700; color:var(--primary); margin-top:0.2rem;">฿${totalDue.toFixed(2)}</div>` : ''}
          </div>
        </div>
      `;
    }).join("");
  } else {
    // Show Takeaway queues
    if (takeawayOrders.length === 0) {
      tableListContainer.innerHTML = `
        <div style="text-align:center; padding:2rem; color:var(--text-muted); font-size:0.85rem;">
          ไม่มีคิวสั่งกลับบ้านที่รอชำระ
        </div>
      `;
    } else {
      tableListContainer.innerHTML = takeawayOrders.map(o => {
        const isSelected = o.id === selectedCashierTableId;
        return `
          <div class="cashier-table-item occupied ${isSelected ? 'active' : ''}" onclick="selectCashierTarget('${o.id}', 'takeaway')" style="border-left-color: #ea580c;">
            <div>
              <strong style="color:#ea580c;">🛍️ คิว ${o.tableName}</strong>
              <div style="font-size:0.75rem; color:var(--text-muted);">${o.customerName || 'ลูกค้าหน้าร้าน'} ${o.customerPhone ? '(' + o.customerPhone + ')' : ''}</div>
            </div>
            <div style="text-align:right;">
              <span class="badge badge-warning">รอชำระ</span>
              <div style="font-size:0.85rem; font-weight:700; color:#ea580c; margin-top:0.2rem;">฿${o.total.toFixed(2)}</div>
            </div>
          </div>
        `;
      }).join("");
    }
  }

  renderCashierBillDetails();
}

function selectCashierTarget(id, type) {
  selectedCashierTableId = id;
  renderCashierView();
}

function renderCashierBillDetails() {
  const titleEl = document.getElementById("cashierSelectedTableTitle");
  const metaEl = document.getElementById("cashierSelectedTableMeta");
  const actionsEl = document.getElementById("cashierHeaderActions");
  const itemsContainer = document.getElementById("cashierBillItems");

  if (!selectedCashierTableId) {
    titleEl.innerText = "กรุณาเลือกโต๊ะหรือคิวด้านซ้ายมือ";
    metaEl.innerText = "-";
    actionsEl.style.display = "none";
    itemsContainer.innerHTML = `
      <div class="empty-state" style="text-align:center; padding:3rem; color:var(--text-muted);">
        <i data-lucide="receipt-text" style="width:48px; height:48px; margin:0 auto 1rem; opacity:0.4;"></i>
        <p>เลือกรายการจากแถบด้านซ้าย เพื่อดูรายการอาหารและคิดเงิน</p>
      </div>
    `;
    refreshLucideIcons();
    return;
  }

  let unpaidOrders = [];
  let displayTitle = "";

  if (currentCashierTab === "dinein") {
    const table = window.posState.tables.find(t => t.id === selectedCashierTableId);
    if (!table) return;
    unpaidOrders = window.posState.orders.filter(o => isOrderForTable(o, table) && o.paymentStatus === "unpaid");
    displayTitle = `โต๊ะ ${table.name}`;
    metaEl.innerText = unpaidOrders.length > 0 ? `มีคำสั่งซื้อค้างชำระ ${unpaidOrders.length} รอบ` : `โต๊ะว่าง / ไม่มีรายการค้างชำระ`;
  } else {
    const order = window.posState.orders.find(o => o.id === selectedCashierTableId);
    if (!order) return;
    if (order.paymentStatus === "unpaid") unpaidOrders = [order];
    displayTitle = `🛍️ คิว ${order.tableName} (${order.customerName || 'ลูกค้าหน้าร้าน'})`;
    metaEl.innerText = `ออเดอร์สั่งกลับบ้าน (${order.id})`;
  }

  titleEl.innerText = displayTitle;
  actionsEl.style.display = unpaidOrders.length > 0 ? "flex" : "none";
  const btnCallQ = document.getElementById("btnCashierCallQueue");
  if (btnCallQ) {
    btnCallQ.style.display = currentCashierTab === "takeaway" ? "inline-flex" : "none";
  }

  if (unpaidOrders.length === 0) {
    itemsContainer.innerHTML = `
      <div style="text-align:center; padding:3rem; color:var(--text-muted);">
        <p>ไม่มีรายการสั่งอาหารที่ค้างชำระ</p>
      </div>
    `;
    refreshLucideIcons();
    return;
  }

  let allItemsHtml = unpaidOrders.map((ord, idx) => `
    <div style="margin-bottom:1.25rem; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:1rem;">
      <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem; font-size:0.85rem; color:var(--text-secondary);">
        <span>${ord.orderType === 'takeaway' ? '🛍️ สั่งกลับบ้าน' : `รอบที่ ${idx + 1}`} (${ord.id})</span>
        <span>⏱️ ${new Date(ord.createdAt).toLocaleTimeString('th-TH')}</span>
      </div>
      ${ord.items.map(item => `
        <div style="display:flex; justify-content:space-between; padding:0.4rem 0; border-bottom:1px dashed #e2e8f0; font-size:0.9rem;">
          <div>
            <b>${item.name}</b> x ${item.qty}
            ${item.options ? `<div style="font-size:0.75rem; color:#d97706;">${item.options}</div>` : ''}
            ${item.note ? `<div style="font-size:0.75rem; color:#64748b;">(หมายเหตุ: ${item.note})</div>` : ''}
          </div>
          <div><b>฿${(item.price * item.qty).toFixed(2)}</b></div>
        </div>
      `).join("")}
      ${ord.packagingNotes ? `<div style="font-size:0.75rem; color:#ea580c; margin-top:0.35rem;">📦 บรรจุภัณฑ์: ${ord.packagingNotes}</div>` : ''}
      <div style="text-align:right; font-weight:700; margin-top:0.5rem; color:var(--primary);">
        รวมรอบนี้: ฿${ord.total.toFixed(2)}
      </div>
    </div>
  `).join("");

  const grandTotal = unpaidOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  itemsContainer.innerHTML = `
    <div>
      ${allItemsHtml}
      <div style="display:flex; justify-content:space-between; align-items:center; padding:1.25rem; background:#eff6ff; border-radius:12px; font-size:1.25rem; font-weight:700; color:var(--primary); margin-top:1.25rem;">
        <span>ยอดสุทธิที่ต้องชำระ:</span>
        <span>฿${grandTotal.toFixed(2)}</span>
      </div>
    </div>
  `;
  refreshLucideIcons();
}

function openPaymentModal() {
  let unpaidOrders = [];
  let targetTitle = "";

  if (currentCashierTab === "dinein") {
    const table = window.posState.tables.find(t => t.id === selectedCashierTableId);
    if (!table) return;
    unpaidOrders = window.posState.orders.filter(o => isOrderForTable(o, table) && o.paymentStatus === "unpaid");
    targetTitle = `โต๊ะ ${table.name}`;
  } else {
    const order = window.posState.orders.find(o => o.id === selectedCashierTableId);
    if (!order) return;
    if (order.paymentStatus === "unpaid") unpaidOrders = [order];
    targetTitle = `คิว ${order.tableName} (${order.customerName || 'กลับบ้าน'})`;
  }

  if (unpaidOrders.length === 0) return;

  const subtotal = unpaidOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const serviceCharge = (subtotal * (window.posState.settings.serviceCharge / 100));
  const vat = ((subtotal + serviceCharge) * (window.posState.settings.vat / 100));
  const grandTotal = subtotal + serviceCharge + vat;

  document.getElementById("paymentModalTitle").innerText = `ชำระเงิน - ${targetTitle}`;
  document.getElementById("paySubtotal").innerText = `฿${subtotal.toFixed(2)}`;
  document.getElementById("payServiceCharge").innerText = `฿${serviceCharge.toFixed(2)}`;
  document.getElementById("payVat").innerText = `฿${vat.toFixed(2)}`;
  document.getElementById("payGrandTotal").innerText = `฿${grandTotal.toFixed(2)}`;
  document.getElementById("modalPromptPayAmount").innerText = `฿${grandTotal.toFixed(2)}`;

  const summaryList = document.getElementById("paymentBillSummaryList");
  summaryList.innerHTML = unpaidOrders.flatMap(o => o.items).map(item => `
    <div style="display:flex; justify-content:space-between; font-size:0.85rem; padding:0.25rem 0;">
      <span>${item.name} x${item.qty}</span>
      <span>฿${(item.price * item.qty).toFixed(2)}</span>
    </div>
  `).join("");

  const qrContainer = document.getElementById("modalPromptPayQR");
  qrContainer.innerHTML = "";
  const payload = generatePromptPayPayload(window.posState.settings.promptpayId, grandTotal);

  new QRCode(qrContainer, {
    text: payload,
    width: 180,
    height: 180,
    colorDark: "#002d62",
    colorLight: "#ffffff"
  });

  document.getElementById("cashReceivedInput").value = "";
  document.getElementById("cashChangeDisplay").innerText = "฿0.00";
  selectPaymentTab("promptpay");
  openModal("paymentModal");
}

function selectPaymentTab(tab) {
  document.querySelectorAll(".pay-method-tab").forEach(t => t.classList.toggle("active", t.innerText.includes(tab === 'promptpay' ? 'พร้อมเพย์' : 'เงินสด')));
  document.getElementById("payPromptPaySection").style.display = tab === "promptpay" ? "block" : "none";
  document.getElementById("payCashSection").style.display = tab === "cash" ? "block" : "none";
}

function calcCashChange() {
  const grandTotal = parseFloat(document.getElementById("payGrandTotal").innerText.replace(/[^0-9.]/g, '')) || 0;
  const received = parseFloat(document.getElementById("cashReceivedInput").value) || 0;
  const change = Math.max(0, received - grandTotal);
  document.getElementById("cashChangeDisplay").innerText = `฿${change.toFixed(2)}`;
}

function setQuickCash(amount) {
  document.getElementById("cashReceivedInput").value = amount;
  calcCashChange();
}

function setExactCash() {
  const grandTotal = parseFloat(document.getElementById("payGrandTotal").innerText.replace(/[^0-9.]/g, '')) || 0;
  document.getElementById("cashReceivedInput").value = grandTotal;
  calcCashChange();
}

function confirmPaymentAndCloseTable() {
  const isCash = document.getElementById("payCashSection") && document.getElementById("payCashSection").style.display !== "none";
  const paymentMethod = isCash ? "cash" : "promptpay";
  const paymentChannel = isCash ? "CASH" : "QR_TRANSFER";
  let paidAmount = 0;
  let targetLabel = "";

  if (currentCashierTab === "dinein") {
    const table = window.posState.tables.find(t => t.id === selectedCashierTableId);
    if (!table) return;

    targetLabel = `โต๊ะ ${table.name}`;
    window.posState.orders.forEach(async o => {
      if (isOrderForTable(o, table) && o.paymentStatus === "unpaid") {
        o.paymentStatus = "paid";
        o.status = "completed";
        o.paymentMethod = paymentMethod;
        paidAmount += (Number(o.total) || 0);
        if (window.SupabaseService && window.SupabaseService.isConfigured()) {
          try {
            await window.SupabaseService.updateOrderStatus(o.id, "completed", "paid");
          } catch (e) {
            console.warn("Supabase update error:", e);
          }
        }
      }
    });

    table.status = "available";
    alert(`✅ เช็คบิลโต๊ะ ${table.name} เรียบร้อยแล้ว! (฿${paidAmount.toFixed(2)})`);
  } else {
    const order = window.posState.orders.find(o => o.id === selectedCashierTableId);
    if (order) {
      targetLabel = `คิว ${order.tableName}`;
      order.paymentStatus = "paid";
      order.status = "completed";
      order.paymentMethod = paymentMethod;
      paidAmount = (Number(order.total) || 0);
      if (window.SupabaseService && window.SupabaseService.isConfigured()) {
        try {
          window.SupabaseService.updateOrderStatus(order.id, "completed", "paid");
        } catch (e) {
          console.warn("Supabase update error:", e);
        }
      }
      alert(`✅ รับชำระเงินคิวสั่งกลับบ้าน ${order.tableName} เรียบร้อยแล้ว! (฿${paidAmount.toFixed(2)})`);
    }
  }

  // Record income transaction into Accounting Ledger
  if (paidAmount > 0) {
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const drId = `DR-${dateStr.replace(/-/g, "")}`;

    if (!window.posState.transactions) window.posState.transactions = [];
    window.posState.transactions.push({
      id: "TXN-" + Date.now() + "-" + Math.floor(100 + Math.random() * 900),
      dailyRecordId: drId,
      date: dateStr,
      type: "INCOME",
      paymentChannel: paymentChannel,
      category: "sales",
      subCategory: isCash ? `${targetLabel} (เงินสด)` : `${targetLabel} (พร้อมเพย์)`,
      amount: paidAmount,
      loanId: null,
      time: now.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
      notes: `รับชำระเงิน ${targetLabel} (${paymentMethod === 'cash' ? 'เงินสด' : 'พร้อมเพย์'})`
    });

    // Record in Audit Log
    if (typeof logUserActivity === 'function') {
      const staff = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
      logUserActivity(
        staff ? staff.id : "cashier",
        staff ? staff.name : "แคชเชียร์",
        staff ? staff.role : "cashier",
        `เช็คบิล ${targetLabel} ยอด ฿${paidAmount.toFixed(2)} (${paymentMethod === 'cash' ? 'เงินสด' : 'พร้อมเพย์'})`,
        "SUCCESS"
      );
    }
  }

  savePOSState();
  closeModal("paymentModal");
  selectedCashierTableId = null;
  renderCashierView();
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add("active");
  refreshLucideIcons();
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove("active");
}

function cashierCallCurrentQueue() {
  if (currentCashierTab === "takeaway" && selectedCashierTableId) {
    const order = window.posState.orders.find(o => o.id === selectedCashierTableId);
    if (order) {
      callQueueSound(order.tableName, order.customerName);
    }
  }
}

/**
 * ระบบเรียกคิวอาหารด้วยเสียง AI ภาษาไทย (AI Voice Queue Calling Engine)
 */
function callQueueSound(queueRaw, customerName = "") {
  if (!queueRaw) return;

  const cleanQ = String(queueRaw).replace(/^Q-/, '').replace(/^คิว\s*/, '').trim();

  let speechText = "";
  if (customerName && customerName.trim() && customerName !== "ลูกค้าหน้าร้าน") {
    speechText = `ขอเชิญคุณ ${customerName.trim()} หมายเลขคิว ${cleanQ} รับอาหารที่ช่องรับอาหารได้เลยค่ะ`;
  } else {
    speechText = `ขอเชิญหมายเลขคิว ${cleanQ} รับอาหารที่ช่องรับอาหารได้เลยค่ะ`;
  }

  // เล่นเสียงกระดิ่ง Chime เตือนนำ
  playBellSound();

  // ส่งเสียงพูดภาษาไทยผ่าน AI Speech
  setTimeout(() => {
    speakThai(speechText);
  }, 450);

  // แสดงการแจ้งเตือน Pop-up บนหน้าจอ
  showQueueCallingToast(cleanQ, customerName);
}

function playBellSound() {
  const customBell = new Audio("sounds/bell.mp3");
  customBell.play().catch(() => {
    const audio = document.getElementById("bellSound");
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  });
}

function speakThai(text) {
  if (!('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "th-TH";
    utterance.rate = 0.95;
    utterance.pitch = 1.05;

    const voices = window.speechSynthesis.getVoices();
    const thVoice = voices.find(v => v.lang === "th-TH" || v.lang.startsWith("th") || (v.name && v.name.includes("Thai")));
    if (thVoice) utterance.voice = thVoice;

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn("speakThai failed:", err);
  }
}

function showQueueCallingToast(q, custName) {
  let toast = document.getElementById("queueCallingToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "queueCallingToast";
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #ea580c;
      color: #ffffff;
      padding: 1rem 1.5rem;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(234, 88, 12, 0.4);
      font-size: 1rem;
      font-weight: 700;
      z-index: 99999;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      border: 2px solid #fed7aa;
      transition: all 0.3s ease;
      pointer-events: none;
    `;
    document.body.appendChild(toast);
  }

  toast.innerHTML = `
    <span style="font-size:1.6rem;">📢</span>
    <div>
      <div>กำลังประกาศเรียกคิว: <span style="font-size:1.25rem; color:#fef08a; text-decoration:underline;">คิว ${q}</span></div>
      ${custName ? `<div style="font-size:0.85rem; font-weight:normal; opacity:0.9;">ลูกค้า: ${custName}</div>` : ''}
    </div>
  `;
  toast.style.opacity = "1";
  toast.style.transform = "scale(1)";

  clearTimeout(window.__queueToastTimeout);
  window.__queueToastTimeout = setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "scale(0.9)";
  }, 3500);
}
