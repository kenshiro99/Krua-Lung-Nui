/**
 * ครัวลุงหนุ่ย (Krua Lung Nui) - Authentication & Department Access Controller
 */

const DEPARTMENTS = {
  admin: { name: "แอดมิน (ผู้จัดการ)", icon: "👨‍💼", pin: "1234", page: "admin.html" },
  cashier: { name: "แคชเชียร์ (POS)", icon: "💵", pin: "2222", page: "cashier.html" },
  kitchen: { name: "แผนกครัว (KDS)", icon: "👨‍🍳", pin: "3333", page: "kitchen.html" }
};

function getCurrentRole() {
  return localStorage.getItem("pos_user_role");
}

function verifyPageAccess(requiredRole = null) {
  const currentRole = getCurrentRole();
  if (!currentRole) {
    window.location.href = "login.html";
    return false;
  }
  if (requiredRole && requiredRole !== "admin" && currentRole !== requiredRole && currentRole !== "admin") {
    alert(`⚠️ บัญชีของคุณ (${DEPARTMENTS[currentRole]?.name}) ไม่มีสิทธิ์เข้าถึงหน้านี้`);
    window.location.href = DEPARTMENTS[currentRole]?.page || "login.html";
    return false;
  }
  return true;
}

function loginDepartment(dept, pin = null) {
  const deptConfig = DEPARTMENTS[dept];
  if (!deptConfig) return false;

  if (pin && pin !== deptConfig.pin) {
    return false;
  }

  localStorage.setItem("pos_user_role", dept);
  window.location.href = deptConfig.page;
  return true;
}

function logoutDepartment() {
  localStorage.removeItem("pos_user_role");
  window.location.href = "login.html";
}

function updateTopNavUserBadge() {
  const currentRole = getCurrentRole();
  const badgeEl = document.getElementById("navUserBadge");
  if (badgeEl && currentRole && DEPARTMENTS[currentRole]) {
    const info = DEPARTMENTS[currentRole];
    badgeEl.innerHTML = `<span>${info.icon}</span> <span>${info.name}</span>`;
  }
}
