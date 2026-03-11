# 1. Ubicación y Nombre
$Aqui = $PSScriptRoot
$MiNombre = $MyInvocation.MyCommand.Name
Set-Location -Path $Aqui

Write-Host "--- MODO CONSTRUCTOR ACTIVADO (NPM + GIT) ---" -ForegroundColor Cyan

# 2. Buscar el ZIP
$Zip = Get-ChildItem -Path $Aqui -Filter "*.zip" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if ($null -eq $Zip) { Write-Host "[!] No hay ZIP." -ForegroundColor Red; pause; exit }

# 3. Limpieza Total
Write-Host "[*] Limpiando archivos viejos..." -ForegroundColor Yellow
Get-ChildItem -Path $Aqui -Exclude $MiNombre, $Zip.Name, ".git", ".gitignore" | Remove-Item -Recurse -Force

# 4. Extracción
Write-Host "[+] Extrayendo archivos de la IA..." -ForegroundColor Green
Expand-Archive -Path $Zip.FullName -DestinationPath $Aqui -Force

# 5. --- EL PASO MÁGICO DE NPM ---
if (Test-Path "$Aqui\package.json") {
    Write-Host "[!] Detectado proyecto de NPM. Iniciando construcción..." -ForegroundColor Magenta
    
    # Ejecuta npm install
    Write-Host "[1/2] Instalando librerías (npm install)..." -ForegroundColor Gray
    npm install

    # Ejecuta npm run build
    Write-Host "[2/2] Cocinando la web (npm run build)..." -ForegroundColor Gray
    npm run build

    # SACAR EL CONTENIDO DE DIST (Lo que tú hacías a mano)
    if (Test-Path "$Aqui\dist") {
        Write-Host "[+] Extrayendo archivos listos desde la carpeta DIST..." -ForegroundColor Green
        Get-ChildItem -Path "$Aqui\dist\*" | Move-Item -Destination $Aqui -Force
        
        # Limpieza de lo que ya no sirve (el código crudo y los node_modules)
        Write-Host "[*] Limpiando carpetas de construcción..." -ForegroundColor Gray
        Remove-Item -Path "$Aqui\dist", "$Aqui\node_modules", "$Aqui\src" -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# 6. Detective de Index (Por si la IA le cambió el nombre al archivo en dist)
if (-not (Test-Path "$Aqui\index.html")) {
    $Html = Get-ChildItem -Path $Aqui -Filter "*.html" | Select-Object -First 1
    if ($null -ne $Html) { Rename-Item -Path $Html.FullName -NewName "index.html" }
}

# 7. Borrar el ZIP y Subir a GitHub
Remove-Item -Path $Zip.FullName -Force
$GitRoot = git rev-parse --show-toplevel
Set-Location -Path $GitRoot
git add .
git commit -m "Build Automático - $(Get-Date -Format 'HH:mm')"
git push

Write-Host "`n------------------------------------------------" -ForegroundColor Green
Write-Host "¡WEB COCINADA Y PUBLICADA EXITOSAMENTE!" -ForegroundColor Green
Write-Host "------------------------------------------------" -ForegroundColor Green
pause