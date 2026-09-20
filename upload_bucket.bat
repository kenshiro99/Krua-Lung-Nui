@echo off
chcp 65001 > nul
echo ==============================================================================
echo   ครัวลุงหนุ่ย - อัปโหลดรูปภาพทั้งหมด 53 ไฟล์ขึ้น Supabase Storage Bucket
echo   Bucket Name: krua-lung-nui-assets
echo   Project: https://myajcbynabcwfmlvqpwv.supabase.co
echo ==============================================================================
echo.
set /p key="กรุณาวาง Supabase Key (Service Role Key หรือ Anon Key): "
if "%key%"=="" (
    echo [X] ไม่ได้ระบุ Key ยกเลิกการทำงาน
    pause
    exit /b 1
)

echo [*] กำลังเริ่มอัปโหลดรูปภาพขึ้น Bucket krua-lung-nui-assets...
node "%~dp0upload_to_supabase_bucket.js" %key%
echo.
pause
