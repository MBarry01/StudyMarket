# Script pour configurer Firebase Admin automatiquement

Write-Host "🔧 Configuration Firebase Admin pour StudyMarket" -ForegroundColor Cyan
Write-Host ""

# Vérifier si le fichier de clé existe
$serviceAccountPath = Read-Host "Entrez le chemin complet du fichier JSON de service Firebase (ou appuyez sur Entrée pour le chercher dans le dossier actuel)"

if ([string]::IsNullOrWhiteSpace($serviceAccountPath)) {
    $serviceAccountPath = Get-ChildItem -Path . -Filter "*firebase*adminsdk*.json" -File | Select-Object -First 1 -ExpandProperty FullName
}

if (-not $serviceAccountPath -or -not (Test-Path $serviceAccountPath)) {
    Write-Host "❌ Fichier de clé Firebase non trouvé" -ForegroundColor Red
    Write-Host ""
    Write-Host "📝 Étapes pour obtenir la clé :" -ForegroundColor Yellow
    Write-Host "1. Allez sur https://console.firebase.google.com/"
    Write-Host "2. Sélectionnez 'annonces-app-44d27'"
    Write-Host "3. Paramètres > Comptes de service"
    Write-Host "4. Cliquez sur 'Générer une nouvelle clé privée'"
    Write-Host "5. Téléchargez le fichier JSON et placez-le dans ce dossier"
    Write-Host "6. Relancez ce script"
    exit 1
}

Write-Host "✅ Fichier trouvé : $serviceAccountPath" -ForegroundColor Green

# Lire le contenu JSON
$jsonContent = Get-Content $serviceAccountPath -Raw | ConvertFrom-Json

# Créer le JSON en une seule ligne avec échappement
$jsonOneLine = @{
    "type" = $jsonContent.type
    "project_id" = $jsonContent.project_id
    "private_key_id" = $jsonContent.private_key_id
    "private_key" = $jsonContent.private_key
    "client_email" = $jsonContent.client_email
    "client_id" = $jsonContent.client_id
    "auth_uri" = $jsonContent.auth_uri
    "token_uri" = $jsonContent.token_uri
    "auth_provider_x509_cert_url" = $jsonContent.auth_provider_x509_cert_url
    "client_x509_cert_url" = $jsonContent.client_x509_cert_url
} | ConvertTo-Json -Compress

# Échapper les caractères spéciaux pour .env
$escapedJson = $jsonOneLine -replace '\\n', '\\n' -replace '"', '\"'

# Lire le .env actuel
$envContent = Get-Content .env -Raw

# Vérifier si FIREBASE_SERVICE_ACCOUNT existe déjà
if ($envContent -match 'FIREBASE_SERVICE_ACCOUNT=') {
    # Remplacer l'ancienne valeur
    $envContent = $envContent -replace 'FIREBASE_SERVICE_ACCOUNT=.*', "FIREBASE_SERVICE_ACCOUNT=$escapedJson"
    Write-Host "✅ FIREBASE_SERVICE_ACCOUNT mis à jour dans .env" -ForegroundColor Green
} else {
    # Ajouter la nouvelle valeur
    $envContent += "`n`n# Firebase Admin SDK (Service Account)`nFIREBASE_SERVICE_ACCOUNT=$escapedJson"
    Write-Host "✅ FIREBASE_SERVICE_ACCOUNT ajouté à .env" -ForegroundColor Green
}

# Sauvegarder le .env
Set-Content .env -Value $envContent -NoNewline

Write-Host ""
Write-Host "✅ Configuration terminée !" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Prochaines étapes :" -ForegroundColor Cyan
Write-Host "1. Arrêtez le serveur (Ctrl+C)"
Write-Host "2. Redémarrez-le : node server.js"
Write-Host "3. Vérifiez que vous voyez : '✅ Firebase Admin initialisé'"
Write-Host "4. Testez un paiement"
Write-Host "5. Vérifiez vos commandes dans la page 'Mes Commandes'"
Write-Host ""












