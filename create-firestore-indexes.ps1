# Script pour créer les index Firestore manquants
# Nécessite Firebase CLI installé

Write-Host "🔥 Création des index Firestore manquants..." -ForegroundColor Yellow

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

# Créer le fichier firestore.indexes.json
$indexesContent = @"
{
  "indexes": [
    {
      "collectionGroup": "listings",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "sellerId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "reviews",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "revieweeId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "favorites",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "conversations",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "participants",
          "arrayConfig": "CONTAINS"
        },
        {
          "fieldPath": "updatedAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "orders",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
}
"@

# Écrire le fichier firestore.indexes.json
$indexesContent | Out-File -FilePath "firestore.indexes.json" -Encoding UTF8
Write-Host "✅ Fichier firestore.indexes.json créé" -ForegroundColor Green

# Déployer les index
Write-Host "🚀 Déploiement des index Firestore..." -ForegroundColor Blue
try {
    firebase deploy --only firestore:indexes
    Write-Host "✅ Index Firestore déployés avec succès !" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur lors du déploiement des index" -ForegroundColor Red
    Write-Host "💡 Vérifiez que vous êtes connecté à Firebase" -ForegroundColor Yellow
    Write-Host "firebase login" -ForegroundColor Cyan
}

Write-Host "`n📋 Index créés:" -ForegroundColor Cyan
Write-Host "• listings: sellerId (ASC) + createdAt (DESC)" -ForegroundColor White
Write-Host "• reviews: revieweeId (ASC) + createdAt (DESC)" -ForegroundColor White
Write-Host "• favorites: userId (ASC) + createdAt (DESC)" -ForegroundColor White
Write-Host "• conversations: participants (CONTAINS) + updatedAt (DESC)" -ForegroundColor White
Write-Host "• orders: userId (ASC) + createdAt (DESC)" -ForegroundColor White
