# Script PowerShell pour appliquer la configuration CORS à Firebase Storage
# Assurez-vous d'avoir gsutil installé et configuré

Write-Host "🔧 Application de la configuration CORS pour Firebase Storage..." -ForegroundColor Yellow

# Vérifier si gsutil est disponible
try {
    $gsutilVersion = gsutil version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ gsutil est disponible" -ForegroundColor Green
    } else {
        throw "gsutil non disponible"
    }
} catch {
    Write-Host "❌ gsutil n'est pas disponible. Veuillez l'installer via Google Cloud SDK." -ForegroundColor Red
    Write-Host "📖 Instructions: https://cloud.google.com/storage/docs/gsutil_install" -ForegroundColor Cyan
    exit 1
}

# Vérifier si le fichier cors.json existe
if (-not (Test-Path "cors.json")) {
    Write-Host "❌ Le fichier cors.json n'existe pas" -ForegroundColor Red
    exit 1
}

# Demander le nom du bucket Firebase Storage
$bucketName = Read-Host "Entrez le nom de votre bucket Firebase Storage (ex: annonces-app-44d27.appspot.com)"

if ([string]::IsNullOrWhiteSpace($bucketName)) {
    Write-Host "❌ Nom de bucket invalide" -ForegroundColor Red
    exit 1
}

Write-Host "🚀 Application de la configuration CORS au bucket: $bucketName" -ForegroundColor Blue

try {
    # Appliquer la configuration CORS
    gsutil cors set cors.json gs://$bucketName
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Configuration CORS appliquée avec succès!" -ForegroundColor Green
        Write-Host "🌐 Votre application peut maintenant uploader des fichiers depuis tous les ports configurés" -ForegroundColor Cyan
        
        # Vérifier la configuration actuelle
        Write-Host "📋 Configuration CORS actuelle:" -ForegroundColor Yellow
        gsutil cors get gs://$bucketName
    } else {
        Write-Host "❌ Erreur lors de l'application de la configuration CORS" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Erreur: $_" -ForegroundColor Red
    exit 1
}

Write-Host "🎉 Configuration terminée!" -ForegroundColor Green
