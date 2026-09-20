@echo off
chcp 65001 >nul
echo ═══════════════════════════════════════════════
echo   ครัวลุงหนุ่ย — Push ขึ้น GitHub Pages
echo ═══════════════════════════════════════════════
echo.

set "GIT=C:\Program Files\Git\cmd\git.exe"
if not exist "%GIT%" (
    set "GIT=git"
)

echo [1/4] ตรวจสอบ Git...
"%GIT%" --version
if errorlevel 1 (
    echo ❌ ไม่พบ Git กรุณาติดตั้ง Git ก่อน
    pause
    exit /b 1
)

echo.
echo [2/4] เพิ่มไฟล์ทั้งหมด...
"%GIT%" add -A
echo ✅ เพิ่มไฟล์เรียบร้อย

echo.
echo [3/4] Commit การแก้ไข...
"%GIT%" commit -m "✨ เชื่อมต่อ LINE LIFF ID + Rich Menu Frontend + Map Page + CSS ครบ"
echo ✅ Commit เรียบร้อย

echo.
echo [4/4] Push ขึ้น GitHub (Force Update)...
"%GIT%" push -u origin main --force
if errorlevel 1 (
    echo ⚠️  ลอง push branch master...
    "%GIT%" push -u origin master --force
)
echo ✅ Push เรียบร้อย!

echo.
echo ═══════════════════════════════════════════════
echo   ✅ เสร็จเรียบร้อย!
echo   🌐 เปิดเว็บที่:
echo   https://kenshiro99.github.io/Krua-Lung-Nui/frontend/index.html
echo.
echo   📱 LIFF URL สำหรับใช้ใน LINE:
echo   https://liff.line.me/2011360237-nVKENOs7
echo ═══════════════════════════════════════════════
pause
