# Script pour déployer toutes les règles de sécurité Firebase
# Nécessite Firebase CLI installé

Write-Host "🛡️ Déploiement des règles de sécurité Firebase..." -ForegroundColor Yellow

# Vérifier si Firebase CLI est installé
try {
    $firebaseVersion = firebase --version 2>$null
    if ($firebaseVersion) {
        Write-Host "✅ Firebase CLI détecté: $firebaseVersion" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Firebase CLI non trouvé. Veuillez l'installer:" -ForegroundColor Red
    Write-Host "npm install -g firebase-tools" -ForegroundColor Cyan
    Write-Host "firebase login" -ForegroundColor Cyan
    exit 1
}

# Vérifier la connexion Firebase
Write-Host "🔐 Vérification de la connexion Firebase..." -ForegroundColor Blue
try {
    $projects = firebase projects:list --json 2>$null | ConvertFrom-Json
    if ($projects) {
        Write-Host "✅ Connecté à Firebase" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Non connecté à Firebase. Veuillez vous connecter:" -ForegroundColor Red
    Write-Host "firebase login" -ForegroundColor Cyan
    exit 1
}

# Déployer les règles Firestore
Write-Host "🔥 Déploiement des règles Firestore..." -ForegroundColor Blue
if (Test-Path "firestore.rules") {
    try {
        firebase deploy --only firestore:rules
        Write-Host "✅ Règles Firestore déployées avec succès !" -ForegroundColor Green
    } catch {
        Write-Host "❌ Erreur lors du déploiement des règles Firestore" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Fichier firestore.rules non trouvé" -ForegroundColor Red
}

# Déployer les règles Storage
Write-Host "📁 Déploiement des règles Storage..." -ForegroundColor Blue
if (Test-Path "storage.rules") {
    try {
        firebase deploy --only storage
        Write-Host "✅ Règles Storage déployées avec succès !" -ForegroundColor Green
    } catch {
        Write-Host "❌ Erreur lors du déploiement des règles Storage" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Fichier storage.rules non trouvé" -ForegroundColor Red
}

# Déployer les index Firestore
Write-Host "📊 Déploiement des index Firestore..." -ForegroundColor Blue
if (Test-Path "firestore.indexes.json") {
    try {
        firebase deploy --only firestore:indexes
        Write-Host "✅ Index Firestore déployés avec succès !" -ForegroundColor Green
    } catch {
        Write-Host "❌ Erreur lors du déploiement des index" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Fichier firestore.indexes.json non trouvé" -ForegroundColor Red
}

Write-Host "`n🎉 Déploiement terminé !" -ForegroundColor Green
Write-Host "`n📋 Prochaines étapes:" -ForegroundColor Cyan
Write-Host "1. Testez l'upload de photos de profil" -ForegroundColor White
Write-Host "2. Vérifiez que les erreurs CORS ont disparu" -ForegroundColor White
Write-Host "3. Testez les requêtes Firestore avec les nouveaux index" -ForegroundColor White
Write-Host "4. Vérifiez que les règles de sécurité fonctionnent" -ForegroundColor White
