/**
 * ครัวลุงหนุ่ย (Krua Lung Nui) - Authentication & Multi-User RBAC Engine
 * Architecture:
 * - Roles: 👑 Owner, 🛡️ Admin, 👨‍💼 Manager, 💵 Cashier, 👨‍🍳 Kitchen
 * - Multiple Users per role (e.g. Admin 1, Admin 2, Manager A, Cashier 1, Cashier 2)
 * - Individual Salted Hash PINs per user
 * - Real-time Audit Logging (Records who logged in, when, under which role)
 * - Granular Permissions for Admin, Manager, Cashier, and Kitchen
 */

const ROLES = {
  owner: { name: "เจ้าของร้าน (Owner)", icon: "👑", page: "admin.html", color: "#d97706", bg: "#fef3c7", border: "#fde68a" },
  admin: { name: "แอดมิน (Admin)", icon: "🛡️", page: "admin.html", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  manager: { name: "ผู้จัดการร้าน (Manager)", icon: "👨‍💼", page: "admin.html", color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  cashier: { name: "แคชเชียร์ (POS)", icon: "💵", page: "cashier.html", color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
  kitchen: { name: "แผนกครัว (KDS)", icon: "👨‍🍳", page: "kitchen.html", color: "#ea580c", bg: "#fff7ed", border: "#fed7aa" }
};

const DEPARTMENTS = ROLES; // Aliased for backward compatibility

const PIN_SALT = "krua_lung_nui_sec_salt_2026";

/**
 * Robust lightweight 32-bit FNV-1a based salted hash function
 */
function hashPin(pin) {
  if (!pin) return "";
  const str = PIN_SALT + "#" + String(pin).trim();
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return ("00000000" + (hash >>> 0).toString(16)).slice(-8);
}

// Initial Factory Users
const INITIAL_USERS = [
  {
    id: "usr_owner",
    name: "เจ้าของร้าน (Owner Main)",
    role: "owner",
    pinHash: hashPin("8888"),
    active: true,
    createdAt: "2026-09-16T00:00:00.000Z"
  },
  {
    id: "usr_admin_1",
    name: "แอดมิน 1 (Admin Main)",
    role: "admin",
    pinHash: hashPin("1111"),
    active: true,
    createdAt: "2026-09-16T00:00:00.000Z"
  },
  {
    id: "usr_manager_1",
    name: "ผู้จัดการ 1 (Manager)",
    role: "manager",
    pinHash: hashPin("2222"),
    active: true,
    createdAt: "2026-09-16T00:00:00.000Z"
  },
  {
    id: "usr_cashier_1",
    name: "แคชเชียร์ 1 (POS)",
    role: "cashier",
    pinHash: hashPin("3333"),
    active: true,
    createdAt: "2026-09-16T00:00:00.000Z"
  },
  {
    id: "usr_kitchen_1",
    name: "หัวหน้าครัว 1 (Chef)",
    role: "kitchen",
    pinHash: hashPin("4444"),
    active: true,
    createdAt: "2026-09-16T00:00:00.000Z"
  }
];

// Default Role Permissions
const DEFAULT_ROLE_PERMISSIONS = {
  admin: {
    canManageMenus: true,
    canManageTables: true,
    canViewReports: true,
    canViewAccounting: true,
    canViewLedger: true,
    canViewLoans: false,
    canAccessSettings: true
  },
  manager: {
    canManageMenus: true,
    canManageTables: true,
    canViewReports: true,
    canViewAccounting: true,
    canViewLedger: true,
    canViewLoans: false,
    canAccessSettings: false
  },
  cashier: {
    canCancelOrder: false,
    canGiveDiscount: false,
    canViewDailyTotal: true
  },
  kitchen: {
    canToggleStock: true
  }
};

// ============================================================================
// Direct Cloud Synchronization Engine (Zero-Dependency REST API)
// ============================================================================
const SUPABASE_REST_URL = "https://myajcbynabcwfmlvqpwv.supabase.co/rest/v1/shop_settings";
const SUPABASE_REST_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15YWpjYnluYWJjd2ZtbHZxcHd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0NjI2MTgsImV4cCI6MjEwNTAzODYxOH0.BjjFAOIQF_qakKB2l9-IUwEONgB_jIXIx7VixLr3i7w";

async function syncUsersDirectlyToSupabase(users) {
  try {
    const list = users || (typeof getAllUsers === "function" ? getAllUsers() : []);
    if (!list || list.length === 0) return false;
    const payload = list.map(u => ({
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
      shop_name: "SYS_CONFIG_USERS",
      address: JSON.stringify(payload),
      updated_at: now
    }]);
    const res = await fetch(SUPABASE_REST_URL, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_REST_KEY,
        "Authorization": `Bearer ${SUPABASE_REST_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=representation"
      },
      body
    });
    if (res.ok) {
      localStorage.setItem("pos_users_updated_at", now);
      console.log("☁️ [Auth REST] Synced users to cloud successfully:", payload.length, "users");
      return true;
    }
  } catch (err) {
    console.warn("⚠️ [Auth REST] Direct push to cloud failed:", err.message);
  }
  return false;
}

async function syncUsersDirectlyFromSupabase(callback) {
  try {
    const res = await fetch(`${SUPABASE_REST_URL}?id=eq.99&select=id,shop_name,address,updated_at&_cb=${Date.now()}`, {
      method: "GET",
      headers: {
        "apikey": SUPABASE_REST_KEY,
        "Authorization": `Bearer ${SUPABASE_REST_KEY}`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache"
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
            console.log("🔄 [Auth REST] Downloaded fresh users from cloud:", cloudUsers.length, "users");
            localStorage.setItem("pos_users", cloudStr);
            if (rows[0].updated_at) localStorage.setItem("pos_users_updated_at", rows[0].updated_at);
            if (typeof callback === "function") callback(cloudUsers);
            window.dispatchEvent(new Event("storage"));
            return cloudUsers;
          }
          return cloudUsers;
        }
      }
    }
  } catch (err) {
    console.warn("⚠️ [Auth REST] Direct fetch from cloud failed:", err.message);
  }
  return null;
}

// ============================================================================
// User Management Engine
// ============================================================================
function getAllUsers() {
  try {
    const raw = localStorage.getItem("pos_users");
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading pos_users:", e);
  }

  // Check if owner pin was previously saved in pos_department_pins
  const initial = JSON.parse(JSON.stringify(INITIAL_USERS));
  try {
    const deptPins = JSON.parse(localStorage.getItem("pos_department_pins") || "{}");
    if (deptPins.owner) initial[0].pinHash = deptPins.owner;
  } catch (e) {}

  localStorage.setItem("pos_users", JSON.stringify(initial));
  return initial;
}

function saveUsers(users) {
  localStorage.setItem("pos_users", JSON.stringify(users));
  if (typeof window !== "undefined") {
    // 1. Direct REST push (Immediate, zero-dependency)
    syncUsersDirectlyToSupabase(users);
    // 2. SupabaseService push if available
    if (window.SupabaseService && typeof window.SupabaseService.syncUsersToCloud === "function") {
      window.SupabaseService.syncUsersToCloud(users);
    }
  }
}

function getUserById(userId) {
  const users = getAllUsers();
  return users.find(u => u.id === userId) || null;
}

function getUsersByRole(role) {
  const users = getAllUsers();
  return users.filter(u => u.role === role);
}

function addUser({ name, role, pin }) {
  if (!name || !name.trim()) return { success: false, message: "กรุณาระบุชื่อผู้ใช้งาน" };
  if (!role || !ROLES[role]) return { success: false, message: "ระดับสิทธิ์ไม่ถูกต้อง" };
  if (!pin || String(pin).trim().length < 4) return { success: false, message: "รหัส PIN ต้องมีความยาวอย่างน้อย 4 หลัก" };

  const users = getAllUsers();
  const newUser = {
    id: "usr_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
    name: name.trim(),
    role: role,
    pinHash: hashPin(pin),
    active: true,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers(users);

  logUserActivity(
    getCurrentUser()?.id || "system",
    getCurrentUser()?.name || "เจ้าของร้าน",
    "owner",
    `เพิ่มผู้ใช้งานใหม่: ${newUser.name} (${ROLES[role].name})`,
    "SUCCESS"
  );

  return { success: true, user: newUser, message: `เพิ่มผู้ใช้งาน ${newUser.name} สำเร็จ` };
}

function updateUser(userId, { name, role, pin, active }) {
  const users = getAllUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) return { success: false, message: "ไม่พบผู้ใช้งานในระบบ" };

  const user = users[userIndex];

  if (name && name.trim()) user.name = name.trim();
  if (role && ROLES[role]) user.role = role;
  if (pin && String(pin).trim().length >= 4) user.pinHash = hashPin(pin);
  if (active !== undefined) user.active = !!active;
  user.updatedAt = new Date().toISOString();

  users[userIndex] = user;
  saveUsers(users);

  // Sync active session if this user is currently logged in
  const cur = getCurrentUser();
  if (cur && cur.id === userId) {
    localStorage.setItem("pos_current_user", JSON.stringify(user));
    localStorage.setItem("pos_user_role", user.role);
    if (typeof updateTopNavUserBadge === "function") updateTopNavUserBadge();
  }

  logUserActivity(
    getCurrentUser()?.id || "system",
    getCurrentUser()?.name || "เจ้าของร้าน",
    "owner",
    `อัปเดตข้อมูลผู้ใช้งาน: ${user.name} (${ROLES[user.role].name})`,
    "SUCCESS"
  );

  return { success: true, user, message: `อัปเดตข้อมูลของ ${user.name} สำเร็จ` };
}

function deleteUser(userId) {
  const users = getAllUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return { success: false, message: "ไม่พบผู้ใช้งาน" };

  // Cannot delete last owner
  if (user.role === "owner") {
    const ownerCount = users.filter(u => u.role === "owner").length;
    if (ownerCount <= 1) {
      return { success: false, message: "ไม่สามารถลบ Owner คนสุดท้ายของระบบได้" };
    }
  }

  const remaining = users.filter(u => u.id !== userId);
  saveUsers(remaining);

  // Sync active session if the deleted user was currently logged in
  const cur = getCurrentUser();
  if (cur && cur.id === userId) {
    const nextUser = remaining.find(u => u.role === cur.role && u.active) || remaining.find(u => u.active);
    if (nextUser) {
      localStorage.setItem("pos_current_user", JSON.stringify(nextUser));
      localStorage.setItem("pos_user_role", nextUser.role);
    } else {
      localStorage.removeItem("pos_current_user");
      localStorage.removeItem("pos_user_role");
    }
    if (typeof updateTopNavUserBadge === "function") updateTopNavUserBadge();
  }

  logUserActivity(
    getCurrentUser()?.id || "system",
    getCurrentUser()?.name || "เจ้าของร้าน",
    "owner",
    `ลบผู้ใช้งาน: ${user.name} (${ROLES[user.role].name}) ออกจากระบบ`,
    "SUCCESS"
  );

  return { success: true, message: `ลบผู้ใช้งาน ${user.name} สำเร็จ` };
}

function toggleUserStatus(userId) {
  const users = getAllUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return { success: false, message: "ไม่พบผู้ใช้งาน" };

  if (user.role === "owner") {
    return { success: false, message: "ไม่สามารถระงับสิทธิ์ของเจ้าของร้านได้" };
  }

  user.active = !user.active;
  saveUsers(users);

  logUserActivity(
    getCurrentUser()?.id || "system",
    getCurrentUser()?.name || "เจ้าของร้าน",
    "owner",
    `${user.active ? 'เปิดใช้งาน' : 'ระงับการใช้งาน'} ผู้ใช้: ${user.name}`,
    "SUCCESS"
  );

  return { success: true, active: user.active, message: `${user.active ? 'เปิดใช้งาน' : 'ระงับการใช้งาน'} ${user.name} เรียบร้อยแล้ว` };
}

// ============================================================================
// Session & Authentication
// ============================================================================
function getCurrentUser() {
  try {
    const raw = localStorage.getItem("pos_current_user");
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

function getCurrentRole() {
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.role) return currentUser.role;
  return localStorage.getItem("pos_user_role") || null;
}

function isOwner() {
  return getCurrentRole() === "owner";
}

function isOwnerPinConfigured() {
  const users = getAllUsers();
  const owner = users.find(u => u.role === "owner");
  return !!owner && localStorage.getItem("pos_owner_pin_configured") === "true";
}

function verifyDepartmentPin(deptOrUserId, inputPin) {
  if (!deptOrUserId || !inputPin) return false;
  const cleanPin = String(inputPin).trim();
  // Master PIN 8888 can always verify for emergency override
  if (cleanPin === "8888") return true;

  const users = getAllUsers();

  // Check by userId first
  const user = users.find(u => u.id === deptOrUserId);
  if (user) {
    const inputHash = hashPin(cleanPin);
    if (user.pinHash === inputHash || user.pinHash === cleanPin) return true;
    if (user.role === 'admin' && (cleanPin === '1234' || cleanPin === '1111') && 
        (user.pinHash === hashPin('1111') || user.pinHash === hashPin('1234') || user.pinHash === '1111' || user.pinHash === '1234')) return true;
  }

  // Check by role (takes first active user in role, e.g. 'owner')
  const userInRole = users.find(u => u.role === deptOrUserId && u.active);
  if (userInRole) {
    const inputHash = hashPin(cleanPin);
    if (userInRole.pinHash === inputHash || userInRole.pinHash === cleanPin) return true;
    if (userInRole.role === 'admin' && (cleanPin === '1234' || cleanPin === '1111') && 
        (userInRole.pinHash === hashPin('1111') || userInRole.pinHash === hashPin('1234') || userInRole.pinHash === '1111' || userInRole.pinHash === '1234')) return true;
  }

  return false;
}

function updateDepartmentPin(deptOrUserId, newPin) {
  if (!deptOrUserId || !newPin || String(newPin).trim().length < 4) {
    return { success: false, message: "รหัส PIN ต้องมีอย่างน้อย 4 หลัก (4-6 หลัก)" };
  }
  const users = getAllUsers();
  let user = users.find(u => u.id === deptOrUserId);
  if (!user) user = users.find(u => u.role === deptOrUserId);
  
  if (!user) return { success: false, message: "ไม่พบผู้ใช้งาน" };

  user.pinHash = hashPin(String(newPin).trim());
  saveUsers(users);

  if (user.role === "owner") {
    localStorage.setItem("pos_owner_pin_configured", "true");
  }

  // Also update pos_current_user if the updated user is currently logged in
  const cur = getCurrentUser();
  if (cur && (cur.id === user.id || cur.role === user.role)) {
    cur.pinHash = user.pinHash;
    localStorage.setItem("pos_current_user", JSON.stringify(cur));
  }

  return { success: true, message: `เปลี่ยนรหัส PIN ของ ${user.name} สำเร็จ` };
}

function resetAllPinsToFactoryDefault() {
  const users = getAllUsers();
  const defaults = {
    owner: hashPin("8888"),
    admin: hashPin("1111"),
    manager: hashPin("2222"),
    cashier: hashPin("3333"),
    kitchen: hashPin("4444")
  };
  users.forEach(u => {
    if (defaults[u.role]) {
      u.pinHash = defaults[u.role];
      u.active = true;
    }
  });
  saveUsers(users);
  localStorage.setItem("pos_owner_pin_configured", "true");
  resetLoginRateLimit();

  const cur = getCurrentUser();
  if (cur && defaults[cur.role]) {
    cur.pinHash = defaults[cur.role];
    localStorage.setItem("pos_current_user", JSON.stringify(cur));
  }

  return {
    success: true,
    message: "รีเซ็ตรหัส PIN ทั้งหมดกลับเป็นค่าเริ่มต้นจากโรงงานเรียบร้อยแล้ว"
  };
}

function changeUserPinDirect(deptOrUserId, oldPin, newPin) {
  if (!deptOrUserId) return { success: false, message: "กรุณาระบุแผนกหรือผู้ใช้งาน" };
  const cleanNew = String(newPin || "").trim();
  if (!cleanNew || cleanNew.length < 4) {
    return { success: false, message: "รหัส PIN ใหม่ต้องมีอย่างน้อย 4 หลัก (4-6 หลัก)" };
  }

  if (oldPin) {
    const cleanOld = String(oldPin).trim();
    const verified = verifyDepartmentPin(deptOrUserId, cleanOld);
    if (!verified) {
      return { success: false, message: "❌ รหัส PIN เดิมไม่ถูกต้อง (หรือกรอก Master PIN 8888 เพื่อข้าม)" };
    }
  }

  const result = updateDepartmentPin(deptOrUserId, cleanNew);
  resetLoginRateLimit();
  return result;
}

// Anti-Brute-Force Rate Limiting
function checkLoginRateLimit() {
  const attempts = parseInt(localStorage.getItem("pos_login_failed_count") || "0", 10);
  const lockoutUntil = parseInt(localStorage.getItem("pos_login_lockout_until") || "0", 10);
  const now = Date.now();

  if (lockoutUntil > now) {
    const remainingSeconds = Math.ceil((lockoutUntil - now) / 1000);
    return { locked: true, remainingSeconds };
  }
  return { locked: false, attempts };
}

function recordFailedAttempt(user = null) {
  let attempts = parseInt(localStorage.getItem("pos_login_failed_count") || "0", 10) + 1;
  localStorage.setItem("pos_login_failed_count", attempts.toString());

  if (user) {
    logUserActivity(user.id, user.name, user.role, "กรอกรหัส PIN ผิดพลาด (Failed Attempt)", "FAILED");
  }
  
  if (attempts >= 5) {
    const lockoutUntil = Date.now() + (30 * 1000);
    localStorage.setItem("pos_login_lockout_until", lockoutUntil.toString());
    return { locked: true, remainingSeconds: 30 };
  }
  return { locked: false, attempts };
}

function resetLoginRateLimit() {
  localStorage.removeItem("pos_login_failed_count");
  localStorage.removeItem("pos_login_lockout_until");
}

function loginUser(userId, pin) {
  const user = getUserById(userId);
  if (!user) return { success: false, message: "ไม่พบผู้ใช้งาน" };

  if (!user.active) {
    alert("⚠️ บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อเจ้าของร้าน (Owner)");
    return false;
  }

  const rateLimit = checkLoginRateLimit();
  if (rateLimit.locked) {
    alert(`🔒 ระบบถูกระงับชั่วคราวเนื่องจากใส่รหัสผิดเกินกำหนด\nกรุณารออีก ${rateLimit.remainingSeconds} วินาที`);
    return false;
  }

  const cleanPin = String(pin || "").trim();
  const inputHash = hashPin(cleanPin);
  const isMatch = user.pinHash === inputHash || 
                  user.pinHash === cleanPin ||
                  // Owner emergency master PIN 8888 always logs in
                  (user.role === 'owner' && cleanPin === '8888') ||
                  // Admin accepts either 1111 or 1234 on factory setting
                  (user.role === 'admin' && (cleanPin === '1234' || cleanPin === '1111') && 
                   (user.pinHash === hashPin('1111') || user.pinHash === hashPin('1234') || user.pinHash === '1111' || user.pinHash === '1234'));

  if (!cleanPin || !isMatch) {
    const failStatus = recordFailedAttempt(user);
    if (failStatus.locked) {
      alert(`⚠️ รหัส PIN ไม่ถูกต้อง 5 ครั้งติดต่อกัน!\nระบบระงับการเข้าสู่ระบบ 30 วินาทีเพื่อความปลอดภัย`);
    } else {
      const remaining = 5 - failStatus.attempts;
      alert(`⚠️ รหัส PIN ไม่ถูกต้อง! (เหลือโอกาสกรอกอีก ${remaining} ครั้ง)`);
    }
    return false;
  }

  // Success
  resetLoginRateLimit();
  localStorage.setItem("pos_user_role", user.role);
  localStorage.setItem("pos_current_user", JSON.stringify(user));
  localStorage.setItem("pos_auth_time", Date.now());

  logUserActivity(user.id, user.name, user.role, "เข้าสู่ระบบสำเร็จ (Login Success)", "SUCCESS");

  const targetPage = ROLES[user.role]?.page || "admin.html";
  window.location.href = targetPage;
  return true;
}

// Backward-compatible wrapper for loginDepartment
function loginDepartment(dept, pin) {
  const users = getUsersByRole(dept).filter(u => u.active);
  if (users.length === 0) {
    alert("ไม่พบบัญชีผู้ใช้งานในแผนกนี้");
    return false;
  }
  return loginUser(users[0].id, pin);
}

function logoutDepartment() {
  const user = getCurrentUser();
  if (user) {
    logUserActivity(user.id, user.name, user.role, "ออกจากระบบ (Logout)", "SUCCESS");
  }
  localStorage.removeItem("pos_user_role");
  localStorage.removeItem("pos_current_user");
  localStorage.removeItem("pos_auth_time");
  window.location.href = "login.html";
}

function verifyPageAccess(requiredRole = null) {
  const currentRole = getCurrentRole();
  const currentUser = getCurrentUser();

  if (!currentRole || !currentUser) {
    window.location.href = "login.html";
    return false;
  }
  
  // Owner has absolute access to every page
  if (currentRole === "owner") return true;

  // If page requires owner only
  if (requiredRole === "owner" && currentRole !== "owner") {
    alert("⚠️ หน้านี้สำหรับเจ้าของร้าน (Owner) เท่านั้น");
    window.location.href = ROLES[currentRole]?.page || "login.html";
    return false;
  }

  // Admin / Manager access to backoffice
  if (requiredRole === "admin" && (currentRole === "admin" || currentRole === "manager")) {
    return true;
  }

  // General department check
  if (requiredRole && currentRole !== requiredRole && currentRole !== "admin") {
    alert(`⚠️ บัญชีของคุณ (${currentUser.name} - ${ROLES[currentRole]?.name || currentRole}) ไม่มีสิทธิ์เข้าถึงหน้านี้`);
    window.location.href = ROLES[currentRole]?.page || "login.html";
    return false;
  }

  return true;
}

// ============================================================================
// Audit Logging Engine (Track who logged in & when)
// ============================================================================
function getAuditLogs() {
  try {
    const raw = localStorage.getItem("pos_audit_logs");
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

function logUserActivity(userId, userName, role, action, status = "SUCCESS") {
  try {
    const logs = getAuditLogs();
    const now = new Date();
    const timeStr = now.toLocaleDateString("th-TH", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit"
    });

    const newLog = {
      id: "log_" + Date.now() + "_" + Math.random().toString(36).substr(2, 3),
      timestamp: timeStr,
      iso: now.toISOString(),
      userId: userId || "unknown",
      userName: userName || "ไม่ระบุชื่อ",
      role: role || "unknown",
      roleName: ROLES[role]?.name || role,
      action: action,
      status: status
    };

    logs.unshift(newLog); // prepend latest
    if (logs.length > 200) logs.pop(); // keep last 200 logs
    localStorage.setItem("pos_audit_logs", JSON.stringify(logs));
  } catch (e) {
    console.error("Error writing audit log:", e);
  }
}

function clearAuditLogs() {
  localStorage.setItem("pos_audit_logs", JSON.stringify([]));
}

// ============================================================================
// Granular Role Permissions
// ============================================================================
function getRolePermissions() {
  try {
    const raw = localStorage.getItem("pos_role_permissions");
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        admin: { ...DEFAULT_ROLE_PERMISSIONS.admin, ...(parsed.admin || {}) },
        manager: { ...DEFAULT_ROLE_PERMISSIONS.manager, ...(parsed.manager || {}) },
        cashier: { ...DEFAULT_ROLE_PERMISSIONS.cashier, ...(parsed.cashier || {}) },
        kitchen: { ...DEFAULT_ROLE_PERMISSIONS.kitchen, ...(parsed.kitchen || {}) }
      };
    }
  } catch (e) {}
  return JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS));
}

function saveRolePermissions(perms) {
  localStorage.setItem("pos_role_permissions", JSON.stringify(perms));
}

function canRoleAccess(permissionKey) {
  const currentRole = getCurrentRole();
  if (currentRole === "owner") return true;
  if (!currentRole) return false;

  const perms = getRolePermissions();
  if (perms[currentRole] && perms[currentRole][permissionKey] !== undefined) {
    return !!perms[currentRole][permissionKey];
  }
  return false;
}

// ============================================================================
// UI Top Nav User Badge Update
// ============================================================================
function updateTopNavUserBadge() {
  const currentRole = getCurrentRole();
  const currentUser = getCurrentUser();
  const badgeEl = document.getElementById("navUserBadge");
  if (!badgeEl) return;

  if (currentUser && currentRole && ROLES[currentRole]) {
    const info = ROLES[currentRole];
    badgeEl.style.display = "flex";
    badgeEl.style.alignItems = "center";
    badgeEl.style.gap = "0.4rem";
    badgeEl.style.background = info.bg;
    badgeEl.style.borderColor = info.border;
    badgeEl.style.color = info.color;
    badgeEl.style.fontWeight = "700";

    badgeEl.innerHTML = `<span>${info.icon}</span> <span>${currentUser.name}</span> <span style="font-size:0.75rem; opacity:0.85; font-weight:600;">[${info.name}]</span>`;
    badgeEl.title = `ผู้ปฏิบัติงาน: ${currentUser.name} | ระดับสิทธิ์: ${info.name}`;
  }
}

// Expose globally
window.ROLES = ROLES;
window.DEPARTMENTS = ROLES;
window.getAllUsers = getAllUsers;
window.saveUsers = saveUsers;
window.getUserById = getUserById;
window.getUsersByRole = getUsersByRole;
window.addUser = addUser;
window.updateUser = updateUser;
window.deleteUser = deleteUser;
window.toggleUserStatus = toggleUserStatus;
window.loginUser = loginUser;
window.loginDepartment = loginDepartment;
window.logoutDepartment = logoutDepartment;
window.verifyPageAccess = verifyPageAccess;
window.getCurrentUser = getCurrentUser;
window.getCurrentRole = getCurrentRole;
window.isOwner = isOwner;
window.updateDepartmentPin = updateDepartmentPin;
window.verifyDepartmentPin = verifyDepartmentPin;
window.checkLoginRateLimit = checkLoginRateLimit;
window.isOwnerPinConfigured = isOwnerPinConfigured;
window.getAuditLogs = getAuditLogs;
window.logUserActivity = logUserActivity;
window.clearAuditLogs = clearAuditLogs;
window.getRolePermissions = getRolePermissions;
window.saveRolePermissions = saveRolePermissions;
window.canRoleAccess = canRoleAccess;
window.updateTopNavUserBadge = updateTopNavUserBadge;
window.resetAllPinsToFactoryDefault = resetAllPinsToFactoryDefault;
window.changeUserPinDirect = changeUserPinDirect;
window.syncUsersDirectlyToSupabase = syncUsersDirectlyToSupabase;
window.syncUsersDirectlyFromSupabase = syncUsersDirectlyFromSupabase;

// Auto-sync users with Supabase Cloud (Both REST and SDK)
if (typeof window !== "undefined") {
  const tryCloudSync = () => {
    const onSynced = (users) => {
      if (typeof refreshUserCounts === "function") refreshUserCounts();
      if (typeof renderOwnerUserTable === "function") renderOwnerUserTable();
      if (typeof updateTopNavUserBadge === "function") updateTopNavUserBadge();
    };

    // 1. Immediate Direct REST fetch
    syncUsersDirectlyFromSupabase(onSynced);

    // 2. SupabaseService fetch & subscribe
    if (window.SupabaseService && typeof window.SupabaseService.syncUsersFromCloud === "function") {
      window.SupabaseService.syncUsersFromCloud(onSynced);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(tryCloudSync, 100));
  } else {
    setTimeout(tryCloudSync, 50);
  }

  window.addEventListener("focus", () => setTimeout(tryCloudSync, 50));
}


