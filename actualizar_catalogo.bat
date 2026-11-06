@echo off
setlocal
cd /d "%~dp0"
title Actualizar catalogo de estudios

set "PY="
where py >nul 2>nul && set "PY=py"
if not defined PY (where python >nul 2>nul && set "PY=python")
if not defined PY (
  echo No se encontro Python. Instalalo desde https://www.python.org/downloads/
  pause
  exit /b 1
)

echo Regenerando js\catalogo.js ...
echo ^(si la carpeta md tiene archivos, se leen sus titulos reales; si no, se usa indexmd.txt^)
echo.
%PY% gen_catalogo.py
echo.
pause
