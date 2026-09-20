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

  // Polling to update live cashier bills
  setInterval(() => {
    window.posState.orders = JSON.parse(localStorage.getItem("pos_orders")) || [];
    window.posState.tables = JSON.parse(localStorage.getItem("pos_tables")) || [];
    renderCashierView();
  }, 4000);
});

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
    window.posState.orders.forEach(o => {
      if (isOrderForTable(o, table) && o.paymentStatus === "unpaid") {
        o.paymentStatus = "paid";
        o.status = "completed";
        o.paymentMethod = paymentMethod;
        paidAmount += (Number(o.total) || 0);
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
