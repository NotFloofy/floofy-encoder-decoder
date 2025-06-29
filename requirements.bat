@echo off
node -v >nul 2>&1
if errorlevel 1 (
  echo hey u dont got nodejs pls go install it >w<
  pause
  exit /b
)

pnpm -v >nul 2>&1
if errorlevel 1 (
  echo hmm pnpm missing so imma get it for u
  npm install -g pnpm
  if errorlevel 1 (
    echo oof pnpm install failed pls do it urself :3
    pause
    exit /b
  )
)

echo ok gonna grab ur deps now
pnpm install
if errorlevel 1 (
  echo nah couldnt get deps sry >w<
  pause
  exit /b
)

echo all done >w<
pause