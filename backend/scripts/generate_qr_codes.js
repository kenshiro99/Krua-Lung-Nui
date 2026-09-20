const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const QR_OUTPUT_DIR = path.join(ROOT_DIR, 'qr_codes');
const PRINT_HTML_FILE = path.join(ROOT_DIR, 'ป้าย_QR_Code_ทุกโต๊ะ_พร้อมพิมพ์.html');

if (!fs.existsSync(QR_OUTPUT_DIR)) {
  fs.mkdirSync(QR_OUTPUT_DIR, { recursive: true });
}

// Default base URL (GitHub Pages production, or override via argument)
const GITHUB_BASE_URL = 'https://kenshiro99.github.io/Krua-Lung-Nui/frontend/index.html';

const tables = [
  { id: 't-1', name: 'โต๊ะ 1', num: '1', query: '?table=1' },
  { id: 't-2', name: 'โต๊ะ 2', num: '2', query: '?table=2' },
  { id: 't-3', name: 'โต๊ะ 3', num: '3', query: '?table=3' },
  { id: 't-4', name: 'โต๊ะ 4', num: '4', query: '?table=4' },
  { id: 't-5', name: 'โต๊ะ 5', num: '5', query: '?table=5' },
  { id: 't-6', name: 'โต๊ะ 6', num: '6', query: '?table=6' },
  { id: 't-7', name: 'โต๊ะ 7', num: '7', query: '?table=7' },
  { id: 't-8', name: 'โต๊ะ 8', num: '8', query: '?table=8' },
  { id: 't-9', name: 'โต๊ะ 9', num: '9', query: '?table=9' },
  { id: 't-10', name: 'โต๊ะ 10', num: '10', query: '?table=10' },
  { id: 'takeaway', name: 'สั่งกลับบ้าน', num: 'Takeaway', query: '?type=takeaway', isTakeaway: true }
];

