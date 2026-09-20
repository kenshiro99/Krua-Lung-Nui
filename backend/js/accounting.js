/**
 * ครัวลุงหนุ่ย (Krua Lung Nui) - Accounting & Cost Control Engine
 * รองรับ Dual-View (Cash Basis & Accrual Basis), Transaction Ledger,
 * Shift Closing & Reconciliation, และ Loan-Ledger Integration
 */

let currentAccountingView = "accrual"; // "cash" | "accrual"
let selectedLedgerCategory = "all";
let selectedLedgerChannel = "all";
let selectedLedgerDate = new Date().toISOString().split("T")[0];

// Initialize Accounting Module
function initAccountingModule() {
  const datePicker = document.getElementById("ledgerDateFilter");
  if (datePicker && !datePicker.value) {
    datePicker.value = selectedLedgerDate;
  }
}

// -------------------------------------------------------------
// 1. CALCULATIONS & DATA AGGREGATION
// -------------------------------------------------------------

function getDailyAccountingData(dateStr) {
  const settings = window.posState.settings || {};
  const initialCash = Number(settings.initialCash) || 2000;
  const targetSales = Number(settings.targetDailySales) || 8000;
  const targetFoodCostPct = Number(settings.targetFoodCostPct) || 35;
  const targetLaborCostPct = Number(settings.targetLaborCostPct) || 18;
  const targetNetMarginPct = Number(settings.targetNetMarginPct) || 15;
  const workingDays = Number(settings.workingDaysPerMonth) || 26;
  const monthlyFixed = Number(settings.monthlyFixedCosts) || 18000;
  const dailyFixedCost = workingDays > 0 ? (monthlyFixed / workingDays) : 0;

  // Filter transactions for date
  const txns = (window.posState.transactions || []).filter(t => {
    if (t.dailyRecordId && t.dailyRecordId.includes(dateStr.replace(/-/g, ""))) return true;
    if (t.date === dateStr) return true;
    return false;
  });

  let cashSales = 0;
  let qrSales = 0;
  let deliverySales = 0;
  let otherIncome = 0;

  let foodCost = 0;
  let laborCost = 0;
  let operatingCost = 0;
  let loanPayments = 0;
  let otherExpenses = 0;

  let totalCashExpense = 0;
  let totalNonCashExpense = 0;

  txns.forEach(t => {
    const amt = Number(t.amount) || 0;
    if (t.type === "INCOME") {
      if (t.category === "sales") {
        if (t.paymentChannel === "CASH") cashSales += amt;
        else if (t.paymentChannel === "QR_TRANSFER") qrSales += amt;
        else if (t.paymentChannel === "DELIVERY") deliverySales += amt;
        else cashSales += amt;
      } else {
        otherIncome += amt;
      }
    } else if (t.type === "EXPENSE") {
      if (t.paymentChannel === "CASH") {
        totalCashExpense += amt;
      } else {
        totalNonCashExpense += amt;
      }

      if (t.category === "food_cost") foodCost += amt;
      else if (t.category === "labor") laborCost += amt;
      else if (t.category === "operating") operatingCost += amt;
      else if (t.category === "loan_payment") loanPayments += amt;
      else otherExpenses += amt;
    }
  });

  // Check orders in posState if orders occurred on dateStr
  // If no transactions exist for today yet, auto-aggregate completed orders
  const paidOrdersToday = (window.posState.orders || []).filter(o => {
    if (o.status !== "completed") return false;
    const orderDate = (o.createdAt || "").split("T")[0];
    return orderDate === dateStr;
  });

  const totalSales = cashSales + qrSales + deliverySales + otherIncome;
  const totalExpenses = foodCost + laborCost + operatingCost + loanPayments + otherExpenses;

  // Dual-View calculations
  // Cash Basis:
  const systemEndingCash = initialCash + cashSales - totalCashExpense;

  // Accrual Basis:
  // Operational expenses excludes loan principal payments (financing cash flow) and includes daily prorated fixed costs
  const totalOperationalCost = foodCost + laborCost + operatingCost + otherExpenses + dailyFixedCost;
  const accrualNetProfit = totalSales - totalOperationalCost;
  const accrualNetMarginPct = totalSales > 0 ? (accrualNetProfit / totalSales) * 100 : 0;

  // Cash Basis Net Cash Flow
  const cashNetFlow = totalSales - totalExpenses;

  // Percentages
  const foodCostPct = totalSales > 0 ? (foodCost / totalSales) * 100 : 0;
  const laborCostPct = totalSales > 0 ? (laborCost / totalSales) * 100 : 0;

  // Break-even Sales: Fixed Costs / (1 - (Variable Cost Ratio))
  // Variable Cost Ratio ~ foodCost / totalSales, or default target (0.35)
  const varRatio = totalSales > 0 ? (foodCost / totalSales) : (targetFoodCostPct / 100);
  const safeVarRatio = Math.min(Math.max(varRatio, 0.1), 0.85); // Avoid division by zero or negative
  const dailyBreakEvenSales = (dailyFixedCost + laborCost + operatingCost) / (1 - safeVarRatio);

  // Daily record lookup for shift closing
  const drId = `DR-${dateStr.replace(/-/g, "")}`;
  const dailyRecord = (window.posState.dailyRecords || []).find(r => r.id === drId || r.recordDate === dateStr);

  const billCount = dailyRecord?.billCount || (paidOrdersToday.length > 0 ? paidOrdersToday.length : (totalSales > 0 ? Math.max(1, Math.round(totalSales / 180)) : 0));
  const avgPerBill = billCount > 0 ? (totalSales / billCount) : 0;

  const actualCash = dailyRecord ? Number(dailyRecord.actualCashCounted) : systemEndingCash;
  const cashDiff = actualCash - systemEndingCash;

  return {
    dateStr,
    settings,
    initialCash,
    targetSales,
    targetFoodCostPct,
    targetLaborCostPct,
    targetNetMarginPct,
    workingDays,
    monthlyFixed,
    dailyFixedCost,
    txns,
    cashSales,
    qrSales,
    deliverySales,
    otherIncome,
    totalSales,
    foodCost,
    laborCost,
    operatingCost,
    loanPayments,
    otherExpenses,
    totalExpenses,
    totalCashExpense,
    totalNonCashExpense,
    systemEndingCash,
    actualCash,
    cashDiff,
    dailyRecord,
    billCount,
    avgPerBill,
    totalOperationalCost,
    accrualNetProfit,
    accrualNetMarginPct,
    cashNetFlow,
    foodCostPct,
    laborCostPct,
    dailyBreakEvenSales
  };
}

// -------------------------------------------------------------
// 2. DASHBOARD VIEW (DUAL-VIEW: ACCRUAL vs CASH)
// -------------------------------------------------------------

function setAccountingView(view) {
  currentAccountingView = view;
  renderAccountingDashboard();
}

