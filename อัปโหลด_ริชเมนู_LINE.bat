@echo off
chcp 65001 > nul
title ครัวลุงหนุ่ย - อัปโหลด LINE Rich Menu แบบมีหัวป้ายร้าน

echo ======================================================================
echo   ครัวลุงหนุ่ย - ติดตั้ง LINE Rich Menu (แบบมีหัวป้ายร้าน 7 จุด)
echo ======================================================================
echo.
echo รูปภาพที่จะใช้: richmenu\richmenu_with_header_2500x1686.jpg
echo ไฟล์พิกัด:     richmenu\richmenu_with_header.json
echo.
python "%~dp0richmenu\deploy_richmenu.py"
if errorlevel 1 (
    echo.
    echo ⚠️  พบข้อผิดพลาด หากคอมพิวเตอร์ยังไม่ได้ติดตั้ง Python ให้ตรวจสอบก่อนครับ
)
echo.
pause
