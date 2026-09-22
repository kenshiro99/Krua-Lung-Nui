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

    // 6. User Accounts & Multi-User RBAC Cloud Sync
    async syncUsersToCloud(users) {
      const config = getConfig();
      const userList = (users && Array.isArray(users)) 
        ? users 
        : (typeof getAllUsers === 'function' ? getAllUsers() : []);
        
      if (!userList || userList.length === 0) return false;

      const payload = userList.map(u => ({
        id: u.id,
        name: u.name,
        role: u.role,
        pinHash: u.pinHash,
        active: u.active !== false,
        createdAt: u.createdAt || new Date().toISOString()
      }));

      const now = new Date().toISOString();
      const body = JSON.stringify([{
        id: 99,
        shop_name: 'SYS_CONFIG_USERS',
        address: JSON.stringify(payload),
        updated_at: now
      }]);

      // 1. Direct REST Call (Instant, zero-dependency)
      try {
        const res = await fetch(`${config.url}/rest/v1/shop_settings`, {
          method: 'POST',
          headers: {
            'apikey': config.key,
            'Authorization': `Bearer ${config.key}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates,return=representation'
          },
          body: body
        });
        if (res.ok) {
          localStorage.setItem("pos_users_updated_at", now);
          console.log("☁️ [Supabase REST] Synced users to cloud successfully:", payload.length, "users");
          return true;
        }
      } catch (err) {
        console.warn("⚠️ [Supabase REST] Direct POST failed, trying SDK:", err.message);
      }

      // 2. SDK Fallback
      if (!isReady) initClient();
      if (isReady && supabase) {
        try {
          const { error } = await supabase.from('shop_settings').upsert({
            id: 99,
            shop_name: 'SYS_CONFIG_USERS',
            address: JSON.stringify(payload),
            updated_at: now
          });
          if (!error) {
            localStorage.setItem("pos_users_updated_at", now);
            console.log("☁️ [Supabase SDK] Synced users to cloud successfully");
            return true;
          }
        } catch(e) {}
      }

      return false;
    },

    async syncUsersFromCloud(onUpdated) {
      const config = getConfig();

      // 1. Direct REST Call with Cache-Busting
      try {
        const res = await fetch(`${config.url}/rest/v1/shop_settings?id=eq.99&select=id,shop_name,address,updated_at&_cb=${Date.now()}`, {
          method: 'GET',
          headers: {
            'apikey': config.key,
            'Authorization': `Bearer ${config.key}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });

        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows) && rows.length > 0 && rows[0].address) {
            const cloudUsers = JSON.parse(rows[0].address);
            if (Array.isArray(cloudUsers) && cloudUsers.length > 0) {
              const localStr = localStorage.getItem("pos_users");
              const cloudStr = JSON.stringify(cloudUsers);
              if (localStr !== cloudStr) {
                console.log("🔄 [Supabase REST] Synced updated users from cloud:", cloudUsers.length, "users");
                localStorage.setItem("pos_users", cloudStr);
                if (rows[0].updated_at) localStorage.setItem("pos_users_updated_at", rows[0].updated_at);
                if (typeof onUpdated === 'function') {
                  try { onUpdated(cloudUsers); } catch(err) { console.error(err); }
                }
                window.dispatchEvent(new Event('storage'));
              }
              return cloudUsers;
            }
          }
        }
      } catch (err) {
        console.warn("⚠️ [Supabase REST] Direct GET failed, trying SDK:", err.message);
      }

      // 2. SDK Fallback
      if (!isReady) initClient();
      if (isReady && supabase) {
        try {
          const { data, error } = await supabase
            .from('shop_settings')
            .select('id, shop_name, address, updated_at')
            .eq('id', 99)
            .maybeSingle();

          if (!error && data && data.address) {
            const cloudUsers = JSON.parse(data.address);
            if (Array.isArray(cloudUsers) && cloudUsers.length > 0) {
              const localStr = localStorage.getItem("pos_users");
              const cloudStr = JSON.stringify(cloudUsers);
              if (localStr !== cloudStr) {
                localStorage.setItem("pos_users", cloudStr);
                if (data.updated_at) localStorage.setItem("pos_users_updated_at", data.updated_at);
                if (typeof onUpdated === 'function') onUpdated(cloudUsers);
                window.dispatchEvent(new Event('storage'));
              }
              return cloudUsers;
            }
          }
        } catch (e) {}
      }

      return null;
    },

    subscribeUsers(onUpdated) {
      if (!isReady) initClient();
      if (!isReady || !supabase) {
        setTimeout(() => this.subscribeUsers(onUpdated), 2500);
        return null;
      }
      try {
        return supabase
          .channel('public:shop_settings_users')
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'shop_settings',
            filter: 'id=eq.99'
          }, payload => {
            if (payload.new && payload.new.address) {
              try {
                const cloudUsers = JSON.parse(payload.new.address);
                if (Array.isArray(cloudUsers) && cloudUsers.length > 0) {
                  const localStr = localStorage.getItem("pos_users");
                  const cloudStr = JSON.stringify(cloudUsers);
                  if (localStr !== cloudStr) {
                    console.log("⚡ [Supabase Realtime] User accounts updated from remote:", cloudUsers);
                    localStorage.setItem("pos_users", cloudStr);
                    if (payload.new.updated_at) localStorage.setItem("pos_users_updated_at", payload.new.updated_at);
                    if (onUpdated) onUpdated(cloudUsers);
                    window.dispatchEvent(new Event('storage'));
                  }
                }
              } catch (err) {
                console.error("Realtime user parse error:", err);
              }
            }
          })
          .subscribe();
      } catch (e) {
        console.warn("⚠️ [Supabase] Realtime subscribeUsers error:", e);
        return null;
      }
    },

    // 7. Realtime Subscriptions
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
