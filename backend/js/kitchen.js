/**
 * ครัวลุงหนุ่ย (Krua Lung Nui) - Kitchen Display System (KDS) Module
 */

let lastPendingCount = 0;

document.addEventListener("DOMContentLoaded", () => {
  if (!verifyPageAccess("kitchen")) return;

  updateTopNavUserBadge();
  startLiveClock();
  renderKitchenView();
  refreshLucideIcons();

  // Initial Cloud Sync
  syncFromCloud();

  // Realtime subscription from Supabase Cloud
  if (window.SupabaseService && typeof window.SupabaseService.subscribeOrders === "function") {
    window.SupabaseService.subscribeOrders(
      (newOrder) => {
        console.log("🔔 [Kitchen KDS] New Cloud Order received:", newOrder);
        playKitchenBell();
        syncFromCloud();
      },
      (updatedOrder) => {
        syncFromCloud();
      }
    );
  }

  // Polling every 3 seconds for new incoming orders (Cloud & Local)
  setInterval(() => {
    syncFromCloud();

    window.posState.orders = JSON.parse(localStorage.getItem("pos_orders")) || [];
    const activeOrders = window.posState.orders.filter(o => o.status === "pending" || o.status === "cooking");
    
    // Play bell if new order arrived
    if (activeOrders.length > lastPendingCount) {
      playKitchenBell();
    }
    lastPendingCount = activeOrders.length;
    renderKitchenView();
  }, 3000);
});

async function syncFromCloud() {
  if (window.SupabaseService && window.SupabaseService.isConfigured()) {
    const cloudOrders = await window.SupabaseService.getOrders();
    if (cloudOrders && Array.isArray(cloudOrders)) {
      const mapped = cloudOrders.map(normalizeOrderFormat).filter(Boolean);
      window.posState.orders = mapped;
      localStorage.setItem("pos_orders", JSON.stringify(mapped));
      renderKitchenView();
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

  alert("✅ ล้างข้อมูลการทดสอบทั้งหมดเรียบร้อยแล้ว! ทุกโต๊ะว่างและพร้อมทดสอบใหม่ครับ");
  window.location.reload();
}

function normalizeOrderFormat(o) {
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

function renderKitchenView() {
  const container = document.getElementById("kitchenCardsContainer");
  if (!container) return;

  const activeOrders = window.posState.orders.filter(o => o.status === "pending" || o.status === "cooking");
  document.getElementById("kdsActiveBadge").innerText = `${activeOrders.length} ออเดอร์รอปรุง`;

  if (activeOrders.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: #94a3b8;">
        <i data-lucide="check-check" style="width: 56px; height: 56px; margin: 0 auto 1rem; color: #10b981;"></i>
        <h3>ทุกเมนูปรุงเสร็จสิ้นแล้ว</h3>
        <p>ยังไม่มีรายการอาหารใหม่เข้ามาในครัวลุงหนุ่ย</p>
      </div>
    `;
    refreshLucideIcons();
    return;
  }

  container.innerHTML = activeOrders.map(o => {
    const elapsedMinutes = Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 60000);
    const isCooking = o.status === "cooking";
    const isTakeaway = o.orderType === "takeaway" || o.tableId === "takeaway" || String(o.tableName).startsWith("Q-");

    return `
      <div class="kitchen-ticket" style="${isTakeaway ? 'border-top: 5px solid #ea580c; background: #fffdfa;' : ''}">
        <div class="ticket-header" style="${isTakeaway ? 'background: #fff7ed; border-bottom: 1px solid #fed7aa;' : ''}">
          <span class="ticket-table-no" style="${isTakeaway ? 'color: #ea580c;' : ''}">
            ${isTakeaway ? `🛍️ สั่งกลับบ้าน [คิว ${o.tableName}]` : `🍽️ ทานที่ร้าน โต๊ะ ${o.tableName}`}
          </span>
          <span class="ticket-time-badge">⏱️ ${elapsedMinutes} นาทีที่แล้ว</span>
        </div>

        ${isTakeaway && (o.customerName || o.packagingNotes) ? `
          <div style="padding: 0.4rem 0.75rem; background: #ffedd5; font-size: 0.8rem; color: #9a3412; border-bottom: 1px dashed #fed7aa;">
            ${o.customerName ? `<div>👤 <b>ลูกค้า:</b> ${o.customerName} ${o.customerPhone ? '(' + o.customerPhone + ')' : ''}</div>` : ''}
            ${o.packagingNotes ? `<div>📦 <b>บรรจุภัณฑ์:</b> ${o.packagingNotes}</div>` : ''}
          </div>
        ` : ''}

        <div class="ticket-body">
          ${o.items.map(item => `
            <div class="ticket-item-row">
              <div>
                <div class="ticket-item-name">${item.name}</div>
                ${item.options ? `<div class="ticket-item-opt">⚡ ${item.options}</div>` : ''}
                ${item.note ? `<div class="ticket-item-opt" style="color:#ef4444;">⚠️ หมายเหตุ: ${item.note}</div>` : ''}
              </div>
              <div class="ticket-item-qty">x${item.qty}</div>
            </div>
          `).join("")}
        </div>
        <div class="ticket-actions">
          ${!isCooking ? `
            <button class="btn btn-warning" style="flex:1;" onclick="updateOrderStatus('${o.id}', 'cooking')">
              <i data-lucide="flame"></i> กำลังปรุงอาหาร
            </button>
          ` : `
            <button class="btn btn-success" style="flex:1;" onclick="updateOrderStatus('${o.id}', 'served')">
              <i data-lucide="check-circle"></i> ${isTakeaway ? '📦 ปรุงเสร็จ / พร้อมส่งมอบลูกค้า' : '🍽️ ปรุงเสร็จ / พร้อมเสิร์ฟที่โต๊ะ'}
            </button>
          `}
        </div>
      </div>
    `;
  }).join("");
  refreshLucideIcons();
}

async function updateOrderStatus(orderId, newStatus) {
  const order = window.posState.orders.find(o => o.id === orderId);
  if (order) {
    order.status = newStatus;
    savePOSState();
    renderKitchenView();
    if (window.SupabaseService && window.SupabaseService.isConfigured()) {
      await window.SupabaseService.updateOrderStatus(orderId, newStatus);
    }
  }
}

function playKitchenBell() {
  const soundToggle = document.getElementById("kitchenSoundToggle");
  if (soundToggle && soundToggle.checked) {
    const audio = document.getElementById("bellSound");
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(e => console.log("Audio autoplay"));
    }
  }
}
