# 1. Ubicación y Nombre
$Aqui = $PSScriptRoot
$MiNombre = $MyInvocation.MyCommand.Name
Set-Location -Path $Aqui

Write-Host "--- MODO CONSTRUCTOR PRO ACTIVADO (VITE + RUTAS RELATIVAS) ---" -ForegroundColor Cyan

# 2. Buscar el ZIP
$Zip = Get-ChildItem -Path $Aqui -Filter "*.zip" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if ($null -eq $Zip) { Write-Host "[!] No hay ZIP en esta carpeta." -ForegroundColor Red; pause; exit }

# 3. Limpieza de archivos anteriores
Write-Host "[*] Limpiando archivos viejos..." -ForegroundColor Yellow
Get-ChildItem -Path $Aqui -Exclude $MiNombre, $Zip.Name, ".git", ".gitignore" | Remove-Item -Recurse -Force

# 4. Extracción
Write-Host "[+] Extrayendo código de la IA..." -ForegroundColor Green
Expand-Archive -Path $Zip.FullName -DestinationPath $Aqui -Force

# 5. --- EL PASO MÁGICO DE NPM (BUILD CON RUTA RELATIVA) ---
if (Test-Path "$Aqui\package.json") {
    Write-Host "[!] Detectado proyecto de NPM. Iniciando construcción..." -ForegroundColor Magenta
    
    # 5.1 Instalar dependencias
    Write-Host "[1/2] Instalando librerías (npm install)..." -ForegroundColor Gray
    npm install

    # 5.2 Build forzado con base relativa (ARREGLA LA PANTALLA NEGRA)
    Write-Host "[2/2] Cocinando la web con rutas relativas (--base=./)..." -ForegroundColor Gray
    npx vite build --base=./

    # 5.3 Mover el contenido de DIST a la carpeta actual
    if (Test-Path "$Aqui\dist") {
        Write-Host "[+] Extrayendo archivos listos desde la carpeta DIST..." -ForegroundColor Green
        Get-ChildItem -Path "$Aqui\dist\*" | Move-Item -Destination $Aqui -Force
        
        # 5.4 LIMPIEZA AGRESIVA: Solo dejamos lo que la web necesita para internet
        Write-Host "[*] Eliminando código fuente y carpetas pesadas..." -ForegroundColor Gray
        $Basura = @("dist", "node_modules", "src", "public", "package.json", "package-lock.json", "tsconfig.json", "vite.config.ts", "metadata.json", "README.md", ".env.example")
        foreach ($item in $Basura) {
            if (Test-Path "$Aqui\$item") { Remove-Item -Path "$Aqui\$item" -Recurse -Force -ErrorAction SilentlyContinue }
        }
    }
}

# 6. Detective de Index (Aseguramos que el archivo se llame index.html)
if (-not (Test-Path "$Aqui\index.html")) {
    $Html = Get-ChildItem -Path $Aqui -Filter "*.html" | Select-Object -First 1
    if ($null -ne $Html) { 
        Rename-Item -Path $Html.FullName -NewName "index.html" 
        Write-Host "[FIX] Renombrado $($Html.Name) a index.html" -ForegroundColor Green
    }
}

# 7. Borrar el ZIP y Subir a GitHub
Remove-Item -Path $Zip.FullName -Force
$GitRoot = git rev-parse --show-toplevel
Set-Location -Path $GitRoot

Write-Host "[*] Subiendo cambios a Cloudflare..." -ForegroundColor Yellow
git add .
$Fecha = Get-Date -Format "HH:mm dd/MM"
git commit -m "Build Automático Xtreme - $Fecha"
git push

Write-Host "`n------------------------------------------------" -ForegroundColor Green
Write-Host "¡PROCESO COMPLETADO! Tu ERP ya debería cargar bien." -ForegroundColor Green
Write-Host "------------------------------------------------" -ForegroundColor Green
pause