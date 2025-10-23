# Script de test des corrections déployées
# À exécuter après avoir déployé les corrections

Write-Host "🧪 Test des Corrections StudyMarket" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Variables de test
$firebaseProject = "annonces-app-44d27"
$testResults = @{
    Firebase = $false
    Supabase = $false
    Performance = $false
    Validation = $false
}

# Test 1: Vérifier Firebase CLI
Write-Host "`n📊 Test 1: Vérification Firebase CLI..." -ForegroundColor Yellow
try {
    $firebaseVersion = firebase --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Firebase CLI installé: $firebaseVersion" -ForegroundColor Green
        $testResults.Firebase = $true
    } else {
        Write-Host "❌ Firebase CLI non installé" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Firebase CLI non trouvé" -ForegroundColor Red
}

# Test 2: Vérifier la connexion Firebase
Write-Host "`n🔗 Test 2: Connexion Firebase..." -ForegroundColor Yellow
try {
    $firebaseProjects = firebase projects:list 2>$null
    if ($LASTEXITCODE -eq 0) {
        if ($firebaseProjects -match $firebaseProject) {
            Write-Host "✅ Projet Firebase trouvé: $firebaseProject" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Projet Firebase non trouvé: $firebaseProject" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Non connecté à Firebase" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erreur de connexion Firebase" -ForegroundColor Red
}

# Test 3: Vérifier les index Firebase
Write-Host "`n📋 Test 3: Vérification des index Firebase..." -ForegroundColor Yellow
try {
    $indexes = firebase firestore:indexes 2>$null
    if ($LASTEXITCODE -eq 0) {
        $requiredIndexes = @(
            "conversations",
            "messages", 
            "favorites",
            "orders"
        )
        
        $foundIndexes = 0
        foreach ($index in $requiredIndexes) {
            if ($indexes -match $index) {
                $foundIndexes++
                Write-Host "✅ Index trouvé: $index" -ForegroundColor Green
            } else {
                Write-Host "❌ Index manquant: $index" -ForegroundColor Red
            }
        }
        
        if ($foundIndexes -eq $requiredIndexes.Count) {
            Write-Host "✅ Tous les index sont présents" -ForegroundColor Green
        } else {
            Write-Host "⚠️ $foundIndexes/$($requiredIndexes.Count) index trouvés" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Impossible de récupérer les index" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erreur lors de la vérification des index" -ForegroundColor Red
}

# Test 4: Vérifier Supabase CLI
Write-Host "`n📧 Test 4: Vérification Supabase CLI..." -ForegroundColor Yellow
try {
    $supabaseVersion = supabase --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Supabase CLI installé: $supabaseVersion" -ForegroundColor Green
        $testResults.Supabase = $true
    } else {
        Write-Host "❌ Supabase CLI non installé" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Supabase CLI non trouvé" -ForegroundColor Red
}

# Test 5: Vérifier les fichiers de correction
Write-Host "`n📁 Test 5: Vérification des fichiers de correction..." -ForegroundColor Yellow
$requiredFiles = @(
    "src/lib/validations.ts",
    "firestore.indexes.json",
    "GUIDE-DEPLOIEMENT-CORRECTIONS.md"
)

$foundFiles = 0
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ Fichier trouvé: $file" -ForegroundColor Green
        $foundFiles++
    } else {
        Write-Host "❌ Fichier manquant: $file" -ForegroundColor Red
    }
}

if ($foundFiles -eq $requiredFiles.Count) {
    Write-Host "✅ Tous les fichiers de correction sont présents" -ForegroundColor Green
    $testResults.Validation = $true
} else {
    Write-Host "⚠️ $foundFiles/$($requiredFiles.Count) fichiers trouvés" -ForegroundColor Yellow
}

# Test 6: Vérifier les modifications des stores
Write-Host "`n⚡ Test 6: Vérification des stores modifiés..." -ForegroundColor Yellow
$storeFiles = @(
    "src/stores/useMessageStore.ts",
    "src/stores/useFavoritesStore.ts",
    "src/stores/useOrderStore.ts",
    "src/stores/useListingStore.ts"
)

$modifiedStores = 0
foreach ($store in $storeFiles) {
    if (Test-Path $store) {
        $content = Get-Content $store -Raw
        if ($content -match "orderBy" -and $content -match "limit") {
            Write-Host "✅ Store optimisé: $store" -ForegroundColor Green
            $modifiedStores++
        } else {
            Write-Host "❌ Store non optimisé: $store" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Store manquant: $store" -ForegroundColor Red
    }
}

if ($modifiedStores -eq $storeFiles.Count) {
    Write-Host "✅ Tous les stores sont optimisés" -ForegroundColor Green
    $testResults.Performance = $true
} else {
    Write-Host "⚠️ $modifiedStores/$($storeFiles.Count) stores optimisés" -ForegroundColor Yellow
}

# Résumé des tests
Write-Host "`n📊 RÉSUMÉ DES TESTS" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan

$passedTests = ($testResults.Values | Where-Object { $_ -eq $true }).Count
$totalTests = $testResults.Count

Write-Host "Tests passés: $passedTests/$totalTests" -ForegroundColor White

if ($testResults.Firebase) {
    Write-Host "✅ Firebase CLI: OK" -ForegroundColor Green
} else {
    Write-Host "❌ Firebase CLI: ÉCHEC" -ForegroundColor Red
}

if ($testResults.Supabase) {
    Write-Host "✅ Supabase CLI: OK" -ForegroundColor Green
} else {
    Write-Host "❌ Supabase CLI: ÉCHEC" -ForegroundColor Red
}

if ($testResults.Performance) {
    Write-Host "✅ Stores optimisés: OK" -ForegroundColor Green
} else {
    Write-Host "❌ Stores optimisés: ÉCHEC" -ForegroundColor Red
}

if ($testResults.Validation) {
    Write-Host "✅ Fichiers de correction: OK" -ForegroundColor Green
} else {
    Write-Host "❌ Fichiers de correction: ÉCHEC" -ForegroundColor Red
}

# Recommandations
Write-Host "`n🎯 RECOMMANDATIONS" -ForegroundColor Magenta
Write-Host "==================" -ForegroundColor Magenta

if ($passedTests -eq $totalTests) {
    Write-Host "🎉 Tous les tests sont passés !" -ForegroundColor Green
    Write-Host "Votre plateforme est prête pour le déploiement." -ForegroundColor Green
    Write-Host "`nProchaines étapes:" -ForegroundColor Yellow
    Write-Host "1. Déployer les index Firebase: firebase deploy --only firestore:indexes" -ForegroundColor White
    Write-Host "2. Configurer les variables d'environnement Supabase" -ForegroundColor White
    Write-Host "3. Déployer les fonctions Supabase: supabase functions deploy" -ForegroundColor White
} else {
    Write-Host "⚠️ Certains tests ont échoué." -ForegroundColor Yellow
    Write-Host "Consultez le guide d'installation: INSTALLATION-PREREQUIS.md" -ForegroundColor White
    Write-Host "Consultez le guide de déploiement: DEPLOIEMENT-MANUEL.md" -ForegroundColor White
}

Write-Host "`n📋 Fichiers de référence créés:" -ForegroundColor Cyan
Write-Host "- INSTALLATION-PREREQUIS.md" -ForegroundColor White
Write-Host "- DEPLOIEMENT-MANUEL.md" -ForegroundColor White
Write-Host "- test-corrections.html" -ForegroundColor White
Write-Host "- GUIDE-DEPLOIEMENT-CORRECTIONS.md" -ForegroundColor White

Write-Host "`nTest termine !" -ForegroundColor Green
