/**
 * ครัวลุงหนุ่ย (Krua Lung Nui) - Supabase Data Layer & Sync Engine
 * Project: myajcbynabcwfmlvqpwv (https://myajcbynabcwfmlvqpwv.supabase.co)
 * Features:
 *   - Automatic Realtime updates for Orders & Tables
 *   - Resilient Offline-First Fallback (Seamless operation when offline or no API key)
 */

(function(window) {
  const DEFAULT_URL = "https://myajcbynabcwfmlvqpwv.supabase.co";
  
  // Retrieve saved configuration from localStorage or global APP_CONFIG
  function getConfig() {
    const savedKey = localStorage.getItem("KRUA_SUPABASE_ANON_KEY");
    const savedUrl = localStorage.getItem("KRUA_SUPABASE_URL");
    const globalConfig = window.APP_CONFIG || {};

    return {
      url: savedUrl || globalConfig.SUPABASE_URL || DEFAULT_URL,
      key: savedKey || globalConfig.SUPABASE_ANON_KEY || ""
    };
  }

  let supabase = null;
  let isReady = false;

  function initClient() {
    const config = getConfig();
    if (config.url && config.key && window.supabase && typeof window.supabase.createClient === 'function') {
      try {
        supabase = window.supabase.createClient(config.url, config.key);
        isReady = true;
        console.log("🟢 [Supabase] Connected to project:", config.url);
        updateStatusBadge(true);
      } catch (err) {
        console.warn("⚠️ [Supabase] Failed to init client:", err.message);
        isReady = false;
        updateStatusBadge(false);
      }
    } else {
      isReady = false;
      updateStatusBadge(false);
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
    isConfigured: () => isReady,
    getClient: () => supabase,
    saveCredentials: (url, key) => {
      if (url) localStorage.setItem("KRUA_SUPABASE_URL", url);
      if (key) localStorage.setItem("KRUA_SUPABASE_ANON_KEY", key);
      initClient();
    },

    // 1. Menus
    async getMenus() {
      if (!isReady) return null;
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
      if (!isReady) return null;
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
      if (!isReady) return null;
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
      if (!isReady) return false;
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
      if (!isReady) return null;
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
      if (!isReady) return null;
      try {
        const payload = {
          id: orderData.id,
          table_id: orderData.tableId || null,
          table_name: orderData.tableName || 'ไม่ระบุโต๊ะ',
          order_type: orderData.orderType || 'dine-in',
          status: orderData.status || 'pending',
          payment_status: orderData.paymentStatus || 'unpaid',
          payment_method: orderData.paymentMethod || 'promptpay',
          subtotal: orderData.subtotal || 0,
          total: orderData.total || 0,
          items: orderData.items || [],
          customer_notes: orderData.notes || ''
        };
        const { data, error } = await supabase
          .from('orders')
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        return data;
      } catch (e) {
        console.warn("[Supabase] createOrder failed, fallback to local:", e.message);
        return null;
      }
    },

    async updateOrderStatus(orderId, status, paymentStatus = null) {
      if (!isReady) return false;
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
      if (!isReady) return null;
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
      if (!isReady) return null;
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
      if (!isReady) return null;
      try {
        return supabase
          .channel('public:orders')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, payload => {
            if (onInsert) onInsert(payload.new);
          })
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, payload => {
            if (onUpdate) onUpdate(payload.new);
          })
          .subscribe();
      } catch (e) {
        console.error("[Supabase] Realtime subscribe error:", e);
        return null;
      }
    }
  };

  // Auto load Supabase JS SDK from CDN if not already present
  if (!window.supabase) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = () => {
      initClient();
    };
    document.head.appendChild(script);
  } else {
    initClient();
  }

  window.SupabaseService = SupabaseService;
})(window);
