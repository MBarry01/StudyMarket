# Publier les règles de sécurité Firebase Storage
Write-Host "📤 Publication des règles de sécurité Firebase Storage..." -ForegroundColor Cyan

# Lire le contenu du fichier storage.rules
$rulesContent = Get-Content -Path "storage.rules" -Raw

# Afficher le contenu pour vérification
Write-Host "`nContenu des règles:" -ForegroundColor Yellow
Write-Host $rulesContent
Write-Host "`n" -ForegroundColor Yellow

# Instructions pour publication manuelle
Write-Host "⚠️  Firebase CLI non configuré dans ce projet." -ForegroundColor Yellow
Write-Host "`n📋 Pour publier ces règles manuellement:" -ForegroundColor Cyan
Write-Host "1. Ouvrez https://console.firebase.google.com/project/annonces-app-44d27/storage/rules" -ForegroundColor White
Write-Host "2. Remplacez le contenu par celui ci-dessus" -ForegroundColor White
Write-Host "3. Cliquez sur 'Publier' pour appliquer les règles" -ForegroundColor White
Write-Host "`n✅ Les nouvelles règles autorisent l'upload d'images dans /messages/" -ForegroundColor Green

Write-Host "`n📌 Règles ajoutées pour /messages/:" -ForegroundColor Cyan
Write-Host "   - Lecture: Utilisateurs authentifiés" -ForegroundColor White
Write-Host "   - Upload: Utilisateurs authentifiés (images < 5MB)" -ForegroundColor White
Write-Host "   - Suppression: Utilisateurs authentifiés" -ForegroundColor White

