# Script de test simple des corrections
Write-Host "Test des Corrections StudyMarket" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Test des fichiers de correction
Write-Host "`nTest 1: Verification des fichiers de correction..." -ForegroundColor Yellow

$requiredFiles = @(
    "src/lib/validations.ts",
    "firestore.indexes.json",
    "GUIDE-DEPLOIEMENT-CORRECTIONS.md"
)

$foundFiles = 0
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "OK - Fichier trouve: $file" -ForegroundColor Green
        $foundFiles++
    } else {
        Write-Host "ERREUR - Fichier manquant: $file" -ForegroundColor Red
    }
}

# Test des stores modifies
Write-Host "`nTest 2: Verification des stores modifies..." -ForegroundColor Yellow

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
            Write-Host "OK - Store optimise: $store" -ForegroundColor Green
            $modifiedStores++
        } else {
            Write-Host "ERREUR - Store non optimise: $store" -ForegroundColor Red
        }
    } else {
        Write-Host "ERREUR - Store manquant: $store" -ForegroundColor Red
    }
}

# Resume
Write-Host "`nRESUME DES TESTS" -ForegroundColor Cyan
Write-Host "================" -ForegroundColor Cyan

Write-Host "Fichiers de correction: $foundFiles/$($requiredFiles.Count)" -ForegroundColor White
Write-Host "Stores optimises: $modifiedStores/$($storeFiles.Count)" -ForegroundColor White

if ($foundFiles -eq $requiredFiles.Count -and $modifiedStores -eq $storeFiles.Count) {
    Write-Host "`nSUCCES - Toutes les corrections sont appliquees !" -ForegroundColor Green
    Write-Host "Prochaines etapes:" -ForegroundColor Yellow
    Write-Host "1. Installer Node.js et Firebase CLI" -ForegroundColor White
    Write-Host "2. Deployer les index Firebase" -ForegroundColor White
    Write-Host "3. Configurer Supabase" -ForegroundColor White
} else {
    Write-Host "`nATTENTION - Certaines corrections sont manquantes" -ForegroundColor Yellow
    Write-Host "Consultez les guides de deploiement crees" -ForegroundColor White
}

Write-Host "`nFichiers de reference crees:" -ForegroundColor Cyan
Write-Host "- INSTALLATION-PREREQUIS.md" -ForegroundColor White
Write-Host "- DEPLOIEMENT-MANUEL.md" -ForegroundColor White
Write-Host "- test-corrections.html" -ForegroundColor White

Write-Host "`nTest termine !" -ForegroundColor Green

