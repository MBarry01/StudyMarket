# Script simple pour créer le fichier .env
Write-Host "Creation du fichier .env..." -ForegroundColor Green

$content = @"
# Configuration Email - StudyMarket
VITE_GMAIL_USER=votre.email@gmail.com
VITE_GMAIL_APP_PASSWORD=votre_mot_de_passe_application
VITE_USE_FIREBASE_EMULATORS=false
"@

$content | Out-File -FilePath ".env" -Encoding UTF8

Write-Host "Fichier .env cree avec succes!" -ForegroundColor Green
Write-Host "Maintenant, editez le fichier .env avec vos vraies informations Gmail" -ForegroundColor Yellow
