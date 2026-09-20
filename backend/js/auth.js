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
// User Management Engine
// ============================================================================
function getAllUsers() {
  try {
    const raw = localStorage.getItem("pos_users");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
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
  const users = getAllUsers();

  // Check by userId first
  const user = users.find(u => u.id === deptOrUserId);
  if (user) {
    const inputHash = hashPin(inputPin);
    return user.pinHash === inputHash || user.pinHash === String(inputPin).trim();
  }

  // Check by role (takes first active user in role, e.g. 'owner')
  const userInRole = users.find(u => u.role === deptOrUserId && u.active);
  if (userInRole) {
    const inputHash = hashPin(inputPin);
    return userInRole.pinHash === inputHash || userInRole.pinHash === String(inputPin).trim();
  }

  return false;
}

function updateDepartmentPin(deptOrUserId, newPin) {
  if (!deptOrUserId || !newPin || String(newPin).trim().length < 4) {
    return { success: false, message: "รหัส PIN ต้องมีอย่างน้อย 4 หลัก" };
  }
  const users = getAllUsers();
  let user = users.find(u => u.id === deptOrUserId);
  if (!user) user = users.find(u => u.role === deptOrUserId);
  
  if (!user) return { success: false, message: "ไม่พบผู้ใช้งาน" };

  user.pinHash = hashPin(newPin);
  saveUsers(users);

  if (user.role === "owner") {
    localStorage.setItem("pos_owner_pin_configured", "true");
  }

  return { success: true, message: `เปลี่ยนรหัส PIN ของ ${user.name} สำเร็จ` };
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

  const inputHash = hashPin(pin);
  const isMatch = user.pinHash === inputHash || user.pinHash === String(pin).trim();

  if (!pin || !isMatch) {
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
