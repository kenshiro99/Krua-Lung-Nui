/**
 * ครัวลุงหนุ่ย (Krua Lung Nui) - Kitchen Display System (KDS) Module
 */

let lastPendingCount = 0;
const announcedOrderIds = new Set();
let isAudioUnlocked = false;

document.addEventListener("DOMContentLoaded", () => {
  if (!verifyPageAccess("kitchen")) return;

  updateTopNavUserBadge();
  startLiveClock();
  renderKitchenView();
  refreshLucideIcons();

  // Mark existing orders as already announced on page load to prevent replay
  const existing = JSON.parse(localStorage.getItem("pos_orders")) || [];
  existing.forEach(o => { if (o && o.id) announcedOrderIds.add(o.id); });

  // Initial Cloud Sync
  syncFromCloud().then(() => {
    if (window.posState && Array.isArray(window.posState.orders)) {
      window.posState.orders.forEach(o => { if (o && o.id) announcedOrderIds.add(o.id); });
    }
  });

  // Audio Unlocker for modern browser autoplay policy
  window.unlockKitchenAudio = function() {
    isAudioUnlocked = true;
    const audio = document.getElementById("bellSound");
    if (audio) {
      audio.play().then(() => { audio.pause(); audio.currentTime = 0; }).catch(() => {});
    }
    const banner = document.getElementById("kitchenAudioUnlockBanner");
    if (banner) {
      banner.style.background = "#16a34a";
      banner.innerHTML = "<span>🔊 ระบบเสียงห้องครัวพร้อมทำงาน (เสียงพูดโต๊ะ 1-10 และกระดิ่งเปิดแล้ว)</span>";
      setTimeout(() => { banner.style.display = "none"; }, 3500);
    }
  };
  document.addEventListener("click", () => { if (!isAudioUnlocked) window.unlockKitchenAudio(); }, { once: true });
  document.addEventListener("touchstart", () => { if (!isAudioUnlocked) window.unlockKitchenAudio(); }, { once: true });

  // Realtime subscription from Supabase Cloud
  if (window.SupabaseService && typeof window.SupabaseService.subscribeOrders === "function") {
    window.SupabaseService.subscribeOrders(
      (newOrder) => {
        console.log("🔔 [Kitchen KDS] New Cloud Order received:", newOrder);
        const norm = normalizeOrderFormat(newOrder);
        announceNewOrder(norm);
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
    
    // Announce any active order that hasn't been announced yet
    activeOrders.forEach(o => {
      if (!announcedOrderIds.has(o.id)) {
        announceNewOrder(o);
      }
    });

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
  announcedOrderIds.clear();
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
        <div class="ticket-actions" style="display:flex; gap:0.5rem; flex-wrap:wrap;">
          ${!isCooking ? `
            <button class="btn btn-warning" style="flex:1;" onclick="updateOrderStatus('${o.id}', 'cooking')">
              <i data-lucide="flame"></i> กำลังปรุงอาหาร
            </button>
          ` : `
            <button class="btn btn-success" style="flex:1;" onclick="updateOrderStatus('${o.id}', 'served')">
              <i data-lucide="check-circle"></i> ${isTakeaway ? '📦 ปรุงเสร็จ / พร้อมส่งมอบลูกค้า' : '🍽️ ปรุงเสร็จ / พร้อมเสิร์ฟที่โต๊ะ'}
            </button>
          `}
          ${isTakeaway ? `
            <button class="btn btn-outline" style="border:1px solid #ea580c; color:#ea580c; background:#fff7ed; padding:0.4rem 0.75rem; font-weight:700; display:inline-flex; align-items:center; gap:0.3rem;" onclick="callQueueSound('${o.tableName}', '${(o.customerName || '').replace(/'/g, "\\'")}')" title="กดเรียกคิวออกลำโพงทันที">
              <i data-lucide="megaphone"></i> 📢 เรียกคิว
            </button>
          ` : ''}
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
    // เมื่อพ่อครัวกดปรุงเสร็จ (served) สำหรับสั่งกลับบ้าน ให้ระบบเรียกคิวเสียง AI อัตโนมัติทันที
    const isTakeaway = order.orderType === "takeaway" || order.tableId === "takeaway" || String(order.tableName).startsWith("Q-");
    if (newStatus === "served" && isTakeaway) {
      callQueueSound(order.tableName, order.customerName);
    }
  }
}

function playKitchenBell() {
  const soundToggle = document.getElementById("kitchenSoundToggle");
  if (soundToggle && !soundToggle.checked) return;

  // 1. ลองเล่นไฟล์กระดิ่งที่คุณลงไว้ใน sounds/bell.mp3 ก่อน
  const customBell = new Audio("sounds/bell.mp3");
  const playPromise = customBell.play();

  if (playPromise !== undefined) {
    playPromise.catch(() => {
      // 2. ถ้าไม่มีไฟล์ bell.mp3 ให้เล่นเสียงกระดิ่ง Mixkit ออนไลน์เดิม
      const audio = document.getElementById("bellSound");
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(e => console.log("Audio autoplay prevented:", e.message));
      }
    });
  }
}

/**
 * เล่นไฟล์เสียงพูดแบบกำหนดเอง (Custom MP3 ใน sounds/)
 * หากยังไม่มีไฟล์ หรือเล่นไม่ได้ จะสลับไปใช้เสียงสังเคราะห์ภาษาไทยอัตโนมัติ
 */
function playCustomVoiceAudio(soundSrc, fallbackText) {
  const audio = new Audio(soundSrc);
  const playPromise = audio.play();

  if (playPromise !== undefined) {
    playPromise.catch(err => {
      // เมื่อไม่พบไฟล์ หรือเล่นไม่ได้ ให้ใช้เสียงสังเคราะห์ภาษาไทยของระบบแทน
      console.log(`[Audio] Custom audio "${soundSrc}" not found or failed, using speech synthesis.`);
      if (fallbackText) {
        speakThai(fallbackText);
      }
    });
  } else {
    audio.onerror = () => {
      if (fallbackText) speakThai(fallbackText);
    };
  }
}

/**
 * ประกาศเสียงพูดแจ้งเตือนออเดอร์ใหม่เข้าห้องครัว
 * ดึงไฟล์เสียงที่คุณอัดไว้ใน sounds/ เช่น table_1.mp3, table_2.mp3, takeaway.mp3
 */
function announceNewOrder(order) {
  if (!order || !order.id) return;
  if (announcedOrderIds.has(order.id)) return;
  announcedOrderIds.add(order.id);

  const soundToggle = document.getElementById("kitchenSoundToggle");
  if (soundToggle && !soundToggle.checked) return;

  // 1. เล่นเสียงกระดิ่งเตือน (Chime)
  playKitchenBell();

  // 2. ระบุไฟล์เสียง และข้อความเสียงสำรอง
  let soundPath = "sounds/new_order.mp3";
  let fallbackText = "มีออเดอร์ใหม่เข้ามาค่ะ";
  const isTakeaway = order.orderType === "takeaway" || order.tableId === "takeaway" || String(order.tableName || "").startsWith("Q-");

  if (isTakeaway) {
    const q = String(order.tableName || "").replace(/^Q-/, '').trim();
    soundPath = "sounds/takeaway.mp3";
    fallbackText = `มีออเดอร์กลับบ้าน คิว ${q} ค่ะ`;
  } else {
    const t = String(order.tableName || "").replace(/^โต๊ะ\s*/, '').replace(/^t-/, '').trim();
    soundPath = `sounds/table_${t}.mp3`;
    fallbackText = `มีออเดอร์โต๊ะ ${t} ค่ะ`;
  }

  // 3. เริ่มเล่นไฟล์เสียง (หรือเสียงระบบ) หลังกระดิ่งสั่นเล็กน้อย (450ms)
  setTimeout(() => {
    playCustomVoiceAudio(soundPath, fallbackText);
  }, 450);
}

function speakThai(text) {
  if (!('speechSynthesis' in window)) {
    console.warn("SpeechSynthesis is not supported in this browser.");
    return;
  }

  try {
    window.speechSynthesis.cancel(); // ตัดเสียงพูดเดิมก่อนหน้า

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "th-TH";
    utterance.rate = 0.95; // จังหวะพูดชัดเจน นุ่มนวล
    utterance.pitch = 1.05; // น้ำเสียงสุภาพ เป็นกันเอง

    // ตรวจหาเสียงภาษาไทยจากระบบ
    const voices = window.speechSynthesis.getVoices();
    const thVoice = voices.find(v => v.lang === "th-TH" || v.lang.startsWith("th") || (v.name && v.name.includes("Thai")));
    if (thVoice) {
      utterance.voice = thVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn("speakThai failed:", err);
  }
}

function testVoiceNotification(tableNum = 1) {
  playKitchenBell();
  setTimeout(() => {
    playCustomVoiceAudio(`sounds/table_${tableNum}.mp3`, `ทดสอบเสียงพูดครัวลุงหนุ่ย มีออเดอร์โต๊ะ ${tableNum} ค่ะ`);
  }, 450);
}

function testTakeawayVoice() {
  playKitchenBell();
  setTimeout(() => {
    playCustomVoiceAudio("sounds/takeaway.mp3", "ทดสอบเสียงพูดครัวลุงหนุ่ย มีออเดอร์กลับบ้านค่ะ");
  }, 450);
}

/**
 * ระบบเรียกคิวอาหารด้วยเสียง AI ภาษาไทย (AI Voice Queue Calling Engine)
 * ตัวอย่าง: "ขอเชิญหมายเลขคิว 15 รับอาหารที่ช่องรับอาหารได้เลยค่ะ"
 * หรือ: "ขอเชิญคุณสมชาย หมายเลขคิว 15 รับอาหารที่ช่องรับอาหารได้เลยค่ะ"
 */
function callQueueSound(queueRaw, customerName = "") {
  if (!queueRaw) return;

  const soundToggle = document.getElementById("kitchenSoundToggle");
  if (soundToggle && !soundToggle.checked) return;

  const cleanQ = String(queueRaw).replace(/^Q-/, '').replace(/^คิว\s*/, '').trim();

  let speechText = "";
  if (customerName && customerName.trim() && customerName !== "ลูกค้าหน้าร้าน") {
    speechText = `ขอเชิญคุณ ${customerName.trim()} หมายเลขคิว ${cleanQ} รับอาหารที่ช่องรับอาหารได้เลยค่ะ`;
  } else {
    speechText = `ขอเชิญหมายเลขคิว ${cleanQ} รับอาหารที่ช่องรับอาหารได้เลยค่ะ`;
  }

  // 1. เล่นเสียงกระดิ่ง Chime เตือนความสนใจก่อน
  playKitchenBell();

  // 2. ส่งเสียงพูดภาษาไทยผ่าน AI Speech
  setTimeout(() => {
    speakThai(speechText);
  }, 450);

  // 3. แสดงการแจ้งเตือน Pop-up บนหน้าจอ
  showQueueCallingToast(cleanQ, customerName);
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

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add("active");
  refreshLucideIcons();
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove("active");
}
