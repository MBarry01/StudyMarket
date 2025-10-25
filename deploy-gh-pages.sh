#!/bin/bash

# Script de déploiement manuel sur gh-pages
# Ce script build le projet et le déploie sur la branche gh-pages

echo "🚀 Déploiement sur gh-pages..."

# Build du projet
echo "📦 Building..."
npm run build

# Créer la branche gh-pages si elle n'existe pas
git checkout --orphan gh-pages
git reset --hard

# Copier les fichiers de build
cp -r dist/* .

# Ajouter tous les fichiers
git add .

# Commit
git commit -m "Deploy to gh-pages"

# Pousser sur gh-pages
git push origin gh-pages --force

# Retourner sur main
git checkout main

echo "✅ Déploiement terminé sur gh-pages !"
echo "🌐 Votre site est disponible sur : https://mbarry01.github.io/StudyMarket/"