function renderAccountingDashboard() {
  const dateInput = document.getElementById("accountingDateSelect");
  const selectedDate = dateInput ? dateInput.value : selectedLedgerDate;
  const data = getDailyAccountingData(selectedDate);

  // Update view toggle buttons
  const btnAccrual = document.getElementById("btnViewAccrual");
  const btnCash = document.getElementById("btnViewCash");
  if (btnAccrual && btnCash) {
    btnAccrual.classList.toggle("active", currentAccountingView === "accrual");
    btnCash.classList.toggle("active", currentAccountingView === "cash");
  }

  // Update Dual-View Banner / Description
  const banner = document.getElementById("accountingViewDesc");
  if (banner) {
    if (currentAccountingView === "accrual") {
      banner.innerHTML = `
        <div class="view-banner-box accrual-banner">
          <div class="banner-title"><i data-lucide="scale"></i> <b>มุมมองต้นทุนบริหารร้าน (Accrual / Operational Basis)</b></div>
          <div class="banner-sub">คำนวณหักต้นทุนจริง + เฉลี่ยค่าเช่า/ค่าน้ำไฟรายวัน (${data.dailyFixedCost.toLocaleString('th-TH', {minimumFractionDigits: 0, maximumFractionDigits: 0})} บ./วัน) เพื่อสะท้อนกำไรสุทธิและจุดคุ้มทุนที่แท้จริง</div>
        </div>
      `;
    } else {
      banner.innerHTML = `
        <div class="view-banner-box cash-banner">
          <div class="banner-title"><i data-lucide="wallet"></i> <b>มุมมองกระแสเงินสดจริง (Cash Basis)</b></div>
          <div class="banner-sub">ติดตามเงินสดเข้า-ออกจริงในลิ้นชัก ควบคุมเงินทอน รายจ่ายตลาดสด และค่างวดเงินกู้ เพื่อให้เงินสดในมือไม่ติดลบ</div>
        </div>
      `;
    }
  }

  // Target Status Badges
  const salesPctOfTarget = (data.totalSales / (data.targetSales || 1)) * 100;
  const salesStatusBadge = data.totalSales >= data.targetSales 
    ? `<span class="badge badge-success">✓ ผ่านเป้า (+${(data.totalSales - data.targetSales).toLocaleString()} ฿)</span>`
    : `<span class="badge badge-warning">ขาดอีก ${(data.targetSales - data.totalSales).toLocaleString()} ฿ (${salesPctOfTarget.toFixed(0)}%)</span>`;

  const foodStatusBadge = data.foodCostPct <= data.targetFoodCostPct
    ? `<span class="badge badge-success">✓ อยู่ในเกณฑ์ (เป้า ≤ ${data.targetFoodCostPct}%)</span>`
    : `<span class="badge badge-danger">⚠️ เกินเกณฑ์ (เป้า ≤ ${data.targetFoodCostPct}%)</span>`;

  const laborStatusBadge = data.laborCostPct <= data.targetLaborCostPct
    ? `<span class="badge badge-success">✓ อยู่ในเกณฑ์ (เป้า ≤ ${data.targetLaborCostPct}%)</span>`
    : `<span class="badge badge-danger">⚠️ เกินเกณฑ์ (เป้า ≤ ${data.targetLaborCostPct}%)</span>`;

  // Net Profit display depends on view
  let netProfitValue = currentAccountingView === "accrual" ? data.accrualNetProfit : data.cashNetFlow;
  let netMarginPct = currentAccountingView === "accrual" ? data.accrualNetMarginPct : (data.totalSales > 0 ? (data.cashNetFlow / data.totalSales) * 100 : 0);
  
  const profitStatusBadge = netMarginPct >= data.targetNetMarginPct
    ? `<span class="badge badge-success">✓ ผ่านเป้า (เป้า ≥ ${data.targetNetMarginPct}%)</span>`
    : `<span class="badge ${netProfitValue >= 0 ? 'badge-warning' : 'badge-danger'}">${netProfitValue >= 0 ? 'ต่ำกว่าเป้า' : 'ขาดทุน'} (เป้า ≥ ${data.targetNetMarginPct}%)</span>`;

  // Render Primary KPI Cards
  const kpiContainer = document.getElementById("accountingKPICards");
  if (kpiContainer) {
    kpiContainer.innerHTML = `
      <!-- Card 1: Total Sales -->
      <div class="kpi-card">
        <div class="kpi-icon-wrap kpi-blue">
          <i data-lucide="coins"></i>
        </div>
        <div class="kpi-info">
          <span class="kpi-label">ยอดขายรวมประจำวัน</span>
          <h3 class="kpi-value text-primary">฿${data.totalSales.toLocaleString('th-TH', {minimumFractionDigits: 2})}</h3>
          <div class="kpi-sub-row">
            ${salesStatusBadge}
            <small class="text-muted">เป้าหมาย ฿${data.targetSales.toLocaleString()}/วัน</small>
          </div>
        </div>
      </div>

      <!-- Card 2: Food Cost -->
      <div class="kpi-card">
        <div class="kpi-icon-wrap ${data.foodCostPct <= data.targetFoodCostPct ? 'kpi-emerald' : 'kpi-rose'}">
          <i data-lucide="beef"></i>
        </div>
        <div class="kpi-info">
          <span class="kpi-label">ต้นทุนวัตถุดิบ (% Food Cost)</span>
          <h3 class="kpi-value ${data.foodCostPct <= data.targetFoodCostPct ? 'text-success' : 'text-danger'}">
            ${data.foodCostPct.toFixed(1)}%
            <span class="kpi-val-sub">(฿${data.foodCost.toLocaleString('th-TH', {minimumFractionDigits: 2})})</span>
          </h3>
          <div class="kpi-sub-row">
            ${foodStatusBadge}
          </div>
        </div>
      </div>

      <!-- Card 3: Labor Cost -->
      <div class="kpi-card">
        <div class="kpi-icon-wrap ${data.laborCostPct <= data.targetLaborCostPct ? 'kpi-amber' : 'kpi-rose'}">
          <i data-lucide="users"></i>
        </div>
        <div class="kpi-info">
          <span class="kpi-label">ค่าแรงพนักงาน (% Labor)</span>
          <h3 class="kpi-value ${data.laborCostPct <= data.targetLaborCostPct ? 'text-success' : 'text-danger'}">
            ${data.laborCostPct.toFixed(1)}%
            <span class="kpi-val-sub">(฿${data.laborCost.toLocaleString('th-TH', {minimumFractionDigits: 2})})</span>
          </h3>
          <div class="kpi-sub-row">
            ${laborStatusBadge}
          </div>
        </div>
      </div>

      <!-- Card 4: Net Profit -->
      <div class="kpi-card">
        <div class="kpi-icon-wrap ${netProfitValue >= 0 ? 'kpi-purple' : 'kpi-rose'}">
          <i data-lucide="trending-up"></i>
        </div>
        <div class="kpi-info">
          <span class="kpi-label">${currentAccountingView === "accrual" ? 'กำไรสุทธิบริหาร (Net Margin)' : 'เงินสดสุทธิคงเหลือ (Net Cash)'}</span>
          <h3 class="kpi-value ${netProfitValue >= 0 ? 'text-purple' : 'text-danger'}">
            ฿${netProfitValue.toLocaleString('th-TH', {minimumFractionDigits: 2})}
            <span class="kpi-val-sub">(${netMarginPct.toFixed(1)}%)</span>
          </h3>
          <div class="kpi-sub-row">
            ${profitStatusBadge}
          </div>
        </div>
      </div>
    `;
  }

  // Secondary Summary Metrics: Break-even, Avg per bill, In Drawer Cash
  const secondaryContainer = document.getElementById("accountingSecondaryMetrics");
  if (secondaryContainer) {
    const isBreakEvenMet = data.totalSales >= data.dailyBreakEvenSales;
    secondaryContainer.innerHTML = `
      <div class="summary-metric-box">
        <div class="metric-icon"><i data-lucide="target"></i></div>
        <div class="metric-detail">
          <span class="metric-title">จุดคุ้มทุนวันนี้ (Break-even)</span>
          <span class="metric-num">฿${Math.round(data.dailyBreakEvenSales).toLocaleString()}</span>
          <span class="metric-hint ${isBreakEvenMet ? 'text-success' : 'text-warning'}">
            ${isBreakEvenMet ? '✓ ขายเกินจุดคุ้มทุนแล้ว' : `ขาดอีก ฿${Math.round(data.dailyBreakEvenSales - data.totalSales).toLocaleString()}`}
          </span>
        </div>
      </div>

      <div class="summary-metric-box">
        <div class="metric-icon"><i data-lucide="receipt"></i></div>
        <div class="metric-detail">
          <span class="metric-title">ยอดเฉลี่ยต่อบิล (AOV)</span>
          <span class="metric-num">฿${data.avgPerBill.toFixed(2)}</span>
          <span class="metric-hint">${data.billCount} บิลวันนี้</span>
        </div>
      </div>

      <div class="summary-metric-box">
        <div class="metric-icon"><i data-lucide="banknote"></i></div>
        <div class="metric-detail">
          <span class="metric-title">เงินสดในลิ้นชัก (ระบบ)</span>
          <span class="metric-num text-primary">฿${data.systemEndingCash.toLocaleString('th-TH', {minimumFractionDigits: 2})}</span>
          <span class="metric-hint">ทอน ฿${data.initialCash} + สด ฿${data.cashSales} - จ่าย ฿${data.totalCashExpense}</span>
        </div>
      </div>

      <div class="summary-metric-box">
        <div class="metric-icon"><i data-lucide="credit-card"></i></div>
        <div class="metric-detail">
          <span class="metric-title">ยอดโอน / เดลิเวอรี่</span>
          <span class="metric-num text-success">฿${(data.qrSales + data.deliverySales).toLocaleString('th-TH', {minimumFractionDigits: 2})}</span>
          <span class="metric-hint">QR ฿${data.qrSales} | ส่ง ฿${data.deliverySales}</span>
        </div>
      </div>
    `;
  }

  // Cost Breakdown Progress Bar
  const costBarContainer = document.getElementById("costBreakdownSection");
  if (costBarContainer) {
    const totalOutflow = currentAccountingView === "accrual" ? data.totalOperationalCost : data.totalExpenses;
    const foodW = totalOutflow > 0 ? (data.foodCost / totalOutflow) * 100 : 0;
    const laborW = totalOutflow > 0 ? (data.laborCost / totalOutflow) * 100 : 0;
    const operW = totalOutflow > 0 ? (data.operatingCost / totalOutflow) * 100 : 0;
    const fixedW = (currentAccountingView === "accrual" && totalOutflow > 0) ? (data.dailyFixedCost / totalOutflow) * 100 : 0;
    const loanW = (currentAccountingView === "cash" && totalOutflow > 0) ? (data.loanPayments / totalOutflow) * 100 : 0;

    costBarContainer.innerHTML = `
      <div class="cost-bar-header">
        <h4><i data-lucide="pie-chart"></i> สัดส่วนโครงสร้างค่าใช้จ่ายวันนี้ (รวม ฿${totalOutflow.toLocaleString('th-TH', {minimumFractionDigits: 2})})</h4>
      </div>
      <div class="multi-progress-bar">
        <div class="prog-segment seg-food" style="width: ${foodW}%;" title="วัตถุดิบ: ฿${data.foodCost.toLocaleString()} (${foodW.toFixed(1)}%)"></div>
        <div class="prog-segment seg-labor" style="width: ${laborW}%;" title="ค่าแรง: ฿${data.laborCost.toLocaleString()} (${laborW.toFixed(1)}%)"></div>
        <div class="prog-segment seg-oper" style="width: ${operW}%;" title="ดำเนินงาน: ฿${data.operatingCost.toLocaleString()} (${operW.toFixed(1)}%)"></div>
        ${currentAccountingView === "accrual" 
          ? `<div class="prog-segment seg-fixed" style="width: ${fixedW}%;" title="ค่าเช่า/น้ำไฟเฉลี่ย: ฿${Math.round(data.dailyFixedCost).toLocaleString()} (${fixedW.toFixed(1)}%)"></div>`
          : `<div class="prog-segment seg-loan" style="width: ${loanW}%;" title="ส่งเงินกู้: ฿${data.loanPayments.toLocaleString()} (${loanW.toFixed(1)}%)"></div>`
        }
      </div>
      <div class="cost-legend-row">
        <span class="legend-item"><span class="dot dot-food"></span> วัตถุดิบ: <b>฿${data.foodCost.toLocaleString()}</b> (${data.foodCostPct.toFixed(1)}% ของยอดขาย)</span>
        <span class="legend-item"><span class="dot dot-labor"></span> ค่าแรง: <b>฿${data.laborCost.toLocaleString()}</b> (${data.laborCostPct.toFixed(1)}% ของยอดขาย)</span>
        <span class="legend-item"><span class="dot dot-oper"></span> ค่าใช้จ่ายดำเนินงาน: <b>฿${data.operatingCost.toLocaleString()}</b></span>
        ${currentAccountingView === "accrual" 
          ? `<span class="legend-item"><span class="dot dot-fixed"></span> ค่าเช่า/น้ำไฟเฉลี่ยรายวัน: <b>฿${Math.round(data.dailyFixedCost).toLocaleString()}</b></span>`
          : `<span class="legend-item"><span class="dot dot-loan"></span> ชำระเงินกู้: <b>฿${data.loanPayments.toLocaleString()}</b></span>`
        }
      </div>
    `;
  }

  // Active Loans Quick Summary Widget
  renderDashboardLoanWidget();

  refreshLucideIcons();
}

