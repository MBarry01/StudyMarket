# Configuration complète Supabase pour StudyMarket
Write-Host "🚀 Configuration Supabase StudyMarket" -ForegroundColor Green
Write-Host ""

# Vérifier que le fichier .env existe
if (Test-Path ".env") {
    Write-Host "✅ Fichier .env trouvé" -ForegroundColor Green
} else {
    Write-Host "❌ Fichier .env manquant" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 Étapes de configuration Supabase :" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. 🌐 Ouvrir le Dashboard Supabase :" -ForegroundColor Yellow
Write-Host "   https://supabase.com/dashboard/project/kbbhglxrcywpcktkamhl" -ForegroundColor Cyan
Write-Host ""

Write-Host "2. 📊 Créer la table contact_messages :" -ForegroundColor Yellow
Write-Host "   - Aller dans SQL Editor" -ForegroundColor White
Write-Host "   - Exécuter le contenu de create-contact-table.sql" -ForegroundColor White
Write-Host ""

Write-Host "3. 🔧 Configurer les variables d'environnement :" -ForegroundColor Yellow
Write-Host "   - Aller dans Settings > Edge Functions" -ForegroundColor White
Write-Host "   - Ajouter les variables suivantes :" -ForegroundColor White
Write-Host ""
Write-Host "   Variable: GMAIL_USER" -ForegroundColor Green
Write-Host "   Valeur: barrymohamadou98@gmail.com" -ForegroundColor Green
Write-Host ""
Write-Host "   Variable: GMAIL_APP_PASSWORD" -ForegroundColor Green
Write-Host "   Valeur: nxyq gklz yluz pebv" -ForegroundColor Green
Write-Host ""
Write-Host "   Variable: CONTACT_EMAIL" -ForegroundColor Green
Write-Host "   Valeur: barrymohamadou98@gmail.com" -ForegroundColor Green
Write-Host ""

Write-Host "4. 🚀 Déployer la fonction Edge :" -ForegroundColor Yellow
Write-Host "   - Aller dans Edge Functions" -ForegroundColor White
Write-Host "   - Créer une nouvelle fonction nommée 'contact-email'" -ForegroundColor White
Write-Host "   - Copier le contenu de supabase/functions/send-contact-email/index.ts" -ForegroundColor White
Write-Host ""

Write-Host "5. 🧪 Tester la configuration :" -ForegroundColor Yellow
Write-Host "   - Redémarrer l'application : npm run dev" -ForegroundColor White
Write-Host "   - Tester le formulaire de contact dans le chatbot" -ForegroundColor White
Write-Host ""

Write-Host "📝 SQL à exécuter dans Supabase :" -ForegroundColor Cyan
Write-Host ""
Get-Content "create-contact-table.sql" | ForEach-Object { Write-Host "   $_" -ForegroundColor White }
Write-Host ""

Write-Host "🎯 Une fois terminé, votre chatbot fonctionnera avec Supabase !" -ForegroundColor Green
Write-Host ""
