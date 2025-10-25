# Script PowerShell pour déploiement sur gh-pages

Write-Host "🚀 Déploiement sur gh-pages..." -ForegroundColor Green

# Build du projet
Write-Host "📦 Building..." -ForegroundColor Yellow
npm run build

# Créer la branche gh-pages si elle n'existe pas
Write-Host "🌿 Création branche gh-pages..." -ForegroundColor Yellow
git checkout --orphan gh-pages
git reset --hard

# Copier les fichiers de build
Write-Host "📁 Copie des fichiers..." -ForegroundColor Yellow
Copy-Item -Path "dist\*" -Destination "." -Recurse -Force

# Ajouter tous les fichiers
Write-Host "➕ Ajout des fichiers..." -ForegroundColor Yellow
git add .

# Commit
Write-Host "💾 Commit..." -ForegroundColor Yellow
git commit -m "Deploy to gh-pages"

# Pousser sur gh-pages
Write-Host "📤 Push vers gh-pages..." -ForegroundColor Yellow
git push origin gh-pages --force

# Retourner sur main
Write-Host "🔄 Retour sur main..." -ForegroundColor Yellow
git checkout main

Write-Host "✅ Déploiement terminé sur gh-pages !" -ForegroundColor Green
Write-Host "🌐 Votre site est disponible sur : https://mbarry01.github.io/StudyMarket/" -ForegroundColor Cyan
