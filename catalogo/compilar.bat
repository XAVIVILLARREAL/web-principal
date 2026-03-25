@echo off
color 0A
echo ===================================================
echo   COMPILADOR AUTOMATICO - LIMPIEZA TOTAL
echo ===================================================
echo.

echo [1/4] Instalando dependencias (npm install)...
call npm install

echo.
echo [2/4] Compilando el proyecto (npm run build)...
call npm run build

echo.
echo [3/4] Verificando si la compilacion fue exitosa...
if not exist "dist\index.html" (
    color 0C
    echo.
    echo ERROR: No se genero la carpeta 'dist'. La compilacion fallo.
    echo Revisa los errores arriba.
    pause
    exit /b
)

echo.
echo [4/4] Extrayendo archivos finales y borrando codigo fuente...

:: Crear carpeta temporal segura
mkdir FINAL_WEB
xcopy dist\* FINAL_WEB\ /E /H /C /I /Y >nul

:: Borrar todas las carpetas excepto la temporal
for /d %%x in (*) do (
    if /i not "%%x"=="FINAL_WEB" rd /s /q "%%x"
)

:: Borrar todos los archivos excepto este script .bat
for %%x in (*) do (
    if /i not "%%x"=="compilar.bat" del /q "%%x"
)

:: Mover los archivos finales a la raiz
xcopy FINAL_WEB\* . /E /H /C /I /Y >nul
rd /s /q FINAL_WEB

echo.
echo ===================================================
echo   EXITO! Tu web esta lista.
echo   Solo quedaron index.html y la carpeta assets.
echo   Ya puedes subir estos archivos a tu servidor.
echo ===================================================
pause
