/**
 * ครัวลุงหนุ่ย (Krua Lung Nui) - Supabase Data Layer & Sync Engine
 * Project: myajcbynabcwfmlvqpwv (https://myajcbynabcwfmlvqpwv.supabase.co)
 * Features:
 *   - Automatic Realtime updates for Orders & Tables
 *   - Resilient Offline-First Fallback (Seamless operation when offline or no API key)
 *   - Local SDK First + CDN Fallback
 */

(function(window) {
  const DEFAULT_URL = "https://myajcbynabcwfmlvqpwv.supabase.co";
  const DEFAULT_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15YWpjYnluYWJjd2ZtbHZxcHd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0NjI2MTgsImV4cCI6MjEwNTAzODYxOH0.BjjFAOIQF_qakKB2l9-IUwEONgB_jIXIx7VixLr3i7w";
  
  function sanitize(val) {
    if (!val || typeof val !== 'string') return '';
    const trimmed = val.trim();
    if (trimmed === 'null' || trimmed === 'undefined' || trimmed === '""') return '';
    return trimmed;
  }

  // Retrieve saved configuration from localStorage or global APP_CONFIG
  function getConfig() {
    const savedKey = sanitize(localStorage.getItem("KRUA_SUPABASE_ANON_KEY"));
    const savedUrl = sanitize(localStorage.getItem("KRUA_SUPABASE_URL"));
    const globalConfig = window.APP_CONFIG || {};
    const globalUrl = sanitize(globalConfig.SUPABASE_URL);
    const globalKey = sanitize(globalConfig.SUPABASE_ANON_KEY);

    return {
      url: savedUrl || globalUrl || DEFAULT_URL,
      key: savedKey || globalKey || DEFAULT_ANON_KEY
    };
  }

  let supabase = null;
  let isReady = false;

  function initClient() {
    const config = getConfig();
    const supaSdk = window.supabase;
    if (config.url && config.key && supaSdk && typeof supaSdk.createClient === 'function') {
      try {
        supabase = supaSdk.createClient(config.url, config.key);
        isReady = true;
        console.log("🟢 [Supabase] Connected to project:", config.url);
        updateStatusBadge(true);
        return true;
      } catch (err) {
        console.warn("⚠️ [Supabase] Failed to init client:", err.message);
        isReady = false;
        updateStatusBadge(false);
        return false;
      }
    } else {
      isReady = false;
      updateStatusBadge(false);
      return false;
    }
  }

  function updateStatusBadge(online) {
    window.SUPABASE_SYNC_STATUS = {
      isOnline: online,
      mode: online ? 'cloud' : 'local',
      timestamp: new Date().toISOString()
    };
    const badge = document.getElementById("dbSyncStatusBadge");
    if (badge) {
      if (online) {
        badge.className = "sync-badge online";
        badge.innerHTML = '<span class="dot"></span> คลาวด์ Supabase เชื่อมต่อแล้ว';
      } else {
        badge.className = "sync-badge local";
        badge.innerHTML = '<span class="dot"></span> โหมดออฟไลน์ / Local DB';
      }
    }
  }

  // Public Service Methods
  const SupabaseService = {
    isConfigured: () => {
      if (!isReady) initClient();
      return isReady;
    },
    getClient: () => {
      if (!isReady) initClient();
      return supabase;
    },
    saveCredentials: (url, key) => {
      if (url) localStorage.setItem("KRUA_SUPABASE_URL", url);
      if (key) localStorage.setItem("KRUA_SUPABASE_ANON_KEY", key);
      initClient();
    },

    // 1. Menus
    async getMenus() {
      if (!isReady) initClient();
      if (!isReady || !supabase) return null;
      try {
        const { data, error } = await supabase
          .from('menus')
          .select('*')
          .order('id', { ascending: true });
        if (error) throw error;
        return data;
      } catch (e) {
        console.warn("[Supabase] getMenus fallback to local:", e.message);
        return null;
      }
    },

    // 2. Categories
    async getCategories() {
      if (!isReady) initClient();
      if (!isReady || !supabase) return null;
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('sort_order', { ascending: true });
        if (error) throw error;
        return data;
      } catch (e) {
        console.warn("[Supabase] getCategories fallback to local:", e.message);
        return null;
      }
    },

    // 3. Tables
    async getTables() {
      if (!isReady) initClient();
      if (!isReady || !supabase) return null;
      try {
        const { data, error } = await supabase
          .from('tables')
          .select('*')
          .order('id', { ascending: true });
        if (error) throw error;
        return data;
      } catch (e) {
        console.warn("[Supabase] getTables fallback to local:", e.message);
        return null;
      }
    },

    async updateTableStatus(tableId, status, currentOrderId = null) {
      if (!isReady) initClient();
      if (!isReady || !supabase) return false;
      try {
        const updateData = { status };
        if (currentOrderId !== undefined) updateData.current_order_id = currentOrderId;
        const { error } = await supabase
          .from('tables')
          .update(updateData)
          .eq('id', tableId);
        return !error;
      } catch (e) {
        console.error("[Supabase] updateTableStatus failed:", e);
        return false;
      }
    },

    // 4. Orders
    async getOrders() {
      if (!isReady) initClient();
      if (!isReady || !supabase) return null;
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
      } catch (e) {
        console.warn("[Supabase] getOrders fallback to local:", e.message);
        return null;
      }
    },

    async createOrder(orderData) {
      if (!isReady) initClient();
      if (!isReady || !supabase) {
        console.error("❌ [Supabase] Database client not ready");
        return { success: false, error: "Database client not ready" };
      }
      try {
        const notes = orderData.packagingNotes 
          ? (orderData.notes ? `${orderData.packagingNotes} | ${orderData.notes}` : orderData.packagingNotes)
          : (orderData.notes || '');

        const payload = {
          id: orderData.id,
          table_id: orderData.tableId || null,
          table_name: orderData.tableName || 'ไม่ระบุโต๊ะ',
          order_type: (orderData.orderType === 'takeaway') ? 'takeaway' : 'dinein',
          status: orderData.status || 'pending',
          payment_status: orderData.paymentStatus || 'unpaid',
          payment_method: orderData.paymentMethod || 'promptpay',
          subtotal: Number(orderData.subtotal || orderData.total || 0),
          total: Number(orderData.total || 0),
          items: orderData.items || [],
          customer_notes: notes
        };
        const { data, error } = await supabase
          .from('orders')
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        console.log("✅ [Supabase] Order created successfully:", data.id);
        return { success: true, data };
      } catch (e) {
        console.error("❌ [Supabase] createOrder error:", e.message || e);
        return { success: false, error: e.message || String(e) };
      }
    },

    async updateOrderStatus(orderId, status, paymentStatus = null) {
      if (!isReady) initClient();
      if (!isReady || !supabase) return false;
      try {
        const updates = { status, updated_at: new Date().toISOString() };
        if (paymentStatus) updates.payment_status = paymentStatus;
        const { error } = await supabase
          .from('orders')
          .update(updates)
          .eq('id', orderId);
        return !error;
      } catch (e) {
        console.error("[Supabase] updateOrderStatus failed:", e);
        return false;
      }
    },

    // 5. Accounting & Ledger Transactions
    async getLedgerTransactions() {
      if (!isReady) initClient();
      if (!isReady || !supabase) return null;
      try {
        const { data, error } = await supabase
          .from('ledger_transactions')
          .select('*')
          .order('transaction_date', { ascending: false });
        if (error) throw error;
        return data;
      } catch (e) {
        console.warn("[Supabase] getLedgerTransactions fallback to local:", e.message);
        return null;
      }
    },

    async insertLedgerTransaction(txn) {
      if (!isReady) initClient();
      if (!isReady || !supabase) return null;
      try {
        const { data, error } = await supabase
          .from('ledger_transactions')
          .insert([txn])
          .select()
          .single();
        if (error) throw error;
        return data;
      } catch (e) {
        console.warn("[Supabase] insertLedgerTransaction failed:", e.message);
        return null;
      }
    },

    // 6. Realtime Subscriptions
    subscribeOrders(onInsert, onUpdate) {
      if (!isReady) initClient();
      if (!isReady || !supabase) {
        // Retry subscription in 2 seconds
        setTimeout(() => this.subscribeOrders(onInsert, onUpdate), 2000);
        return null;
      }
      try {
        return supabase
          .channel('public:orders')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, payload => {
            if (onInsert) onInsert(payload.new);
          })
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, payload => {
            if (onUpdate) onUpdate(payload.new);
          })
          .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
              console.log("🟢 [Supabase Realtime] Orders channel SUBSCRIBED");
            } else if (status === 'CHANNEL_ERROR') {
              console.warn("⚠️ [Supabase Realtime] Channel error:", err);
            }
          });
      } catch (e) {
        console.error("[Supabase] Realtime subscribe error:", e);
        return null;
      }
    }
  };

  // Immediate init or deferred once DOM/SDK ready
  if (window.supabase && typeof window.supabase.createClient === 'function') {
    initClient();
  } else {
    // Check every 250ms up to 10 seconds for SDK availability
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (window.supabase && typeof window.supabase.createClient === 'function') {
        clearInterval(interval);
        initClient();
      } else if (attempts > 40) {
        clearInterval(interval);
      }
    }, 250);
  }

  window.SupabaseService = SupabaseService;
})(window);
