/**
 * Thai PromptPay EMVCo QR Code Payload Generator (Standard CRC16-CCITT)
 * รองรับการสร้างสตริง PromptPay Payload สำหรับสแกนจ่ายผ่าน Mobile Banking ทุกธนาคาร
 */

function crc16(data) {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    let x = ((crc >> 8) ^ data.charCodeAt(i)) & 0xFF;
    x ^= x >> 4;
    crc = ((crc << 8) ^ (x << 12) ^ (x << 5) ^ x) & 0xFFFF;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function formatField(id, value) {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

function generatePromptPayPayload(target, amount = null) {
  // ทำความสะอาด target (ลบขีด, เว้นวรรค)
  const cleanTarget = target.replace(/[^0-9]/g, '');
  let formattedTarget = '';

  if (cleanTarget.length === 10) {
    // เบอร์มือถือ: แปลงเป็น 0066 + 9 หลักหลัง
    formattedTarget = '0066' + cleanTarget.substring(1);
  } else if (cleanTarget.length === 13) {
    // เลขบัตรประชาชน / เลขประจำตัวผู้เสียภาษี
    formattedTarget = cleanTarget;
  } else {
    // กรณีใส่ไม่ครบ ให้ส่งกลับแบบ format ป้องกัน error
    formattedTarget = cleanTarget;
  }

  // Tag 29: Merchant Account Information (PromptPay)
  const aid = formatField('00', 'A000000677010111');
  const recipient = formatField(cleanTarget.length === 13 ? '02' : '01', formattedTarget);
  const merchantInfo = formatField('29', aid + recipient);

  let payload = '';
  // Tag 00: Payload Format Indicator
  payload += formatField('00', '01');
  // Tag 01: Point of Initiation Method (11 = Static QR, 12 = Dynamic QR with amount)
  payload += formatField('01', amount && amount > 0 ? '12' : '11');
  // Tag 29: Merchant Info
  payload += merchantInfo;
  // Tag 53: Transaction Currency (764 = THB)
  payload += formatField('53', '764');

  // Tag 54: Transaction Amount
  if (amount && Number(amount) > 0) {
    const formattedAmount = Number(amount).toFixed(2);
    payload += formatField('54', formattedAmount);
  }

  // Tag 58: Country Code (TH)
  payload += formatField('58', 'TH');

  // Tag 63: CRC Checksum
  payload += '6304';
  const checksum = crc16(payload);
  return payload + checksum;
}
