/**
 * ครัวลุงหนุ่ย - สคริปต์อัปโหลดรูปภาพทั้งหมดขึ้น Supabase Storage Bucket
 * Bucket: krua-lung-nui-assets
 * Project: myajcbynabcwfmlvqpwv
 *
 * วิธีใช้งาน:
 * node upload_to_supabase_bucket.js <SUPABASE_SERVICE_ROLE_KEY หรือ ANON_KEY>
 */

const fs = require('fs');
const path = require('path');

const BUCKET = 'krua-lung-nui-assets';
const PROJECT_URL = 'https://myajcbynabcwfmlvqpwv.supabase.co';
const API_KEY = process.argv[2] || process.env.SUPABASE_KEY || '';

if (!API_KEY) {
  console.log('================================================================');
  console.log('  ครัวลุงหนุ่ย - ตัวช่วยอัปโหลดรูปภาพขึ้น Supabase Storage');
  console.log('================================================================');
  console.log('กรุณาระบุ Supabase API Key (แนะนำ Service Role Key หรือ Anon Key):');
  console.log('ตัวอย่างคำสั่ง:');
  console.log('  node upload_to_supabase_bucket.js eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
  console.log('================================================================');
  process.exit(1);
}

const imageDir = path.join(__dirname, 'image');
if (!fs.existsSync(imageDir)) {
  console.error('ไม่พบโฟลเดอร์ image ที่:', imageDir);
  process.exit(1);
}

const files = fs.readdirSync(imageDir);
console.log(`พบรูปภาพในโฟลเดอร์ image ทั้งหมด: ${files.length} ไฟล์`);
console.log(`เป้าหมาย Bucket: ${BUCKET} (${PROJECT_URL})`);
console.log('----------------------------------------------------------------');

async function uploadFile(filename) {
  const filePath = path.join(imageDir, filename);
  const fileBuffer = fs.readFileSync(filePath);
  const ext = path.extname(filename).toLowerCase();
  const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';
  
  // Clean safe name for Supabase storage
  const safeName = filename;
  const uploadUrl = `${PROJECT_URL}/storage/v1/object/${BUCKET}/${encodeURIComponent(safeName)}`;

  try {
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'apikey': API_KEY,
        'Content-Type': contentType,
        'x-upsert': 'true'
      },
      body: fileBuffer
    });

    if (response.ok) {
      const publicUrl = `${PROJECT_URL}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(safeName)}`;
      console.log(`[✓] อัปโหลดสำเร็จ: ${filename} -> ${publicUrl}`);
      return true;
    } else {
      const errText = await response.text();
      console.error(`[X] อัปโหลดล้มเหลว: ${filename} (${response.status}): ${errText}`);
      return false;
    }
  } catch (err) {
    console.error(`[X] เกิดข้อผิดพลาดใน ${filename}:`, err.message);
    return false;
  }
}

async function start() {
  let successCount = 0;
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    console.log(`[${i + 1}/${files.length}] กำลังอัปโหลด ${f}...`);
    const ok = await uploadFile(f);
    if (ok) successCount++;
  }
  console.log('----------------------------------------------------------------');
  console.log(`เสร็จสิ้น: อัปโหลดสำเร็จ ${successCount}/${files.length} ไฟล์`);
}

start();
