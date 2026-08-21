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

  // Polling every 3 seconds for new incoming orders
  setInterval(() => {
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

function updateOrderStatus(orderId, newStatus) {
  const order = window.posState.orders.find(o => o.id === orderId);
  if (order) {
    order.status = newStatus;
    savePOSState();
    renderKitchenView();
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
