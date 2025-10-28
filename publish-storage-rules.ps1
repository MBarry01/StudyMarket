# Publier les règles de sécurité Firebase Storage
Write-Host "📤 Publication des règles de sécurité Firebase Storage..." -ForegroundColor Cyan

# Lire le contenu du fichier storage.rules
$rulesContent = Get-Content -Path "storage.rules" -Raw

# Afficher le contenu pour vérification
Write-Host "`n✅ Règles corrigées pour l'upload d'images d'annonces" -ForegroundColor Green

# Instructions pour publication manuelle
Write-Host "`n📋 Pour publier ces règles manuellement:" -ForegroundColor Cyan
Write-Host "1. Ouvrez https://console.firebase.google.com/project/annonces-app-44d27/storage/rules" -ForegroundColor White
Write-Host "2. Copiez tout le contenu du fichier storage.rules" -ForegroundColor White
Write-Host "3. Collez-le dans la console Firebase" -ForegroundColor White
Write-Host "4. Cliquez sur 'Publier' pour appliquer les règles" -ForegroundColor White

Write-Host "`n🔧 Corrections apportées:" -ForegroundColor Yellow
Write-Host "   ✅ Structure changée: listings/{userId}/{fileName}" -ForegroundColor Green
Write-Host "   ✅ Vérification ownership simplifiée (userId match)" -ForegroundColor Green
Write-Host "   ✅ Taille maximale: 15MB" -ForegroundColor Green
Write-Host "   ✅ Format de fichier: image_ ou photo_ avec timestamp" -ForegroundColor Green

Write-Host "`n⚠️  IMPORTANT: Les anciennes règles bloquaient l'upload car elles vérifiaient" -ForegroundColor Red
Write-Host "    l'existence d'un document listing avant l'upload." -ForegroundColor Red
Write-Host "    Les nouvelles règles permettent l'upload dans /listings/{userId}/" -ForegroundColor Green

