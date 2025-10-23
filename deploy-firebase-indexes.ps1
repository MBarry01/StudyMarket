# Script PowerShell pour déployer les index Firebase
# Assurez-vous d'avoir Firebase CLI installé et d'être connecté

Write-Host "🚀 Déploiement des index Firebase..." -ForegroundColor Green

# Vérifier si Firebase CLI est installé
try {
    $firebaseVersion = firebase --version
    Write-Host "✅ Firebase CLI détecté: $firebaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Firebase CLI non trouvé. Installez-le avec: npm install -g firebase-tools" -ForegroundColor Red
    exit 1
}

# Vérifier si l'utilisateur est connecté
try {
    $currentUser = firebase projects:list 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Non connecté à Firebase. Connectez-vous avec: firebase login" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Connecté à Firebase" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur de connexion Firebase" -ForegroundColor Red
    exit 1
}

# Déployer les index
Write-Host "📊 Déploiement des index Firestore..." -ForegroundColor Yellow
firebase deploy --only firestore:indexes

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Index Firebase déployés avec succès!" -ForegroundColor Green
    Write-Host "📋 Index déployés:" -ForegroundColor Cyan
    Write-Host "  - conversations: participants (array-contains) + updatedAt (desc)" -ForegroundColor White
    Write-Host "  - messages: conversationId + sentAt (asc)" -ForegroundColor White
    Write-Host "  - favorites: userId + createdAt (desc)" -ForegroundColor White
    Write-Host "  - orders: userId + createdAt (desc)" -ForegroundColor White
    Write-Host "  - listings: sellerId + createdAt (desc)" -ForegroundColor White
    Write-Host "  - listings: category + status + createdAt (desc)" -ForegroundColor White
    Write-Host "  - listings: university + status + createdAt (desc)" -ForegroundColor White
    Write-Host "  - listings: status + createdAt (desc)" -ForegroundColor White
    Write-Host "  - listings: searchTerms (array-contains) + createdAt (desc)" -ForegroundColor White
    Write-Host "  - reviews: revieweeId + createdAt (desc)" -ForegroundColor White
    Write-Host "  - reviews: reviewerId + createdAt (desc)" -ForegroundColor White
    Write-Host "  - reviews: listingId + createdAt (desc)" -ForegroundColor White
} else {
    Write-Host "❌ Erreur lors du déploiement des index" -ForegroundColor Red
    exit 1
}

Write-Host "🎉 Déploiement terminé!" -ForegroundColor Green

