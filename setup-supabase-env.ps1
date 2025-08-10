# Configuration des variables d'environnement Supabase
Write-Host "Configuration Supabase - Variables d'environnement" -ForegroundColor Green
Write-Host ""

Write-Host "1. Allez sur https://supabase.com/dashboard/project/kbbhglxrcywpcktkamhl/settings/functions" -ForegroundColor Cyan
Write-Host ""

Write-Host "2. Dans la section 'Environment variables', ajoutez :" -ForegroundColor Yellow
Write-Host ""

Write-Host "   Variable: GMAIL_USER" -ForegroundColor White
Write-Host "   Valeur: barrymohamadou98@gmail.com" -ForegroundColor Green
Write-Host ""

Write-Host "   Variable: GMAIL_APP_PASSWORD" -ForegroundColor White
Write-Host "   Valeur: nxyq gklz yluz pebv" -ForegroundColor Green
Write-Host ""

Write-Host "   Variable: CONTACT_EMAIL" -ForegroundColor White
Write-Host "   Valeur: barrymohamadou98@gmail.com" -ForegroundColor Green
Write-Host ""

Write-Host "3. Pour creer la table, allez sur :" -ForegroundColor Yellow
Write-Host "   https://supabase.com/dashboard/project/kbbhglxrcywpcktkamhl/editor" -ForegroundColor Cyan
Write-Host ""

Write-Host "4. Executez le contenu du fichier create-contact-table.sql" -ForegroundColor Yellow
Write-Host ""

Write-Host "5. Pour deployer la fonction Edge manuellement :" -ForegroundColor Yellow
Write-Host "   - Allez sur https://supabase.com/dashboard/project/kbbhglxrcywpcktkamhl/functions" -ForegroundColor Cyan
Write-Host "   - Cliquez sur 'Create function'" -ForegroundColor White
Write-Host "   - Nom: contact-email" -ForegroundColor White
Write-Host "   - Copiez le contenu de supabase/functions/send-contact-email/index.ts" -ForegroundColor White
Write-Host ""

Write-Host "Configuration terminee !" -ForegroundColor Green
