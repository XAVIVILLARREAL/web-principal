@echo off
setlocal enabledelayedexpansion
color 0B
echo ===================================================
echo   COMPILADOR SUPER AUTOMATICO - AI STUDIO
echo ===================================================
echo.

:: 1. Buscar el archivo .zip en la carpeta actual
set "ZIP_FILE="
for %%F in (*.zip) do (
    set "ZIP_FILE=%%F"
    goto :found_zip
)

:found_zip
if "%ZIP_FILE%"=="" (
    color 0C
    echo ERROR: No se encontro ningun archivo .zip en esta carpeta.
    echo Por favor, pon este archivo .bat exactamente al lado de tu .zip descargado.
    pause
    exit /b
)

echo [1/6] Archivo ZIP encontrado: %ZIP_FILE%
echo [2/6] Descomprimiendo de forma inteligente...

:: Crear carpeta temporal para extraer
set "TEMP_DIR=%~dp0_temp_build"
if exist "%TEMP_DIR%" rd /s /q "%TEMP_DIR%"
mkdir "%TEMP_DIR%"

:: Descomprimir usando PowerShell (nativo en Windows 10/11)
powershell -command "Expand-Archive -Path '%ZIP_FILE%' -DestinationPath '%TEMP_DIR%' -Force"

echo [3/6] Buscando el proyecto (package.json)...
set "PROJ_DIR="
for /r "%TEMP_DIR%" %%I in (package.json) do (
    set "PROJ_DIR=%%~dpI"
    goto :found_proj
)

:found_proj
if "%PROJ_DIR%"=="" (
    color 0C
    echo ERROR: No se encontro package.json dentro del ZIP.
    echo Asegurate de que es el codigo fuente correcto de React/Vite.
    pause
    exit /b
)

echo Proyecto encontrado en: %PROJ_DIR%
cd /d "%PROJ_DIR%"

echo.
echo [4/6] Instalando dependencias (npm install)...
call npm install

echo.
echo [5/6] Compilando el proyecto (npm run build)...
call npm run build

if not exist "dist\index.html" (
    color 0C
    echo.
    echo ERROR: La compilacion fallo. No se genero la carpeta 'dist'.
    pause
    exit /b
)

echo.
echo [6/6] Limpiando y preparando tu web final...

:: Volver a la carpeta original donde esta el .bat
cd /d "%~dp0"

:: Mover los archivos compilados a la carpeta raiz (al lado del .bat)
xcopy "%PROJ_DIR%dist\*" "%~dp0" /E /H /C /I /Y >nul

:: Borrar la carpeta temporal con todo el codigo fuente pesado y node_modules
rd /s /q "%TEMP_DIR%"

color 0A
echo.
echo ===================================================
echo   EXITO TOTAL! 
echo   Tu web compilada esta lista al lado de este archivo.
echo   Ahi encontraras tu index.html y la carpeta assets.
echo   (El codigo fuente pesado fue eliminado automaticamente)
echo ===================================================
pause