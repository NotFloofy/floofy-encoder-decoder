@echo off
pushd "%~dp0"

node "encoder and decoder.js"
if errorlevel 1 (
  echo the script had an error >w<
) else (
  echo all done owo
)

echo.
pause