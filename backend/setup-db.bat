@echo off
cd /d "c:\Users\kosta\Downloads\Monitoring-and-Adherence-System-main (1)\Monitoring-and-Adherence-System-main\backend"
echo.
echo [1/3] Removing old node_modules...
rmdir /s /q node_modules 2>nul
echo [2/3] Removing package-lock.json...
del package-lock.json 2>nul
echo [3/3] Installing dependencies (Prisma 6)...
call npm install
echo.
echo [4/4] Pushing schema to database...
call npm run db:push
echo.
echo Done! Database should now be initialized.
pause