async function generateAll() {
  console.log('🚀 กำลังสร้าง QR Code ทุกโต๊ะอัตโนมัติ...');
  const results = [];

  for (const item of tables) {
    const targetUrl = `${GITHUB_BASE_URL}${item.query}`;
    const filenamePrefix = item.isTakeaway ? 'สั่งกลับบ้าน_Takeaway' : `โต๊ะ_${item.num}`;
    const pngPath = path.join(QR_OUTPUT_DIR, `${filenamePrefix}.png`);
    const svgPath = path.join(QR_OUTPUT_DIR, `${filenamePrefix}.svg`);

    // 1. Generate High-Res PNG (1000x1000 for crystal-clear print)
    await QRCode.toFile(pngPath, targetUrl, {
      width: 1000,
      margin: 2,
      color: {
        dark: item.isTakeaway ? '#9a3412' : '#0f172a',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    });

    // 2. Generate Vector SVG
    const svgString = await QRCode.toString(targetUrl, {
      type: 'svg',
      margin: 2,
      color: {
        dark: item.isTakeaway ? '#9a3412' : '#0f172a',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    });
    fs.writeFileSync(svgPath, svgString, 'utf8');

    // 3. Generate Base64 Data URL for standalone HTML
    const dataUrl = await QRCode.toDataURL(targetUrl, {
      width: 450,
      margin: 2,
      color: {
        dark: item.isTakeaway ? '#9a3412' : '#0f172a',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    });

    results.push({ ...item, targetUrl, dataUrl, filenamePrefix });
    console.log(`  ✅ สร้างสำเร็จ: ${item.name} -> ${filenamePrefix}.png / .svg`);
  }

  // Generate Standalone Print-Ready HTML document
  generatePrintHtml(results);
  console.log('🎉 สร้าง QR Code และหน้าเอกสารพร้อมพิมพ์เรียบร้อย 100%');
}

function generatePrintHtml(items) {
  const dineInItems = items.filter(i => !i.isTakeaway);
  const takeawayItem = items.find(i => i.isTakeaway);

  const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ป้าย QR Code สแกนสั่งอาหาร - ครัวลุงหนุ่ย (พร้อมพิมพ์ทันที)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Prompt', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #f1f5f9;
      color: #0f172a;
      padding: 1.5rem 1rem;
    }

    /* Top Control Bar */
    .top-controls {
      max-width: 900px;
      margin: 0 auto 1.5rem auto;
      background: #ffffff;
      padding: 1rem 1.5rem;
      border-radius: 12px;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    .top-controls h1 {
      font-size: 1.25rem;
      font-weight: 800;
      color: #ea580c;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .top-controls p {
      font-size: 0.85rem;
      color: #64748b;
      margin-top: 0.2rem;
    }

    .btn-print {
      background: linear-gradient(135deg, #ea580c, #f97316);
      color: #ffffff;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-family: inherit;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      box-shadow: 0 4px 12px rgba(234, 88, 12, 0.3);
      transition: all 0.2s ease;
    }

    .btn-print:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(234, 88, 12, 0.4);
    }

    /* Print Container Grid (2 Columns per A4 page) */
    .print-container {
      max-width: 900px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    /* Stand Card */
    .qr-stand-card {
      background: #ffffff;
      border: 2px dashed #cbd5e1;
      border-radius: 16px;
      padding: 1.5rem 1.25rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      position: relative;
      page-break-inside: avoid;
      break-inside: avoid;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
      min-height: 520px;
    }

    .qr-stand-card::before {
      content: '✂️ ตัดตามรอยประ หรือ พับตั้งโต๊ะ (Tent Card)';
      position: absolute;
      top: -11px;
      left: 50%;
      transform: translateX(-50%);
      background: #ffffff;
      padding: 0 10px;
      font-size: 0.7rem;
      color: #94a3b8;
      font-weight: 500;
      white-space: nowrap;
    }

    .qr-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.35rem;
      width: 100%;
    }

    .qr-logo-wrap {
      width: 58px;
      height: 58px;
      border-radius: 50%;
      border: 3px solid #f97316;
      padding: 2px;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(249, 115, 22, 0.2);
    }

    .qr-logo-img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
    }

    .qr-shop-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.01em;
    }

    .qr-shop-sub {
      font-size: 0.8rem;
      color: #64748b;
      font-weight: 500;
    }

    .qr-table-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #ea580c, #f97316);
      color: #ffffff;
      padding: 0.45rem 1.25rem;
      border-radius: 9999px;
      font-size: 1.35rem;
      font-weight: 800;
      margin: 0.65rem 0;
      box-shadow: 0 4px 12px rgba(234, 88, 12, 0.25);
      width: 82%;
    }

    .qr-image-wrap {
      background: #ffffff;
      padding: 0.75rem;
      border-radius: 12px;
      border: 2px solid #fed7aa;
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 0.35rem 0;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.04);
    }

    .qr-image-wrap img {
      width: 170px;
      height: 170px;
      display: block;
    }

    .qr-steps {
      width: 100%;
      background: #f8fafc;
      border-radius: 10px;
      padding: 0.65rem 0.85rem;
      margin: 0.5rem 0;
      border: 1px solid #f1f5f9;
      text-align: left;
    }

    .qr-step-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.82rem;
      color: #334155;
      padding: 0.2rem 0;
    }

    .qr-step-badge {
      width: 19px;
      height: 19px;
      border-radius: 50%;
      background: #ea580c;
      color: #ffffff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
      font-weight: 700;
      flex-shrink: 0;
    }

    .qr-footer {
      font-size: 0.75rem;
      color: #64748b;
      margin-top: 0.25rem;
    }

    /* Takeaway Theme */
    .takeaway-theme {
      border: 2.5px dashed #ea580c;
      background: #fffbf7;
    }

    .takeaway-theme .qr-table-badge {
      background: linear-gradient(135deg, #d97706, #f59e0b);
      box-shadow: 0 4px 12px rgba(217, 119, 6, 0.25);
    }

    .takeaway-theme .qr-image-wrap {
      border-color: #fde68a;
    }

    .takeaway-theme .qr-step-badge {
      background: #d97706;
    }

    /* Print Styles */
    @media print {
      body {
        background: #ffffff !important;
        padding: 0 !important;
      }

      .no-print {
        display: none !important;
      }

      .print-container {
        max-width: 100% !important;
        width: 100% !important;
        display: grid !important;
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 8mm !important;
      }

      .qr-stand-card {
        box-shadow: none !important;
        border: 1.5px dashed #94a3b8 !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        margin-bottom: 8mm !important;
      }

      @page {
        size: A4 portrait;
        margin: 8mm;
      }
    }
  </style>
</head>
<body>

  <!-- Top Control Bar (Hidden when printing) -->
  <div class="top-controls no-print">
    <div>
      <h1>🖨️ ป้าย QR Code ประจำโต๊ะ & จุดสั่งกลับบ้าน (ครัวลุงหนุ่ย)</h1>
      <p>จัดหน้าพร้อมพิมพ์ลงกระดาษ A4 (2 โต๊ะต่อ 1 หน้า) มีรอยประตัด/พับ หรือใส่กรอบอะคริลิกใสได้ทันที</p>
    </div>
    <button class="btn-print" onclick="window.print()">
      🖨️ สั่งพิมพ์ทันที (Print A4)
    </button>
  </div>

  <!-- Main Printable Container -->
  <div class="print-container">
    <!-- Takeaway Stand -->
    ${takeawayItem ? `
    <div class="qr-stand-card takeaway-theme">
      <div class="qr-header">
        <div class="qr-logo-wrap" style="border-color: #ea580c;">
          <img src="backend/logo/logo.jpg" alt="โลโก้ครัวลุงหนุ่ย" class="qr-logo-img" onerror="this.src='backend/logo/logo.png'">
        </div>
        <div class="qr-shop-title" style="color: #9a3412;">ครัวลุงหนุ่ย (Krua Lung Nui)</div>
        <div class="qr-shop-sub">จุดบริการสั่งอาหารกลับบ้าน (Takeaway)</div>
      </div>

      <div class="qr-table-badge">
        <span>🛍️ สั่งอาหารกลับบ้าน</span>
      </div>

      <div class="qr-image-wrap">
        <img src="${takeawayItem.dataUrl}" alt="QR Code สั่งกลับบ้าน">
      </div>

      <div class="qr-steps" style="background: #fff7ed; border-color: #fed7aa;">
        <div class="qr-step-row">
          <span class="qr-step-badge">1</span>
          <span>สแกน QR เพื่อเลือกรายการอาหารบนมือถือ</span>
        </div>
        <div class="qr-step-row">
          <span class="qr-step-badge">2</span>
          <span>กดสั่งอาหารเพื่อรับ "หมายเลขคิว" ทันที</span>
        </div>
        <div class="qr-step-row">
          <span class="qr-step-badge">3</span>
          <span>โอนจ่ายผ่านพร้อมเพย์ แล้วรอรับอาหารปรุงสด</span>
        </div>
      </div>

      <div class="qr-footer" style="color: #9a3412;">
        <strong>⚡ สั่งง่าย รวดเร็ว ไม่ต้องยืนรอคิวหน้าร้าน</strong>
        <div style="font-size: 0.7rem; color: #b45309; margin-top: 2px;">ครัวลุงหนุ่ยยินดีให้บริการครับ 🙏</div>
      </div>
    </div>
    ` : ''}

    <!-- Dine-in Tables (1 to 10) -->
    ${dineInItems.map(t => `
    <div class="qr-stand-card">
      <div class="qr-header">
        <div class="qr-logo-wrap">
          <img src="backend/logo/logo.jpg" alt="โลโก้ครัวลุงหนุ่ย" class="qr-logo-img" onerror="this.src='backend/logo/logo.png'">
        </div>
        <div class="qr-shop-title">ครัวลุงหนุ่ย (Krua Lung Nui)</div>
        <div class="qr-shop-sub">รสชาติต้นตำรับ • อร่อยเหมือนกินที่บ้าน</div>
      </div>

      <div class="qr-table-badge">
        <span>🍽️ โต๊ะ ${t.num}</span>
      </div>

      <div class="qr-image-wrap">
        <img src="${t.dataUrl}" alt="QR Code โต๊ะ ${t.num}">
      </div>

      <div class="qr-steps">
        <div class="qr-step-row">
          <span class="qr-step-badge">1</span>
          <span>เปิดกล้องมือถือ หรือ LINE สแกน QR Code</span>
        </div>
        <div class="qr-step-row">
          <span class="qr-step-badge">2</span>
          <span>เลือกเมนูอาหาร ระบุตัวเลือก แล้วกดส่งสั่ง</span>
        </div>
        <div class="qr-step-row">
          <span class="qr-step-badge">3</span>
          <span>รายการส่งตรงถึงห้องครัวปรุงสดทันที</span>
        </div>
      </div>

      <div class="qr-footer">
        <div>✨ สแกนสั่งเพิ่มหรือเรียกพนักงานได้ตลอดเวลา</div>
        <div style="font-size: 0.7rem; color: #94a3b8; margin-top: 2px;">เบอร์โทรติดต่อ: 089-123-4567</div>
      </div>
    </div>
    `).join('')}
  </div>

</body>
</html>`;

  fs.writeFileSync(PRINT_HTML_FILE, html, 'utf8');
}

generateAll().catch(console.error);
