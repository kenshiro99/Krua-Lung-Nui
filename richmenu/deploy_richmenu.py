#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ครัวลุงหนุ่ย - สคริปต์สร้างและอัปโหลด Rich Menu (แบบมีหัวป้ายร้าน 7 ช่อง) เข้าสู่ LINE Official Account
"""
import os
import sys
import json
import urllib.request
import urllib.error

# Ensure UTF-8 output on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_PATH = os.path.join(SCRIPT_DIR, "richmenu_with_header.json")
IMAGE_PATH = os.path.join(SCRIPT_DIR, "richmenu_with_header_2500x1686.jpg")

LINE_API_BASE = "https://api.line.me/v2/bot"
LINE_DATA_BASE = "https://api-data.line.me/v2/bot"

def get_headers(token, content_type="application/json"):
    return {
        "Authorization": f"Bearer {token.strip()}",
        "Content-Type": content_type
    }

def create_rich_menu(token, rich_menu_data):
    url = f"{LINE_API_BASE}/richmenu"
    data = json.dumps(rich_menu_data, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=get_headers(token), method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode("utf-8"))
            return res.get("richMenuId")
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8")
        print(f"❌ [Error] สร้าง Rich Menu ไม่สำเร็จ: HTTP {e.code} - {err}")
        return None

def upload_rich_menu_image(token, rich_menu_id, image_path):
    url = f"{LINE_DATA_BASE}/richmenu/{rich_menu_id}/content"
    with open(image_path, "rb") as f:
        img_bytes = f.read()
    
    req = urllib.request.Request(url, data=img_bytes, headers=get_headers(token, "image/jpeg"), method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status == 200
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8")
        print(f"❌ [Error] อัปโหลดรูปภาพไม่สำเร็จ: HTTP {e.code} - {err}")
        return False

def set_default_rich_menu(token, rich_menu_id):
    url = f"{LINE_API_BASE}/user/all/richmenu/{rich_menu_id}"
    req = urllib.request.Request(url, headers=get_headers(token), method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status == 200
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8")
        print(f"❌ [Error] ตั้งค่า Default Rich Menu ไม่สำเร็จ: HTTP {e.code} - {err}")
        return False

def main():
    print("=" * 60)
    print("  ครัวลุงหนุ่ย - อัปโหลด LINE Rich Menu (แบบมีหัวป้ายร้าน 7 จุด)")
    print("=" * 60)

    token = os.environ.get("LINE_CHANNEL_ACCESS_TOKEN", "").strip()
    if len(sys.argv) > 1 and sys.argv[1].strip():
        token = sys.argv[1].strip()

    if not token:
        print("\nกรุณานำ Channel Access Token (Long-lived) มาจาก LINE Developers Console")
        print("เข้าที่: https://developers.line.biz/ ➔ Channel Messaging API ➔ แท็บ Messaging API ➔ Issue Token\n")
        token = input("👉 วาง LINE Channel Access Token ที่นี่: ").strip()

    if not token:
        print("❌ ไม่พบ Token ยกเลิกการทำงาน")
        sys.exit(1)

    if not os.path.exists(JSON_PATH):
        print(f"❌ ไม่พบไฟล์คอนฟิก: {JSON_PATH}")
        sys.exit(1)

    if not os.path.exists(IMAGE_PATH):
        print(f"❌ ไม่พบไฟล์รูปภาพ: {IMAGE_PATH}")
        sys.exit(1)

    with open(JSON_PATH, "r", encoding="utf-8") as f:
        rich_menu_config = json.load(f)

    print("\n[1/3] กำลังส่งโครงสร้างพิกัด 7 จุดเข้าสู่ LINE API...")
    rich_menu_id = create_rich_menu(token, rich_menu_config)
    if not rich_menu_id:
        print("\n❌ ล้มเหลวในขั้นตอนสร้าง Rich Menu ตรวจสอบความถูกต้องของ Token")
        sys.exit(1)
    print(f"✅ สร้าง Rich Menu สำเร็จ! ID: {rich_menu_id}")

    print("\n[2/3] กำลังอัปโหลดรูปภาพ 2500x1686 (แบบมีหัวป้ายร้าน)...")
    if not upload_rich_menu_image(token, rich_menu_id, IMAGE_PATH):
        print("\n❌ ล้มเหลวในขั้นตอนอัปโหลดรูปภาพ")
        sys.exit(1)
    print("✅ อัปโหลดรูปภาพสำเร็จ!")

    print("\n[3/3] กำลังตั้งค่าให้เป็นริชเมนูเริ่มต้นสำหรับลูกค้าทุกคน (Default Rich Menu)...")
    if not set_default_rich_menu(token, rich_menu_id):
        print("\n❌ ล้มเหลวในการตั้งค่าเป็น Default")
        sys.exit(1)
    print("✅ เปิดใช้งานริชเมนูเป็นค่าเริ่มต้นเรียบร้อยแล้ว!")

    print("\n" + "=" * 60)
    print("🎉 ยินดีด้วยครับ! ริชเมนูแบบมีหัวป้ายร้านเปิดใช้งานบน LINE OA เรียบร้อยแล้ว")
    print(f"📌 Rich Menu ID: {rich_menu_id}")
    print("📱 เมื่อลูกค้าเปิดห้องแชท LINE @727hhzfp จะเห็นริชเมนูใหม่ทันทีครับ")
    print("=" * 60)

if __name__ == "__main__":
    main()
