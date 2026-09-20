@echo off
chcp 65001 > nul
echo ==============================================================================
echo   ครัวลุงหนุ่ย - ตัวช่วยนำระบบขึ้น GitHub (Krua-Lung-Nui)
echo   Repository: https://github.com/kenshiro99/Krua-Lung-Nui
echo ==============================================================================
echo.

where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] ไม่พบโปรแกรม Git ในระบบ (PATH)
    echo [*] กำลังติดตั้ง Git อัตโนมัติผ่าน Windows Package Manager (winget)...
    winget install --id Git.Git -e --source winget --accept-source-agreements --accept-package-agreements
    if %errorlevel% neq 0 (
        echo [X] การติดตั้ง Git ไม่สำเร็จ กรุณาดาวน์โหลดและติดตั้ง Git จาก https://git-scm.com/download/win แล้วลองใหม่อีกครั้ง
        pause
        exit /b 1
    )
    echo [✓] ติดตั้ง Git สำเร็จ กรุณาปิดหน้าต่างนี้แล้วเปิดใหม่เพื่อเริ่มใช้งาน
    pause
    exit /b 0
)

echo [*] เริ่มต้นการเตรียมพื้นที่ Git Repository...
if not exist ".git" (
    git init
    git branch -M main
    git remote add origin https://github.com/kenshiro99/Krua-Lung-Nui.git
    echo [✓] กำหนด Remote origin: https://github.com/kenshiro99/Krua-Lung-Nui.git เรียบร้อย
) else (
    git remote set-url origin https://github.com/kenshiro99/Krua-Lung-Nui.git
)

echo [*] ตรวจสอบและเลือกไฟล์ขึ้น Git (ระบบจะคัดแยกไฟล์ zip ขนาดใหญ่ออกอัตโนมัติ)...
git add .

echo [*] บันทึกการเปลี่ยนแปลง (Commit)...
git commit -m "feat: Krua Lung Nui POS - Modular Menus, Supabase Cloud Engine, QR Ordering & Accounting"

echo.
echo ==============================================================================
echo   พร้อมส่งข้อมูลขึ้น GitHub แล้ว!
echo   หากเป็นการ Push ครั้งแรก ระบบของ GitHub อาจขอให้คุณ Login หรือยืนยันตัวตน
echo ==============================================================================
echo.
set /p confirm="ต้องการ Push โค้ดขึ้น GitHub ตอนนี้เลยหรือไม่? (Y/N): "
if /i "%confirm%"=="Y" (
    echo [*] กำลัง Push ไปยัง origin main...
    git push -u origin main
    echo.
    echo [✓] ดำเนินการเสร็จสิ้น! สามารถตรวจสอบโปรเจกต์ได้ที่:
    echo     https://github.com/kenshiro99/Krua-Lung-Nui
) else (
    echo [*] ยกเลิกการ Push สามารถรันคำสั่ง 'git push -u origin main' ด้วยตนเองภายหลังได้ครับ
)

echo.
pause