function renderDashboardLoanWidget() {
  const container = document.getElementById("dashboardLoanWidget");
  if (!container) return;

  const loans = window.posState.loans || [];
  const activeLoans = loans.filter(l => l.status === "active");
  const totalRemaining = activeLoans.reduce((sum, l) => sum + (Number(l.balanceRemaining) || 0), 0);
  const totalDailyInstallment = activeLoans.reduce((sum, l) => sum + (Number(l.dailyInstallment) || 0), 0);

  container.innerHTML = `
    <div class="dash-loan-card">
      <div class="dash-loan-header">
        <div>
          <h4 style="margin:0; font-size:1.05rem; display:flex; align-items:center; gap:0.5rem;">
            <i data-lucide="file-text"></i> สรุปภาระหนี้สินเงินกู้รายวัน
          </h4>
          <p style="margin:0.25rem 0 0; font-size:0.85rem; color:var(--text-muted);">
            มีสัญญาที่ต้องส่งทั้งหมด <b>${activeLoans.length}</b> สัญญา | รวมส่งวันละ <b class="text-danger">฿${totalDailyInstallment.toLocaleString()}</b>
          </p>
        </div>
        <button class="btn btn-sm btn-primary" onclick="switchAdminTab('loans')">
          <span>ดูรายละเอียดสัญญา</span> &rarr;
        </button>
      </div>
      <div class="dash-loan-body">
        <div class="dash-loan-stat">
          <span class="text-muted">ยอดหนี้คงเหลือรวม:</span>
          <span class="text-danger" style="font-size:1.2rem; font-weight:700;">฿${totalRemaining.toLocaleString()}</span>
        </div>
        <div class="dash-loan-chips">
          ${activeLoans.map(l => `
            <div class="loan-chip">
              <span class="loan-chip-name">${l.lenderName}</span>
              <span class="loan-chip-due">ส่งวันละ ฿${l.dailyInstallment.toLocaleString()}</span>
              <span class="loan-chip-remain">(คงเหลือ ฿${l.balanceRemaining.toLocaleString()} | งวด ${l.termsPaid}/${l.totalTerms})</span>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// 3. TRANSACTION LEDGER (สมุดบัญชีรายวัน)
// -------------------------------------------------------------

function filterLedger() {
  const catFilter = document.getElementById("ledgerCategorySelect")?.value || "all";
  const chanFilter = document.getElementById("ledgerChannelSelect")?.value || "all";
  const dateFilter = document.getElementById("ledgerDateFilter")?.value || selectedLedgerDate;
  
  selectedLedgerCategory = catFilter;
  selectedLedgerChannel = chanFilter;
  selectedLedgerDate = dateFilter;

  renderTransactionLedger();
  renderShiftClosingView();
}

function renderTransactionLedger() {
  const container = document.getElementById("ledgerTableBody");
  if (!container) return;

  const data = getDailyAccountingData(selectedLedgerDate);
  let txns = data.txns;

  if (selectedLedgerCategory !== "all") {
    txns = txns.filter(t => t.category === selectedLedgerCategory);
  }
  if (selectedLedgerChannel !== "all") {
    txns = txns.filter(t => t.paymentChannel === selectedLedgerChannel);
  }

  if (txns.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted" style="padding: 2.5rem;">
          <i data-lucide="inbox" style="width: 36px; height: 36px; margin: 0 auto 0.5rem; opacity: 0.4; display:block;"></i>
          ไม่มีรายการรับ-จ่าย ในวันที่เลือกตามเงื่อนไข
        </td>
      </tr>
    `;
    refreshLucideIcons();
    return;
  }

  // Category labels and badges
  const categoryMeta = {
    sales: { label: "ยอดขายอาหาร/เครื่องดื่ม", badgeClass: "badge-success" },
    food_cost: { label: "ต้นทุนวัตถุดิบ (Food Cost)", badgeClass: "badge-danger-subtle" },
    labor: { label: "ค่าแรงพนักงาน (Labor)", badgeClass: "badge-warning-subtle" },
    operating: { label: "ค่าใช้จ่ายดำเนินงาน (Operating)", badgeClass: "badge-secondary" },
    loan_payment: { label: "ชำระหนี้เงินกู้ (Loan Payment)", badgeClass: "badge-primary-subtle" },
    other: { label: "อื่นๆ", badgeClass: "badge-light" }
  };

  const channelMeta = {
    CASH: { label: "💵 เงินสด", badgeClass: "badge-outline-primary" },
    QR_TRANSFER: { label: "📱 สแกน QR/โอน", badgeClass: "badge-outline-success" },
    DELIVERY: { label: "🛵 เดลิเวอรี่", badgeClass: "badge-outline-warning" }
  };

  container.innerHTML = txns.map(t => {
    const isIncome = t.type === "INCOME";
    const cat = categoryMeta[t.category] || { label: t.category, badgeClass: "badge-light" };
    const chan = channelMeta[t.paymentChannel] || { label: t.paymentChannel, badgeClass: "badge-light" };
    const linkedLoan = t.loanId ? (window.posState.loans || []).find(l => l.id === t.loanId) : null;

    return `
      <tr>
        <td style="font-weight: 500;">
          <span style="display:inline-block; font-family: monospace; font-size: 0.9rem;">${t.time || '--:--'}</span>
          <small class="text-muted" style="display:block; font-size:0.75rem;">${t.id}</small>
        </td>
        <td>
          <span class="badge ${isIncome ? 'badge-success' : 'badge-danger'}">
            ${isIncome ? 'รายรับ (+)' : 'รายจ่าย (-)'}
          </span>
        </td>
        <td>
          <span class="badge ${cat.badgeClass}">${cat.label}</span>
          ${t.subCategory ? `<div style="font-size:0.85rem; font-weight:600; margin-top:0.2rem;">${t.subCategory}</div>` : ''}
        </td>
        <td>
          <span class="badge ${chan.badgeClass}">${chan.label}</span>
        </td>
        <td style="text-align: right; font-weight: 700; font-size: 1rem; color: ${isIncome ? 'var(--primary-dark)' : 'var(--danger)'};">
          ${isIncome ? '+' : '-'}฿${Number(t.amount).toLocaleString('th-TH', {minimumFractionDigits: 2})}
        </td>
        <td>
          <div style="font-size:0.9rem;">${t.notes || '-'}</div>
          ${linkedLoan ? `
            <div style="font-size:0.8rem; color:var(--primary); margin-top:0.15rem;">
              <i data-lucide="link" style="width:12px; height:12px; vertical-align:middle;"></i> ผูกกับ: <b>${linkedLoan.lenderName}</b> (คงเหลือ ฿${linkedLoan.balanceRemaining.toLocaleString()})
            </div>
          ` : ''}
        </td>
        <td style="text-align: center;">
          <button class="btn-icon text-danger" title="ลบรายการนี้" onclick="deleteTransaction('${t.id}')">
            <i data-lucide="trash-2"></i>
          </button>
        </td>
      </tr>
    `;
  }).join("");

  refreshLucideIcons();
}

// -------------------------------------------------------------
// 4. SHIFT CLOSING & CASH RECONCILIATION
// -------------------------------------------------------------

function renderShiftClosingView() {
  const container = document.getElementById("shiftClosingCardContainer");
  if (!container) return;

  const data = getDailyAccountingData(selectedLedgerDate);
  const dr = data.dailyRecord;
  const isClosed = dr && dr.status === "closed";

  // Re-calculate diff based on current input or stored
  const actualVal = dr ? dr.actualCashCounted : data.systemEndingCash;
  const currentDiff = actualVal - data.systemEndingCash;

  let diffBadge = "";
  if (currentDiff === 0) {
    diffBadge = `<span class="badge badge-success-lg"><i data-lucide="check-circle"></i> ยอดเงินสดตรงเป๊ะ (Balanced) ฿0.00</span>`;
  } else if (currentDiff > 0) {
    diffBadge = `<span class="badge badge-warning-lg"><i data-lucide="plus-circle"></i> เงินสดเกิน +฿${currentDiff.toLocaleString('th-TH', {minimumFractionDigits: 2})}</span>`;
  } else {
    diffBadge = `<span class="badge badge-danger-lg"><i data-lucide="alert-circle"></i> เงินสดขาด ฿${Math.abs(currentDiff).toLocaleString('th-TH', {minimumFractionDigits: 2})}</span>`;
  }

  container.innerHTML = `
    <div class="shift-closing-panel">
      <div class="closing-header">
        <div>
          <h3 class="panel-title">
            <i data-lucide="calculator"></i> กระทบยอดเงินสด & ปิดกะประจำวัน (Daily Cash Reconciliation)
          </h3>
          <p class="panel-sub">วันที่: <b>${selectedLedgerDate}</b> | สถานะกะ: 
            ${isClosed ? '<span class="badge badge-success">✓ ปิดกะแล้ว</span>' : '<span class="badge badge-warning">กำลังเปิดกะ</span>'}
          </p>
        </div>
        <div class="closing-actions">
          <button class="btn btn-secondary btn-sm" onclick="openAccountingSettingsModal()">
            <i data-lucide="settings"></i> ตั้งค่าเป้าหมาย & เงินทอน
          </button>
        </div>
      </div>

      <div class="reconcile-grid">
        <!-- Step 1: Inflows & Outflows Math -->
        <div class="reconcile-box">
          <h4 class="reconcile-box-title"><i data-lucide="arrow-down-right"></i> รายการคำนวณเงินสดในลิ้นชัก</h4>
          <table class="reconcile-table">
            <tr>
              <td>เงินทอนเริ่มต้นกะ (Opening Cash):</td>
              <td class="text-right text-muted">+฿${data.initialCash.toLocaleString('th-TH', {minimumFractionDigits: 2})}</td>
            </tr>
            <tr>
              <td>(+) ยอดขายเงินสดหน้าร้าน (Cash Sales):</td>
              <td class="text-right text-success">+฿${data.cashSales.toLocaleString('th-TH', {minimumFractionDigits: 2})}</td>
            </tr>
            <tr>
              <td>(-) รายจ่ายเงินสดทั้งหมด (Cash Outflows):</td>
              <td class="text-right text-danger">-฿${data.totalCashExpense.toLocaleString('th-TH', {minimumFractionDigits: 2})}</td>
            </tr>
            <tr class="table-total-row">
              <td><b>(=) เงินสดที่ระบบคำนวณได้ (System Ending Cash):</b></td>
              <td class="text-right text-primary font-bold">฿${data.systemEndingCash.toLocaleString('th-TH', {minimumFractionDigits: 2})}</td>
            </tr>
          </table>
          <small class="text-muted" style="display:block; margin-top:0.5rem;">
            * รายจ่ายเงินสดรวม: วัตถุดิบ ฿${data.foodCost.toLocaleString()} | ค่าแรง ฿${data.laborCost.toLocaleString()} | อื่นๆ ฿${data.operatingCost.toLocaleString()} | ส่งเงินกู้ ฿${data.loanPayments.toLocaleString()}
          </small>
        </div>

        <!-- Step 2: Actual Count & Discrepancy -->
        <div class="reconcile-box count-box">
          <h4 class="reconcile-box-title"><i data-lucide="hand-coins"></i> นับเงินสดจริง & ยืนยันปิดกะ</h4>
          
          <div class="form-group" style="margin-bottom: 1rem;">
            <label class="form-label" style="font-weight:600;">เงินสดที่นับได้จริงในลิ้นชัก (Actual Cash Counted) <span class="text-danger">*</span></label>
            <div class="input-prefix-wrap">
              <span class="input-prefix">฿</span>
              <input type="number" step="1" id="inputActualCashCounted" class="form-control form-control-lg" 
                value="${actualVal}" oninput="calculateClosingDiff(${data.systemEndingCash})">
            </div>
          </div>

          <div id="closingDiffIndicator" style="margin-bottom: 1rem;">
            ${diffBadge}
          </div>

          <div class="form-group" style="margin-bottom: 1rem;">
            <label class="form-label">หมายเหตุการปิดกะ (ถ้ามี):</label>
            <input type="text" id="closingNotesInput" class="form-control" 
              placeholder="เช่น ยอดเงินตรง / มีเศษสตางค์เกิน / จ่ายค่าหมูเพิ่ม..." value="${dr?.notes || ''}">
          </div>

          <div class="closing-btn-wrap">
            <button class="btn btn-success btn-block btn-lg" onclick="saveShiftClosing('${selectedLedgerDate}', ${data.systemEndingCash})">
              <i data-lucide="lock"></i> ${isClosed ? 'บันทึกอัปเดตการปิดกะ' : 'ยืนยันปิดกะประจำวัน (Close Shift)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  refreshLucideIcons();
}

function calculateClosingDiff(systemCash) {
  const input = document.getElementById("inputActualCashCounted");
  const indicator = document.getElementById("closingDiffIndicator");
  if (!input || !indicator) return;

  const actual = Number(input.value) || 0;
  const diff = actual - systemCash;

  if (diff === 0) {
    indicator.innerHTML = `<span class="badge badge-success-lg"><i data-lucide="check-circle"></i> ยอดเงินสดตรงเป๊ะ (Balanced) ฿0.00</span>`;
  } else if (diff > 0) {
    indicator.innerHTML = `<span class="badge badge-warning-lg"><i data-lucide="plus-circle"></i> เงินสดเกิน +฿${diff.toLocaleString('th-TH', {minimumFractionDigits: 2})}</span>`;
  } else {
    indicator.innerHTML = `<span class="badge badge-danger-lg"><i data-lucide="alert-circle"></i> เงินสดขาด ฿${Math.abs(diff).toLocaleString('th-TH', {minimumFractionDigits: 2})}</span>`;
  }
  refreshLucideIcons();
}

function saveShiftClosing(dateStr, systemCash) {
  const input = document.getElementById("inputActualCashCounted");
  const notesInput = document.getElementById("closingNotesInput");
  const actualVal = Number(input?.value) || 0;
  const notesVal = notesInput?.value || "";

  const diff = actualVal - systemCash;
  const drId = `DR-${dateStr.replace(/-/g, "")}`;

  // Count orders
  const paidOrdersToday = (window.posState.orders || []).filter(o => {
    if (o.status !== "completed") return false;
    const orderDate = (o.createdAt || "").split("T")[0];
    return orderDate === dateStr;
  });

  const billCount = paidOrdersToday.length > 0 ? paidOrdersToday.length : 1;

  const existingIdx = (window.posState.dailyRecords || []).findIndex(r => r.id === drId || r.recordDate === dateStr);
  const closingRecord = {
    id: drId,
    recordDate: dateStr,
    billCount: billCount,
    actualCashCounted: actualVal,
    systemCashCalculated: systemCash,
    cashDiff: diff,
    status: "closed",
    closedAt: new Date().toISOString(),
    notes: notesVal
  };

  if (existingIdx >= 0) {
    window.posState.dailyRecords[existingIdx] = closingRecord;
  } else {
    window.posState.dailyRecords.unshift(closingRecord);
  }

  savePOSState();
  renderShiftClosingView();
  renderAccountingDashboard();
  alert(`✅ บันทึกปิดกะประจำวันที่ ${dateStr} เรียบร้อยแล้ว!\n• เงินสดที่นับได้: ฿${actualVal.toLocaleString()}\n• ส่วนต่าง: ฿${diff.toLocaleString()}`);
}

// -------------------------------------------------------------
// 5. LOAN & DEBT TRACKER (สัญญาเงินกู้ & บัญชีหนี้สิน)
// -------------------------------------------------------------

function renderLoanTracker() {
  const container = document.getElementById("loanCardsContainer");
  const summaryContainer = document.getElementById("loanSummaryKPIs");
  if (!container) return;

  const loans = window.posState.loans || [];
  const activeLoans = loans.filter(l => l.status === "active");
  const totalPrincipal = loans.reduce((sum, l) => sum + (Number(l.principalAmount) || 0), 0);
  const totalPayable = loans.reduce((sum, l) => sum + (Number(l.totalPayable) || 0), 0);
  const totalRemaining = loans.reduce((sum, l) => sum + (Number(l.balanceRemaining) || 0), 0);
  const totalDailyInstallment = activeLoans.reduce((sum, l) => sum + (Number(l.dailyInstallment) || 0), 0);

  if (summaryContainer) {
    summaryContainer.innerHTML = `
      <div class="kpi-card">
        <div class="kpi-icon-wrap kpi-blue">
          <i data-lucide="file-check"></i>
        </div>
        <div class="kpi-info">
          <span class="kpi-label">สัญญาทั้งหมด / กำลังส่ง</span>
          <h3 class="kpi-value">${activeLoans.length} / ${loans.length}</h3>
          <span class="kpi-sub">สัญญาที่กำลังผ่อนชำระ</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon-wrap kpi-rose">
          <i data-lucide="badge-dollar-sign"></i>
        </div>
        <div class="kpi-info">
          <span class="kpi-label">ยอดหนี้คงเหลือรวม</span>
          <h3 class="kpi-value text-danger">฿${totalRemaining.toLocaleString()}</h3>
          <span class="kpi-sub">จากยอดกู้รวม ฿${totalPayable.toLocaleString()}</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon-wrap kpi-amber">
          <i data-lucide="calendar"></i>
        </div>
        <div class="kpi-info">
          <span class="kpi-label">ยอดที่ต้องส่งรายวันรวม</span>
          <h3 class="kpi-value text-warning">฿${totalDailyInstallment.toLocaleString()}</h3>
          <span class="kpi-sub">บาทต่อวัน (หักจากรายจ่าย)</span>
        </div>
      </div>
    `;
  }

  if (loans.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1; padding: 3rem; text-align: center; color: var(--text-muted);">
        <i data-lucide="check-circle-2" style="width: 48px; height: 48px; margin: 0 auto 1rem; color: var(--success);"></i>
        <h4>ไม่มีภาระหนี้สินเงินกู้ในระบบ</h4>
        <p>คุณสามารถเพิ่มสัญญาเงินกู้หมุนเวียนได้โดยกดปุ่ม "เพิ่มสัญญาเงินกู้ใหม่"</p>
      </div>
    `;
    refreshLucideIcons();
    return;
  }

  container.innerHTML = loans.map(loan => {
    const isCompleted = loan.status === "completed" || loan.balanceRemaining <= 0;
    const paidPct = loan.totalPayable > 0 ? ((loan.totalPayable - loan.balanceRemaining) / loan.totalPayable) * 100 : 100;

    return `
      <div class="loan-card ${isCompleted ? 'loan-card-completed' : ''}">
        <div class="loan-card-top">
          <div>
            <div class="loan-badge-row">
              <span class="badge ${isCompleted ? 'badge-success' : 'badge-primary'}">${loan.id}</span>
              <span class="badge ${isCompleted ? 'badge-success' : 'badge-warning'}">
                ${isCompleted ? '✓ ปิดยอดเรียบร้อย' : 'กำลังผ่อนชำระ'}
              </span>
            </div>
            <h3 class="loan-title">${loan.lenderName}</h3>
            <span class="loan-date">เริ่มสัญญา: ${loan.startDate || '-'}</span>
          </div>
          <div class="loan-actions">
            ${!isCompleted ? `
              <button class="btn btn-sm btn-primary" onclick="quickPayLoan('${loan.id}', ${loan.dailyInstallment})" title="บันทึกจ่ายงวดประจำวัน">
                <i data-lucide="send"></i> ส่งงวดวันนี้ (฿${loan.dailyInstallment.toLocaleString()})
              </button>
            ` : ''}
            <button class="btn-icon text-muted" onclick="openEditLoanModal('${loan.id}')" title="แก้ไขข้อมูล">
              <i data-lucide="edit-2"></i>
            </button>
            <button class="btn-icon text-danger" onclick="deleteLoanContract('${loan.id}')" title="ลบสัญญา">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </div>

        <div class="loan-figures-grid">
          <div class="loan-fig-item">
            <span class="fig-lbl">เงินต้น</span>
            <span class="fig-val">฿${Number(loan.principalAmount).toLocaleString()}</span>
          </div>
          <div class="loan-fig-item">
            <span class="fig-lbl">ยอดรวมต้องชำระ</span>
            <span class="fig-val">฿${Number(loan.totalPayable).toLocaleString()}</span>
          </div>
          <div class="loan-fig-item">
            <span class="fig-lbl">ส่งวันละ</span>
            <span class="fig-val text-warning">฿${Number(loan.dailyInstallment).toLocaleString()}</span>
          </div>
          <div class="loan-fig-item">
            <span class="fig-lbl">ยอดหนี้คงเหลือ</span>
            <span class="fig-val text-danger" style="font-weight:700;">฿${Number(loan.balanceRemaining).toLocaleString()}</span>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="loan-progress-wrap">
          <div class="loan-progress-labels">
            <span>ชำระแล้ว ${paidPct.toFixed(1)}%</span>
            <span>งวดที่ ${loan.termsPaid || 0} / ${loan.totalTerms || 0} งวด</span>
          </div>
          <div class="loan-bar-track">
            <div class="loan-bar-fill ${isCompleted ? 'bg-success' : 'bg-primary'}" style="width: ${Math.min(paidPct, 100)}%;"></div>
          </div>
        </div>

        ${loan.notes ? `<div class="loan-notes"><i data-lucide="info"></i> ${loan.notes}</div>` : ''}
      </div>
    `;
  }).join("");

  refreshLucideIcons();
}

// -------------------------------------------------------------
// 6. TRANSACTION ACTIONS & LOAN INTEGRATION
// -------------------------------------------------------------

function openAddTransactionModal(presetCategory = null, presetType = "EXPENSE") {
  const modal = document.getElementById("transactionModal");
  if (!modal) return;

  document.getElementById("txnFormId").value = "";
  document.getElementById("txnDateInput").value = selectedLedgerDate;
  
  const now = new Date();
  document.getElementById("txnTimeInput").value = now.toTimeString().substring(0, 5);
  document.getElementById("txnTypeSelect").value = presetType;
  
  if (presetCategory) {
    document.getElementById("txnCategorySelect").value = presetCategory;
  } else {
    document.getElementById("txnCategorySelect").value = presetType === "INCOME" ? "sales" : "food_cost";
  }

  toggleTxnCategoryOptions();
  document.getElementById("txnAmountInput").value = "";
  document.getElementById("txnSubCategoryInput").value = "";
  document.getElementById("txnNotesInput").value = "";

  openModal("transactionModal");
}

function toggleTxnCategoryOptions() {
  const type = document.getElementById("txnTypeSelect")?.value;
  const catSelect = document.getElementById("txnCategorySelect");
  const loanGroup = document.getElementById("txnLoanSelectGroup");
  if (!catSelect) return;

  if (type === "INCOME") {
    catSelect.innerHTML = `
      <option value="sales">ยอดขาย (หน้าร้าน / เดลิเวอรี่)</option>
      <option value="other">รายรับอื่นๆ</option>
    `;
    if (loanGroup) loanGroup.style.display = "none";
  } else {
    catSelect.innerHTML = `
      <option value="food_cost">ต้นทุนวัตถุดิบ (Food Cost: หมู, ไก่, ผัก, เครื่องปรุง)</option>
      <option value="labor">ค่าแรงพนักงาน (Labor)</option>
      <option value="operating">ค่าใช้จ่ายดำเนินงาน (แก๊ส, น้ำแข็ง, ของใช้)</option>
      <option value="loan_payment">ชำระหนี้เงินกู้รายวัน (Loan Payment)</option>
      <option value="other">รายจ่ายอื่นๆ</option>
    `;
  }

  handleTxnCategoryChange();
}

function handleTxnCategoryChange() {
  const cat = document.getElementById("txnCategorySelect")?.value;
  const loanGroup = document.getElementById("txnLoanSelectGroup");
  const loanSelect = document.getElementById("txnLoanSelect");

  if (cat === "loan_payment") {
    if (loanGroup) loanGroup.style.display = "block";
    // Populate active loans
    const loans = (window.posState.loans || []).filter(l => l.status === "active");
    if (loanSelect) {
      if (loans.length === 0) {
        loanSelect.innerHTML = `<option value="">-- ไม่พบสัญญาเงินกู้ที่เปิดอยู่ --</option>`;
      } else {
        loanSelect.innerHTML = loans.map(l => `
          <option value="${l.id}">
            ${l.lenderName} (ส่งวันละ ฿${l.dailyInstallment.toLocaleString()} | คงเหลือ ฿${l.balanceRemaining.toLocaleString()})
          </option>
        `).join("");
      }
      // Auto pre-fill amount from selected loan
      handleLoanSelectChange();
    }
  } else {
    if (loanGroup) loanGroup.style.display = "none";
  }
}

function handleLoanSelectChange() {
  const loanSelect = document.getElementById("txnLoanSelect");
  const amountInput = document.getElementById("txnAmountInput");
  const subCatInput = document.getElementById("txnSubCategoryInput");
  if (!loanSelect || !loanSelect.value) return;

  const loan = (window.posState.loans || []).find(l => l.id === loanSelect.value);
  if (loan) {
    if (amountInput && (!amountInput.value || Number(amountInput.value) === 0)) {
      amountInput.value = loan.dailyInstallment;
    }
    if (subCatInput && !subCatInput.value) {
      subCatInput.value = `ส่งงวด ${loan.lenderName}`;
    }
  }
}

function handleSaveTransaction(event) {
  event.preventDefault();
  const formId = document.getElementById("txnFormId")?.value;
  const dateVal = document.getElementById("txnDateInput")?.value || selectedLedgerDate;
  const timeVal = document.getElementById("txnTimeInput")?.value || "12:00";
  const typeVal = document.getElementById("txnTypeSelect")?.value || "EXPENSE";
  const catVal = document.getElementById("txnCategorySelect")?.value || "food_cost";
  const chanVal = document.getElementById("txnChannelSelect")?.value || "CASH";
  const amtVal = Number(document.getElementById("txnAmountInput")?.value) || 0;
  const subCatVal = document.getElementById("txnSubCategoryInput")?.value || "";
  const notesVal = document.getElementById("txnNotesInput")?.value || "";
  const loanIdVal = (typeVal === "EXPENSE" && catVal === "loan_payment") ? document.getElementById("txnLoanSelect")?.value : null;

  if (amtVal <= 0) {
    alert("กรุณากรอกจำนวนเงินให้ถูกต้อง");
    return;
  }

  const drId = `DR-${dateVal.replace(/-/g, "")}`;
  const txnId = formId || `TXN-${dateVal.replace(/-/g, "")}-${Date.now().toString().slice(-4)}`;

  const newTxn = {
    id: txnId,
    dailyRecordId: drId,
    date: dateVal,
    time: timeVal,
    type: typeVal,
    paymentChannel: chanVal,
    category: catVal,
    subCategory: subCatVal,
    amount: amtVal,
    loanId: loanIdVal || null,
    notes: notesVal
  };

  // If new loan payment transaction, decrement loan balance
  if (!formId && loanIdVal) {
    const loan = (window.posState.loans || []).find(l => l.id === loanIdVal);
    if (loan) {
      loan.balanceRemaining = Math.max(0, loan.balanceRemaining - amtVal);
      loan.termsPaid = (loan.termsPaid || 0) + 1;
      if (loan.balanceRemaining <= 0) {
        loan.status = "completed";
      }
    }
  }

  if (formId) {
    const idx = (window.posState.transactions || []).findIndex(t => t.id === formId);
    if (idx >= 0) window.posState.transactions[idx] = newTxn;
  } else {
    window.posState.transactions.unshift(newTxn);
  }

  savePOSState();
  closeModal("transactionModal");
  renderTransactionLedger();
  renderShiftClosingView();
  renderAccountingDashboard();
  renderLoanTracker();
}

function deleteTransaction(txnId) {
  const txn = (window.posState.transactions || []).find(t => t.id === txnId);
  if (!txn) return;

  if (!confirm(`ยืนยันการลบรายการ: ${txn.subCategory || txn.category} จำนวน ฿${txn.amount.toLocaleString()}?`)) {
    return;
  }

  // If this was a loan payment, restore balance to the loan
  if (txn.category === "loan_payment" && txn.loanId) {
    const loan = (window.posState.loans || []).find(l => l.id === txn.loanId);
    if (loan) {
      loan.balanceRemaining = Number(loan.balanceRemaining || 0) + Number(txn.amount);
      loan.termsPaid = Math.max(0, (loan.termsPaid || 1) - 1);
      if (loan.balanceRemaining > 0 && loan.status === "completed") {
        loan.status = "active";
      }
    }
  }

  window.posState.transactions = window.posState.transactions.filter(t => t.id !== txnId);
  savePOSState();
  renderTransactionLedger();
  renderShiftClosingView();
  renderAccountingDashboard();
  renderLoanTracker();
}

function quickPayLoan(loanId, installment) {
  const loan = (window.posState.loans || []).find(l => l.id === loanId);
  if (!loan) return;

  openAddTransactionModal("loan_payment", "EXPENSE");
  const loanSelect = document.getElementById("txnLoanSelect");
  if (loanSelect) {
    loanSelect.value = loanId;
  }
  const amtInput = document.getElementById("txnAmountInput");
  if (amtInput) {
    amtInput.value = installment || loan.dailyInstallment;
  }
  const subCatInput = document.getElementById("txnSubCategoryInput");
  if (subCatInput) {
    subCatInput.value = `ส่งเงินกู้ ${loan.lenderName} (งวดที่ ${(loan.termsPaid || 0) + 1}/${loan.totalTerms})`;
  }
}

// -------------------------------------------------------------
// 7. LOAN CONTRACT MANAGEMENT
// -------------------------------------------------------------

function openAddLoanModal() {
  document.getElementById("loanModalTitle").innerText = "เพิ่มสัญญาเงินกู้ใหม่";
  document.getElementById("loanFormId").value = "";
  document.getElementById("loanLenderName").value = "";
  document.getElementById("loanPrincipal").value = "";
  document.getElementById("loanTotalPayable").value = "";
  document.getElementById("loanDailyInstallment").value = "";
  document.getElementById("loanTotalTerms").value = "";
  document.getElementById("loanTermsPaid").value = "0";
  document.getElementById("loanStartDate").value = new Date().toISOString().split("T")[0];
  document.getElementById("loanNotes").value = "";
  openModal("loanModal");
}

function openEditLoanModal(loanId) {
  const loan = (window.posState.loans || []).find(l => l.id === loanId);
  if (!loan) return;

  document.getElementById("loanModalTitle").innerText = `แก้ไขสัญญา: ${loan.id}`;
  document.getElementById("loanFormId").value = loan.id;
  document.getElementById("loanLenderName").value = loan.lenderName || "";
  document.getElementById("loanPrincipal").value = loan.principalAmount || "";
  document.getElementById("loanTotalPayable").value = loan.totalPayable || "";
  document.getElementById("loanDailyInstallment").value = loan.dailyInstallment || "";
  document.getElementById("loanTotalTerms").value = loan.totalTerms || "";
  document.getElementById("loanTermsPaid").value = loan.termsPaid || "0";
  document.getElementById("loanStartDate").value = loan.startDate || "";
  document.getElementById("loanNotes").value = loan.notes || "";
  openModal("loanModal");
}

function handleSaveLoan(event) {
  event.preventDefault();
  const loanId = document.getElementById("loanFormId")?.value;
  const lenderName = document.getElementById("loanLenderName")?.value || "";
  const principal = Number(document.getElementById("loanPrincipal")?.value) || 0;
  const totalPayable = Number(document.getElementById("loanTotalPayable")?.value) || principal;
  const dailyInstallment = Number(document.getElementById("loanDailyInstallment")?.value) || 0;
  const totalTerms = Number(document.getElementById("loanTotalTerms")?.value) || 1;
  const termsPaid = Number(document.getElementById("loanTermsPaid")?.value) || 0;
  const startDate = document.getElementById("loanStartDate")?.value || new Date().toISOString().split("T")[0];
  const notes = document.getElementById("loanNotes")?.value || "";

  const paidSoFar = termsPaid * dailyInstallment;
  const balanceRemaining = Math.max(0, totalPayable - paidSoFar);

  const loanData = {
    id: loanId || `L${(window.posState.loans || []).length + 1}`,
    lenderName,
    principalAmount: principal,
    totalPayable,
    dailyInstallment,
    totalTerms,
    termsPaid,
    balanceRemaining,
    status: balanceRemaining <= 0 ? "completed" : "active",
    startDate,
    notes
  };

  if (loanId) {
    const idx = (window.posState.loans || []).findIndex(l => l.id === loanId);
    if (idx >= 0) window.posState.loans[idx] = loanData;
  } else {
    if (!window.posState.loans) window.posState.loans = [];
    window.posState.loans.push(loanData);
  }

  savePOSState();
  closeModal("loanModal");
  renderLoanTracker();
  renderAccountingDashboard();
  alert(`✅ บันทึกสัญญา ${loanData.id} เรียบร้อยแล้ว!`);
}

function deleteLoanContract(loanId) {
  if (!confirm(`ยืนยันการลบสัญญาเงินกู้รหัส ${loanId}? รายการผ่อนชำระในอดีตจะไม่ถูกลบ`)) return;
  window.posState.loans = (window.posState.loans || []).filter(l => l.id !== loanId);
  savePOSState();
  renderLoanTracker();
  renderAccountingDashboard();
}

// -------------------------------------------------------------
// 8. ACCOUNTING TARGETS & SETTINGS MODAL
// -------------------------------------------------------------

function openAccountingSettingsModal() {
  const s = window.posState.settings || {};
  document.getElementById("setInitialCash").value = s.initialCash || 2000;
  document.getElementById("setTargetSales").value = s.targetDailySales || 8000;
  document.getElementById("setTargetFoodCost").value = s.targetFoodCostPct || 35;
  document.getElementById("setTargetLaborCost").value = s.targetLaborCostPct || 18;
  document.getElementById("setTargetNetMargin").value = s.targetNetMarginPct || 15;
  document.getElementById("setWorkingDays").value = s.workingDaysPerMonth || 26;
  document.getElementById("setMonthlyFixed").value = s.monthlyFixedCosts || 18000;
  openModal("accountingSettingsModal");
}

function handleSaveAccountingSettings(event) {
  event.preventDefault();
  const s = window.posState.settings || {};
  s.initialCash = Number(document.getElementById("setInitialCash")?.value) || 2000;
  s.targetDailySales = Number(document.getElementById("setTargetSales")?.value) || 8000;
  s.targetFoodCostPct = Number(document.getElementById("setTargetFoodCost")?.value) || 35;
  s.targetLaborCostPct = Number(document.getElementById("setTargetLaborCost")?.value) || 18;
  s.targetNetMarginPct = Number(document.getElementById("setTargetNetMargin")?.value) || 15;
  s.workingDaysPerMonth = Number(document.getElementById("setWorkingDays")?.value) || 26;
  s.monthlyFixedCosts = Number(document.getElementById("setMonthlyFixed")?.value) || 18000;

  window.posState.settings = s;
  savePOSState();
  closeModal("accountingSettingsModal");
  renderAccountingDashboard();
  renderShiftClosingView();
  alert("✅ บันทึกการตั้งค่าเป้าหมายและต้นทุนคงที่เรียบร้อยแล้ว!");
}
