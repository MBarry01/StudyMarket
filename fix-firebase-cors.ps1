# Script pour résoudre les problèmes CORS Firebase Storage
# Nécessite gsutil installé ou Google Cloud Shell

Write-Host "🔧 Résolution des problèmes CORS Firebase Storage..." -ForegroundColor Yellow

# Vérifier si gsutil est installé
try {
    $gsutilVersion = gsutil version 2>$null
    if ($gsutilVersion) {
        Write-Host "✅ gsutil détecté: $gsutilVersion" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ gsutil non trouvé. Veuillez l'installer ou utiliser Google Cloud Shell" -ForegroundColor Red
    Write-Host "📖 Guide d'installation: https://cloud.google.com/storage/docs/gsutil_install" -ForegroundColor Cyan
    exit 1
}

# Configuration CORS pour Firebase Storage
$bucketName = "annonces-app-44d27.appspot.com"
$corsFile = "cors.json"

if (Test-Path $corsFile) {
    Write-Host "📁 Application de la configuration CORS..." -ForegroundColor Blue
    
    try {
        # Appliquer la configuration CORS
        gsutil cors set $corsFile gs://$bucketName
        
        Write-Host "✅ Configuration CORS appliquée avec succès !" -ForegroundColor Green
        Write-Host "🔄 Redémarrez votre application pour tester les uploads" -ForegroundColor Yellow
        
        # Vérifier la configuration
        Write-Host "🔍 Vérification de la configuration CORS..." -ForegroundColor Blue
        gsutil cors get gs://$bucketName
        
    } catch {
        Write-Host "❌ Erreur lors de l'application de la configuration CORS" -ForegroundColor Red
        Write-Host "💡 Vérifiez que vous avez les permissions nécessaires" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Fichier cors.json non trouvé" -ForegroundColor Red
    Write-Host "💡 Créez d'abord le fichier cors.json" -ForegroundColor Yellow
}

Write-Host "`n📋 Prochaines étapes:" -ForegroundColor Cyan
Write-Host "1. Redémarrez votre application React" -ForegroundColor White
Write-Host "2. Testez l'upload de photos de profil" -ForegroundColor White
Write-Host "3. Vérifiez que l'erreur CORS a disparu" -ForegroundColor White
