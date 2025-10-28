# 🔧 Script pour configurer CORS sur Firebase Storage

Write-Host "🌐 Configuration CORS pour Firebase Storage..." -ForegroundColor Cyan
Write-Host ""

# Vérifier si gsutil est installé
Write-Host "Vérification de gsutil..." -ForegroundColor Yellow
$gsutil = Get-Command gsutil -ErrorAction SilentlyContinue

if (-not $gsutil) {
    Write-Host "❌ gsutil n'est pas installé" -ForegroundColor Red
    Write-Host ""
    Write-Host "📥 Installer gsutil:" -ForegroundColor Yellow
    Write-Host "1. Téléchargez Google Cloud SDK: https://cloud.google.com/sdk/docs/install" -ForegroundColor White
    Write-Host "2. Ou utilisez cette commande:" -ForegroundColor White
    Write-Host "   Invoke-WebRequest -Uri 'https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe' -OutFile 'gsdk.exe'" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "OU - Configurer CORS via la console:" -ForegroundColor Yellow
    Write-Host "1. Ouvrez: https://console.cloud.google.com/storage/browser?project=annonces-app-44d27" -ForegroundColor Cyan
    Write-Host "2. Cliquez sur le bucket 'annonces-app-44d27.appspot.com'" -ForegroundColor White
    Write-Host "3. Onglet 'Permissions' → 'CORS configuration'" -ForegroundColor White
    Write-Host "4. Cliquez sur 'Edit CORS configuration'" -ForegroundColor White
    Write-Host "5. Collez ce JSON:" -ForegroundColor White
    Write-Host ""
    $corsConfig = Get-Content -Path "fix-cors-storage.json" -Raw
    Write-Host $corsConfig -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "✅ gsutil trouvé !" -ForegroundColor Green
    Write-Host ""
    Write-Host "Exécution de la configuration CORS..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Commande à exécuter:" -ForegroundColor Cyan
    Write-Host "gsutil cors set fix-cors-storage.json gs://annonces-app-44d27.appspot.com" -ForegroundColor White
    Write-Host ""
}

Write-Host "📝 Fichier de configuration CORS: fix-cors-storage.json" -ForegroundColor Green

