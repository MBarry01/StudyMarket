# Script PowerShell pour démarrer le serveur avec les variables d'environnement

Write-Host "🚀 Démarrage du serveur StudyMarket..." -ForegroundColor Green

# Vérifier si le fichier .env existe
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  Fichier .env non trouvé" -ForegroundColor Yellow
    Write-Host "📝 Créez un fichier .env avec les variables suivantes :" -ForegroundColor Cyan
    Write-Host "   STRIPE_SECRET_KEY=sk_test_..." -ForegroundColor White
    Write-Host "   STRIPE_WEBHOOK_SECRET=whsec_..." -ForegroundColor White
    Write-Host "   FIREBASE_SERVICE_ACCOUNT={\"project_id\":\"...\",\"client_email\":\"...\",\"private_key\":\"...\"}" -ForegroundColor White
    Write-Host "   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_..." -ForegroundColor White
    Write-Host ""
    Write-Host "📖 Consultez FIREBASE_SETUP.md pour plus de détails" -ForegroundColor Cyan
    Write-Host ""
}

# Charger les variables d'environnement et démarrer le serveur
if (Test-Path ".env") {
    Write-Host "✅ Variables d'environnement chargées depuis .env" -ForegroundColor Green
    Get-Content .env | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
} else {
    Write-Host "⚠️  Utilisation des valeurs par défaut (persistance Firebase désactivée)" -ForegroundColor Yellow
}

Write-Host "🌐 Serveur démarré sur http://localhost:3001" -ForegroundColor Green
Write-Host "📡 Endpoints disponibles :" -ForegroundColor Cyan
Write-Host "   POST /api/create-payment-intent" -ForegroundColor White
Write-Host "   POST /api/confirm-payment" -ForegroundColor White
Write-Host "   POST /api/webhook/stripe" -ForegroundColor White
Write-Host "   GET  /api/test" -ForegroundColor White
Write-Host ""

node server.js









