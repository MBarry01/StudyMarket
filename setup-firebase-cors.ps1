# Script pour configurer les règles CORS Firebase Storage
# Nécessite gsutil (Google Cloud SDK) installé

Write-Host "🔧 Configuration des règles CORS Firebase Storage..." -ForegroundColor Yellow

# Vérifier si gsutil est installé
try {
    $gsutilVersion = gsutil version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ gsutil trouvé: $gsutilVersion" -ForegroundColor Green
    } else {
        throw "gsutil non trouvé"
    }
} catch {
    Write-Host "❌ gsutil non trouvé. Veuillez installer Google Cloud SDK:" -ForegroundColor Red
    Write-Host "   https://cloud.google.com/sdk/docs/install" -ForegroundColor Cyan
    Write-Host "   Ou utilisez: winget install Google.CloudSDK" -ForegroundColor Cyan
    exit 1
}

# Nom du bucket Firebase (remplacez par votre bucket)
$bucketName = "annonces-app-44d27.appspot.com"

Write-Host "📦 Configuration CORS pour le bucket: $bucketName" -ForegroundColor Blue

# Appliquer les règles CORS
try {
    gsutil cors set cors.json gs://$bucketName
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Règles CORS configurées avec succès!" -ForegroundColor Green
        Write-Host "🔄 Redémarrez votre application pour tester l'upload" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Erreur lors de la configuration CORS" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erreur lors de la configuration CORS: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "📋 Vérification des règles CORS actuelles:" -ForegroundColor Blue
try {
    gsutil cors get gs://$bucketName
} catch {
    Write-Host "❌ Impossible de récupérer les règles CORS actuelles" -ForegroundColor Red
}
