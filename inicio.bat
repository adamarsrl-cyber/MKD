@echo off
setlocal
cd /d "%~dp0"
title Portal de Estudios Biblicos RVR1960

set "PY="
where py >nul 2>nul && set "PY=py"
if not defined PY (where python >nul 2>nul && set "PY=python")
if not defined PY (
  echo No se encontro Python. Instalalo desde https://www.python.org/downloads/
  echo y marca la casilla "Add Python to PATH" durante la instalacion.
  pause
  exit /b 1
)

if not exist "md\libro-completo" (
  echo.
  echo AVISO: no encuentro la carpeta md\libro-completo.
  echo Copia dentro de la carpeta "md" el contenido de tu carpeta MKD
  echo ^(libro-completo, por-capitulo, tematicos, parabolas, etc.^).
  echo El sitio abrira igual, pero los estudios no se podran leer.
  echo.
)

echo.
echo  Portal de Estudios Biblicos RVR1960
echo  Abriendo http://localhost:8000
echo  Para detener el servidor cierra esta ventana o presiona Ctrl+C.
echo.
start "" "http://localhost:8000/"
%PY% -m http.server 8000
